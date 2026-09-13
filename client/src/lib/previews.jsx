import { useEffect, useState } from 'react';
import ThinkingIndicator from '../components/ThinkingIndicator';
import ConfidenceText from '../components/ConfidenceText';
import ContextMeter from '../components/ContextMeter';
import CodeDiff from '../components/CodeDiff';
import AgentStatus from '../components/AgentStatus';
import Regenerate from '../components/Regenerate';
import Timer from '../components/Timer';
import StreamingText from '../components/StreamingText';

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
  const settled = useCycle([false, true], 3000);
  return <ThinkingIndicator settled={settled} size={110} particleCount={48} color="#7c3aed" />;
}

export function ConfidenceTextPreview() {
  return (
    <div className="max-w-[220px] text-center text-[14px] leading-relaxed text-stone-700">
      <ConfidenceText
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
  const value = useCycle([0.32, 0.61, 0.97, 0.45], 2600);
  return <ContextMeter value={value} length={170} thickness={14} label />;
}

export function CodeDiffPreview() {
  const accepted = useCycle([false, true], 2600);
  return (
    <div className="w-[230px] overflow-hidden rounded-lg border border-stone-200">
      <CodeDiff
        accepted={accepted}
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
  const stage = useCycle([0, 1, 2, 3], 1800);
  const agents = [
    { id: 'a', status: stage >= 1 ? 'done' : 'running' },
    { id: 'b', status: stage >= 2 ? 'done' : 'running' },
    { id: 'c', status: stage >= 3 ? 'done' : 'running' },
  ];
  return <AgentStatus agents={agents} width={250} height={140} boidsPerAgent={6} showLabels={false} />;
}

const ANSWERS = [
  'Use a mutex around the write; the race is on line 42.',
  'The race is on line 42 — wrap the write in a mutex.',
];
export function RegeneratePreview() {
  const text = useCycle(ANSWERS, 4200);
  return (
    <div className="w-[220px] text-[13.5px] leading-relaxed text-stone-700">
      <Regenerate text={text} />
    </div>
  );
}

export function TimerPreview() {
  const running = useCycle([true, true, true, false], 1500);
  return (
    <div className="flex items-center gap-3 text-[14px] text-stone-500">
      <span>{running ? 'Thinking…' : 'Thought for'}</span>
      <Timer running={running} label />
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
    <div className="w-[230px] text-[13.5px] leading-relaxed text-stone-700">
      <StreamingText text={text} streaming={streaming} />
    </div>
  );
}
