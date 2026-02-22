/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductCarousel — Render Prop Pattern
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/ProductCarousel.tsx
 *
 * Horizontal scrollable product list that accepts a `renderItem`
 * render prop. This lets the same scroll/snap/arrow logic be reused
 * for Featured, Trending, and New Arrivals with different card
 * treatments.
 *
 * Why Render Props over children?
 *   The carousel needs to pass `product` and `index` to each item.
 *   With children, we'd need cloneElement or Context. Render props
 *   make the data flow explicit and type-safe.
 *
 * Accessibility (WCAG):
 *   - role="region" with aria-label (navigable landmark)
 *   - Semantic <ul>/<li> list structure (1.3.1)
 *   - Arrow buttons with aria-label for screen readers
 *   - focus-visible ring on arrow buttons (2.4.7)
 *   - Arrows hidden on touch devices (users swipe)
 *
 * Responsive:
 *   Card widths: w-[220px] → sm:w-[260px] → md:w-[280px]
 *   Gap: gap-3 (12px) → sm:gap-4 (16px)
 *   scroll-snap-type: x mandatory for clean swipe stops
 *   Scrollbar hidden across all browsers
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { EmptyState } from '@cannasaas/ui';
import { useMediaQuery } from '@/hooks';
import type { Product } from '@cannasaas/types';

interface ProductCarouselProps {
  products: Product[];
  /** Render prop — receives each product and its 0-based index */
  renderItem: (product: Product, index: number) => ReactNode;
  /** Required aria-label for the carousel region (WCAG 2.4.6) */
  ariaLabel: string;
}

export function ProductCarousel({ products, renderItem, ariaLabel }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detect pointer device — hide arrow buttons on touch (users swipe)
  const hasHover = useMediaQuery('(hover: hover) and (pointer: fine)');

  /**
   * Recalculates whether the left/right arrows should render.
   * Called on mount, scroll, resize, and when products change.
   */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    // 1px buffer for sub-pixel rendering differences
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, products.length]);

  /** Scroll by ~80% of the visible container width */
  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  }, []);

  if (products.length === 0) {
    return <EmptyState message="No products available" />;
  }

  return (
    <div className="relative group" role="region" aria-label={ariaLabel}>

      {/* Left scroll arrow — only on hover-capable devices */}
      {hasHover && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full
            bg-background/90 border border-border shadow-md
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            focus-visible:opacity-100
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            transition-opacity duration-200
          "
        >
          <span aria-hidden="true">←</span>
        </button>
      )}

      {/* Scrollable product list — semantic <ul>/<li> (WCAG 1.3.1) */}
      <ul
        ref={scrollRef}
        role="list"
        className="
          flex gap-3 sm:gap-4
          overflow-x-auto scroll-smooth
          snap-x snap-mandatory
          -mx-4 px-4
          list-none p-0 m-0
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className="flex-shrink-0 snap-start w-[220px] sm:w-[260px] md:w-[280px]"
          >
            {renderItem(product, index)}
          </li>
        ))}
      </ul>

      {/* Right scroll arrow */}
      {hasHover && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="
            absolute right-0 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full
            bg-background/90 border border-border shadow-md
            flex items-center justify-center
            opacity-0 group-hover:opacity-100
            focus-visible:opacity-100
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            transition-opacity duration-200
          "
        >
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
