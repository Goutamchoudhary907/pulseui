import { useEffect, useRef, useState } from 'react';

/**
 * Timer
 *
 * A small ring of tick marks — the size of a spinner — for anything that
 * takes a while: "Thinking… 0:07", "Running tests 62%", "Thought for 12s".
 *
 * Elapsed mode (no `progress`): a bright head sweeps around the ring like
 * a second hand, lighting the ticks behind it in a fading comet tail, while
 * the label counts up. Set `running={false}` and the sweep coasts to a stop
 * and the time freezes — the "Thought for 12s" state.
 *
 * Progress mode (`progress` 0..1): ticks light up to the frontier, which
 * glows and breathes. Progress moves on a spring, so each step lands with a
 * small snap. If it stalls the head breathes slower and dimmer. At 100%
 * every tick flashes, a ring pulses out, a check settles in the middle and
 * `onComplete` fires.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame. The loop
 * sleeps whenever nothing is moving (stopped, done, or at 0%).
 *
 * Props:
 *  - progress (0..1 | undefined): fraction done. Undefined = elapsed mode.
 *  - running (bool): false stops the sweep / freezes the clock. Default true.
 *  - size (number): ring diameter in px. Default 20. Looks good 16–64.
 *  - color (hex): tick colour. Default violet.
 *  - label (true | string): text beside the ring. `true` shows elapsed time
 *      as m:ss; a string shows that instead.
 *  - startedAt (number): Date.now() the clock should count from. Default:
 *      when it mounted.
 *  - onComplete (fn): fires once when progress reaches 1.
 *  - className / style: passed to the wrapper.
 */
