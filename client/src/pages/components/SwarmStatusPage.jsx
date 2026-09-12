import { useEffect, useState } from 'react';
import { getComponent } from '../../registry';
import SwarmStatus from '../../components/SwarmStatus';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('swarm-status');

const NAMES = ['search docs', 'read files', 'run tests', 'write summary', 'lint'];
const initial = () => NAMES.map((label, i) => ({ id: `a${i}`, label, status: 'running' }));

const props = [
  { name: 'agents', type: "{ id, label?, status: 'running'|'done'|'error' }[]", desc: 'One flock per agent. Labels ride beside running flocks. Add or remove entries at any time.' },
  { name: 'width / height', type: 'number', def: '360 / 240', desc: 'Canvas size in px.' },
  { name: 'boidsPerAgent', type: 'number', def: '8', desc: 'Flock size per agent.' },
  { name: 'palette', type: 'string[]', def: '6 hues', desc: 'One colour per agent, cycles if there are more agents.' },
  { name: 'errorColor', type: 'string', def: "'#ef4444'", desc: "Colour for agents in 'error' — their flock turns red and drifts out of orbit." },
  { name: 'showLabels', type: 'boolean', def: 'true', desc: 'Draw agent labels beside their flocks.' },
];

export default function SwarmStatusPage() {
  const [agents, setAgents] = useState(initial);
  const [auto, setAuto] = useState(false);

  const setNext = (status) =>
    setAgents((list) => {
      const i = list.findIndex((a) => a.status === 'running');
      return i < 0 ? list : list.map((a, j) => (j === i ? { ...a, status } : a));
    });

  // auto-run: finish one agent per second while any are still running
  const anyRunning = agents.some((a) => a.status === 'running');
  const running = auto && anyRunning;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setNext('done'), 1000);
    return () => clearTimeout(id);
  }, [running, agents]);

  const reset = () => { setAuto(false); setAgents(initial()); };

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[460px]"
      preview={
        <div className="pb-8 pt-2">
          <SwarmStatus agents={agents} width={560} height={340} />
        </div>
      }
      controls={
        <>
          <PillButton active={running} onClick={() => setAuto((v) => !v)}>
            {running ? 'running…' : '▶ run all'}
          </PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={() => setNext('done')}>finish next</PillButton>
          <PillButton onClick={() => setNext('error')}>fail one</PillButton>
          <PillButton onClick={reset}>reset</PillButton>
        </>
      }
      usage={`import SwarmStatus from './components/SwarmStatus';

<SwarmStatus
  agents={tasks.map((t) => ({ id: t.id, label: t.name, status: t.status }))}
/>`}
      props={props}
    />
  );
}
