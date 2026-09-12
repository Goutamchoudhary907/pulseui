import { useEffect, useRef } from 'react';

/**
 * SwarmStatus
 *
 * Parallel agents as flocks of light around a progress ring. Each running
 * agent is a small boid flock — real cohesion, alignment, separation —
 * orbiting the hub with a comet trail and its label riding alongside.
 * When an agent finishes, its flock streams into the core and the ring's
 * arc advances. When every agent is done, the core flares into a check.
 * A failed agent's flock turns red and drifts out of orbit.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - agents ([{ id, label?, status: 'running' | 'done' | 'error' }])
 *  - width / height (number): canvas size in px. Default 360 × 240.
 *  - boidsPerAgent (number): flock size. Default 8.
 *  - palette (string[]): one colour per agent, cycles. Default 6 hues.
 *  - errorColor (string): colour for failed agents. Default red.
 *  - showLabels (bool): draw agent labels beside their flocks. Default true.
 */
const DEFAULT_PALETTE = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];
const FONT = '500 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export default function SwarmStatus({
  agents = [],
  width = 360,
  height = 240,
  boidsPerAgent = 8,
  palette = DEFAULT_PALETTE,
  errorColor = '#ef4444',
  showLabels = true,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const flocksRef = useRef(new Map());
  const agentsRef = useRef(agents);
  const uiRef = useRef({ arc: 0, doneAt: null, flare: 0 });

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const hubR = Math.min(width, height) * 0.13;   // progress ring
    const orbitR = Math.min(width, height) * 0.36;  // where running flocks fly
    const margin = 14;

    const hex = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

    function makeFlock(index) {
      const angle = (index / Math.max(1, agentsRef.current.length)) * Math.PI * 2;
      const ox = cx + Math.cos(angle) * orbitR;
      const oy = cy + Math.sin(angle) * orbitR;
      return {
        color: palette[index % palette.length],
        rgb: hex(palette[index % palette.length]),
        angle,
        spin: (0.004 + Math.random() * 0.004) * (Math.random() < 0.5 ? -1 : 1),
        wobble: Math.random() * Math.PI * 2,
        labelX: ox,
        labelY: oy,
        labelAlpha: 0,
        boids: Array.from({ length: boidsPerAgent }, () => ({
          x: ox + (Math.random() - 0.5) * 24,
          y: oy + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          hist: [],
        })),
      };
    }

    function tick(now) {
      const list = agentsRef.current;
      const flocks = flocksRef.current;
      const ui = uiRef.current;
      const errRGB = hex(errorColor);

      list.forEach((a, i) => {
        if (!flocks.has(a.id)) flocks.set(a.id, makeFlock(i));
      });
      for (const id of [...flocks.keys()]) {
        if (!list.some((a) => a.id === id)) flocks.delete(id);
      }

      const total = list.length;
      const done = list.filter((a) => a.status === 'done').length;
      const allDone = total > 0 && done === total;
      if (allDone && ui.doneAt == null) ui.doneAt = now;
      if (!allDone) ui.doneAt = null;
      ui.arc += ((total ? done / total : 0) - ui.arc) * 0.08;
      ui.flare += ((allDone ? 1 : 0) - ui.flare) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // ---- hub: track ring + progress arc ----
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.10)';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (ui.arc > 0.002) {
        ctx.beginPath();
        ctx.arc(cx, cy, hubR, -Math.PI / 2, -Math.PI / 2 + ui.arc * Math.PI * 2);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // core glow grows with the number of absorbed flocks
      const coreStrength = total ? done / total : 0;
      if (coreStrength > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR * 0.9);
        g.addColorStop(0, `rgba(124, 58, 237, ${0.18 + coreStrength * 0.25 + ui.flare * 0.25})`);
        g.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, hubR * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // completion: pulse rings + check
      if (allDone) {
        const age = (now - ui.doneAt) / 1000;
        for (let k = 0; k < 2; k++) {
          const p = ((age + k * 0.9) % 1.8) / 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, hubR + p * hubR * 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(124, 58, 237, ${(1 - p) * 0.3})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // ---- flocks ----
      list.forEach((agent) => {
        const f = flocks.get(agent.id);
        const running = agent.status === 'running';
        const errored = agent.status === 'error';
        const finished = agent.status === 'done';

        // where this flock wants to be
        let tx, ty;
        if (running) {
          f.angle += f.spin;
          f.wobble += 0.02;
          const r = orbitR + Math.sin(f.wobble) * orbitR * 0.12;
          tx = cx + Math.cos(f.angle) * r;
          ty = cy + Math.sin(f.angle) * r * 0.78; // slightly elliptical orbit
        } else if (errored) {
          tx = cx + Math.cos(f.angle) * orbitR * 1.28;
          ty = cy + Math.sin(f.angle) * orbitR * 1.0;
        } else {
          tx = cx;
          ty = cy;
        }

        let mx = 0, my = 0, mvx = 0, mvy = 0;
        for (const b of f.boids) { mx += b.x; my += b.y; mvx += b.vx; mvy += b.vy; }
        const n = f.boids.length;
        mx /= n; my /= n; mvx /= n; mvy /= n;

        for (const b of f.boids) {
          b.hist.push(b.x, b.y);
          if (b.hist.length > 16) b.hist.splice(0, 2);

          // cohesion / alignment
          b.vx += (mx - b.x) * (finished ? 0.01 : 0.004);
          b.vy += (my - b.y) * (finished ? 0.01 : 0.004);
          b.vx += (mvx - b.vx) * 0.05;
          b.vy += (mvy - b.vy) * 0.05;
          // separation
          for (const other of flocks.values()) {
            for (const o of other.boids) {
              if (o === b) continue;
              const dx = b.x - o.x, dy = b.y - o.y;
              const d2 = dx * dx + dy * dy;
              const minD = other === f ? 8 : 14;
              if (d2 < minD * minD && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const push = finished ? 0.03 : 0.08;
                b.vx += (dx / d) * push;
                b.vy += (dy / d) * push;
              }
            }
          }
          // steer to target
          const pull = running ? 0.004 : finished ? 0.02 : 0.006;
          b.vx += (tx - b.x) * pull;
          b.vy += (ty - b.y) * pull;
          if (finished) {
            // keep a slow swirl alive inside the core
            const dx = b.x - cx, dy = b.y - cy;
            b.vx += -dy * 0.012;
            b.vy += dx * 0.012;
          }
          if (errored) {
            b.vx += (Math.random() - 0.5) * 0.6;
            b.vy += (Math.random() - 0.5) * 0.6;
          }
          // soft bounds
          if (b.x < margin) b.vx += 0.2;
          if (b.x > width - margin) b.vx -= 0.2;
          if (b.y < margin) b.vy += 0.2;
          if (b.y > height - margin) b.vy -= 0.2;

          const damp = running ? 0.985 : finished ? 0.92 : 0.96;
          b.vx *= damp; b.vy *= damp;
          const sp = Math.hypot(b.vx, b.vy);
          const max = running ? 1.9 : finished ? 3.2 : 1.2;
          if (sp > max) { b.vx = (b.vx / sp) * max; b.vy = (b.vy / sp) * max; }
          b.x += b.vx;
          b.y += b.vy;
        }

        // draw: comet trails then bright heads
        const rgb = errored ? errRGB : f.rgb;
        ctx.lineCap = 'round';
        for (const b of f.boids) {
          const h = b.hist;
          const pts = h.length / 2;
          for (let i = 1; i < pts; i++) {
            const t = i / pts;
            ctx.beginPath();
            ctx.moveTo(h[(i - 1) * 2], h[(i - 1) * 2 + 1]);
            ctx.lineTo(h[i * 2], h[i * 2 + 1]);
            ctx.strokeStyle = rgba(rgb, t * (finished ? 0.35 : 0.55));
            ctx.lineWidth = 0.6 + t * 1.6;
            ctx.stroke();
          }
        }
        for (const b of f.boids) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, finished ? 1.6 : 2.1, 0, Math.PI * 2);
          ctx.fillStyle = rgba(rgb, 1);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = rgba(rgb, 0.18);
          ctx.fill();
        }

        // label rides beside the flock while it's running / failed
        if (showLabels && agent.label) {
          const want = finished ? 0 : 1;
          f.labelAlpha += (want - f.labelAlpha) * 0.1;
          f.labelX += (mx - f.labelX) * 0.12;
          f.labelY += (my - f.labelY) * 0.12;
          if (f.labelAlpha > 0.02) {
            const text = errored ? `${agent.label} · failed` : agent.label;
            ctx.font = FONT;
            const tw = ctx.measureText(text).width;
            const side = f.labelX < cx ? -1 : 1;
            const lx = f.labelX + side * 16 - (side < 0 ? tw + 16 : 0);
            const ly = f.labelY - 20;
            ctx.globalAlpha = f.labelAlpha;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            roundRect(ctx, lx - 6, ly - 10, tw + 22, 20, 10);
            ctx.fill();
            ctx.strokeStyle = 'rgba(28, 25, 23, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(lx + 2, ly, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = errored
              ? errorColor
              : rgba(rgb, 0.55 + Math.sin(now / 250) * 0.45);
            ctx.fill();
            ctx.fillStyle = errored ? errorColor : '#44403c';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, lx + 10, ly + 0.5);
            ctx.globalAlpha = 1;
          }
        }
      });

      // ---- hub text: count, or check when complete ----
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (ui.flare > 0.5) {
        ctx.strokeStyle = `rgba(124, 58, 237, ${(ui.flare - 0.5) * 2})`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - hubR * 0.32, cy + hubR * 0.02);
        ctx.lineTo(cx - hubR * 0.08, cy + hubR * 0.28);
        ctx.lineTo(cx + hubR * 0.36, cy - hubR * 0.26);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 1 - ui.flare * 2;
        ctx.font = FONT;
        ctx.fillStyle = '#1c1917';
        ctx.fillText(`${done}/${total}`, cx, cy + 0.5);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'start';

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, boidsPerAgent, palette, errorColor, showLabels]);

  const done = agents.filter((a) => a.status === 'done').length;
  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      role="img"
      aria-label={`${done} of ${agents.length} agents finished`}
    />
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
