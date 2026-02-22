/**
 * ═══════════════════════════════════════════════════════════════════
 * useIntersectionObserver
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/hooks/useIntersectionObserver.ts
 *
 * Returns a [ref callback, isVisible] tuple. Once the observed element
 * enters the viewport, `isVisible` flips to `true` and the observer
 * disconnects (fire-once pattern to avoid wasted CPU).
 *
 * Uses a ref callback (not useRef) so it works correctly with elements
 * that mount conditionally or inside Suspense boundaries — the observer
 * attaches whenever the DOM node appears, not just on initial mount.
 *
 * Used for:
 *   1. Scroll-triggered entrance animations on <Section> components
 *   2. Lazy-loading the TrendingSection API call (defer fetch until
 *      the section enters the viewport)
 *
 * @param options.threshold  — fraction of element visible to trigger
 *                              (default 0.1 = 10%)
 * @param options.rootMargin — expand/shrink the trigger zone, e.g.
 *                              "200px" fires 200px before element
 *                              is visible (useful for prefetching)
 *
 * @returns [ref, isVisible]
 *   - ref: callback ref to attach to the target element
 *   - isVisible: boolean, true once the element has been seen
 *
 * @example
 *   const [ref, isVisible] = useIntersectionObserver({ rootMargin: '200px' });
 *   return <div ref={ref}>{isVisible && <ExpensiveComponent />}</div>;
 */

import { useCallback, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [ref: (node: HTMLElement | null) => void, isVisible: boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Destructure with defaults so the callback's dependency array
  // references stable primitives, not the options object itself.
  const { threshold = 0.1, rootMargin = '0px' } = options;

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      // Teardown: disconnect previous observer before creating a new one.
      // This handles cases where the observed element remounts (e.g.,
      // React strict mode double-mount in development).
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Fire-once: stop observing after first intersection.
            // The element has been "seen" — no need to keep watching.
            observerRef.current?.disconnect();
          }
        },
        { threshold, rootMargin },
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin],
  );

  return [setRef, isVisible];
}
