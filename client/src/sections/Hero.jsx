import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useInView from '../lib/useInView';
import { useElementWidth } from '../lib/useViewport';
import { ThinkingSlide, AgentsSlide, ChunkerSlide } from './heroSlides';

const SLIDES = [
  { id: 'thinking', file: 'ThinkingIndicator.jsx', Slide: ThinkingSlide },
  { id: 'agents', file: 'AgentStatus.jsx', Slide: AgentsSlide },
  { id: 'chunker', file: 'FileChunker.jsx', Slide: ChunkerSlide },
];
const FADE_MS = 350;

export default function Hero() {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const wellRef = useRef(null);
  const inView = useInView(wellRef);
  const w = useElementWidth(wellRef);
  const fadeTimer = useRef(null);

  const go = useCallback((k) => {
    clearTimeout(fadeTimer.current);
    setLeaving(true);
    fadeTimer.current = setTimeout(() => {
      setI(k);
      setLeaving(false);
    }, FADE_MS);
  }, []);
  const next = useCallback(() => go((i + 1) % SLIDES.length), [go, i]);
  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  const { Slide, file } = SLIDES[i];

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32 grid md:grid-cols-[1.15fr_1fr] gap-10 sm:gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            Copy-paste, not npm-install
          </span>

          <h1 className="mt-6 font-display text-[44px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[64px] lg:text-[76px]">
            Rare components for{' '}
            <em className="italic text-violet-700">AI-native</em>{' '}
            interfaces.
          </h1>

          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-stone-600">
            Every AI product has the same flat spinner. Pulse UI gives it an
            organic, physically-metaphored treatment instead.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/components"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-stone-800 transition-colors"
            >
              Browse components
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-stone-300 transition-colors"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="glow absolute -inset-10 -z-10 rounded-full" />
          <div className="relative rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_32px_64px_-32px_rgba(124,58,237,0.35)]">
            <div
              ref={wellRef}
              className="bg-dots relative aspect-[4/3] overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/60"
            >
              {inView && w > 0 && (
                <div
                  key={i}
                  data-leaving={leaving || undefined}
                  className="hero-slide absolute inset-0 flex items-center justify-center"
                >
                  <Slide w={w} h={w * 0.75} onDone={next} />
                </div>
              )}

              <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                {SLIDES.map((s, k) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Show ${s.file}`}
                    onClick={() => k !== i && go(k)}
                    className={
                      'h-1.5 rounded-full transition-all duration-300 ' +
                      (k === i ? 'w-5 bg-ink' : 'w-1.5 bg-stone-300 hover:bg-stone-400')
                    }
                  />
                ))}
              </div>

              <div className="absolute bottom-4 right-4 font-mono text-[11px] text-stone-400">
                {file}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
