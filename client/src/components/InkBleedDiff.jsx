import { useEffect, useId } from 'react';

/**
 * InkBleedDiff
 *
 * A code diff that, once accepted, has its added lines soak into the page
 * like ink bleeding into paper. Each hunk of added lines gets one organic
 * pool of ink that spreads from the gutter: feathered, fibrous inside, with
 * the darker "coffee-ring" rim real ink dries with, and a few satellite
 * splatters. The text darkens and sharpens under it like ink drying.
 * Removed lines get a rust wash that fades while the text drains out.
 *
 * Zero dependencies — spans + one SVG filter per colour + CSS keyframes.
 *
 * Props:
 *  - lines ([{ type: 'add' | 'remove' | 'context', content }]): the diff.
 *  - accepted (bool): flip to true to start the bleed. Default false.
 *  - inkColor (string): colour for added lines. Default a deep green ink.
 *  - removeColor (string): colour for removed lines. Default rust.
 *  - paper (bool): warm paper background + fibre grain. Default true.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-ink-bleed-diff';
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8 0.25' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.25 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

const CSS = `
.pui-ink {
  position: relative;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.75;
  color: #57534e;
  --pui-ink: #14532d;
  --pui-rust: #9a3412;
}
.pui-ink.has-paper {
  background: #fdfcf8;
}
.pui-ink.has-paper::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  mix-blend-mode: multiply;
  background-image: ${GRAIN};
}
.pui-ink-hunk {
  position: relative;
  isolation: isolate;
}
.pui-ink-line {
  display: flex;
  padding: 0 14px;
  white-space: pre;
}
.pui-ink-gutter {
  width: 18px;
  flex: none;
  user-select: none;
  color: #a8a29e;
  transition: color 0.5s ease var(--pui-h);
}
.pui-ink-text {
  position: relative;
  transition: color 0.8s ease;
}
/* one blot per hunk: filtered wrapper roughens + rims the edge,
   the clipped pseudo-element grows */
