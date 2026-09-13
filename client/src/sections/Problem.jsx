import SectionHeading from '../lib/SectionHeading';

// Tiny faithful mock-ups of the flat, default versions of each moment —
// the "before" that Pulseui replaces.
function FlatSpinner() {
  return (
    <div className="flex items-center gap-3 text-sm text-stone-600">
      <span className="h-4 w-4 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
      Thinking…
    </div>
  );
}

function FlatProgress() {
  return (
    <div className="w-full">
      <div className="flex justify-between font-mono text-[11px] text-stone-500">
        <span>context</span>
        <span>62%</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full bg-stone-200">
        <div className="h-2 w-[62%] rounded-full bg-stone-700" />
      </div>
    </div>
  );
}

function FlatDiff() {
  return (
    <div className="w-full overflow-hidden rounded-md border border-stone-200 font-mono text-[11.5px] leading-5">
      <div className="bg-red-50 px-2.5 text-red-700">- const retries = 1;</div>
      <div className="bg-emerald-50 px-2.5 text-emerald-700">+ const retries = 3;</div>
    </div>
  );
}

function FlatHedge() {
  return (
    <p className="text-sm leading-relaxed text-stone-700">
      The deadline is likely Friday{' '}
      <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1 py-px align-middle font-mono text-[10px] uppercase text-amber-700">
        low confidence
      </span>
    </p>
  );
}

const moments = [
  { label: 'Thinking', Mock: FlatSpinner },
  { label: 'Context usage', Mock: FlatProgress },
  { label: 'Accepted diff', Mock: FlatDiff },
  { label: 'Low confidence', Mock: FlatHedge },
];

export default function Problem() {
  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <SectionHeading
          eyebrow="The problem"
          title={
            <>
              Every AI product ships the{' '}
              <em className="italic">same four moments.</em>
            </>
          }
          body="They're functional — plenty of kits already cover that version well. But visually they're interchangeable. Swap one product's spinner for another's and nobody would notice."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moments.map(({ label, Mock }) => (
            <div
              key={label}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
                {label}
              </div>
              <div className="mt-5 flex min-h-[64px] items-center">
                <Mock />
              </div>
              <div className="mt-5 text-xs text-stone-400">the default</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
