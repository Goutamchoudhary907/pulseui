import { useEffect, useState } from 'react';
import ThinkingPulse from '../components/ThinkingPulse';
import ConfidenceShimmer from '../components/ConfidenceShimmer';
import LiquidContextMeter from '../components/LiquidContextMeter';
import InkBleedDiff from '../components/InkBleedDiff';
import SwarmStatus from '../components/SwarmStatus';
import RewindRegenerate from '../components/RewindRegenerate';

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

export function ThinkingPulsePreview() {
  const settled = useCycle([false, true], 3000);
  return <ThinkingPulse settled={settled} size={110} particleCount={48} color="#7c3aed" />;
}

export function ConfidenceShimmerPreview() {
  return (
    <div className="max-w-[220px] text-center text-[14px] leading-relaxed text-stone-700">
      <ConfidenceShimmer
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

export function LiquidContextMeterPreview() {
  const value = useCycle([0.32, 0.61, 0.9, 0.45], 2600);
  return <LiquidContextMeter value={value} width={64} height={110} />;
}

export function InkBleedDiffPreview() {
  const accepted = useCycle([true, false], 2800);
  return (
    <div className="w-[230px] overflow-hidden rounded-lg border border-stone-200">
      <InkBleedDiff
        accepted={accepted}
        style={{ padding: '6px 0' }}
        lines={[
          { type: 'context', content: 'const retries =' },
          { type: 'remove', content: '  1;' },
          { type: 'add', content: '  3;' },
        ]}
      />
    </div>
  );
}

export function SwarmStatusPreview() {
  const stage = useCycle([0, 1, 2, 3], 1800);
  const agents = [
    { id: 'a', status: stage >= 1 ? 'done' : 'running' },
    { id: 'b', status: stage >= 2 ? 'done' : 'running' },
    { id: 'c', status: stage >= 3 ? 'done' : 'running' },
  ];
  return <SwarmStatus agents={agents} width={250} height={130} boidsPerAgent={6} />;
}

const ANSWERS = [
  'Use a mutex around the write; the race is on line 42.',
  'The race is on line 42 — wrap the write in a mutex.',
];
export function RewindRegeneratePreview() {
  const text = useCycle(ANSWERS, 4200);
  return (
    <div className="w-[220px] text-[13.5px] leading-relaxed text-stone-700">
      <RewindRegenerate text={text} />
    </div>
  );
}
