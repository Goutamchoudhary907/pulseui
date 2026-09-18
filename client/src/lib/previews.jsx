import { useEffect, useState } from 'react';
import ThinkingIndicator from '../components/ThinkingIndicator';
import ConfidenceText from '../components/ConfidenceText';
import ContextMeter from '../components/ContextMeter';
import CodeDiff from '../components/CodeDiff';
import AgentStatus from '../components/AgentStatus';
import Regenerate from '../components/Regenerate';
import Timer from '../components/Timer';
import StreamingText from '../components/StreamingText';
import ToolCall from '../components/ToolCall';
import HoldToAllow from '../components/HoldToAllow';
import ImageReveal from '../components/ImageReveal';
import FileChunker from '../components/FileChunker';

// Small self-running previews for the component cards on the homepage and
// the /components index. Each one loops on its own timer so the card
// demonstrates the effect without any interaction.

function useCycle(states, ms) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % states.length), ms);
    return () => clearInterval(id);
  }, [states.length, ms]);
  return states[i];
}

export function ThinkingIndicatorPreview() {
  const stage = useCycle([0, 1, 2, 2], 1400);
  return <ThinkingIndicator settled={stage === 2} activity={stage === 1 ? 0.85 : 0.45} size={170} color="#7c3aed" />;
}

export function ConfidenceTextPreview() {
  const resolved = useCycle([false, false, false, true, true], 1400);
  return (
    <div className="max-w-[300px] text-center text-[16px] leading-relaxed text-stone-700">
      <ConfidenceText
        resolved={resolved}
        showScores={false}
        tokens={[
          'The', 'deploy', 'finished', 'at',
          { text: '14:02,', confidence: 0.38 },
          'and', 'the', 'cause', 'was',
          { text: 'probably', confidence: 0.22 },
          { text: 'the', confidence: 0.5 },
          { text: 'cache.', confidence: 0.3 },
        ]}
      />
    </div>
  );
}

export function ContextMeterPreview() {
  const value = useCycle([0.32, 0.61, 0.97, 1, 0.45], 2600);
  return (
    <div className="scale-[0.9] sm:scale-100">
      <ContextMeter value={value} length={260} thickness={18} label />
    </div>
  );
}

export function CodeDiffPreview() {
  const status = useCycle(['pending', 'accepted', 'accepted', 'pending', 'rejected', 'rejected'], 1500);
  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-lg border border-stone-200">
      <CodeDiff
        status={status}
        style={{ padding: '6px 0' }}
        lines={[
          { type: 'context', content: 'const retries =' },
          { type: 'remove', content: '  1;' },
          { type: 'add', content: '  3;' },
          { type: 'remove', content: '  timeout: 500,' },
          { type: 'add', content: '  timeout: 5000,' },
        ]}
      />
    </div>
  );
}

export function AgentStatusPreview() {
  const stage = useCycle([0, 1, 2, 3, 4, 4], 1500);
  const agents = stage === 0 ? [] : [
    { id: 'a', status: stage >= 2 ? 'done' : 'running', progress: stage >= 2 ? 1 : 0.6 },
    { id: 'b', status: stage >= 3 ? 'done' : 'running', progress: stage >= 3 ? 1 : 0.35 },
    { id: 'c', status: stage >= 4 ? 'done' : 'running', progress: stage >= 4 ? 1 : 0.8 },
  ];
  return (
    <div className="scale-[0.65] sm:scale-100">
      <AgentStatus agents={agents} width={360} height={220} boidsPerAgent={7} showLabels={false} />
    </div>
  );
}

const ANSWERS = [
  'Use a mutex around the write; the race is on line 42.',
  'The race is on line 42 — wrap the write in a mutex.',
];
export function RegeneratePreview() {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAttempt((a) => a + 1), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="w-full max-w-[300px] text-[15px] leading-relaxed text-stone-700">
      <Regenerate text={ANSWERS[attempt % ANSWERS.length]} attempt={attempt} />
    </div>
  );
}

export function TimerPreview() {
  const running = useCycle([true, true, true, false], 1500);
  return (
    <div className="flex items-center gap-4 text-[18px] text-stone-500">
      <span>{running ? 'Thinking…' : 'Thought for'}</span>
      <Timer running={running} label size={22} />
    </div>
  );
}

