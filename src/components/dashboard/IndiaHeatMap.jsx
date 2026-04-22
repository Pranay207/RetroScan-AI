import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';

const HIGHWAYS_MAP = [
  {
    id: 'NH-44', score: 72, grade: 'C', critical: 6, lastScan: '25 Jan 2024',
    positions: [[28.7041, 77.1025], [26.8467, 80.9462], [23.1765, 79.9454], [17.3850, 78.4867], [12.9716, 77.5946], [11.0168, 76.9558], [8.0883, 77.5385]],
    color: '#F59E0B',
  },
  {
    id: 'NH-48', score: 58, grade: 'D', critical: 11, lastScan: '20 Jan 2024',
    positions: [[28.7041, 77.1025], [26.9124, 75.7873], [23.0225, 72.5714], [15.3173, 75.7139], [12.9716, 77.5946], [13.0827, 80.2707]],
    color: '#EF4444',
  },
  {
    id: 'NH-8', score: 84, grade: 'B', critical: 2, lastScan: '01 Feb 2024',
    positions: [[28.7041, 77.1025], [26.9124, 75.7873], [25.2138, 75.8648], [22.7196, 75.8577], [21.1458, 72.7818], [19.0760, 72.8777]],
    color: '#22C55E',
  },
  {
    id: 'NH-19', score: 76, grade: 'C', critical: 4, lastScan: '28 Jan 2024',
    positions: [[28.7041, 77.1025], [27.1767, 78.0081], [25.4358, 81.8463], [25.5941, 85.1376], [22.5726, 88.3639]],
    color: '#F59E0B',
  },
  {
    id: 'NH-27', score: 41, grade: 'F', critical: 22, lastScan: '10 Jan 2024',
    positions: [[26.8467, 80.9462], [25.5941, 85.1376], [25.6163, 85.1453], [26.1197, 91.7086], [27.0844, 93.6153]],
    color: '#EF4444',
  },
  {
    id: 'NH-16', score: 88, grade: 'B', critical: 1, lastScan: '03 Feb 2024',
    positions: [[22.5726, 88.3639], [20.2961, 85.8245], [17.6868, 83.2185], [14.4426, 79.9865], [13.0827, 80.2707]],
    color: '#22C55E',
  },
  {
    id: 'NH-66', score: 91, grade: 'A', critical: 0, lastScan: '05 Feb 2024',
    positions: [[19.0760, 72.8777], [17.3850, 78.4867], [15.2993, 74.1240], [12.9141, 74.8560], [11.2588, 75.7804], [10.0889, 76.9589], [8.5241, 76.9366]],
    color: '#22C55E',
  },
];

const SCORE_COLOR = (s) => s >= 80 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

export default function IndiaHeatMap() {
  const [active, setActive] = useState(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-rajdhani font-bold text-xl text-[#1A1F2E]">India Highway Safety Heat Map</h2>
        <p className="text-muted-foreground text-xs mt-0.5">Click any highway for details · Color indicates compliance score</p>
      </div>
      <div style={{ height: 480 }}>
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {HIGHWAYS_MAP.map(h => (
            <Polyline
              key={h.id}
              positions={h.positions}
              pathOptions={{ color: h.color, weight: 5, opacity: 0.85 }}
              eventHandlers={{ click: () => setActive(h.id === active ? null : h.id) }}
            >
              <Popup>
                <div className="min-w-44 text-xs space-y-1">
                  <p className="font-bold text-sm text-[#FF6B00]">{h.id}</p>
                  <p>Score: <strong style={{ color: SCORE_COLOR(h.score) }}>{h.score}/100</strong></p>
                  <p>Grade: <strong>{h.grade}</strong></p>
                  <p>Critical Alerts: <strong className="text-red-600">{h.critical}</strong></p>
                  <p>Last Scanned: <strong>{h.lastScan}</strong></p>
                </div>
              </Popup>
            </Polyline>
          ))}
        </MapContainer>
      </div>
      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4">
        {[['#22C55E', 'Safe (Score > 75)'], ['#F59E0B', 'Warning (Score 50–75)'], ['#EF4444', 'Critical (Score < 50)']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}