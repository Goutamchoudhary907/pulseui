import { useEffect, useRef } from 'react';

/**
 * FileChunker
 *
 * A document being prepared for retrieval, shown as what actually happens
 * instead of a spinner and "Processed ✓". A page sits on the left; while
 * it's being read, its lines fill in and pages turn. Then it's cut: strips
 * peel off the page one at a time, fly across, and land on a growing deck
 * on the right — the chunks. Embedding lights an index mark on each strip
 * in turn. When it's ready the deck squares up and settles. On error a
 * strip drops off the deck.
 *
 * Zero dependencies — one <canvas> + requestAnimationFrame; the loop
 * sleeps once nothing is moving.
 *
 * Props:
 *  - name (string): the file name, e.g. "report.pdf".
 *  - stage ('idle' | 'reading' | 'chunking' | 'embedding' | 'ready' | 'error'): default 'idle'.
 *  - page / pages (number): reading progress. Lines fill by page / pages.
 *  - chunks (number): chunks so far — that many strips land on the deck.
 *  - tokens (number): total tokens, shown once known.
 *  - detail (string): overrides the status line (e.g. an error message).
 *  - size (number): height in px. Default 40.
 *  - width (number): canvas width in px. Default 140.
 *  - color (hex): the "ready" colour. Default '#059669'.
 *  - errorColor (hex): default '#ef4444'.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-filechunker';
const CSS = `
.pui-chunker { display: flex; width: 100%; max-width: 100%; box-sizing: border-box; align-items: center; gap: 10px; min-width: 0; font: 500 13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #1c1917; }
.pui-chunker canvas { display: block; flex-shrink: 0; }
.pui-chunker .di-text { display: flex; flex: 1 1 auto; flex-direction: column; gap: 3px; min-width: 0; }
.pui-chunker .di-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.3s; }
.pui-chunker[data-stage="idle"] .di-name { color: #a8a29e; }
.pui-chunker .di-detail { font-weight: 400; font-size: 0.88em; color: #78716c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; transition: color 0.3s; }
.pui-chunker[data-stage="ready"] .di-detail { color: var(--di-ok, #059669); }
.pui-chunker[data-stage="error"] .di-detail { color: var(--di-error, #ef4444); }
`;

function useInjectedStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export default function FileChunker({
  name,
  stage = 'idle',
  page = 0,
  pages = 0,
  chunks = 0,
  tokens = 0,
  detail,
  size = 40,
  width = 140,
  color = '#059669',
  errorColor = '#ef4444',
  className,
  style,
}) {
  useInjectedStyle();
  const canvasRef = useRef(null);
  const kickRef = useRef(() => {});
  const sim = useRef({
    stage: 'idle', read: 0, readTarget: 0, page: 0, turn: 0,
    landed: 0, want: 0, flying: [], lastSpawn: 0, drop: null,
    square: 0, marks: 0, t: 0, last: 0, jit: [],
  });

  // props → simulation targets
  useEffect(() => {
    const s = sim.current;
    const prev = s.stage;
    s.stage = stage;
    if (stage === 'idle') {
      s.read = 0; s.readTarget = 0; s.landed = 0; s.want = 0; s.flying = []; s.drop = null; s.square = 0; s.marks = 0; s.page = 0;
    }
    if (stage === 'error' && prev !== 'error' && s.landed > 0) {
      s.landed -= 1;
      s.drop = { y: 0, vy: 0, x: 0, t: 0 };
    }
    kickRef.current();
  }, [stage]);
  useEffect(() => {
    const s = sim.current;
    s.readTarget = pages > 0 ? Math.min(1, page / pages) : 0;
    if (page > s.page) s.turn = 1;
    s.page = page;
    kickRef.current();
  }, [page, pages]);
  useEffect(() => {
    const s = sim.current;
    s.want = Math.max(0, chunks);
    if (s.want < s.landed) { s.landed = s.want; s.flying = []; }
    kickRef.current();
  }, [chunks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const s = sim.current;
    let raf = 0;

    // geometry
    const H = size, W = width;
    const PW = Math.round(H * 0.56), PH = H - 8, PX = 1, PY = 4; // the page
    const LINES = 6;
    const SW = PW, SX = W - SW - 1, SY = H - 5; // the deck (bottom-anchored)
    const MAXV = 12; // strips drawn before the deck compresses
    for (let i = s.jit.length; i < 64; i++) s.jit.push((Math.random() - 0.5) * 2.4);

    const INK = '#1c1917', MID = '#a8a29e', LIGHT = '#e7e5e4';

    function stripH() {
      const n = Math.max(1, s.landed + (s.drop ? 1 : 0));
      return n <= MAXV ? 2.2 : (2.2 * MAXV) / n;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const st = s.stage;
      const on = st !== 'idle';

      // ---- page ------------------------------------------------------------
      const turnDx = s.turn > 0 ? Math.sin(s.turn * Math.PI) * 3 : 0;
      ctx.save();
      ctx.translate(PX - turnDx * 0.3, PY);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = on ? MID : LIGHT;
      ctx.lineWidth = 1;
      // dog-ear corner
      ctx.beginPath();
      ctx.moveTo(0.5, 0.5);
      ctx.lineTo(PW - 5.5, 0.5);
      ctx.lineTo(PW - 0.5, 5.5);
      ctx.lineTo(PW - 0.5, PH - 0.5);
      ctx.lineTo(0.5, PH - 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PW - 5.5, 0.5);
      ctx.lineTo(PW - 5.5, 5.5);
      ctx.lineTo(PW - 0.5, 5.5);
      ctx.stroke();
      // text lines fill in as pages are read; already-cut lines are gone
      const gap = (PH - 12) / (LINES - 1);
      const cut = st === 'chunking' || st === 'embedding' || st === 'ready' ? Math.min(LINES, s.landed + s.flying.length) : 0;
      for (let i = 0; i < LINES; i++) {
        const y = 8 + i * gap;
        const filled = s.read * LINES;
        const k = Math.max(0, Math.min(1, filled - i));
        const w = (PW - 8) * (i === LINES - 1 ? 0.6 : 1);
        if (i < cut && st !== 'ready') {
          // a faint ghost where a strip used to be
          ctx.fillStyle = LIGHT;
          ctx.fillRect(4, y, w, 1.2);
          continue;
        }
        if (st === 'ready') continue;
        ctx.fillStyle = LIGHT;
        ctx.fillRect(4, y, w, 1.6);
        if (k > 0) {
          ctx.fillStyle = MID;
          ctx.fillRect(4, y, w * k, 1.6);
        }
      }
      ctx.restore();
      if (st === 'ready') {
        // the page is spent: a small check where the text was
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(PX + PW * 0.3, PY + PH * 0.55);
        ctx.lineTo(PX + PW * 0.46, PY + PH * 0.7);
        ctx.lineTo(PX + PW * 0.72, PY + PH * 0.38);
        ctx.stroke();
      }

      // ---- the cut: a dotted path from page to deck --------------------------
      if (st === 'chunking' || st === 'embedding') {
        ctx.fillStyle = LIGHT;
        for (let x = PX + PW + 6; x < SX - 4; x += 4) ctx.fillRect(x, H / 2 - 0.5, 1.5, 1);
      }

      // ---- flying strips -----------------------------------------------------
      for (const f of s.flying) {
        const k = f.t;
        const e = 1 - Math.pow(1 - k, 2.2);
        const x = PX + 4 + (SX - PX - 4) * e;
        const y = f.y0 + (SY - stripH() - f.y0) * e - Math.sin(k * Math.PI) * 9;
        ctx.save();
        ctx.translate(x + SW / 2, y);
        ctx.rotate(Math.sin(k * Math.PI) * -0.2);
        ctx.fillStyle = INK;
        ctx.fillRect(-SW / 2, -1, SW - 2, 2);
        ctx.restore();
      }

      // ---- the deck -----------------------------------------------------------
      const h = stripH();
      const n = s.landed;
      const shown = Math.min(n, MAXV * 2);
      const step = n <= MAXV ? h + 1 : (2.2 * MAXV + MAXV) / Math.max(1, n);
      for (let i = 0; i < shown; i++) {
        const j = i < MAXV ? i : Math.floor((i / shown) * n);
        const dx = s.jit[j % s.jit.length] * (1 - s.square);
        const y = SY - i * step - h;
        const lit = st === 'ready' || (st === 'embedding' && i < s.marks);
        ctx.fillStyle = i === shown - 1 && n <= MAXV ? INK : lit ? '#57534e' : MID;
        ctx.fillRect(SX + dx, y, SW - 2, h);
        if (lit) {
          ctx.fillStyle = st === 'ready' ? color : INK;
          ctx.fillRect(SX + dx - 3, y, 2, h);
        }
      }
      // a strip falling off on error
      if (s.drop) {
        ctx.fillStyle = errorColor;
        ctx.save();
        ctx.translate(SX + SW / 2 + s.drop.x, SY - h + s.drop.y);
        ctx.rotate(s.drop.t * 0.9);
        ctx.globalAlpha = Math.max(0, 1 - s.drop.t * 0.9);
        ctx.fillRect(-SW / 2, -h, SW - 2, h);
        ctx.restore();
      }
      if (n === 0 && !s.flying.length && !s.drop) {
        // an empty tray
        ctx.strokeStyle = on ? MID : LIGHT;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(SX - 2, SY - 6);
        ctx.lineTo(SX - 2, SY + 0.5);
        ctx.lineTo(SX + SW, SY + 0.5);
        ctx.lineTo(SX + SW, SY - 6);
        ctx.stroke();
      }
    }

    function tick(now) {
      const dt = Math.min(50, Math.max(1, now - s.last));
      s.last = now;
      s.t += dt / 1000;
      const st = s.stage;
      let moving = false;

      // reading: lines fill toward the page fraction, pages turn
      const rd = reduce ? s.readTarget : s.read + (s.readTarget - s.read) * (1 - Math.pow(0.88, dt / 16));
      if (Math.abs(rd - s.read) > 0.0005) { s.read = rd; moving = true; } else s.read = s.readTarget;
      if (s.turn > 0) { s.turn = Math.max(0, s.turn - dt / 260); moving = true; }

      // chunking: strips peel off while the deck is short of `chunks`
      if ((st === 'chunking' || st === 'embedding') && s.landed + s.flying.length < s.want && now - s.lastSpawn > (reduce ? 0 : 110)) {
        s.lastSpawn = now;
        const line = (s.landed + s.flying.length) % LINES;
        const y0 = PY + 8 + line * ((PH - 12) / (LINES - 1));
        if (reduce) s.landed += 1; else s.flying.push({ t: 0, y0 });
      }
      for (const f of s.flying) f.t += dt / 480;
      const arrived = s.flying.filter((f) => f.t >= 1).length;
      if (arrived) { s.landed += arrived; s.flying = s.flying.filter((f) => f.t < 1); }
      if (s.flying.length) moving = true;

      // embedding: index marks light up strip by strip, then hold
      if (st === 'embedding') {
        const target = Math.min(s.landed, MAXV);
        if (s.marks < target) { s.marks += dt / 140; moving = true; }
      } else if (st !== 'ready') s.marks = 0;

      // ready: the deck squares up
      const sq = st === 'ready' ? 1 : 0;
      if (Math.abs(sq - s.square) > 0.002) { s.square += (sq - s.square) * (reduce ? 1 : 1 - Math.pow(0.85, dt / 16)); moving = true; } else s.square = sq;

      // error: one strip drops
      if (s.drop) {
        s.drop.t += dt / 700;
        s.drop.vy += 0.0009 * dt;
        s.drop.y += s.drop.vy * dt;
        s.drop.x += 0.01 * dt;
        if (s.drop.t >= 1.1) s.drop = null;
        moving = true;
      }

      draw();
      raf = moving ? requestAnimationFrame(tick) : 0;
    }

    const kick = () => {
      if (raf) return;
      s.last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    kickRef.current = kick;
    kick();
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
  }, [size, width, color, errorColor]);

  const counts = [chunks > 0 && `${chunks} chunks`, tokens > 0 && `${fmt(tokens)} tokens`].filter(Boolean).join(' · ');
  const line =
    detail ??
    (stage === 'idle' ? 'waiting'
      : stage === 'reading' ? `reading${pages ? ` ${Math.min(page, pages)} / ${pages} pages` : ''}`
      : stage === 'chunking' ? `chunking${counts ? ` · ${counts}` : ''}`
      : stage === 'embedding' ? `embedding${counts ? ` · ${counts}` : ''}`
      : stage === 'ready' ? `ready${counts ? ` · ${counts}` : ''}`
      : 'failed');

  return (
    <span
      className={`pui-chunker${className ? ` ${className}` : ''}`}
      data-stage={stage}
      style={{ '--di-ok': color, '--di-error': errorColor, ...style }}
      role="status"
      aria-live="polite"
      aria-busy={stage !== 'idle' && stage !== 'ready' && stage !== 'error'}
    >
      <canvas ref={canvasRef} style={{ width, height: size }} aria-hidden="true" />
      <span className="di-text">
        <span className="di-name">{name}</span>
        <span className="di-detail">{line}</span>
      </span>
    </span>
  );
}
