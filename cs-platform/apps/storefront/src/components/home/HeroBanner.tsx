/**
 * ═══════════════════════════════════════════════════════════════════
 * HeroBanner — Promotions Carousel
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/HeroBanner.tsx
 *
 * Full-width auto-rotating promotion carousel with comprehensive
 * accessibility support.
 *
 * ─── WCAG 2.2 AA COMPLIANCE ────────────────────────────────────
 *
 *   1.1.1   Non-text Content      Hero images are decorative (alt=""
 *                                   + aria-hidden). Text overlay conveys
 *                                   the promotion content.
 *
 *   1.4.3   Contrast (Minimum)    Gradient overlay (from-black/80)
 *                                   guarantees white text meets 4.5:1
 *                                   regardless of image brightness.
 *
 *   2.1.1   Keyboard              ArrowLeft/Right navigate slides.
 *                                   tabIndex={0} on container makes
 *                                   it focusable.
 *
 *   2.2.2   Pause, Stop, Hide     Auto-rotation pauses on hover AND
 *                                   focus. Visible ⏸/▶ button always
 *                                   available. prefers-reduced-motion
 *                                   disables autoplay + crossfade.
 *
 *   2.5.8   Target Size           All touch targets ≥ 44×44px. Dots
 *                                   use padding to extend hit area.
 *
 *   4.1.2   Name, Role, Value     role="region" + aria-roledescription
 *                                   ="carousel". Dots: role="tablist"
 *                                   / role="tab" + aria-selected.
 *                                   aria-live="polite" announces
 *                                   slide changes.
 *
 * ─── RESPONSIVE ─────────────────────────────────────────────────
 *
 *   h-[200px] (320px) → sm:h-[400px] → md:h-[480px]
 *   Text: text-xl → sm:text-3xl → md:text-5xl
 *   Subtitle hidden on mobile to conserve vertical space
 *   CTA button scales padding/font-size across breakpoints
 */

import { useId, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@cannasaas/ui';
import { useAutoplay } from '@/hooks';
import type { Promotion } from '@cannasaas/types';

interface HeroBannerProps {
  promotions: Promotion[];
}

export function HeroBanner({ promotions }: HeroBannerProps) {
  const navigate = useNavigate();
  const liveRegionId = useId();
  const autoplay = useAutoplay(promotions.length, 5000);

  if (promotions.length === 0) return null;

  const active = promotions[autoplay.activeIndex];

  /**
   * Keyboard handler for the carousel container.
   *   ArrowLeft  → previous slide
   *   ArrowRight → next slide
   * preventDefault stops the browser from scrolling horizontally.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      autoplay.prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      autoplay.next();
    }
  };

  return (
    <div
      /* ── ARIA landmark ──
         role="region" creates a navigable landmark for screen readers.
         aria-roledescription overrides the generic "region" announcement
         with the more specific "carousel". */
      role="region"
      aria-roledescription="carousel"
      aria-label="Current promotions"
      /* ── Keyboard ──
         tabIndex={0} makes the container focusable so ArrowLeft/Right
         work even before the user tabs to a child element. */
      tabIndex={0}
      onKeyDown={handleKeyDown}
      /* ── Autoplay pause triggers ──
         onFocusCapture/onBlurCapture use the capture phase so they fire
         when ANY descendant (CTA button, dot) receives/loses focus. */
      onMouseEnter={autoplay.onMouseEnter}
      onMouseLeave={autoplay.onMouseLeave}
      onFocusCapture={autoplay.onFocusCapture}
      onBlurCapture={autoplay.onBlurCapture}
      className="
        relative w-full overflow-hidden
        h-[200px] sm:h-[400px] md:h-[480px]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-primary focus-visible:ring-inset
      "
    >
      {/* ── SLIDES ──
          All slides render simultaneously with opacity transitions for
          smooth crossfade. Inactive slides are aria-hidden + pointer-
          events-none. */}
      {promotions.map((promo, idx) => {
        const isActive = idx === autoplay.activeIndex;

        return (
          <div
            key={promo.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Promotion ${idx + 1} of ${promotions.length}: ${promo.title}`}
            aria-hidden={!isActive}
            className={[
              'absolute inset-0',
              !isActive && 'pointer-events-none',
              // Crossfade — instant swap for reduced motion
              autoplay.prefersReducedMotion
                ? isActive ? 'opacity-100' : 'opacity-0'
                : `transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Background image — decorative (WCAG 1.1.1) */}
            <img
              src={promo.imageUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding={idx === 0 ? 'sync' : 'async'}
            />

            {/* Gradient overlay — guarantees 4.5:1 contrast (WCAG 1.4.3) */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
              aria-hidden="true"
            />

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12">
              <div className="mx-auto max-w-7xl">
                {promo.badge && (
                  <Badge variant="secondary" className="mb-2 sm:mb-3">
                    {promo.badge}
                  </Badge>
                )}

                <h2 className="text-xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight max-w-2xl">
                  {promo.title}
                </h2>

                {/* Subtitle hidden on mobile to conserve space */}
                {promo.subtitle && (
                  <p className="hidden sm:block mt-2 text-base md:text-lg text-white/80 max-w-xl">
                    {promo.subtitle}
                  </p>
                )}

                {promo.ctaText && promo.targetUrl && (
                  <button
                    onClick={() => navigate(promo.targetUrl!)}
                    className="
                      mt-3 sm:mt-4
                      px-4 sm:px-6 py-2.5 sm:py-3
                      min-h-[44px]
                      bg-primary text-primary-foreground
                      rounded-lg font-medium text-sm sm:text-base
                      hover:bg-primary/90
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-white focus-visible:ring-offset-2
                      focus-visible:ring-offset-black/50
                      transition-colors
                    "
                  >
                    {promo.ctaText}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Screen reader live region — announces slide changes politely */}
      <div id={liveRegionId} aria-live="polite" aria-atomic="true" className="sr-only">
        Showing promotion {autoplay.activeIndex + 1} of {promotions.length}: {active.title}
      </div>

      {/* Navigation controls (dots + pause button) */}
      {promotions.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex items-center justify-center gap-3">
          {/* Dot indicators — ARIA tablist/tab pattern */}
          <div role="tablist" aria-label="Promotion slides" className="flex items-center gap-1.5 sm:gap-2">
            {promotions.map((promo, idx) => {
              const isActive = idx === autoplay.activeIndex;
              return (
                <button
                  key={promo.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Promotion ${idx + 1}: ${promo.title}`}
                  /* Roving tabindex — only active dot is a Tab stop */
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    autoplay.goTo(idx);
                  }}
                  /* 44×44px touch target (WCAG 2.5.8) */
                  className="
                    min-w-[44px] min-h-[44px]
                    flex items-center justify-center
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-white rounded-full
                  "
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'block h-2.5 rounded-full transition-all duration-300',
                      isActive ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75',
                    ].join(' ')}
                  />
                </button>
              );
            })}
          </div>

          {/* Pause/Play toggle — WCAG 2.2.2 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              autoplay.togglePause();
            }}
            aria-label={autoplay.isPaused ? 'Play slideshow' : 'Pause slideshow'}
            className="
              min-w-[44px] min-h-[44px]
              flex items-center justify-center
              text-white/70 hover:text-white
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-white rounded-full
              transition-colors
            "
          >
            <span aria-hidden="true" className="text-lg">
              {autoplay.isPaused ? '▶' : '⏸'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
