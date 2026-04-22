import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import HeroSection from '@/components/dashboard/HeroSection';
import HighwayTable from '@/components/dashboard/HighwayTable';
import IndiaHeatMap from '@/components/dashboard/IndiaHeatMap';
import AlertFeed from '@/components/dashboard/AlertFeed';
import StateLeaderboard from '@/components/dashboard/StateLeaderboard';
import CostEstimator from '@/components/dashboard/CostEstimator';
import CitizenReportModal from '@/components/dashboard/CitizenReportModal';
import RetroScanLogo from '@/components/branding/RetroScanLogo';

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen font-inter" style={{ backgroundColor: '#F8F9FA' }}>
      <nav className="sticky top-0 z-30 bg-[#1A1F2E] shadow-lg">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <RetroScanLogo className="h-10 w-10" compact />
            <div>
              <p className="font-rajdhani text-lg font-bold leading-none text-white">NHAI · RetroScan AI</p>
              <p className="mt-0.5 text-[10px] leading-none text-white/40">National Highways Authority of India</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-1 text-xs text-white/60 md:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Live Data</span>
            </div>
            <Link to="/scan" className="rounded-lg bg-[#FF6B00] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#e55f00]">
              Open Scanner
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-screen-xl px-4 py-8 md:px-8">
        <HeroSection />
        <HighwayTable />

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <IndiaHeatMap />
          </div>
          <div>
            <AlertFeed />
          </div>
        </div>

        <StateLeaderboard />
        <CostEstimator />
      </main>

      <footer className="bg-[#1A1F2E] px-4 py-4 text-center text-xs text-white/40">
        Powered by <span className="font-semibold text-[#FF6B00]">RetroScan AI</span> · IRC 67 & IRC 35 Standards · National Highways Authority of India
      </footer>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#FF6B00] px-5 py-3.5 font-semibold text-white shadow-2xl transition-all hover:scale-105 hover:bg-[#e55f00] active:scale-95"
        style={{ boxShadow: '0 4px 24px rgba(255,107,0,0.4)' }}
      >
        <MapPin size={16} />
        <span className="text-sm">Report Unsafe Sign</span>
      </button>

      {showModal && <CitizenReportModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
