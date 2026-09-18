import { registry } from '../registry';
import ComponentCard from '../lib/ComponentCard';
import useTitle from '../lib/useTitle';

function Group({ title, items }) {
  if (items.length === 0) return null;
  return (
    <>
      <div className="mt-14 flex items-center gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
          {title}
        </h2>
        <div className="h-px flex-1 bg-stone-200" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {items.map((c) => (
          <ComponentCard key={c.slug} entry={c} />
        ))}
      </div>
    </>
  );
}

export default function ComponentsIndex() {
  useTitle('Components');
  const available = registry.filter((c) => c.status === 'available');
  const upcoming = registry.filter((c) => c.status !== 'available');

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
      <div className="max-w-2xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
          Components
        </div>
        <h1 className="mt-4 font-display text-[44px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[56px]">
          One file each. <em className="italic">Yours to keep.</em>
        </h1>
        <p className="mt-5 text-[16.5px] leading-relaxed text-stone-600">
          Preview a component live, then copy its source straight into your
          project. Zero dependencies — canvas, CSS and SVG filters only.
        </p>
      </div>

      <Group title={`Available · ${available.length}`} items={available} />
      <Group title="On the roadmap" items={upcoming} />
    </div>
  );
}
