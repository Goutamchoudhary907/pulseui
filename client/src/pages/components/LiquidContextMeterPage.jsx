import { useState } from 'react';
import { getComponent } from '../../registry';
import LiquidContextMeter from '../../components/LiquidContextMeter';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('liquid-context-meter');
const LIMIT = 200_000;

const props = [
  { name: 'value', type: 'number (0..1)', def: '0', desc: 'Fraction of the context window used. Any change sloshes; the size of the jump sets how hard.' },
  { name: 'width / height', type: 'number', def: '120 / 200', desc: 'Canvas size in px.' },
  { name: 'color', type: 'string', def: "'#7c3aed'", desc: 'Liquid colour (hex).' },
  { name: 'warnColor', type: 'string', def: "'#f59e0b'", desc: 'Colour the liquid blends toward past warnAt (hex).' },
  { name: 'warnAt', type: 'number (0..1)', def: '0.8', desc: 'Where the warning blend begins.' },
];

export default function LiquidContextMeterPage() {
  const [used, setUsed] = useState(58_000);
  const value = Math.min(1, used / LIMIT);
  const add = (n) => setUsed((u) => Math.min(LIMIT, u + n));

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      previewClassName="min-h-[400px]"
      preview={
        <div className="flex items-center gap-10">
          <LiquidContextMeter value={value} width={130} height={220} />
          <div className="font-mono text-[12px] leading-6 text-stone-500">
            <div className="text-[28px] leading-none tracking-tight text-ink">
              {Math.round(value * 100)}%
            </div>
            <div className="mt-2">
              {used.toLocaleString('en-US')} / {LIMIT.toLocaleString('en-US')} tokens
            </div>
            <div className="text-stone-400">click below to add context</div>
          </div>
        </div>
      }
      controls={
        <>
          <PillButton onClick={() => add(4_000)}>+ message</PillButton>
          <PillButton onClick={() => add(38_000)}>+ big document</PillButton>
          <PillButton onClick={() => setUsed(12_000)}>reset</PillButton>
        </>
      }
      usage={`import LiquidContextMeter from './components/LiquidContextMeter';

<LiquidContextMeter value={tokensUsed / contextLimit} />`}
      props={props}
    />
  );
}
