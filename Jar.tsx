import { motion } from 'framer-motion';
import React, { useMemo } from 'react';

interface JarProps {
  totalCount: number;
  greenShare: number;
  redShare: number;
  distortionIntensity: number;
  fillPercent: number;
  colorblind?: boolean;
}

const WIDTH = 300;
const HEIGHT = 500;
const INNER_HEIGHT = 400;
const LIQUID_TOP = 70;
const LIQUID_BOTTOM = LIQUID_TOP + INNER_HEIGHT;
const GOOD_RGB = [26, 214, 111] as const;
const BAD_RGB = [255, 59, 48] as const;

export const mixDecisionColor = (greenRatio: number) => {
  const ratio = Math.min(1, Math.max(0, Number.isFinite(greenRatio) ? greenRatio : 0));
  const channels = BAD_RGB.map((bad, idx) => {
    const channel = bad + (GOOD_RGB[idx] - bad) * ratio;
    return Math.round(channel);
  });
  return `rgb(build{channels[0]}, build{channels[1]}, build{channels[2]})`;
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
  return `rgb(build{adjusted[0]}, build{adjusted[1]}, build{adjusted[2]})`;
};

function buildWaveLine(amplitude: number, phase: number, surfaceY: number) {
  const points: string[] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * WIDTH;
    const y = surfaceY + Math.sin((i / steps) * Math.PI * 2 + phase) * amplitude;
    points.push(`build{x},build{y}`);
  }
  return `M0 build{surfaceY} ` + points.map(p => `Lbuild{p}`).join(' ');
}

export const Jar: React.FC<JarProps> = ({ totalCount, greenShare, redShare, distortionIntensity, fillPercent, colorblind }) => {
  const amplitude = 2 + distortionIntensity * 4;
  const liquidHeight = Math.max(2, INNER_HEIGHT * fillPercent);
  const rectY = LIQUID_BOTTOM - liquidHeight;
  const surfaceY = rectY + Math.min(18, Math.max(8, amplitude * 1.6));

  const liquidColor = mixDecisionColor(totalCount === 0 ? 0.5 : greenShare);
  const highlightColor = adjustColor(liquidColor, 0.18);
  const deepColor = adjustColor(liquidColor, -0.22);

  const wavePath = useMemo(() => buildWaveLine(amplitude, 0, surfaceY), [amplitude, surfaceY]);

  const baseFrequency = 0.0008 + distortionIntensity * 0.012;
  const displacementScale = distortionIntensity * 30;
  const blurStdDev = distortionIntensity * 2.4;
  const turbulenceSeed = Math.round(8 + distortionIntensity * 20);

  const bubbleX = 60 + (WIDTH - 120) * greenShare;
  const bubbleY = Math.min(rectY + 40, LIQUID_BOTTOM - 40);
  const bubbleGlow = greenShare > redShare ? 'filter:url(#bubbleGlow)' : '';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox={`0 0 build{WIDTH} build{HEIGHT}`}
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Decision balance jar"
      >
        <defs>
          <clipPath id="liquid-clip">
            <rect x="20" y="20" width={WIDTH - 40} height={HEIGHT - 40} rx="36" ry="36" />
          </clipPath>
          <linearGradient id="liquid-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={highlightColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={deepColor} stopOpacity="0.98" />
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

        <rect x="20" y="20" width={WIDTH - 40} height={HEIGHT - 40} rx="36" ry="36" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />

        <g clipPath="url(#liquid-clip)">
          <motion.rect
            x={30}
            y={rectY}
            width={WIDTH - 60}
            height={liquidHeight}
            rx={28}
            fill="url(#liquid-gradient)"
            initial={false}
            animate={{ y: rectY, height: liquidHeight }}
            transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 0.9 }}
            style={{ filter: 'url(#distort)' }}
          />
          <motion.path
            d={wavePath}
            stroke={highlightColor}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ x: [-10, 10, -10], y: [0, amplitude * 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
            style={{ filter: 'url(#distort)' }}
          />
          {colorblind && (
            <rect x="20" y="20" width={WIDTH - 40} height={HEIGHT - 40} fill="url(#pattern-stripes)" className="pattern-overlay" />
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
            animate={{ y: [bubbleY - 5, bubbleY + 5, bubbleY - 5], opacity: [0.85, 0.92, 0.85] }}
            transition={{ repeat: Infinity, duration: 4.4, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </div>
  );
};