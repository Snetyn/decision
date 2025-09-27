import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type DecisionType = 'good' | 'bad';
export interface DecisionEntry { id: number; timestamp: string; type: DecisionType; }

// Storage keys (v2 introduces day partitioning)
const STORAGE_KEY_V2 = 'decisions_v2';
const HISTORY_KEY = 'decision_history_v1';

interface UseDecisionsOptions { capacity?: number; historyLimit?: number }

export interface DaySummary { date: string; good: number; bad: number; total: number; goodPercent: number; }

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
  resetToday: () => void;
  history: DaySummary[];
  clearHistory: () => void;
}

function todayKey() { return new Date().toISOString().slice(0,10); }

interface PersistShapeV2 { currentDate: string; decisions: DecisionEntry[] }

function loadV2(): PersistShapeV2 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) {
      // Attempt migration from v1 flat array
      const legacy = localStorage.getItem('decisions_v1');
      if (legacy) {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr)) return { currentDate: todayKey(), decisions: arr as DecisionEntry[] };
      }
      return { currentDate: todayKey(), decisions: [] };
    }
    const parsed = JSON.parse(raw) as PersistShapeV2;
    if (!parsed.currentDate) return { currentDate: todayKey(), decisions: parsed.decisions || [] };
    return parsed;
  } catch {
    return { currentDate: todayKey(), decisions: [] };
  }
}

function persistV2(data: PersistShapeV2) { try { localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data)); } catch {} }

function loadHistory(): DaySummary[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as DaySummary[];
    return [];
  } catch { return []; }
}

function persistHistory(h: DaySummary[]) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {} }

export function useDecisions(opts: UseDecisionsOptions = {}): UseDecisionsResult {
  const capacity = opts.capacity ?? 100;
  const historyLimit = opts.historyLimit ?? 30;

  const initial = loadV2();
  const [currentDate, setCurrentDate] = useState(initial.currentDate);
  const [decisions, setDecisions] = useState<DecisionEntry[]>(initial.decisions);
  const [history, setHistory] = useState<DaySummary[]>(() => loadHistory());
  const [whatIfMode, setWhatIfMode] = useState(false);
  const dateRef = useRef(currentDate);
  dateRef.current = currentDate;

  // Archive current day summary into history
  const archiveDay = useCallback((date: string, decs: DecisionEntry[]) => {
    if (!decs.length) return; // don't archive empty days
    const good = decs.filter(d => d.type === 'good').length;
    const bad = decs.filter(d => d.type === 'bad').length;
    const total = decs.length;
    const summary: DaySummary = { date, good, bad, total, goodPercent: total ? good/total : 0 };
    setHistory(prev => {
      const next = [summary, ...prev.filter(h => h.date !== date)].slice(0, historyLimit);
      persistHistory(next);
      return next;
    });
  }, [historyLimit]);

  const rolloverCheck = useCallback(() => {
    const today = todayKey();
    if (today !== dateRef.current) {
      // date changed -> archive old, reset
      archiveDay(dateRef.current, decisions);
      setDecisions([]);
      setCurrentDate(today);
    }
  }, [archiveDay, decisions]);

  // Persist after any change
  useEffect(() => { persistV2({ currentDate, decisions }); }, [currentDate, decisions]);

  // Rollover on mount (in case date changed while app closed) & setup midnight timer
  useEffect(() => {
    rolloverCheck();
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1).getTime() - now.getTime();
    const timer = window.setTimeout(() => { rolloverCheck(); }, msToMidnight + 1000);
    return () => window.clearTimeout(timer);
  }, [rolloverCheck]);

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
    rolloverCheck();
    setDecisions((prev: DecisionEntry[]) => {
      const next: DecisionEntry[] = [...prev, { id: prev.length ? prev[prev.length - 1].id + 1 : 1, timestamp: new Date().toISOString(), type }];
      return next;
    });
  }, [rolloverCheck]);

  const undo = useCallback(() => {
    rolloverCheck();
    setDecisions((prev: DecisionEntry[]) => prev.slice(0, -1));
  }, [rolloverCheck]);

  const resetToday = useCallback(() => {
    archiveDay(currentDate, decisions);
    setDecisions([]);
    setCurrentDate(todayKey());
  }, [archiveDay, currentDate, decisions]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    persistHistory([]);
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
    resetToday,
    history,
    clearHistory,
  }), [decisions, goodCount, badCount, totalCount, greenShare, redShare, fillPercent, distortionIntensity, addDecision, addGood, addBad, undo, whatIfMode, toggleWhatIf, capacity, resetToday, history, clearHistory]);
}
