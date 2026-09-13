import { useState } from 'react';
import { getComponent } from '../../registry';
import ContextMeter from '../../components/ContextMeter';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('context-meter');
const LIMIT = 200_000;

const props = [
  { name: 'value', type: 'number (0..1)', def: '0', desc: 'Fraction of the context window used. Any change sloshes; the size of the jump sets how hard.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", def: "'horizontal'", desc: 'Bar direction. Vertical rotates the whole glass so "along" points up.' },
  { name: 'length / thickness', type: 'number', def: '240 / 14 · 150 / 36', desc: 'Size in px along and across the bar. Defaults differ per orientation.' },
  { name: 'color', type: 'hex', def: "'#7c3aed'", desc: 'Liquid colour.' },
  { name: 'warnColor / hotColor', type: 'hex', def: "'#f59e0b' / '#ef4444'", desc: 'Blended in past warnAt and boilAt.' },
  { name: 'warnAt / boilAt', type: 'number (0..1)', def: '0.8 / 0.95', desc: 'Where it warms, and where it starts to boil. warnAt is etched into the glass as a notch.' },
  { name: 'label', type: 'true | string', desc: '`true` shows the percentage beside the bar; a string shows that instead.' },
];

function Composer({ value, used }) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-30px_rgba(0,0,0,0.25)]">
      <div className="px-5 pt-4 pb-3 text-[15px] leading-relaxed text-stone-400">
        Ask a follow-up…
      </div>
      <div className="flex items-center justify-between gap-6 border-t border-stone-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3 whitespace-nowrap font-mono text-[11px] text-stone-500">
          <span className="shrink-0 rounded-md border border-stone-200 px-2 py-1">claude-sonnet-5</span>
          <span className="hidden truncate md:inline">
            {used.toLocaleString('en-US')} / {LIMIT.toLocaleString('en-US')}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <ContextMeter value={value} label />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">↑</span>
        </div>
      </div>
    </div>
  );
}

export default function ContextMeterPage() {
  const [used, setUsed] = useState(58_000);
  const [orientation, setOrientation] = useState('horizontal');
  const value = Math.min(1, used / LIMIT);
  const add = (n) => setUsed((u) => Math.min(LIMIT, u + n));

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[420px]"
      preview={
        <div className="flex w-full items-center justify-center px-6 pb-10">
          {orientation === 'horizontal' ? (
            <Composer value={value} used={used} />
          ) : (
            <div className="flex items-center gap-10">
              <ContextMeter value={value} orientation="vertical" length={200} thickness={44} />
              <div className="font-mono text-[12px] leading-6 text-stone-500">
                <div className="text-[28px] leading-none tracking-tight text-ink">
                  {Math.round(value * 100)}%
                </div>
                <div className="mt-2">
                  {used.toLocaleString('en-US')} / {LIMIT.toLocaleString('en-US')} tokens
                </div>
              </div>
            </div>
          )}
        </div>
      }
      controls={
        <>
          <PillButton active={orientation === 'horizontal'} onClick={() => setOrientation('horizontal')}>
            Horizontal
          </PillButton>
          <PillButton active={orientation === 'vertical'} onClick={() => setOrientation('vertical')}>
            Vertical
          </PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <PillButton onClick={() => add(4_000)}>+ message</PillButton>
          <PillButton onClick={() => add(38_000)}>+ big document</PillButton>
          <PillButton onClick={() => setUsed(LIMIT * 0.97)}>to the limit</PillButton>
          <PillButton onClick={() => setUsed(12_000)}>reset</PillButton>
        </>
      }
      usage={`import ContextMeter from './components/ContextMeter';

// in a composer footer
<ContextMeter value={tokensUsed / contextLimit} label />

// standalone tube
<ContextMeter value={0.62} orientation="vertical" />`}
      props={props}
    />
  );
}
