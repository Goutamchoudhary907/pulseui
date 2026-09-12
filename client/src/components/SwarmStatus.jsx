import { useEffect, useRef } from 'react';

/**
 * SwarmStatus
 *
 * Parallel subagents / tasks shown as boid-style flocks. Each running agent
 * is a small flock that wanders the space with real cohesion, alignment
 * and separation. When an agent finishes, its flock is drawn to the centre
 * and settles tight. When every agent is done, all flocks collapse into a
 * single point and a ring pulses out.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - agents ([{ id, status: 'running' | 'done' | 'error' }]): one flock each.
 *  - width / height (number): canvas size in px. Default 320 × 200.
 *  - boidsPerAgent (number): flock size. Default 7.
 *  - palette (string[]): one colour per agent, cycles. Default 6 hues.
 *  - errorColor (string): colour for agents in 'error'. Default red.
 */
const DEFAULT_PALETTE = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

export default function SwarmStatus({
  agents = [],
  width = 320,
  height = 200,
  boidsPerAgent = 7,
  palette = DEFAULT_PALETTE,
  errorColor = '#ef4444',
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const flocksRef = useRef(new Map()); // agent id → flock
  const agentsRef = useRef(agents);
  const doneAtRef = useRef(null); // timestamp all agents finished (for the pulse)

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
    const margin = 18;

    function randomTarget() {
      return {
        x: margin + Math.random() * (width - margin * 2),
        y: margin + Math.random() * (height - margin * 2),
      };
    }

    function makeFlock(index) {
      const origin = randomTarget();
      return {
        color: palette[index % palette.length],
        target: randomTarget(),
        retargetAt: 0,
        boids: Array.from({ length: boidsPerAgent }, () => ({
          x: origin.x + (Math.random() - 0.5) * 20,
          y: origin.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
        })),
      };
    }

    function tick(now) {
      const list = agentsRef.current;
      const flocks = flocksRef.current;

      // sync flocks with the agent list
      list.forEach((a, i) => {
        if (!flocks.has(a.id)) flocks.set(a.id, makeFlock(i));
      });
      for (const id of [...flocks.keys()]) {
        if (!list.some((a) => a.id === id)) flocks.delete(id);
      }

      const allDone = list.length > 0 && list.every((a) => a.status === 'done');
      if (allDone && doneAtRef.current == null) doneAtRef.current = now;
      if (!allDone) doneAtRef.current = null;

      ctx.clearRect(0, 0, width, height);

      // convergence pulse
      if (allDone) {
        const age = (now - doneAtRef.current) / 1000;
        const ring = (age % 1.8) / 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 + ring * 46, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124, 58, 237, ${(1 - ring) * 0.35})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      list.forEach((agent) => {
        const f = flocks.get(agent.id);
        const running = agent.status === 'running';
        const errored = agent.status === 'error';

        if (running && now > f.retargetAt) {
          f.target = randomTarget();
          f.retargetAt = now + 1400 + Math.random() * 1800;
        }
        const target = running ? f.target : { x: cx, y: cy };

        // flock centroid + mean velocity
        let mx = 0, my = 0, mvx = 0, mvy = 0;
        for (const b of f.boids) { mx += b.x; my += b.y; mvx += b.vx; mvy += b.vy; }
        const n = f.boids.length;
        mx /= n; my /= n; mvx /= n; mvy /= n;

        for (const b of f.boids) {
          // cohesion — toward flock centroid
          b.vx += (mx - b.x) * 0.004;
          b.vy += (my - b.y) * 0.004;
          // alignment — match flock heading
          b.vx += (mvx - b.vx) * 0.05;
          b.vy += (mvy - b.vy) * 0.05;
          // separation — from every boid in every flock
          for (const other of flocks.values()) {
            for (const o of other.boids) {
              if (o === b) continue;
              const dx = b.x - o.x, dy = b.y - o.y;
              const d2 = dx * dx + dy * dy;
              const minD = other === f ? 9 : 16;
              if (d2 < minD * minD && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const push = allDone ? 0.02 : 0.08;
                b.vx += (dx / d) * push;
                b.vy += (dy / d) * push;
              }
            }
          }
          // steer to target (strong pull + damping once done → tight settle)
          const pull = running ? 0.0035 : allDone ? 0.03 : 0.012;
          b.vx += (target.x - b.x) * pull;
          b.vy += (target.y - b.y) * pull;
          if (errored) {
            b.vx += (Math.random() - 0.5) * 0.9;
            b.vy += (Math.random() - 0.5) * 0.9;
          }
          // soft bounds
          if (b.x < margin) b.vx += 0.15;
          if (b.x > width - margin) b.vx -= 0.15;
          if (b.y < margin) b.vy += 0.15;
          if (b.y > height - margin) b.vy -= 0.15;

          // speed limit + damping
          const damp = running ? 0.985 : 0.9;
          b.vx *= damp; b.vy *= damp;
          const sp = Math.hypot(b.vx, b.vy);
          const max = running ? 1.7 : 2.6;
          if (sp > max) { b.vx = (b.vx / sp) * max; b.vy = (b.vy / sp) * max; }

          b.x += b.vx;
          b.y += b.vy;
        }

        // draw: short motion trail + dot
        const color = errored ? errorColor : f.color;
        for (const b of f.boids) {
          const sp = Math.hypot(b.vx, b.vy);
          ctx.beginPath();
          ctx.moveTo(b.x - b.vx * 3.5, b.y - b.vy * 3.5);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = color;
          ctx.globalAlpha = Math.min(0.5, sp * 0.3);
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(b.x, b.y, running ? 2 : 2.4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = running ? 0.85 : 1;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });

      // glowing core once converged
      if (allDone) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        g.addColorStop(0, 'rgba(124, 58, 237, 0.55)');
        g.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, boidsPerAgent, palette, errorColor]);

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
