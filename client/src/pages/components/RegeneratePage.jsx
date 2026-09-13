import { useState } from 'react';
import { getComponent } from '../../registry';
import Regenerate from '../../components/Regenerate';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('regenerate');

const ANSWERS = [
  'The flake is a timing issue: the test asserts before the debounce fires. Wrap the assertion in waitFor, or advance fake timers by 300ms before asserting.',
  'It\'s not the debounce — the mock server returns in a different order on CI. Sort the results before comparing, or assert on membership instead of order.',
  'Both are plausible, but the stack trace points at the debounce. Start there: advance timers by 300ms, and if it still flakes, look at result ordering next.',
];

const props = [
  { name: 'text', type: 'string', desc: 'The current answer. Change it to trigger a rewind followed by a type-in.' },
  { name: 'typeMs', type: 'number', def: '14', desc: 'ms per character while typing. Pauses longer after punctuation.' },
  { name: 'rewindMs', type: 'number', def: '16', desc: 'ms per rewind frame. Each frame removes an accelerating chunk.' },
  { name: 'cursor', type: 'boolean', def: 'true', desc: 'Show a block cursor while typing.' },
  { name: 'onPhase', type: '(phase) => void', desc: "Called with 'rewinding' | 'typing' | 'idle'." },
];

export default function RegeneratePage() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('idle');

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[360px]"
      preview={
        <div className="w-full max-w-xl px-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-stone-400">
              <span>assistant · attempt {i + 1}</span>
              <span>{phase}</span>
            </div>
            <div className="text-[16px] leading-[1.7] text-stone-800">
              <Regenerate text={ANSWERS[i]} onPhase={setPhase} />
            </div>
          </div>
        </div>
      }
      controls={
        <PillButton
          active={phase === 'idle'}
          onClick={() => phase === 'idle' && setI((n) => (n + 1) % ANSWERS.length)}
        >
          {phase === 'idle' ? '↻ Regenerate' : phase === 'rewinding' ? 'rewinding…' : 'writing…'}
        </PillButton>
      }
      usage={`import Regenerate from './components/Regenerate';

// change \`text\` and the old answer rewinds before the new one types in
<Regenerate text={answer} onPhase={setPhase} />`}
      props={props}
    />
  );
}
