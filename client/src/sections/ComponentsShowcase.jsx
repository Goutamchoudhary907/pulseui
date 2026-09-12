import { Link } from 'react-router-dom';
import { registry } from '../registry';
import ComponentCard from '../lib/ComponentCard';
import SectionHeading from '../lib/SectionHeading';

export default function ComponentsShowcase() {
  const built = registry.filter((c) => c.status === 'available').length;

  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="The library"
            title={
              <>
                Six moments. <em className="italic">One file each.</em>
              </>
            }
            body={
              built === registry.length
                ? `All ${built} built and ready. Every one is a single file you paste into your own repo — canvas, CSS and SVG filters, no dependencies.`
                : `${built} built, ${registry.length - built} on the roadmap. Every one is a single component you paste into your own repo.`
            }
          />
          <Link
            to="/components"
            className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-stone-300 transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {registry.map((c) => (
            <ComponentCard key={c.slug} entry={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
