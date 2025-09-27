import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface JarProps {
  totalCount: number;
  greenShare: number;
  redShare: number;
  distortionIntensity: number;
  fillPercent: number;
  colorblind?: boolean;
  availableHeight?: number; // dynamic space allotted from layout
  fillTrigger?: number; // trigger counter for overshoot animation
}

const WIDTH = 300;              // Base design width
const HEIGHT = 500;             // Base design height
// New tighter padding so liquid appears larger relative to viewport
const PAD_X = 14;
const PAD_Y = 14;
const CORNER = 36;
// Inner vertical bounds for liquid (nearly full height now)
const LIQUID_TOP = PAD_Y + 6; // small breathing room for wave
const LIQUID_BOTTOM = HEIGHT - (PAD_Y + 6);
const INNER_HEIGHT = LIQUID_BOTTOM - LIQUID_TOP;
const GOOD_RGB = [26, 214, 111] as const;
const BAD_RGB = [255, 59, 48] as const;
const NEUTRAL_RGB = [130, 150, 170] as const; // Cooler neutral tone
const INTERMEDIATE_COLORS = {
  // Intermediate colors for smoother transitions
  lightGreen: [120, 200, 140] as const,
  yellow: [255, 200, 60] as const,
  orange: [255, 140, 70] as const,
  lightRed: [255, 100, 90] as const,
};

// Simplified smooth color that does not "jump" and includes transparency modulation
export const mixDecisionColor = (greenRatio: number, totalCount: number = 0) => {
  const r = Math.min(1, Math.max(0, Number.isFinite(greenRatio) ? greenRatio : 0));
  // Base blend between BAD and GOOD via perceptual-ish weighting using intermediate curve
  const curve = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x); // cosine ease for smoother mid
  const t = curve(r);
  const base = [
    BAD_RGB[0] + (GOOD_RGB[0] - BAD_RGB[0]) * t,
    BAD_RGB[1] + (GOOD_RGB[1] - BAD_RGB[1]) * t,
    BAD_RGB[2] + (GOOD_RGB[2] - BAD_RGB[2]) * t,
  ];
  // Desaturate towards neutral when total decisions low
  const intensity = Math.min(1, Math.pow(totalCount / 12, 0.75));
  const blended = base.map((c, i) => NEUTRAL_RGB[i] + (c - NEUTRAL_RGB[i]) * intensity);
  const channels = blended.map(c => Math.round(c));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
};

export const adjustColor = (color: string, factor: number) => {
  const matches = color.match(/\d+/g);
  if (!matches) return color;
  const adjusted = matches.map(value => {
    const channel = Number(value);
    const next = factor >= 0
      ? channel + (255 - channel) * factor
      : channel + channel * factor;
    return Math.max(0, Math.min(255, Math.round(next)));
  });
  return `rgb(${adjusted[0]}, ${adjusted[1]}, ${adjusted[2]})`;
};

function buildWaveLine(amplitude: number, phase: number, surfaceY: number) {
  const points: string[] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * WIDTH;
    const y = surfaceY + Math.sin((i / steps) * Math.PI * 2 + phase) * amplitude;
    points.push(`${x},${y}`);
  }
  return `M0 ${surfaceY} ` + points.map(p => `L${p}`).join(' ');
}

