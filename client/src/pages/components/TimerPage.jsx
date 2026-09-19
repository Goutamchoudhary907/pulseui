import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import Timer from '../../components/Timer';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('timer');

const props = [
  { name: 'progress', type: 'number (0..1) | undefined', desc: 'Fraction done. Ticks light up to it on a spring; a stall makes the head breathe slow. Leave undefined for elapsed mode — a sweeping head and a counting clock.' },
  { name: 'running', type: 'boolean', def: 'true', desc: 'false coasts the sweep to a stop and freezes the clock — the "Thought for 12s" state. Resume and it picks up where it left off.' },
  { name: 'size', type: 'number', def: '20', desc: 'Ring diameter in px. Tick count scales with it; 16–64 all read.' },
  { name: 'color', type: 'hex', def: "'#7c3aed'", desc: 'Tick colour.' },
  { name: 'label', type: 'true | string', desc: '`true` shows elapsed time as m:ss beside the ring; a string shows that instead.' },
  { name: 'startedAt', type: 'number', def: 'mount time', desc: 'Date.now() to count from — pass the timestamp of the request so the clock survives remounts.' },
  { name: 'onComplete', type: '() => void', desc: 'Fires once when progress reaches 1.' },
];

export default function TimerPage() {
  const [determinate, setDeterminate] = useState(false);
  const [running, setRunning] = useState(true);
  const [progress, setProgress] = useState(0);
  const [sim, setSim] = useState(false);
  const [epoch, setEpoch] = useState(0); // bumps to remount the elapsed timers
  const holdRef = useRef(0);
  const simulating = sim && progress < 1;

  // simulate a job: creeps up, stalls a while around 55%, finishes
  useEffect(() => {
    if (!simulating) return;
    holdRef.current = 0;
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) return p;
        if (p >= 0.55 && p < 0.57 && holdRef.current < 26) {
          holdRef.current++;
          return p;
        }
        return Math.min(1, p + 0.014);
      });
    }, 100);
    return () => clearInterval(id);
  }, [simulating]);

  const reset = () => {
    setSim(false);
    setProgress(0);
    setRunning(true);
    setEpoch((e) => e + 1);
  };
  const switchMode = (d) => {
    setDeterminate(d);
    reset();
    if (d) setSim(true); // progress mode opens on a running job, not a dead 0%
  };

  const value = determinate ? progress : undefined;
  const pct = Math.round(progress * 100);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[400px]"
      preview={
        <div className="flex w-full flex-col items-center gap-8 px-4 pb-6 pt-6 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-2 md:flex-row md:justify-center md:gap-16">
          <Timer key={`big-${epoch}`} progress={value} running={running} size={56} label />

          <div className="w-full max-w-sm divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {determinate ? (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Timer progress={value} running={running} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-ink">Running tests</div>
                  <div className="truncate text-[12.5px] text-stone-500">
                    {pct >= 100 ? 'All 212 passed' : `${Math.round(pct * 2.12)} / 212 · ${pct}%`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
                  P
                </span>
                <span className="text-[14px] text-stone-500">{running ? 'Thinking…' : 'Thought for'}</span>
                <Timer key={`inline-${epoch}`} running={running} label />
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-3.5 text-[13px] text-stone-500">
              <Timer size={16} color="#a8a29e" running={running} progress={value} />
              <span className="truncate">16px, muted — fits a status bar</span>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton active={!determinate} onClick={() => switchMode(false)}>Elapsed</PillButton>
          <PillButton active={determinate} onClick={() => switchMode(true)}>Progress</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          {determinate ? (
            <>
              <PillButton
                active={simulating}
                onClick={() => {
                  if (simulating) return setSim(false);
                  if (progress >= 1) setProgress(0);
                  setSim(true);
                }}
              >
                {simulating ? 'simulating…' : '▶ simulate'}
              </PillButton>
            </>
          ) : (
            <PillButton active={!running} onClick={() => setRunning((v) => !v)}>
              {running ? 'stop' : 'resume'}
            </PillButton>
          )}
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import Timer from './components/Timer';

// while the model thinks — sweeps and counts; stops on "Thought for 0:12"
<Timer running label />

// a job with known progress
<Timer progress={0.62} onComplete={() => console.log('done')} />

// wire to real state:
// <Timer running={isThinking} label />
// <Timer progress={done / total} onComplete={notify} />`}
      props={props}
    />
  );
}
