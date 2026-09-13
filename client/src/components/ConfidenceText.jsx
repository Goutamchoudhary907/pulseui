import { useEffect } from 'react';

/**
 * ConfidenceText
 *
 * Low-confidence tokens get a faint chromatic flicker — a red/cyan split
 * that jitters like a badly-tracked VHS frame — instead of a hedge badge
 * or footnote. The uncertainty is felt before it's read. The lower the
 * confidence, the harder the shimmer.
 *
 * Zero dependencies — plain spans + a CSS keyframe injected once.
 *
 * Props:
 *  - tokens ([{ text, confidence }] | string[]): tokens to render. A plain
 *      string is treated as confidence 1. Tokens are joined with a space.
 *  - threshold (number): confidence below this shimmers. Default 0.6.
 *  - showScores (bool): add a `title` tooltip with the score. Default true.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-confidence-text';
const CSS = `
.pui-shimmer {
  position: relative;
  border-radius: 2px;
  animation:
    pui-shimmer-split var(--pui-d, 1.4s) ease-in-out infinite,
    pui-shimmer-flicker calc(var(--pui-d, 1.4s) * 1.7) steps(1, end) infinite;
  animation-delay: var(--pui-delay, 0s), calc(var(--pui-delay, 0s) * 0.6);
}
@keyframes pui-shimmer-split {
  0%, 100% {
    text-shadow:
      -0.5px 0 0 rgba(255, 45, 120, var(--pui-a)),
       0.5px 0 0 rgba(0, 200, 255, var(--pui-a));
  }
  22% {
    text-shadow:
      -1.6px  0.3px 0 rgba(255, 45, 120, var(--pui-a)),
       1.6px -0.3px 0 rgba(0, 200, 255, var(--pui-a));
  }
  38% {
    text-shadow:
      -0.3px 0 0 rgba(255, 45, 120, var(--pui-a)),
       0.3px 0 0 rgba(0, 200, 255, var(--pui-a));
  }
  61% {
    text-shadow:
      -2.1px -0.4px 0 rgba(255, 45, 120, var(--pui-a)),
       2.1px  0.4px 0 rgba(0, 200, 255, var(--pui-a));
  }
  77% {
    text-shadow:
      -0.8px 0 0 rgba(255, 45, 120, var(--pui-a)),
       0.8px 0 0 rgba(0, 200, 255, var(--pui-a));
  }
}
@keyframes pui-shimmer-flicker {
  0%, 100% { opacity: 1; }
  13%      { opacity: calc(1 - var(--pui-f) * 0.55); }
  15%      { opacity: 1; }
  47%      { opacity: calc(1 - var(--pui-f) * 0.3); }
  49%      { opacity: 1; }
  71%      { opacity: calc(1 - var(--pui-f) * 0.7); }
  72%      { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pui-shimmer {
    animation: none;
    text-decoration: underline dotted rgba(255, 45, 120, 0.7);
    text-underline-offset: 3px;
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

export default function ConfidenceText({
  tokens = [],
  threshold = 0.6,
  showScores = true,
  className,
  style,
}) {
  useInjectedStyle();

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {tokens.map((raw, i) => {
        const t = typeof raw === 'string' ? { text: raw, confidence: 1 } : raw;
        const gap = i < tokens.length - 1 ? ' ' : '';
        const low = t.confidence < threshold;

        if (!low) {
          return (
            <span key={i}>
              {t.text}
              {gap}
            </span>
          );
        }

        // 0 → barely below threshold, 1 → confidence 0
        const strength = Math.min(1, (threshold - t.confidence) / threshold);
        const vars = {
          '--pui-a': (0.35 + strength * 0.55).toFixed(2),
          '--pui-f': strength.toFixed(2),
          '--pui-d': `${(1.7 - strength * 1.0).toFixed(2)}s`,
          // stagger by token index so neighbouring tokens don't flicker in sync
          '--pui-delay': `-${((i * 0.37) % 1.5).toFixed(2)}s`,
        };

        return (
          <span key={i}>
            <span
              className="pui-shimmer"
              style={vars}
              title={showScores ? `confidence ${Math.round(t.confidence * 100)}%` : undefined}
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
