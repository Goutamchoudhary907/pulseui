import { useEffect, useRef, useState } from 'react';

/**
 * HoldToAllow
 *
 * The "may I run this?" moment every agent has — with a fuse in the Allow
 * button. Press and hold: a fill burns across the button from the left, a
 * thin bright frontier leading it. Let go early and it recedes. Hold to the
 * end and it lands: the action is allowed. Deny is just Deny.
 *
 * The physics is the safety: nothing dangerous happens on a twitch.
 *
 * Zero dependencies — a small <canvas> in the button + a stylesheet
 * injected once. The loop only runs while something burns.
 *
 * Props:
 *  - action (node): what the agent wants to do, e.g. <code>rm -rf build</code>.
 *  - verb (string): the leading word. Default 'run'.
 *  - risk ('low' | 'high'): a high-risk fuse is longer. Default 'low'.
 *  - holdMs (number): override the fuse length in ms. Default 900 / 1600.
 *  - status ('pending' | 'allowed' | 'denied'): controlled outcome; omit to
 *      let the gate manage it.
 *  - holding (bool): controlled hold (e.g. a voice "yes"); omit for pointer
 *      and keyboard.
 *  - onAllow / onDeny (fn): the outcome.
 *  - allowLabel / denyLabel (string): button text. Default 'Hold to allow' / 'Deny'.
  *  - color (hex): the "allowed" colour. Default '#059669'.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-holdtoallow';
const CSS = `
.pui-hold { --pui-ok: #f59e0b; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; box-sizing: border-box; width: 100%; max-width: 100%; min-width: 0; font: 500 13.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1c1917; }
.pui-hold-action { flex: 1 1 200px; min-width: 0; display: flex; align-items: baseline; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s, text-decoration-color 0.3s; text-decoration: line-through transparent; }
.pui-hold-verb { color: #78716c; font-weight: 400; flex-shrink: 0; }
.pui-hold-action code { font: inherit; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.pui-hold-btns { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.pui-hold button { -webkit-appearance: none; appearance: none; position: relative; font: inherit; font-size: 12.5px; font-weight: 600; line-height: 1; height: 32px; padding: 0 14px; border-radius: 8px; cursor: pointer; transition: color 0.25s, background-color 0.25s, border-color 0.25s, opacity 0.25s, transform 0.15s; }
.pui-hold button:focus-visible { outline: 2px solid #1c1917; outline-offset: 2px; }
.pui-hold button:disabled { cursor: default; }
.pui-hold-deny { color: #57534e; background: #fff; border: 1px solid #e7e5e4; }
.pui-hold-deny:hover:not(:disabled) { color: #1c1917; border-color: #d6d3d1; background: #fafaf9; }
.pui-hold-allow { color: #fff; background: #1c1917; border: 1px solid #1c1917; overflow: hidden; touch-action: none; user-select: none; -webkit-user-select: none; min-width: 118px; }
.pui-hold-allow canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.pui-hold-allow span { position: relative; display: block; text-align: center; }
.pui-hold[data-status="pending"] .pui-hold-allow.is-holding { transform: scale(0.98); }
.pui-hold[data-status="allowed"] .pui-hold-allow { background: var(--pui-ok); border-color: var(--pui-ok); }
.pui-hold[data-status="allowed"] .pui-hold-deny, .pui-hold[data-status="denied"] .pui-hold-allow { opacity: 0.35; }
.pui-hold[data-status="denied"] .pui-hold-deny { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
.pui-hold[data-status="denied"] .pui-hold-action { color: #a8a29e; text-decoration-color: #a8a29e; }
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

const HOLD = { low: 900, high: 1600 };

export default function HoldToAllow({
  action,
  verb = 'run',
  risk = 'low',
  holdMs,
  status: statusProp,
  holding: holdingProp,
  onAllow,
  onDeny,
  allowLabel = 'Hold to allow',
  denyLabel = 'Deny',
  color = '#059669',
  className,
  style,
}) {
  useInjectedStyle();
  const [statusState, setStatusState] = useState('pending');
  const status = statusProp ?? statusState;
  const [holdingState, setHoldingState] = useState(false);
  const holding = (holdingProp ?? holdingState) && status === 'pending';

  const btnRef = useRef(null);
  const canvasRef = useRef(null);
  const kickRef = useRef(() => {});
  const cb = useRef({ onAllow, onDeny });
  useEffect(() => {
    cb.current = { onAllow, onDeny };
  }, [onAllow, onDeny]);
  const sim = useRef({
    burn: 0, holding: false, snuff: 0, regrow: false, flash: 0, done: false, t: 0, last: 0,
  });
  const fuseMs = holdMs ?? HOLD[risk] ?? HOLD.low;

  // hold → burn; release → snuff; controlled status → settle
  useEffect(() => {
    const s = sim.current;
    if (status !== 'pending') {
      s.holding = false;
      s.done = status === 'allowed';
      if (s.done && s.burn < 1) { s.burn = 1; s.flash = 1; }
      if (!s.done) s.burn = 0;
    } else {
      if (s.done) { s.done = false; s.burn = 0; s.flash = 0; }
      if (holding) {
        s.holding = true;
        s.regrow = false;
        s.snuff = 0;
      } else if (s.holding) {
        s.holding = false;
        if (s.burn > 0 && s.burn < 1) s.snuff = 1;
      }
    }
    kickRef.current();
  }, [holding, status]);

  // the fuse
  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = btnRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const s = sim.current;
    let W = 0, H = 0, raf = 0;

    const size = () => {
      const r = btn.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { size(); draw(); }) : null;
    ro?.observe(btn);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (s.done && s.flash <= 0) return;
      const bx = W * Math.min(1, s.burn);

      // the burnt part: a light fill behind a thin bright frontier
      if (s.burn > 0 && !s.done) {
        const k = s.holding ? 1 : Math.max(0.3, s.snuff);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(0, 0, bx, H);
        const g = ctx.createLinearGradient(bx - 16, 0, bx, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, `rgba(255,255,255,${0.35 * k})`);
        ctx.fillStyle = g;
        ctx.fillRect(bx - 16, 0, 16, H);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`;
        ctx.fillRect(bx - 1, 0, 1.5, H);
      }
      // landing: one soft pulse that fades as the button turns green
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.35})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function tick(now) {
      const dt = Math.min(50, Math.max(1, now - s.last));
      s.last = now;
      s.t += dt / 1000;

      if (s.holding && !s.done) {
        s.burn = Math.min(1, s.burn + dt / fuseMs);
        if (s.burn >= 1) {
          s.done = true;
          s.flash = reduce ? 0 : 1;
          s.holding = false;
          setStatusState('allowed');
          setHoldingState(false);
          cb.current.onAllow?.();
        }
      } else if (s.snuff > 0) {
        s.snuff = Math.max(0, s.snuff - dt / 220);
        if (s.snuff === 0) s.regrow = true;
      } else if (s.regrow) {
        // let go early: the burn recedes to the left
        s.burn = Math.max(0, s.burn - dt / 420);
        if (s.burn === 0) s.regrow = false;
      }
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt / 380);

      draw();
      const moving = s.holding || s.snuff > 0 || s.regrow || s.flash > 0;
      raf = moving ? requestAnimationFrame(tick) : 0;
    }

    const kick = () => {
      if (raf) return;
      s.last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    kick();
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
    };
  }, [fuseMs]);

  const press = (e) => {
    if (status !== 'pending' || holdingProp != null) return;
    e.preventDefault();
    btnRef.current?.setPointerCapture?.(e.pointerId);
    setHoldingState(true);
  };
  const release = () => holdingProp == null && setHoldingState(false);
  const keyDown = (e) => {
    if (status !== 'pending' || holdingProp != null || e.repeat) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setHoldingState(true); }
  };
  const keyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); }
  };
  const deny = () => {
    if (status !== 'pending') return;
    setHoldingState(false);
    setStatusState('denied');
    cb.current.onDeny?.();
  };

  const allowText = status === 'allowed' ? 'Allowed' : holding ? 'Allowing…' : allowLabel;

  return (
    <div
      className={`pui-hold${className ? ` ${className}` : ''}`}
      style={{ '--pui-ok': color, ...style }}
      data-status={status}
      role="group"
      aria-label={`Approval: ${verb} ${typeof action === 'string' ? action : ''}`.trim()}
    >
      <div className="pui-hold-action">
        <span className="pui-hold-verb">{verb}</span>
        {typeof action === 'string' ? <code>{action}</code> : action}
      </div>
      <div className="pui-hold-btns">
        <button type="button" className="pui-hold-deny" onClick={deny} disabled={status !== 'pending'}>
          {status === 'denied' ? 'Denied' : denyLabel}
        </button>
        <button
          ref={btnRef}
          type="button"
          className={`pui-hold-allow${holding ? ' is-holding' : ''}`}
          onPointerDown={press}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={keyDown}
          onKeyUp={keyUp}
          onBlur={release}
          onContextMenu={(e) => e.preventDefault()}
          disabled={status !== 'pending'}
          aria-label={status === 'allowed' ? 'Allowed' : `${allowLabel} (hold)`}
          aria-pressed={status === 'allowed'}
        >
          <canvas ref={canvasRef} aria-hidden="true" />
          <span>{status === 'allowed' ? '✓ Allowed' : allowText}</span>
        </button>
      </div>
    </div>
  );
}
