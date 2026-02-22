/**
 * @file ProductCarousel.tsx
 * @app apps/storefront
 *
 * Horizontally scrolling product carousel with previous/next navigation.
 *
 * Behaviour:
 *   - Smooth CSS scroll (scroll-behavior: smooth, overflow-x: scroll)
 *   - Prev/Next arrow buttons scroll by one card width (~280px)
 *   - Arrows hidden at scroll boundaries (no "Previous" at start)
 *   - Touch/trackpad swipe works natively via overflow-x: scroll
 *   - Snap points: scroll-snap-type x mandatory on container
 *
 * Accessibility:
 *   - <section> with aria-label (WCAG 1.3.1)
 *   - Prev/Next buttons: aria-controls targets the scroll container
 *   - Scroll container: role="list" (each card is role="listitem")
 *   - Disabled state on boundary buttons: aria-disabled (WCAG 4.1.2)
 *   - Reduced motion: disables scroll animation (WCAG 2.3.3)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { SkeletonCard } from '../ui/SkeletonCard';
import type { Product } from '../../types/storefront';

interface ProductCarouselProps {
  title: string;
  products: Product[] | undefined;
  isLoading?: boolean;
  /** aria-label for the <section> landmark */
  ariaLabel?: string;
}

const SCROLL_AMOUNT = 292; // ~280px card + 12px gap

export function ProductCarousel({
  title,
  products,
  isLoading = false,
  ariaLabel,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, products]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: dir === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: prefersReduced ? 'instant' : 'smooth',
    });
  };

  const sectionId = `carousel-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section aria-label={ariaLabel ?? title}>
      {/* Header row: title + nav arrows */}
      <div className="flex items-center justify-between mb-5">
        <h2 id={sectionId} className="text-xl font-bold text-stone-900">
          {title}
        </h2>
        <div className="flex items-center gap-1" role="group" aria-label="Carousel navigation">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-controls={`${sectionId}-scroll`}
            aria-label="Scroll left"
            aria-disabled={!canScrollLeft}
            disabled={!canScrollLeft}
            className={[
              'w-9 h-9 flex items-center justify-center rounded-full',
              'border transition-colors',
              canScrollLeft
                ? 'border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                : 'border-stone-100 text-stone-300 cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))]',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-controls={`${sectionId}-scroll`}
            aria-label="Scroll right"
            aria-disabled={!canScrollRight}
            disabled={!canScrollRight}
            className={[
              'w-9 h-9 flex items-center justify-center rounded-full',
              'border transition-colors',
              canScrollRight
                ? 'border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                : 'border-stone-100 text-stone-300 cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))]',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        id={`${sectionId}-scroll`}
        role="list"
        aria-labelledby={sectionId}
        aria-busy={isLoading}
        className={[
          'flex gap-3 overflow-x-auto',
          'scroll-snap-type-x-mandatory pb-2',
          'scrollbar-none', // hide scrollbar; nav via buttons
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        ].join(' ')}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} role="listitem" className="flex-shrink-0 w-[272px]" style={{ scrollSnapAlign: 'start' }}>
                <SkeletonCard />
              </div>
            ))
          : products?.map((product, i) => (
              <div key={product.id} role="listitem" className="flex-shrink-0 w-[272px]" style={{ scrollSnapAlign: 'start' }}>
                <ProductCard product={product} priority={i < 3} />
              </div>
            ))
        }
      </div>
    </section>
  );
}
