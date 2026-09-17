import { useEffect, useState } from 'react';

/**
 * StreamingText
 *
 * Streaming text where the *arriving* part is visible. Every chunk that
 * lands enters as vapour — soft, spread, glowing, out of focus — and
 * condenses into ink over a few hundred milliseconds. The settled part is
 * plain text. The caret is a drop of ink: it stretches with tokens/sec,
 * breathes while the stream is live, re-vaporises when it stalls, and
 * dries into the page when the answer is done. Stop it mid-answer and the
 * text is torn off where it stopped — the last word's ink drags and a
 * ragged edge marks the cut.
 *
 * Feed it the accumulated text from your own stream loop (SSE, fetch
 * reader, whatever) — it diffs against what it already has and only
 * animates what's new. Chunks that land mid-word extend the word that's
 * still condensing instead of starting a new one.
 *
 * Zero dependencies — spans + a stylesheet injected once.
 *
 * Props:
 *  - text (string): the full text so far. Grows as chunks arrive; set it
 *      to '' (or anything that isn't a continuation) to start over.
 *  - streaming (bool): true while chunks are still coming. Controls the caret.
 *  - stopped (bool): the user stopped generation. Set it with streaming=false
 *      and the answer ends in a tear instead of drying cleanly.
 *  - condenseMs (number): how long a chunk takes to solidify. Default 320.
 *  - stallMs (number): no chunk for this long counts as a stall — the caret
 *      slows its breathing. Default 600.
 *  - className / style: passed to the wrapper span.
 */

const STYLE_ID = 'pulseui-condense';
const CSS = `
.pui-condense { white-space: pre-wrap; }
/* a token arrives as vapour — spread, out of focus, glowing softly — and
   condenses into ink */
.pui-condense-t {
  animation: pui-condense-in var(--pui-cd, 320ms) cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: var(--pui-delay, 0ms);
}
@keyframes pui-condense-in {
  0%   { opacity: 0;    filter: blur(7px);   letter-spacing: 0.1em;  text-shadow: 0 0 0.5em currentColor; }
  35%  { opacity: 0.55; filter: blur(2.5px); letter-spacing: 0.05em; text-shadow: 0 0 0.35em currentColor; }
  70%  { opacity: 0.9;  filter: blur(0.6px); letter-spacing: 0.01em; text-shadow: 0 0 0.12em transparent; }
  100% { opacity: 1;    filter: blur(0);     letter-spacing: 0;      text-shadow: 0 0 0 transparent; }
}
/* the caret is a drop of ink: it stretches with tokens/sec, breathes while
   the stream is live, re-vaporises when it stalls, and dries when done */
.pui-condense-c {
  display: inline-block;
  vertical-align: -0.02em;
  width: 0.48em;
  height: 0.48em;
  margin-left: 0.18em;
  border-radius: 999px;
  background: currentColor;
  transform-origin: left center;
  transform: scaleX(calc(1 + var(--pui-rate, 0) * 1.8));
  transition: transform 240ms ease, opacity 320ms ease, filter 320ms ease;
  animation: pui-condense-breathe 1.1s ease-in-out infinite;
}
.pui-condense-c.is-stalled {
  animation-duration: 2.6s;
  filter: blur(1.5px);
  transform: scaleX(1) scale(1.3);
}
.pui-condense-c.is-done {
  animation: pui-condense-dry 600ms ease-out both;
}
@keyframes pui-condense-breathe {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes pui-condense-dry {
  0%   { opacity: 1; transform: scaleX(1); filter: blur(0); }
  40%  { opacity: 1; transform: scale(0.55); filter: blur(0); }
  100% { opacity: 0; transform: scale(0.55) translateY(0.4em); filter: blur(2px); }
}
/* stopped: the last word's ink drags and the edge is torn */
.pui-condense-cut {
  display: inline-block;
  animation: pui-condense-drag 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.pui-condense-tear {
  display: inline-block;
  width: 0.6em;
  height: 1em;
  margin-left: 0.08em;
  vertical-align: -0.18em;
  background: currentColor;
  opacity: 0.32;
  clip-path: polygon(0 0, 55% 0, 100% 14%, 40% 30%, 90% 46%, 30% 62%, 85% 78%, 35% 92%, 60% 100%, 0 100%);
  animation: pui-condense-tear-in 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
@keyframes pui-condense-drag {
  0%   { letter-spacing: 0; filter: blur(0); opacity: 1; }
  100% { letter-spacing: 0.12em; filter: blur(0.5px); opacity: 0.55; }
}
@keyframes pui-condense-tear-in {
  0%   { transform: translateX(-0.3em) scaleX(0.2); opacity: 0; }
  100% { transform: none; opacity: 0.32; }
}
@media (prefers-reduced-motion: reduce) {
  .pui-condense-t { animation: none; }
  .pui-condense-cut { animation: none; opacity: 0.55; letter-spacing: 0.12em; }
  .pui-condense-tear { animation: none; }
  .pui-condense-c { animation: none; transition: none; transform: none; filter: none; }
  .pui-condense-c.is-done { opacity: 0; }
}
`;

function useInjectedStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

// newline | run of spaces | word + trailing spaces
function tokenize(str) {
  const out = [];
  const re = /\n|[^\S\n]+|\S+[^\S\n]*/g;
  let m;
  while ((m = re.exec(str))) out.push(m[0]);
  return out;
}

const empty = { text: '', settled: '', fresh: [], nextId: 0, arrivals: [], lastAt: 0 };

// Pure: fold what has finished condensing into `settled`, append the new
// chunk as fresh tokens. Non-continuations (a reset) start from scratch.
function advance(s, text, condenseMs) {
  const now = performance.now();
  const grows = text.startsWith(s.text);
  const appended = grows ? text.slice(s.text.length) : text;
  let settled = grows ? s.settled : '';
  const fresh = [];
  let nextId = s.nextId;
  if (grows) {
    for (const f of s.fresh) {
      if (now - f.at >= condenseMs + f.delay + 50) settled += f.text;
      else fresh.push(f);
    }
  }
  const toks = tokenize(appended);
  // a chunk that starts mid-word continues the word still condensing
  const last = fresh[fresh.length - 1];
  if (last && toks.length && !/\s$/.test(last.text) && !/^\s/.test(toks[0])) {
    fresh[fresh.length - 1] = { ...last, text: last.text + toks.shift() };
  }
  toks.forEach((t, i) => fresh.push({ id: nextId++, text: t, at: now, delay: Math.min(180, i * 28) }));
  const arrivals = grows ? s.arrivals.filter((a) => now - a.at < 1500) : [];
  if (appended) arrivals.push({ at: now, n: appended.length });
  return { text, settled, fresh, nextId, arrivals, lastAt: appended ? now : s.lastAt };
}

export default function StreamingText({
  text = '',
  streaming = false,
  stopped = false,
  condenseMs = 320,
  stallMs = 600,
  className,
  style,
}) {
  useInjectedStyle();
  const [state, setState] = useState(empty);

  // derive from the prop during render so nothing is ever a frame late
  let view = state;
  if (text !== state.text) {
    view = advance(state, text, condenseMs);
    setState(view);
  }

  // re-render on a timer while streaming so the caret rate decays in a stall
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [streaming]);

  // once the stream ends, fold everything into plain text
  useEffect(() => {
    if (streaming) return;
    const id = setTimeout(
      () => setState((s) => ({ ...s, settled: s.settled + s.fresh.map((f) => f.text).join(''), fresh: [] })),
      condenseMs + 300,
    );
    return () => clearTimeout(id);
  }, [streaming, condenseMs, text]);

  const t = Math.max(now, view.lastAt);
  const chars = view.arrivals.reduce((n, a) => (t - a.at < 1000 ? n + a.n : n), 0);
  const rate = Math.min(1, chars / 80);
  const stalled = streaming && t - view.lastAt > stallMs;

  // no caret for text that was never streamed (a static render)
  const [everStreamed, setEverStreamed] = useState(streaming);
  if (streaming && !everStreamed) setEverStreamed(true);

  // the cut: once stopped, split off the last word so its ink can drag
  const cut = stopped && !streaming;
  let settledText = view.settled;
  let freshToks = view.fresh;
  let lastWord = '';
  if (cut) {
    if (freshToks.length) {
      lastWord = freshToks[freshToks.length - 1].text;
      freshToks = freshToks.slice(0, -1);
    } else {
      const m = settledText.match(/(\S+)\s*$/);
      if (m) { lastWord = m[0]; settledText = settledText.slice(0, m.index); }
    }
  }

  return (
    <span className={`pui-condense${className ? ` ${className}` : ''}`} style={{ '--pui-cd': `${condenseMs}ms`, ...style }}>
      {settledText}
      {freshToks.map((f) =>
        f.text === '\n' || !f.text.trim() ? (
          f.text
        ) : (
          <span key={f.id} className="pui-condense-t" style={{ '--pui-delay': `${f.delay}ms` }}>
            {f.text}
          </span>
        ),
      )}
      {cut && lastWord && <span className="pui-condense-cut">{lastWord}</span>}
      {cut && <span className="pui-condense-tear" aria-hidden="true" />}
      {cut && <span className="pui-condense-sr" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}> (stopped)</span>}
      {everStreamed && !cut && (
        <span
          className={`pui-condense-c${streaming ? '' : ' is-done'}${stalled ? ' is-stalled' : ''}`}
          style={{ '--pui-rate': streaming ? rate : 0 }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
