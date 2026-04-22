import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { predictDeteriorationMonths } from '@/lib/retroUtils';
import { Button } from '@/components/ui/button';
import RetroScanLogo from '@/components/branding/RetroScanLogo';
import { Download, FileText, Loader2, MapPin } from 'lucide-react';

export default function TabReport({ detections, safetyScore, conditions, speed, gpsCoords }) {
  const reportRef = useRef();
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let offsetY = 0;
      while (offsetY < pdfHeight) {
        pdf.addImage(imageData, 'PNG', 0, -offsetY, pdfWidth, pdfHeight);
        offsetY += pageHeight;
        if (offsetY < pdfHeight) pdf.addPage();
      }

      pdf.save(`RetroScan_AI_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const activeConditions = Object.entries(conditions)
    .filter(([, value]) => value)
    .map(([key]) => ({
      night: 'Night',
      wet: 'Wet Road',
      foggy: 'Foggy',
      noStreetlight: 'No Streetlight',
    }[key]));

  const gpsLabel = gpsCoords
    ? `${gpsCoords.lat.toFixed(4)}° N, ${gpsCoords.lng.toFixed(4)}° E`
    : 'Not available';

  if (!detections.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText size={40} className="opacity-30" />
        <p className="text-sm">Run analysis first to generate the PDF report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">PDF Report Preview</h3>
        <Button onClick={handleDownload} disabled={generating} className="text-white nhai-gradient">
          {generating ? <><Loader2 size={14} className="mr-2 animate-spin" /> Generating...</> : <><Download size={14} className="mr-2" /> Download PDF</>}
        </Button>
      </div>

      <div ref={reportRef} className="rounded-2xl border bg-white p-8 font-inter text-[#1A1F2E]" style={{ minWidth: 700 }}>
        <div className="mb-6 flex items-center justify-between gap-6 border-b-4 border-[#FF6B00] pb-6">
          <div className="flex items-center gap-4">
            <RetroScanLogo className="h-16 w-16 border border-slate-200 shadow-sm" />
            <div>
              <h1 className="font-rajdhani text-3xl font-bold text-[#FF6B00]">RetroScan AI</h1>
              <p className="text-sm text-gray-500">NHAI Retroreflectivity Measurement System</p>
              <p className="mt-0.5 text-xs text-gray-400">Powered by IRC 67 and IRC 35 Standards</p>
            </div>
          </div>

          <div className="text-right">
            <div className="mb-1 inline-block rounded-xl bg-[#FF6B00] px-4 py-2 text-white">
              <p className="text-xs font-bold">Retroreflectivity Compliance Report</p>
            </div>
            <p className="text-xs text-gray-400">Generated: {now}</p>
            <p className="text-xs text-gray-400">Speed Context: {speed} km/h</p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
          <MapPin size={14} className="shrink-0 text-blue-500" />
          <div>
            <span className="text-xs font-semibold text-blue-700">GPS Scan Location: </span>
            <span className="font-mono text-xs text-blue-600">{gpsLabel}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <div
            className="col-span-1 rounded-xl border-2 p-4 text-center"
            style={{ borderColor: safetyScore >= 75 ? '#22C55E' : safetyScore >= 50 ? '#F59E0B' : '#EF4444' }}
          >
            <p
              className="text-4xl font-bold"
              style={{ color: safetyScore >= 75 ? '#22C55E' : safetyScore >= 50 ? '#F59E0B' : '#EF4444' }}
            >
              {safetyScore}
            </p>
            <p className="mt-1 text-xs text-gray-500">Safety Score / 100</p>
          </div>

          {[
            { label: 'Total Detected', value: detections.length, color: '#1A1F2E' },
            { label: 'Compliant', value: detections.filter((item) => item.status === 'COMPLIANT').length, color: '#22C55E' },
            { label: 'Non-Compliant', value: detections.filter((item) => item.status === 'NON-COMPLIANT').length, color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border p-4 text-center">
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {activeConditions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Conditions simulated:</span>
            {activeConditions.map((condition) => (
              <span key={condition} className="rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                {condition}
              </span>
            ))}
          </div>
        )}

        <h2 className="mb-3 border-b pb-1 text-base font-bold">Detection Summary</h2>
        <table className="mb-6 w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6' }}>
              {['ID', 'Object', 'Type', 'Score (mcd/lx/m²)', 'Status', 'Location', 'Months Left'].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {detections.map((detection, index) => {
              const months = predictDeteriorationMonths(detection.score, detection.type, detection.age, detection.material);
              return (
                <tr key={detection.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>{detection.id}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #F3F4F6' }}>{detection.label}</td>
                  <td style={{ padding: '7px 10px', fontSize: 11, color: '#6B7280', textTransform: 'capitalize', borderBottom: '1px solid #F3F4F6' }}>{detection.type}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, borderBottom: '1px solid #F3F4F6' }}>{detection.score}</td>
                  <td style={{ padding: '7px 10px', borderBottom: '1px solid #F3F4F6' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: detection.status === 'COMPLIANT' ? '#DCFCE7' : detection.status === 'WARNING' ? '#FEF3C7' : '#FEE2E2',
                        color: detection.status === 'COMPLIANT' ? '#166534' : detection.status === 'WARNING' ? '#92400E' : '#991B1B',
                      }}
                    >
                      {detection.status}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 11, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>{detection.location?.name || 'N/A'}</td>
                  <td style={{ padding: '7px 10px', fontWeight: 600, fontSize: 12, color: months <= 3 ? '#EF4444' : '#22C55E', borderBottom: '1px solid #F3F4F6' }}>{months} mo</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t pt-4 text-xs text-gray-400">
          <span>RetroScan AI</span>
          <span>IRC 67 (Road Signs) · IRC 35 (Pavement Markings)</span>
          <span>GPS: {gpsLabel}</span>
        </div>
      </div>
    </div>
  );
}
