import { useState } from 'react';
import { getComponent } from '../../registry';
import ConfidenceText from '../../components/ConfidenceText';
import DocPage, { PillButton } from '../../lib/DocPage';

const entry = getComponent('confidence-text');

// A realistic answer with per-token confidence, the way a logprob-aware
// renderer would see it: facts the model is sure of stay sharp, guesses haze.
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
  { name: 'threshold', type: 'number', def: '0.6', desc: 'Tokens below this are out of focus. The further below, the softer and hazier.' },
  { name: 'resolved', type: 'boolean', def: 'false', desc: 'Racks every token into focus in a left-to-right wave — flip it when the model has verified its answer.' },
  { name: 'showScores', type: 'boolean', def: 'true', desc: 'Show the score above a token on hover / focus. Also makes hazy tokens keyboard-focusable.' },
  { name: 'className / style', type: 'any', desc: 'Passed to the wrapping span.' },
];

export default function ConfidenceTextPage() {
  const [threshold, setThreshold] = useState(0.6);
  const [resolved, setResolved] = useState(false);

  return (
    <DocPage
      entry={entry}
      meta="0 dependencies · css + svg filter"
      previewClassName="min-h-[360px]"
      preview={
        <div className="flex w-full max-w-xl flex-col gap-3 px-6 pb-12 pt-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[15px] text-white">
              P
            </span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-5 py-4 text-[17px] leading-[1.7] text-stone-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <ConfidenceText tokens={TOKENS} threshold={threshold} resolved={resolved} />
            </div>
          </div>
          <p className="pl-10 text-[12.5px] text-stone-400">
            {resolved
              ? 'verified — everything is in focus'
              : 'hover a hazy word to pull it into focus and see its score'}
          </p>
        </div>
      }
      controls={
        <>
          <PillButton active={resolved} onClick={() => setResolved((v) => !v)}>
            {resolved ? '✓ verified' : '▶ verify'}
          </PillButton>
          <span className="mx-1 h-5 w-px bg-stone-200" />
          <span className="pl-1 pr-1 font-mono text-[11px] text-stone-400">threshold</span>
          {[0.3, 0.6, 0.9].map((t) => (
            <PillButton key={t} active={threshold === t} onClick={() => { setThreshold(t); setResolved(false); }}>
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
  resolved={answer.verified}
/>`}
      props={props}
    />
  );
}
