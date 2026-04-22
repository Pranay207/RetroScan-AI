import { useState, useEffect } from 'react';
import { generateTicketId, derivePriority, estimateCost, statusBg } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle, XCircle, MapPin, DollarSign } from 'lucide-react';

const ACTIONS = { sign: 'Replace', marking: 'Repaint', stud: 'Replace' };
const PRIORITY_STYLE = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
};

function generateTickets(detections) {
  return detections
    .filter(d => d.status !== 'COMPLIANT')
    .map(det => {
      const priority = derivePriority(det.status, det.score, det.type);
      const action = ACTIONS[det.type] || 'Inspect';
      return {
        id: generateTicketId(),
        objectId: det.id,
        label: det.label,
        type: det.type,
        location: det.location,
        score: det.score,
        status: det.status,
        priority,
        action,
        cost: estimateCost(det.type, action),
        resolved: false,
        timestamp: new Date().toISOString(),
      };
    })
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a.priority] - order[b.priority];
    });
}

function MockAlertBanner({ count }) {
  if (!count) return null;
  return (
    <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 animate-pulse-orange">
      <Bell size={20} className="flex-shrink-0" />
      <div>
        <p className="font-semibold">{count} Maintenance Alert{count > 1 ? 's' : ''} Generated</p>
        <p className="text-sm text-red-200">
          📧 Mock email sent to: maintenance@nhai.gov.in &nbsp;|&nbsp;
          📱 Mock SMS dispatched to field team
        </p>
      </div>
    </div>
  );
}

export default function TabAlerts({ detections }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    setTickets(generateTickets(detections));
  }, [detections]);

  const resolved = tickets.filter(t => t.resolved).length;
  const pending = tickets.filter(t => !t.resolved).length;
  const critical = tickets.filter(t => t.priority === 'CRITICAL' && !t.resolved).length;

  const resolve = (id) =>
    setTickets(prev => prev.map(t => t.id === id ? { ...t, resolved: true } : t));

  if (!detections.length) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Run analysis to generate maintenance alerts.</div>;
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <MockAlertBanner count={critical} />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tickets', value: tickets.length, color: 'text-foreground' },
          { label: 'Pending', value: pending, color: 'text-amber-600' },
          { label: 'Resolved', value: resolved, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border rounded-xl p-4 text-center">
            <p className={`font-rajdhani font-bold text-3xl ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
            <p className="font-semibold">All objects are compliant!</p>
            <p className="text-sm">No maintenance tickets required.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className={`bg-card border rounded-xl p-4 transition-all ${ticket.resolved ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{ticket.label}</p>
                    <Badge className={`${PRIORITY_STYLE[ticket.priority]} border text-xs`}>{ticket.priority}</Badge>
                    {ticket.resolved && <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">RESOLVED</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{ticket.id}</p>
                </div>
                {!ticket.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => resolve(ticket.id)}
                  >
                    <CheckCircle size={13} className="mr-1" /> Mark Resolved
                  </Button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Object ID</p>
                  <p className="font-mono font-semibold">{ticket.objectId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1"><MapPin size={10} /> Location</p>
                  <p className="font-semibold truncate">{ticket.location?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action Required</p>
                  <p className="font-semibold text-red-700">{ticket.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1"><DollarSign size={10} /> Est. Cost</p>
                  <p className="font-semibold">{ticket.cost}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Score: <strong>{ticket.score} mcd/lx/m²</strong> · Status: <strong>{ticket.status}</strong></span>
                <span>{new Date(ticket.timestamp).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}