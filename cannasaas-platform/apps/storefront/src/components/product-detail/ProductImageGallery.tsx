/**
 * @file ProductImageGallery.tsx
 * @app apps/storefront
 *
 * Product image gallery with main image and thumbnail strip.
 *
 * Layout:
 *   Desktop: Large main image (left) + vertical thumbnail strip (right of image)
 *   Mobile:  Horizontal swipeable main images + dot indicators below
 *
 * Features:
 *   - Click thumbnail → updates main image
 *   - Keyboard: Arrow keys navigate thumbnails (WCAG 2.1.1)
 *   - Touch: Swipe left/right on main image (mobile)
 *   - Images lazy-loaded except the first (above fold)
 *
 * Accessibility:
 *   - Main image: descriptive alt text per image (WCAG 1.1.1)
 *   - Thumbnail buttons: aria-label "View image {n} of {total}" (WCAG 4.1.2)
 *   - Selected thumbnail: aria-pressed="true" (WCAG 4.1.2)
 *   - Gallery region: role="region" aria-label="Product images"
 */

import { useState, useCallback, useRef } from 'react';

interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnailListRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedIndex];

  // Navigate thumbnails with arrow keys
  const handleThumbKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(index + 1, images.length - 1);
        setSelectedIndex(next);
        thumbnailListRef.current
          ?.querySelectorAll<HTMLButtonElement>('button')
          ?.[next]?.focus();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(index - 1, 0);
        setSelectedIndex(prev);
        thumbnailListRef.current
          ?.querySelectorAll<HTMLButtonElement>('button')
          ?.[prev]?.focus();
      }
    },
    [images.length],
  );

  // Touch swipe support
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return; // Ignore small movements
    if (dx < 0) setSelectedIndex((i) => Math.min(i + 1, images.length - 1));
    else setSelectedIndex((i) => Math.max(i - 1, 0));
  };

  if (!images.length) {
    return (
      <div
        className="aspect-square w-full bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl flex items-center justify-center"
        role="img"
        aria-label={`${productName} — no image available`}
      >
        <span aria-hidden="true" className="text-5xl">🌿</span>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Product images"
      className="flex flex-col sm:flex-row gap-3"
    >
      {/* ── Thumbnail strip (sm+: left column; xs: horizontal scroll below) ── */}
      {images.length > 1 && (
        <div
          ref={thumbnailListRef}
          role="list"
          aria-label="Image thumbnails"
          className={[
            // Desktop: vertical column to the left of main image
            'hidden sm:flex sm:flex-col sm:gap-2 sm:w-16',
          ].join(' ')}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              role="listitem"
              aria-label={`View image ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ''}`}
              aria-pressed={i === selectedIndex}
              onClick={() => setSelectedIndex(i)}
              onKeyDown={(e) => handleThumbKeyDown(e, i)}
              className={[
                'w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden',
                'border-2 transition-all',
                i === selectedIndex
                  ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary)/0.2)]'
                  : 'border-stone-200 hover:border-stone-300',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
            >
              <img
                src={img.url}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Main image ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div
          className="relative aspect-square w-full bg-stone-50 rounded-2xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            key={selectedImage.url} // Force re-render on image change
            src={selectedImage.url}
            alt={selectedImage.alt ?? `${productName} — product image`}
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-contain transition-opacity duration-150"
          />

          {/* Mobile dot indicators */}
          {images.length > 1 && (
            <div
              aria-hidden="true"
              className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:hidden"
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  className={[
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === selectedIndex
                      ? 'bg-[hsl(var(--primary))] w-3'
                      : 'bg-stone-300',
                  ].join(' ')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile thumbnail scroll */}
        {images.length > 1 && (
          <div
            role="list"
            aria-label="Image thumbnails"
            className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                role="listitem"
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-pressed={i === selectedIndex}
                onClick={() => setSelectedIndex(i)}
                className={[
                  'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden',
                  'border-2 transition-all',
                  i === selectedIndex
                    ? 'border-[hsl(var(--primary))]'
                    : 'border-stone-200',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[hsl(var(--primary))]',
                ].join(' ')}
              >
                <img src={img.url} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
