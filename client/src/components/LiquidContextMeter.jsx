import { useEffect, useRef } from 'react';

/**
 * LiquidContextMeter
 *
 * A context-window gauge with the footprint of an ordinary progress bar —
 * but the fill is liquid inside glass. The level eases to its value on a
 * spring with a little overshoot; any change sends a slosh through the
 * wave-front, which leans, rebounds and leaves a wake. Bubbles rise as
 * context lands. Past `warnAt` the liquid warms toward amber; past
 * `boilAt` it *boils* — the surface shakes and bubbles stream — so
 * "you're about to hit the limit" is felt before it's read.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame.
 *
 * Props:
 *  - value (0..1): fraction of the context window used.
 *  - orientation ('horizontal' | 'vertical'): default 'horizontal'.
 *  - length / thickness (number): px along / across the bar.
 *      Defaults 240 × 14 horizontal, 150 × 36 vertical.
 *  - color (hex): liquid colour. Default violet.
 *  - warnColor (hex): blended in past warnAt. Default amber.
 *  - hotColor (hex): blended in past boilAt. Default red.
 *  - warnAt / boilAt (0..1): thresholds. Default 0.8 / 0.95.
 *  - label (true | string): text beside the bar. `true` shows the percent.
 *  - className / style: passed to the wrapper.
 */
