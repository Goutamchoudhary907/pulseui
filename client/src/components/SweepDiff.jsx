import { useEffect } from 'react';

/**
 * SweepDiff
 *
 * A standard green/red code diff — until it's accepted. Then a bright beam
 * scans down the block: as it passes, every removed line's characters
 * scatter and fall away and the row collapses shut, while every added
 * line's characters snap into place out of a blur with a green flash.
 * The diff literally *becomes* the final code in front of the user.
 *
 * Zero dependencies — spans + CSS keyframes injected once.
 *
 * Props:
 *  - lines ([{ type: 'add' | 'remove' | 'context', content }]): the diff.
 *  - accepted (bool): flip to true to run the sweep. Flip back to reset.
 *  - lineMs (number): beam time per line, ms. Default 110.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-sweep-diff';
const CSS = `
.pui-diff {
  position: relative;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 24px;
  color: #44403c;
  background: #ffffff;
  --pui-add-bg: #dcfce7;
  --pui-add: #166534;
  --pui-add-hot: #86efac;
  --pui-add-glow: rgba(34, 197, 94, 0.85);
  --pui-del-bg: #fee2e2;
  --pui-del: #991b1b;
}
.pui-diff-line {
  position: relative;
  display: flex;
  height: 24px;
  padding: 0 14px;
  white-space: pre;
  overflow: hidden;
}
.pui-diff-add { background: var(--pui-add-bg); color: var(--pui-add); }
.pui-diff-del { background: var(--pui-del-bg); color: var(--pui-del); }
.pui-diff-gutter {
  width: 18px;
  flex: none;
  opacity: 0.7;
  user-select: none;
}
.pui-diff-ch { display: inline-block; }

/* ---- accepted: the beam ---- */
.pui-diff.is-accepted::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -64px;
  height: 64px;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(34, 197, 94, 0.18) 38%,
    rgba(187, 247, 208, 0.75) 50%,
    rgba(34, 197, 94, 0.18) 62%,
    transparent
  );
  animation: pui-beam var(--pui-sweep) linear forwards;
}

/* ---- accepted: removed lines scatter, then collapse ---- */
.pui-diff.is-accepted .pui-diff-del .pui-diff-ch {
  animation: pui-scatter 460ms cubic-bezier(0.5, 0, 0.85, 0.45) forwards;
  animation-delay: calc(var(--d) + var(--c) * 5ms);
}
.pui-diff.is-accepted .pui-diff-del .pui-diff-gutter {
  animation: pui-scatter 460ms cubic-bezier(0.5, 0, 0.85, 0.45) forwards;
  animation-delay: var(--d);
}
.pui-diff.is-accepted .pui-diff-del {
  animation: pui-collapse 300ms ease-in forwards;
  animation-delay: calc(var(--d) + 560ms);
}

/* ---- accepted: added lines materialize + flash ---- */
.pui-diff.is-accepted .pui-diff-add .pui-diff-ch {
  animation: pui-materialize 560ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  animation-delay: calc(var(--d) + var(--c) * 7ms);
}
.pui-diff.is-accepted .pui-diff-add {
  animation: pui-flash 1000ms ease-out both;
  animation-delay: var(--d);
}
.pui-diff.is-accepted .pui-diff-add .pui-diff-gutter {
  animation: pui-pop 500ms cubic-bezier(0.2, 1.4, 0.3, 1) both;
  animation-delay: var(--d);
}

@keyframes pui-beam {
  to { top: 100%; }
}
@keyframes pui-scatter {
  0%   { transform: none; opacity: 1; filter: blur(0); }
  100% { transform: translate(var(--sx), 16px) rotate(var(--rot)); opacity: 0; filter: blur(1.5px); }
}
@keyframes pui-collapse {
  to { height: 0; }
}
@keyframes pui-materialize {
  0%   { opacity: 0; transform: translateY(-8px) scale(1.2); filter: blur(5px); text-shadow: 0 0 14px var(--pui-add-glow); }
  55%  { opacity: 1; transform: none; filter: blur(0); text-shadow: 0 0 10px var(--pui-add-glow); }
  100% { text-shadow: 0 0 0 transparent; }
}
@keyframes pui-flash {
  0%   { background: var(--pui-add-hot); box-shadow: inset 3px 0 0 #16a34a; }
  100% { background: var(--pui-add-bg); box-shadow: inset 3px 0 0 transparent; }
}
@keyframes pui-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  100% { transform: scale(1); opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  .pui-diff.is-accepted::after,
  .pui-diff.is-accepted .pui-diff-ch,
  .pui-diff.is-accepted .pui-diff-gutter,
  .pui-diff.is-accepted .pui-diff-add { animation: none; }
  .pui-diff.is-accepted .pui-diff-del { animation: none; display: none; }
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

export default function SweepDiff({
  lines = [],
  accepted = false,
  lineMs = 110,
  className,
  style,
}) {
  useInjectedStyle();
  const sweep = Math.max(500, lines.length * lineMs);

  return (
    <div
      className={`pui-diff ${accepted ? 'is-accepted' : ''} ${className || ''}`}
      style={{ '--pui-sweep': `${sweep}ms`, ...style }}
    >
      {lines.map((l, i) => {
        const type = l.type === 'remove' ? 'del' : l.type === 'add' ? 'add' : 'ctx';
        const gutter = type === 'add' ? '+' : type === 'del' ? '−' : ' ';
        const content = String(l.content ?? '');
        return (
          <div
            key={i}
            className={`pui-diff-line pui-diff-${type}`}
            style={{ '--d': `${Math.round((i / lines.length) * sweep)}ms` }}
          >
            <span className="pui-diff-gutter">{gutter}</span>
            <span>
              {type === 'ctx'
                ? content
                : [...content].map((ch, c) => (
                    <span
                      key={c}
                      className="pui-diff-ch"
                      style={{
                        '--c': c,
                        // deterministic per-character scatter so re-renders stay stable
                        '--sx': `${((i * 7 + c * 13) % 13) - 6}px`,
                        '--rot': `${((i * 3 + c * 5) % 25) - 12}deg`,
                      }}
                    >
                      {ch}
                    </span>
                  ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
