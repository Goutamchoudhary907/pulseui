import { useEffect, useState } from 'react';
import { getComponent } from '../../registry';
import ThinkingPulse from '../../components/ThinkingPulse';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('thinking-pulse');

const ANSWER =
  'The flake is a timing issue — the test asserts before the debounce fires. Advance fake timers by 300ms before asserting.';

const props = [
  { name: 'settled', type: 'boolean', def: 'false', desc: 'false = thinking, true = converge into a point. Flip back and the point bursts open again.' },
  { name: 'size', type: 'number', def: '160', desc: 'Canvas width and height in px. Works inline at ~20px or as a hero.' },
  { name: 'activity', type: 'number (0..1)', def: '0.6', desc: 'How hard it\'s thinking — speed, swirl and spark rate. Tie it to tokens/sec or tool calls.' },
  { name: 'particleCount', type: 'number', def: 'scales with size', desc: 'How many particles make up the cloud.' },
  { name: 'color', type: 'hex', def: "'#7c3aed'", desc: 'Particle colour.' },
  { name: 'onSettled', type: '() => void', desc: 'Fires once, on the beat the cloud collapses — start rendering the answer here.' },
];

// The inline use-case: a chat bubble that starts typing on the settle beat.
// Remounted (via key) whenever `settled` flips, so it starts clean.
function Bubble({ settled, activity }) {
  const [typed, setTyped] = useState('');
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (!go) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(ANSWER.slice(0, i));
      if (i >= ANSWER.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [go]);

  return (
    <div className="flex w-full max-w-md items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
        P
      </span>
      <div className="min-h-[44px] rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-2.5 text-[14.5px] leading-relaxed text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {typed ? (
          typed
        ) : (
          <span className="flex items-center gap-2 text-stone-500">
            <ThinkingPulse settled={settled} size={22} activity={activity} onSettled={() => setGo(true)} />
            {settled ? '' : 'Thinking…'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ThinkingPulsePage() {
  const [settled, setSettled] = useState(false);
  const [activity, setActivity] = useState(0.6);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[460px]"
      preview={
        <div className="flex w-full flex-col items-center gap-10 px-6 pb-10 pt-4 md:flex-row md:justify-center md:gap-16">
          <ThinkingPulse settled={settled} size={220} activity={activity} />
          <Bubble key={String(settled)} settled={settled} activity={activity} />
        </div>
      }
      controls={
        <>
          <PillButton active={!settled} onClick={() => setSettled(false)}>Thinking</PillButton>
          <PillButton active={settled} onClick={() => setSettled(true)}>Settled</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <span className="pl-2 pr-1 font-mono text-[11px] text-stone-400">activity</span>
          {[
            [0.2, 'low'],
            [0.6, 'mid'],
            [1, 'high'],
          ].map(([v, label]) => (
            <PillButton key={label} active={activity === v} onClick={() => setActivity(v)}>
              {label}
            </PillButton>
          ))}
        </>
      }
      usage={`import ThinkingPulse from './components/ThinkingPulse';

// inline, in a chat bubble
<ThinkingPulse
  size={22}
  settled={!isStreaming}
  activity={tokensPerSec / 80}
  onSettled={() => setShowAnswer(true)}
/>`}
      props={props}
    />
  );
}
