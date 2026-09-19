import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../lib/SectionHeading';
import useInView from '../lib/useInView';
import { usePhone } from '../lib/useViewport';
import ThinkingIndicator from '../components/ThinkingIndicator';
import Timer from '../components/Timer';
import ToolCall from '../components/ToolCall';
import StreamingText from '../components/StreamingText';
import CodeDiff from '../components/CodeDiff';
import HoldToAllow from '../components/HoldToAllow';
import ContextMeter from '../components/ContextMeter';

const GATE_STEP = 7;
const GATE_MS = 4000;
const STEP_MS = [650, 1300, 650, 850, 650, 950, 1700, GATE_MS, 650, 900, 3400];

const DEFAULT_MESSAGE = 'The auth test is flaky on CI — can you fix it?';

const ANSWER =
  'The flake is a timing issue: the assertion runs before the 300ms debounce fires. Advance the timers, then assert:';

const DIFF = [
  { type: 'context', content: '  await type("abc");' },
  { type: 'remove', content: '  expect(v).toBe("abc");' },
  { type: 'add', content: '  vi.advanceTimersByTime(300);' },
  { type: 'add', content: '  expect(v).toBe("abc");' },
];

const USED = [
  ['thinking-indicator', 'Thinking Indicator'],
  ['timer', 'Timer'],
  ['tool-call', 'Tool Call'],
  ['streaming-text', 'Streaming Text'],
  ['code-diff', 'Code Diff'],
  ['hold-to-allow', 'Hold to Allow'],
  ['context-meter', 'Context Meter'],
];

function useScript() {
  const [t, setT] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const timerRef = useRef(null);

  const goTo = (next) => {
    if (next < STEP_MS.length) setT(next);
    else {
      setT(0);
      setEpoch((e) => e + 1);
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => goTo(t + 1), STEP_MS[t]);
    return () => clearTimeout(timerRef.current);
  }, [t, epoch]);

  const resolveGate = () => {
    if (t !== GATE_STEP) return;
    clearTimeout(timerRef.current);
    goTo(t + 1);
  };

  const restart = () => {
    clearTimeout(timerRef.current);
    setT(0);
    setEpoch((e) => e + 1);
  };

  return { t, epoch, resolveGate, restart };
}

function useStreamedAnswer(active) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active) return;
    let pos = 0;
    let id;
    const push = () => {
      pos = Math.min(ANSWER.length, pos + 2 + Math.floor(Math.random() * 7));
      setText(ANSWER.slice(0, pos));
      if (pos < ANSWER.length) id = setTimeout(push, 35 + Math.random() * 80);
    };
    id = setTimeout(push, 200);
    return () => clearTimeout(id);
  }, [active]);
  return { text, streaming: active && text.length < ANSWER.length };
}

function MiniPill({ tone, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ' +
        (tone === 'accept'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
          : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-ink')
      }
    >
      {children}
    </button>
  );
}

