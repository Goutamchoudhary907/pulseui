import { useEffect, useRef } from 'react';

/**
 * ToolCall
 *
 * An agent invoking a tool, shown as a signal on a circuit instead of
 * "Calling search_web…" spinner text. A trace runs from the agent to a
 * pad. On call, a white-hot pulse leaves the agent and rides the trace
 * to the pad, which ignites; while the tool runs, current flows along the
 * trace and energy orbits inside the pad, throwing off ripples. When it
 * finishes, a return pulse carries the result home and the pad sets
 * into a solid check. When it fails, the pad flashes red, sparks fly
 * and fall, and the trace burns out just short of the pad.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame, and the
 * loop sleeps whenever nothing is moving.
 *
 * Props:
 *  - name (string): the tool being called, e.g. "search_web".
 *  - status ('idle' | 'calling' | 'running' | 'done' | 'error'): default 'idle'.
 *  - detail (string): secondary text — args, a result snippet, or an error.
 *      Defaults to a status word.
 *  - size (number): height in px. Default 28.
 *  - width (number): trace length in px. Default 132.
 *  - color (hex): signal colour. Default '#f59e0b' (electric amber).
 *  - errorColor (hex): failure colour. Default '#ef4444'.
 *  - className / style: passed to the wrapper span.
 */

