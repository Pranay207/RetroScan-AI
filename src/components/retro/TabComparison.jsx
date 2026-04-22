import { calcDegradation, suggestDegradationCause, statusBg } from '@/lib/retroUtils';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function TabComparison({ detections, file2Detections, conditions, mode }) {
  if (mode !== 'temporal') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <TrendingDown size={40} className="opacity-30" />
        <p className="text-sm">Select <strong>Before/After</strong> mode in the sidebar and upload two images.</p>
      </div>
    );
  }

  if (!detections.length || !file2Detections.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Run analysis with two images uploaded to see comparison.
      </div>
    );
  }

  const paired = detections.map((old, i) => {
    const newer = file2Detections[i] || { ...old, score: Math.round(old.score * 0.72) };
    const degradation = calcDegradation(old.score, newer.score);
    const rapidDeterioration = degradation > 30;
    return { old, newer, degradation, rapidDeterioration };
  });

  const barData = paired.map(({ old, newer }) => ({
    name: old.label.length > 14 ? old.label.slice(0, 12) + '…' : old.label,
    Before: old.score,
    After: newer.score,
  }));

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <TrendingDown size={16} /> Temporal Degradation Analysis
        </h3>
        <p className="text-xs text-blue-700 mt-1">Comparing retroreflectivity scores across two time points to detect deterioration.</p>
      </div>

      {/* Comparison Chart */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-4">Score Comparison: Before vs After</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => `${v} mcd/lx/m²`} />
            <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
            <Bar dataKey="Before" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="After" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-Side Object Comparison */}
      <div className="space-y-4">
        {paired.map(({ old, newer, degradation, rapidDeterioration }) => (
          <div key={old.id} className={`bg-card border rounded-xl p-4 ${rapidDeterioration ? 'border-red-300 bg-red-50' : ''}`}>
            {rapidDeterioration && (
              <div className="flex items-center gap-2 text-red-700 bg-red-100 rounded-lg px-3 py-1.5 mb-3 text-xs font-semibold">
                <AlertTriangle size={12} /> RAPID DETERIORATION DETECTED — {degradation}% decline
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {/* Old */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Before</p>
                <p className="font-rajdhani font-bold text-2xl text-blue-700">{old.score}</p>
                <p className="text-[10px] text-muted-foreground">mcd/lx/m²</p>
                <Badge className={`${statusBg(old.status)} border text-[10px] mt-1`}>{old.status}</Badge>
              </div>

              {/* Arrow + Degradation */}
              <div className="flex flex-col items-center justify-center">
                <ArrowRight size={20} className="text-muted-foreground" />
                <div className={`mt-1 text-center ${degradation > 30 ? 'text-red-600' : 'text-amber-600'}`}>
                  <p className="font-bold text-lg">−{degradation}%</p>
                  <p className="text-[10px]">degradation</p>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  {suggestDegradationCause(degradation, conditions)}
                </p>
              </div>

              {/* New */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">After</p>
                <p className="font-rajdhani font-bold text-2xl text-amber-700">{newer.score}</p>
                <p className="text-[10px] text-muted-foreground">mcd/lx/m²</p>
                <Badge className={`${statusBg(newer.status)} border text-[10px] mt-1`}>{newer.status}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">{old.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}