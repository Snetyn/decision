import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useDecisions } from './hooks/useDecisions';
import { Jar } from './components/Jar';
import { Controls } from './components/Controls';
import { TopBar } from './components/TopBar';
import { DecisionDropLayer, DropSpec } from './components/DecisionDropLayer';

export const App: React.FC = () => {
  const { goodCount, badCount, totalCount, greenShare, redShare, distortionIntensity, fillPercent, addGood, addBad, undo, whatIfMode, toggleWhatIf } = useDecisions();
  const [drops, setDrops] = useState<DropSpec[]>([]);
  const [colorblind, setColorblind] = useState(false);

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

  // Add fill overshoot animation trigger
  const [fillTrigger, setFillTrigger] = useState(0);
  const triggerFillAnimation = useCallback(() => {
    setFillTrigger(prev => prev + 1);
  }, []);

  const handleGood = useCallback(() => { 
    addGood(); 
    spawnDrop('good'); 
    triggerFillAnimation();
  }, [addGood, spawnDrop, triggerFillAnimation]);
  
  const handleBad = useCallback(() => { 
    addBad(); 
    spawnDrop('bad'); 
    triggerFillAnimation();
  }, [addBad, spawnDrop, triggerFillAnimation]);

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
            fillTrigger={fillTrigger}
          />
          <DecisionDropLayer drops={drops} greenShare={greenShare} redShare={redShare} totalCount={totalCount} />
          <div className="absolute top-4 right-4 flex gap-2 text-xs">
            <button
              onClick={() => setColorblind((c: boolean) => !c)}
              className={`px-3 py-2 rounded-lg border transition ${colorblind ? 'bg-goodGreen/20 text-goodGreen border-goodGreen/60' : 'bg-white/10 hover:bg-white/15 border-white/20'}`}
            >
              CB Mode
            </button>
          </div>
        </div>
      </div>
      <footer ref={footerRef} className="w-full">
        <Controls onGood={handleGood} onBad={handleBad} onUndo={undo} onToggleWhatIf={toggleWhatIf} whatIfMode={whatIfMode} />
      </footer>
    </div>
  );
};
