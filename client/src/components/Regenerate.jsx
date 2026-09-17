import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Regenerate
 *
 * Hit "regenerate" and the old answer is *rewound* like tape: pulled back
 * from the end into a tape head at accelerating speed, the characters at
 * the head smeared with motion, sprocket holes rolling past, a counter
 * spinning down. When the tape runs out the head flashes once — the cue —
 * and only then does the new answer come in.
 *
 * It composes with a streaming answer. Bump `attempt` and it rewinds
 * whatever `text` was on screen; once that's gone it renders `children`
 * (e.g. <StreamingText> fed by your new request) or, with no children,
 * types `text` in itself.
 *
 * Zero dependencies — spans + a stylesheet injected once. Nothing animates
 * while idle.
 *
 * Props:
 *  - text (string): the current answer. May grow while streaming.
 *  - attempt (number): bump it to regenerate — rewinds what's on screen.
 *  - children: the live answer to render after the rewind (optional).
 *  - typeMs (number): ms per character when typing `text` in (no children).
 *      Default 14. 0 shows the new text immediately.
 *  - rewindMs (number): ms per rewind frame. Default 30.
 *  - cursor (bool): show a block cursor while typing. Default true.
 *  - onPhase (fn): called with 'rewinding' | 'writing' | 'idle'.
 *  - className / style: passed to the wrapper.
 */

