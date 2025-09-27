import React from 'react';
import { adjustColor, mixDecisionColor } from './Jar';

interface TopBarProps {
  good: number;
  bad: number;
  greenShare: number;
  total: number;
}

export const TopBar: React.FC<TopBarProps> = ({ good, bad, greenShare, total }) => {
  const balance = good - bad;
  const totalCount = total;
  const goodPercent = totalCount > 0 ? Math.round(greenShare * 100) : 0;
  const badPercent = totalCount > 0 ? 100 - goodPercent : 0;
  const balanceColor = mixDecisionColor(greenShare);
  const accentColor = adjustColor(balanceColor, 0.2);

  return (
    <div className="w-full flex justify-center px-4 pt-4 text-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/45 backdrop-blur-xl px-5 pt-4 pb-5 shadow-[0_20px_40px_rgba(12,12,28,0.35)]">
        <div className="flex justify-between items-center">
          <div aria-live="polite" aria-atomic="true" className="font-semibold">
            Balance: {balance > 0 ? '+' : ''}{balance}
          </div>
          <div className="flex gap-4 text-xs uppercase tracking-wide text-white/70">
            <span className="text-goodGreen font-medium">Good {good}</span>
            <span className="text-badRed font-medium">Bad {bad}</span>
          </div>
        </div>
        {/* Prominent percentage display (good % of total) */}
        <div className="mt-2 flex justify-center">
          <div
            className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${accentColor}, ${balanceColor})`,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))'
            }}
            aria-label={`${goodPercent} percent good decisions`}
          >
            {goodPercent}%
          </div>
        </div>
        <div className="mt-3 flex justify-between text-[0.7rem] text-white/60">
          <span>{goodPercent}% good</span>
          <span>{badPercent}% bad</span>
        </div>
        <div
          className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/12"
          role="progressbar"
          aria-label="Good decision percentage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={goodPercent}
        >
          <span
            className="block h-full transition-all duration-500 ease-out"
            style={{
              width: `${goodPercent}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${balanceColor})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
