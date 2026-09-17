import { useEffect, useRef } from 'react';

/**
 * ContextMeter
 *
 * A context-window gauge with the footprint of an ordinary progress bar —
 * but the fill is liquid inside glass. The level eases to its value on a
 * spring with overshoot; a big add surges, sloshes, and throws a few
 * droplets when the front snaps back. Bubbles rise as context lands and
 * pop at the surface. Past `warnAt` the liquid warms toward amber; past
 * `boilAt` it *boils* — a fine tremor, bubbles streaming — and at the
 * limit it *overflows*: drips swell at the rim and fall. "You're about
 * to hit the limit" is felt before it's read.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame; the loop
 * sleeps whenever the liquid is still.
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
export default function ContextMeter({
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
  // room around the glass for spray and drips; pulled back in with negative margins
  const PAD = 14;
  const DRIP = vertical ? 0 : 22;

  const canvasRef = useRef(null);
  const kickRef = useRef(() => {});
  const s = useRef({
    level: value, vel: 0, target: value, prev: value,
    slosh: 0, dir: 1, t: 0, peaked: false, lastDrip: 0,
    bubbles: [], spray: [], pops: [], drips: [],
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
      st.peaked = false;
      if (delta > 0) {
        const n = Math.round(3 + delta * 40);
        for (let i = 0; i < n; i++) st.bubbles.push(spawnBubble(st.level, v, vertical));
      }
    }
    kickRef.current();
  }, [value, vertical]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const CW = W + PAD * 2, CH = H + PAD * 2 + DRIP;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hex = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const mix = (a, b, t) => a.map((c, i) => c * (1 - t) + b[i] * t);
    const rgba = (c, a = 1) => `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${a})`;
    const base = hex(color), warn = hex(warnColor), hot = hex(hotColor);
    const white = [255, 255, 255], black = [0, 0, 0];
    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const r = T / 2;
    const k = Math.max(0.6, T / 14);

    // Everything on the glass is drawn in "along" (a: 0..L) / "across"
    // (c: 0..T) space. Vertical rotates that space so "along" points up.
    function orient(sx = 0, sy = 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(PAD + sx, PAD + sy);
      if (vertical) { ctx.translate(0, L); ctx.rotate(-Math.PI / 2); }
    }
    const screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // (along, across) → canvas px
    const toScreen = (a, c) => (vertical ? [PAD + c, PAD + L - a] : [PAD + a, PAD + c]);

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

    function front(c, st, amp, ripple, tremor) {
      const u = c / T;
      const lean = Math.cos(u * Math.PI) * Math.sin(st.t * 9) * amp * st.dir;
      const wave = Math.sin(u * Math.PI * 3 + st.t * 4) * ripple;
      return st.level * L + lean + wave + tremor;
    }
    function frontPath(st, amp, ripple, tremor, offset = 0) {
      const steps = 14;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const c = (i / steps) * T;
        const a = front(c, st, amp, ripple, tremor) - offset;
        if (i === 0) ctx.moveTo(a, c); else ctx.lineTo(a, c);
      }
    }

    let raf = 0;
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    kickRef.current = kick;
    let last = 0;

    function tick(now) {
      raf = 0;
      const st = s.current;
      const dt = Math.min(48, last ? now - last : 16);
      last = now;
      const f = dt / 16;
      st.t += dt / 1000;

      // spring with overshoot, so a big add visibly surges
      const prevVel = st.vel;
      st.vel += (st.target - st.level) * 0.06 * f;
      st.vel *= Math.pow(0.84, f);
      st.level = clamp01(st.level + st.vel);
      st.slosh *= Math.pow(0.97, f);

      const warmth = clamp01((st.level - warnAt) / (1 - warnAt));
      const heat = clamp01((st.level - boilAt) / (1 - boilAt));
      const full = st.target >= 0.999 && st.level > 0.99;
      const liquid = mix(mix(base, warn, warmth), hot, heat * 0.75);

      const amp = st.slosh * T * 0.9;
      const ripple = st.slosh * T * 0.14 + heat * T * 0.1;
      const tremor = reduce ? 0 : Math.sin(st.t * 70) * heat * 1.1 + Math.sin(st.t * 43) * heat * 0.5;
      const F = st.level * L;

      // the front just peaked after a surge: throw spray
      if (!reduce && !st.peaked && prevVel > 0 && st.vel <= 0 && st.slosh > 0.25) {
        st.peaked = true;
        const n = Math.round(2 + st.slosh * 6);
        for (let i = 0; i < n; i++) {
          const [x, y] = toScreen(F, T * (0.15 + Math.random() * 0.7));
          const fwd = (0.4 + Math.random() * 1.2) * k;
          const up = (0.8 + Math.random() * 1.6) * k;
          st.spray.push({
            x, y,
            vx: vertical ? (Math.random() - 0.5) * 1.2 * k : fwd,
            vy: vertical ? -(fwd + up) : -up,
            r: (0.6 + Math.random() * 0.9) * k, life: 1,
          });
        }
      }

      // overflow: drips swell at the rim and fall
      if (full && !reduce && now - st.lastDrip > 520 + Math.random() * 500) {
        st.lastDrip = now;
        const side = Math.random() < 0.5 ? 0 : 1;
        const [x, y] = vertical ? toScreen(L, side ? T - 1 : 1) : toScreen(L + r * 0.4, T * 0.7);
        st.drips.push({ x, y, vx: 0, vy: 0, r: 0.4, grow: 1, life: 1 });
      }

      screen();
      ctx.clearRect(0, 0, CW, CH);
      orient(reduce ? 0 : Math.sin(st.t * 61) * heat * 0.5, reduce ? 0 : Math.sin(st.t * 53) * heat * 0.4);

      // --- glass track ---
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
      frontPath(st, amp, ripple, tremor);
      ctx.lineTo(-r, T);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      const body = ctx.createLinearGradient(0, 0, 0, T);
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

      // meniscus
      frontPath(st, amp, ripple, tremor);
      ctx.strokeStyle = rgba(white, 0.7);
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // --- bubbles: rise, then pop at the surface ---
      if (heat > 0 && !reduce && Math.random() < heat * 0.6 * f) st.bubbles.push(spawnBubble(0, st.level, vertical));
      ctx.fillStyle = rgba(white, 0.75);
      st.bubbles = st.bubbles.filter((b) => {
        b.a += b.va * f; b.c += b.vc * f; b.wob += 0.15 * f;
        const a = b.a * L + (vertical ? 0 : Math.sin(b.wob) * 0.6);
        const c = b.c * T + (vertical ? Math.sin(b.wob) * 0.8 : 0);
        const surface = front(c, st, amp, ripple, 0);
        const inside = a < surface - 1 && c > 0.5 && c < T - 0.5 && a > 0.5;
        if (!inside) {
          if (vertical && a >= surface - 1 && a > 2) st.pops.push({ a: surface, c, r: b.r, life: 1 });
          else if (!vertical && c <= 0.5 && a > 2 && a < surface) st.pops.push({ a, c: 1, r: b.r, life: 1 });
          return false;
        }
        ctx.beginPath(); ctx.arc(a, c, b.r, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      for (const p of st.pops) {
        p.life -= dt / 260;
        const rr = p.r + (1 - p.life) * 3 * k;
        ctx.strokeStyle = rgba(white, p.life * 0.7);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(p.a, p.c, rr, 0, Math.PI * 2); ctx.stroke();
      }
      st.pops = st.pops.filter((p) => p.life > 0);

      // --- gloss ---
      const gloss = ctx.createLinearGradient(0, 0, 0, T * 0.5);
      gloss.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(r * 0.5, 1, L - r, T * 0.5);
      ctx.restore();

      // glass edge — reddens when full
      orient();
      pill(0.5);
      ctx.strokeStyle = full ? rgba(hot, 0.55) : 'rgba(28, 25, 23, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // warm glow under the liquid
      if (warmth > 0) {
        ctx.save();
        pill();
        ctx.clip();
        ctx.fillStyle = rgba(liquid, 0.08 + heat * 0.12 + (full ? 0.06 + 0.05 * Math.sin(st.t * 6) : 0));
        ctx.fillRect(0, 0, F, T);
        ctx.restore();
      }

      // --- outside the glass: spray + drips (screen space) ---
      screen();
      for (const d of st.spray) {
        d.vy += 0.16 * k * f;
        d.x += d.vx * f; d.y += d.vy * f;
        d.life -= dt / 520;
        ctx.fillStyle = rgba(liquid, Math.max(0, d.life) * 0.9);
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * (0.6 + d.life * 0.4), 0, Math.PI * 2); ctx.fill();
      }
      st.spray = st.spray.filter((d) => d.life > 0 && d.y < CH);
      for (const d of st.drips) {
        if (d.grow > 0) {
          d.r = Math.min(2.3 * k, d.r + 0.05 * k * f);
          d.y += 0.06 * k * f;
          if (d.r >= 2.3 * k) d.grow = 0;
        } else {
          d.vy += 0.22 * k * f;
          d.y += d.vy * f;
          if (vertical) d.life -= dt / 900;
        }
        const g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r);
        g.addColorStop(0, rgba(mix(liquid, white, 0.45), d.life));
        g.addColorStop(1, rgba(liquid, d.life));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.r * 1.8);
        ctx.quadraticCurveTo(d.x + d.r, d.y - d.r * 0.4, d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI);
        ctx.quadraticCurveTo(d.x - d.r, d.y - d.r * 0.4, d.x, d.y - d.r * 1.8);
        ctx.fill();
      }
      st.drips = st.drips.filter((d) => d.life > 0 && d.y < CH + 4);

      // --- sleep when the liquid is still ---
      const busy =
        Math.abs(st.target - st.level) > 0.0005 || Math.abs(st.vel) > 0.0005 || st.slosh > 0.01 ||
        st.bubbles.length || st.spray.length || st.pops.length || st.drips.length ||
        (heat > 0 && !reduce) || (full && !reduce);
      if (busy) raf = requestAnimationFrame(tick);
      else last = 0;
    }

    kick();
    return () => { cancelAnimationFrame(raf); raf = 0; };
  }, [W, H, L, T, vertical, color, warnColor, hotColor, warnAt, boilAt, PAD, DRIP]);

  const text = label === true ? `${Math.round(value * 100)}%` : label;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: 8, ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: W + PAD * 2,
          height: H + PAD * 2 + DRIP,
          margin: `${-PAD}px ${-PAD}px ${-PAD - DRIP}px`,
          display: 'block',
          pointerEvents: 'none',
        }}
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
            minWidth: label === true ? '4ch' : undefined,
            textAlign: vertical ? 'center' : 'right',
            opacity: 0.7,
            color: value >= 0.999 ? hotColor : undefined,
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
