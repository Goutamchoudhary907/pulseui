import { useId } from 'react';

// The Pulseui mark: a monoline P drawn as a comet — faint through the bowl,
// brightening down the stem to a lit foot. A glint idles along it; put
// `pui-logo-link` on a hovered ancestor and the P redraws itself (index.css).
//
// The viewBox is cropped to the glyph so `size` is the mark's real height
// and it sits flush against the wordmark.
const P = 'M11 16 H17 A5 5 0 0 0 17 6 H11 V26';
const V = '#7c3aed';
const BOX = { x: 8, y: 3, w: 17, h: 26 };

export default function Logo({ size = 26, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const glow = `pui-glow-${uid}`;
  const fade = `pui-fade-${uid}`;
  return (
    <svg
      viewBox={`${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`}
      width={Math.round((size * BOX.w) / BOX.h)}
      height={size}
      overflow="visible"
      className={`pui-logo ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        {/* trail: faint at the top of the bowl, solid at the foot */}
        <linearGradient id={fade} gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="26">
          <stop offset="0" stopColor={V} stopOpacity="0.22" />
          <stop offset="0.5" stopColor={V} stopOpacity="0.38" />
          <stop offset="0.78" stopColor={V} stopOpacity="0.72" />
          <stop offset="1" stopColor={V} stopOpacity="1" />
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path className="cp-draw" d={P} pathLength="100" strokeDasharray="100 100" strokeDashoffset="0" stroke={`url(#${fade})`} />
        <path className="cp-head" d={P} pathLength="100" strokeDasharray="18 82" strokeDashoffset="-82" stroke={V} filter={`url(#${glow})`} opacity=".8" />
        <path className="cp-core" d={P} pathLength="100" strokeDasharray="6 94" strokeDashoffset="-94" stroke="#fff" strokeWidth="1.4" opacity=".7" />
        <path className="cp-glint" d={P} pathLength="100" strokeDasharray="6 94" stroke="#fff" strokeWidth="1.4" opacity=".6" />
      </g>
      <g className="cp-foot">
        <circle cx="11" cy="26" r="5" fill={V} opacity=".18" />
        <circle cx="11" cy="26" r="2.4" fill={V} />
        <circle cx="11" cy="26" r="1.1" fill="#fff" opacity=".9" />
      </g>
    </svg>
  );
}
