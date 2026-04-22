import { speedToMinRetro, estimateVisibilityDistance, statusColor, statusBg } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { Gauge, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TabSpeedAware({ detections, speed }) {
  if (!detections.length) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Run analysis to see speed-aware results.</div>;
  }

  const minRetro = speedToMinRetro(speed);

  const evaluated = detections.map(det => {
    const ircStatus = det.status;
    const speedFail = det.score < minRetro && ircStatus !== 'NON-COMPLIANT';
    const speedStatus = det.score >= minRetro ? 'SPEED-SAFE' : speedFail ? 'IRC OK / SPEED UNSAFE' : 'NON-COMPLIANT';
    const visibility = estimateVisibilityDistance(det.score);
    return { ...det, speedFail, speedStatus, visibility, minRetro };
  });

  const speedUnsafe = evaluated.filter(d => d.speedFail).length;
  const safe = evaluated.filter(d => d.speedStatus === 'SPEED-SAFE').length;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Speed Banner */}
      <div className="nhai-gradient rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gauge size={20} />
              <span className="font-rajdhani font-bold text-xl">Speed-Aware Analysis</span>
            </div>
            <p className="text-orange-100 text-sm">Re-evaluating detections against speed-based visibility thresholds</p>
          </div>
          <div className="text-right">
            <p className="font-rajdhani font-bold text-5xl">{speed}</p>
            <p className="text-orange-200 text-xs">km/h</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="font-bold text-xl">{minRetro}</p>
            <p className="text-orange-200 text-xs">Min. Required (mcd/lx/m²)</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="font-bold text-xl">{safe}</p>
            <p className="text-orange-200 text-xs">Speed-Safe Objects</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="font-bold text-xl">{speedUnsafe}</p>
            <p className="text-orange-200 text-xs">IRC OK but Speed-Unsafe</p>
          </div>
        </div>
      </div>

      {/* Speed threshold reference */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">IRC Speed-Based Minimum Thresholds</h3>
        <div className="flex gap-3 flex-wrap">
          {[40, 60, 80, 100, 120].map(s => (
            <div key={s} className={`rounded-lg px-3 py-2 text-center flex-1 min-w-14 border ${s === speed ? 'nhai-gradient text-white border-transparent' : 'bg-muted border-border'}`}>
              <p className="font-bold text-sm">{s}</p>
              <p className={`text-[10px] ${s === speed ? 'text-orange-100' : 'text-muted-foreground'}`}>km/h</p>
              <p className="font-semibold text-xs mt-0.5">{({ 40: 100, 60: 150, 80: 200, 100: 250, 120: 300 }[s])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Object Evaluation */}
      <div className="space-y-3">
        {evaluated.map(det => (
          <div key={det.id} className={`bg-card border rounded-xl p-4 ${det.speedFail ? 'border-orange-300 bg-orange-50' : det.status === 'NON-COMPLIANT' ? 'border-red-300 bg-red-50' : 'border-green-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{det.label}</p>
                  <Badge className={`border text-xs ${
                    det.speedStatus === 'SPEED-SAFE' ? 'bg-green-100 text-green-800 border-green-300' :
                    det.speedStatus === 'IRC OK / SPEED UNSAFE' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>{det.speedStatus}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: <strong>{det.score} mcd/lx/m²</strong> · Required at {speed} km/h: <strong>{minRetro} mcd/lx/m²</strong>
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <Eye size={12} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Driver visibility distance: <strong>{det.visibility} m</strong></span>
                  {det.visibility < 80 && <span className="text-red-600 font-semibold">⚠️ Insufficient at {speed} km/h</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="w-16 bg-muted rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (det.score / (minRetro * 1.5)) * 100)}%`,
                      backgroundColor: statusColor(det.speedFail ? 'WARNING' : det.status)
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round((det.score / minRetro) * 100)}% of req.</p>
              </div>
            </div>

            {det.speedFail && (
              <div className="mt-3 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
                <AlertTriangle size={12} />
                <strong>IRC Compliant but UNSAFE at {speed} km/h</strong> — Recommend replacement with higher-grade sheeting
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}