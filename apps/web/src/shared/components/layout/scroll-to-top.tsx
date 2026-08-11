import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset window scroll to top on every route change. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
