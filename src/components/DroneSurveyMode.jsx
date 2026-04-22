import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AlertTriangle, Download, Image as ImageIcon, Loader2, MapPin, Navigation } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RetroScanLogo from '@/components/branding/RetroScanLogo';
import {
  STATUS_COLORS,
  analyzeCanvasImage,
  buildMaintenanceCost,
  buildSurveyCoordinates,
  drawAnnotatedDetections,
  formatDistance,
  summarizeSurvey,
} from '@/lib/retroCanvasAnalysis';

const segmentBadgeClasses = {
  '#22C55E': 'bg-green-100 text-green-700 border-green-200',
  '#F59E0B': 'bg-amber-100 text-amber-700 border-amber-200',
  '#EF4444': 'bg-red-100 text-red-700 border-red-200',
};

function FitBounds({ entries }) {
  const map = useMap();

  useEffect(() => {
    if (!entries.length) return;
    const bounds = entries.map((entry) => [entry.gps.lat, entry.gps.lng]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [entries, map]);

  return null;
}

function SegmentBadge({ color, children }) {
  return (
    <Badge className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${segmentBadgeClasses[color] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {children}
    </Badge>
  );
}

export default function DroneSurveyMode() {
  const reportRef = useRef(null);
  const selectedCanvasRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [surveyEntries, setSurveyEntries] = useState([]);
  const [selectedImageNumber, setSelectedImageNumber] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [highwayName, setHighwayName] = useState('NH-44');
  const [startLatitude, setStartLatitude] = useState('17.3850');
  const [startLongitude, setStartLongitude] = useState('78.4867');

  const revokeEntries = (entries) => {
    entries.forEach((entry) => {
      if (entry?.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    });
  };

  useEffect(() => () => {
    revokeEntries(surveyEntries);
  }, [surveyEntries]);

  const selectedEntry = useMemo(
    () => surveyEntries.find((entry) => entry.imageNumber === selectedImageNumber) || surveyEntries[0] || null,
    [selectedImageNumber, surveyEntries]
  );

  useEffect(() => {
    if (!selectedEntry || !selectedCanvasRef.current) return;
    drawAnnotatedDetections({
      sourceCanvas: selectedEntry.originalCanvas,
      objects: selectedEntry.objects,
      targetCanvas: selectedCanvasRef.current,
    });
  }, [selectedEntry]);

  const surveySummary = useMemo(() => summarizeSurvey(surveyEntries), [surveyEntries]);

  const handleFilesChange = (event) => {
    const pickedFiles = Array.from(event.target.files || []).filter((file) => ['image/jpeg', 'image/png'].includes(file.type)).slice(0, 20);

    if (!pickedFiles.length) {
      setError('Please select up to 20 JPG or PNG images.');
      return;
    }

    revokeEntries(surveyEntries);
    setError('');
    setFiles(pickedFiles);
    setSurveyEntries([]);
    setSelectedImageNumber(null);
    setProgress({ done: 0, total: pickedFiles.length });
  };

  const handleAnalyzeAll = async () => {
    if (!files.length) {
      setError('Upload one or more survey images before running analysis.');
      return;
    }

    const lat = Number(startLatitude);
    const lng = Number(startLongitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Enter valid numeric start coordinates for the survey route.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    revokeEntries(surveyEntries);
    setSurveyEntries([]);
    setProgress({ done: 0, total: files.length });

    try {
      const nextEntries = [];

      for (let index = 0; index < files.length; index += 1) {
        const result = await analyzeCanvasImage(files[index], 80);
        const gps = buildSurveyCoordinates(lat, lng, index);
        const entry = {
          ...result,
          imageNumber: index + 1,
          gps,
          highwayName,
        };

        nextEntries.push(entry);
        setProgress({ done: index + 1, total: files.length });
      }

      setSurveyEntries(nextEntries);
      setSelectedImageNumber(1);
    } catch (analysisError) {
      setError(analysisError.message || 'Unable to analyze the uploaded survey set.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !surveyEntries.length) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.4,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageData = canvas.toDataURL('image/png');

      let currentOffset = 0;
      while (currentOffset < pdfHeight) {
        pdf.addImage(imageData, 'PNG', 0, -currentOffset, pdfWidth, pdfHeight);
        currentOffset += pageHeight;
        if (currentOffset < pdfHeight) pdf.addPage();
      }

      pdf.save(`RetroScan_Drone_Survey_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to generate the survey PDF right now.');
    } finally {
      setIsDownloading(false);
    }
  };

  const routeSegments = surveyEntries.slice(1).map((entry, index) => ({
    id: `segment-${entry.imageNumber}`,
    color: entry.segmentColor,
    positions: [
      [surveyEntries[index].gps.lat, surveyEntries[index].gps.lng],
      [entry.gps.lat, entry.gps.lng],
    ],
  }));

  const criticalPoints = surveyEntries.filter((entry) => entry.objects.some((object) => object.ircStatus === 'NON-COMPLIANT'));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-gradient-to-r from-white via-orange-50 to-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">Aerial Corridor Measurement</p>
            <h2 className="text-2xl font-bold text-slate-900">Drone Survey Mode</h2>
            <p className="text-sm text-slate-600">
              Process a batch of up to twenty survey images, simulate the corridor route with GPS points, identify critical
              retroreflectivity failures, and generate a field-ready PDF report for NHAI maintenance teams.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highway</label>
              <input
                value={highwayName}
                onChange={(event) => setHighwayName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start latitude</label>
              <input
                value={startLatitude}
                onChange={(event) => setStartLatitude(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start longitude</label>
              <input
                value={startLongitude}
                onChange={(event) => setStartLongitude(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">Survey Image Upload</h3>
            <p className="text-sm text-slate-500">Upload multiple JPG or PNG images from the highway stretch. Maximum 20 images per run.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e55f00]">
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Survey Images
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>

            <Button
              type="button"
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing || !files.length}
              className="h-12 rounded-xl bg-[#FF6B00] px-5 text-white hover:bg-[#e55f00]"
            >
              {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" />Analyzing...</> : 'Analyze All Images'}
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Progress</span>
            <span className="text-slate-500">{progress.done} of {progress.total || files.length} images analyzed</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#FF6B00] transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!files.length && (
          <div className="mt-6 rounded-2xl border border-dashed border-orange-200 p-10 text-center text-sm text-slate-500">
            Upload a batch of survey frames to generate the strip map, route compliance view, and PDF-style report.
          </div>
        )}

        {!!files.length && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {files.map((file, index) => {
              const entry = surveyEntries[index];
              return (
                <button
                  key={`${file.name}-${index}`}
                  type="button"
                  onClick={() => entry && setSelectedImageNumber(entry.imageNumber)}
                  className={`rounded-2xl border p-3 text-left shadow-sm transition ${entry && selectedImageNumber === entry.imageNumber ? 'border-[#FF6B00] ring-2 ring-orange-100' : 'border-slate-200 hover:border-orange-200'}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#FF6B00]">Image {index + 1}</span>
                    {entry && <SegmentBadge color={entry.segmentColor}>{entry.objects.length} objects</SegmentBadge>}
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{Math.round(file.size / 1024)} KB</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!!surveyEntries.length && (
        <>
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Highway Strip Map</h3>
                <p className="text-sm text-slate-500">Click any segment to inspect that image’s survey results.</p>
              </div>
              <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-[#FF6B00]">
                Scanned {formatDistance(surveySummary.totalDistanceMeters)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative flex overflow-hidden rounded-2xl border border-slate-200">
                {surveyEntries.map((entry) => (
                  <button
                    key={entry.imageNumber}
                    type="button"
                    onClick={() => setSelectedImageNumber(entry.imageNumber)}
                    className="relative flex-1 px-2 py-5 text-white transition hover:opacity-90"
                    style={{ backgroundColor: entry.segmentColor }}
                  >
                    <span className="text-xs font-semibold">Img {entry.imageNumber}</span>
                    <span className="mt-1 block text-[11px] opacity-90">{entry.objects.length} objs</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {Array.from({ length: Math.floor(surveySummary.totalDistanceMeters / 500) + 1 }, (_, index) => (
                  <div key={index} className="rounded-full bg-slate-100 px-3 py-1">
                    {index * 500} m
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">GPS Failure Map</h3>
                  <p className="text-sm text-slate-500">Critical markers highlight exact GPS points with non-compliant findings.</p>
                </div>
                <SegmentBadge color="#EF4444">{criticalPoints.length} critical points on this stretch</SegmentBadge>
              </div>

              <div className="overflow-hidden rounded-2xl border" style={{ height: 420 }}>
                <MapContainer center={[surveyEntries[0].gps.lat, surveyEntries[0].gps.lng]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds entries={surveyEntries} />
                  {routeSegments.map((segment) => (
                    <Polyline key={segment.id} positions={segment.positions} pathOptions={{ color: segment.color, weight: 7 }} />
                  ))}
                  {surveyEntries.map((entry) => (
                    <CircleMarker
                      key={`scan-${entry.imageNumber}`}
                      center={[entry.gps.lat, entry.gps.lng]}
                      radius={7}
                      pathOptions={{ color: entry.segmentColor, fillColor: entry.segmentColor, fillOpacity: 1 }}
                      eventHandlers={{ click: () => setSelectedImageNumber(entry.imageNumber) }}
                    >
                      <Popup>
                        <div className="space-y-2 text-xs">
                          <p className="font-semibold text-slate-900">Image {entry.imageNumber}</p>
                          <p>{entry.fileName}</p>
                          <p>{entry.gps.lat}, {entry.gps.lng}</p>
                          <p>{entry.objects.length} detected objects</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  {criticalPoints.map((entry) => (
                    <CircleMarker
                      key={`critical-${entry.imageNumber}`}
                      center={[entry.gps.lat, entry.gps.lng]}
                      radius={11}
                      pathOptions={{ color: '#B91C1C', fillColor: '#EF4444', fillOpacity: 0.95, weight: 2 }}
                    >
                      <Popup>
                        <div className="space-y-2 text-xs">
                          <p className="font-semibold text-red-700">Critical finding · Image {entry.imageNumber}</p>
                          {entry.objects.filter((object) => object.ircStatus === 'NON-COMPLIANT').map((object) => (
                            <div key={object.id} className="rounded-lg bg-red-50 p-2">
                              <p className="font-semibold text-slate-900">{object.typeLabel}</p>
                              <p>Score: {object.score} mcd/lx/m²</p>
                              <p>Action: {object.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="space-y-6">
              {selectedEntry && (
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Selected Image Results</h3>
                      <p className="text-sm text-slate-500">Image {selectedEntry.imageNumber} · {selectedEntry.fileName}</p>
                    </div>
                    <SegmentBadge color={selectedEntry.segmentColor}>{selectedEntry.highwayName}</SegmentBadge>
                  </div>

                  <div className="grid gap-4">
                    <div className="overflow-hidden rounded-2xl border bg-slate-50">
                      <canvas ref={selectedCanvasRef} className="h-[260px] w-full object-contain" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">GPS</p>
                        <p className="mt-2 font-semibold text-slate-900">{selectedEntry.gps.lat}, {selectedEntry.gps.lng}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Compliance mix</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {selectedEntry.objects.filter((object) => object.ircStatus === 'COMPLIANT').length} compliant / {selectedEntry.objects.filter((object) => object.ircStatus !== 'COMPLIANT').length} flagged
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedEntry.objects.map((object) => (
                        <div key={object.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{object.id} · {object.typeLabel}</p>
                              <p className="text-sm text-slate-500">Brightness {object.brightness} • Confidence {object.confidence}%</p>
                            </div>
                            <SegmentBadge color={STATUS_COLORS[object.ircStatus]}>{object.ircStatus}</SegmentBadge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Score {object.score} mcd/lx/m² against {object.standard}. Recommended action: {object.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#FF6B00]" />
                  <h3 className="text-lg font-semibold text-slate-900">Survey Snapshot</h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Images analyzed</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{surveyEntries.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Overall score</p>
                    <p className="mt-2 text-2xl font-bold text-[#FF6B00]">{surveySummary.overallScore}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Critical findings</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">{surveySummary.criticalFindings.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total distance</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatDistance(surveySummary.totalDistanceMeters)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Drone Survey Report</h3>
                <p className="text-sm text-slate-500">PDF-style summary prepared for corridor operations and maintenance review.</p>
              </div>
              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="h-11 rounded-xl bg-[#FF6B00] px-5 text-white hover:bg-[#e55f00]"
              >
                {isDownloading ? <><Loader2 className="mr-2 animate-spin" />Preparing PDF...</> : <><Download className="mr-2" />Download Survey Report PDF</>}
              </Button>
            </div>

            <div ref={reportRef} className="rounded-2xl border bg-white p-6 text-slate-900">
              <div className="border-b-4 border-[#FF6B00] pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <RetroScanLogo className="h-16 w-16 border border-slate-200 shadow-sm" />
                    <div>
                      <h1 className="text-2xl font-bold text-[#FF6B00]">NHAI DRONE RETROREFLECTIVITY SURVEY REPORT</h1>
                      <p className="mt-1 text-sm text-slate-500">RetroScan AI aerial corridor compliance assessment</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <p><span className="font-semibold">Highway:</span> {highwayName}</p>
                  <p><span className="font-semibold">Survey Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
                  <p><span className="font-semibold">Total Distance:</span> {formatDistance(surveySummary.totalDistanceMeters)}</p>
                  <p><span className="font-semibold">Surveying Authority:</span> RetroScan AI</p>
                  <p><span className="font-semibold">Images Analyzed:</span> {surveyEntries.length}</p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Executive Summary</h2>
                <div className="overflow-hidden rounded-2xl border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Total Objects Detected</th>
                        <th className="px-4 py-3">Compliant</th>
                        <th className="px-4 py-3">Warning</th>
                        <th className="px-4 py-3">Non-Compliant</th>
                        <th className="px-4 py-3">Overall Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-4">{surveySummary.totalObjects}</td>
                        <td className="px-4 py-4">{surveySummary.compliant}</td>
                        <td className="px-4 py-4">{surveySummary.warning}</td>
                        <td className="px-4 py-4">{surveySummary.nonCompliant}</td>
                        <td className="px-4 py-4 font-semibold text-[#FF6B00]">{surveySummary.overallScore}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Critical Findings</h2>
                <div className="space-y-3">
                  {surveySummary.criticalFindings.length === 0 && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                      No non-compliant findings were detected in this survey set.
                    </div>
                  )}

                  {surveySummary.criticalFindings.map((finding) => (
                    <div key={`${finding.imageNumber}-${finding.object.id}`} className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">Image {finding.imageNumber} · {finding.object.typeLabel}</p>
                        <SegmentBadge color="#EF4444">{finding.object.priority}</SegmentBadge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                        <p><span className="font-semibold">GPS:</span> {finding.gps.lat}, {finding.gps.lng}</p>
                        <p><span className="font-semibold">Score vs required:</span> {finding.object.score} / {finding.object.speedThreshold} mcd/lx/m²</p>
                        <p><span className="font-semibold">Recommended action:</span> {finding.object.recommendation}</p>
                        <p><span className="font-semibold">Priority:</span> {finding.object.priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Maintenance Schedule</h2>
                <div className="overflow-hidden rounded-2xl border">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Issue</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surveyEntries.flatMap((entry) =>
                        entry.objects
                          .filter((object) => object.ircStatus !== 'COMPLIANT')
                          .map((object) => (
                            <tr key={`${entry.imageNumber}-${object.id}`} className="border-t">
                              <td className="px-4 py-4">{entry.gps.lat}, {entry.gps.lng}</td>
                              <td className="px-4 py-4">{object.typeLabel} scored {object.score} mcd/lx/m²</td>
                              <td className="px-4 py-4">{object.recommendation}</td>
                              <td className="px-4 py-4">{object.priority}</td>
                              <td className="px-4 py-4">{buildMaintenanceCost(object)}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 text-xs text-slate-500">
                This report was generated by RetroScan AI using AI-powered retroreflectivity measurement as per IRC 67 and IRC 35 standards
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-5">
            <div className="flex items-start gap-3 text-sm text-slate-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[#FF6B00]" />
              <p>
                Every survey image is processed with the same pixel-grid object detection logic as the single-image measurement tab,
                then assigned mock corridor GPS coordinates by incrementing latitude by <span className="font-mono">0.001</span> per image.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
