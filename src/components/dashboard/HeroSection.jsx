import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Shield, Activity, Users, IndianRupee } from 'lucide-react';
import RetroScanLogo from '@/components/branding/RetroScanLogo';

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}

const NATIONAL_SCORE = 67;
const PIE_DATA = [
  { value: NATIONAL_SCORE, color: '#FF6B00' },
  { value: 100 - NATIONAL_SCORE, color: '#F3F4F6' },
];

export default function HeroSection() {
  const score = useCountUp(NATIONAL_SCORE);
  const highways = useCountUp(10);
  const signs = useCountUp(2847);
  const alerts = useCountUp(23);
  const [timestamp] = useState(new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }));

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-[#1A1F2E] to-[#2D3142] px-6 py-10 text-white shadow-2xl md:px-10">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-2">
            <RetroScanLogo className="h-9 w-9" compact />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#FF6B00]">NHAI · RetroScan AI</span>
          </div>

          <h1 className="mb-2 font-rajdhani text-3xl font-bold leading-tight md:text-4xl">
            India National Highway
            <br />
            Safety Index
          </h1>

          <p className="mb-4 max-w-lg text-sm text-white/60">
            Real-time retroreflectivity compliance monitoring across National Highways. Powered by AI-driven road safety analytics.
          </p>

          <p className="mb-6 flex items-center gap-1.5 text-xs text-white/40">
            <Activity size={11} className="animate-pulse text-green-400" />
            Last updated: {timestamp}
          </p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={<Activity size={15} />} label="Highways Monitored" value={highways} color="blue" />
            <StatCard icon={<Shield size={15} />} label="Signs Scanned (Month)" value={signs.toLocaleString('en-IN')} color="green" />
            <StatCard icon={<AlertTriangle size={15} />} label="Critical Alerts" value={alerts} color="red" badge />
            <StatCard icon={<IndianRupee size={15} />} label="Est. Fix Cost" value="₹2.3 Cr" color="yellow" />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <Users size={12} className="text-[#FF6B00]" />
            <span><strong className="text-white/80">147</strong> citizen reports this month</span>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center">
          <div className="relative h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={72} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                  {PIE_DATA.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-rajdhani text-4xl font-bold text-[#FF6B00]">{score}</span>
              <span className="text-xs text-white/50">/ 100</span>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-white/80">National Safety Score</p>
          <span className="mt-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-400">Grade C · Needs Attention</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, badge }) {
  const colorMap = {
    blue: 'border-blue-500/30 bg-blue-500/20 text-blue-300',
    green: 'border-green-500/30 bg-green-500/20 text-green-300',
    red: 'border-red-500/30 bg-red-500/20 text-red-300',
    yellow: 'border-yellow-500/30 bg-yellow-500/20 text-yellow-300',
  };

  return (
    <div className={`${colorMap[color]} rounded-xl border p-3`}>
      <div className="mb-1 flex items-center gap-1.5 opacity-80">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-rajdhani text-2xl font-bold">{value}</span>
        {badge && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>}
      </div>
    </div>
  );
}
