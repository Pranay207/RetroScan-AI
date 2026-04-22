import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { statusColor } from '@/lib/retroUtils';

const COLORS = { COMPLIANT: '#22C55E', WARNING: '#F59E0B', 'NON-COMPLIANT': '#EF4444' };

export default function TabAnalytics({ detections, safetyScore }) {
  if (!detections.length) {
    return <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Run analysis to see analytics.</div>;
  }

  const barData = detections.map(d => ({
    name: d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label,
    Score: d.score,
    status: d.status,
    fill: statusColor(d.status),
  }));

  const pieData = ['COMPLIANT', 'WARNING', 'NON-COMPLIANT'].map(s => ({
    name: s,
    value: detections.filter(d => d.status === s).length,
  })).filter(d => d.value > 0);

  const scoreColor = safetyScore >= 75 ? '#22C55E' : safetyScore >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Overall Score Banner */}
      <div className="rounded-2xl p-6 text-white text-center" style={{ background: `linear-gradient(135deg, ${scoreColor}22, ${scoreColor}44)`, border: `1px solid ${scoreColor}55` }}>
        <div className="font-rajdhani font-bold text-6xl" style={{ color: scoreColor }}>{safetyScore}</div>
        <div className="text-muted-foreground font-semibold mt-1">Overall Highway Safety Score / 100</div>
        <div className="mt-3 text-sm text-muted-foreground">
          {safetyScore >= 75 ? '✅ Highway stretch meets safety standards' :
            safetyScore >= 50 ? '⚠️ Highway stretch requires scheduled maintenance' :
              '🚨 Critical — Immediate intervention required'}
        </div>
        <div className="w-full bg-muted/30 rounded-full h-2 mt-4">
          <div className="h-2 rounded-full transition-all" style={{ width: `${safetyScore}%`, backgroundColor: scoreColor }} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Retroreflectivity Scores per Object</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(val, name, { payload }) => [`${val} mcd/lx/m²`, payload.name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="Score" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Compliance Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div>
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Maintenance Recommendations</h3>
        <div className="space-y-3">
          {detections.map(det => (
            <div key={det.id} className={`rounded-xl border p-4 ${
              det.status === 'COMPLIANT' ? 'bg-green-50 border-green-200' :
              det.status === 'WARNING' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{det.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Score: <strong>{det.score} mcd/lx/m²</strong> · IRC Standard: {det.type === 'sign' ? 'IRC 67' : 'IRC 35'}
                  </p>
                </div>
              </div>
              <p className="text-sm mt-2">
                {det.status === 'COMPLIANT' ? '✅ No immediate action required. Schedule routine inspection in 6 months.' :
                  det.status === 'WARNING' ? '⚠️ Plan maintenance within 3 months. Consider cleaning or partial repainting.' :
                  det.type === 'sign' ? '🚨 Replace retroreflective sheeting immediately. Below IRC 67 minimum threshold.' :
                  det.type === 'marking' ? '🚨 Repaint pavement markings immediately. Below IRC 35 minimum threshold.' :
                  '🚨 Replace road stud reflectors immediately. Safety hazard at night.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}