import { useEffect, useRef } from 'react';

/**
 * LiquidContextMeter
 *
 * The context-window usage gauge rendered as a glass vessel filling with
 * liquid. The level eases to its new value on a damped spring, and any
 * change injects "slosh" — a first-mode standing wave that rocks side to
 * side and decays — so a big chunk of context landing is felt, not just
 * read. Bubbles rise while it fills. Above `warnAt` the liquid warms
 * toward `warnColor`.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - value (0..1): fraction of context used.
 *  - width / height (number): canvas size in px. Default 120 × 200.
 *  - color (string): liquid colour. Default violet.
 *  - warnColor (string): colour to blend toward past `warnAt`. Default amber.
 *  - warnAt (0..1): where the warning blend starts. Default 0.8.
 */
export default function LiquidContextMeter({
  value = 0,
  width = 120,
  height = 200,
  color = '#7c3aed',
  warnColor = '#f59e0b',
  warnAt = 0.8,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const s = useRef({
    level: value,   // current (animated) level, 0..1
    vel: 0,         // spring velocity
    target: value,
    prev: value,
    slosh: 0,       // standing-wave amplitude, decays over time
    sloshDir: 1,
    t: 0,
    bubbles: [],
  });

  // Any change in value = new spring target + a kick of slosh energy
  // proportional to how big the jump was.
  useEffect(() => {
    const st = s.current;
    const delta = value - st.prev;
    st.prev = value;
    st.target = Math.max(0, Math.min(1, value));
    if (Math.abs(delta) > 0.002) {
      st.slosh = Math.min(1, st.slosh + Math.abs(delta) * 5);
      st.sloshDir = delta >= 0 ? 1 : -1;
      st.t = 0;
      if (delta > 0) {
        const n = Math.round(4 + delta * 40);
        for (let i = 0; i < n; i++) {
          st.bubbles.push({
            x: 0.2 + Math.random() * 0.6,
            y: 1 + Math.random() * 0.3, // start below the bottom, rise up
            r: 1 + Math.random() * 2,
            v: 0.004 + Math.random() * 0.006,
            wobble: Math.random() * Math.PI * 2,
          });
        }
      }
    }
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // vessel geometry (inset so the glass stroke isn't clipped)
    const pad = 4;
    const vx = pad;
    const vy = pad;
    const vw = width - pad * 2;
    const vh = height - pad * 2;
    const r = Math.min(vw, vh) * 0.22;

    function vesselPath() {
      ctx.beginPath();
      ctx.moveTo(vx + r * 0.4, vy);
      ctx.lineTo(vx + vw - r * 0.4, vy);
      ctx.quadraticCurveTo(vx + vw, vy, vx + vw, vy + r * 0.4);
      ctx.lineTo(vx + vw, vy + vh - r);
      ctx.quadraticCurveTo(vx + vw, vy + vh, vx + vw - r, vy + vh);
      ctx.lineTo(vx + r, vy + vh);
      ctx.quadraticCurveTo(vx, vy + vh, vx, vy + vh - r);
      ctx.lineTo(vx, vy + r * 0.4);
      ctx.quadraticCurveTo(vx, vy, vx + r * 0.4, vy);
      ctx.closePath();
    }

    // '#rrggbb' → [r, g, b]
    const hex = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const mix = (a, b, t) => a.map((c, i) => c * (1 - t) + b[i] * t);
    const rgb = (c, alpha = 1) =>
      `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${alpha})`;
    const baseRGB = hex(color);
    const warnRGB = hex(warnColor);
    const black = [0, 0, 0];

    function tick() {
      const st = s.current;
      st.t += 1 / 60;

      // damped spring toward target level
      st.vel += (st.target - st.level) * 0.05;
      st.vel *= 0.8;
      st.level += st.vel;

      // slosh decays
      st.slosh *= 0.972;

      const warm = Math.max(0, Math.min(1, (st.level - warnAt) / (1 - warnAt)));
      const liquid = mix(baseRGB, warnRGB, warm);

      ctx.clearRect(0, 0, width, height);

      // --- liquid (clipped to vessel) ---
      ctx.save();
      vesselPath();
      ctx.clip();

      const surfaceY = vy + vh - st.level * vh;
      const ampMain = st.slosh * vh * 0.08;
      const ampRipple = vh * 0.006 + st.slosh * vh * 0.015;

      ctx.beginPath();
      ctx.moveTo(vx - 2, vy + vh + 2);
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = vx + u * vw;
        // first-mode standing wave: one side rises as the other falls
        const stand = Math.cos(u * Math.PI) * Math.sin(st.t * 7.5) * ampMain * st.sloshDir;
        // small travelling ripple so the surface never looks frozen
        const ripple = Math.sin(u * Math.PI * 4 + st.t * 2.2) * ampRipple;
        ctx.lineTo(x, surfaceY + stand + ripple);
      }
      ctx.lineTo(vx + vw + 2, vy + vh + 2);
      ctx.closePath();

      const g = ctx.createLinearGradient(0, surfaceY, 0, vy + vh);
      g.addColorStop(0, rgb(liquid));
      g.addColorStop(1, rgb(mix(liquid, black, 0.25)));
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.9;
      ctx.fill();

      // lighter band just under the surface (refraction highlight)
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // bubbles
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      // a bubble lives until it reaches the surface (measured from the top)
      const surfaceFrac = 1 - st.level;
      st.bubbles = st.bubbles.filter((b) => b.y > surfaceFrac);
      for (const b of st.bubbles) {
        b.y -= b.v;
        b.wobble += 0.08;
        const bx = vx + (b.x + Math.sin(b.wobble) * 0.02) * vw;
        const by = vy + b.y * vh;
        if (by > surfaceY + 2) {
          ctx.beginPath();
          ctx.arc(bx, by, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // --- glass ---
      ctx.globalAlpha = 1;
      vesselPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.28)';
      ctx.stroke();

      // vertical light streak on the left wall
      const streak = ctx.createLinearGradient(vx, 0, vx + vw * 0.35, 0);
      streak.addColorStop(0, 'rgba(255,255,255,0.55)');
      streak.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      vesselPath();
      ctx.clip();
      ctx.fillStyle = streak;
      ctx.fillRect(vx + 3, vy + 8, vw * 0.35, vh - 16);
      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, color, warnColor, warnAt]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label="Context usage"
    />
  );
}
