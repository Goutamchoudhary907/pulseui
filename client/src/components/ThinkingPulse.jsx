import { useEffect, useRef } from 'react';

/**
 * ThinkingPulse
 *
 * Replaces the generic AI "thinking" spinner. Glowing particles ride three
 * tilted orbital rings around a breathing core — a gyroscope of light, each
 * ring turning at its own speed with front/back depth shading. Pulses of
 * light travel along the rings like activity. When the model settles, the
 * rings spin up and contract into a single bright point, a ring pulses out,
 * and `onSettled` fires on that beat. Flip back and the rings bloom open.
 *
 * Always centred, always inside its canvas. Zero dependencies — plain
 * <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - settled (bool): false = thinking, true = collapse. Default false.
 *  - size (number): canvas width/height in px. Works from ~20 (inline in a
 *      chat bubble) up to hero sizes. Default 160.
 *  - activity (0..1): how hard it's thinking — spin speed, breathing and
 *      pulse rate. Tie it to tokens/sec or tool calls. Default 0.6.
 *  - particleCount (number): total across the rings. Default scales with size.
 *  - color (string): hex colour. Default violet.
 *  - onSettled (fn): called once when the rings have fully collapsed.
 */
export default function ThinkingPulse({
  settled = false,
  size = 160,
  activity = 0.6,
  particleCount,
  color = '#7c3aed',
  onSettled,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const settledRef = useRef(settled);
  const activityRef = useRef(activity);
  const onSettledRef = useRef(onSettled);
  const s = useRef({ collapse: 0, cv: 0, done: false, ring: -1, t: 0 });

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);
  useEffect(() => {
    activityRef.current = Math.max(0, Math.min(1, activity));
  }, [activity]);
  useEffect(() => {
    settledRef.current = settled;
    if (!settled) {
      s.current.done = false;
      s.current.ring = -1;
    }
  }, [settled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.4;                       // outermost orbit
    const k = size / 160;
    const total = particleCount ?? Math.max(12, Math.round(size * 0.3));
    const n = parseInt(color.slice(1), 16);
    const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const rgba = (a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    // three rings: radius, squash (tilt), orientation, spin, share of particles
    const rings = [
      { r: 0.5, squash: 0.42, phi: -0.6, spin: 1.35, share: 0.25, pulse: -1 },
      { r: 0.76, squash: 0.62, phi: 0.9, spin: -0.95, share: 0.33, pulse: -1 },
      { r: 1.0, squash: 0.86, phi: 0.2, spin: 0.7, share: 0.42, pulse: -1 },
    ].map((ring) => {
      const count = Math.max(4, Math.round(total * ring.share));
      return {
        ...ring,
        particles: Array.from({ length: count }, (_, i) => ({
          theta: (i / count) * Math.PI * 2 + Math.random() * 0.25,
          size: Math.max(0.8, (1 + Math.random() * 0.8) * k),
        })),
      };
    });

    function tick() {
      const st = s.current;
      const act = reduce ? activityRef.current * 0.3 : activityRef.current;
      const dt = 1 / 60;
      st.t += dt;

      // collapse spring: 0 = open, 1 = a single point
      const target = settledRef.current ? 1 : 0;
      st.cv += (target - st.collapse) * 0.012;
      st.cv *= 0.86;
      st.collapse = Math.max(0, Math.min(1, st.collapse + st.cv));
      const c = st.collapse;

      // the beat
      if (settledRef.current && !st.done && c > 0.985) {
        st.done = true;
        st.ring = 0;
        onSettledRef.current?.();
      }
      if (st.ring >= 0) st.ring = Math.min(1.2, st.ring + dt * 1.3);

      // rings contract and spin up as they collapse (angular momentum)
      const speed = (0.5 + act * 1.1) * (1 + c * 5);
      const open = 1 - c;

      ctx.clearRect(0, 0, size, size);

      // breathing core
      const breathe = 0.5 + 0.5 * Math.sin(st.t * (1.5 + act * 2));
      const coreR = (6 + breathe * 3 * act) * k * open + 14 * k * c;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, c > 0.5 ? `rgba(255,255,255,${0.9 * c})` : rgba(0.35 + act * 0.25));
      cg.addColorStop(0.35, rgba(0.35 + c * 0.5));
      cg.addColorStop(1, rgba(0));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // draw rings back-to-front for correct overlap
      const drawn = [];
      for (const ring of rings) {
        ring.phi += dt * 0.12 * ring.spin * open;          // slow precession
        if (!reduce && ring.pulse < 0 && Math.random() < 0.006 + act * 0.014) ring.pulse = 0;
        if (ring.pulse >= 0) ring.pulse += dt * 1.1;
        if (ring.pulse > 1) ring.pulse = -1;

        const rx = R * ring.r * open * (1 + 0.03 * act * Math.sin(st.t * 2 + ring.r * 5));
        const ry = rx * ring.squash;
        const cosP = Math.cos(ring.phi), sinP = Math.sin(ring.phi);

        for (const p of ring.particles) {
          p.theta += dt * speed * ring.spin;
          const th = p.theta;
          const lx = Math.cos(th) * rx;
          const ly = Math.sin(th) * ry;
          const x = cx + lx * cosP - ly * sinP;
          const y = cy + lx * sinP + ly * cosP;
          // depth: sin(theta) > 0 is the "front" of the tilted ring
          const depth = 0.5 + 0.5 * Math.sin(th);
          // light pulse travelling round the ring
          let flare = 0;
          if (ring.pulse >= 0) {
            const TAU = Math.PI * 2;
            const pulseTheta = ring.pulse * TAU * 1.5;
            let dth = (((th - pulseTheta) % TAU) + TAU) % TAU;
            if (dth > Math.PI) dth = TAU - dth;
            flare = Math.max(0, 1 - dth / 0.9) * Math.sin(ring.pulse * Math.PI);
          }
          // orbit tangent, pointing the way the particle is moving
          const dir = Math.sign(ring.spin);
          const tlx = -Math.sin(th) * rx * dir;
          const tly = Math.cos(th) * ry * dir;
          const tanX = tlx * cosP - tly * sinP;
          const tanY = tlx * sinP + tly * cosP;
          drawn.push({
            x, y, depth, flare, size: p.size,
            tx: x - tanX * 0.12 * open, // trail end sits behind the particle
            ty: y - tanY * 0.12 * open,
          });
        }
      }
      drawn.sort((a, b) => a.depth - b.depth);

      ctx.lineCap = 'round';
      for (const p of drawn) {
        const a = 0.35 + p.depth * 0.65;
        const r = p.size * (0.7 + p.depth * 0.5) * (1 + p.flare * 1.2);

        // short trail along the orbit
        if (!reduce && open > 0.05) {
          ctx.beginPath();
          ctx.moveTo(p.tx, p.ty);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = rgba(a * 0.25 * open);
          ctx.lineWidth = r * 0.9;
          ctx.stroke();
        }

        const halo = r * 2.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, halo);
        g.addColorStop(0, rgba(a * (0.35 + p.flare * 0.45)));
        g.addColorStop(1, rgba(0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, halo, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.flare > 0.35 ? `rgba(255,255,255,${a})` : rgba(a);
        ctx.fill();
      }

      // ring pulse on the beat
      if (st.ring >= 0 && st.ring < 1.2) {
        const pr = st.ring;
        ctx.beginPath();
        ctx.arc(cx, cy, 4 * k + pr * R * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(Math.max(0, 1 - pr) * 0.5);
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
      role="img"
      aria-label={settled ? 'Response ready' : 'Thinking'}
    />
  );
}