.pui-ink-blot {
  position: absolute;
  inset: -5px -2px;
  z-index: -1;
  pointer-events: none;
}
.pui-ink-blot::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--pui-blot);
  opacity: var(--pui-blot-a);
  clip-path: ellipse(0% 0% at 2% 30%);
}
.pui-ink-blot::after {
  /* satellite splatters, revealed after the main pool has spread */
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  background:
    radial-gradient(circle at 58% 12%, var(--pui-blot) 0 2px, transparent 2.6px),
    radial-gradient(circle at 71% 78%, var(--pui-blot) 0 1.4px, transparent 2px),
    radial-gradient(circle at 86% 36%, var(--pui-blot) 0 2.4px, transparent 3px),
    radial-gradient(circle at 93% 64%, var(--pui-blot) 0 1.2px, transparent 1.7px),
    radial-gradient(circle at 47% 90%, var(--pui-blot) 0 1.6px, transparent 2.2px);
}
.is-accepted .pui-ink-blot::before {
  animation: pui-bleed 2s cubic-bezier(0.12, 0.6, 0.18, 1) forwards;
  animation-delay: var(--pui-h);
}
.is-accepted .pui-ink-blot::after {
  animation: pui-splat 0.6s ease forwards;
  animation-delay: calc(var(--pui-h) + 0.75s);
}
/* added: text dries in — wet glow + blur → sharp ink */
.pui-ink-hunk-add.is-accepted .pui-ink-gutter { color: var(--pui-ink); }
.pui-ink-hunk-add.is-accepted .pui-ink-text {
  color: var(--pui-ink);
  transition-delay: calc(var(--pui-h) + var(--i) * 90ms + 120ms);
  animation: pui-dry 1.3s ease forwards;
  animation-delay: calc(var(--pui-h) + var(--i) * 90ms + 120ms);
}
/* removed: rust wash fades while the text drains and gets struck */
.pui-ink-hunk-remove .pui-ink-blot { --pui-blot-a: 0.18; }
.pui-ink-hunk-remove.is-accepted .pui-ink-blot {
  animation: pui-wash-fade 1.6s ease forwards;
  animation-delay: calc(var(--pui-h) + 1.2s);
}
.pui-ink-hunk-remove.is-accepted .pui-ink-gutter { color: var(--pui-rust); }
.pui-ink-hunk-remove.is-accepted .pui-ink-text {
  color: var(--pui-rust);
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  text-decoration-skip-ink: none;
  transition-delay: calc(var(--pui-h) + var(--i) * 90ms + 120ms);
  animation: pui-drain 1.4s ease forwards;
  animation-delay: calc(var(--pui-h) + var(--i) * 90ms + 1s);
}
@keyframes pui-bleed {
  /* stops short of the right edge so the pool ends in a ragged arc */
  to { clip-path: ellipse(90% 190% at 2% 30%); }
}
@keyframes pui-splat {
  to { opacity: 0.5; }
}
@keyframes pui-dry {
  0%   { text-shadow: 0 0 3px var(--pui-ink); filter: blur(0.6px); }
  100% { text-shadow: 0 0 0 transparent; filter: blur(0); }
}
@keyframes pui-wash-fade {
  to { opacity: 0.35; }
}
@keyframes pui-drain {
  to { opacity: 0.3; filter: blur(0.4px) grayscale(0.4); }
}
@media (prefers-reduced-motion: reduce) {
  .pui-ink *, .pui-ink *::before, .pui-ink *::after {
    animation-duration: 0.01s !important;
    transition-duration: 0.01s !important;
  }
}
`;

function useInjectedStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

// Consecutive lines of the same type become one hunk (one blot).
function groupHunks(lines) {
  const hunks = [];
  for (const l of lines) {
    const type = l.type || 'context';
    const last = hunks[hunks.length - 1];
    if (last && last.type === type) last.lines.push(l);
    else hunks.push({ type, lines: [l] });
  }
  return hunks;
}

// Roughens the blot edge, soaks it with paper fibre, and adds the darker
// rim that real ink dries with (blot minus an eroded copy of itself).
function InkFilter({ id, color }) {
  return (
    <filter id={id} x="-15%" y="-40%" width="130%" height="180%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="4" seed="11" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" result="rough" />
      <feGaussianBlur in="rough" stdDeviation="0.7" result="soft" />
      <feTurbulence type="fractalNoise" baseFrequency="0.9 0.14" numOctaves="3" seed="2" result="fibre" />
      <feColorMatrix in="fibre" type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1.1 0.3" result="fibreA" />
      <feComposite in="soft" in2="fibreA" operator="in" result="soak" />
      <feMorphology in="rough" operator="erode" radius="2.2" result="inner" />
      <feComposite in="rough" in2="inner" operator="out" result="rimShape" />
      <feFlood floodColor={color} floodOpacity="0.65" result="rimColor" />
      <feComposite in="rimColor" in2="rimShape" operator="in" result="rim" />
      <feGaussianBlur in="rim" stdDeviation="0.4" result="rimSoft" />
      <feMerge>
        <feMergeNode in="soak" />
        <feMergeNode in="rimSoft" />
      </feMerge>
    </filter>
  );
}

export default function InkBleedDiff({
  lines = [],
  accepted = false,
  inkColor = '#14532d',
  removeColor = '#9a3412',
  paper = true,
  className,
  style,
}) {
  useInjectedStyle();
  const base = `pui-ink-${useId().replace(/:/g, '')}`;
  const hunks = groupHunks(lines);

  let blotIndex = 0; // stagger blots in reading order

  return (
    <div
      className={`pui-ink ${paper ? 'has-paper' : ''} ${className || ''}`}
      style={{ '--pui-ink': inkColor, '--pui-rust': removeColor, ...style }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <InkFilter id={`${base}-add`} color={inkColor} />
        <InkFilter id={`${base}-remove`} color={removeColor} />
      </svg>

      {hunks.map((h, hi) => {
        const inked = h.type !== 'context';
        const delay = inked ? `${blotIndex++ * 260}ms` : '0ms';
        const gutter = h.type === 'add' ? '+' : h.type === 'remove' ? '−' : ' ';
        return (
          <div
            key={hi}
            className={`pui-ink-hunk pui-ink-hunk-${h.type} ${accepted ? 'is-accepted' : ''}`}
            style={{
              '--pui-h': delay,
              '--pui-blot': h.type === 'add' ? 'var(--pui-ink)' : 'var(--pui-rust)',
              '--pui-blot-a': 0.28,
            }}
          >
            {inked && (
              <span
                className="pui-ink-blot"
                style={{ filter: `url(#${base}-${h.type})` }}
                aria-hidden
              />
            )}
            {h.lines.map((l, i) => (
              <div key={i} className="pui-ink-line" style={{ '--i': i }}>
                <span className="pui-ink-gutter">{gutter}</span>
                <span className="pui-ink-text">{l.content}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
