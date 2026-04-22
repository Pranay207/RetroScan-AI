import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, ExternalLink } from 'lucide-react';

const HIGHWAYS = [
  { id: 'NH-27', route: 'East-West Corridor', length: 3507, score: 41, grade: 'F', trend: 'down', signs_ok: 31, critical: 22, last_inspection: '2024-01-10', action: 'Emergency replacement required for 22 signs. Immediate inspection needed.' },
  { id: 'NH-52', route: 'Assam Corridor', length: 2317, score: 45, grade: 'D', trend: 'down', signs_ok: 42, critical: 18, last_inspection: '2024-01-15', action: 'Fog-resistant sign replacement and road stud repair required.' },
  { id: 'NH-58', route: 'Delhi→Mana', length: 538, score: 55, grade: 'D', trend: 'down', signs_ok: 48, critical: 14, last_inspection: '2024-01-18', action: 'Winter damage repair. Faded markings must be repainted before summer.' },
  { id: 'NH-48', route: 'Delhi→Chennai', length: 2807, score: 58, grade: 'D', trend: 'down', signs_ok: 51, critical: 11, last_inspection: '2024-01-20', action: 'Sign replacement in Bengaluru and Pune stretches. Priority: High.' },
  { id: 'NH-30', route: 'UP Corridor', length: 1028, score: 63, grade: 'C', trend: 'flat', signs_ok: 59, critical: 8, last_inspection: '2024-01-22', action: 'Scheduled maintenance. Monitor deterioration trend monthly.' },
  { id: 'NH-44', route: 'Delhi→Kanyakumari', length: 3745, score: 72, grade: 'C', trend: 'down', signs_ok: 67, critical: 6, last_inspection: '2024-01-25', action: 'Nagpur and Hyderabad stretches need retroreflective tape replacement.' },
  { id: 'NH-19', route: 'Delhi→Kolkata', length: 1435, score: 76, grade: 'C', trend: 'flat', signs_ok: 73, critical: 4, last_inspection: '2024-01-28', action: 'Maintain current standards. Schedule next inspection in 3 months.' },
  { id: 'NH-8', route: 'Delhi→Mumbai', length: 1428, score: 84, grade: 'B', trend: 'up', signs_ok: 81, critical: 2, last_inspection: '2024-02-01', action: 'Good compliance. Minor touch-up required in Jaipur bypass.' },
  { id: 'NH-16', route: 'Kolkata→Chennai', length: 1711, score: 88, grade: 'B', trend: 'up', signs_ok: 86, critical: 1, last_inspection: '2024-02-03', action: 'Excellent condition. Maintain quarterly inspection schedule.' },
  { id: 'NH-66', route: 'Mumbai→Kanyakumari', length: 2442, score: 91, grade: 'A', trend: 'up', signs_ok: 92, critical: 0, last_inspection: '2024-02-05', action: 'Model highway. No immediate action required. Schedule next review in 6 months.' },
];

const GRADE_COLORS = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-orange-100 text-orange-800 border-orange-300',
  F: 'bg-red-100 text-red-800 border-red-300',
};

const SCORE_COLOR = (s) => s >= 80 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

export default function HighwayTable() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filtered = HIGHWAYS.filter(h =>
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.route.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-rajdhani font-bold text-xl text-[#1A1F2E]">Highway Report Cards</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Sorted by worst safety score first · {HIGHWAYS.length} National Highways</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search highway or route…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-gray-50"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Highway</th>
              <th className="px-4 py-3 text-left">Route</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Length</th>
              <th className="px-4 py-3 text-left">Safety Score</th>
              <th className="px-4 py-3 text-center">Grade</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Signs OK</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Critical</th>
              <th className="px-4 py-3 text-center">Trend</th>
              <th className="px-4 py-3 text-center">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <>
                <tr
                  key={h.id}
                  className="border-t border-gray-50 hover:bg-orange-50/40 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                >
                  <td className="px-4 py-3 font-bold text-[#FF6B00] font-rajdhani text-base">{h.id}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{h.route}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{h.length.toLocaleString()} km</td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${h.score}%`, backgroundColor: SCORE_COLOR(h.score) }} />
                      </div>
                      <span className="font-bold text-xs w-7 text-right" style={{ color: SCORE_COLOR(h.score) }}>{h.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`${GRADE_COLORS[h.grade]} border text-xs font-bold px-2.5 py-1 rounded-full`}>{h.grade}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-semibold text-xs hidden md:table-cell">{h.signs_ok}%</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {h.critical > 0
                      ? <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded-full">{h.critical}</span>
                      : <span className="text-green-600 text-xs">None</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {h.trend === 'up' && <TrendingUp size={16} className="text-green-500 mx-auto" />}
                    {h.trend === 'down' && <TrendingDown size={16} className="text-red-500 mx-auto" />}
                    {h.trend === 'flat' && <Minus size={16} className="text-yellow-500 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-[#FF6B00] hover:bg-orange-50 rounded-lg px-2 py-1 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors">
                      <ExternalLink size={11} />
                      {expanded === h.id ? 'Close' : 'View'}
                    </button>
                  </td>
                </tr>
                {expanded === h.id && (
                  <tr key={`${h.id}-exp`} className="bg-orange-50/60 border-t border-orange-100">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Compliance Breakdown</p>
                          <div className="space-y-1.5">
                            <ProgressRow label="Compliant" pct={h.signs_ok} color="bg-green-500" />
                            <ProgressRow label="Warning" pct={Math.min(100 - h.signs_ok, 20)} color="bg-yellow-500" />
                            <ProgressRow label="Critical" pct={Math.floor((h.critical / 20) * 100)} color="bg-red-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Inspection Info</p>
                          <p className="text-xs text-gray-600">Last Inspection: <strong>{h.last_inspection}</strong></p>
                          <p className="text-xs text-gray-600 mt-1">Highway Length: <strong>{h.length.toLocaleString()} km</strong></p>
                          <p className="text-xs text-gray-600 mt-1">Safety Grade: <strong>{h.grade}</strong></p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Action</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{h.action}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressRow({ label, pct, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{pct}%</span>
    </div>
  );
}