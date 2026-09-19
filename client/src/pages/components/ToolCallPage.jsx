import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import ToolCall from '../../components/ToolCall';
import DocPage, { PillButton } from '../../lib/DocPage';
import { usePhone } from '../../lib/useViewport';

const entry = getComponent('tool-call');

const props = [
  { name: 'name', type: 'string', desc: 'The tool being called, e.g. "search_web".' },
  { name: 'status', type: "'idle' | 'calling' | 'running' | 'done' | 'error'", def: "'idle'", desc: 'calling sends the pulse down the trace; running lights the pad; done sends the result back and sets a check; error throws sparks and burns the trace.' },
  { name: 'detail', type: 'string', desc: 'Secondary text — args while it runs, a result snippet when done, the error message on failure. Defaults to a status word.' },
  { name: 'size', type: 'number', def: '28', desc: 'Height in px.' },
  { name: 'width', type: 'number', def: '132', desc: 'Length of the trace in px.' },
  { name: 'color / errorColor', type: 'hex', def: "'#f59e0b' / '#ef4444'", desc: 'Signal colour and failure colour.' },
];

const CALLS = [
  { name: 'search_web', args: '"rust borrow checker lifetimes"', result: '6 results' },
  { name: 'read_file', args: 'src/auth.rs', result: '212 lines' },
  { name: 'run_tests', args: 'suite: auth', result: '48 passed', error: 'exit 1 — 2 failed' },
];

const STEP = { calling: 900, running: 2600, done: 1800, error: 2200 };

export default function ToolCallPage() {
  const phone = usePhone();
  const [run, setRun] = useState(true); // play once on arrival so the page isn't a blank canvas
  const [fail, setFail] = useState(false);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('idle');
  const timer = useRef(null);

  useEffect(() => {
    if (!run) return;
    timer.current = setTimeout(() => {
      if (phase === 'idle') return setPhase('calling');
      if (phase === 'calling') return setPhase('running');
      if (phase === 'running') return setPhase(fail && i === CALLS.length - 1 ? 'error' : 'done');
      if (phase === 'done' && i + 1 < CALLS.length) {
        setI(i + 1);
        setPhase('calling');
        return;
      }
      setRun(false);
    }, STEP[phase] ?? 400);
    return () => clearTimeout(timer.current);
  }, [run, phase, i, fail]);

  const start = (withFail) => {
    clearTimeout(timer.current);
    setFail(withFail);
    setI(0);
    setPhase('idle');
    setRun(true);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setRun(false);
    setI(0);
    setPhase('idle');
  };

  const statusOf = (k) => (k < i ? 'done' : k === i ? phase : 'idle');
  const detailOf = (c, s) =>
    s === 'calling' || s === 'running' ? c.args : s === 'done' ? c.result : s === 'error' ? c.error : undefined;

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[380px]"
      preview={
        <div className="flex w-full max-w-md flex-col gap-3 px-4 pb-6 pt-6 sm:px-6 sm:pb-12 sm:pt-2">
          <div className="flex items-start gap-3">
            {/* avatar hidden on phones: the trace + tool name need the width */}
            <span className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white sm:flex">
              P
            </span>
            <div className="min-w-0 flex-1 divide-y divide-stone-100 rounded-2xl rounded-tl-md border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {CALLS.map((c, k) => {
                const s = statusOf(k);
                return (
                  <div key={c.name} className="px-4 py-3">
                    <ToolCall name={c.name} status={s} detail={detailOf(c, s)} width={phone ? 96 : 132} />
                  </div>
                );
              })}
            </div>
          </div>
          <p className="pl-1 text-[12.5px] text-stone-400 sm:pl-10">
            {run ? `call ${i + 1} of ${CALLS.length}` : 'press ▶ to watch the agent work through three tools'}
          </p>
        </div>
      }
      controls={
        <>
          <PillButton active={run && !fail} onClick={() => start(false)}>▶ run</PillButton>
          <PillButton active={run && fail} onClick={() => start(true)}>▶ run, last one fails</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import ToolCall from './components/ToolCall';

<ToolCall name="search_web" status="running" detail="3 results so far" />

// wire it to a real tool call stream:
// {message.toolCalls.map((call) => (
//   <ToolCall
//     key={call.id}
//     name={call.name}
//     status={call.status}   // 'calling' | 'running' | 'done' | 'error'
//     detail={call.summary}
//   />
// ))}`}
      props={props}
    />
  );
}
