import { useEffect } from 'react';

/**
 * CodeDiff
 *
 * A standard green/red code diff — until it's decided.
 *
 * Accept: a green beam scans down the block. As it passes, every removed
 * line's characters crumble and fall and the row closes; every added
 * line's characters snap into place out of a blur with a flash. Then the
 * green drains away and the `+` gutter fades — the diff has *become* the
 * code.
 *
 * Reject: a red beam. The proposed lines blow away and close up; the
 * original lines shed their red and settle back into plain code.
 *
 * Zero dependencies — spans + CSS keyframes injected once.
 *
 * Props:
 *  - lines ([{ type: 'add' | 'remove' | 'context', content }]): the diff.
 *  - status ('pending' | 'accepted' | 'rejected'): default 'pending'.
 *      (`accepted={true}` still works as a shorthand for 'accepted'.)
 *  - lineMs (number): beam time per line, ms. Default 110.
 *  - className / style: passed to the wrapper. Theme with
 *      --pui-diff-bg / --pui-diff-fg.
 */

const STYLE_ID = 'pulseui-code-diff';
const CSS = `
.pui-diff {
  position: relative;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 24px;
  --pui-diff-bg: #ffffff;
  --pui-diff-fg: #44403c;
  --pui-add-bg: #dcfce7;
  --pui-add: #166534;
  --pui-add-hot: #86efac;
  --pui-add-glow: rgba(34, 197, 94, 0.85);
  --pui-del-bg: #fee2e2;
  --pui-del: #991b1b;
  --pui-del-hot: #fca5a5;
  color: var(--pui-diff-fg);
  background: var(--pui-diff-bg);
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
.pui-diff-gutter { width: 18px; flex: none; opacity: 0.7; user-select: none; }
.pui-diff-ch { display: inline-block; }
.pui-diff-sr {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

/* ---- the beam ---- */
.pui-diff.is-accepted::after, .pui-diff.is-rejected::after {
  content: '';
  position: absolute;
  left: 0; right: 0; top: -64px; height: 64px;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(to bottom, transparent, var(--pui-beam-soft) 38%, var(--pui-beam) 50%, var(--pui-beam-soft) 62%, transparent);
  animation: pui-beam var(--pui-sweep) linear forwards;
}
.pui-diff.is-accepted { --pui-beam: rgba(187, 247, 208, 0.75); --pui-beam-soft: rgba(34, 197, 94, 0.18); }
.pui-diff.is-rejected { --pui-beam: rgba(254, 202, 202, 0.75); --pui-beam-soft: rgba(239, 68, 68, 0.16); }

/* ---- accept: removed lines crumble and close; added lines materialize, flash, then settle into plain code ---- */
.pui-diff.is-accepted .pui-diff-del .pui-diff-ch {
  animation: pui-crumble 520ms cubic-bezier(0.5, 0, 0.85, 0.45) forwards;
  animation-delay: calc(var(--d) + var(--c) * 5ms);
}
.pui-diff.is-accepted .pui-diff-del .pui-diff-gutter {
  animation: pui-crumble 520ms cubic-bezier(0.5, 0, 0.85, 0.45) forwards;
  animation-delay: var(--d);
}
.pui-diff.is-accepted .pui-diff-del {
  animation: pui-collapse 300ms ease-in forwards;
  animation-delay: calc(var(--d) + 600ms);
}
.pui-diff.is-accepted .pui-diff-add .pui-diff-ch {
  animation: pui-materialize 560ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
  animation-delay: calc(var(--d) + var(--c) * 7ms);
}
.pui-diff.is-accepted .pui-diff-add {
  animation: pui-flash 1000ms ease-out both, pui-settle 900ms ease forwards;
  animation-delay: var(--d), calc(var(--pui-sweep) + 700ms);
}
.pui-diff.is-accepted .pui-diff-add .pui-diff-gutter {
  animation: pui-pop 500ms cubic-bezier(0.2, 1.4, 0.3, 1) both, pui-fade 600ms ease forwards;
  animation-delay: var(--d), calc(var(--pui-sweep) + 700ms);
}

/* ---- reject: added lines blow away and close; removed lines shed their red ---- */
.pui-diff.is-rejected .pui-diff-add .pui-diff-ch {
  animation: pui-blow 480ms cubic-bezier(0.3, 0, 0.7, 0.2) forwards;
  animation-delay: calc(var(--d) + var(--c) * 4ms);
}
.pui-diff.is-rejected .pui-diff-add .pui-diff-gutter {
  animation: pui-blow 480ms cubic-bezier(0.3, 0, 0.7, 0.2) forwards;
  animation-delay: var(--d);
}
.pui-diff.is-rejected .pui-diff-add {
  animation: pui-redflash 700ms ease-out both, pui-collapse 300ms ease-in forwards;
  animation-delay: var(--d), calc(var(--d) + 560ms);
}
.pui-diff.is-rejected .pui-diff-del {
  animation: pui-restore 900ms ease forwards;
  animation-delay: calc(var(--d) + 250ms);
}
.pui-diff.is-rejected .pui-diff-del .pui-diff-gutter {
  animation: pui-fade 600ms ease forwards;
  animation-delay: calc(var(--d) + 250ms);
}

@keyframes pui-beam { to { top: 100%; } }
@keyframes pui-crumble {
  0%   { transform: none; opacity: 1; filter: blur(0); }
  100% { transform: translate(var(--sx), 26px) rotate(var(--rot)); opacity: 0; filter: blur(1.5px); }
}
@keyframes pui-blow {
  0%   { transform: none; opacity: 1; filter: blur(0); }
  100% { transform: translate(calc(var(--sx) * 3), -22px) rotate(var(--rot)); opacity: 0; filter: blur(2px); }
}
@keyframes pui-collapse { to { height: 0; } }
@keyframes pui-materialize {
  0%   { opacity: 0; transform: translateY(-8px) scale(1.2); filter: blur(5px); text-shadow: 0 0 14px var(--pui-add-glow); }
  55%  { opacity: 1; transform: none; filter: blur(0); text-shadow: 0 0 10px var(--pui-add-glow); }
  100% { text-shadow: 0 0 0 transparent; }
}
@keyframes pui-flash {
  0%   { background: var(--pui-add-hot); box-shadow: inset 3px 0 0 #16a34a; }
  100% { background: var(--pui-add-bg); box-shadow: inset 3px 0 0 transparent; }
}
@keyframes pui-redflash {
  0%   { background: var(--pui-del-hot); box-shadow: inset 3px 0 0 #dc2626; }
  100% { background: var(--pui-add-bg); box-shadow: inset 3px 0 0 transparent; }
}
@keyframes pui-settle  { to { background: var(--pui-diff-bg); color: var(--pui-diff-fg); } }
@keyframes pui-restore { to { background: var(--pui-diff-bg); color: var(--pui-diff-fg); } }
@keyframes pui-fade    { to { opacity: 0; } }
@keyframes pui-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  100% { transform: scale(1); opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  .pui-diff.is-accepted::after, .pui-diff.is-rejected::after,
  .pui-diff .pui-diff-ch, .pui-diff .pui-diff-gutter { animation: none; }
  .pui-diff.is-accepted .pui-diff-del, .pui-diff.is-rejected .pui-diff-add { animation: none; display: none; }
  .pui-diff.is-accepted .pui-diff-add, .pui-diff.is-rejected .pui-diff-del {
    animation: none; background: var(--pui-diff-bg); color: var(--pui-diff-fg);
  }
  .pui-diff.is-accepted .pui-diff-add .pui-diff-gutter, .pui-diff.is-rejected .pui-diff-del .pui-diff-gutter { opacity: 0; }
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

export default function CodeDiff({
  lines = [],
  status,
  accepted = false,
  lineMs = 110,
  className,
  style,
}) {
  useInjectedStyle();
  const state = status ?? (accepted ? 'accepted' : 'pending');
  const sweep = Math.max(500, lines.length * lineMs);
  const cls = state === 'accepted' ? 'is-accepted' : state === 'rejected' ? 'is-rejected' : '';

  return (
    <div className={`pui-diff ${cls} ${className || ''}`} style={{ '--pui-sweep': `${sweep}ms`, ...style }}>
      {lines.map((l, i) => {
        const type = l.type === 'remove' ? 'del' : l.type === 'add' ? 'add' : 'ctx';
        const gutter = type === 'add' ? '+' : type === 'del' ? '−' : ' ';
        const content = String(l.content ?? '');
        return (
          <div key={i} className={`pui-diff-line pui-diff-${type}`} style={{ '--d': `${Math.round((i / lines.length) * sweep)}ms` }}>
            <span className="pui-diff-gutter" aria-hidden="true">{gutter}</span>
            {type === 'ctx' ? (
              <span>{content}</span>
            ) : (
              <>
                <span className="pui-diff-sr">{`${type === 'add' ? 'added' : 'removed'}: ${content}`}</span>
                <span aria-hidden="true">
                  {[...content].map((ch, c) => (
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