const STYLE_ID = 'pulseui-toolcall';
const CSS = `
.pui-toolcall { display: flex; width: 100%; max-width: 100%; box-sizing: border-box; align-items: center; gap: 10px; min-width: 0; font: 500 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1c1917; }
.pui-toolcall canvas { display: block; flex-shrink: 0; }
.pui-toolcall .tc-text { display: flex; flex: 1 1 auto; align-items: baseline; gap: 8px; min-width: 0; }
.pui-toolcall .tc-name { flex-shrink: 0; font-weight: 600; white-space: nowrap; transition: color 0.3s ease; }
.pui-toolcall[data-status="idle"] .tc-name { color: #a8a29e; }
.pui-toolcall .tc-detail { flex: 1 1 auto; min-width: 0; font-weight: 400; font-size: 0.92em; color: #78716c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s ease; }
.pui-toolcall[data-status="error"] .tc-detail { color: var(--tc-error, #ef4444); }
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

const STATUS_WORD = { idle: 'idle', calling: 'calling', running: 'running', done: 'done', error: 'failed' };

export default function ToolCall({
  name,
  status = 'idle',
  detail,
  size = 28,
  width = 132,
  color = '#f59e0b',
  errorColor = '#ef4444',
  className,
  style,
}) {
  useInjectedStyle();
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const kickRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const acc = hexToRgb(color);
    const red = hexToRgb(errorColor);
    const cy = size / 2;
    const rp = size * 0.2;                 // pad radius
    const ox = 4;                          // agent (origin) x
    const px = width - rp - 3;             // pad centre x
    const bump = size * 0.2;

    // the trace: a PCB-style run with one raised jog
    const pts = [
      [ox, cy],
      [width * 0.34, cy],
      [width * 0.42, cy - bump],
      [width * 0.58, cy - bump],
      [width * 0.66, cy],
      [px - rp - 1, cy],
    ];
    const segLen = [];
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segLen.push(d);
      L += d;
    }
    const pointAt = (s) => {
      s = Math.max(0, Math.min(L, s));
      let run = 0;
      for (let i = 0; i < segLen.length; i++) {
        if (s <= run + segLen[i] || i === segLen.length - 1) {
          const t = segLen[i] ? (s - run) / segLen[i] : 0;
          return [
            pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
            pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
          ];
        }
        run += segLen[i];
      }
      return pts[pts.length - 1];
    };
    // sub-path of the trace between two arc lengths
    const pathAlong = (s0, s1) => {
      ctx.beginPath();
      const a = pointAt(s0);
      ctx.moveTo(a[0], a[1]);
      let run = 0;
      for (let i = 0; i < segLen.length; i++) {
        run += segLen[i];
        if (run > s0 && run < s1) ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      }
      const b = pointAt(s1);
      ctx.lineTo(b[0], b[1]);
    };

    const sim = simRef.current ?? {
      status: 'idle',
      energy: 0, hot: 0, check: 0, err: 0, brk: 0, flash: 0, spin: 0,
      arrived: false,
      pulses: [], dashes: [], ripples: [], sparks: [],
      lastDash: 0, lastRipple: 0, last: 0,
    };
    simRef.current = sim;

    function apply(next) {
      const prev = sim.status;
      sim.status = next;
      if (next === prev) return;
      if (next === 'calling' || next === 'running') {
        if (prev !== 'calling' && prev !== 'running') {
          sim.arrived = reduced;
          sim.pulses = reduced ? [] : [{ dir: 1, s: 0 }];
          sim.flash = 1;
          sim.sparks = [];
        }
      } else if (next === 'done') {
        sim.pulses = reduced ? [] : [{ dir: -1, s: L }];
        sim.dashes = [];
        sim.ripples.push({ r: rp, a: 1 });
      } else if (next === 'error') {
        sim.pulses = [];
        sim.dashes = [];
        if (!reduced) {
          for (let i = 0; i < 16; i++) {
            const ang = -Math.PI * (0.15 + Math.random() * 0.7);
            const sp = size * (0.05 + Math.random() * 0.09);
            sim.sparks.push({ x: px, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1 });
          }
        }
      } else {
        sim.pulses = [];
        sim.dashes = [];
        sim.arrived = false;
      }
      kick();
    }

    let raf = 0;
    function kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }
    kickRef.current = apply;

    const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const ease = (v, target, k) => v + (target - v) * Math.min(1, k);

    function tick(now) {
      raf = 0;
      const dt = Math.min(48, sim.last ? now - sim.last : 16);
      sim.last = now;
      const st = sim.status;
      const k = dt / 16;

      // ---- targets ----
      const running = st === 'running';
      const calling = st === 'calling';
      const energyT = running ? 1 : calling ? (sim.arrived ? 0.45 : 0) : st === 'done' ? 0.8 : 0;
      const hotT = running ? 1 : calling ? (sim.arrived ? 0.5 : 0.15) : st === 'done' ? 0.55 : 0;

      // ---- integrate ----
      sim.energy = ease(sim.energy, energyT, 0.1 * k);
      sim.hot = ease(sim.hot, hotT, 0.08 * k);
      sim.check = ease(sim.check, st === 'done' && sim.pulses.length === 0 ? 1 : 0, 0.14 * k);
      sim.err = ease(sim.err, st === 'error' ? 1 : 0, 0.16 * k);
      sim.brk = ease(sim.brk, st === 'error' ? 1 : 0, 0.1 * k);
      sim.flash *= Math.pow(0.9, k);
      if (running) sim.spin += dt * 0.0045;

      for (const p of sim.pulses) p.s += p.dir * (L / 780) * dt;
      sim.pulses = sim.pulses.filter((p) => {
        if (p.dir === 1 && p.s >= L) {
          sim.arrived = true;
          sim.energy = Math.max(sim.energy, 0.7);
          sim.ripples.push({ r: rp, a: 1 });
          return false;
        }
        if (p.dir === -1 && p.s <= 0) {
          sim.flash = 1;
          return false;
        }
        return true;
      });

      if (running && sim.arrived && !reduced) {
        if (now - sim.lastDash > 240) { sim.dashes.push({ s: 0 }); sim.lastDash = now; }
        if (now - sim.lastRipple > 820) { sim.ripples.push({ r: rp, a: 0.7 }); sim.lastRipple = now; }
      }
      for (const d of sim.dashes) d.s += (L / 1300) * dt;
      sim.dashes = sim.dashes.filter((d) => d.s < L);
      for (const r of sim.ripples) { r.r += size * 0.0011 * dt; r.a -= dt / 700; }
      sim.ripples = sim.ripples.filter((r) => r.a > 0);
      for (const s of sim.sparks) {
        s.vy += size * 0.00035 * dt;
        s.x += s.vx * (dt / 16);
        s.y += s.vy * (dt / 16);
        s.vx *= 0.985;
        s.life -= dt / 620;
      }
      sim.sparks = sim.sparks.filter((s) => s.life > 0);

      // ---- draw ----
      ctx.clearRect(0, 0, width, size);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pad = mix(acc, red, sim.err);

      // base trace (burns out near the pad on error)
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.16)';
      ctx.lineWidth = 1.5;
      if (sim.brk > 0.01) {
        const g0 = L * (0.86 - 0.04 * sim.brk), g1 = L * (0.86 + 0.05 * sim.brk);
        pathAlong(0, g0); ctx.stroke();
        pathAlong(g1, L); ctx.stroke();
        const b = pointAt(L * 0.86);
        ctx.fillStyle = `rgba(28, 25, 23, ${0.35 * sim.brk})`;
        ctx.beginPath(); ctx.arc(b[0], b[1], 1.4 * sim.brk, 0, Math.PI * 2); ctx.fill();
      } else {
        pathAlong(0, L); ctx.stroke();
      }

      // energised overlay
      if (sim.hot > 0.01) {
        ctx.save();
        ctx.shadowColor = rgba(acc, 0.8 * sim.hot);
        ctx.shadowBlur = 6 * sim.hot;
        ctx.strokeStyle = rgba(acc, 0.5 * sim.hot);
        ctx.lineWidth = 1.5;
        pathAlong(0, sim.brk > 0.01 ? L * 0.82 : L);
        ctx.stroke();
        ctx.restore();
      }

      // current dashes
      for (const d of sim.dashes) {
        ctx.strokeStyle = rgba(acc, 0.95);
        ctx.lineWidth = 2;
        pathAlong(Math.max(0, d.s - 6), d.s);
        ctx.stroke();
      }

      // pulses: comet tail + white-hot head
      for (const p of sim.pulses) {
        for (let i = 12; i >= 1; i--) {
          const q = pointAt(p.s - p.dir * i * 2.4);
          const t = 1 - i / 13;
          ctx.fillStyle = rgba(acc, Math.pow(t, 1.5) * 0.9);
          ctx.beginPath(); ctx.arc(q[0], q[1], 0.5 + t * 2, 0, Math.PI * 2); ctx.fill();
        }
        const h = pointAt(p.s);
        const g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 7);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, rgba(acc, 0.9));
        g.addColorStop(1, rgba(acc, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(h[0], h[1], 7, 0, Math.PI * 2); ctx.fill();
      }

      // agent node
      if (sim.flash > 0.02) {
        const g = ctx.createRadialGradient(ox, cy, 0, ox, cy, 9);
        g.addColorStop(0, rgba(acc, 0.7 * sim.flash));
        g.addColorStop(1, rgba(acc, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ox, cy, 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = `rgba(28, 25, 23, ${0.45 + sim.hot * 0.4})`;
      ctx.beginPath(); ctx.arc(ox, cy, 2.6, 0, Math.PI * 2); ctx.fill();

      // ripples off the pad
      for (const r of sim.ripples) {
        ctx.strokeStyle = rgba(pad, r.a * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, cy, r.r, 0, Math.PI * 2); ctx.stroke();
      }

      // pad glow + ring
      const glow = Math.max(sim.energy, sim.err * 0.8);
      if (glow > 0.01) {
        const g = ctx.createRadialGradient(px, cy, 0, px, cy, rp * 2.1);
        g.addColorStop(0, rgba(pad, 0.55 * glow));
        g.addColorStop(1, rgba(pad, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, cy, rp * 2.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = rgba(pad, 0.3 + glow * 0.7);
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(px, cy, rp, 0, Math.PI * 2); ctx.stroke();

      // orbiting energy while the tool runs
      const orbit = running && sim.arrived ? Math.min(1, (sim.energy - 0.5) * 2) : 0;
      if (orbit > 0 && !reduced) {
        for (let i = 0; i < 3; i++) {
          const a = sim.spin + (i * Math.PI * 2) / 3;
          const x = px + Math.cos(a) * rp * 0.55, y = cy + Math.sin(a) * rp * 0.55;
          ctx.fillStyle = rgba(acc, 0.45 * orbit);
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.95 * orbit})`;
          ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
        }
      } else if (reduced && running) {
        ctx.fillStyle = rgba(acc, 0.9);
        ctx.beginPath(); ctx.arc(px, cy, rp * 0.45, 0, Math.PI * 2); ctx.fill();
      }

      // done: pad sets solid with a check
      if (sim.check > 0.01) {
        ctx.fillStyle = rgba(acc, sim.check);
        ctx.beginPath(); ctx.arc(px, cy, rp, 0, Math.PI * 2); ctx.fill();
        const c = [[px - rp * 0.42, cy + rp * 0.02], [px - rp * 0.1, cy + rp * 0.36], [px + rp * 0.46, cy - rp * 0.34]];
        const l1 = Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]);
        const l2 = Math.hypot(c[2][0] - c[1][0], c[2][1] - c[1][1]);
        const drawn = sim.check * (l1 + l2);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, sim.check * 1.4)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(c[0][0], c[0][1]);
        if (drawn <= l1) {
          const t = drawn / l1;
          ctx.lineTo(c[0][0] + (c[1][0] - c[0][0]) * t, c[0][1] + (c[1][1] - c[0][1]) * t);
        } else {
          ctx.lineTo(c[1][0], c[1][1]);
          const t = Math.min(1, (drawn - l1) / l2);
          ctx.lineTo(c[1][0] + (c[2][0] - c[1][0]) * t, c[1][1] + (c[2][1] - c[1][1]) * t);
        }
        ctx.stroke();
      }

      // error: red core + sparks
      if (sim.err > 0.01) {
        ctx.fillStyle = rgba(red, 0.75 * sim.err);
        ctx.beginPath(); ctx.arc(px, cy, rp * 0.5, 0, Math.PI * 2); ctx.fill();
      }
      for (const s of sim.sparks) {
        ctx.strokeStyle = rgba(red, s.life * 0.9);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${s.life * 0.8})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 0.9, 0, Math.PI * 2); ctx.fill();
      }

      // ---- sleep when nothing is moving ----
      const busy =
        running || calling ||
        sim.pulses.length || sim.dashes.length || sim.ripples.length || sim.sparks.length ||
        sim.flash > 0.02 ||
        Math.abs(sim.energy - energyT) > 0.005 || Math.abs(sim.hot - hotT) > 0.005 ||
        Math.abs(sim.check - (st === 'done' ? 1 : 0)) > 0.005 ||
        Math.abs(sim.err - (st === 'error' ? 1 : 0)) > 0.005 ||
        Math.abs(sim.brk - (st === 'error' ? 1 : 0)) > 0.005;
      if (busy) raf = requestAnimationFrame(tick);
      else sim.last = 0;
    }

    apply(status);
    kick();
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, width, color, errorColor]);

  useEffect(() => {
    kickRef.current(status);
  }, [status]);

  return (
    <span
      className={`pui-toolcall${className ? ` ${className}` : ''}`}
      data-status={status}
      style={{ '--tc-error': errorColor, ...style }}
      role="status"
      aria-label={`${name ?? 'tool'}: ${detail ?? STATUS_WORD[status]}`}
    >
      <canvas ref={canvasRef} style={{ width, height: size }} aria-hidden="true" />
      <span className="tc-text">
        {name && <span className="tc-name">{name}</span>}
        <span className="tc-detail">{detail ?? STATUS_WORD[status]}</span>
      </span>
    </span>
  );
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
