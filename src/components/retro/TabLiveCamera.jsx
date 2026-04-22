import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Zap, Flashlight, ZapOff, RefreshCw, ScanLine, AlertTriangle, CheckCircle2, XCircle, Moon } from 'lucide-react';
import { intensityToRetro, classifyCompliance } from '@/lib/retroUtils';

function extractFrameBrightness(canvas, ctx, video) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let total = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return total / pixels;
}

export default function TabLiveCamera({ onCaptureAnalyze }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const frozenCanvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [liveScore, setLiveScore] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveBrightness, setLiveBrightness] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [frozenDataUrl, setFrozenDataUrl] = useState(null);
  const [frozenResults, setFrozenResults] = useState(null);
  const [autoNightEnabled, setAutoNightEnabled] = useState(false);
  const [autoNoStreetEnabled, setAutoNoStreetEnabled] = useState(false);
  const [lowLightBanner, setLowLightBanner] = useState(false);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};
      setTorchSupported(!!capabilities.torch);
      setCameraActive(true);
      startAnalysisLoop();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera in browser settings.');
      } else {
        setCameraError('Could not access camera: ' + err.message);
      }
    }
  };

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setTorchOn(false);
    setFrozen(false);
    setFrozenDataUrl(null);
    setFrozenResults(null);
    setLiveScore(null);
    setLiveStatus(null);
    setLowLightBanner(false);
  }, []);

  const startAnalysisLoop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || frozen) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      const brightness = extractFrameBrightness(canvas, ctx, video);
      setLiveBrightness(Math.round(brightness));

      // Compute score (use 'sign' type as default for live scan)
      const score = intensityToRetro(brightness, 'sign', {});
      const status = classifyCompliance(score, 'sign');
      setLiveScore(score);
      setLiveStatus(status);

      // Auto condition detection
      if (brightness < 50) {
        setAutoNightEnabled(true);
        setAutoNoStreetEnabled(true);
        setLowLightBanner(true);
      } else if (brightness < 80) {
        setAutoNightEnabled(true);
        setAutoNoStreetEnabled(false);
        setLowLightBanner(true);
      } else {
        setAutoNightEnabled(false);
        setAutoNoStreetEnabled(false);
        setLowLightBanner(false);
      }
    }, 500);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(prev => !prev);
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setFrozenDataUrl(dataUrl);
    setFrozen(true);
    clearInterval(intervalRef.current);

    // Run full analysis on frozen frame
    const brightness = liveBrightness ?? 128;
    const conditions = {
      night: autoNightEnabled,
      wet: false,
      foggy: false,
      noStreetlight: autoNoStreetEnabled,
    };

    const types = ['sign', 'marking', 'stud'];
    const labels = ['Road Sign (Detected)', 'Lane Marking (Detected)', 'Road Stud (Detected)'];
    const results = types.map((type, i) => {
      const score = intensityToRetro(brightness, type, conditions);
      const status = classifyCompliance(score, type);
      return { type, label: labels[i], score, status };
    });
    setFrozenResults(results);
    frozenCanvasRef.current = dataUrl;
  };

  const scanAgain = () => {
    setFrozen(false);
    setFrozenDataUrl(null);
    setFrozenResults(null);
    startAnalysisLoop();
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const borderColor = liveStatus === 'COMPLIANT'
    ? 'border-green-500 shadow-green-500/30'
    : liveStatus === 'WARNING'
    ? 'border-yellow-500 shadow-yellow-500/30'
    : liveStatus === 'NON-COMPLIANT'
    ? 'border-red-500 shadow-red-500/30'
    : 'border-white/20';

  const scoreColor = liveStatus === 'COMPLIANT' ? 'text-green-400'
    : liveStatus === 'WARNING' ? 'text-yellow-400'
    : liveStatus === 'NON-COMPLIANT' ? 'text-red-400'
    : 'text-white';

  const statusIcon = liveStatus === 'COMPLIANT' ? <CheckCircle2 size={14} className="text-green-400" />
    : liveStatus === 'WARNING' ? <AlertTriangle size={14} className="text-yellow-400" />
    : liveStatus === 'NON-COMPLIANT' ? <XCircle size={14} className="text-red-400" />
    : null;

  return (
    <div className="space-y-4 animate-slide-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2">
            <ScanLine size={20} className="text-nhai-orange" /> Live Camera Scanner
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time retroreflectivity analysis via device camera</p>
        </div>
        <div className="flex gap-2">
          {!cameraActive ? (
            <Button onClick={startCamera} className="nhai-gradient text-white gap-2">
              <Camera size={15} /> Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="gap-2 border-red-300 text-red-500 hover:bg-red-50">
              <CameraOff size={15} /> Stop Camera
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-red-700 text-sm">{cameraError}</p>
        </div>
      )}

      {/* Low light banner */}
      {lowLightBanner && cameraActive && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Moon size={15} className="text-amber-600" />
          <p className="text-amber-800 text-xs font-medium">
            Low light detected — Night mode enabled automatically
            {autoNoStreetEnabled && ' · No streetlight mode active'}
          </p>
        </div>
      )}

      {/* Video feed */}
      {cameraActive && !frozen && (
        <div className="relative">
          <div className={`rounded-2xl overflow-hidden border-4 shadow-lg transition-all duration-300 ${borderColor}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-xl"
              style={{ minHeight: 240, background: '#000' }}
            />
            {/* Live score overlay */}
            {liveScore !== null && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur rounded-xl px-3 py-2 text-right">
                <p className={`font-rajdhani font-bold text-2xl leading-none ${scoreColor}`}>{liveScore}</p>
                <p className="text-white/60 text-[10px]">mcd/lx/m²</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {statusIcon}
                  <span className={`text-xs font-bold ${scoreColor}`}>{liveStatus}</span>
                </div>
              </div>
            )}
            {/* Brightness indicator */}
            {liveBrightness !== null && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur rounded-lg px-2.5 py-1.5">
                <p className="text-white/70 text-[10px]">Brightness</p>
                <p className="text-white font-mono text-sm font-bold">{liveBrightness}</p>
              </div>
            )}
          </div>
          {/* Controls below video */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {torchSupported && (
              <Button
                onClick={toggleTorch}
                variant="outline"
                size="sm"
                className={`gap-2 ${torchOn ? 'bg-amber-100 border-amber-400 text-amber-700' : ''}`}
              >
                {torchOn ? <Zap size={14} /> : <ZapOff size={14} />}
                {torchOn ? 'Torch On' : 'Torch Off'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Frozen frame */}
      {frozen && frozenDataUrl && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border-4 border-nhai-orange shadow-lg shadow-nhai-orange/20">
            <img src={frozenDataUrl} alt="Captured frame" className="w-full" />
          </div>
          {frozenResults && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Full Analysis — Frozen Frame</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {frozenResults.map((r) => (
                  <div key={r.type} className={`rounded-xl border p-3 ${
                    r.status === 'COMPLIANT' ? 'bg-green-50 border-green-200' :
                    r.status === 'WARNING' ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className="text-xs font-semibold text-foreground">{r.label}</p>
                    <p className="font-mono font-bold text-lg mt-1">{r.score} <span className="text-xs font-normal text-muted-foreground">mcd/lx/m²</span></p>
                    <Badge className={`text-[10px] mt-1 ${
                      r.status === 'COMPLIANT' ? 'bg-green-100 text-green-800 border-green-300' :
                      r.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-red-100 text-red-800 border-red-300'
                    }`}>{r.status}</Badge>
                  </div>
                ))}
              </div>
              {autoNightEnabled && (
                <div className="bg-slate-50 border rounded-xl px-3 py-2 text-xs text-muted-foreground">
                  <strong>Conditions Applied:</strong> {autoNightEnabled ? 'Night Mode' : ''} {autoNoStreetEnabled ? '· No Streetlight' : ''}
                </div>
              )}
            </div>
          )}
          <Button onClick={scanAgain} className="w-full nhai-gradient text-white gap-2">
            <RefreshCw size={15} /> Scan Again
          </Button>
        </div>
      )}

      {/* Hidden canvas for analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      {cameraActive && !frozen && (
        <Button
          onClick={captureAndAnalyze}
          className="w-full nhai-gradient text-white font-bold py-6 text-base rounded-2xl shadow-xl shadow-nhai-orange/30 gap-2"
        >
          <Camera size={20} /> Capture &amp; Analyze
        </Button>
      )}

      {/* Placeholder when camera not started */}
      {!cameraActive && !cameraError && (
        <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Camera size={48} className="opacity-20" />
          <p className="text-sm text-center">Click "Start Camera" to begin live scanning.<br />Use rear camera for best results.</p>
        </div>
      )}
    </div>
  );
}