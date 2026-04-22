import { useState, useRef, useCallback } from 'react';
import { Camera, Zap, RefreshCw, Smartphone, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statusBg } from '@/lib/retroUtils';

const MOCK_REGIONS = [
  { id: 1, label: 'Speed Sign', x: 15, y: 12, w: 18, h: 22, score: 287, status: 'COMPLIANT' },
  { id: 2, label: 'Lane Line', x: 55, y: 65, w: 30, h: 8, score: 142, status: 'WARNING' },
  { id: 3, label: 'Road Stud', x: 72, y: 45, w: 8, h: 8, score: 89, status: 'NON-COMPLIANT' },
];

const STATUS_COLORS = { COMPLIANT: '#22C55E', WARNING: '#F59E0B', 'NON-COMPLIANT': '#EF4444' };

function PhoneFrame({ children }) {
  return (
    <div className="relative mx-auto w-64 bg-nhai-dark rounded-[2.5rem] p-2 shadow-2xl border-4 border-nhai-charcoal">
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-nhai-charcoal rounded-full z-10" />
      <div className="bg-black rounded-[2rem] overflow-hidden" style={{ height: 520 }}>
        {children}
      </div>
      {/* Home button */}
      <div className="w-10 h-10 rounded-full bg-nhai-charcoal mx-auto mt-2 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-white/30" />
      </div>
    </div>
  );
}

