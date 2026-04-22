import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { generateDeteriorationTimeline, predictDeteriorationMonths, IRC_THRESHOLDS, statusColor } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Wrench } from 'lucide-react';

export default function TabDeterioration({ detections }) {
  if (!detections.length) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Run analysis to see deterioration predictions.</div>;
  }

  // Priority queue sorted by months until non-compliant
  const predictions = detections.map(det => {
    const months = predictDeteriorationMonths(det.score, det.type, det.age, det.material);
    return { ...det, monthsLeft: months };
  }).sort((a, b) => a.monthsLeft - b.monthsLeft);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Priority Queue */}
      <div>
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Clock size={14} /> Maintenance Priority Queue
        </h3>
        <div className="space-y-3">
          {predictions.map((det, idx) => {
            const urgency = det.monthsLeft <= 3 ? 'CRITICAL' : det.monthsLeft <= 6 ? 'HIGH' : det.monthsLeft <= 12 ? 'MEDIUM' : 'LOW';
            const urgencyStyle = {
              CRITICAL: 'bg-red-100 text-red-800 border-red-300',
              HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
              MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
              LOW: 'bg-green-100 text-green-800 border-green-300',
            }[urgency];

            return (
              <div key={det.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center font-bold text-sm text-muted-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{det.label}</p>
                    <Badge className={`${urgencyStyle} border text-xs`}>{urgency}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Material: {det.material} · Age: {det.age} yrs · Score: {det.score} mcd/lx/m²
                  </p>
                  <p className="text-xs mt-1">
                    {det.monthsLeft === 0
                      ? '🚨 Already below compliance threshold — immediate action required'
                      : `📅 Estimated ${det.monthsLeft} months until non-compliant`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-rajdhani font-bold text-2xl" style={{ color: statusColor(det.status) }}>
                    {det.monthsLeft}
                  </p>
                  <p className="text-[10px] text-muted-foreground">months</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deterioration Timeline Charts */}
      <div>
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Wrench size={14} /> Deterioration Timeline (24 months)
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {predictions.slice(0, 4).map(det => {
            const timeline = generateDeteriorationTimeline(det.score, det.type, det.material, 24);
            const threshold = IRC_THRESHOLDS[det.type]?.low || 150;
            return (
              <div key={det.id} className="bg-card border rounded-xl p-4">
                <p className="font-semibold text-xs mb-1">{det.label}</p>
                <p className="text-[10px] text-muted-foreground mb-3">{det.material}</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={timeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      formatter={(v) => [`${v} mcd/lx/m²`, 'Score']}
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    />
                    <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Min IRC', fontSize: 9, fill: '#EF4444' }} />
                    <Line type="monotone" dataKey="score" stroke={statusColor(det.status)} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maintenance Schedule */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h4 className="font-semibold text-sm text-amber-800 mb-2 flex items-center gap-2">
          <AlertTriangle size={14} /> Recommended Maintenance Schedule
        </h4>
        <div className="grid md:grid-cols-3 gap-3">
          {['Next 30 days', 'Next 3 months', 'Next 6–12 months'].map((period, i) => {
            const filtered = predictions.filter(d => i === 0 ? d.monthsLeft <= 1 : i === 1 ? d.monthsLeft <= 3 : d.monthsLeft <= 12 && d.monthsLeft > 3);
            return (
              <div key={period} className={`rounded-lg p-3 ${i === 0 ? 'bg-red-100' : i === 1 ? 'bg-orange-100' : 'bg-amber-100'}`}>
                <p className="text-xs font-bold mb-1">{period}</p>
                {filtered.length === 0
                  ? <p className="text-xs text-muted-foreground">No action required</p>
                  : filtered.map(d => <p key={d.id} className="text-xs">• {d.label}</p>)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}