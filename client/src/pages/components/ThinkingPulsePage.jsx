import { useState } from 'react';
import { getComponent } from '../../registry';
import ThinkingPulse from '../../components/ThinkingPulse';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('thinking-pulse');

const props = [
  { name: 'settled', type: 'boolean', def: 'false', desc: 'false = drifting / thinking, true = converge and tighten.' },
  { name: 'size', type: 'number', def: '160', desc: 'Canvas width and height in px (square).' },
  { name: 'particleCount', type: 'number', def: '60', desc: 'How many particles make up the field.' },
  { name: 'color', type: 'string', def: "'#c084fc'", desc: 'Particle colour. Any CSS colour.' },
];

export default function ThinkingPulsePage() {
  const [settled, setSettled] = useState(false);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      preview={<ThinkingPulse settled={settled} size={220} color="#7c3aed" />}
      controls={
        <>
          <PillButton active={!settled} onClick={() => setSettled(false)}>Thinking</PillButton>
          <PillButton active={settled} onClick={() => setSettled(true)}>Settled</PillButton>
        </>
      }
      usage={`import ThinkingPulse from './components/ThinkingPulse';

<ThinkingPulse settled={!isStreaming} />`}
      props={props}
    />
  );
}
