import { useCallback, useEffect, useMemo, useState } from 'react';

export type DecisionType = 'good' | 'bad';
export interface DecisionEntry { id: number; timestamp: string; type: DecisionType; }

const STORAGE_KEY = 'decisions_v1';

interface UseDecisionsOptions { capacity?: number; }

export interface UseDecisionsResult {
  decisions: DecisionEntry[];
  goodCount: number;
  badCount: number;
  totalCount: number;
  greenShare: number;
  redShare: number;
  fillPercent: number; // 0..1 of capacity
  distortionIntensity: number; // 0..1 mapped to redShare
  addDecision: (type: DecisionType) => void;
  addGood: () => void;
  addBad: () => void;
  undo: () => void;
  whatIfMode: boolean;
  toggleWhatIf: () => void;
  capacity: number;
}

function load(): DecisionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as DecisionEntry[];
    return [];
  } catch {
    return [];
  }
}

function persist(data: DecisionEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useDecisions(opts: UseDecisionsOptions = {}): UseDecisionsResult {
  const capacity = opts.capacity ?? 100;
  const [decisions, setDecisions] = useState<DecisionEntry[]>(() => load());
  const [whatIfMode, setWhatIfMode] = useState(false);

  useEffect(() => { persist(decisions); }, [decisions]);

  const goodCountReal = decisions.filter((d: DecisionEntry) => d.type === 'good').length;
  const badCountReal = decisions.filter((d: DecisionEntry) => d.type === 'bad').length;
  const totalReal = decisions.length;

  const goodCount = whatIfMode ? totalReal : goodCountReal;
  const badCount = whatIfMode ? 0 : badCountReal;
  const totalCount = totalReal;

  const greenShare = totalCount === 0 ? 0 : goodCount / totalCount;
  const redShare = totalCount === 0 ? 0 : badCount / totalCount;
  const visualRedShare = totalCount === 0 ? 0 : badCountReal / totalCount;
  const fillPercent = Math.min(1, totalCount / capacity);
  const distortionIntensity = Math.pow(visualRedShare, 0.65);

  const addDecision = useCallback((type: DecisionType) => {
    setDecisions((prev: DecisionEntry[]) => {
      const next: DecisionEntry[] = [...prev, { id: prev.length ? prev[prev.length - 1].id + 1 : 1, timestamp: new Date().toISOString(), type }];
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setDecisions((prev: DecisionEntry[]) => prev.slice(0, -1));
  }, []);

  const toggleWhatIf = useCallback(() => setWhatIfMode((v: boolean) => !v), []);

  const addGood = useCallback(() => addDecision('good'), [addDecision]);
  const addBad = useCallback(() => addDecision('bad'), [addDecision]);

  return useMemo(() => ({
    decisions,
    goodCount,
    badCount,
    totalCount,
    greenShare,
    redShare,
    fillPercent,
    distortionIntensity,
    addDecision,
    addGood,
    addBad,
    undo,
    whatIfMode,
    toggleWhatIf,
    capacity,
  }), [decisions, goodCount, badCount, totalCount, greenShare, redShare, fillPercent, distortionIntensity, addDecision, addGood, addBad, undo, whatIfMode, toggleWhatIf, capacity]);
}
