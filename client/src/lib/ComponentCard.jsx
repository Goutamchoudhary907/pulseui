import { useRef } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import useInView from './useInView';

function PreviewWell({ entry }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className="bg-dots flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/60 sm:h-60"
    >
      {inView && <Preview entry={entry} />}
    </div>
  );
}

function Preview({ entry }) {
  if (entry.preview) {
    const P = entry.preview;
    return <P />;
  }
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone-300"
          style={{ opacity: 1 - i * 0.28 }}
        />
      ))}
    </div>
  );
}

export default function ComponentCard({ entry, ...rest }) {
  const available = entry.status === 'available';

  const inner = (
    <div
      className={
        'group flex h-full flex-col rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all ' +
        (available
          ? 'hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_40px_-28px_rgba(124,58,237,0.35)]'
          : '')
      }
    >
      <PreviewWell entry={entry} />
      <div className="flex items-center justify-between gap-4 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <h3 className="font-display text-[22px] leading-none tracking-tight text-ink">
            {entry.name}
          </h3>
          <p className="mt-1.5 truncate text-sm text-stone-500">{entry.tagline}</p>
        </div>
        {available ? (
          <span className="shrink-0 text-sm text-violet-700 transition-transform group-hover:translate-x-0.5">Open →</span>
        ) : (
          <StatusBadge status={entry.status} />
        )}
      </div>
    </div>
  );

  return available ? (
    <Link to={`/components/${entry.slug}`} className="block h-full min-w-0" {...rest}>
      {inner}
    </Link>
  ) : (
    <div className="h-full min-w-0" {...rest}>
      {inner}
    </div>
  );
}
