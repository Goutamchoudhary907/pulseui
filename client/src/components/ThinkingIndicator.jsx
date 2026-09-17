import { useEffect, useRef } from 'react';

/**
 * ThinkingIndicator
 *
 * Replaces the AI "thinking" spinner with a field of thoughts. Particles
 * drift on slow currents; when two pass close, a faint link forms and now
 * and then a bright pulse fires across it — a synapse. `activity` sets how
 * lively the field is, so a reasoning stream can drive it. When the model
 * settles, every link flashes at once — the click — the field holds for a
 * beat, then spirals in and collapses into a white-hot core with a ring
 * pulse; `onSettled` fires on that beat. Flip back to thinking and the
 * core blooms open into a field again.
 *
 * Holds up from 20px inline next to an avatar up to a 240px hero.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame; the loop
 * sleeps once the core is at rest.
 *
 * Props:
 *  - settled (bool): false = thinking, true = converge. Default false.
 *  - activity (number 0..1): how lively — speed and firing rate. Default 0.55.
 *  - size (number): canvas width/height in px. Default 32.
 *  - particleCount (number): default scales with size (14 at 24px, 60 at 160px).
 *  - color (hex): particle colour. Default '#7c3aed'.
 *  - onSettled (fn): called once when the field has collapsed into the core.
 */
