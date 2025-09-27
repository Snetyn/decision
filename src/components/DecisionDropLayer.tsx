import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { adjustColor, mixDecisionColor } from './Jar';

export interface DropSpec {
  id: number;
  color: 'good' | 'bad';
  drift: number;
}

interface Props {
  drops: DropSpec[];
  greenShare: number;
  redShare: number;
  totalCount: number;
}

const DROP_ANIM_DURATION = 1.25;

export const DecisionDropLayer: React.FC<Props> = ({ drops, greenShare, redShare, totalCount }) => {
  const baseColor = mixDecisionColor(greenShare, totalCount);
  const goodShade = adjustColor(baseColor, 0.22);
  const badShade = adjustColor(baseColor, -0.25);
  const dropBlur = Math.min(4, redShare * 6);

  return (
    <div className="pointer-events-none absolute inset-0 flex justify-center items-center">
      <div className="relative w-full h-full max-w-[var(--jar-max-width)] max-h-[var(--jar-max-height)]">
        <AnimatePresence>
          {drops.map(drop => {
            const color = drop.color === 'good' ? goodShade : badShade;
            return (
              <motion.span
                key={drop.id}
                className="absolute top-0 block h-5 w-5 rounded-full shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
                style={{
                  left: `calc(50% + ${drop.drift}px)`,
                  background: `radial-gradient(circle at 40% 30%, ${adjustColor(color, 0.3)}, ${color})`,
                }}
                initial={{ y: '-18%', scale: 0.45, opacity: 0.2, filter: 'blur(6px)' }}
                animate={{
                  y: ['-18%', '40%', '78%', '92%'],
                  scale: [0.45, 1.05, 0.92, 0.85],
                  opacity: [0.2, 0.95, 0.82, 0.6],
                  filter: ['blur(6px)', `blur(${dropBlur}px)`, 'blur(1.5px)', `blur(${dropBlur + 1}px)`],
                  rotate: [0, drop.drift * 0.08, drop.drift * 0.16, drop.drift * 0.2],
                }}
                transition={{ duration: DROP_ANIM_DURATION, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 0.85, 1] }}
                exit={{ opacity: 0, scale: 0.6, y: '98%', transition: { duration: 0.28, ease: 'easeOut' } }}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
