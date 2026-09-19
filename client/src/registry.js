import thinkingIndicatorSource from './components/ThinkingIndicator.jsx?raw';
import confidenceTextSource from './components/ConfidenceText.jsx?raw';
import contextMeterSource from './components/ContextMeter.jsx?raw';
import codeDiffSource from './components/CodeDiff.jsx?raw';
import agentStatusSource from './components/AgentStatus.jsx?raw';
import regenerateSource from './components/Regenerate.jsx?raw';
import timerSource from './components/Timer.jsx?raw';
import streamingTextSource from './components/StreamingText.jsx?raw';
import toolCallSource from './components/ToolCall.jsx?raw';
import holdToAllowSource from './components/HoldToAllow.jsx?raw';
import imageRevealSource from './components/ImageReveal.jsx?raw';
import fileChunkerSource from './components/FileChunker.jsx?raw';
import {
  ThinkingIndicatorPreview,
  ConfidenceTextPreview,
  ContextMeterPreview,
  CodeDiffPreview,
  AgentStatusPreview,
  RegeneratePreview,
  TimerPreview,
  StreamingTextPreview,
  ToolCallPreview,
  HoldToAllowPreview,
  ImageRevealPreview,
  FileChunkerPreview,
} from './lib/previews';

// Central registry of every component in the library. Drives the homepage
// showcase, the /components index, and each docs page (source text).
//
// slug     URL segment: /components/<slug>
// file     file name in src/components/ (without .jsx)
// status   'available' | 'coming-soon'
// tagline  one short line for the cards (description is for the doc page)
// preview  small self-running component for the cards
// source   raw file text shown in the Source block
// Order here drives both the homepage's featured 6 (see ComponentsShowcase's
// FEATURED slugs — kept in this same sequence) and the /components index.
export const registry = [
  {
    slug: 'thinking-indicator',
    file: 'ThinkingIndicator',
    name: 'Thinking Indicator',
    tagline: 'Thoughts that drift, then snap together.',
    description:
      'A field of thoughts instead of a spinner. Particles drift on slow currents and fire synapses when they meet; when the model settles, every link flashes at once and the field spirals in to a white-hot core. Works at 20px inline or 200px hero.',
    status: 'available',
    preview: ThinkingIndicatorPreview,
    source: thinkingIndicatorSource,
  },
  {
    slug: 'agent-status',
    file: 'AgentStatus',
    name: 'Agent Status',
    tagline: 'Parallel agents as a swarm that converges.',
    description:
      'Parallel agents as flocks of light. Each one launches out of the hub when dispatched, orbits with a ring that fills with its progress, and streams back home when it finishes. When every flock is in, the core flares into a check.',
    status: 'available',
    preview: AgentStatusPreview,
    source: agentStatusSource,
  },
  {
    slug: 'context-meter',
    file: 'ContextMeter',
    name: 'Context Meter',
    tagline: 'Liquid in glass instead of a bar.',
    description:
      'A progress bar where the fill is liquid in glass — it surges, sloshes and throws spray when a big chunk lands, warms near the limit, boils when you\'re about to hit it, and overflows when you do.',
    status: 'available',
    preview: ContextMeterPreview,
    source: contextMeterSource,
  },
  {
    slug: 'tool-call',
    file: 'ToolCall',
    name: 'Tool Call',
    tagline: 'A signal down the trace, and back.',
    description:
      'A tool call as a signal on a circuit, not "Calling search_web…" spinner text. A white-hot pulse rides the trace to the tool, the pad ignites and hums while it runs, the result pulses back home — or the pad blows and the trace burns out.',
    status: 'available',
    preview: ToolCallPreview,
    source: toolCallSource,
  },
  {
    slug: 'file-chunker',
    file: 'FileChunker',
    name: 'File Chunker',
    tagline: 'A page cut into chunks, live.',
    description:
      'A document being prepared for retrieval, shown as what actually happens instead of a spinner. The page fills as it\'s read, then strips peel off and land on a deck — the chunks — and embedding lights an index mark on each. Ready squares the deck up; an error drops a strip. Pages, chunks and tokens on the line.',
    status: 'available',
    preview: FileChunkerPreview,
    source: fileChunkerSource,
  },
  {
    slug: 'streaming-text',
    file: 'StreamingText',
    name: 'Streaming Text',
    tagline: 'Tokens condense out of a haze.',
    description:
      'Streaming text where you can see it arrive. Each chunk lands as glowing vapour and condenses into ink. The caret is a drop of ink that stretches with tokens per second, turns back to vapour on a stall, dries into the page when the answer is done — and if you hit stop, the text is torn off where it stopped.',
    status: 'available',
    preview: StreamingTextPreview,
    source: streamingTextSource,
  },
  {
    slug: 'code-diff',
    file: 'CodeDiff',
    name: 'Code Diff',
    tagline: 'Accepted changes bleed in like ink.',
    description:
      'A familiar green/red diff — until you decide. Accept, and a beam sweeps down: removed characters crumble away, added ones snap into place, then the green drains out and it\'s just code. Reject, and the proposal blows away instead.',
    status: 'available',
    preview: CodeDiffPreview,
    source: codeDiffSource,
  },
  {
    slug: 'regenerate',
    file: 'Regenerate',
    name: 'Regenerate',
    tagline: 'Rewinds the old answer like tape.',
    description:
      'Hit "regenerate" and the old answer rewinds like tape: pulled back into a glowing head at accelerating speed, the last characters smearing, sprocket holes rolling, a counter spinning down. The head flashes once, then the new answer streams in.',
    status: 'available',
    preview: RegeneratePreview,
    source: regenerateSource,
  },
  {
    slug: 'timer',
    file: 'Timer',
    name: 'Timer',
    tagline: 'A stopwatch that actually sweeps.',
    description:
      'A spinner-sized ring of ticks for anything that takes a while. A bright head sweeps round lighting a comet tail while the clock counts; give it progress and the ticks fill up, snap on each step, and flash to a check at 100%.',
    status: 'available',
    preview: TimerPreview,
    source: timerSource,
  },
  {
    slug: 'hold-to-allow',
    file: 'HoldToAllow',
    name: 'Hold to Allow',
    tagline: 'A fuse instead of a click.',
    description:
      '"May I run this?" with a fuse in the Allow button. Hold it and a fill burns across from the left behind a thin bright frontier; let go early and it recedes; hold to the end and it lands. Nothing dangerous happens on a twitch.',
    status: 'available',
    preview: HoldToAllowPreview,
    source: holdToAllowSource,
  },
  {
    slug: 'image-reveal',
    file: 'ImageReveal',
    name: 'Image Reveal',
    tagline: 'A generation tray, dots settling into place.',
    description:
      'A generated image arriving in a dark tray, not a blur with a progress bar. Faint blue dots drift on slow currents; as progress rises they lock onto a grid one by one, glowing as they land, alongside a live label and percentage — the same language a real image model\'s "creating…" panel uses. Nothing needs the picture until it exists — when the URL arrives, the real image fades in over the dots.',
    status: 'available',
    preview: ImageRevealPreview,
    source: imageRevealSource,
  },
  {
    slug: 'confidence-text',
    file: 'ConfidenceText',
    name: 'Confidence Text',
    tagline: 'Unsure words sit out of focus.',
    description:
      'Confident words are sharp ink; uncertain ones sit out of focus under a slow heat-haze, like a mirage you shouldn\'t trust. Hover one and it racks into focus with its score — or verify the answer and the whole thing sharpens in a wave.',
    status: 'available',
    preview: ConfidenceTextPreview,
    source: confidenceTextSource,
  },
];

export function getComponent(slug) {
  return registry.find((c) => c.slug === slug);
}
