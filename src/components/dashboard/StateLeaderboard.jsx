import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATES = [
  { state: 'Gujarat', pct: 89 },
  { state: 'Tamil Nadu', pct: 85 },
  { state: 'Maharashtra', pct: 81 },
  { state: 'Karnataka', pct: 76 },
  { state: 'Rajasthan', pct: 71 },
  { state: 'Andhra Pradesh', pct: 68 },
  { state: 'Punjab', pct: 64 },
  { state: 'Uttar Pradesh', pct: 52 },
  { state: 'Bihar', pct: 47 },
  { state: 'Madhya Pradesh', pct: 39 },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const COLOR = (pct) => pct >= 75 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';

export default function StateLeaderboard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="font-rajdhani font-bold text-xl text-[#1A1F2E] mb-1">State-wise Highway Safety Leaderboard</h2>
      <p className="text-xs text-muted-foreground mb-5">Based on retroreflectivity compliance %</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Bar Chart */}
        <div className="flex-1" style={{ minHeight: 280 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={STATES} layout="vertical" margin={{ left: 10, right: 40 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="state" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Compliance']} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                {STATES.map((s, i) => <Cell key={i} fill={COLOR(s.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rankings list */}
        <div className="w-full md:w-52 space-y-2">
          {STATES.map((s, i) => (
            <div key={s.state} className="flex items-center gap-2.5">
              <span className="text-sm w-6">{MEDALS[i] || `${i + 1}.`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{s.state}</p>
                <div className="w-full bg-gray-100 rounded-full h-1 mt-0.5">
                  <div className="h-1 rounded-full" style={{ width: `${s.pct}%`, backgroundColor: COLOR(s.pct) }} />
                </div>
              </div>
              <span className="text-xs font-bold" style={{ color: COLOR(s.pct) }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}