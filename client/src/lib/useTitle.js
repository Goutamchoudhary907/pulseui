import { useEffect } from 'react';

// Sets document.title for a page; restores the base title on unmount.
const BASE = 'Pulse UI';

export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} — rare components for AI-native interfaces`;
    return () => {
      document.title = BASE;
    };
  }, [title]);
}
