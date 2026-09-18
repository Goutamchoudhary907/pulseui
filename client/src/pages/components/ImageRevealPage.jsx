import { useEffect, useMemo, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import ImageReveal from '../../components/ImageReveal';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('image-reveal');

const props = [
  { name: 'progress', type: 'number (0..1)', def: '0', desc: 'How much of the generation has arrived. That fraction of the dots lock onto the grid, in a scattered order.' },
  { name: 'src', type: 'string', desc: 'The finished image. Leave it undefined until your API returns it — the dots never need it.' },
  { name: 'generating', type: 'boolean', def: 'false', desc: 'Keeps the dots drifting while progress is still 0 (queued, first step pending).' },
  { name: 'cell', type: 'number', def: '10', desc: 'Dot spacing in px. Smaller is finer and costs more per frame.' },
  { name: 'alt', type: 'string', desc: 'Alt text for the finished image.' },
  { name: 'aspect', type: 'string', def: "'4 / 3'", desc: 'CSS aspect-ratio of the frame.' },
  { name: 'onRevealed', type: '() => void', desc: 'Fires once every dot is home; the image fades in when src is there too.' },
];

const PROMPTS = [
  'a green meadow in morning light, soft hills, one tree',
  'a quiet beach at noon, pale sand, clear water',
  'snow mountains above a lake, bright day',
];

// Draws a small daylight landscape so the demo needs no network. Each
// prompt gets its own palette; the "generated" image is a data URL.
function makeScene(i) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 480;
  const x = c.getContext('2d');
  const W = c.width, H = c.height, horizon = H * 0.58;
  const P = [
    { sky: ['#7dd3fc', '#bae6fd', '#f0f9ff'], sun: '#fffbeb', far: '#86efac', hills: ['#4ade80', '#22c55e', '#16a34a'], ground: ['#a3e635', '#65a30d'], tree: true },
    { sky: ['#38bdf8', '#7dd3fc', '#e0f2fe'], sun: '#fffbeb', far: '#0ea5e9', hills: [], ground: ['#fef3c7', '#fde68a'], sea: ['#22d3ee', '#0891b2'] },
    { sky: ['#60a5fa', '#93c5fd', '#eff6ff'], sun: '#ffffff', far: '#c7d2fe', hills: ['#e0e7ff', '#a5b4fc', '#6366f1'], ground: ['#bfdbfe', '#3b82f6'], snow: true },
  ][i % 3];
  let seed = 7 + i * 13;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const sky = x.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, P.sky[0]);
  sky.addColorStop(0.7, P.sky[1]);
  sky.addColorStop(1, P.sky[2]);
  x.fillStyle = sky;
  x.fillRect(0, 0, W, horizon);
  // a few soft clouds
  for (let k = 0; k < 5; k++) {
    const cx = rnd() * W, cy = 40 + rnd() * horizon * 0.4, r = 18 + rnd() * 26;
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (let m = 0; m < 4; m++) { x.beginPath(); x.arc(cx + m * r * 0.8, cy + (m % 2) * r * 0.25, r * (0.7 + rnd() * 0.5), 0, Math.PI * 2); x.fill(); }
  }
  const sunX = W * 0.3, sunY = 70;
  const glow = x.createRadialGradient(sunX, sunY, 0, sunX, sunY, 160);
  glow.addColorStop(0, `${P.sun}dd`);
  glow.addColorStop(1, `${P.sun}00`);
  x.fillStyle = glow;
  x.fillRect(0, 0, W, horizon);
  x.fillStyle = P.sun;
  x.beginPath();
  x.arc(sunX, sunY, 26, 0, Math.PI * 2);
  x.fill();
  P.hills.forEach((col, r) => {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, horizon + 2);
    const base = horizon - 10 - (P.hills.length - 1 - r) * 34;
    for (let px = 0; px <= W; px += 8) {
      const y = base - Math.abs(Math.sin(px * (0.004 + r * 0.002) + r * 2)) * (P.snow ? 150 - r * 30 : 60 - r * 10) - rnd() * 3;
      x.lineTo(px, y);
    }
    x.lineTo(W, horizon + 2);
    x.closePath();
    x.fill();
    if (P.snow && r === 0) {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.moveTo(0, horizon - 60);
      for (let px = 0; px <= W; px += 8) x.lineTo(px, base - Math.abs(Math.sin(px * 0.004)) * 150 - 1);
      for (let px = W; px >= 0; px -= 8) x.lineTo(px, base - Math.abs(Math.sin(px * 0.004)) * 150 + 40 + Math.sin(px * 0.05) * 10);
      x.closePath();
      x.fill();
    }
  });
  if (P.sea) {
    const sea = x.createLinearGradient(0, horizon, 0, H * 0.82);
    sea.addColorStop(0, P.sea[0]);
    sea.addColorStop(1, P.sea[1]);
    x.fillStyle = sea;
    x.fillRect(0, horizon, W, H * 0.82 - horizon);
    for (let y = horizon + 6; y < H * 0.82; y += 9) {
      x.fillStyle = 'rgba(255,255,255,0.35)';
      x.fillRect(rnd() * W, y, 30 + rnd() * 80, 1.5);
    }
  }
  const gy = P.sea ? H * 0.8 : horizon;
  const ground = x.createLinearGradient(0, gy, 0, H);
  ground.addColorStop(0, P.ground[0]);
  ground.addColorStop(1, P.ground[1]);
  x.fillStyle = ground;
  x.beginPath();
  x.moveTo(0, gy + 30);
  for (let px = 0; px <= W; px += 10) x.lineTo(px, gy + Math.sin(px * 0.006) * 12 + (P.sea ? 6 : 0));
  x.lineTo(W, H);
  x.lineTo(0, H);
  x.closePath();
  x.fill();
  if (P.snow) {
    // the lake reflects the sky
    x.fillStyle = 'rgba(255,255,255,0.35)';
    for (let y = gy + 10; y < H; y += 7) x.fillRect(rnd() * W * 0.6, y, 80 + rnd() * 140, 2);
  }
  if (P.tree) {
    x.fillStyle = '#78350f';
    x.fillRect(W * 0.7 - 5, horizon - 40, 10, 70);
    x.fillStyle = '#15803d';
    for (const [dx, dy, r] of [[0, -60, 34], [-26, -40, 26], [26, -42, 26], [0, -30, 30]]) {
      x.beginPath(); x.arc(W * 0.7 + dx, horizon + dy, r, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#4ade80';
    x.beginPath(); x.arc(W * 0.7 - 8, horizon - 68, 18, 0, Math.PI * 2); x.fill();
  }
  return c.toDataURL('image/jpeg', 0.88);
}

export default function ImageRevealPage() {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(true);
  const [dry, setDry] = useState(false);
  const src = useMemo(() => makeScene(i), [i]);
  const stepRef = useRef(0);

  // a diffusion-style run: ~24 uneven steps
  useEffect(() => {
    if (!running) return;
    let id;
    const step = () => {
      stepRef.current += 1;
      const p = Math.min(1, stepRef.current / 24 + (Math.random() - 0.5) * 0.02);
      setProgress(p);
      if (p >= 1) {
        setRunning(false);
        return;
      }
      id = setTimeout(step, 120 + Math.random() * 260);
    };
    id = setTimeout(step, 400);
    return () => clearTimeout(id);
  }, [running]);

  const generate = (next = false) => {
    stepRef.current = 0;
    setDry(false);
    setProgress(0);
    if (next) setI((n) => (n + 1) % PROMPTS.length);
    setRunning(true);
  };

  // auto-play: generate, hold the finished image for a while, next prompt
  useEffect(() => {
    if (!auto) return;
    if (!running && progress === 0) {
      const id = setTimeout(() => generate(false), 600);
      return () => clearTimeout(id);
    }
    if (dry) {
      const id = setTimeout(() => generate(true), 3800);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, running, progress, dry]);

  const manual = (fn) => () => {
    setAuto(false);
    fn();
  };
  const pct = Math.round(progress * 100);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[480px]"
      preview={
        <div className="w-full max-w-md px-4 py-6 sm:px-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1 font-mono text-[11px] text-stone-400">
              <span className="truncate text-stone-600">/imagine {PROMPTS[i]}</span>
              <span className="shrink-0 tabular-nums">{dry ? 'done' : running || progress > 0 ? `generating · ${pct}%` : 'queued'}</span>
            </div>
            {/* the URL only exists once the run is over — same as a real API */}
            <ImageReveal progress={progress} src={progress >= 1 ? src : undefined} generating={running} cell={9} alt={PROMPTS[i]} onRevealed={() => setDry(true)} />
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={running} onClick={manual(() => generate(false))}>▶ generate</PillButton>
          <PillButton onClick={manual(() => generate(true))}>next prompt</PillButton>
          <PillButton
            onClick={manual(() => {
              setRunning(false);
              stepRef.current = 0;
              setProgress(0);
              setDry(false);
            })}
          >
            reset
          </PillButton>
        </>
      }
      usage={`import ImageReveal from './components/ImageReveal';

// progress from your generation stream (steps done / total);
// imageUrl is undefined until the API returns the picture
<ImageReveal progress={step / steps} src={imageUrl} generating={isGenerating} alt={prompt} />`}
      props={props}
    />
  );
}
