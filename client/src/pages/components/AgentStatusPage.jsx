import { useEffect, useRef, useState } from 'react';
import { getComponent } from '../../registry';
import AgentStatus from '../../components/AgentStatus';
import DocPage, { PillButton } from '../../lib/DocPage';
import { useElementWidth, usePhone } from '../../lib/useViewport';

const entry = getComponent('agent-status');

const NAMES = ['search docs', 'read files', 'run tests', 'write summary', 'lint'];
const RATES = [0.011, 0.016, 0.007, 0.013, 0.02];

const props = [
  { name: 'agents', type: "{ id, label?, status: 'running'|'done'|'error', progress? }[]", desc: 'One flock per agent. A new running agent is dispatched from the hub; done sends it home; error breaks it up. progress (0..1) fills the ring around its flock.' },
  { name: 'width / height', type: 'number', def: '360 / 240', desc: 'Canvas size in px.' },
  { name: 'boidsPerAgent', type: 'number', def: '8', desc: 'Flock size per agent.' },
  { name: 'palette', type: 'string[]', def: '6 hues', desc: 'One colour per agent, cycles if there are more agents.' },
  { name: 'errorColor', type: 'string', def: "'#ef4444'", desc: "Colour for agents in 'error'." },
  { name: 'showLabels', type: 'boolean', def: 'true', desc: 'Draw agent labels (and progress) beside their flocks.' },
];

export default function AgentStatusPage() {
  const [agents, setAgents] = useState([]);
  const [run, setRun] = useState(0);

  const phone = usePhone();
  const wellRef = useRef(null);
  const wellWidth = useElementWidth(wellRef);
  const canvasW = phone ? Math.max(200, Math.floor(wellWidth) - 16) : 560;
  const canvasH = phone ? 300 : 340;

  // dispatch: add the next agent
  const dispatch = () =>
    setAgents((list) => {
      const i = list.length;
      if (i >= NAMES.length) return list;
      return [...list, { id: `a${i}`, label: NAMES[i], status: 'running', progress: 0 }];
    });

  // auto-run: dispatch one every 350ms, then let progress carry them home
  useEffect(() => {
    if (!run) return;
    const ids = [];
    for (let i = 0; i < NAMES.length; i++) ids.push(setTimeout(dispatch, 200 + i * 350));
    return () => ids.forEach(clearTimeout);
  }, [run]);

  const anyRunning = agents.some((a) => a.status === 'running');
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => {
      setAgents((list) =>
        list.map((a, i) => {
          if (a.status !== 'running') return a;
          const p = Math.min(1, (a.progress ?? 0) + RATES[i % RATES.length] * (0.6 + Math.random() * 0.8));
          return p >= 1 ? { ...a, progress: 1, status: 'done' } : { ...a, progress: p };
        }),
      );
    }, 80);
    return () => clearInterval(id);
  }, [anyRunning]);

  const auto = run > 0 && (agents.length < NAMES.length || anyRunning);

  const failOne = () =>
    setAgents((list) => {
      const i = list.findIndex((a) => a.status === 'running');
      return i < 0 ? list : list.map((a, j) => (j === i ? { ...a, status: 'error' } : a));
    });
  const reset = () => { setRun(0); setAgents([]); };

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[380px] sm:min-h-[460px]"
      preview={
        <div ref={wellRef} className="flex w-full justify-center pb-4 pt-4 sm:pb-8 sm:pt-2">
          {(!phone || wellWidth > 0) && (
            <AgentStatus agents={agents} width={canvasW} height={canvasH} />
          )}
        </div>
      }
      controls={
        <>
          <PillButton active={auto} onClick={() => { setAgents([]); setRun((r) => r + 1); }}>
            {auto ? 'running…' : '▶ run all'}
          </PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={dispatch}>dispatch one</PillButton>
          <PillButton onClick={failOne}>fail one</PillButton>
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import AgentStatus from './components/AgentStatus';

<AgentStatus
  agents={tasks.map((t) => ({
    id: t.id,
    label: t.name,
    status: t.status,        // 'running' | 'done' | 'error'
    progress: t.progress,    // 0..1, optional
  }))}
/>`}
      props={props}
    />
  );
}
