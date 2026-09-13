import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import StreamingText from '../../components/StreamingText';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('streaming-text');

const SAMPLE =
  'The flake isn\'t in the test — it\'s in the debounce. The assertion runs before the 300ms timer fires, so the first render still shows the old value.\n\nAdvance fake timers before asserting:\n\n  vi.advanceTimersByTime(300)\n\nThat makes the test deterministic without touching the component.';

const props = [
  { name: 'text', type: 'string', def: "''", desc: 'The full answer so far. Keep appending as chunks arrive; anything that isn\'t a continuation starts over.' },
  { name: 'streaming', type: 'boolean', def: 'false', desc: 'true while chunks are still coming. Drives the caret: breathing while live, slow when stalled, dissolves when false.' },
  { name: 'condenseMs', type: 'number', def: '320', desc: 'How long a chunk takes to go from vapour to ink.' },
  { name: 'stallMs', type: 'number', def: '600', desc: 'No chunk for this long counts as a stall.' },
];

// Fakes an LLM stream: subword-sized chunks at jittered intervals.
function useFakeStream(sample) {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [speed, setSpeed] = useState(1);
  const pos = useRef(0);

  useEffect(() => {
    if (!streaming || stalled) return;
    let id;
    const push = () => {
      pos.current = Math.min(sample.length, pos.current + 2 + Math.floor(Math.random() * 12));
      setText(sample.slice(0, pos.current));
      if (pos.current >= sample.length) {
        setStreaming(false);
        return;
      }
      id = setTimeout(push, (25 + Math.random() * 95) / speed);
    };
    id = setTimeout(push, 80);
    return () => clearTimeout(id);
  }, [streaming, stalled, sample, speed]);

  const start = () => {
    pos.current = 0;
    setText('');
    setStalled(false);
    setStreaming(true);
  };
  const reset = () => {
    pos.current = 0;
    setStreaming(false);
    setStalled(false);
    setText('');
  };
  return { text, streaming, stalled, speed, setSpeed, setStalled, start, reset, finish: () => setStreaming(false) };
}

export default function StreamingTextPage() {
  const s = useFakeStream(SAMPLE);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[440px]"
      preview={
        <div className="flex w-full max-w-xl items-start gap-3 px-6 pb-12 pt-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
            P
          </span>
          <div className="min-h-[44px] min-w-0 flex-1 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {s.text || s.streaming ? (
              <StreamingText text={s.text} streaming={s.streaming} />
            ) : (
              <span className="text-stone-400">Press ▶ stream to watch an answer arrive.</span>
            )}
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={s.streaming && !s.stalled} onClick={s.start}>▶ stream</PillButton>
          <PillButton active={s.stalled} onClick={() => s.streaming && s.setStalled((v) => !v)}>
            {s.stalled ? 'stalled' : 'stall'}
          </PillButton>
          <PillButton onClick={s.finish}>done</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton active={s.speed === 0.5} onClick={() => s.setSpeed(0.5)}>slow</PillButton>
          <PillButton active={s.speed === 1} onClick={() => s.setSpeed(1)}>normal</PillButton>
          <PillButton active={s.speed === 2.2} onClick={() => s.setSpeed(2.2)}>fast</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={s.reset}>reset</PillButton>
        </>
      }
      usage={`import StreamingText from './components/StreamingText';

// keep appending chunks from your stream; pass the whole string
const [answer, setAnswer] = useState('');
for await (const chunk of stream) setAnswer((a) => a + chunk);

<StreamingText text={answer} streaming={isStreaming} />`}
      props={props}
    />
  );
}
