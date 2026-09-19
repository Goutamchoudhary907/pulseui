import { Link } from 'react-router-dom';
import { registry } from '../registry';
import ComponentCard from '../lib/ComponentCard';
import SectionHeading from '../lib/SectionHeading';

const FEATURED = [
  'thinking-indicator',
  'agent-status',
  'context-meter',
  'tool-call',
  'file-chunker',
  'streaming-text',
];

export default function ComponentsShowcase() {
  const built = registry.filter((c) => c.status === 'available').length;
  const featured = FEATURED.map((slug) => registry.find((c) => c.slug === slug)).filter(Boolean);

  return (
    <section className="border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="The library"
            title={
              <>
                Real AI moments. <em className="italic">One file each.</em>
              </>
            }
            body={
              built === registry.length
                ? `Every one is a single file you paste into your own repo — canvas and CSS, no dependencies. Same size and place as the flat version it replaces.`
                : `${built} built, ${registry.length - built} on the roadmap. Every one is a single component you paste into your own repo.`
            }
          />
          <Link
            to="/components"
            className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-stone-300 transition-colors"
          >
            View all {registry.length} →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {featured.map((c, i) => (
            <ComponentCard
              key={c.slug}
              entry={c}
              data-reveal
              style={{ '--reveal-delay': `${(i % 2) * 90}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
