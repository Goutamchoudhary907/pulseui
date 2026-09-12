import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThinkingPulse from '../components/ThinkingPulse';

export default function Hero() {
  // Auto-cycle the preview so the drift → converge transition is visible
  // without the visitor having to click anything.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setSettled((s) => !s), 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-[1.15fr_1fr] gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Copy-paste, not npm-install
          </span>

          <h1 className="mt-6 font-display text-[52px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[64px] lg:text-[76px]">
            Rare components for{' '}
            <em className="italic text-violet-700">AI-native</em>{' '}
            interfaces.
          </h1>

          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-stone-600">
            Every AI product ships the same flat "thinking" spinner and plain
            progress bar. Pulseui gives those same moments an organic,
            physically-metaphored treatment — the kind that stops a scroll.
          </p>

          <div className="mt-9 flex items-center gap-3">
            <Link
              to="/components"
              className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-stone-800 transition-colors"
            >
              Browse components
            </Link>
            <a
              href="https://github.com"
              className="inline-flex items-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-stone-300 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="glow absolute -inset-10 -z-10 rounded-full" />
          <div className="relative rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_32px_64px_-32px_rgba(124,58,237,0.35)]">
            <div className="bg-dots relative flex aspect-[4/3] items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/60">
              <ThinkingPulse settled={settled} size={200} color="#7c3aed" />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 px-2.5 py-1 font-mono text-[11px] text-stone-600 backdrop-blur">
                <span
                  className={
                    'h-1.5 w-1.5 rounded-full transition-colors ' +
                    (settled ? 'bg-emerald-500' : 'bg-violet-500 animate-pulse')
                  }
                />
                {settled ? 'settled' : 'thinking…'}
              </div>

              <div className="absolute bottom-4 right-4 font-mono text-[11px] text-stone-400">
                ThinkingPulse.jsx
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
