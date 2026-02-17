/**
 * ═══════════════════════════════════════════════════════════════════
 * useMediaQuery
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/hooks/useMediaQuery.ts
 *
 * Generic CSS media query hook. Returns whether the given media query
 * string currently matches. Subscribes to changes so the return value
 * updates live (e.g., when the user resizes the browser or rotates
 * their device).
 *
 * Used by ProductCarousel to detect touch-vs-pointer devices and hide
 * scroll arrow buttons on touch screens (users swipe instead).
 *
 * @param query — CSS media query string, e.g. "(min-width: 768px)"
 *                or "(hover: hover) and (pointer: fine)"
 * @returns boolean — whether the query currently matches
 *
 * @example
 *   const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)');
 *   const isWide = useMediaQuery('(min-width: 1024px)');
 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Sync in case SSR hydration diverged from client state
    setMatches(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