const LINE = 'Use a mutex around the write — the race is on line 42.';
export function StreamingTextPreview() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(true);
  useEffect(() => {
    let pos = 0;
    let id;
    const push = () => {
      pos = Math.min(LINE.length, pos + 2 + Math.floor(Math.random() * 8));
      setText(LINE.slice(0, pos));
      if (pos >= LINE.length) {
        setStreaming(false);
        id = setTimeout(restart, 1600);
        return;
      }
      id = setTimeout(push, 40 + Math.random() * 110);
    };
    const restart = () => {
      pos = 0;
      setText('');
      setStreaming(true);
      id = setTimeout(push, 400);
    };
    id = setTimeout(push, 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="w-full max-w-[300px] text-[15px] leading-relaxed text-stone-700">
      <StreamingText text={text} streaming={streaming} />
    </div>
  );
}

export function ToolCallPreview() {
  const status = useCycle(
    ['calling', 'running', 'running', 'running', 'running', 'done', 'done', 'done', 'idle'],
    1300,
  );
  const detail = status === 'done' ? '6 results' : status === 'idle' ? undefined : '"borrow checker"';
  return <div className="w-full max-w-[340px] text-[15px]"><ToolCall name="search_web" status={status} detail={detail} size={36} width={170} /></div>;
}

// hold → let go → hold through → allowed → a fresh gate
const GATE_SEQ = [0, 1, 0, 1, 1, 2, 2, 2];
export function HoldToAllowPreview() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, []);
  const stage = GATE_SEQ[tick % GATE_SEQ.length];
  const epoch = Math.floor(tick / GATE_SEQ.length); // a fresh gate each loop
  return (
    <div className="w-full max-w-[320px]">
      <HoldToAllow key={epoch} verb="run" action="rm -rf dist" holding={stage === 1} status={stage === 2 ? 'allowed' : undefined} />
    </div>
  );
}

// a tiny meadow so the card needs no network
const PRINT = (() => {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 240;
  c.height = 160;
  const x = c.getContext('2d');
  const sky = x.createLinearGradient(0, 0, 0, 95);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(1, '#f0f9ff');
  x.fillStyle = sky;
  x.fillRect(0, 0, 240, 95);
  x.fillStyle = '#fffbeb';
  x.beginPath();
  x.arc(70, 34, 16, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.9)';
  for (const [cx, cy] of [[150, 30], [200, 50]]) for (let m = 0; m < 3; m++) { x.beginPath(); x.arc(cx + m * 12, cy + (m % 2) * 4, 10, 0, Math.PI * 2); x.fill(); }
  ['#86efac', '#4ade80', '#22c55e'].forEach((col, r) => {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, 100);
    for (let px = 0; px <= 240; px += 6) x.lineTo(px, 96 - (2 - r) * 12 - Math.abs(Math.sin(px * (0.012 + r * 0.008) + r * 2)) * (20 - r * 4));
    x.lineTo(240, 100);
    x.fill();
  });
  const ground = x.createLinearGradient(0, 95, 0, 160);
  ground.addColorStop(0, '#a3e635');
  ground.addColorStop(1, '#65a30d');
  x.fillStyle = ground;
  x.fillRect(0, 95, 240, 65);
  x.fillStyle = '#78350f';
  x.fillRect(166, 84, 4, 26);
  x.fillStyle = '#15803d';
  for (const [dx, dy, r] of [[0, -8, 14], [-10, 0, 10], [10, 0, 10]]) { x.beginPath(); x.arc(168 + dx, 82 + dy, r, 0, Math.PI * 2); x.fill(); }
  return c.toDataURL('image/jpeg', 0.85);
})();
export function ImageRevealPreview() {
  const progress = useCycle([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1, 1, 1, 1], 420);
  return (
    <div className="w-full max-w-[300px]">
      <ImageReveal progress={progress} src={progress >= 1 ? PRINT : undefined} generating aspect="3 / 2" cell={9} />
    </div>
  );
}

// read 6 pages → cut 14 chunks → embed → ready → hold
const INGEST = [];
for (let p = 1; p <= 6; p++) INGEST.push({ stage: 'reading', page: p, chunks: 0 });
for (let c = 2; c <= 14; c += 2) INGEST.push({ stage: 'chunking', page: 6, chunks: c });
INGEST.push({ stage: 'embedding', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'embedding', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'ready', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'ready', page: 6, chunks: 14, tokens: 3100 });
INGEST.push({ stage: 'idle', page: 0, chunks: 0 });
export function FileChunkerPreview() {
  const s = useCycle(INGEST, 520);
  return (
    <div className="w-full max-w-[320px]">
      <FileChunker name="handbook.pdf" stage={s.stage} page={s.page} pages={6} chunks={s.chunks} tokens={s.tokens ?? 0} width={150} size={44} />
    </div>
  );
}
