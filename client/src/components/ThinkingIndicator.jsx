import { useEffect, useRef } from 'react';

/**
 * ThinkingIndicator
 *
 * Replaces the generic AI "thinking" spinner with a loose particle field
 * that visibly drifts while the model is working, then converges and
 * tightens into a single bright point once it has settled on an answer.
 * A soft ring pulses out on that beat and `onSettled` fires. Flip back to
 * thinking and the point blooms open into a field again.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - settled (bool): false = drifting/thinking, true = converge & tighten
 *  - size (number): canvas width/height in px (square). Default 160.
 *  - particleCount (number): default 60.
 *  - color (string): particle colour as hex. Default violet.
 *  - onSettled (fn): called once, when the field has fully converged.
 */
export default function ThinkingIndicator({
  settled = false,
  size = 160,
  particleCount = 60,
  color = '#7c3aed',
  onSettled,
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const settledRef = useRef(settled);
  const onSettledRef = useRef(onSettled);
  const rafRef = useRef(null);
  // fired: onSettled already called for this settle
  // ring:  progress of the pulse ring, -1 when idle
  // bloom: burst the field open on the next frame
  const beat = useRef({ fired: false, ring: -1, bloom: false });

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  // keep latest `settled` value available inside the animation loop
  useEffect(() => {
    if (settledRef.current && !settled) {
      beat.current.fired = false;
      beat.current.ring = -1;
      beat.current.bloom = true;
    }
    settledRef.current = settled;
  }, [settled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const TAU = Math.PI * 2;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const k = size / 160; // scales speeds and dot sizes with the canvas
    const rgb = hexToRgb(color);
    const rgba = (a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.6 * k,
        vy: (Math.random() - 0.5) * 0.6 * k,
        baseSize: (1 + Math.random() * 1.8) * k,
        depth: 0.4 + Math.random() * 0.6, // near/far: alpha and size
        spark: 0,                          // brief brighten, decays to 0
      };
    });

    let t = 0;
    function tick() {
      t += 1 / 60;
      ctx.clearRect(0, 0, size, size);
      const isSettled = settledRef.current;
      const b = beat.current;

      // the field breathes — its boundary swells and relaxes slowly
      const bound = radius * (reduce ? 1 : 0.94 + 0.06 * Math.sin(t * 1.4));

      if (b.bloom) {
        // released from the point: burst outward, then drift as usual
        b.bloom = false;
        for (const p of particlesRef.current) {
          const a = Math.random() * TAU;
          const v = (1.5 + Math.random() * 2.5) * k;
          p.vx = Math.cos(a) * v;
          p.vy = Math.sin(a) * v;
        }
      }

      let gathered = 0;
      ctx.lineCap = 'round';
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
          if (dist > bound) {
            p.vx -= (dx / dist) * 0.04 * k;
            p.vy -= (dy / dist) * 0.04 * k;
          }

          // gentle random jitter so motion never looks mechanical
          const j = (reduce ? 0.02 : 0.05) * k;
          p.vx += (Math.random() - 0.5) * j;
          p.vy += (Math.random() - 0.5) * j;

          // damping to keep speeds bounded
          p.vx *= 0.98;
          p.vy *= 0.98;

          // now and then a particle sparks — a brief bright flash
          if (!reduce && p.spark <= 0 && Math.random() < 0.004) p.spark = 1;
        }
        if (p.spark > 0) p.spark = Math.max(0, p.spark - 0.04);

        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d < 4 * k) gathered++;
        const glow = isSettled ? Math.max(0, 1 - d / (6 * k)) : 0;
        const alpha = (isSettled ? 0.5 + glow * 0.5 : 0.35 + p.depth * 0.4) + p.spark * 0.3;
        const r = p.baseSize * (0.7 + p.depth * 0.4) + glow * 1.5 * k + p.spark * 0.8 * k;

        // short motion trail while drifting
        if (!isSettled && !reduce) {
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 5, p.y - p.vy * 5);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = rgba(alpha * 0.25);
          ctx.lineWidth = r * 0.8;
          ctx.stroke();
        }

        // soft halo (fades out as the field gathers so the point stays crisp)
        const h = r * 2.4;
        const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, h);
        hg.addColorStop(0, rgba(alpha * 0.35 * (1 - glow * 0.9)));
        hg.addColorStop(1, rgba(0));
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, h, 0, TAU);
        ctx.fill();

        // the dot
        ctx.beginPath();
        ctx.fillStyle = p.spark > 0.5 ? `rgba(255, 255, 255, ${alpha})` : rgba(alpha);
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      }

      // core glow builds as the field converges: white-hot centre, colour edge
      const conv = gathered / particleCount;
      if (conv > 0) {
        const cr = 14 * k;
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        cg.addColorStop(0, `rgba(255, 255, 255, ${0.9 * conv})`);
        cg.addColorStop(0.35, rgba(0.5 * conv));
        cg.addColorStop(1, rgba(0));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, TAU);
        ctx.fill();
      }

      // the beat: fire once, send a ring out
      if (isSettled && !b.fired && conv > 0.9) {
        b.fired = true;
        b.ring = 0;
        onSettledRef.current?.();
      }
      if (b.ring >= 0) {
        b.ring += (1 / 60) * 1.3;
        if (b.ring > 1) b.ring = -1;
      }
      if (b.ring >= 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, 4 * k + b.ring * radius * 1.1, 0, TAU);
        ctx.strokeStyle = rgba((1 - b.ring) * 0.5);
        ctx.lineWidth = 1.5 * k;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
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
