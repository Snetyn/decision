import React from 'react';
import { DaySummary } from '../hooks/useDecisions';

interface Props {
  open: boolean;
  onClose: () => void;
  onResetToday: () => void;
  onClearHistory: () => void;
  history: DaySummary[];
}

export const SettingsPanel: React.FC<Props> = ({ open, onClose, onResetToday, onClearHistory, history }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-white/15 bg-neutral-900/85 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
            className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs bg-white/10 hover:bg-white/20"
            aria-label="Close settings"
        >✕</button>
        <h2 className="text-lg font-semibold mb-4">Settings & History</h2>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          <section>
            <h3 className="text-sm font-medium mb-2 tracking-wide uppercase text-white/70">Today</h3>
            <button
              onClick={onResetToday}
              className="w-full rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 px-4 py-2 text-amber-200 text-sm font-medium"
            >Archive & Reset Day</button>
          </section>
          <section>
            <h3 className="text-sm font-medium mb-2 tracking-wide uppercase text-white/70">History (last {history.length})</h3>
            {history.length === 0 && <p className="text-xs text-white/40">No previous days recorded yet.</p>}
            <ul className="space-y-1 text-xs">
              {history.map(h => (
                <li key={h.date} className="flex justify-between rounded bg-white/5 px-3 py-2">
                  <span className="font-mono">{h.date}</span>
                  <span className="text-white/70">{Math.round(h.goodPercent*100)}% <span className="text-goodGreen">G</span>/{h.good+h.bad}</span>
                </li>
              ))}
            </ul>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="mt-3 w-full rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 px-4 py-2 text-red-200 text-xs font-medium"
              >Clear History</button>
            )}
          </section>
          <section>
            <h3 className="text-sm font-medium mb-2 tracking-wide uppercase text-white/70">Info</h3>
            <p className="text-xs leading-relaxed text-white/50">
              Each day automatically archives at midnight (local time). "Archive & Reset Day" lets you manually force the rollover early.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};