function LiveCameraOverlay({ regions, selected, onSelect, scanning }) {
  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Simulated camera feed */}
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"
        alt="Highway feed"
        className="w-full h-full object-cover opacity-80"
        style={{ filter: 'brightness(0.75)' }}
      />

      {/* Scanning animation */}
      {scanning && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-0.5 bg-nhai-orange/70 animate-[scanning_2s_ease-in-out_infinite]"
            style={{ animation: 'moveDown 2s linear infinite', top: '20%' }} />
        </div>
      )}

      {/* Live indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </div>

      {/* RetroScan label */}
      <div className="absolute top-3 right-3 bg-black/60 text-nhai-orange text-[10px] font-bold px-2 py-1 rounded-full font-rajdhani">
        RetroScan AI
      </div>

      {/* Detection overlays */}
      {regions.map(r => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id === selected?.id ? null : r)}
          className="absolute cursor-pointer transition-all hover:scale-105"
          style={{
            left: `${r.x}%`, top: `${r.y}%`,
            width: `${r.w}%`, height: `${r.h}%`,
            border: `2px solid ${STATUS_COLORS[r.status]}`,
            backgroundColor: STATUS_COLORS[r.status] + '22',
          }}
        >
          {/* Score label */}
          <div className="absolute -top-5 left-0 text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: STATUS_COLORS[r.status], color: '#fff' }}>
            {r.label} · {r.score}
          </div>
          {/* Corner dots */}
          <div className="absolute top-0 left-0 w-2 h-2 rounded-tl" style={{ borderTop: `2px solid ${STATUS_COLORS[r.status]}`, borderLeft: `2px solid ${STATUS_COLORS[r.status]}` }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-br" style={{ borderBottom: `2px solid ${STATUS_COLORS[r.status]}`, borderRight: `2px solid ${STATUS_COLORS[r.status]}` }} />
        </button>
      ))}

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2">
        <div className="grid grid-cols-3 gap-1 text-center">
          {regions.map(r => (
            <div key={r.id} className="flex items-center gap-1 justify-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] }} />
              <span className="text-[9px] text-white/80 font-mono">{r.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TabMobileDemo() {
  const [selected, setSelected] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [captured, setCaptured] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleCapture = () => {
    setScanning(false);
    setCaptured(true);
    setTimeout(() => setShowResult(true), 600);
  };

  const handleReset = () => {
    setScanning(true);
    setCaptured(false);
    setShowResult(false);
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="bg-gradient-to-r from-slate-800 to-nhai-dark rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone size={20} className="text-nhai-orange" />
          <h3 className="font-rajdhani font-bold text-lg">Mobile App Demo</h3>
        </div>
        <p className="text-slate-300 text-sm">
          Simulated React Native mobile camera interface with live retroreflectivity detection overlays.
          In production, this connects to the Flask REST API backend.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Phone */}
        <div>
          <PhoneFrame>
            {!showResult ? (
              <div className="relative h-full flex flex-col">
                <LiveCameraOverlay regions={MOCK_REGIONS} selected={selected} onSelect={setSelected} scanning={scanning} />
                {/* Capture button */}
                <div className="absolute bottom-14 inset-x-0 flex justify-center">
                  <button
                    onClick={handleCapture}
                    className="w-14 h-14 rounded-full bg-white border-4 border-nhai-orange shadow-xl flex items-center justify-center hover:scale-105 transition-all"
                  >
                    <Camera size={22} className="text-nhai-charcoal" />
                  </button>
                </div>
                <div className="absolute bottom-6 inset-x-0 text-center text-white/50 text-[9px]">
                  Tap a region or capture to analyze
                </div>
              </div>
            ) : (
              /* Results Screen */
              <div className="h-full bg-nhai-dark overflow-y-auto p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 nhai-gradient rounded-full flex items-center justify-center">
                    <Zap size={12} className="text-white" />
                  </div>
                  <span className="text-nhai-orange font-rajdhani font-bold text-sm">Scan Results</span>
                </div>
                {MOCK_REGIONS.map(r => (
                  <div key={r.id} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-semibold">{r.label}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full`} style={{ backgroundColor: STATUS_COLORS[r.status] + '33', color: STATUS_COLORS[r.status] }}>
                        {r.status}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, r.score / 4)}%`, backgroundColor: STATUS_COLORS[r.status] }} />
                    </div>
                    <p className="text-white/50 text-[10px] mt-1">{r.score} mcd/lx/m²</p>
                    <p className="text-white/40 text-[10px]">
                      {r.status === 'COMPLIANT' ? 'No action needed' : r.status === 'WARNING' ? 'Schedule maintenance' : 'Immediate replacement'}
                    </p>
                  </div>
                ))}
                <button
                  onClick={handleReset}
                  className="w-full mt-3 py-2 nhai-gradient rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} /> Scan Again
                </button>
              </div>
            )}
          </PhoneFrame>
          <p className="text-center text-xs text-muted-foreground mt-3">Tap the shutter to capture & analyze</p>
        </div>

        {/* API Reference */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3">Flask REST API Endpoints</h4>
            <div className="space-y-2 font-mono text-xs">
              {[
                { method: 'POST', path: '/analyze', desc: 'Image → scores JSON' },
                { method: 'GET', path: '/alerts', desc: 'Pending maintenance tickets' },
                { method: 'GET', path: '/map', desc: 'GPS compliance heat map data' },
                { method: 'POST', path: '/compare', desc: 'Before/after image comparison' },
                { method: 'GET', path: '/predict', desc: 'Deterioration predictions' },
              ].map(e => (
                <div key={e.path} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${e.method === 'POST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{e.method}</span>
                  <span className="text-muted-foreground">{e.path}</span>
                  <span className="text-muted-foreground/50 text-[10px]">— {e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <h4 className="font-semibold text-sm mb-3">Sample API Response</h4>
            <pre className="bg-muted rounded-lg p-3 text-[10px] text-muted-foreground overflow-x-auto">
{`{
  "status": "success",
  "detections": [
    {
      "id": "OBJ-001",
      "label": "Speed Sign",
      "type": "sign",
      "score": 287,
      "status": "COMPLIANT",
      "location": {
        "lat": 28.7041,
        "lng": 77.1025
      },
      "irc_standard": "IRC 67"
    }
  ],
  "safety_score": 74,
  "timestamp": "2024-01-15T14:30:00Z"
}`}
            </pre>
          </div>

          {/* Selected region detail */}
          {selected && (
            <div className="bg-card border-2 rounded-xl p-4 animate-slide-in" style={{ borderColor: STATUS_COLORS[selected.status] }}>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                {selected.status === 'COMPLIANT' ? <CheckCircle size={14} className="text-green-500" /> :
                  selected.status === 'WARNING' ? <AlertTriangle size={14} className="text-amber-500" /> :
                  <XCircle size={14} className="text-red-500" />}
                {selected.label} — Tap Detail
              </h4>
              <p className="text-2xl font-rajdhani font-bold" style={{ color: STATUS_COLORS[selected.status] }}>
                {selected.score} mcd/lx/m²
              </p>
              <Badge className={`${statusBg(selected.status)} border text-xs mt-1`}>{selected.status}</Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}