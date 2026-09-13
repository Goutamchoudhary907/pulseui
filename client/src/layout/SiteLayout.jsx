import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from '../lib/Logo';

const AUTHOR_GITHUB = 'https://github.com/Goutamchoudhary907';

function Wordmark() {
  return (
    <Link to="/" className="pui-logo-link flex items-center gap-2 group">
      <Logo size={26} />
      <span className="font-display text-[22px] leading-none tracking-tight text-ink">
        Pulseui
      </span>
    </Link>
  );
}

const navClass = ({ isActive }) =>
  'text-sm transition-colors ' +
  (isActive ? 'text-ink' : 'text-stone-500 hover:text-ink');

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-paper/75 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Wordmark />
          <nav className="flex items-center gap-7">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/components" className={navClass}>
              Components
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 text-sm text-stone-500 max-w-xs leading-relaxed">
              Rare, physically-metaphored components for AI-native
              interfaces. Copy the file, own the code.
            </p>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
              Site
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-stone-600 hover:text-ink">Home</Link>
              </li>
              <li>
                <Link to="/components" className="text-stone-600 hover:text-ink">
                  Components
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200/70">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-stone-400">
            <span>© {new Date().getFullYear()} Pulseui</span>
            <span>
              Made with <span aria-label="love" className="text-red-500">♥</span> by{' '}
              <a href={AUTHOR_GITHUB} className="text-stone-600 hover:text-ink">
                Goutam
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
