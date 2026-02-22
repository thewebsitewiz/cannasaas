/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductGallery — Image Gallery with Thumbnails
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/ProductGallery.tsx
 *
 * Primary product image with a thumbnail strip below. Supports
 * keyboard navigation between thumbnails using the WAI-ARIA
 * tabs pattern (ArrowLeft/Right, Home, End).
 *
 * Layout:
 *   ┌──────────────────────────┐
 *   │                          │
 *   │    Main Image (1:1)      │
 *   │                          │
 *   ├──┬──┬──┬──┬──┬──────────┤
 *   │T1│T2│T3│T4│T5│          │
 *   └──┴──┴──┴──┴──┴──────────┘
 *
 * Accessibility (WCAG):
 *   - Main image has descriptive alt: "Blue Dream by GreenLeaf" (1.1.1)
 *   - Thumbnails: role="tablist" / role="tab" + aria-selected (4.1.2)
 *   - Roving tabindex — only active thumbnail is a Tab stop (2.1.1)
 *   - ArrowLeft/Right/Home/End keyboard navigation
 *   - focus-visible ring on thumbnails (2.4.7)
 *   - Fallback placeholder when no images (decorative, aria-hidden)
 *   - Images have explicit width/height to prevent CLS
 *   - First image: loading="eager" (likely LCP element)
 *
 * Responsive:
 *   - Main image: rounded-xl, full-width of container
 *   - Thumbnails: w-16 h-16 mobile → w-20 h-20 sm+
 *   - Thumbnail strip scrolls horizontally when many images
 */

import { useState, type KeyboardEvent } from 'react';
import type { ProductImage } from '@cannasaas/types';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1));
  const activeImage = images[safeIndex];

  /**
   * Keyboard navigation for thumbnails (WAI-ARIA tabs pattern).
   * ArrowLeft/Right cycle with wrap-around. Home/End jump to
   * first/last. Focus follows selection automatically.
   */
  const handleThumbnailKeyDown = (e: KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % images.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + images.length) % images.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = images.length - 1;
    }

    if (nextIndex !== null) {
      setActiveIndex(nextIndex);
      const thumbnails = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
      (thumbnails?.[nextIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Image — aspect-square reserves space to prevent CLS */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {activeImage ? (
          <img
            src={activeImage.url}
            alt={`${productName}${activeImage.altText ? ` — ${activeImage.altText}` : ''}`}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="sync"
            width={600}
            height={600}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl sm:text-8xl" aria-hidden="true">
            🌿
          </div>
        )}
      </div>

      {/* Thumbnails — only when 2+ images */}
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Product images"
          className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={image.id ?? idx}
                role="tab"
                aria-selected={isActive}
                aria-label={`View image ${idx + 1} of ${images.length}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => handleThumbnailKeyDown(e, idx)}
                className={`
                  flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20
                  rounded-lg overflow-hidden border-2
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary focus-visible:ring-offset-2
                  ${isActive
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-transparent opacity-60 hover:opacity-90'}
                `}
              >
                <img
                  src={image.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={80}
                  height={80}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
