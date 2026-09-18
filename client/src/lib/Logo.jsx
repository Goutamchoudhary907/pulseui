// The Pulse UI mark: a solid black tile with one white pulse across it —
// flat line, one beat, flat line. Solid black reads at any size, in any
// tab, next to any accent color. The tile breathes at idle; put
// `pui-logo-link` on a hovered ancestor and the pulse redraws itself
// (index.css).
export default function Logo({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`pui-logo ${className}`} aria-hidden="true">
      <rect className="pui-tile" x="1" y="1" width="30" height="30" rx="8.5" fill="#1c1917" />
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
