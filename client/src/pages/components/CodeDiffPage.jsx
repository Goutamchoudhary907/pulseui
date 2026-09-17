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
  { name: 'status', type: "'pending' | 'accepted' | 'rejected'", def: "'pending'", desc: 'accepted runs the green sweep and settles into the new code; rejected runs the red sweep and restores the original. Back to pending resets.' },
  { name: 'lineMs', type: 'number', def: '110', desc: 'Beam time per line in ms — sets the overall sweep speed.' },
  { name: 'className / style', type: 'any', desc: 'Passed to the wrapper. Theme with --pui-diff-bg / --pui-diff-fg.' },
];

const HEADER = {
  pending: ['pending review', 'text-stone-500'],
  accepted: ['✓ accepted', 'text-emerald-600'],
  rejected: ['✕ rejected', 'text-red-600'],
};

export default function CodeDiffPage() {
  const [status, setStatus] = useState('pending');
  const [key, setKey] = useState(0);
  const decide = (s) => {
    setStatus('pending');
    setKey((k) => k + 1);
    requestAnimationFrame(() => setStatus(s));
  };

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[400px]"
      preview={
        <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/70 px-4 py-2 font-mono text-[11px] text-stone-500">
            <span>src/api/users.js</span>
            <span className={HEADER[status][1]}>{HEADER[status][0]}</span>
          </div>
          <CodeDiff key={key} lines={LINES} status={status} style={{ padding: '8px 0' }} />
        </div>
      }
      controls={
        <>
          <PillButton active={status === 'rejected'} onClick={() => decide('rejected')}>✕ reject</PillButton>
          <PillButton active={status === 'accepted'} onClick={() => decide('accepted')}>✓ accept</PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton active={status === 'pending'} onClick={() => setStatus('pending')}>reset</PillButton>
        </>
      }
      usage={`import CodeDiff from './components/CodeDiff';

<CodeDiff
  status={change.status}   // 'pending' | 'accepted' | 'rejected'
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
