import { useEffect, useRef, useState } from 'react';

/**
 * ImageReveal
 *
 * A generated image arriving — as a field of dots, not a blur with a
 * progress bar. The frame starts as small grey dots drifting on slow
 * currents. As `progress` rises, dots lock onto a grid in a scattered
 * order, each one drifting home and growing as it lands, so the frame
 * fills into an even dot field — the same language as the thinking
 * indicator. Nothing here needs the picture; the model hasn't made it
 * yet. When `src` arrives and progress is 100%, the real image fades in
 * over the dots.
 *
 * Zero dependencies — one <canvas> over an <img>. The loop runs while
 * generating and sleeps once the picture is in (or before it starts). The
 * frame is always dark — a generation tray, not a themed surface — with a
 * label and a live percentage, the same language a real image model's
 * "creating…" panel uses.
 *
 * Props:
 *  - progress (0..1): how much of the generation has arrived.
 *  - src (string): the finished image. May be undefined until it's ready.
 *  - generating (bool): keeps the dots drifting at 0%. Default false.
 *  - cell (number): dot spacing in px. Default 10 — smaller is finer and costs more.
 *  - label (string): top-left caption while generating. Default 'Creating image'.
 *  - showPercent (bool): the bottom-right percentage pill. Default true.
 *  - alt (string): alt text for the image.
 *  - aspect (string): CSS aspect-ratio of the frame. Default '4 / 3'.
 *  - onRevealed (fn): fires once every dot is on the grid.
 *  - className / style: passed to the frame.
 */

