import { useState } from 'react';
import { getComponent } from '../../registry';
import CodeDiff from '../../components/CodeDiff';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('code-diff');

const LINES = [
  { type: 'context', content: 'async function fetchUser(id) {' },
  { type: 'remove', content: '  const res = await fetch(`/api/users/${id}`);' },
  { type: 'remove', content: '  return res.json();' },
  { type: 'add', content: '  const res = await fetch(`/api/users/${id}`, {' },
  { type: 'add', content: '    signal: AbortSignal.timeout(5000),' },
  { type: 'add', content: '  });' },
  { type: 'add', content: '  if (!res.ok) throw new Error(`user ${id}: ${res.status}`);' },
  { type: 'add', content: '  return res.json();' },
  { type: 'context', content: '}' },
];

const props = [
  { name: 'lines', type: "{ type: 'add'|'remove'|'context', content }[]", desc: 'The diff, one entry per line.' },
  { name: 'accepted', type: 'boolean', def: 'false', desc: 'Flip to true to run the sweep. Flip back to reset.' },
  { name: 'lineMs', type: 'number', def: '110', desc: 'Beam time per line in ms — sets the overall sweep speed.' },
  { name: 'className / style', type: 'any', desc: 'Passed to the wrapper.' },
];

export default function CodeDiffPage() {
  const [accepted, setAccepted] = useState(false);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[400px]"
      preview={
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/70 px-4 py-2 font-mono text-[11px] text-stone-500">
            <span>src/api/users.js</span>
            <span className={accepted ? 'text-emerald-600' : ''}>
              {accepted ? '✓ accepted' : 'pending review'}
            </span>
          </div>
          <CodeDiff lines={LINES} accepted={accepted} style={{ padding: '8px 0' }} />
        </div>
      }
      controls={
        <>
          <PillButton active={!accepted} onClick={() => setAccepted(false)}>Pending</PillButton>
          <PillButton active={accepted} onClick={() => setAccepted(true)}>Accept</PillButton>
        </>
      }
      usage={`import CodeDiff from './components/CodeDiff';

<CodeDiff
  accepted={change.status === 'accepted'}
  lines={[
    { type: 'context', content: 'const retries =' },
    { type: 'remove',  content: '  1;' },
    { type: 'add',     content: '  3;' },
  ]}
/>`}
      props={props}
    />
  );
}
