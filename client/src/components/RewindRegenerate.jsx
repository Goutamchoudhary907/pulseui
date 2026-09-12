import { useEffect, useRef, useState } from 'react';

/**
 * RewindRegenerate
 *
 * Give it an answer. Give it a different answer. Instead of the old text
 * vanishing and the new one appearing, the old text is *rewound* — pulled
 * back from the end at accelerating speed with film judder, scanlines and
 * scrolling sprocket holes — and only then does the new answer type in.
 *
 * Zero dependencies — spans + CSS keyframes injected once.
 *
 * Props:
 *  - text (string): the current answer. Change it to trigger a rewind.
 *  - typeMs (number): ms per character while typing in. Default 14.
 *  - rewindMs (number): ms per rewind frame. Default 16.
 *  - cursor (bool): show a block cursor while typing. Default true.
 *  - onPhase (fn): called with 'rewinding' | 'typing' | 'idle'.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-rewind-regenerate';
const CSS = `
.pui-rewind {
  position: relative;
  display: block;
  white-space: pre-wrap;
  overflow: hidden;
}
.pui-rewind-text { position: relative; display: inline; }
.pui-rewind-cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.05em;
  margin-left: 1px;
  vertical-align: -0.15em;
  background: currentColor;
  opacity: 0.8;
  animation: pui-rw-blink 0.9s steps(1, end) infinite;
}
/* --- rewinding state --- */
.pui-rewind.is-rewinding .pui-rewind-text {
  animation: pui-rw-judder 110ms steps(2, end) infinite;
  text-shadow: -1.5px 0 rgba(255, 45, 120, 0.55), 1.5px 0 rgba(0, 200, 255, 0.55);
  filter: contrast(1.15) brightness(1.05);
}
.pui-rewind.is-rewinding::before {
  /* scanlines + a rolling brightness band */
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(to bottom, rgba(0,0,0,0.07) 0 1px, transparent 1px 3px),
    linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
  background-size: 100% 100%, 100% 120px;
  animation: pui-rw-roll 0.55s linear infinite;
  mix-blend-mode: multiply;
}
.pui-rewind.is-rewinding::after {
  /* sprocket holes on both edges, scrolling upward */
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 5px 50%, rgba(28,25,23,0.35) 2px, transparent 2.6px),
    radial-gradient(circle at calc(100% - 5px) 50%, rgba(28,25,23,0.35) 2px, transparent 2.6px);
  background-size: 100% 12px;
  animation: pui-rw-sprocket 0.28s linear infinite;
}
.pui-rewind-badge {
  position: absolute;
  top: 0;
  right: 12px;
  font: 500 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em;
  color: #78716c;
  opacity: 0;
  transition: opacity 0.15s;
}
.pui-rewind.is-rewinding .pui-rewind-badge {
  opacity: 1;
  animation: pui-rw-blink 0.4s steps(1, end) infinite;
}
@keyframes pui-rw-judder {
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-1.5px) translateX(0.5px); }
  100% { transform: translateY(1px); }
}
@keyframes pui-rw-roll     { to { background-position: 0 0, 0 -120px; } }
@keyframes pui-rw-sprocket { to { background-position: 0 -12px; } }
@keyframes pui-rw-blink    { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .pui-rewind.is-rewinding .pui-rewind-text,
  .pui-rewind.is-rewinding::before,
  .pui-rewind.is-rewinding::after { animation: none; }
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

export default function RewindRegenerate({
  text = '',
  typeMs = 14,
  rewindMs = 16,
  cursor = true,
  onPhase,
  className,
  style,
}) {
  useInjectedStyle();
  const [shown, setShown] = useState(text);
  const [phase, setPhase] = useState('idle');
  const targetRef = useRef(text);
  const timerRef = useRef(null);
  const phaseRef = useRef(onPhase);
  phaseRef.current = onPhase;

  // A new `text` = new target. If something is on screen, rewind it first.
  useEffect(() => {
    if (text === targetRef.current) return;
    targetRef.current = text;
    clearTimeout(timerRef.current);
    setPhase((p) => (p === 'idle' && shown.length === 0 ? 'typing' : 'rewinding'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    phaseRef.current?.(phase);
    clearTimeout(timerRef.current);

    if (phase === 'rewinding') {
      let len = shown.length;
      let step = 1;
      const frame = () => {
        // accelerate: each frame removes a slightly bigger chunk
        step = Math.min(step * 1.18 + 0.4, Math.max(2, len * 0.12));
        len = Math.max(0, len - Math.round(step));
        setShown((s) => s.slice(0, len));
        if (len > 0) timerRef.current = setTimeout(frame, rewindMs);
        else timerRef.current = setTimeout(() => setPhase('typing'), 220);
      };
      timerRef.current = setTimeout(frame, rewindMs);
    }

    if (phase === 'typing') {
      const target = targetRef.current;
      let i = 0;
      const frame = () => {
        i += 1;
        setShown(target.slice(0, i));
        if (i < target.length) {
          // small pause after punctuation so it reads like real typing
          const ch = target[i - 1];
          const pause = /[.!?]/.test(ch) ? typeMs * 9 : /[,;:]/.test(ch) ? typeMs * 4 : typeMs;
          timerRef.current = setTimeout(frame, pause);
        } else {
          setPhase('idle');
        }
      };
      timerRef.current = setTimeout(frame, typeMs);
    }

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <span
      className={`pui-rewind ${phase === 'rewinding' ? 'is-rewinding' : ''} ${className || ''}`}
      style={style}
      aria-live="polite"
      aria-busy={phase !== 'idle'}
    >
      <span className="pui-rewind-badge">◀◀ REW</span>
      <span className="pui-rewind-text">{shown}</span>
      {cursor && phase === 'typing' && <span className="pui-rewind-cursor" aria-hidden />}
    </span>
  );
}