// Hook to smoothly approach a target number (for fill and ratio smoothing)
function useSmoothed(target: number, speed = 5) {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;
  useEffect(() => {
    const tick = (t: number) => {
      setValue(v => {
        const delta = targetRef.current - v;
        const step = delta * Math.min(1, speed * 0.016); // assume ~60fps
        const next = Math.abs(delta) < 0.0005 ? targetRef.current : v + step;
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [speed]);
  return value;
}

export const Jar: React.FC<JarProps> = ({ totalCount, greenShare, redShare, distortionIntensity, fillPercent, colorblind, availableHeight, fillTrigger }) => {
  // Smoothed fill & ratio so liquid rises gradually and color does not flicker
  const baseFill = useSmoothed(fillPercent, 2.2);
  const smoothGreen = useSmoothed(totalCount === 0 ? 0.5 : greenShare, 3);
  
  // Overshoot animation: briefly spike fill when fillTrigger changes
  const [overshootFill, setOvershootFill] = useState(baseFill);
  
  useEffect(() => {
    if (fillTrigger && fillTrigger > 0) {
      // Spike up then settle back
      const overshoot = Math.min(1, baseFill + 0.15); // 15% overshoot
      setOvershootFill(overshoot);
      const timer = setTimeout(() => setOvershootFill(baseFill), 280);
      return () => clearTimeout(timer);
    }
  }, [fillTrigger, baseFill]);
  
  const smoothFill = useSmoothed(overshootFill, 4.5); // faster response for overshoot effect

  const amplitude = 2 + distortionIntensity * 4;
  const liquidHeight = Math.max(2, INNER_HEIGHT * smoothFill);
  const rectY = LIQUID_BOTTOM - liquidHeight;
  const surfaceY = rectY + Math.min(18, Math.max(8, amplitude * 1.6));

  const liquidColor = mixDecisionColor(smoothGreen, totalCount);
  const highlightColor = adjustColor(liquidColor, 0.18);
  const deepColor = adjustColor(liquidColor, -0.22);

  const wavePath = useMemo(() => buildWaveLine(amplitude, 0, surfaceY), [amplitude, surfaceY]);

  const baseFrequency = 0.0008 + distortionIntensity * 0.012;
  const displacementScale = distortionIntensity * 30;
  const blurStdDev = distortionIntensity * 2.4;
  const turbulenceSeed = Math.round(8 + distortionIntensity * 20);

  const bubbleX = 60 + (WIDTH - 120) * smoothGreen;
  const bubbleY = Math.min(rectY + 40, LIQUID_BOTTOM - 40);
  const bubbleGlow = smoothGreen > redShare ? 'filter:url(#bubbleGlow)' : '';

  // Compute scaled height for SVG to fit availableHeight while keeping aspect ratio
  const aspect = HEIGHT / WIDTH;
  const targetH = availableHeight && availableHeight > 0 ? Math.min(availableHeight, HEIGHT * 1.2) : HEIGHT;
  const targetW = targetH / aspect;

  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ height: targetH, width: '100%' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ height: '100%', width: '100%', maxHeight: targetH, maxWidth: '100vw' }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Decision balance jar"
      >
        <defs>
          <clipPath id="liquid-clip">
            <rect x={PAD_X} y={PAD_Y} width={WIDTH - PAD_X * 2} height={HEIGHT - PAD_Y * 2} rx={CORNER} ry={CORNER} />
          </clipPath>
          <linearGradient id="liquid-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={highlightColor} stopOpacity={0.95} />
            <stop offset="100%" stopColor={deepColor} stopOpacity={0.98} />
          </linearGradient>
          <filter id="distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="3" seed={turbulenceSeed} result="turb" />
            <feDisplacementMap in="SourceGraphic" in2="turb" scale={displacementScale} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation={blurStdDev} />
          </filter>
          <filter id="bubbleGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 1  0 0 0 0 0.5  0 0 0 1 0" result="col" />
            <feMerge>
              <feMergeNode in="col" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {colorblind && (
            <pattern id="pattern-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="rgba(255,255,255,0.25)" />
            </pattern>
          )}
        </defs>

  <rect x={PAD_X} y={PAD_Y} width={WIDTH - PAD_X * 2} height={HEIGHT - PAD_Y * 2} rx={CORNER} ry={CORNER} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />

        <g clipPath="url(#liquid-clip)">
          <motion.rect
            x={PAD_X + 10}
            y={rectY}
            width={WIDTH - (PAD_X + 10) * 2}
            height={liquidHeight}
            rx={28}
            fill="url(#liquid-gradient)"
            initial={false}
            animate={{ y: rectY, height: liquidHeight }}
            transition={{
              y: { type: 'spring', stiffness: 120, damping: 24 },
              height: { type: 'spring', stiffness: 120, damping: 24 }
            }}
            style={{ filter: 'url(#distort)' }}
          />
          {/* Restored animated wave for perceived fluid motion */}
          <motion.path
            d={wavePath}
            stroke={highlightColor}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              x: [-12, 12, -12],
              y: [0, amplitude * 0.45, 0],
              stroke: highlightColor
            }}
            transition={{
              x: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
              y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
              stroke: { duration: 0.6 }
            }}
            style={{ filter: 'url(#distort)' }}
          />
          {colorblind && (
            <rect x={PAD_X} y={PAD_Y} width={WIDTH - PAD_X * 2} height={HEIGHT - PAD_Y * 2} fill="url(#pattern-stripes)" className="pattern-overlay" />
          )}
        </g>

        {totalCount > 0 && (
          <motion.circle
            cx={bubbleX}
            cy={bubbleY}
            r={18}
            fill={highlightColor}
            stroke={adjustColor(liquidColor, -0.35)}
            strokeWidth={2}
            opacity={0.9}
            className={bubbleGlow}
            animate={{ opacity: [0.85, 0.92, 0.85] }}
            transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </div>
  );
};
