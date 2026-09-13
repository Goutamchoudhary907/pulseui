import thinkingIndicatorSource from './components/ThinkingIndicator.jsx?raw';
import confidenceTextSource from './components/ConfidenceText.jsx?raw';
import contextMeterSource from './components/ContextMeter.jsx?raw';
import codeDiffSource from './components/CodeDiff.jsx?raw';
import agentStatusSource from './components/AgentStatus.jsx?raw';
import regenerateSource from './components/Regenerate.jsx?raw';
import timerSource from './components/Timer.jsx?raw';
import streamingTextSource from './components/StreamingText.jsx?raw';
import {
  ThinkingIndicatorPreview,
  ConfidenceTextPreview,
  ContextMeterPreview,
  CodeDiffPreview,
  AgentStatusPreview,
  RegeneratePreview,
  TimerPreview,
  StreamingTextPreview,
} from './lib/previews';

// Central registry of every component in the library. Drives the homepage
// showcase, the /components index, and each docs page (source text).
//
// slug     URL segment: /components/<slug>
// file     file name in src/components/ (without .jsx)
// status   'available' | 'coming-soon'
// preview  small self-running component for the cards
// source   raw file text shown in the Source block
export const registry = [
  {
    slug: 'thinking-indicator',
    file: 'ThinkingIndicator',
    name: 'Thinking Indicator',
    description:
      'A loose particle field that visibly drifts, then converges and tightens as the model settles on an answer. Replaces the generic AI "thinking" spinner.',
    status: 'available',
    preview: ThinkingIndicatorPreview,
    source: thinkingIndicatorSource,
  },
  {
    slug: 'confidence-text',
    file: 'ConfidenceText',
    name: 'Confidence Text',
    description:
      'Low-confidence tokens get a faint chromatic flicker instead of a hedge badge or footnote — the uncertainty is felt before it\'s read.',
    status: 'available',
    preview: ConfidenceTextPreview,
    source: confidenceTextSource,
  },
  {
    slug: 'context-meter',
    file: 'ContextMeter',
    name: 'Context Meter',
    description:
      'A progress bar where the fill is liquid in glass — it surges and sloshes when a big chunk lands, warms near the limit, and boils when you\'re about to hit it.',
    status: 'available',
    preview: ContextMeterPreview,
    source: contextMeterSource,
  },
  {
    slug: 'code-diff',
    file: 'CodeDiff',
    name: 'Code Diff',
    description:
      'A familiar green/red diff — until you accept it. A beam sweeps down: removed characters scatter and fall away, added ones snap into place. The diff becomes the code.',
    status: 'available',
    preview: CodeDiffPreview,
    source: codeDiffSource,
  },
  {
    slug: 'agent-status',
    file: 'AgentStatus',
    name: 'Agent Status',
    description:
      'Parallel agents as flocks of light orbiting a progress ring. Each one streams into the core as it finishes; when all are done, the core flares into a check.',
    status: 'available',
    preview: AgentStatusPreview,
    source: agentStatusSource,
  },
  {
    slug: 'regenerate',
    file: 'Regenerate',
    name: 'Regenerate',
    description:
      'Hitting "regenerate" rewinds the existing answer like film stock — judder, scanlines, sprocket holes — before the new one types in.',
    status: 'available',
    preview: RegeneratePreview,
    source: regenerateSource,
  },
  {
    slug: 'timer',
    file: 'Timer',
    name: 'Timer',
    description:
      'A spinner-sized ring of ticks for anything that takes a while. A bright head sweeps round lighting a comet tail while the clock counts; give it progress and the ticks fill up, snap on each step, and flash to a check at 100%.',
    status: 'available',
    preview: TimerPreview,
    source: timerSource,
  },
  {
    slug: 'streaming-text',
    file: 'StreamingText',
    name: 'Streaming Text',
    description:
      'Streaming text where you can see it arrive. Each chunk lands as vapour and condenses into ink; the caret breathes with tokens per second, slows on a stall and dissolves when the answer is done.',
    status: 'available',
    preview: StreamingTextPreview,
    source: streamingTextSource,
  },
];

export function getComponent(slug) {
  return registry.find((c) => c.slug === slug);
}
