import { useState, useRef, useEffect } from 'react';

const ALERTS = [
  { id: 1, type: 'critical', highway: 'NH-27', msg: 'MP stretch: 14 signs below threshold', time: '2 hours ago' },
  { id: 2, type: 'critical', highway: 'NH-48', msg: 'Bengaluru: 8 signs need immediate replacement', time: '5 hours ago' },
  { id: 3, type: 'warning', highway: 'NH-44', msg: 'Nagpur: retroreflectivity declining 23% this month', time: '1 day ago' },
  { id: 4, type: 'warning', highway: 'NH-52', msg: 'Assam: fog damage detected on 12 road studs', time: '1 day ago' },
  { id: 5, type: 'resolved', highway: 'NH-8', msg: 'Jaipur stretch: maintenance completed, score improved 58→84', time: '2 days ago' },
  { id: 6, type: 'resolved', highway: 'NH-16', msg: 'Vizag: 45 signs replaced, now Grade B', time: '3 days ago' },
  { id: 7, type: 'critical', highway: 'NH-58', msg: 'Uttarakhand: winter damage, 31 markings faded', time: '3 days ago' },
];

const TYPE_STYLES = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '🔴 CRITICAL', badge: 'bg-red-100 text-red-700' },
  warning: { dot: 'bg-yellow-400', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: '🟡 WARNING', badge: 'bg-yellow-100 text-yellow-700' },
  resolved: { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '🟢 RESOLVED', badge: 'bg-green-100 text-green-700' },
};

export default function AlertFeed() {
  const [filter, setFilter] = useState('all');
  const feedRef = useRef();

  const filtered = ALERTS.filter(a => filter === 'all' || a.type === filter);

  // Auto-scroll
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    let direction = 1;
    const interval = setInterval(() => {
      el.scrollTop += direction * 0.6;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) direction = -1;
      if (el.scrollTop <= 0) direction = 1;
    }, 40);
    return () => clearInterval(interval);
  }, [filtered.length]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-rajdhani font-bold text-lg text-[#1A1F2E]">Live Alert Feed</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time highway safety notifications</p>
      </div>

      {/* Filters */}
      <div className="px-5 py-2.5 border-b border-gray-50 flex gap-1.5">
        {['all', 'critical', 'warning', 'resolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full font-semibold capitalize transition-all ${
              filter === f ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5" style={{ maxHeight: 340 }}>
        {filtered.map(alert => {
          const s = TYPE_STYLES[alert.type];
          return (
            <div key={alert.id} className={`${s.bg} border rounded-xl p-3 cursor-pointer hover:shadow-sm transition-shadow`}>
              <div className="flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot} animate-pulse`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold ${s.text}`}>{s.label}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.badge}`}>{alert.highway}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{alert.msg}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}