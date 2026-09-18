import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import StreamingText from '../../components/StreamingText';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('streaming-text');

const SAMPLE =
  'The flake isn\'t in the test — it\'s in the debounce. The assertion runs before the 300ms timer fires, so the first render still shows the old value.\n\nAdvance fake timers before asserting:\n\n  vi.advanceTimersByTime(300)\n\nThat makes the test deterministic without touching the component.';

// where the auto-play stalls for a beat, so the stalled caret is seen
const STALL_AT = SAMPLE.indexOf('Advance');
const STOP_AT = SAMPLE.indexOf('That makes');

const props = [
  { name: 'text', type: 'string', def: "''", desc: 'The full answer so far. Keep appending as chunks arrive; anything that isn\'t a continuation starts over.' },
  { name: 'streaming', type: 'boolean', def: 'false', desc: 'true while chunks are still coming. Drives the caret: breathing while live, vapour when stalled, dries when false.' },
  { name: 'stopped', type: 'boolean', def: 'false', desc: 'The user hit Stop. With streaming=false the answer ends in a tear — the last word\'s ink drags, a ragged edge marks the cut.' },
  { name: 'condenseMs', type: 'number', def: '320', desc: 'How long a chunk takes to go from vapour to ink.' },
  { name: 'stallMs', type: 'number', def: '600', desc: 'No chunk for this long counts as a stall.' },
];

// Fakes an LLM stream: subword-sized chunks at jittered intervals.
function useFakeStream(sample) {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [rate, setRate] = useState(0);
  const pos = useRef(0);
  const arrivals = useRef([]);

  useEffect(() => {
    if (!streaming || stalled) return;
    let id;
    const push = () => {
      const n = 2 + Math.floor(Math.random() * 12);
      pos.current = Math.min(sample.length, pos.current + n);
      setText(sample.slice(0, pos.current));
      const now = performance.now();
      arrivals.current = arrivals.current.filter((a) => now - a.at < 1000);
      arrivals.current.push({ at: now, n });
      setRate(Math.round(arrivals.current.reduce((s, a) => s + a.n, 0) / 4)); // ~4 chars per token
      if (pos.current >= sample.length) {
        setStreaming(false);
        return;
      }
      id = setTimeout(push, 25 + Math.random() * 95);
    };
    id = setTimeout(push, 80);
    return () => clearTimeout(id);
  }, [streaming, stalled, sample]);

  // the readout decays to zero when nothing arrives
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => {
      const now = performance.now();
      arrivals.current = arrivals.current.filter((a) => now - a.at < 1000);
      setRate(Math.round(arrivals.current.reduce((s, a) => s + a.n, 0) / 4));
    }, 200);
    return () => clearInterval(id);
  }, [streaming]);

  const start = () => {
    pos.current = 0;
    arrivals.current = [];
    setText('');
    setStalled(false);
    setStopped(false);
    setStreaming(true);
  };
  const stop = () => {
    if (!streaming) return;
    setStalled(false);
    setStreaming(false);
    setStopped(true);
  };
  const reset = () => {
    pos.current = 0;
    arrivals.current = [];
    setStreaming(false);
    setStalled(false);
    setStopped(false);
    setText('');
    setRate(0);
  };
  return { text, streaming, stalled, stopped, rate, pos, setStalled, start, stop, reset };
}

export default function StreamingTextPage() {
  const s = useFakeStream(SAMPLE);
  const [auto, setAuto] = useState(true);
  const stalledOnce = useRef(false);
  const runs = useRef(0);

  // auto-play: stream, stall once midway for a beat, finish, wait, repeat
  useEffect(() => {
    if (!auto) return;
    if (!s.streaming && !s.text) {
      stalledOnce.current = false;
      runs.current += 1;
      const id = setTimeout(s.start, 500);
      return () => clearTimeout(id);
    }
    // every other run, the visitor "hits stop" two thirds of the way in
    if (s.streaming && runs.current % 2 === 0 && s.pos.current >= STOP_AT) {
      const id = setTimeout(s.stop, 80);
      return () => clearTimeout(id);
    }
    if (s.streaming && !s.stalled && !stalledOnce.current && s.pos.current >= STALL_AT) {
      stalledOnce.current = true;
      s.setStalled(true);
      return;
    }
    if (!s.streaming && s.text) {
      const id = setTimeout(s.reset, 3600);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, s.streaming, s.stalled, s.text]);

  // …and the auto-play stall lets go after a beat
  useEffect(() => {
    if (!auto || !s.stalled) return;
    const id = setTimeout(() => s.setStalled(false), 1800);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, s.stalled]);

  const manual = (fn) => () => {
    setAuto(false);
    fn();
  };

  const status = s.streaming ? (s.stalled ? 'stalled' : `${s.rate} tok/s`) : s.stopped ? 'stopped' : s.text ? 'done' : 'idle';

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[440px]"
      preview={
        <div className="flex w-full max-w-xl items-start gap-3 px-4 py-6 sm:px-6">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
            P
          </span>
          <div className="min-w-0 flex-1">
            <div className="min-h-[44px] rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {s.text || s.streaming ? (
                <StreamingText text={s.text} streaming={s.streaming} stopped={s.stopped} />
              ) : (
                <span className="text-stone-400">…</span>
              )}
            </div>
            <div className="mt-2 flex items-center pl-1 font-mono text-[11px] text-stone-400">
              <span className={`tabular-nums transition-colors ${s.stalled ? 'text-amber-600' : ''}`}>{status}</span>
              {s.streaming && (
                <span className="ml-auto pr-1 tabular-nums">
                  {Math.round((s.pos.current / SAMPLE.length) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={s.streaming && !s.stalled} onClick={manual(s.start)}>▶ stream</PillButton>
          <PillButton active={s.stalled} onClick={manual(() => s.streaming && s.setStalled((v) => !v))}>
            {s.stalled ? 'stalled' : 'stall'}
          </PillButton>
          <PillButton active={s.stopped} onClick={manual(s.stop)}>■ stop</PillButton>
          <PillButton onClick={manual(s.reset)}>reset</PillButton>
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
