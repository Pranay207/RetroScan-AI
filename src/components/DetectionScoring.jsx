import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Gauge, Loader2, Search, ShieldCheck, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SPEED_THRESHOLDS,
  STATUS_COLORS,
  analyzeCanvasImage,
  buildAnalysisFromDetectedObjects,
  drawAnnotatedDetections,
} from '@/lib/retroCanvasAnalysis';
import { requestYoloDetections } from '@/lib/yoloClient';

const SPEED_OPTIONS = [40, 60, 80, 100, 120];

const badgeClasses = {
  COMPLIANT: 'bg-green-100 text-green-700 border-green-200',
  WARNING: 'bg-amber-100 text-amber-700 border-amber-200',
  'NON-COMPLIANT': 'bg-red-100 text-red-700 border-red-200',
  SAFE: 'bg-green-100 text-green-700 border-green-200',
  UNSAFE: 'bg-red-100 text-red-700 border-red-200',
};

const gradeDescriptions = {
  A: 'Excellent night-time visibility',
  B: 'Good performance with limited risk',
  C: 'Moderate performance, monitor closely',
  D: 'Poor visibility, corrective action needed',
  F: 'Unsafe highway reflectivity condition',
};

function StatusBadge({ children, status, className = '' }) {
  return (
    <Badge className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badgeClasses[status] || 'bg-slate-100 text-slate-700 border-slate-200'} ${className}`}>
      {children}
    </Badge>
  );
}

function CircularGauge({ score, grade, compliantCount, totalCount }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="#FDE7D8" strokeWidth="14" />
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#FF6B00"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-[#FF6B00]">{score}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Grade {grade}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900">{compliantCount} of {totalCount} objects compliant</p>
          <p className="text-sm text-slate-500">{gradeDescriptions[grade]}</p>
        </div>
      </div>
    </div>
  );
}

export default function DetectionScoring() {
  const annotatedCanvasRef = useRef(null);
  const focusCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [speed, setSpeed] = useState(80);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('client');

  const speedThreshold = SPEED_THRESHOLDS[speed];

  const validateImageFile = (file) =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const aspectRatio = image.height / Math.max(1, image.width);
        URL.revokeObjectURL(objectUrl);

        if (image.width < 480 || image.height < 320) {
          reject(new Error('Please upload a clearer road image with at least 480x320 resolution.'));
          return;
        }

        if (aspectRatio > 1.8) {
          reject(new Error('Please upload a single road-scene image. Collages, multi-page images, and tall screenshot strips are not supported.'));
          return;
        }

        if (image.width < image.height * 0.7) {
          reject(new Error('Please upload a wider road-scene photo. Portrait document-like images are not suitable for demo analysis.'));
          return;
        }

        resolve();
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to read this image. Please upload a JPG or PNG road scene.'));
      };

      image.src = objectUrl;
    });

  const handleAnalyze = async (file, nextSpeed = speed) => {
    if (!file) return;

    setError('');
    setIsAnalyzing(true);

    try {
      setAnalysis((previous) => {
        if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
        return null;
      });
      let result;

      try {
        const yoloResponse = await requestYoloDetections(file, nextSpeed);
        result = await buildAnalysisFromDetectedObjects(file, yoloResponse.objects, yoloResponse.summary);
        setAnalysisMode('yolo');
      } catch {
        result = await analyzeCanvasImage(file, nextSpeed);
        setAnalysisMode('client');
      }

      setAnalysis(result);
      setSelectedFile(file);
      setSelectedObjectId(result.objects[0]?.id || null);
    } catch (analysisError) {
      setError(analysisError.message || 'Unable to analyze this image. Please try another JPG or PNG file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a valid JPG or PNG image.');
      return;
    }

    try {
      await validateImageFile(file);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    await handleAnalyze(file, speed);
  };

  useEffect(() => {
    if (!analysis || !annotatedCanvasRef.current) return;
    drawAnnotatedDetections({
      sourceCanvas: analysis.originalCanvas,
      objects: analysis.objects,
      targetCanvas: annotatedCanvasRef.current,
    });
  }, [analysis]);

  useEffect(() => {
    if (!analysis || !focusCanvasRef.current) return;
    const selectedObject = analysis.objects.find((object) => object.id === selectedObjectId) || analysis.objects[0];
    if (!selectedObject) return;

    const canvas = focusCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const padding = 30;
    const cropX = Math.max(0, selectedObject.bbox.x - padding);
    const cropY = Math.max(0, selectedObject.bbox.y - padding);
    const cropWidth = Math.min(analysis.originalCanvas.width - cropX, selectedObject.bbox.width + padding * 2);
    const cropHeight = Math.min(analysis.originalCanvas.height - cropY, selectedObject.bbox.height + padding * 2);

    canvas.width = 320;
    canvas.height = 220;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      analysis.originalCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const scaleX = canvas.width / cropWidth;
    const scaleY = canvas.height / cropHeight;
    const focusX = (selectedObject.bbox.x - cropX) * scaleX;
    const focusY = (selectedObject.bbox.y - cropY) * scaleY;
    const focusW = selectedObject.bbox.width * scaleX;
    const focusH = selectedObject.bbox.height * scaleY;
    const boxColor = STATUS_COLORS[selectedObject.ircStatus];

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = `${boxColor}AA`;
    ctx.shadowBlur = 18;
    ctx.strokeRect(focusX, focusY, focusW, focusH);
    ctx.shadowBlur = 0;
  }, [analysis, selectedObjectId]);

  useEffect(() => {
    if (!selectedFile) return undefined;

    const timeoutId = window.setTimeout(() => {
      handleAnalyze(selectedFile, speed);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [speed]);

  useEffect(() => () => {
    if (analysis?.objectUrl) URL.revokeObjectURL(analysis.objectUrl);
  }, [analysis]);

  const summary = useMemo(() => analysis?.summary || {
    score: 0,
    compliantCount: 0,
    totalCount: 0,
    grade: 'F',
  }, [analysis]);

  const selectedObject = useMemo(
    () => analysis?.objects.find((object) => object.id === selectedObjectId) || analysis?.objects[0] || null,
    [analysis, selectedObjectId]
  );
  const looksLikeTallComposite = analysis ? analysis.height / Math.max(1, analysis.width) > 1.8 : false;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-white via-orange-50 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">NHAI Measurement Workspace</p>
            <h2 className="text-2xl font-bold text-slate-900">Detection & Scoring</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Upload a field image to run pixel-level retroreflectivity analysis, detect bright highway assets, annotate
              bounding boxes, and score every object against IRC 67 and IRC 35 compliance thresholds.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 rounded-xl bg-[#FF6B00] px-5 text-white hover:bg-[#e55f00]"
            >
              <UploadCloud className="mr-2" />
              Upload JPG / PNG
            </Button>
            <div className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <span className="font-semibold text-slate-900">Safe threshold at {speed} km/h:</span> {speedThreshold} mcd/lx/m²
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">Upload Requirements</h3>
          <p className="text-sm text-slate-600">
            For accurate demo-quality results, upload one clear highway or roadside scene per image.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Good input: landscape road photo, visible sign or marking, clear roadside asset, single scene.
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Not allowed: collages, multi-photo screenshots, scanned pages, document captures, very tall stacked images.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Vehicle Speed Mode</p>
              <p className="text-sm text-slate-500">Objects are re-evaluated against the current highway operating speed.</p>
            </div>
            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-[#FF6B00]">
              {speed} km/h
            </div>
          </div>

          <input
            type="range"
            min="40"
            max="120"
            step="20"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className="w-full accent-[#FF6B00]"
          />

          <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium text-slate-500">
            {SPEED_OPTIONS.map((option) => (
              <div key={option} className={`rounded-xl px-2 py-2 ${option === speed ? 'bg-orange-100 text-[#FF6B00]' : 'bg-slate-50'}`}>
                {option} km/h
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAnalyzing && (
        <div className="rounded-3xl border border-orange-100 bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00]" />
            <div>
              <p className="text-lg font-semibold text-slate-900">Analyzing retroreflectivity...</p>
              <p className="text-sm text-slate-500">Scanning 8x8 regions, merging bright objects, and calculating IRC scores.</p>
            </div>
          </div>
        </div>
      )}

      {!isAnalyzing && !analysis && (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="rounded-full bg-orange-50 p-4">
              <Gauge className="h-8 w-8 text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Upload a highway image to begin measurement</p>
              <p className="mt-2 text-sm text-slate-500">
                The component will inspect every pixel, find the brightest merged objects, compute retroreflectivity scores,
                and generate a professional compliance table automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isAnalyzing && analysis && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Image Analysis Workspace</h3>
                  <p className="text-sm text-slate-500">{analysis.fileName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="COMPLIANT" className="border-orange-200 bg-orange-50 text-[#FF6B00]">
                    {analysis.objects.length} objects detected
                  </StatusBadge>
                  <Badge className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    {analysisMode === 'yolo' ? 'YOLOv8 backend' : 'Client-side fallback'}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Original Image</p>
                  <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={analysis.objectUrl}
                      alt="Original uploaded road scene"
                      className="mx-auto block max-h-[420px] min-h-[320px] object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Annotated Measurement Canvas</p>
                  <div className="overflow-auto rounded-2xl border-2 border-orange-200 bg-slate-50">
                    <canvas
                      ref={annotatedCanvasRef}
                      className="mx-auto block max-h-[420px] min-h-[320px] object-contain"
                    />
                  </div>
                </div>
              </div>

              {looksLikeTallComposite && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  This upload looks unusually tall, like a collage or multi-page image. Bounding boxes are clearer when you upload one road scene per file.
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <StatusBadge status="COMPLIANT">Green box = COMPLIANT</StatusBadge>
                <StatusBadge status="WARNING">Yellow box = WARNING</StatusBadge>
                <StatusBadge status="NON-COMPLIANT">Red box = NON-COMPLIANT</StatusBadge>
                <StatusBadge status="COMPLIANT" className="border-orange-200 bg-orange-100 text-orange-700">
                  Visibility distance = score x 0.8 m
                </StatusBadge>
              </div>

              {selectedObject && (
                <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[#FF6B00]" />
                      <p className="text-sm font-semibold text-slate-700">Detected Object Focus View</p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <canvas ref={focusCanvasRef} className="h-[220px] w-full object-contain" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Zoomed preview of the selected detection so the measured region and bounding box are easier to inspect.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Detections</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {analysis.objects.map((object) => (
                        <button
                          key={object.id}
                          type="button"
                          onClick={() => setSelectedObjectId(object.id)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selectedObjectId === object.id
                              ? 'border-[#FF6B00] bg-orange-50 ring-2 ring-orange-100'
                              : 'border-slate-200 bg-white hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{object.id}</p>
                              <p className="text-sm text-slate-500">{object.typeLabel}</p>
                            </div>
                            <StatusBadge status={object.ircStatus}>{object.ircStatus}</StatusBadge>
                          </div>
                          <div className="mt-3 space-y-1 text-sm text-slate-600">
                            <p>Brightness: <span className="font-semibold text-slate-900">{object.brightness}</span></p>
                            <p>Score: <span className="font-semibold text-slate-900">{object.score} mcd/lx/m²</span></p>
                            <p>Confidence: <span className="font-semibold text-slate-900">{object.confidence}%</span></p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <CircularGauge
                score={summary.score}
                grade={summary.grade}
                compliantCount={summary.compliantCount}
                totalCount={summary.totalCount}
              />

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#FF6B00]" />
                  <h3 className="text-lg font-semibold text-slate-900">Compliance Snapshot</h3>
                </div>
                <div className="mt-4 space-y-4">
                  {analysis.objects.map((object) => (
                    <div key={object.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{object.id} · {object.typeLabel}</p>
                          <p className="text-sm text-slate-500">
                            Pixel brightness {object.brightness} · {object.standard}
                          </p>
                        </div>
                        <StatusBadge status={object.ircStatus}>{object.ircStatus}</StatusBadge>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Retroreflectivity Score</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">{object.score} mcd/lx/m²</p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">{object.confidence}%</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p>Driver can see this sign from <span className="font-semibold text-slate-900">{object.visibilityDistance} meters</span>.</p>
                        <p>Speed threshold at {speed} km/h is <span className="font-semibold text-slate-900">{object.speedThreshold} mcd/lx/m²</span>.</p>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={object.speedStatus}>{object.speedStatus === 'SAFE' ? 'Safe at current speed' : 'Unsafe at current speed'}</StatusBadge>
                          {object.speedUnsafeDespiteIrc && (
                            <StatusBadge status="COMPLIANT" className="border-orange-200 bg-orange-100 text-orange-700">
                              IRC COMPLIANT BUT UNSAFE AT CURRENT SPEED
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Measurement Report Table</h3>
                <p className="text-sm text-slate-500">Professional IRC compliance summary for the analyzed image.</p>
              </div>
              <div className="rounded-full bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#FF6B00]">
                Current speed threshold: {speedThreshold} mcd/lx/m²
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Object ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">IRC Standard</th>
                    <th className="px-4 py-3">Pixel Brightness</th>
                    <th className="px-4 py-3">Score (mcd/lx/m²)</th>
                    <th className="px-4 py-3">Confidence %</th>
                    <th className="px-4 py-3">IRC Status</th>
                    <th className="px-4 py-3">Speed Status</th>
                    <th className="px-4 py-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.objects.map((object, index) => (
                    <tr key={object.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{object.id}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{object.typeLabel}</td>
                      <td className="px-4 py-4 text-slate-600">{object.standard}</td>
                      <td className="px-4 py-4 font-mono text-slate-700">{object.brightness}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{object.score}</td>
                      <td className="px-4 py-4 text-slate-700">{object.confidence}%</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={object.ircStatus}>{object.ircStatus}</StatusBadge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge status={object.speedStatus}>{object.speedStatus}</StatusBadge>
                          {object.speedUnsafeDespiteIrc && (
                            <Badge className="rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-[11px] font-semibold text-orange-700">
                              IRC COMPLIANT BUT UNSAFE AT CURRENT SPEED
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{object.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[#FF6B00]" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Scoring logic applied</p>
                <p className="mt-1">
                  Brightness is computed using <span className="font-mono">R x 0.299 + G x 0.587 + B x 0.114</span>, objects are
                  merged from adjacent bright grid regions, and the top five brightest distinct merged objects are scored
                  using the specified object multipliers and IRC thresholds.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