export default function Timer({
  progress,
  running = true,
  size = 20,
  color = '#7c3aed',
  label,
  startedAt,
  onComplete,
  className,
  style,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const progressRef = useRef(progress);
  const runningRef = useRef(running);
  const onCompleteRef = useRef(onComplete);
  // p/v: spring on progress. head/spin: sweep angle and its speed.
  // flash: -1 idle, else 0..1 completion pulse. changedAt: last progress change.
  const s = useRef({ p: 0, v: 0, head: 0, spin: 1, flash: -1, done: false, changedAt: 0, t: 0, last: 0 });
  const kickRef = useRef(() => {});

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    runningRef.current = running;
    kickRef.current();
  }, [running]);
  useEffect(() => {
    const st = s.current;
    const prev = progressRef.current;
    progressRef.current = progress;
    st.changedAt = st.t;
    if (progress == null || prev == null || progress < prev - 0.001) {
      st.done = false;
      st.flash = -1;
    }
    kickRef.current();
  }, [progress]);

  // ---- the clock (label) --------------------------------------------------
  // start/stop live in refs; the label reads `elapsed` state, refreshed by a
  // short interval while running (so a stop freezes it at the last tick).
  const startRef = useRef(startedAt ?? null);
  const stopRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (startedAt != null) startRef.current = startedAt;
    else if (startRef.current == null) startRef.current = Date.now();
  }, [startedAt]);
  useEffect(() => {
    if (running) {
      // resume: shift the start so the paused stretch doesn't count
      if (stopRef.current != null) startRef.current += Date.now() - stopRef.current;
      stopRef.current = null;
    } else {
      stopRef.current = Date.now();
    }
  }, [running]);
  useEffect(() => {
    if (!running || label !== true) return;
    const update = () => setElapsed(Math.max(0, Date.now() - startRef.current));
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [running, label]);

  // ---- the ring -----------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const st = s.current;
    const TAU = Math.PI * 2;
    const cx = size / 2;
    const cy = size / 2;
    const N = Math.max(12, Math.min(60, Math.round(size * 0.62))); // tick count
    const rOut = size * 0.44;
    const rIn = size * 0.3;
    const lw = Math.max(1, size * 0.055);
    const rgb = hexToRgb(color);
    const rgba = (a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    function tickLine(a, alpha, hot) {
      const c = Math.cos(a), sn = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + c * rIn, cy + sn * rIn);
      ctx.lineTo(cx + c * rOut, cy + sn * rOut);
      ctx.strokeStyle = hot > 0 ? mixWhite(rgb, hot, alpha) : rgba(alpha);
      ctx.lineWidth = lw;
      ctx.stroke();
    }

    function glow(a, strength) {
      const r = (rIn + rOut) / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.2);
      g.addColorStop(0, rgba(0.55 * strength));
      g.addColorStop(1, rgba(0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.2, 0, TAU);
      ctx.fill();
    }

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - st.last) / 1000));
      st.last = now;
      st.t += dt;
      const prog = progressRef.current;
      const det = prog != null;
      const run = runningRef.current;

      if (det) {
        const target = Math.max(0, Math.min(1, prog));
        if (reduce) {
          st.p = target;
        } else {
          st.v += (target - st.p) * 0.09;
          st.v *= 0.76;
          st.p = Math.max(0, Math.min(1.03, st.p + st.v));
        }
        if (target >= 1 && !st.done && st.p > 0.995) {
          st.done = true;
          st.flash = 0;
          onCompleteRef.current?.();
        }
      } else {
        // sweep: eases to full speed when running, coasts to a stop when not
        st.spin += ((run ? 1 : 0) - st.spin) * (run ? 0.08 : 0.04);
        if (!reduce) st.head += dt * st.spin * (TAU / 1.6);
      }
      if (st.flash >= 0) {
        st.flash += dt * 1.4;
        if (st.flash > 1) st.flash = -1;
      }

      // anything still moving? otherwise this is the last frame until a prop changes
      const moving = det
        ? st.flash >= 0 || Math.abs(st.v) > 0.0004 || Math.abs(Math.min(1, prog) - st.p) > 0.002 || (run && st.p > 0.005 && st.p < 0.995)
        : run || st.spin > 0.02;

      const stalled = det && run && st.p < 0.99 && st.t - st.changedAt > 1.8;
      const breathe = 0.5 + 0.5 * Math.sin(st.t * (stalled ? 2.2 : 6));

      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = 'round';

      const flash = st.flash >= 0 ? Math.sin(st.flash * Math.PI) : 0;
      const frontier = Math.min(1, st.p) * TAU;
      const headA = det ? -Math.PI / 2 + frontier : st.head - Math.PI / 2;

      for (let i = 0; i < N; i++) {
        const pos = (i / N) * TAU;
        const a = -Math.PI / 2 + pos;
        let lit = 0;
        if (det) {
          // ticks up to the frontier, the frontier tick partially
          lit = Math.max(0, Math.min(1, (frontier - pos) / (TAU / N)));
          if (st.p >= 1) lit = 1;
        } else if (reduce) {
          lit = run ? 0.5 + 0.5 * Math.sin(st.t * 2) : 0;
        } else {
          // comet tail behind the head
          let d = (((st.head - pos) % TAU) + TAU) % TAU;
          const tail = 2.4;
          lit = d < tail ? Math.pow(1 - d / tail, 1.6) : 0;
          lit *= Math.max(0, st.spin);
        }
        const alpha = 0.14 + 0.86 * Math.max(lit, flash);
        const hot = det ? (lit > 0 && lit < 1 ? 0.6 : 0) : lit > 0.92 ? 0.7 : 0;
        tickLine(a, alpha, Math.max(hot, flash));
      }

      // head glow
      if (det) {
        if (st.p > 0.005 && st.p < 0.995 && run) glow(headA, stalled ? 0.35 + breathe * 0.25 : 0.6 + breathe * 0.4);
      } else if (!reduce && st.spin > 0.02) {
        glow(headA, 0.9 * st.spin);
      }

      // completion: a ring pulses out and a check settles in the middle
      if (det && st.done) {
        if (st.flash >= 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, rOut + st.flash * size * 0.16, 0, TAU);
          ctx.strokeStyle = rgba((1 - st.flash) * 0.45);
          ctx.lineWidth = lw;
          ctx.stroke();
        }
        const k = st.flash >= 0 ? Math.min(1, st.flash * 1.6) : 1;
        const cw = size * 0.13;
        ctx.beginPath();
        ctx.moveTo(cx - cw, cy);
        ctx.lineTo(cx - cw * 0.3, cy + cw * 0.7);
        ctx.lineTo(cx + cw, cy - cw * 0.65);
        ctx.strokeStyle = rgba(k);
        ctx.lineWidth = Math.max(1.2, size * 0.07);
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      rafRef.current = moving && !(reduce && det) ? requestAnimationFrame(tick) : 0;
    }

    const kick = () => {
      if (rafRef.current) return;
      st.last = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    kick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [size, color]);

  const text = label === true ? formatTime(elapsed) : label;
  const pct = progress == null ? null : Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(6, size * 0.35), ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: 'block' }}
        role={pct == null ? 'img' : 'progressbar'}
        aria-valuemin={pct == null ? undefined : 0}
        aria-valuemax={pct == null ? undefined : 100}
        aria-valuenow={pct == null ? undefined : pct}
        aria-label={pct == null ? (running ? 'Working' : 'Stopped') : `${pct}% done`}
      />
      {text && (
        <span
          style={{
            font: `500 ${Math.max(11, Math.min(14, Math.round(size * 0.6)))}px/1 ui-monospace, SFMono-Regular, Menlo, monospace`,
            fontVariantNumeric: 'tabular-nums',
            opacity: 0.7,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function mixWhite(rgb, t, a) {
  const c = rgb.map((v) => Math.round(v + (255 - v) * t));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [124, 58, 237];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