export default function LiquidContextMeter({
  value = 0,
  orientation = 'horizontal',
  length,
  thickness,
  color = '#7c3aed',
  warnColor = '#f59e0b',
  hotColor = '#ef4444',
  warnAt = 0.8,
  boilAt = 0.95,
  label,
  className,
  style,
}) {
  const vertical = orientation === 'vertical';
  const L = length ?? (vertical ? 150 : 240);
  const T = thickness ?? (vertical ? 36 : 14);
  const W = vertical ? T : L;
  const H = vertical ? L : T;

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const s = useRef({
    level: value,
    vel: 0,
    target: value,
    prev: value,
    slosh: 0,
    dir: 1,
    t: 0,
    bubbles: [],
  });

  // A new value = new spring target + a kick of slosh energy sized by the jump.
  useEffect(() => {
    const st = s.current;
    const v = Math.max(0, Math.min(1, value));
    const delta = v - st.prev;
    st.prev = v;
    st.target = v;
    if (Math.abs(delta) > 0.002) {
      st.slosh = Math.min(1, st.slosh + Math.abs(delta) * 6);
      st.dir = delta >= 0 ? 1 : -1;
      st.t = 0;
      if (delta > 0) {
        const n = Math.round(3 + delta * 40);
        for (let i = 0; i < n; i++) st.bubbles.push(spawnBubble(st.level, v, vertical));
      }
    }
  }, [value, vertical]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;

    const hex = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const mix = (a, b, t) => a.map((c, i) => c * (1 - t) + b[i] * t);
    const rgba = (c, a = 1) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;
    const base = hex(color);
    const warn = hex(warnColor);
    const hot = hex(hotColor);
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    const r = T / 2;

    // Everything is drawn in "along" (a: 0..L) / "across" (c: 0..T) space.
    // Vertical just rotates that space so "along" points up.
    function orient() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (vertical) {
        ctx.translate(0, L);
        ctx.rotate(-Math.PI / 2);
      }
    }

    function pill(inset = 0) {
      const rr = r - inset;
      ctx.beginPath();
      ctx.moveTo(inset + rr, inset);
      ctx.lineTo(L - inset - rr, inset);
      ctx.arc(L - inset - rr, r, rr, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(inset + rr, T - inset);
      ctx.arc(inset + rr, r, rr, Math.PI / 2, (3 * Math.PI) / 2);
      ctx.closePath();
    }

    // position of the liquid front at a given "across" coordinate
    function front(c, st, amp, ripple, jitter) {
      const u = c / T;
      const lean = Math.cos(u * Math.PI) * Math.sin(st.t * 9) * amp * st.dir;
      const wave = Math.sin(u * Math.PI * 3 + st.t * 4) * ripple;
      const shake = jitter ? (Math.random() - 0.5) * jitter : 0;
      return st.level * L + lean + wave + shake;
    }

    function frontPath(st, amp, ripple, jitter, offset = 0) {
      const steps = 14;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const c = (i / steps) * T;
        const a = front(c, st, amp, ripple, jitter) - offset;
        if (i === 0) ctx.moveTo(a, c);
        else ctx.lineTo(a, c);
      }
    }

    function tick() {
      const st = s.current;
      st.t += 1 / 60;

      // spring with a touch of overshoot, so a big add visibly surges
      st.vel += (st.target - st.level) * 0.06;
      st.vel *= 0.84;
      st.level = clamp01(st.level + st.vel);
      st.slosh *= 0.97;

      const warmth = clamp01((st.level - warnAt) / (1 - warnAt));
      const heat = clamp01((st.level - boilAt) / (1 - boilAt));
      const liquid = mix(mix(base, warn, warmth), hot, heat * 0.75);

      const amp = st.slosh * T * 0.9;           // slosh lean
      const ripple = T * 0.05 + st.slosh * T * 0.12 + heat * T * 0.12;
      const jitter = heat * 2.2;                 // boil shake
      const F = st.level * L;

      orient();
      ctx.clearRect(-2, -2, L + 4, T + 4);
      if (heat > 0) ctx.translate((Math.random() - 0.5) * heat * 0.8, (Math.random() - 0.5) * heat * 0.8);

      // --- glass track: recessed, with an inner shadow along the top ---
      pill();
      ctx.fillStyle = 'rgba(28, 25, 23, 0.07)';
      ctx.fill();
      ctx.save();
      pill();
      ctx.clip();
      const inner = ctx.createLinearGradient(0, 0, 0, T);
      inner.addColorStop(0, 'rgba(28, 25, 23, 0.16)');
      inner.addColorStop(0.45, 'rgba(28, 25, 23, 0)');
      ctx.fillStyle = inner;
      ctx.fillRect(0, 0, L, T);

      // threshold notch etched into the glass
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(warnAt * L + 0.5, T * 0.22);
      ctx.lineTo(warnAt * L + 0.5, T * 0.78);
      ctx.stroke();

      // --- liquid ---
      frontPath(st, amp, ripple, jitter);
      ctx.lineTo(-r, T);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      const body = ctx.createLinearGradient(0, 0, 0, T); // cylinder shading
      body.addColorStop(0, rgba(mix(liquid, white, 0.38)));
      body.addColorStop(0.42, rgba(liquid));
      body.addColorStop(1, rgba(mix(liquid, black, 0.32)));
      ctx.fillStyle = body;
      ctx.fill();

      // wake: faint crests trailing the front while it's moving
      if (st.slosh > 0.03) {
        for (let i = 1; i <= 3; i++) {
          frontPath(st, amp * 0.6, ripple * 0.6, 0, i * (T * 0.55 + st.slosh * T * 0.6));
          ctx.strokeStyle = rgba(white, (st.slosh * 0.35) / i);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // meniscus: bright edge on the front
      frontPath(st, amp, ripple, jitter);
      ctx.strokeStyle = rgba(white, 0.7);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // --- bubbles ---
      if (heat > 0 && Math.random() < heat * 0.7) {
        st.bubbles.push(spawnBubble(0, st.level, vertical));
      }
      ctx.fillStyle = rgba(white, 0.75);
      st.bubbles = st.bubbles.filter((b) => {
        b.a += b.va;
        b.c += b.vc;
        b.wob += 0.15;
        const a = b.a * L + (vertical ? 0 : Math.sin(b.wob) * 0.6);
        const c = b.c * T + (vertical ? Math.sin(b.wob) * 0.8 : 0);
        const inside = a < front(c, st, amp, ripple, 0) - 1 && c > 0.5 && c < T - 0.5 && a > 0.5;
        if (!inside) return false;
        ctx.beginPath();
        ctx.arc(a, c, b.r, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // --- glass gloss along the top ---
      const gloss = ctx.createLinearGradient(0, 0, 0, T * 0.5);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(r * 0.5, 1, L - r, T * 0.5);
      ctx.restore();

      // glass edge
      orient();
      pill(0.5);
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // soft coloured glow under the liquid when it's warm/hot
      if (warmth > 0) {
        ctx.save();
        pill();
        ctx.clip();
        ctx.fillStyle = rgba(liquid, 0.08 + heat * 0.12);
        ctx.fillRect(0, 0, F, T);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [W, H, L, T, vertical, color, warnColor, hotColor, warnAt, boilAt]);

  const text = label === true ? `${Math.round(value * 100)}%` : label;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, display: 'block' }}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label="Context usage"
      />
      {text && (
        <span
          style={{
            font: '500 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
            fontVariantNumeric: 'tabular-nums',
            // reserve room for "100%" so the layout never shifts as the number grows
            minWidth: label === true ? '4ch' : undefined,
            textAlign: vertical ? 'center' : 'right',
            opacity: 0.7,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

// Bubbles live in normalised (along, across) space. They rise against
// gravity: "up" is across for a horizontal bar, along for a vertical one.
function spawnBubble(fromLevel, toLevel, vertical) {
  const a = fromLevel + Math.random() * Math.max(0.02, toLevel - fromLevel);
  const speed = 0.006 + Math.random() * 0.008;
  return vertical
    ? { a: Math.max(0.02, a - 0.1), c: 0.15 + Math.random() * 0.7, va: speed * 0.6, vc: 0, r: 0.8 + Math.random() * 1.4, wob: Math.random() * 6 }
    : { a: Math.max(0.02, a - 0.02), c: 0.95, va: 0.0006, vc: -speed * 3, r: 0.6 + Math.random() * 0.9, wob: Math.random() * 6 };
}
