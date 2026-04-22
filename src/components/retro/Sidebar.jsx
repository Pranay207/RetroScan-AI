import { useRef, useState } from 'react';
import { Upload, Zap, Moon, Droplets, Wind, Lightbulb, Play, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RetroScanLogo from '@/components/branding/RetroScanLogo';

export default function Sidebar({ onAnalyze, analyzing }) {
  const fileRef = useRef();
  const file2Ref = useRef();
  const [file, setFile] = useState(null);
  const [file2, setFile2] = useState(null);
  const [mode, setMode] = useState('standard');
  const [speed, setSpeed] = useState(80);
  const [conditions, setConditions] = useState({
    night: false,
    wet: false,
    foggy: false,
    noStreetlight: false,
  });
  const [demoMode, setDemoMode] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCondition = (key) => {
    setConditions((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const handleFile = (event) => {
    const nextFile = event.target.files[0];
    if (nextFile) {
      setFile(nextFile);
      setDemoMode(false);
    }
  };

  const handleFile2 = (event) => {
    const nextFile = event.target.files[0];
    if (nextFile) setFile2(nextFile);
  };

  const handleAnalyze = () => {
    onAnalyze({ file, file2, mode, speed, conditions, demoMode });
    setMobileOpen(false);
  };

  const modeOptions = [
    { id: 'standard', label: 'Standard', ModeIcon: Zap },
    { id: 'speed', label: 'Speed-Aware', ModeIcon: Play },
    { id: 'temporal', label: 'Before/After', ModeIcon: RefreshCw },
  ];

  const panelContent = (
    <div className="flex-1 space-y-5 p-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Input Image</p>
        <div
          className="group cursor-pointer rounded-xl border-2 border-dashed border-white/20 p-4 text-center transition-all hover:border-nhai-orange/60"
          onClick={() => fileRef.current.click()}
        >
          <Upload size={20} className="mx-auto mb-1 text-white/30 transition-colors group-hover:text-nhai-orange" />
          <p className="text-xs text-white/50">
            {file ? (
              <span className="font-medium text-green-400">{file.name}</span>
            ) : (
              <span>Click to upload<br /><span className="text-white/30">JPG, PNG, MP4</span></span>
            )}
          </p>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        {demoMode && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-nhai-orange/30 bg-nhai-orange/10 px-3 py-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-nhai-orange" />
            <span className="text-xs font-medium text-nhai-orange">Demo Mode · Sample Highway</span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Analysis Mode</p>
        <div className="space-y-1">
          {modeOptions.map(({ id, label, ModeIcon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === id ? 'bg-nhai-orange text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ModeIcon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'temporal' && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Comparison Image (New)</p>
          <div
            className="group cursor-pointer rounded-xl border-2 border-dashed border-white/20 p-3 text-center transition-all hover:border-nhai-orange/60"
            onClick={() => file2Ref.current.click()}
          >
            <Upload size={16} className="mx-auto mb-1 text-white/30 transition-colors group-hover:text-nhai-orange" />
            <p className="text-xs text-white/50">
              {file2 ? <span className="font-medium text-green-400">{file2.name}</span> : 'Upload newer image'}
            </p>
          </div>
          <input ref={file2Ref} type="file" accept="image/*" className="hidden" onChange={handleFile2} />
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">Condition Simulation</p>
        <div className="space-y-2">
          {[
            { key: 'night', label: 'Night Mode', CondIcon: Moon },
            { key: 'wet', label: 'Wet Road', CondIcon: Droplets },
            { key: 'foggy', label: 'Foggy Weather', CondIcon: Wind },
            { key: 'noStreetlight', label: 'No Streetlight', CondIcon: Lightbulb },
          ].map(({ key, label, CondIcon }) => (
            <div key={key} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <CondIcon size={13} className={conditions[key] ? 'text-nhai-orange' : 'text-white/30'} />
                <span className="text-xs text-white/70">{label}</span>
              </div>
              <Switch
                checked={conditions[key]}
                onCheckedChange={() => toggleCondition(key)}
                className="scale-75 data-[state=checked]:bg-nhai-orange"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Vehicle Speed</p>
          <Badge className="border-nhai-orange/30 bg-nhai-orange/20 text-xs font-bold text-nhai-orange">{speed} km/h</Badge>
        </div>
        <Slider
          min={40}
          max={120}
          step={10}
          value={[speed]}
          onValueChange={([value]) => setSpeed(value)}
          className="[&_[role=slider]]:border-nhai-orange [&_[role=slider]]:bg-nhai-orange"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>40</span>
          <span>80</span>
          <span>120</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden min-h-screen w-72 flex-col overflow-y-auto border-r border-white/10 bg-nhai-dark scrollbar-thin md:flex">
        <div className="border-b border-white/10 p-5">
          <div className="mb-1 flex items-center gap-3">
            <RetroScanLogo className="h-11 w-11" />
            <div>
              <h1 className="font-rajdhani text-xl font-bold leading-tight text-white">RetroScan AI</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">NHAI Measurement Tool</p>
            </div>
          </div>
        </div>

        {panelContent}

        <div className="border-t border-white/10 p-4">
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="glow-orange w-full rounded-xl py-5 font-semibold text-white shadow-lg transition-all hover:opacity-90 nhai-gradient"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap size={16} /> Run Analysis
              </span>
            )}
          </Button>
          <p className="mt-2 text-center text-[10px] text-white/20">IRC 67 & IRC 35 Standards</p>
        </div>
      </aside>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-nhai-dark md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <RetroScanLogo className="h-8 w-8" compact />
            <span className="font-rajdhani text-base font-bold text-white">RetroScan AI</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              size="sm"
              className="rounded-lg px-4 font-semibold text-white shadow-lg nhai-gradient"
            >
              {analyzing ? <RefreshCw size={14} className="animate-spin" /> : <><Zap size={14} className="mr-1" />Run</>}
            </Button>
            <button onClick={() => setMobileOpen((previous) => !previous)} className="p-2 text-white/60 hover:text-white">
              {mobileOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="overflow-y-auto border-t border-white/10 bg-nhai-dark" style={{ maxHeight: '60vh' }}>
            {panelContent}
          </div>
        )}
      </div>

      <div className="h-16 md:hidden" />
    </>
  );
}
