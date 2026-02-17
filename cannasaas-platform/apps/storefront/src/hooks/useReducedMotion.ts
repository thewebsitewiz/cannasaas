/**
 * ═══════════════════════════════════════════════════════════════════
 * useReducedMotion
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/hooks/useReducedMotion.ts
 *
 * Returns `true` when the user's OS accessibility settings indicate
 * they prefer reduced motion:
 *
 *   macOS:    System Settings → Accessibility → Display → Reduce motion
 *   Windows:  Settings → Ease of Access → Display
 *   iOS:      Settings → Accessibility → Motion → Reduce Motion
 *
 * WCAG 2.2.2 mandates that auto-playing content can be paused. We go
 * further: when this returns true, we disable auto-advance AND crossfade
 * transitions entirely — instant slide swaps only.
 *
 * Subscribes to the `change` event so the value updates live if the
 * user toggles the setting while the page is open.
 *
 * @returns boolean — true if the user prefers reduced motion
 *
 * @example
 *   const prefersReduced = useReducedMotion();
 *   // Skip animations when true
 *   className={prefersReduced ? '' : 'transition-opacity duration-700'}
 */

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
