import { useEffect, useState } from 'react';
import { getComponent } from '../../registry';
import HoldToAllow from '../../components/HoldToAllow';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('hold-to-allow');

const props = [
  { name: 'action', type: 'node', desc: 'What the agent wants to do — a command, a file path, a payment. Strings render as code.' },
  { name: 'verb', type: 'string', def: "'run'", desc: 'The leading word: run, write, delete, send, pay…' },
  { name: 'risk', type: "'low' | 'high'", def: "'low'", desc: 'A high-risk fuse is longer (1.6s vs 0.9s), so a dangerous action needs a deliberate hold.' },
  { name: 'holdMs', type: 'number', desc: 'Override the fuse length in ms.' },
  { name: 'onAllow / onDeny', type: '() => void', desc: 'The outcome. Allow fires only when the fuse burns to the end.' },
  { name: 'status', type: "'pending' | 'allowed' | 'denied'", desc: 'Controlled outcome, e.g. when the decision comes from elsewhere. Omit and the gate manages it.' },
  { name: 'holding', type: 'boolean', desc: 'Controlled hold — drive the fuse from a voice "yes" or a hardware button. Omit for pointer + keyboard (hold Space / Enter).' },
  { name: 'allowLabel / denyLabel', type: 'string', def: "'Hold to allow' / 'Deny'", desc: 'Button text.' },
  { name: 'color', type: 'hex', def: "'#059669'", desc: 'The "allowed" colour.' },
];

const ASKS = [
  { verb: 'run', action: 'npm test -- --watch=false', risk: 'low', why: 'to check the fix' },
  { verb: 'delete', action: 'rm -rf node_modules dist', risk: 'high', why: 'the lockfile changed, clean install' },
];

export default function HoldToAllowPage() {
  const [epoch, setEpoch] = useState(0);
  const [log, setLog] = useState([]);
  const [demo, setDemo] = useState(null); // auto-play: controlled hold on the first gate

  // auto-play once: hold the first fuse, let go halfway, then hold it through
  useEffect(() => {
    const ids = [
      setTimeout(() => setDemo({ i: 0, holding: true }), 1200),
      setTimeout(() => setDemo({ i: 0, holding: false }), 1700),
      setTimeout(() => setDemo({ i: 0, holding: true }), 2600),
      setTimeout(() => setDemo(null), 4200),
    ];
    return () => ids.forEach(clearTimeout);
  }, [epoch]);

  const decide = (i, what) => setLog((l) => [...l, `${what} · ${ASKS[i].verb} ${ASKS[i].action}`]);
  const reset = () => {
    setLog([]);
    setDemo(null);
    setEpoch((e) => e + 1);
  };

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas + css"
      previewClassName="min-h-[420px]"
      preview={
        <div className="flex w-full max-w-xl items-start gap-3 px-4 py-6 sm:px-6">
          <span className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white sm:flex">
            P
          </span>
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="px-4 pt-3 text-[14.5px] leading-relaxed text-stone-800">
              I found the bug in the debounce. Before I go on, I need to run two things:
            </div>
            <div className="mt-3 divide-y divide-stone-100 border-t border-stone-100">
              {ASKS.map((a, i) => (
                <div key={`${epoch}-${i}`} className="px-4 py-3">
                  <HoldToAllow
                    verb={a.verb}
                    action={a.action}
                    risk={a.risk}
                    holding={demo && demo.i === i ? demo.holding : undefined}
                    onAllow={() => decide(i, 'allowed')}
                    onDeny={() => decide(i, 'denied')}
                  />
                  <div className="mt-1.5 pl-0.5 font-mono text-[11px] text-stone-400">
                    {a.why} · {a.risk} risk
                  </div>
                </div>
              ))}
            </div>
            {log.length > 0 && (
              <div className="border-t border-stone-100 px-4 py-2.5 font-mono text-[11px] text-stone-500">
                {log.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
      controls={
        <>
          <span className="px-3 font-mono text-[11px] text-stone-400">hold Allow · tap Deny</span>
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import HoldToAllow from './components/HoldToAllow';

<HoldToAllow
  verb="delete"
  action="rm -rf node_modules dist"
  risk="high"
  onAllow={() => console.log('allowed')}
  onDeny={() => console.log('denied')}
/>

// wire it to a real pending tool call:
// onAllow={() => runTool(call)}
// onDeny={() => reply('Skipped.')}`}
      props={props}
    />
  );
}