const STYLE_ID = 'pulseui-regenerate';
const CSS = `
.pui-rewind { position: relative; display: block; white-space: pre-wrap; }
.pui-rewind-text { position: relative; display: inline; }
.pui-rewind-cursor {
  display: inline-block; width: 0.55em; height: 1.05em; margin-left: 1px; vertical-align: -0.15em;
  background: currentColor; opacity: 0.8; animation: pui-rw-blink 0.9s steps(1, end) infinite;
}
/* --- rewinding: the whole passage judders, the tail smears into the head --- */
.pui-rewind.is-rewinding .pui-rewind-text { animation: pui-rw-judder 90ms steps(2, end) infinite; }
.pui-rewind-tail { display: inline; }
.pui-rewind-tail span {
  display: inline-block;
  filter: blur(var(--b));
  opacity: var(--o);
  transform: translateX(var(--x)) scaleX(1.45) skewX(-8deg);
  transform-origin: right center;
}
.pui-rewind-head {
  display: inline-block; width: 2px; height: 1.1em; margin-left: 2px; vertical-align: -0.18em;
  background: currentColor; border-radius: 1px;
  box-shadow: 0 0 6px currentColor, 0 0 14px currentColor;
  animation: pui-rw-head 120ms ease-in-out infinite alternate;
}
/* sprocket holes rolling down both edges */
.pui-rewind.is-rewinding::after {
  content: ''; position: absolute; inset: -6px -14px; pointer-events: none;
  background:
    radial-gradient(circle at 5px 50%, rgba(28,25,23,0.22) 2px, transparent 2.6px),
    radial-gradient(circle at calc(100% - 5px) 50%, rgba(28,25,23,0.22) 2px, transparent 2.6px);
  background-size: 100% 12px;
  animation: pui-rw-sprocket 0.24s linear infinite;
}
.pui-rewind-badge {
  position: absolute; top: -2px; right: 0;
  font: 500 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.12em;
  color: #78716c; font-variant-numeric: tabular-nums; opacity: 0; transition: opacity 0.15s;
}
.pui-rewind.is-rewinding .pui-rewind-badge { opacity: 1; }
.pui-rewind-badge b { font-weight: 500; animation: pui-rw-blink 0.5s steps(1, end) infinite; }
/* the cue: tape ran out, head flashes once before the new take */
.pui-rewind.is-cued .pui-rewind-head { animation: pui-rw-cue 300ms ease-out both; }
@keyframes pui-rw-judder { 0% { transform: translateY(0); } 50% { transform: translateY(-0.7px); } 100% { transform: translateY(0.5px); } }
@keyframes pui-rw-head { from { opacity: 0.7; } to { opacity: 1; } }
@keyframes pui-rw-cue { 0% { opacity: 1; transform: scaleY(1.7); } 100% { opacity: 0; transform: scaleY(0.3); } }
@keyframes pui-rw-sprocket { to { background-position: 0 -12px; } }
@keyframes pui-rw-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .pui-rewind.is-rewinding .pui-rewind-text, .pui-rewind.is-rewinding::after, .pui-rewind-head, .pui-rewind-badge b { animation: none; }
  .pui-rewind-tail span { filter: none; transform: none; }
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

const TAIL = 7;

export default function Regenerate({
  text = '',
  attempt = 0,
  children,
  typeMs = 14,
  rewindMs = 30,
  cursor = true,
  onPhase,
  className,
  style,
}) {
  useInjectedStyle();
  const [phase, setPhase] = useState('idle');
  const [shown, setShown] = useState('');         // text on screen while rewinding / typing
  const [cued, setCued] = useState(false);
  const prevTextRef = useRef(text);               // what was on screen before this render
  const textRef = useRef(text);
  textRef.current = text;
  const hasChildren = useRef(false);
  hasChildren.current = children != null;
  const attemptRef = useRef(attempt);
  const timerRef = useRef(null);
  const phaseRef = useRef(onPhase);
  phaseRef.current = onPhase;

  // bump `attempt` → rewind whatever was on screen (layout effect so the
  // frame never paints the new, empty answer before the rewind starts)
  useLayoutEffect(() => {
    if (attempt === attemptRef.current) return;
    attemptRef.current = attempt;
    const was = prevTextRef.current;
    clearTimeout(timerRef.current);
    setShown(was);
    setPhase(was ? 'rewinding' : hasChildren.current ? 'idle' : 'writing');
  }, [attempt]);
  useLayoutEffect(() => {
    prevTextRef.current = text;
  });

  useEffect(() => {
    phaseRef.current?.(phase);
    clearTimeout(timerRef.current);

    if (phase === 'rewinding') {
      let len = shown.length;
      let step = 1;
      const frame = () => {
        // accelerate, but the last stretch drags like tape reaching the leader
        step = Math.min(step * 1.1 + 0.2, Math.max(2, len * 0.12));
        len = Math.max(0, len - Math.round(step));
        setShown((s) => s.slice(0, len));
        if (len > 0) timerRef.current = setTimeout(frame, rewindMs);
        else {
          setCued(true);
          timerRef.current = setTimeout(() => {
            setCued(false);
            setPhase(hasChildren.current || typeMs <= 0 ? 'idle' : 'writing');
          }, 320);
        }
      };
      timerRef.current = setTimeout(frame, rewindMs);
    }

    if (phase === 'writing') {
      let i = 0;
      const frame = () => {
        const target = textRef.current;
        i += 1;
        setShown(target.slice(0, i));
        if (i < target.length) {
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

  const rewinding = phase === 'rewinding';
  const head = rewinding ? shown.slice(0, Math.max(0, shown.length - TAIL)) : shown;
  const tail = rewinding ? shown.slice(-TAIL) : '';

  return (
    <span
      className={`pui-rewind${rewinding ? ' is-rewinding' : ''}${cued ? ' is-cued' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      aria-live="polite"
      aria-busy={phase !== 'idle'}
    >
      <span className="pui-rewind-badge" aria-hidden="true">
        <b>◀◀</b> REW {String(rewinding ? shown.length : 0).padStart(4, '0')}
      </span>
      {phase === 'idle' && children != null ? (
        children
      ) : (
        <span className="pui-rewind-text">
          {phase === 'idle' ? text : head}
          {rewinding && (
            <span className="pui-rewind-tail" aria-hidden="true">
              {[...tail].map((ch, i) => {
                const t = (i + 1) / tail.length;
                return (
                  <span
                    key={i}
                    style={{ '--b': `${(t * 2.4).toFixed(2)}px`, '--o': (1 - t * 0.7).toFixed(2), '--x': `${(t * 3).toFixed(1)}px` }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          )}
          {(rewinding || cued) && <span className="pui-rewind-head" aria-hidden="true" />}
          {cursor && phase === 'writing' && <span className="pui-rewind-cursor" aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
