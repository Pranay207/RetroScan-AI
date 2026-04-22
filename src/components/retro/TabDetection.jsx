import { useRef, useEffect } from 'react';
import { statusColor, statusBg, IRC_THRESHOLDS } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

function StatusIcon({ status }) {
  if (status === 'COMPLIANT') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'WARNING') return <AlertTriangle size={14} className="text-amber-500" />;
  return <XCircle size={14} className="text-red-500" />;
}

function AnnotatedCanvas({ detections, imageUrl }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      detections.forEach((det) => {
        const { bbox, status, label, score } = det;
        const color = statusColor(status);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
        ctx.fillStyle = color + 'CC';
        ctx.fillRect(bbox.x, bbox.y - 22, bbox.w, 22);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`${label} — ${score}`, bbox.x + 4, bbox.y - 6);
      });
    };
    img.src = imageUrl;
  }, [detections, imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-border"
      style={{ maxHeight: 340, objectFit: 'contain' }}
    />
  );
}

export default function TabDetection({ detections, imageUrl, safetyScore, conditions }) {
  if (!detections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Eye size={40} className="opacity-30" />
        <p className="text-sm">Upload an image and click Run Analysis to begin detection.</p>
      </div>
    );
  }

  const compliant = detections.filter(d => d.status === 'COMPLIANT').length;
  const warning = detections.filter(d => d.status === 'WARNING').length;
  const nonCompliant = detections.filter(d => d.status === 'NON-COMPLIANT').length;

  const scoreColor = safetyScore >= 75 ? 'text-green-500' : safetyScore >= 50 ? 'text-amber-500' : 'text-red-500';
  const scoreRing = safetyScore >= 75 ? 'border-green-400' : safetyScore >= 50 ? 'border-amber-400' : 'border-red-400';

  const activeConditions = Object.entries(conditions).filter(([, v]) => v).map(([k]) => ({
    night: 'Night', wet: 'Wet Road', foggy: 'Foggy', noStreetlight: 'No Light'
  }[k]));

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Safety Score Ring */}
        <div className={`col-span-2 md:col-span-1 flex flex-col items-center justify-center bg-card border-2 ${scoreRing} rounded-2xl p-5`}>
          <span className={`font-rajdhani font-bold text-5xl ${scoreColor}`}>{safetyScore}</span>
          <span className="text-muted-foreground text-xs mt-1 uppercase tracking-wide">Safety Score</span>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3">
            <div className={`h-1.5 rounded-full transition-all`} style={{ width: `${safetyScore}%`, backgroundColor: scoreColor.replace('text-', '') === 'green-500' ? '#22c55e' : scoreColor === 'text-amber-500' ? '#f59e0b' : '#ef4444' }} />
          </div>
        </div>

        {[
          { label: 'Compliant', count: compliant, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Warning', count: warning, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Non-Compliant', count: nonCompliant, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`flex flex-col items-center justify-center border rounded-2xl p-4 ${bg}`}>
            <span className={`font-rajdhani font-bold text-4xl ${color}`}>{count}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</span>
          </div>
        ))}
      </div>

      {/* Active Conditions */}
      {activeConditions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active conditions:</span>
          {activeConditions.map(c => (
            <Badge key={c} variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">{c}</Badge>
          ))}
        </div>
      )}

      {/* Annotated Image */}
      {imageUrl && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wide">Annotated Output</h3>
          <AnnotatedCanvas detections={detections} imageUrl={imageUrl} />
        </div>
      )}

      {/* Detection Table */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">Detection Summary</h3>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['ID', 'Label', 'Type', 'Intensity', 'Score (mcd/lx/m²)', 'Status', 'Recommendation'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detections.map((det, i) => {
                const threshold = IRC_THRESHOLDS[det.type];
                const rec = det.status === 'COMPLIANT' ? 'Routine inspection' :
                  det.status === 'WARNING' ? 'Plan maintenance' : 'Immediate action';
                return (
                  <tr key={det.id} className={`border-t ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-accent/30 transition-colors`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{det.id}</td>
                    <td className="px-4 py-3 font-medium">{det.label}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{det.type}</td>
                    <td className="px-4 py-3 font-mono">{det.intensity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 max-w-20">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${Math.min(100, (det.score / (threshold?.medium * 1.5 || 450)) * 100)}%`,
                            backgroundColor: statusColor(det.status)
                          }} />
                        </div>
                        <span className="font-mono font-semibold">{det.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusBg(det.status)} border text-xs flex items-center gap-1 w-fit`}>
                        <StatusIcon status={det.status} />
                        {det.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{rec}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50 text-center">
        Scores evaluated against IRC 67 (Road Signs) & IRC 35 (Pavement Markings) standards
      </p>
    </div>
  );
}