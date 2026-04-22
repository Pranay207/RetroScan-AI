import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import { STATE_SCOREBOARD, statusBg } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import L from 'leaflet';

const STATUS_COLORS = {
  COMPLIANT: '#22C55E',
  WARNING: '#F59E0B',
  'NON-COMPLIANT': '#EF4444',
};

// Blue pulsing marker icon
const bluePulseIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:28px;height:28px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:ping 1.5s ease infinite"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 8px rgba(59,130,246,0.8)"></div>
    </div>
    <style>@keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2.2);opacity:0}}</style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12, { animate: true });
  }, [center, map]);
  return null;
}

export default function TabGPSMap({ detections, gpsCoords, gpsLoading, onRelocate }) {
  const mapDetections = detections.filter(d => d.location);
  const hasGPS = !!gpsCoords;
  const mapCenter = gpsCoords
    ? [gpsCoords.lat, gpsCoords.lng]
    : [22.5, 78.5];
  const mapZoom = gpsCoords ? 12 : 5;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <MapPin size={14} /> Live Highway Compliance Map
            </h3>
            <Button
              onClick={onRelocate}
              disabled={gpsLoading}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {gpsLoading
                ? <><Loader2 size={13} className="animate-spin" /> Locating…</>
                : <><LocateFixed size={13} /> Relocate</>
              }
            </Button>
          </div>

          <div className="rounded-2xl overflow-hidden border" style={{ height: 420 }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {gpsCoords && <RecenterMap center={[gpsCoords.lat, gpsCoords.lng]} />}
              {/* User GPS marker */}
              {gpsCoords && (
                <Marker position={[gpsCoords.lat, gpsCoords.lng]} icon={bluePulseIcon}>
                  <Popup>
                    <div className="text-xs space-y-1 min-w-36">
                      <p className="font-bold text-sm text-blue-600">📍 Your Scan Location</p>
                      <p className="font-mono">{gpsCoords.lat.toFixed(5)}° N, {gpsCoords.lng.toFixed(5)}° E</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {mapDetections.map((det) => (
                <CircleMarker
                  key={det.id}
                  center={[det.location.lat + (Math.random() - 0.5) * 0.2, det.location.lng + (Math.random() - 0.5) * 0.2]}
                  radius={12}
                  fillColor={STATUS_COLORS[det.status]}
                  color={STATUS_COLORS[det.status]}
                  fillOpacity={0.85}
                  weight={2}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-40">
                      <p className="font-bold text-sm">{det.label}</p>
                      <p>📍 {det.location.name}</p>
                      <p>🛣️ {det.location.highway}</p>
                      <p>📊 Score: <strong>{det.score} mcd/lx/m²</strong></p>
                      <p>🕐 {new Date(det.timestamp).toLocaleDateString('en-IN')}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        det.status === 'COMPLIANT' ? 'bg-green-100 text-green-800' :
                        det.status === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>{det.status}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* GPS coords display */}
          {gpsCoords && (
            <p className="text-xs text-muted-foreground mt-2 font-mono flex items-center gap-1.5">
              <LocateFixed size={11} className="text-blue-500" />
              Scan Location: {gpsCoords.lat.toFixed(4)}° N, {gpsCoords.lng.toFixed(4)}° E
            </p>
          )}

          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              Your Location
            </div>
            {[['COMPLIANT', '#22C55E'], ['WARNING', '#F59E0B'], ['NON-COMPLIANT', '#EF4444']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* National Scoreboard */}
        <div className="bg-card border rounded-2xl p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
            <Trophy size={14} className="text-amber-500" /> National Scoreboard
          </h3>
          <div className="space-y-2.5">
            {STATE_SCOREBOARD.map((row, i) => (
              <div key={row.state} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{row.state}</p>
                  <p className="text-[10px] text-muted-foreground">{row.highway}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: row.compliance >= 80 ? '#22C55E' : row.compliance >= 65 ? '#F59E0B' : '#EF4444' }}>
                    {row.compliance}%
                  </p>
                  <div className="w-16 bg-muted rounded-full h-1 mt-0.5">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${row.compliance}%`,
                        backgroundColor: row.compliance >= 80 ? '#22C55E' : row.compliance >= 65 ? '#F59E0B' : '#EF4444'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Highway stretch summary */}
      <div>
        <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-muted-foreground">Detection Points Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mapDetections.map(det => (
            <div key={det.id} className={`rounded-xl border p-3 ${
              det.status === 'COMPLIANT' ? 'bg-green-50 border-green-200' :
              det.status === 'WARNING' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs font-semibold truncate">{det.label}</p>
              <p className="text-[10px] text-muted-foreground">{det.location.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{det.location.highway}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs font-bold">{det.score}</span>
                <Badge className={`${statusBg(det.status)} border text-[10px] py-0`}>{det.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}