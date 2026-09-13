import { useState } from 'react';
import { getComponent } from '../../registry';
import ThinkingIndicator from '../../components/ThinkingIndicator';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('thinking-indicator');

const props = [
  { name: 'settled', type: 'boolean', def: 'false', desc: 'false = drifting / thinking, true = converge and tighten.' },
  { name: 'size', type: 'number', def: '160', desc: 'Canvas width and height in px (square).' },
  { name: 'particleCount', type: 'number', def: '60', desc: 'How many particles make up the field.' },
  { name: 'color', type: 'hex', def: "'#7c3aed'", desc: 'Particle colour.' },
  { name: 'onSettled', type: '() => void', desc: 'Fires once, on the beat the field converges into a point — start rendering the answer here.' },
];

export default function ThinkingIndicatorPage() {
  const [settled, setSettled] = useState(false);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · canvas"
      preview={<ThinkingIndicator settled={settled} size={220} color="#7c3aed" />}
      controls={
        <>
          <PillButton active={!settled} onClick={() => setSettled(false)}>Thinking</PillButton>
          <PillButton active={settled} onClick={() => setSettled(true)}>Settled</PillButton>
        </>
      }
      usage={`import ThinkingIndicator from './components/ThinkingIndicator';

<ThinkingIndicator
  settled={!isStreaming}
  onSettled={() => setShowAnswer(true)}
/>`}
      props={props}
    />
  );
}
