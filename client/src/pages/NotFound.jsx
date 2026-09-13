import { Link } from 'react-router-dom';
import useTitle from '../lib/useTitle';

export default function NotFound() {
  useTitle('Not found');
  return (
    <div className="max-w-6xl mx-auto px-6 py-28 md:py-40 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">404</div>
      <h1 className="mt-4 font-display text-[44px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[56px]">
        Nothing here. <em className="italic">Yet.</em>
      </h1>
      <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-relaxed text-stone-600">
        That page doesn't exist — it may have been renamed. Every component lives under /components.
      </p>
      <div className="mt-9 flex items-center justify-center gap-3">
        <Link
          to="/components"
          className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-stone-800 transition-colors"
        >
          Browse components
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-stone-300 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
