import { useEffect, useState } from 'react';
import { getComponent } from '../../registry';
import ThinkingIndicator from '../../components/ThinkingIndicator';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('thinking-indicator');

const props = [
  { name: 'settled', type: 'boolean', def: 'false', desc: 'false = thinking. true = the click, then the field spirals in and collapses into the core.' },
  { name: 'activity', type: 'number (0..1)', def: '0.55', desc: 'How lively the field is — current speed and how often synapses fire. Drive it from reasoning tokens/sec.' },
  { name: 'size', type: 'number', def: '32', desc: 'Canvas width and height in px. Reads from 20px inline up to a 240px hero.' },
  { name: 'particleCount', type: 'number', def: 'auto', desc: 'Scales with size by default (14 at 24px, ~60 at 160px).' },
  { name: 'color', type: 'hex', def: "'#7c3aed'", desc: 'Particle colour.' },
  { name: 'onSettled', type: '() => void', desc: 'Fires once, on the beat the field collapses into the core — start rendering the answer here.' },
];

export default function ThinkingIndicatorPage() {
  const [settled, setSettled] = useState(false);
  const [activity, setActivity] = useState(0.55);
  const [sim, setSim] = useState(false);

  // simulate: think for a few seconds (getting busier), settle, rest, repeat
  useEffect(() => {
    if (!sim) return;
    const ids = [];
    const run = () => {
      setSettled(false);
      setActivity(0.35);
      ids.push(setTimeout(() => setActivity(0.85), 1500));
      ids.push(setTimeout(() => setSettled(true), 3600));
      ids.push(setTimeout(run, 6400));
    };
    run();
    return () => ids.forEach(clearTimeout);
  }, [sim]);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[420px]"
      preview={
        <div className="flex w-full flex-col items-center gap-8 px-4 pb-6 pt-6 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-2 md:flex-row md:justify-center md:gap-16">
          <ThinkingIndicator settled={settled} activity={activity} size={200} />

          <div className="w-full max-w-sm divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
                P
              </span>
              <ThinkingIndicator settled={settled} activity={activity} size={28} />
              <span className="text-[14px] text-stone-500">{settled ? 'Here’s what I found' : 'Thinking…'}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 text-[13px] text-stone-500">
              <ThinkingIndicator settled={settled} activity={activity} size={20} color="#a8a29e" />
              <span className="truncate">20px, muted — fits a status bar</span>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={sim} onClick={() => setSim((v) => !v)}>{sim ? 'simulating…' : '▶ simulate'}</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton active={!settled} onClick={() => { setSim(false); setSettled(false); }}>Thinking</PillButton>
          <PillButton active={settled} onClick={() => { setSim(false); setSettled(true); }}>Settled</PillButton>
        </>
      }
      usage={`import ThinkingIndicator from './components/ThinkingIndicator';

// inline, next to the assistant avatar
<ThinkingIndicator
  settled={!isThinking}
  activity={reasoningTokensPerSec / 40}
  onSettled={() => setShowAnswer(true)}
/>`}
      props={props}
    />
  );
}
