import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDecisions } from './hooks/useDecisions';
import { Jar } from './components/Jar';
import { Controls } from './components/Controls';
import { TopBar } from './components/TopBar';
import { DecisionDropLayer, DropSpec } from './components/DecisionDropLayer';
import { SettingsPanel } from './components/SettingsPanel';

export const App: React.FC = () => {
  const { goodCount, badCount, totalCount, greenShare, redShare, distortionIntensity, fillPercent, addGood, addBad, undo, whatIfMode, toggleWhatIf, resetToday, history, clearHistory } = useDecisions();
  const [drops, setDrops] = useState<DropSpec[]>([]);
  const [colorblind, setColorblind] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  // PWA install prompt handling
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    if (choice && choice.outcome !== 'accepted') {
      localStorage.setItem('pwa_install_dismissed', '1');
    }
    setShowInstall(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    localStorage.setItem('pwa_install_dismissed', '1');
    setShowInstall(false);
  }, []);

  const spawnDrop = useCallback((color: 'good' | 'bad') => {
    const id = Date.now() + Math.random();
    const drift = (Math.random() - 0.5) * 60;
    setDrops(prev => [...prev, { id, color, drift }]);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setDrops(current => current.filter(drop => drop.id !== id));
      }, 1250);
    }
  }, []);

  const handleGood = useCallback(() => { addGood(); spawnDrop('good'); }, [addGood, spawnDrop]);
  const handleBad = useCallback(() => { addBad(); spawnDrop('bad'); }, [addBad, spawnDrop]);

  // Dynamic height calc so jar fills remaining viewport between top bar and controls (mobile optimization)
  const topRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(0);

  useLayoutEffect(() => {
    const measure = () => {
      const topH = topRef.current?.offsetHeight || 0;
      const footH = footerRef.current?.offsetHeight || 0;
      const vh = window.innerHeight;
      // Add some padding to prevent jar touching edges, ensure minimum usable height
      const next = Math.max(280, vh - topH - footH - 32); // increased minimum, added padding
      setAvailableHeight(next);
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (topRef.current) ro.observe(topRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[100svh] relative overflow-hidden">
      <div ref={topRef}>
        <TopBar good={goodCount} bad={badCount} greenShare={greenShare} total={totalCount} />
      </div>
      <div className="flex-1 relative flex items-stretch justify-center px-0 pb-0">
        <div className="relative flex-1 flex items-center justify-center px-2 md:px-4">
          <Jar
            totalCount={totalCount}
            greenShare={greenShare}
            redShare={redShare}
            distortionIntensity={distortionIntensity}
            fillPercent={fillPercent}
            colorblind={colorblind}
            availableHeight={availableHeight}
          />
          <DecisionDropLayer drops={drops} greenShare={greenShare} redShare={redShare} totalCount={totalCount} />
          <div className="absolute top-4 right-4 flex gap-2 text-xs">
            <button
              onClick={() => setColorblind((c: boolean) => !c)}
              className={`px-3 py-2 rounded-lg border transition ${colorblind ? 'bg-goodGreen/20 text-goodGreen border-goodGreen/60' : 'bg-white/10 hover:bg-white/15 border-white/20'}`}
            >
              CB Mode
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>
      <footer ref={footerRef} className="w-full">
        <Controls onGood={handleGood} onBad={handleBad} onUndo={undo} onToggleWhatIf={toggleWhatIf} whatIfMode={whatIfMode} />
      </footer>
      {showInstall && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/70 backdrop-blur-md px-4 py-3 shadow-lg">
            <span className="text-xs sm:text-sm text-white/80">Install Decision Jar?</span>
            <button onClick={handleInstallClick} className="px-3 py-1 text-xs rounded-lg bg-goodGreen/25 border border-goodGreen/60 hover:bg-goodGreen/35 text-goodGreen font-medium">Install</button>
            <button onClick={dismissInstall} className="px-2 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/15 border border-white/20">Later</button>
          </div>
        </div>
      )}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetToday={() => { resetToday(); setSettingsOpen(false); }}
        onClearHistory={() => { clearHistory(); }}
        history={history}
      />
    </div>
  );
};
