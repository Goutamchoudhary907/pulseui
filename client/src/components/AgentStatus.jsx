import { useEffect, useRef } from 'react';

/**
 * AgentStatus
 *
 * Parallel agents as flocks of light. When an agent starts, its flock is
 * *dispatched* — it launches out of the hub in a streak and settles into
 * orbit. While it works, a ring around the flock fills with its progress
 * (or spins if you don't know it). When it finishes, the flock streams
 * back into the hub and is absorbed with a flash; the hub's arc advances.
 * When every agent is home, the core flares into a check. A failed
 * agent's flock turns red, breaks formation and drifts out.
 *
 * Zero dependencies — plain <canvas> + requestAnimationFrame; the loop
 * sleeps once everything is home.
 *
 * Props:
 *  - agents ([{ id, label?, status: 'running' | 'done' | 'error', progress? }])
 *      progress is 0..1, optional.
 *  - width / height (number): canvas size in px. Default 360 × 240.
 *  - boidsPerAgent (number): flock size. Default 8.
 *  - palette (string[]): one colour per agent, cycles. Default 6 hues.
 *  - errorColor (string): colour for failed agents. Default red.
 *  - showLabels (bool): draw agent labels beside their flocks. Default true.
 */
const DEFAULT_PALETTE = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];
const FONT = '500 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export default function AgentStatus({
  agents = [],
  width = 360,
  height = 240,
  boidsPerAgent = 8,
  palette = DEFAULT_PALETTE,
  errorColor = '#ef4444',
  showLabels = true,
}) {
  const canvasRef = useRef(null);
  const flocksRef = useRef(new Map());
  const agentsRef = useRef(agents);
  const uiRef = useRef({ arc: 0, allAt: null, flash: 0, flare: 0 });
  const kickRef = useRef(() => {});

  useEffect(() => {
    agentsRef.current = agents;
    kickRef.current();
  }, [agents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const cx = width / 2, cy = height / 2;
    const hubR = Math.min(width, height) * 0.13;
    const orbitR = Math.min(width, height) * 0.37;
    const margin = 14;
    const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
    const errRGB = hex(errorColor);
    const TAU = Math.PI * 2;

    function slot(index, total) {
      const ang = -Math.PI / 2 + (index / Math.max(1, total)) * TAU + 0.4;
      return { ang, x: cx + Math.cos(ang) * orbitR, y: cy + Math.sin(ang) * orbitR * 0.8 };
    }

    function makeFlock(agent, index, total, now) {
      const s = slot(index, total);
      const arrivedAlready = agent.status !== 'running';
      const start = arrivedAlready ? s : { x: cx, y: cy };
      return {
        color: palette[index % palette.length],
        rgb: hex(palette[index % palette.length]),
        angle: s.ang,
        spin: (0.003 + Math.random() * 0.003) * (index % 2 ? -1 : 1),
        wobble: Math.random() * TAU,
        phase: agent.status === 'done' ? 'gone' : agent.status === 'error' ? 'error' : reduce ? 'work' : 'launch',
        phaseAt: now,
        prog: agent.progress ?? 0,
        spinArc: Math.random() * TAU,
        labelX: start.x, labelY: start.y, labelAlpha: 0,
        alpha: 1,
        boids: Array.from({ length: boidsPerAgent }, () => ({
          x: start.x + (Math.random() - 0.5) * 6,
          y: start.y + (Math.random() - 0.5) * 6,
          vx: 0, vy: 0, hist: [],
        })),
      };
    }

    let raf = 0;
    let last = 0;
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    kickRef.current = kick;

    function tick(now) {
      raf = 0;
      const dt = Math.min(48, last ? now - last : 16);
      last = now;
      const f = dt / 16;
      const list = agentsRef.current;
      const flocks = flocksRef.current;
      const ui = uiRef.current;
      const total = list.length;

      // ---- sync flocks with agents ----
      list.forEach((a, i) => {
        if (!flocks.has(a.id)) {
          const fl = makeFlock(a, i, total, now);
          flocks.set(a.id, fl);
        }
        const fl = flocks.get(a.id);
        if (a.status === 'done' && (fl.phase === 'work' || fl.phase === 'launch')) { fl.phase = 'return'; fl.phaseAt = now; }
        if (a.status === 'error' && fl.phase !== 'error' && fl.phase !== 'gone') { fl.phase = 'error'; fl.phaseAt = now; }
        if (a.status === 'running' && (fl.phase === 'gone' || fl.phase === 'error')) {
          // re-dispatched
          const s = slot(i, total);
          fl.phase = 'launch'; fl.phaseAt = now; fl.alpha = 1;
          for (const b of fl.boids) { b.x = cx; b.y = cy; b.vx = 0; b.vy = 0; b.hist = []; }
          fl.angle = s.ang;
        }
        if (a.progress != null) fl.prog += (Math.max(0, Math.min(1, a.progress)) - fl.prog) * 0.1 * f;
      });
      for (const id of [...flocks.keys()]) if (!list.some((a) => a.id === id)) flocks.delete(id);

      let gone = 0;
      for (const fl of flocks.values()) if (fl.phase === 'gone') gone++;
      const settledAll = total > 0 && list.every((a) => a.status !== 'running') && [...flocks.values()].every((fl) => fl.phase === 'gone' || fl.phase === 'error');
      const allDone = settledAll && list.every((a) => a.status === 'done');
      if (allDone && ui.allAt == null) ui.allAt = now;
      if (!allDone) ui.allAt = null;
      ui.arc += ((total ? gone / total : 0) - ui.arc) * 0.08 * f;
      ui.flare += ((allDone ? 1 : 0) - ui.flare) * 0.06 * f;
      ui.flash *= Math.pow(0.9, f);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';

      // ---- hub ----
      ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, TAU);
      ctx.strokeStyle = 'rgba(28, 25, 23, 0.10)'; ctx.lineWidth = 3; ctx.stroke();
      if (ui.arc > 0.002) {
        ctx.beginPath(); ctx.arc(cx, cy, hubR, -Math.PI / 2, -Math.PI / 2 + ui.arc * TAU);
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3; ctx.stroke();
      }
      const coreA = (total ? gone / total : 0) * 0.3 + ui.flash * 0.5 + ui.flare * 0.25;
      if (coreA > 0.01) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hubR * (0.9 + ui.flash * 0.5));
        g.addColorStop(0, `rgba(124, 58, 237, ${coreA})`);
        g.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, hubR * 1.4, 0, TAU); ctx.fill();
      }
      let ringing = false;
      if (allDone) {
        const age = (now - ui.allAt) / 1000;
        if (age < 2.6) {
          ringing = true;
          for (let k = 0; k < 2; k++) {
            const p = ((age + k * 0.9) % 1.8) / 1.8;
            ctx.beginPath(); ctx.arc(cx, cy, hubR + p * hubR * 1.6, 0, TAU);
            ctx.strokeStyle = `rgba(124, 58, 237, ${(1 - p) * 0.3})`; ctx.lineWidth = 1.5; ctx.stroke();
          }
        }
      }

      // ---- flocks ----
      let busy = false;
      list.forEach((agent, i) => {
        const fl = flocks.get(agent.id);
        if (fl.phase === 'gone') return;
        const s = slot(i, total);
        const age = now - fl.phaseAt;
        const launching = fl.phase === 'launch';
        const working = fl.phase === 'work';
        const returning = fl.phase === 'return';
        const errored = fl.phase === 'error';

        // centroid
        let mx = 0, my = 0, mvx = 0, mvy = 0;
        for (const b of fl.boids) { mx += b.x; my += b.y; mvx += b.vx; mvy += b.vy; }
        const n = fl.boids.length;
        mx /= n; my /= n; mvx /= n; mvy /= n;

        // where this flock wants to be
        let tx, ty;
        if (launching) {
          tx = s.x; ty = s.y;
          if (age > 900 || Math.hypot(mx - s.x, my - s.y) < 14) { fl.phase = 'work'; fl.phaseAt = now; fl.angle = s.ang; }
        } else if (working) {
          fl.angle += fl.spin * f;
          fl.wobble += 0.02 * f;
          const r = orbitR + Math.sin(fl.wobble) * orbitR * 0.1;
          tx = cx + Math.cos(fl.angle) * r;
          ty = cy + Math.sin(fl.angle) * r * 0.8;
        } else if (returning) {
          tx = cx; ty = cy;
          if (Math.hypot(mx - cx, my - cy) < hubR * 0.55) {
            fl.phase = 'gone'; ui.flash = 1;
          }
        } else {
          tx = cx + Math.cos(fl.angle) * orbitR * 1.3;
          ty = cy + Math.sin(fl.angle) * orbitR * 1.05;
        }
        if (launching || returning || working) busy = true;
        if (errored && age < 1800) busy = true;

        const launchBoost = launching ? Math.max(0, 1 - age / 500) : 0;
        for (const b of fl.boids) {
          b.hist.push(b.x, b.y);
          if (b.hist.length > (launching || returning ? 22 : 16)) b.hist.splice(0, 2);

          b.vx += (mx - b.x) * 0.004 * f; b.vy += (my - b.y) * 0.004 * f;
          b.vx += (mvx - b.vx) * 0.05 * f; b.vy += (mvy - b.vy) * 0.05 * f;
          for (const other of flocks.values()) {
            if (other.phase === 'gone') continue;
            for (const o of other.boids) {
              if (o === b) continue;
              const dx = b.x - o.x, dy = b.y - o.y;
              const d2 = dx * dx + dy * dy;
              const minD = other === fl ? 8 : 14;
              if (d2 < minD * minD && d2 > 0.01) {
                const d = Math.sqrt(d2);
                b.vx += (dx / d) * 0.08 * f; b.vy += (dy / d) * 0.08 * f;
              }
            }
          }
          const pull = launching ? 0.03 : returning ? 0.02 + Math.min(0.05, age / 8000) : working ? 0.004 : 0.003;
          b.vx += (tx - b.x) * pull * f; b.vy += (ty - b.y) * pull * f;
          if (launching && launchBoost > 0) {
            b.vx += Math.cos(s.ang) * 0.9 * launchBoost * f; b.vy += Math.sin(s.ang) * 0.9 * launchBoost * f;
          }
          if (errored && age < 1500) { b.vx += (Math.random() - 0.5) * 0.7 * f; b.vy += (Math.random() - 0.5) * 0.7 * f; }
          if (b.x < margin) b.vx += 0.2 * f;
          if (b.x > width - margin) b.vx -= 0.2 * f;
          if (b.y < margin) b.vy += 0.2 * f;
          if (b.y > height - margin) b.vy -= 0.2 * f;
          const damp = launching ? 0.96 : returning ? 0.95 : errored ? (age < 1500 ? 0.96 : 0.9) : 0.985;
          b.vx *= Math.pow(damp, f); b.vy *= Math.pow(damp, f);
          const sp = Math.hypot(b.vx, b.vy);
          const max = launching ? 6 : returning ? 5 : working ? 1.9 : 1.2;
          if (sp > max) { b.vx = (b.vx / sp) * max; b.vy = (b.vy / sp) * max; }
          b.x += b.vx * f; b.y += b.vy * f;
        }

        // draw: trails then heads
        const rgb = errored ? errRGB : fl.rgb;
        const bright = launching || returning ? 0.85 : 0.55;
        const fa = errored ? Math.max(0.35, 1 - age / 4000) : 1;
        for (const b of fl.boids) {
          const h = b.hist, pts = h.length / 2;
          for (let j = 1; j < pts; j++) {
            const t = j / pts;
            ctx.beginPath();
            ctx.moveTo(h[(j - 1) * 2], h[(j - 1) * 2 + 1]);
            ctx.lineTo(h[j * 2], h[j * 2 + 1]);
            ctx.strokeStyle = rgba(rgb, t * bright * fa);
            ctx.lineWidth = 0.6 + t * 1.6;
            ctx.stroke();
          }
        }
        for (const b of fl.boids) {
          ctx.beginPath(); ctx.arc(b.x, b.y, 2.1, 0, TAU); ctx.fillStyle = rgba(rgb, fa); ctx.fill();
          ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, TAU); ctx.fillStyle = rgba(rgb, 0.18 * fa); ctx.fill();
          if (launching || returning) {
            ctx.beginPath(); ctx.arc(b.x, b.y, 1, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
          }
        }

        // dispatch streak from the hub while launching
        if (launching && launchBoost > 0) {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my);
          ctx.strokeStyle = rgba(rgb, launchBoost * 0.35); ctx.lineWidth = 2; ctx.stroke();
        }

        // progress ring around a working flock
        if (working) {
          const rr = 13;
          ctx.beginPath(); ctx.arc(mx, my, rr, 0, TAU);
          ctx.strokeStyle = rgba(rgb, 0.18); ctx.lineWidth = 1.5; ctx.stroke();
          if (agent.progress != null) {
            ctx.beginPath(); ctx.arc(mx, my, rr, -Math.PI / 2, -Math.PI / 2 + fl.prog * TAU);
            ctx.strokeStyle = rgba(rgb, 0.9); ctx.lineWidth = 1.5; ctx.stroke();
          } else if (!reduce) {
            fl.spinArc += 0.05 * f;
            ctx.beginPath(); ctx.arc(mx, my, rr, fl.spinArc, fl.spinArc + Math.PI * 0.45);
            ctx.strokeStyle = rgba(rgb, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
          }
        }

        // label rides beside the flock
        if (showLabels && agent.label) {
          const want = returning ? 0 : 1;
          fl.labelAlpha += (want - fl.labelAlpha) * 0.1 * f;
          fl.labelX += (mx - fl.labelX) * 0.12 * f;
          fl.labelY += (my - fl.labelY) * 0.12 * f;
          if (fl.labelAlpha > 0.02) {
            const pct = working && agent.progress != null ? ` · ${Math.round(fl.prog * 100)}%` : '';
            const text = errored ? `${agent.label} · failed` : `${agent.label}${pct}`;
            ctx.font = FONT;
            const tw = ctx.measureText(text).width;
            const side = fl.labelX < cx ? -1 : 1;
            const lx = fl.labelX + side * 20 - (side < 0 ? tw + 20 : 0);
            const ly = fl.labelY - 22;
            ctx.globalAlpha = fl.labelAlpha;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            roundRect(ctx, lx - 6, ly - 10, tw + 22, 20, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(28, 25, 23, 0.1)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath(); ctx.arc(lx + 2, ly, 2.2, 0, TAU);
            ctx.fillStyle = errored ? errorColor : rgba(rgb, 0.55 + Math.sin(now / 250) * 0.45); ctx.fill();
            ctx.fillStyle = errored ? errorColor : '#44403c';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, lx + 10, ly + 0.5);
            ctx.globalAlpha = 1;
          }
        }
      });

      // ---- hub text ----
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (ui.flare > 0.5) {
        ctx.strokeStyle = `rgba(124, 58, 237, ${(ui.flare - 0.5) * 2})`;
        ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - hubR * 0.32, cy + hubR * 0.02);
        ctx.lineTo(cx - hubR * 0.08, cy + hubR * 0.28);
        ctx.lineTo(cx + hubR * 0.36, cy - hubR * 0.26);
        ctx.stroke();
      } else {
        ctx.globalAlpha = 1 - ui.flare * 2;
        ctx.font = FONT; ctx.fillStyle = '#1c1917';
        ctx.fillText(`${gone}/${total}`, cx, cy + 0.5);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'start';

      // ---- sleep when everything is home ----
      const stillBusy = busy || ringing || ui.flash > 0.02 ||
        Math.abs(ui.arc - (total ? gone / total : 0)) > 0.002 ||
        Math.abs(ui.flare - (allDone ? 1 : 0)) > 0.005 ||
        (showLabels && [...flocks.values()].some((fl) => fl.phase === 'return' && fl.labelAlpha > 0.02));
      if (stillBusy) raf = requestAnimationFrame(tick);
      else last = 0;
    }

    kick();
    return () => { cancelAnimationFrame(raf); raf = 0; };
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