const STYLE_ID = 'pulseui-imagereveal';
const CSS = `
.pui-reveal { position: relative; display: block; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; border-radius: 12px; background: #08090b; aspect-ratio: var(--pui-aspect, 4 / 3); }
.pui-reveal img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0; transition: opacity 700ms ease; }
.pui-reveal.is-in img { opacity: 1; }
.pui-reveal canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; transition: opacity 700ms ease; }
.pui-reveal.is-in canvas { opacity: 0; }
.pui-reveal-hud { position: absolute; inset: 0; pointer-events: none; transition: opacity 500ms ease; }
.pui-reveal.is-in .pui-reveal-hud { opacity: 0; }
.pui-reveal-label { position: absolute; left: 16px; top: 10px; font: 600 14px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; color: rgba(255,255,255,0.85); letter-spacing: -0.01em; }
.pui-reveal-pct { position: absolute; right: 12px; bottom: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #7dabfa; backdrop-filter: blur(6px); font-variant-numeric: tabular-nums; }
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

export default function ImageReveal({
  progress = 0,
  src,
  generating = false,
  cell = 10,
  label = 'Creating image',
  showPercent = true,
  alt = '',
  aspect = '4 / 3',
  onRevealed,
  className,
  style,
}) {
  useInjectedStyle();
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const kickRef = useRef(() => {});
  const cbRef = useRef(onRevealed);
  useEffect(() => {
    cbRef.current = onRevealed;
  }, [onRevealed]);

  // each generation is a "run"; a rewind of progress starts a new one, so
  // a settled field from the last run never counts for this one
  const [run, setRun] = useState(0);
  const [prevProgress, setPrevProgress] = useState(progress);
  if (progress !== prevProgress) {
    setPrevProgress(progress);
    if (progress < prevProgress) setRun((r) => r + 1);
  }
  const [settledRun, setSettledRun] = useState(-1);
  const isIn = Boolean(src) && progress >= 1 && settledRun === run;
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const sim = useRef({
    target: 0, p: 0, pts: [], byOrder: [], cols: 0, rows: 0, W: 1, H: 1, top: 0, settled: false, generating: false,
    t: 0, last: 0,
  });

  useEffect(() => {
    const s = sim.current;
    s.target = Math.max(0, Math.min(1, progress));
    if (s.target < s.p) {
      // rewind: everything past the new mark goes back to drifting
      s.p = s.target;
      s.settled = false;
      const n = Math.floor(s.target * s.pts.length);
      for (const q of s.pts) {
        if (q.order >= n && q.lock) { q.lock = false; q.home = false; q.x = Math.random() * s.W; q.y = Math.random() * s.H; }
      }
    }
    kickRef.current();
  }, [progress]);
  useEffect(() => {
    sim.current.generating = generating;
    kickRef.current();
  }, [generating]);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const s = sim.current;
    let raf = 0;

    // ---- build the dots ---------------------------------------------------
    s.p = 0;
    s.settled = false;
    const size = () => {
      const r = frame.getBoundingClientRect();
      s.W = Math.max(1, Math.round(r.width));
      s.H = Math.max(1, Math.round(r.height));
      canvas.width = s.W * dpr;
      canvas.height = s.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    // keep dots clear of the label so text never reads over the field
    s.top = label ? Math.min(s.H * 0.4, 32) : 0;
    const fieldH = Math.max(1, s.H - s.top);
    s.cols = Math.max(4, Math.round(s.W / cell));
    s.rows = Math.max(3, Math.round(fieldH / cell));
    const cw = s.W / s.cols, ch = fieldH / s.rows;
    const N = s.cols * s.rows;
    const order = Array.from({ length: N }, (_, i) => i);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    s.pts = [];
    for (let i = 0; i < N; i++) {
      const c = i % s.cols, r = Math.floor(i / s.cols);
      s.pts.push({
        tx: (c + 0.5) * cw, ty: s.top + (r + 0.5) * ch,
        x: Math.random() * s.W, y: s.top + Math.random() * fieldH,
        vx: 0, vy: 0, seed: Math.random() * 6.28, g: 0.6 + Math.random() * 0.6,
        order: order[i], lock: false, lockAt: 0, home: false,
      });
    }
    s.byOrder = s.pts.slice().sort((a, b) => a.order - b.order);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { size(); draw(); }) : null;
    ro?.observe(frame);

    function draw() {
      const { W, H } = s;
      ctx.clearRect(0, 0, W, H);
      const p = s.p;
      const now = s.t;
      const R = Math.min(cw, ch) * 0.24; // radius of a landed dot
      // loose: small dots, each with a slow twinkle
      const base = 0.22 + p * 0.16;
      for (const q of s.pts) {
        if (q.lock) continue;
        const a = base + Math.sin(now * 1.7 + q.seed * 4) * 0.08;
        ctx.fillStyle = `rgba(96,140,230,${a})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.g, 0, Math.PI * 2);
        ctx.fill();
      }
      // landed: grow into place with a small overshoot, glowing brighter blue as it settles
      for (const q of s.pts) {
        if (!q.lock) continue;
        const age = q.home ? 1 : Math.min(1, (now - q.lockAt) / 0.42);
        const k = age < 1 ? 0.5 + 0.7 * age - 0.2 * age * age : 1; // 0.5 → 1.05 → 1
        const glow = 0.42 * age;
        if (glow > 0.02) {
          ctx.fillStyle = `rgba(125,171,250,${glow * 0.35})`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, Math.max(q.g, R * k) * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(150,190,255,${0.55 + 0.4 * age})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, Math.max(q.g, R * k), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick(nowMs) {
      const dt = Math.min(50, Math.max(1, nowMs - s.last));
      s.last = nowMs;
      s.t += dt / 1000;
      const f = dt / 16;
      const { W, H } = s;

      // progress eases; the number of landed dots follows it
      if (reduce) s.p = s.target; else s.p += (s.target - s.p) * (1 - Math.pow(0.9, f));
      if (Math.abs(s.target - s.p) < 0.001) s.p = s.target;
      const want = s.p >= 1 ? N : Math.floor(s.p * N);
      for (let i = 0; i < want; i++) {
        const q = s.byOrder[i];
        if (!q.lock) {
          q.lock = true;
          q.lockAt = s.t;
          q.home = reduce;
          if (reduce) { q.x = q.tx; q.y = q.ty; }
        }
      }

      let moving = s.p !== s.target;
      const pull = 0.002 + s.p * s.p * 0.02; // the unlocked gather as the picture firms up
      for (const q of s.pts) {
        if (q.lock) {
          if (q.home) continue;
          q.x += (q.tx - q.x) * 0.16 * f;
          q.y += (q.ty - q.y) * 0.16 * f;
          if (Math.abs(q.tx - q.x) < 0.3 && Math.abs(q.ty - q.y) < 0.3) {
            q.x = q.tx;
            q.y = q.ty;
            q.home = s.t - q.lockAt > 0.42;
          }
          moving = true;
        } else if (!reduce) {
          // slow currents + a weak pull home
          const a = Math.sin(q.y * 0.02 + s.t * 0.6 + q.seed) * 2.1 + Math.cos(q.x * 0.017 - s.t * 0.4) * 1.3;
          q.vx += (Math.cos(a) * 0.06 + (q.tx - q.x) * pull) * f;
          q.vy += (Math.sin(a) * 0.06 + (q.ty - q.y) * pull) * f;
          q.vx *= Math.pow(0.93, f);
          q.vy *= Math.pow(0.93, f);
          q.x += q.vx * f;
          q.y += q.vy * f;
          if (q.x < 0) q.x += W; else if (q.x > W) q.x -= W;
          const top = s.top;
          if (q.y < top) { q.y = top + (top - q.y); q.vy = Math.abs(q.vy); }
          else if (q.y > H) { q.y = H - (q.y - H); q.vy = -Math.abs(q.vy); }
          moving = true;
        } else {
          q.x = q.tx;
          q.y = q.ty;
        }
      }

      // everything home → the real image (once it exists) fades in over the dots
      const allHome = s.p >= 1 && s.pts.every((q) => q.lock && (q.home || reduce));
      if (allHome && !s.settled) {
        s.settled = true;
        setSettledRun(runRef.current);
        cbRef.current?.();
      }

      draw();
      const drifting = !reduce && s.p < 1 && (s.p > 0 || s.generating);
      raf = moving && (drifting || s.p >= 1) ? requestAnimationFrame(tick) : 0;
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
    // label only affects the initial layout inset, not a reason to rebuild the field
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell]);

  return (
    <span
      ref={frameRef}
      className={`pui-reveal${isIn ? ' is-in' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--pui-aspect': aspect, ...style }}
      role="img"
      aria-label={alt}
      aria-busy={!isIn}
    >
      {src ? <img src={src} alt="" draggable={false} /> : null}
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="pui-reveal-hud" aria-hidden="true">
        {label ? <span className="pui-reveal-label">{label}</span> : null}
        {showPercent ? (
          <span className="pui-reveal-pct">{Math.round(Math.min(1, Math.max(0, progress)) * 100)}%</span>
        ) : null}
      </span>
    </span>
  );
}
