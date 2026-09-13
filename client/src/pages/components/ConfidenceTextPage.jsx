import { useState } from 'react';
import { getComponent } from '../../registry';
import ConfidenceText from '../../components/ConfidenceText';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('confidence-text');

// A realistic answer with per-token confidence, the way a logprob-aware
// renderer would see it: facts the model is sure of stay solid, guesses shimmer.
const TOKENS = [
  'The', 'outage', 'started', 'at',
  { text: '14:02', confidence: 0.91 },
  'when', 'the', 'primary', 'database',
  { text: 'failed', confidence: 0.84 },
  'over.', 'The', 'root', 'cause', 'was',
  { text: 'probably', confidence: 0.18 },
  { text: 'a', confidence: 0.4 },
  { text: 'stale', confidence: 0.33 },
  { text: 'connection', confidence: 0.46 },
  { text: 'pool,', confidence: 0.52 },
  'though', 'the', 'logs', 'from', 'the',
  { text: 'replica', confidence: 0.58 },
  'are', 'still', 'being',
  { text: 'recovered.', confidence: 0.27 },
];

const props = [
  { name: 'tokens', type: '({ text, confidence } | string)[]', desc: 'Tokens to render, joined with a space. A plain string counts as confidence 1.' },
  { name: 'threshold', type: 'number', def: '0.6', desc: 'Tokens with confidence below this shimmer. The further below, the harder the flicker.' },
  { name: 'showScores', type: 'boolean', def: 'true', desc: 'Adds a tooltip with the exact score on hover.' },
  { name: 'className / style', type: 'any', desc: 'Passed to the wrapping span.' },
];

export default function ConfidenceTextPage() {
  const [threshold, setThreshold] = useState(0.6);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css"
      previewClassName="min-h-[320px]"
      preview={
        <div className="max-w-xl px-8 text-center text-[19px] leading-[1.75] text-stone-800">
          <ConfidenceText tokens={TOKENS} threshold={threshold} />
          <div className="mt-6 font-mono text-[11px] text-stone-400">
            hover a shimmering token to see its score
          </div>
        </div>
      }
      controls={
        <>
          <span className="pl-3 pr-1 font-mono text-[11px] text-stone-400">threshold</span>
          {[0.3, 0.6, 0.9].map((t) => (
            <PillButton key={t} active={threshold === t} onClick={() => setThreshold(t)}>
              {t}
            </PillButton>
          ))}
        </>
      }
      usage={`import ConfidenceText from './components/ConfidenceText';

// tokens straight from a logprob-aware stream
<ConfidenceText
  tokens={[
    'The', 'cause', 'was',
    { text: 'probably', confidence: 0.18 },
    { text: 'the', confidence: 0.4 },
    { text: 'cache.', confidence: 0.3 },
  ]}
  threshold={0.6}
/>`}
      props={props}
    />
  );
}
