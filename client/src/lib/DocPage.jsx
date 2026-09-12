import { Link } from 'react-router-dom';
import CodeBlock from './CodeBlock';
import StatusBadge from './StatusBadge';

/**
 * Shared shell for every component docs page:
 * header → live preview (with floating controls) → usage + source → props.
 *
 * entry    registry entry (name, description, status, source)
 * meta     short mono string, e.g. "0 dependencies · canvas"
 * preview  the live component
 * controls node rendered in a floating pill at the bottom of the preview
 * usage    code string for the Usage block
 * props    [{ name, type, def, desc }]
 * previewClassName  extra classes on the preview well (e.g. min-height)
 */
export default function DocPage({
  entry,
  meta,
  preview,
  controls,
  usage,
  props = [],
  previewClassName = 'min-h-[380px]',
}) {
  const fileName = `${entry.file}.jsx`;
  const lines = entry.source.split('\n').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
      <Link
        to="/components"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink"
      >
        ← All components
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[44px] leading-none tracking-[-0.015em] text-ink sm:text-[56px]">
              {entry.name}
            </h1>
            <StatusBadge status={entry.status} />
          </div>
          <p className="mt-5 text-[16.5px] leading-relaxed text-stone-600">
            {entry.description}
          </p>
        </div>
        <div className="font-mono text-[11px] text-stone-400">
          {meta} · {lines} lines
        </div>
      </div>

      <section className="mt-12 rounded-3xl border border-stone-200 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div
          className={`bg-dots relative flex items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/60 ${previewClassName}`}
        >
          {preview}
          {controls && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {controls}
            </div>
          )}
        </div>
      </section>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-14">
          <section>
            <h2 className="font-display text-[28px] tracking-tight text-ink">Usage</h2>
            <div className="mt-5">
              <CodeBlock filename="Usage" code={usage} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-[28px] tracking-tight text-ink">Source</h2>
            <p className="mt-2 text-sm text-stone-600">
              The complete file — copy it as-is into{' '}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[12.5px]">
                src/components/{fileName}
              </code>
              .
            </p>
            <div className="mt-5">
              <CodeBlock filename={fileName} code={entry.source} />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
            Props
          </h2>
          <dl className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {props.map((p) => (
              <div key={p.name} className="px-4 py-3.5">
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[13px] text-ink">{p.name}</span>
                  <span className="font-mono text-[11px] text-stone-400">{p.type}</span>
                </dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-stone-600">
                  {p.desc}
                  {p.def !== undefined && (
                    <span className="mt-1 block font-mono text-[11px] text-stone-400">
                      default {p.def}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}

// Small shared segmented-control button for the floating controls pill.
export function PillButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        'whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ' +
        (active ? 'bg-ink text-white' : 'text-stone-600 hover:text-ink')
      }
    >
      {children}
    </button>
  );
}