function Conversation({ t, epoch, resolveGate, message }) {
  const phone = usePhone();
  const answer = useStreamedAnswer(t >= 6);
  const traceW = phone ? 96 : 132;
  const [diffChoice, setDiffChoice] = useState(null);
  const atGate = t === GATE_STEP;

  const toolStatus = (from, to) => (t < from ? 'idle' : t === from ? 'calling' : t < to ? 'running' : 'done');
  const read = toolStatus(2, 4);
  const test1 = toolStatus(4, 6);
  const test2 = toolStatus(8, 10);
  const thinking = t >= 1 && t < 6;
  const diffStatus = t > GATE_STEP ? 'accepted' : diffChoice || 'pending';
  const diffLabel = diffStatus === 'accepted' ? '✓ accepted' : diffStatus === 'rejected' ? '✕ reverted' : 'pending review';

  const acceptDiff = () => {
    setDiffChoice('accepted');
    resolveGate();
  };
  const rejectDiff = () => {
    setDiffChoice('rejected');
    setTimeout(() => setDiffChoice((v) => (v === 'rejected' ? null : v)), 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* user */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-stone-100 px-4 py-2.5 text-[14px] text-stone-700">
          {message}
        </div>
      </div>

      {/* assistant */}
      {t >= 1 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 pl-1 text-[13px] text-stone-500">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[13px] text-white">
              P
            </span>
            <ThinkingIndicator settled={!thinking} activity={0.7} size={20} />
            <span>{thinking ? 'Thinking' : 'Thought for'}</span>
            <Timer key={epoch} running={thinking} label size={16} />
          </div>

          {t >= 2 && (
            <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="px-4 py-2.5">
                <ToolCall name="read_file" status={read} width={traceW} detail={read === 'done' ? '212 lines' : 'auth.spec.ts'} />
              </div>
              {t >= 4 && (
                <div className="px-4 py-2.5">
                  <ToolCall name="run_tests" status={test1} width={traceW} detail={test1 === 'done' ? '2 failed · debounce' : 'auth.spec.ts'} />
                </div>
              )}
            </div>
          )}

          {t >= 6 && (
            <div className="rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <StreamingText text={answer.text} streaming={answer.streaming} />
            </div>
          )}

          {t >= 7 && (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-4 py-2 font-mono text-[11px] text-stone-500">
                <span>auth.spec.ts</span>
                {atGate ? (
                  <div className="flex items-center gap-1.5">
                    <MiniPill tone="reject" onClick={rejectDiff}>✕ reject</MiniPill>
                    <MiniPill tone="accept" onClick={acceptDiff}>✓ accept</MiniPill>
                  </div>
                ) : (
                  <span className={diffStatus === 'accepted' ? 'text-emerald-600' : ''}>{diffLabel}</span>
                )}
              </div>
              <CodeDiff key={epoch} lines={DIFF} status={diffStatus} style={{ padding: '6px 0' }} />
              {atGate && (
                <div className="border-t border-stone-100 px-4 py-1.5 font-mono text-[10.5px] text-stone-400">
                  ← try it, this diff is real
                </div>
              )}
            </div>
          )}

          {t >= 7 && (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <HoldToAllow
                key={epoch}
                verb="run"
                action="npm test -- auth.spec.ts"
                status={t > GATE_STEP ? 'allowed' : undefined}
                onAllow={resolveGate}
              />
              {atGate && <div className="mt-1.5 font-mono text-[10.5px] text-stone-400">hold to actually run it</div>}
            </div>
          )}

          {t >= 8 && (
            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <ToolCall name="run_tests" status={test2} width={traceW} detail={test2 === 'done' ? '48 passed' : 'auth.spec.ts'} />
            </div>
          )}

          {t >= 10 && (
            <div className="rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              Green — the assertion now waits for the debounce.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Composer({ value, draft, onDraftChange, onSend }) {
  const phone = usePhone();
  const submit = () => {
    if (!draft.trim()) return;
    onSend();
  };
  return (
    <div className="border-t border-stone-200 bg-white">
      <div className="px-4 pb-2 pt-3 sm:px-5">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Ask a follow-up…"
          aria-label="Send a message to restart the demo"
          className="w-full bg-transparent text-[14px] text-stone-700 outline-none placeholder:text-stone-400"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-3 pb-3 sm:px-4">
        <span className="hidden rounded-md border border-stone-200 px-2 py-1 font-mono text-[11px] text-stone-500 sm:inline">
          claude-sonnet-5
        </span>
        <div className="flex items-center gap-3 sm:gap-4">
          <ContextMeter value={value} label length={phone ? 110 : 200} />
          <button
            type="button"
            onClick={submit}
            aria-label="Send"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white transition-transform hover:scale-105 active:scale-95"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function Scene() {
  const { t, epoch, resolveGate, restart } = useScript();
  const scrollRef = useRef(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [draft, setDraft] = useState(DEFAULT_MESSAGE);

  const send = () => {
    setMessage(draft.trim() || DEFAULT_MESSAGE);
    restart();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [t]);

  // the meter creeps up as the turn does work
  const [ctx, setCtx] = useState(0.31);
  useEffect(() => {
    const id = setInterval(() => setCtx((v) => (v >= 0.62 ? 0.31 : v + 0.031)), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div ref={scrollRef} className="no-scrollbar h-[520px] overflow-y-auto overflow-x-hidden px-4 py-5 sm:h-[480px] sm:px-6">
        <Conversation key={epoch} t={t} epoch={epoch} resolveGate={resolveGate} message={message} />
      </div>
      <Composer value={ctx} draft={draft} onDraftChange={setDraft} onSend={send} />
    </>
  );
}

export default function InContext() {
  const ref = useRef(null);
  const inView = useInView(ref);

  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <SectionHeading
          eyebrow="In context"
          title={
            <>
              Built to sit <em className="italic">together.</em>
            </>
          }
          body="One turn of a coding assistant, seven components. Type your own message and hit send, or hold the approval gate — it's a real composer, not a video."
        />

        <div
          data-reveal
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_32px_64px_-40px_rgba(124,58,237,0.3)]"
        >
          <div ref={ref} className="overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/60">
            <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
              <span className="ml-2 font-mono text-[11px] text-stone-400">acme · assistant</span>
            </div>
            {inView ? <Scene /> : <div className="h-[520px] sm:h-[480px]" />}
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {USED.map(([slug, name]) => (
            <Link
              key={slug}
              to={`/components/${slug}`}
              className="rounded-full border border-stone-200 bg-white px-3 py-1 font-mono text-[11px] text-stone-500 transition-colors hover:border-stone-300 hover:text-ink"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
