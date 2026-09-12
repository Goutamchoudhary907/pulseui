import thinkingPulseSource from './components/ThinkingPulse.jsx?raw';
import confidenceShimmerSource from './components/ConfidenceShimmer.jsx?raw';
import liquidContextMeterSource from './components/LiquidContextMeter.jsx?raw';
import sweepDiffSource from './components/SweepDiff.jsx?raw';
import swarmStatusSource from './components/SwarmStatus.jsx?raw';
import rewindRegenerateSource from './components/RewindRegenerate.jsx?raw';
import {
  ThinkingPulsePreview,
  ConfidenceShimmerPreview,
  LiquidContextMeterPreview,
  SweepDiffPreview,
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
      'A gyroscope of light — glowing particles on three tilted orbits around a breathing core — that spins up and collapses into a single point the instant the model settles. Replaces the generic "thinking" spinner.',
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
      'A progress bar where the fill is liquid in glass — it surges and sloshes when a big chunk lands, warms near the limit, and boils when you\'re about to hit it.',
    status: 'available',
    preview: LiquidContextMeterPreview,
    source: liquidContextMeterSource,
  },
  {
    slug: 'sweep-diff',
    file: 'SweepDiff',
    name: 'Sweep Diff',
    description:
      'A familiar green/red diff — until you accept it. A beam sweeps down: removed characters scatter and fall away, added ones snap into place. The diff becomes the code.',
    status: 'available',
    preview: SweepDiffPreview,
    source: sweepDiffSource,
  },
  {
    slug: 'swarm-status',
    file: 'SwarmStatus',
    name: 'Swarm Status',
    description:
      'Parallel agents as flocks of light orbiting a progress ring. Each one streams into the core as it finishes; when all are done, the core flares into a check.',
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
