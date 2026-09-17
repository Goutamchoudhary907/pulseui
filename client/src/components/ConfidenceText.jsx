import { useEffect } from 'react';

/**
 * ConfidenceText
 *
 * Confident words are sharp ink. Uncertain words are literally unresolved:
 * softly out of focus, lighter, wavering under a slow heat-haze — a mirage
 * you shouldn't fully trust. The lower the confidence, the further out of
 * focus. Hover or tap a hazy word and it racks into focus with its score;
 * set `resolved` and the whole answer sharpens in a left-to-right wave —
 * the moment the model has double-checked itself.
 *
 * Zero dependencies — spans, one injected stylesheet and one hidden SVG
 * holding three heat-haze filters.
 *
 * Props:
 *  - tokens ([{ text, confidence }] | string[]): a plain string counts as
 *      confidence 1. Tokens are joined with a space.
 *  - threshold (number): confidence below this is hazy. Default 0.6.
 *  - resolved (bool): bring every token into focus. Default false.
 *  - showScores (bool): show the score when a token is focused. Default true.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-confidence-text';
const DEFS_ID = 'pulseui-confidence-defs';

const CSS = `
.pui-cf-wrap { white-space: pre-wrap; }
.pui-cf {
  position: relative;
  display: inline-block;
  border-radius: 3px;
  outline: none;
  cursor: default;
  opacity: var(--pui-o, 1);
  filter: blur(var(--pui-b, 0px)) var(--pui-haze, none);
  transition: filter 0.38s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.38s ease;
}
.pui-cf:hover, .pui-cf:focus-visible { opacity: 1; filter: blur(0); transition-delay: 0s; }
.pui-cf.is-resolved { opacity: 1; filter: blur(0); transition-delay: var(--pui-stagger, 0s); }
.pui-cf[data-score]::after {
  content: attr(data-score);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 5px);
  transform: translate(-50%, 3px);
  padding: 2px 7px;
  border-radius: 6px;
  background: #1c1917;
  color: #fff;
  font: 500 10.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.01em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.pui-cf[data-score]:hover::after, .pui-cf[data-score]:focus-visible::after { opacity: 1; transform: translate(-50%, 0); }
@media (prefers-reduced-motion: reduce) {
  .pui-cf { --pui-haze: none; transition-duration: 0.01ms; }
}
`;

// three strengths of heat-haze: a slow breathing displacement of the glyphs
const haze = (id, scale, fx, fy, dur, seed) => `
<filter id="${id}" x="-15%" y="-40%" width="130%" height="180%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="1" seed="${seed}" result="n">
    <animate attributeName="baseFrequency" values="${fx} ${fy};${fx * 1.35} ${fy * 1.25};${fx} ${fy}" dur="${dur}s" repeatCount="indefinite" />
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G" />
</filter>`;
const DEFS = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">
${haze('pui-haze-1', 1.2, 0.018, 0.08, 4.2, 3)}
${haze('pui-haze-2', 1.8, 0.022, 0.09, 3.4, 7)}
${haze('pui-haze-3', 2.6, 0.026, 0.1, 2.7, 11)}
</svg>`;

function useInjected() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    if (!document.getElementById(DEFS_ID)) {
      const host = document.createElement('div');
      host.id = DEFS_ID;
      host.innerHTML = DEFS;
      document.body.appendChild(host);
    }
  }, []);
}

export default function ConfidenceText({
  tokens = [],
  threshold = 0.6,
  resolved = false,
  showScores = true,
  className,
  style,
}) {
  useInjected();

  return (
    <span className={`pui-cf-wrap${className ? ` ${className}` : ''}`} style={style}>
      {tokens.map((raw, i) => {
        const t = typeof raw === 'string' ? { text: raw, confidence: 1 } : raw;
        const gap = i < tokens.length - 1 ? ' ' : '';
        if (t.confidence >= threshold) {
          return (
            <span key={i}>
              {t.text}
              {gap}
            </span>
          );
        }

        // 0 → just below threshold, 1 → confidence 0
        const s = Math.min(1, (threshold - t.confidence) / threshold);
        const pct = Math.round(t.confidence * 100);
        const vars = {
          '--pui-b': `${(0.3 + s * 0.7).toFixed(2)}px`,
          '--pui-o': (0.9 - s * 0.22).toFixed(2),
          '--pui-haze': `url(#pui-haze-${s < 0.33 ? 1 : s < 0.66 ? 2 : 3})`,
          '--pui-stagger': `${i * 45}ms`,
        };

        return (
          <span key={i}>
            <span
              className={`pui-cf${resolved ? ' is-resolved' : ''}`}
              style={vars}
              data-score={showScores ? `${pct}%` : undefined}
              tabIndex={showScores ? 0 : undefined}
              aria-label={`${t.text}, ${pct}% confidence`}
            >
              {t.text}
            </span>
            {gap}
          </span>
        );
      })}
    </span>
  );
}
