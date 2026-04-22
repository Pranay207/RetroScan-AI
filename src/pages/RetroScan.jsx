import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/retro/Sidebar';
import TabAnalytics from '@/components/retro/TabAnalytics';
import TabGPSMap from '@/components/retro/TabGPSMap';
import TabDeterioration from '@/components/retro/TabDeteriorationx';
import TabAlerts from '@/components/retro/TabAlerts';
import TabComparison from '@/components/retro/TabComparison';
import TabSpeedAware from '@/components/retro/TabSpeedAware';
import TabMobileDemo from '@/components/retro/TabMobileDemo';
import TabReport from '@/components/retro/TabReport';
import TabLiveCamera from '@/components/retro/TabLiveCamera';
import DetectionScoring from '@/components/DetectionScoring';
import DroneSurveyMode from '@/components/DroneSurveyMode';
import { useGPS } from '@/hooks/useGPS';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, WifiOff } from 'lucide-react';
import {
  generateDetections, computeSafetyScore, extractImageBrightness
} from '@/lib/retroUtils';

const TABS = [
  { id: 'detection', label: 'Detection & Scoring' },
  { id: 'drone', label: 'Drone Survey Mode' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'gps', label: 'GPS Heat Map' },
  { id: 'deterioration', label: 'Deterioration' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'comparison', label: 'Before/After' },
  { id: 'speed', label: 'Speed-Aware' },
  { id: 'mobile', label: 'Mobile Demo' },
  { id: 'report', label: 'Download Report' },
  { id: 'camera', label: '📷 Live Camera' },
];

// Demo mode — fixed brightness for sample highway
const DEMO_BRIGHTNESS = 162;

export default function RetroScan() {
  const [activeTab, setActiveTab] = useState('detection');
  const [analyzing, setAnalyzing] = useState(false);
  const [detections, setDetections] = useState([]);
  const [file2Detections, setFile2Detections] = useState([]);
  const [safetyScore, setSafetyScore] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [currentMode, setCurrentMode] = useState('standard');
  const [currentSpeed, setCurrentSpeed] = useState(80);
  const [currentConditions, setCurrentConditions] = useState({
    night: false, wet: false, foggy: false, noStreetlight: false,
  });
  const [analyzed, setAnalyzed] = useState(false);

  const { coords: gpsCoords, loading: gpsLoading, fetchLocation } = useGPS();
  const { canInstall, installed, isOffline, promptInstall } = usePWA();
  const [forceShowInstall, setForceShowInstall] = useState(true);
  const { toast } = useToast();

  const handleAnalyze = useCallback(async ({ file, file2, mode, speed, conditions, demoMode }) => {
    setAnalyzing(true);
    setCurrentMode(mode);
    setCurrentSpeed(speed);
    setCurrentConditions(conditions);

    // Fetch GPS on every analysis run
    fetchLocation();

    await new Promise(r => setTimeout(r, 900));

    let brightness = DEMO_BRIGHTNESS;
    let url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';

    if (file) {
      brightness = await extractImageBrightness(file);
      url = URL.createObjectURL(file);
    }

    const dets = generateDetections(brightness, conditions, file);
    const score = computeSafetyScore(dets);

    setDetections(dets);
    setSafetyScore(score);
    setImageUrl(url);

    if (mode === 'temporal' && file2) {
      const brightness2 = await extractImageBrightness(file2);
      const dets2 = generateDetections(brightness2 * 0.72, conditions, file2);
      setFile2Detections(dets2);
    } else {
      const olderDets = generateDetections(brightness * 1.35, { ...conditions }, null);
      setFile2Detections(olderDets);
    }

    setAnalyzed(true);
    setAnalyzing(false);
    setActiveTab('detection');
  }, [fetchLocation]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      toast({
        title: 'App Installed ✓',
        description: 'RetroScan AI has been added to your home screen.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-inter md:flex-row">
      {/* Offline banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff size={13} /> You are offline — using cached data
        </div>
      )}

      <Sidebar onAnalyze={handleAnalyze} analyzing={analyzing} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className={`bg-card border-b px-4 py-3 flex items-center justify-between flex-wrap gap-2 ${isOffline ? 'mt-7' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-nhai-orange animate-pulse" />
            <span className="font-rajdhani font-bold text-nhai-dark text-base">
              {analyzed ? `Analysis Complete — ${detections.length} objects detected` : 'Ready for Analysis'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-xs">IRC 67</span>
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-xs">IRC 35</span>
            {/* Install button */}
            {(canInstall || forceShowInstall) && !installed && (
              <Button
                onClick={() => { setForceShowInstall(false); handleInstall(); }}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Download size={13} /> Install App
              </Button>
            )}
            {installed && (
              <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <CheckCircle2 size={13} /> Installed ✓
              </span>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b bg-card overflow-x-auto">
          <div className="flex px-4 gap-0 min-w-max">
            <Link
              to="/"
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border whitespace-nowrap"
            >
              🏠 Home
            </Link>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-nhai-orange text-nhai-orange'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {activeTab === 'detection' && (
            <DetectionScoring />
          )}
          {activeTab === 'drone' && (
            <DroneSurveyMode />
          )}
          {activeTab === 'analytics' && (
            <TabAnalytics detections={detections} safetyScore={safetyScore} />
          )}
          {activeTab === 'gps' && (
            <TabGPSMap
              detections={detections}
              gpsCoords={gpsCoords}
              gpsLoading={gpsLoading}
              onRelocate={fetchLocation}
            />
          )}
          {activeTab === 'deterioration' && (
            <TabDeterioration detections={detections} />
          )}
          {activeTab === 'alerts' && (
            <TabAlerts detections={detections} />
          )}
          {activeTab === 'comparison' && (
            <TabComparison
              detections={file2Detections}
              file2Detections={detections}
              conditions={currentConditions}
              mode={currentMode}
            />
          )}
          {activeTab === 'speed' && (
            <TabSpeedAware detections={detections} speed={currentSpeed} />
          )}
          {activeTab === 'mobile' && (
            <TabMobileDemo />
          )}
          {activeTab === 'report' && (
            <TabReport
              detections={detections}
              safetyScore={safetyScore}
              conditions={currentConditions}
              speed={currentSpeed}
              imageUrl={imageUrl}
              gpsCoords={gpsCoords}
            />
          )}
          {activeTab === 'camera' && (
            <TabLiveCamera />
          )}
        </div>
      </main>
    </div>
  );
}
