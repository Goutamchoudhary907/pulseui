import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

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

export default function ComponentCard({ entry }) {
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
      <div className="bg-dots flex h-40 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/60">
        <Preview entry={entry} />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[22px] leading-none tracking-tight text-ink">
            {entry.name}
          </h3>
          <StatusBadge status={entry.status} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {entry.description}
        </p>
        {available && (
          <div className="mt-auto pt-5 text-sm text-violet-700 transition-transform group-hover:translate-x-0.5">
            Open →
          </div>
        )}
      </div>
    </div>
  );

  return available ? (
    <Link to={`/components/${entry.slug}`} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}
