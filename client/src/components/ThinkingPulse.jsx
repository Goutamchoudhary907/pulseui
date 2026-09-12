import { useEffect, useRef } from 'react';

/**
 * ThinkingPulse
 *
 * Replaces the generic AI "thinking" spinner with a loose particle field
 * that visibly drifts while the model is working, then converges and
 * tightens into a single point once it has settled on an answer.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - settled (bool): false = drifting/thinking, true = converge & tighten
 *  - size (number): canvas width/height in px (square). Default 160.
 *  - particleCount (number): default 60.
 *  - color (string): particle color. Default a soft violet.
 */
export default function ThinkingPulse({
  settled = false,
  size = 160,
  particleCount = 60,
  color = '#c084fc',
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const settledRef = useRef(settled);
  const rafRef = useRef(null);

  // keep latest `settled` value available inside the animation loop
  useEffect(() => {
    settledRef.current = settled;
  }, [settled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        baseSize: 1 + Math.random() * 1.8,
      };
    });

    function tick() {
      ctx.clearRect(0, 0, size, size);
      const isSettled = settledRef.current;

      for (const p of particlesRef.current) {
        if (isSettled) {
          // pull each particle toward the center, tightening the field
          const dx = cx - p.x;
          const dy = cy - p.y;
          p.x += dx * 0.06;
          p.y += dy * 0.06;
        } else {
          // loose organic drift, softly bounded to the circle
          p.x += p.vx;
          p.y += p.vy;

          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radius) {
            p.vx -= (dx / dist) * 0.04;
            p.vy -= (dy / dist) * 0.04;
          }

          // gentle random jitter so motion never looks mechanical
          p.vx += (Math.random() - 0.5) * 0.05;
          p.vy += (Math.random() - 0.5) * 0.05;

          // damping to keep speeds bounded
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        const dSettled = Math.hypot(p.x - cx, p.y - cy);
        const glow = isSettled ? Math.max(0, 1 - dSettled / 6) : 0;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = isSettled ? 0.5 + glow * 0.5 : 0.55;
        ctx.arc(p.x, p.y, p.baseSize + glow * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, particleCount, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      aria-label={settled ? 'Response ready' : 'Thinking'}
      role="img"
    />
  );
}
