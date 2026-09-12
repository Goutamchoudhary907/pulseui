import { useState } from 'react';
import { getComponent } from '../../registry';
import SwarmStatus from '../../components/SwarmStatus';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('swarm-status');

const NAMES = ['search', 'read files', 'run tests', 'write summary', 'lint'];
const initial = () => NAMES.map((label, i) => ({ id: `a${i}`, label, status: 'running' }));

const props = [
  { name: 'agents', type: "{ id, status: 'running'|'done'|'error' }[]", desc: 'One flock per agent. Add or remove entries at any time.' },
  { name: 'width / height', type: 'number', def: '320 / 200', desc: 'Canvas size in px.' },
  { name: 'boidsPerAgent', type: 'number', def: '7', desc: 'Flock size per agent.' },
  { name: 'palette', type: 'string[]', def: '6 hues', desc: 'One colour per agent, cycles if there are more agents.' },
  { name: 'errorColor', type: 'string', def: "'#ef4444'", desc: "Colour for agents in 'error' — their flock scatters." },
];

export default function SwarmStatusPage() {
  const [agents, setAgents] = useState(initial);

  const finishNext = () =>
    setAgents((list) => {
      const i = list.findIndex((a) => a.status === 'running');
      if (i < 0) return list;
      return list.map((a, j) => (j === i ? { ...a, status: 'done' } : a));
    });
  const failOne = () =>
    setAgents((list) => {
      const i = list.findIndex((a) => a.status === 'running');
      if (i < 0) return list;
      return list.map((a, j) => (j === i ? { ...a, status: 'error' } : a));
    });

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[420px]"
      preview={
        <div className="flex flex-col items-center gap-4 pb-12 pt-4">
          <SwarmStatus agents={agents} width={520} height={260} />
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-mono text-[11px] text-stone-500">
            {agents.map((a, i) => (
              <li key={a.id} className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background:
                      a.status === 'error'
                        ? '#ef4444'
                        : ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#6366f1'][i % 6],
                    opacity: a.status === 'done' ? 1 : 0.6,
                  }}
                />
                {a.label}
                <span className="text-stone-400">· {a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      }
      controls={
        <>
          <PillButton onClick={finishNext}>finish next</PillButton>
          <PillButton onClick={failOne}>fail one</PillButton>
          <PillButton onClick={() => setAgents(initial())}>reset</PillButton>
        </>
      }
      usage={`import SwarmStatus from './components/SwarmStatus';

<SwarmStatus
  agents={tasks.map((t) => ({ id: t.id, status: t.status }))}
/>`}
      props={props}
    />
  );
}
