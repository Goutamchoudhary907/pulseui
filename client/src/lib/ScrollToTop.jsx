import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Start every route at the top. In-page anchors (#how-it-works) don't change
// the pathname, so they keep their native scroll behaviour.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
