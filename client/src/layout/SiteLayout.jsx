import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from '../lib/Logo';

const AUTHOR_GITHUB = 'https://github.com/Goutamchoudhary907';
const REPO_GITHUB = 'https://github.com/Goutamchoudhary907/pulseui';

function GitHubLink({ className = '' }) {
  return (
    <a
      href={REPO_GITHUB}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pulse UI on GitHub"
      className={'text-stone-500 transition-colors hover:text-ink ' + className}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
      </svg>
    </a>
  );
}

function Wordmark({ compact = false }) {
  return (
    <Link to="/" className="pui-logo-link flex items-center gap-2.5 group">
      <span
        className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: compact ? 'scale(0.85)' : 'none', transformOrigin: 'left center' }}
      >
        <Logo size={24} />
      </span>
      <span
        className="font-sans font-extrabold leading-none tracking-[-0.035em] text-ink transition-[font-size] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ fontSize: compact ? 17 : 20 }}
      >
        Pulse UI
      </span>
    </Link>
  );
}

const navClass = ({ isActive }) =>
  'text-sm transition-colors ' +
  (isActive ? 'text-ink' : 'text-stone-500 hover:text-ink');

const SCROLL_THRESHOLD = 24;

function useScrolled() {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > SCROLL_THRESHOLD,
  );
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return scrolled;
}

function Header() {
  const scrolled = useScrolled();
  return (
    <header className="sticky top-0 z-40 h-[76px] pointer-events-none">
      <div
        className={
          'pointer-events-auto flex items-center justify-between px-4 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
          (scrolled
            ? 'mx-4 sm:mx-auto mt-3 h-12 max-w-2xl rounded-full border border-stone-200/80 bg-white/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(28,25,23,0.18)] backdrop-blur-md'
            : 'mx-auto mt-0 h-16 max-w-6xl rounded-none border border-transparent bg-transparent shadow-none')
        }
      >
        <Wordmark compact={scrolled} />
        <nav className="flex items-center gap-4 sm:gap-7">
          <NavLink to="/" end className={(s) => 'hidden sm:inline ' + navClass(s)}>
            Home
          </NavLink>
          <NavLink to="/components" className={navClass}>
            Components
          </NavLink>
          <span className="h-4 w-px bg-stone-200" aria-hidden="true" />
          <GitHubLink className="flex" />
        </nav>
      </div>
    </header>
  );
}

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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
              <li>
                <a
                  href={REPO_GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-600 hover:text-ink"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200/70">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-stone-400">
            <span>© {new Date().getFullYear()} Pulse UI</span>
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
