import thinkingPulseSource from './components/ThinkingPulse.jsx?raw';
import confidenceShimmerSource from './components/ConfidenceShimmer.jsx?raw';
import liquidContextMeterSource from './components/LiquidContextMeter.jsx?raw';
import inkBleedDiffSource from './components/InkBleedDiff.jsx?raw';
import swarmStatusSource from './components/SwarmStatus.jsx?raw';
import rewindRegenerateSource from './components/RewindRegenerate.jsx?raw';
import {
  ThinkingPulsePreview,
  ConfidenceShimmerPreview,
  LiquidContextMeterPreview,
  InkBleedDiffPreview,
  SwarmStatusPreview,
  RewindRegeneratePreview,
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
    slug: 'thinking-pulse',
    file: 'ThinkingPulse',
    name: 'Thinking Pulse',
    description:
      'A loose particle field that visibly drifts, then converges and tightens as the model settles on an answer. Replaces the generic AI "thinking" spinner.',
    status: 'available',
    preview: ThinkingPulsePreview,
    source: thinkingPulseSource,
  },
  {
    slug: 'confidence-shimmer',
    file: 'ConfidenceShimmer',
    name: 'Confidence Shimmer',
    description:
      'Low-confidence tokens get a faint chromatic flicker instead of a hedge badge or footnote — the uncertainty is felt before it\'s read.',
    status: 'available',
    preview: ConfidenceShimmerPreview,
    source: confidenceShimmerSource,
  },
  {
    slug: 'liquid-context-meter',
    file: 'LiquidContextMeter',
    name: 'Liquid Context Meter',
    description:
      'The context-window gauge as a glass vessel filling with liquid — it sloshes when a large chunk lands and warms as it nears the limit.',
    status: 'available',
    preview: LiquidContextMeterPreview,
    source: liquidContextMeterSource,
  },
  {
    slug: 'ink-bleed-diff',
    file: 'InkBleedDiff',
    name: 'Ink-Bleed Diff',
    description:
      'An accepted code diff soaks into the page like ink bleeding into paper — an irregular, mottled blot instead of a flash of green/red lines.',
    status: 'available',
    preview: InkBleedDiffPreview,
    source: inkBleedDiffSource,
  },
  {
    slug: 'swarm-status',
    file: 'SwarmStatus',
    name: 'Swarm Status',
    description:
      'Parallel subagents as boid-style flocks drifting independently, each settling to the centre as it finishes, all collapsing into one point when done.',
    status: 'available',
    preview: SwarmStatusPreview,
    source: swarmStatusSource,
  },
  {
    slug: 'rewind-regenerate',
    file: 'RewindRegenerate',
    name: 'Rewind / Regenerate',
    description:
      'Hitting "regenerate" rewinds the existing answer like film stock — judder, scanlines, sprocket holes — before the new one types in.',
    status: 'available',
    preview: RewindRegeneratePreview,
    source: rewindRegenerateSource,
  },
];

export function getComponent(slug) {
  return registry.find((c) => c.slug === slug);
}
