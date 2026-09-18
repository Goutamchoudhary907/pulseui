import SectionHeading from '../lib/SectionHeading';

const criteria = [
  {
    title: 'A real AI-product moment',
    body: 'Thinking, context usage, an accepted diff, a low-confidence answer, parallel agents, regenerate. Recognizable on sight — not an invented interaction.',
  },
  {
    title: 'Visually alien enough to stop a scroll',
    body: 'The "how did they do that" reaction. A nicer spinner doesn\'t qualify; a particle field that converges when the model settles does.',
  },
];

export default function Solution() {
  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 grid gap-10 sm:gap-14 md:grid-cols-[1fr_1fr] md:items-start">
        <SectionHeading
          eyebrow="The angle"
          title={
            <>
              Same moments.{' '}
              <em className="italic text-violet-700">An organic treatment.</em>
            </>
          }
          body="Pulse UI takes the moments every AI product already has and renders them with physical metaphors — particles, liquid, swarms, film — in the spirit of rareui and Aceternity, but themed around AI states instead of generic marketing UI."
        />

        <div
          data-reveal
          style={{ '--reveal-delay': '120ms' }}
          className="rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="rounded-2xl bg-stone-50/70 p-6 sm:p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
              The bar for inclusion
            </div>
            <ol className="mt-6 space-y-6">
              {criteria.map((c, i) => (
                <li key={c.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white font-mono text-[12px] text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-ink">{c.title}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-7 border-t border-stone-200 pt-5 text-sm text-stone-500">
              Both, or it doesn't ship.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
