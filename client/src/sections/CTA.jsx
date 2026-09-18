import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white px-6 py-20 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="glow absolute left-1/2 top-1/2 -z-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" />
          <div className="bg-dots absolute inset-0 -z-10 opacity-60" />

          <div className="relative">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
              Get started
            </div>
            <h2 className="mt-4 font-display text-[40px] leading-[1.06] tracking-[-0.015em] text-ink sm:text-[52px]">
              Give your AI product a moment
              <br className="hidden sm:block" /> worth <em className="italic">noticing.</em>
            </h2>
            <div className="mt-9 flex items-center justify-center gap-3">
              <Link
                to="/components"
                className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-stone-800 transition-colors"
              >
                Browse components
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
