import { useLayoutEffect } from 'react';

// Scroll reveal for the homepage. 
export default function useScrollReveal() {
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (els.length === 0) return;

    root.setAttribute('data-reveal-ready', '');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', '');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    for (const el of els) io.observe(el);

    return () => {
      io.disconnect();
      root.removeAttribute('data-reveal-ready');
      for (const el of els) el.removeAttribute('data-revealed');
    };
  }, []);
}
