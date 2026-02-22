/**
 * ═══════════════════════════════════════════════════════════════════
 * useAutoplay
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/hooks/useAutoplay.ts
 *
 * Manages an auto-advancing index with full WCAG 2.2.2 compliance.
 * Extracted from HeroBanner so the carousel's rendering logic stays
 * pure and testable.
 *
 * Autoplay conditions — the timer only runs when ALL are true:
 *   ✓ There are 2+ items to cycle through
 *   ✓ The user hasn't clicked Pause
 *   ✓ The mouse isn't hovering over the carousel
 *   ✓ Keyboard focus isn't inside the carousel
 *   ✓ The user's OS hasn't requested reduced motion
 *
 * WCAG compliance:
 *   2.2.2 Pause, Stop, Hide — hover pause, focus pause, toggle button
 *   prefers-reduced-motion  — disables autoplay entirely
 *
 * @param itemCount — total number of items to cycle through
 * @param interval  — milliseconds between auto-advances (default 5000)
 *
 * @returns Object with:
 *   - activeIndex: current slide index
 *   - isPaused: whether manually paused
 *   - prefersReducedMotion: OS accessibility setting
 *   - goTo(i): jump to specific index
 *   - next(): advance to next (wraps)
 *   - prev(): go back (wraps)
 *   - togglePause(): toggle manual pause
 *   - onMouseEnter/Leave: hover handlers
 *   - onFocusCapture/BlurCapture: focus handlers (capture phase)
 *
 * @example
 *   const autoplay = useAutoplay(slides.length, 5000);
 *   <div
 *     onMouseEnter={autoplay.onMouseEnter}
 *     onMouseLeave={autoplay.onMouseLeave}
 *     onFocusCapture={autoplay.onFocusCapture}
 *     onBlurCapture={autoplay.onBlurCapture}
 *   >
 *     {slides[autoplay.activeIndex]}
 *     <button onClick={autoplay.togglePause}>
 *       {autoplay.isPaused ? '▶' : '⏸'}
 *     </button>
 *   </div>
 */

import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useAutoplay(itemCount: number, interval = 5000) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Timer only runs when ALL conditions are met
  const shouldAutoplay =
    itemCount > 1 &&
    !isPaused &&
    !isHovered &&
    !isFocused &&
    !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAutoplay) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % itemCount);
    }, interval);

    // Cleanup prevents memory leaks and stale closures when
    // itemCount or interval changes mid-lifecycle.
    return () => clearInterval(timer);
  }, [shouldAutoplay, itemCount, interval]);

  return {
    activeIndex,
    isPaused,
    prefersReducedMotion,

    /** Jump to a specific slide index */
    goTo: useCallback((i: number) => setActiveIndex(i), []),

    /** Advance to the next slide (wraps around to 0) */
    next: useCallback(
      () => setActiveIndex((p) => (p + 1) % itemCount),
      [itemCount],
    ),

    /** Go back to the previous slide (wraps around to last) */
    prev: useCallback(
      () => setActiveIndex((p) => (p - 1 + itemCount) % itemCount),
      [itemCount],
    ),

    /** Toggle the manual pause state */
    togglePause: useCallback(() => setIsPaused((p) => !p), []),

    /** Attach to onMouseEnter on the carousel container */
    onMouseEnter: useCallback(() => setIsHovered(true), []),

    /** Attach to onMouseLeave on the carousel container */
    onMouseLeave: useCallback(() => setIsHovered(false), []),

    /**
     * Attach to onFocusCapture on the carousel container.
     * Capture phase ensures it fires when ANY descendant (CTA button,
     * dot indicator) receives focus, not just the container itself.
     */
    onFocusCapture: useCallback(() => setIsFocused(true), []),

    /** Attach to onBlurCapture on the carousel container */
    onBlurCapture: useCallback(() => setIsFocused(false), []),
  };
}