export default function ThinkingIndicator({
  settled = false,
  activity = 0.55,
  size = 32,
  particleCount,
  color = '#7c3aed',
  onSettled,
}) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const propsRef = useRef({ settled, activity, onSettled });
  const kickRef = useRef(() => {});

  useEffect(() => {
    const prev = propsRef.current.settled;
    propsRef.current = { settled, activity, onSettled };
    const sim = simRef.current;
    if (sim && prev !== settled) {
      if (settled) {
        sim.phase = 'click';
        sim.phaseAt = performance.now();
        sim.fired = false;
      } else {
        sim.phase = 'bloom';
        sim.phaseAt = performance.now();
        sim.ring = -1;
      }
    }
    kickRef.current();
  }, [settled, activity, onSettled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const TAU = Math.PI * 2;
    const cx = size / 2, cy = size / 2;
    const radius = size * 0.4;
    const k = size / 160;                  // distances / speeds
    const ds = Math.max(0.6, k);           // dot + line sizes hold up when small
    const n = particleCount ?? Math.round(Math.min(64, Math.max(14, size * 0.38)));
    const linkDist = size * 0.19;
    const rgb = hexToRgb(color);
    const rgba = (a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    const ps = Array.from({ length: n }, () => {
      const a = Math.random() * TAU;
      const r = Math.sqrt(Math.random()) * radius;
      return {
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        vx: 0, vy: 0,
        base: (1 + Math.random() * 1.6) * ds,
        depth: 0.4 + Math.random() * 0.6,
        spark: 0,
        seed: Math.random() * 1000,
      };
    });

    const sim = {
      ps,
      phase: propsRef.current.settled ? 'core' : 'drift',
      phaseAt: performance.now(),
      fires: [],           // {a, b, t}
      click: 0,            // link flash strength
      ring: -1,
      flash: 0,
      fired: propsRef.current.settled,
      conv: 0,
      last: 0,
      t: 0,
    };
    if (sim.phase === 'core') for (const p of ps) { p.x = cx; p.y = cy; }
    simRef.current = sim;

    let raf = 0;
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    kickRef.current = kick;

    function tick(now) {
      raf = 0;
      const dt = Math.min(48, sim.last ? now - sim.last : 16);
      sim.last = now;
      const f = dt / 16;
      sim.t += dt / 1000;
      const { activity: act, onSettled: cb } = propsRef.current;
      const a = Math.max(0, Math.min(1, act));
      const age = now - sim.phaseAt;

      // ---- phase transitions ----
      if (sim.phase === 'click' && age > 320) { sim.phase = 'spiral'; sim.phaseAt = now; }
      if (sim.phase === 'bloom') {
        for (const p of ps) {
          const ang = Math.random() * TAU;
          const v = (1.4 + Math.random() * 2.2) * k;
          p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v;
        }
        sim.flash = 0.6;
        sim.phase = 'drift';
        sim.phaseAt = now;
      }
      const drifting = sim.phase === 'drift';
      const clicking = sim.phase === 'click';
      const spiral = sim.phase === 'spiral';
      const core = sim.phase === 'core';

      // ---- particles ----
      const bound = radius * (reduce ? 1 : 0.94 + 0.06 * Math.sin(sim.t * 1.3));
      let gathered = 0;
      for (const p of ps) {
        if (drifting) {
          // coherent currents: a slow, time-varying flow field
          const fx = 0.06 / k, ft = sim.t * (0.35 + a * 0.45);
          const ax = Math.sin(p.y * fx + ft + p.seed) * Math.cos(p.x * fx * 0.7 - ft * 0.6);
          const ay = Math.cos(p.x * fx - ft * 0.8 + p.seed) * Math.sin(p.y * fx * 0.6 + ft * 0.5);
          const drive = (0.02 + a * 0.05) * k * (reduce ? 0.4 : 1);
          p.vx += ax * drive * f;
          p.vy += ay * drive * f;
          // soft circular bound + weak centre pull so it stays a cloud
          const dx = p.x - cx, dy = p.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          if (d > bound) { p.vx -= (dx / d) * 0.05 * k * f; p.vy -= (dy / d) * 0.05 * k * f; }
          p.vx -= dx * 0.0006 * f; p.vy -= dy * 0.0006 * f;
          p.vx *= Math.pow(0.975, f); p.vy *= Math.pow(0.975, f);
          const max = (0.5 + a * 0.9) * k;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
          p.x += p.vx * f; p.y += p.vy * f;
        } else if (clicking) {
          p.vx *= Math.pow(0.8, f); p.vy *= Math.pow(0.8, f);
          p.x += p.vx * f; p.y += p.vy * f;
        } else if (spiral) {
          // swirl inward, accelerating
          const dx = cx - p.x, dy = cy - p.y;
          const d = Math.hypot(dx, dy) || 1;
          const g = Math.min(1, age / 700);
          const pull = (0.02 + g * 0.12) * f;
          p.vx += dx * pull + (-dy / d) * (0.9 - g * 0.6) * k * f;
          p.vy += dy * pull + (dx / d) * (0.9 - g * 0.6) * k * f;
          p.vx *= Math.pow(0.86, f); p.vy *= Math.pow(0.86, f);
          p.x += p.vx * f; p.y += p.vy * f;
        } else {
          p.x += (cx - p.x) * 0.3 * f; p.y += (cy - p.y) * 0.3 * f;
        }
        if (p.spark > 0) p.spark = Math.max(0, p.spark - 0.045 * f);
        if (Math.hypot(p.x - cx, p.y - cy) < 4 * k + 1) gathered++;
      }
      sim.conv += (gathered / n - sim.conv) * 0.2 * f;

      // ---- links + synapse fires ----
      const links = [];
      if (drifting || clicking) {
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
            const d2 = dx * dx + dy * dy;
            if (d2 < linkDist * linkDist) links.push([i, j, 1 - Math.sqrt(d2) / linkDist]);
          }
        }
        if (drifting && !reduce && links.length && Math.random() < (0.01 + a * 0.05) * f) {
          const l = links[(Math.random() * links.length) | 0];
          sim.fires.push({ a: l[0], b: l[1], t: 0 });
        }
      }
      if (clicking) sim.click = Math.min(1, sim.click + 0.25 * f);
      else sim.click = Math.max(0, sim.click - 0.04 * f);
      for (const fr of sim.fires) fr.t += (dt / 260);
      sim.fires = sim.fires.filter((fr) => {
        if (fr.t >= 1) { ps[fr.b].spark = 1; return false; }
        return true;
      });

      // ---- draw ----
      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = 'round';

      // links
      for (const [i, j, w] of links) {
        const al = w * (0.14 + a * 0.12) + sim.click * w * 0.6;
        ctx.strokeStyle = rgba(al);
        ctx.lineWidth = (0.6 + sim.click * 0.8) * ds;
        ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
      }
      // firing pulses
      for (const fr of sim.fires) {
        const A = ps[fr.a], B = ps[fr.b];
        const x = A.x + (B.x - A.x) * fr.t, y = A.y + (B.y - A.y) * fr.t;
        const tx = A.x + (B.x - A.x) * Math.max(0, fr.t - 0.25), ty = A.y + (B.y - A.y) * Math.max(0, fr.t - 0.25);
        ctx.strokeStyle = rgba(0.7);
        ctx.lineWidth = 1.2 * ds;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath(); ctx.arc(x, y, 1.1 * ds, 0, TAU); ctx.fill();
      }

      // particles
      for (const p of ps) {
        const d = Math.hypot(p.x - cx, p.y - cy);
        const glow = spiral || core ? Math.max(0, 1 - d / (6 * k)) : 0;
        const alpha = Math.min(1, (core || spiral ? 0.5 + glow * 0.5 : 0.35 + p.depth * 0.45) + p.spark * 0.4 + sim.click * 0.2);
        const r = p.base * (0.7 + p.depth * 0.4) + glow * 1.4 * ds + p.spark * 0.9 * ds;
        if ((drifting || spiral) && !reduce) {
          ctx.strokeStyle = rgba(alpha * 0.25);
          ctx.lineWidth = r * 0.8;
          ctx.beginPath(); ctx.moveTo(p.x - p.vx * 5, p.y - p.vy * 5); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        const h = r * 2.4;
        const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, h);
        hg.addColorStop(0, rgba(alpha * 0.35 * (1 - glow * 0.9)));
        hg.addColorStop(1, rgba(0));
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(p.x, p.y, h, 0, TAU); ctx.fill();
        ctx.fillStyle = p.spark > 0.5 ? `rgba(255,255,255,${alpha})` : rgba(alpha);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      }

      // core
      const conv = sim.conv;
      if (conv > 0.02) {
        const cr = (12 + sim.flash * 10) * k + 2;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, `rgba(255,255,255,${Math.min(1, 0.9 * conv + sim.flash)})`);
        cg.addColorStop(0.35, rgba(0.55 * conv + sim.flash * 0.3));
        cg.addColorStop(1, rgba(0));
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, TAU); ctx.fill();
      }
      if (sim.flash > 0) sim.flash = Math.max(0, sim.flash - 0.05 * f);

      // the beat: collapse complete → flash, ring, callback
      if (spiral && conv > 0.9) {
        sim.phase = 'core';
        sim.phaseAt = now;
        sim.flash = 1;
        sim.ring = 0;
        if (!sim.fired) { sim.fired = true; cb?.(); }
      }
      if (sim.ring >= 0) {
        sim.ring += (dt / 1000) * 1.3;
        if (sim.ring > 1) sim.ring = -1;
        else {
          ctx.strokeStyle = rgba((1 - sim.ring) * 0.5);
          ctx.lineWidth = 1.5 * ds;
          ctx.beginPath(); ctx.arc(cx, cy, 4 * k + sim.ring * radius * 1.15, 0, TAU); ctx.stroke();
        }
      }

      // ---- sleep when the core is at rest ----
      const busy = !core || sim.ring >= 0 || sim.flash > 0 || conv < 0.985 || ps.some((p) => p.spark > 0);
      if (busy) raf = requestAnimationFrame(tick);
      else sim.last = 0;
    }

    kick();
    return () => { cancelAnimationFrame(raf); raf = 0; };
  }, [size, particleCount, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block' }}
      aria-label={settled ? 'Response ready' : 'Thinking'}
      role="img"
    />
  );
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [124, 58, 237];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
