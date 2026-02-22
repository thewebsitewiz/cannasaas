/**
 * @file useIntersectionObserver.ts
 * @app apps/storefront
 *
 * Scroll-triggered visibility hook using the IntersectionObserver API.
 *
 * Used by:
 *   - HomePage sections (fade-in-on-scroll entrance animations)
 *   - ProductCard (lazy-load images only when visible)
 *   - Infinite scroll trigger (fire useInfiniteProducts.fetchNextPage)
 *
 * @param options - IntersectionObserver options (threshold, rootMargin)
 * @returns [ref, isIntersecting] — attach ref to target element
 *
 * @example
 *   const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 *   <section ref={ref} className={isVisible ? 'opacity-100' : 'opacity-0'}>
 */

import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Graceful degradation — not supported in all environments (e.g. SSR)
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        // Once visible, stop observing (for one-shot reveal animations)
        if (entry.isIntersecting && options.threshold !== 0) {
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isIntersecting];
}
