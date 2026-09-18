import SectionHeading from '../lib/SectionHeading';

const steps = [
  {
    step: '01',
    title: 'Browse a component',
    body: 'See it live, interactive, in the exact state your product needs — thinking, settled, mid-diff.',
  },
  {
    step: '02',
    title: 'Copy the source',
    body: 'One file. Near-zero dependencies — plain CSS or canvas, Framer Motion only where the physics genuinely need it.',
  },
  {
    step: '03',
    title: 'Paste into your repo',
    body: 'No install, no package to track. You own the code — restyle it, extend it, ship it.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three steps, <em className="italic">zero install.</em>
            </>
          }
          body="The same model as shadcn/ui — the component lives in your codebase, not in node_modules."
        />

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-3">
          {/* hairline connecting the three steps on wide screens */}
          <div className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px bg-stone-200 sm:block" />
          {steps.map((s, i) => (
            <li key={s.step} data-reveal style={{ '--reveal-delay': `${i * 90}ms` }} className="relative">
              <div className="inline-flex h-11 items-center rounded-full border border-stone-200 bg-white px-4 font-display text-[22px] tracking-tight text-ink shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                {s.step}
              </div>
              <h3 className="mt-6 text-[17px] font-medium text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-14 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
            <span className="ml-3 font-mono text-[11px] text-stone-400">
              src/components/ThinkingIndicator.jsx
            </span>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-6 text-stone-700">
{`import ThinkingIndicator from './components/ThinkingIndicator';

<ThinkingIndicator settled={!isStreaming} />`}
          </pre>
        </div>
      </div>
    </section>
  );
}
