import { motion } from 'framer-motion';
import React from 'react';

interface ControlsProps {
  onGood: () => void;
  onBad: () => void;
  onUndo: () => void;
  onToggleWhatIf: () => void;
  disabled?: boolean;
  whatIfMode: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onGood, onBad, onUndo, onToggleWhatIf, disabled, whatIfMode }) => {
  const btnClass = 'button-base flex-1 mx-1 min-h-[52px] max-w-[140px] border border-white/35 bg-transparent text-white';
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex w-full justify-center gap-3">
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }} onClick={onGood} disabled={disabled} aria-label="Log good decision" className={`${btnClass} font-semibold`}>✔️</motion.button>
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.05 }} onClick={onBad} disabled={disabled} aria-label="Log bad decision" className={`${btnClass} font-semibold`}>✖️</motion.button>
      </div>
      <div className="flex gap-3 text-sm justify-center">
        <button onClick={onUndo} className="px-4 py-2 rounded-lg border border-white/25 bg-transparent text-white/85 hover:bg-white/10 transition" aria-label="Undo last decision">Undo</button>
        <button onClick={onToggleWhatIf} className={`px-4 py-2 rounded-lg border transition ${whatIfMode ? 'border-goodGreen text-goodGreen bg-goodGreen/10' : 'border-white/25 text-white/85 hover:bg-white/10'}`} aria-pressed={whatIfMode} aria-label="Toggle what-if all good mode">What-if</button>
      </div>
    </div>
  );
};
