import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import Regenerate from '../../components/Regenerate';
import StreamingText from '../../components/StreamingText';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('regenerate');

const ANSWERS = [
  'The flake is a timing issue: the test asserts before the debounce fires. Wrap the assertion in waitFor, or advance fake timers by 300ms before asserting.',
  'It\'s not the debounce — the mock server returns in a different order on CI. Sort the results before comparing, or assert on membership instead of order.',
  'Both are plausible, but the stack trace points at the debounce. Start there: advance timers by 300ms, and if it still flakes, look at result ordering next.',
];

const props = [
  { name: 'text', type: 'string', desc: 'The current answer. May keep growing while it streams.' },
  { name: 'attempt', type: 'number', def: '0', desc: 'Bump it to regenerate. Whatever is on screen rewinds first.' },
  { name: 'children', type: 'ReactNode', desc: 'Rendered after the rewind — e.g. a <StreamingText> fed by the new request. Without children, `text` is typed in.' },
  { name: 'typeMs', type: 'number', def: '14', desc: 'ms per character when typing `text` in (no children). Pauses longer after punctuation.' },
  { name: 'rewindMs', type: 'number', def: '30', desc: 'ms per rewind frame. Each frame pulls back an accelerating chunk.' },
  { name: 'cursor', type: 'boolean', def: 'true', desc: 'Show a block cursor while typing.' },
  { name: 'onPhase', type: '(phase) => void', desc: "Called with 'rewinding' | 'writing' | 'idle'." },
];

// Fakes an LLM stream: subword-sized chunks at jittered intervals.
function useFakeStream() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const sample = useRef('');
  const pos = useRef(0);

  useEffect(() => {
    if (!streaming) return;
    let id;
    const push = () => {
      const s = sample.current;
      pos.current = Math.min(s.length, pos.current + 2 + Math.floor(Math.random() * 10));
      setText(s.slice(0, pos.current));
      if (pos.current >= s.length) {
        setStreaming(false);
        return;
      }
      id = setTimeout(push, 30 + Math.random() * 90);
    };
    id = setTimeout(push, 120);
    return () => clearTimeout(id);
  }, [streaming]);

  const start = (s) => {
    sample.current = s;
    pos.current = 0;
    setText('');
    setStreaming(true);
  };
  const clear = () => {
    setStreaming(false);
    setText('');
  };
  return { text, streaming, start, clear };
}

export default function RegeneratePage() {
  const stream = useFakeStream();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [auto, setAuto] = useState(true);
  const pending = useRef(null);
  const idx = attempt % ANSWERS.length;
  const busy = phase !== 'idle' || stream.streaming;

  const regenerate = () => {
    if (busy) return;
    pending.current = ANSWERS[(attempt + 1) % ANSWERS.length];
    stream.clear();
    setAttempt((a) => a + 1);
  };

  // the first answer just streams in; after that every regenerate rewinds
  useEffect(() => {
    const id = setTimeout(() => stream.start(ANSWERS[0]), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // once the rewind finishes, the new request streams in
  const onPhase = (p) => {
    setPhase(p);
    if (p === 'idle' && pending.current) {
      const s = pending.current;
      pending.current = null;
      stream.start(s);
    }
  };

  // auto-play: keep regenerating until the visitor takes over
  useEffect(() => {
    if (!auto || busy) return;
    const id = setTimeout(regenerate, 3200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, busy, attempt]);

  const label = phase === 'rewinding' ? 'rewinding' : stream.streaming ? 'streaming' : 'idle';

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[400px]"
      preview={
        <div className="flex w-full max-w-xl items-start gap-3 px-6 py-6">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
            P
          </span>
          <div className="min-w-0 flex-1">
            <div className="min-h-[96px] rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 text-[15px] leading-[1.7] text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Regenerate text={stream.text} attempt={attempt} onPhase={onPhase}>
                <StreamingText text={stream.text} streaming={stream.streaming} />
              </Regenerate>
            </div>
            <div className="mt-2 flex items-center gap-1 pl-1 font-mono text-[11px] text-stone-400">
              <button
                type="button"
                onClick={() => {
                  setAuto(false);
                  regenerate();
                }}
                disabled={busy}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-stone-400"
              >
                <span className={phase === 'rewinding' ? 'inline-block animate-spin' : ''}>↻</span>
                regenerate
              </button>
              <span className="mx-1 h-3 w-px bg-stone-200" />
              <span className="tabular-nums">
                {idx + 1} / {ANSWERS.length}
              </span>
              <span className="ml-auto pr-1">{label}</span>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton
            onClick={() => {
              setAuto(false);
              regenerate();
            }}
          >
            {busy ? `${label}…` : '↻ regenerate'}
          </PillButton>
        </>
      }
      usage={`import Regenerate from './components/Regenerate';
import StreamingText from './components/StreamingText';

// bump \`attempt\` → the old answer rewinds, then the new stream renders
<Regenerate text={answer} attempt={attempt}>
  <StreamingText text={answer} streaming={isStreaming} />
</Regenerate>

// or let it type the new text in itself
<Regenerate text={answer} attempt={attempt} />`}
      props={props}
    />
  );
}
