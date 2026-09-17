import { useId } from 'react';

// The Pulse UI mark: a solid violet tile with one white pulse across it —
// flat line, one beat, flat line. Nothing hollow, so it reads at 16px in a
// tab. The tile breathes at idle; put `pui-logo-link` on a hovered ancestor
// and the pulse redraws itself (index.css).
export default function Logo({ size = 24, className = '' }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`pui-logo ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.6" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect className="pui-tile" x="1" y="1" width="30" height="30" rx="8.5" fill={`url(#${id}-g)`} />
      <path
        className="pui-pulse"
        d="M6 17 L11 17 L14 9 L18.5 24 L21.5 17 L26 17"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
      />
    </svg>
  );
}
