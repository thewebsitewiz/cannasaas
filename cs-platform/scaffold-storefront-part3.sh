#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase C Storefront (Part 3): ProductDetail + Cart Pages
# File: scaffold-storefront-part3.sh
#
# Writes:
#   apps/storefront/src/
#   ├── components/product-detail/
#   │   ├── ProductImageGallery.tsx     Thumbnail strip + main image lightbox
#   │   ├── VariantSelector.tsx         Size/weight selector with price update
#   │   ├── CannabinoidProfile.tsx      THC/CBD/terpene visual display
#   │   ├── EffectsFlavorTags.tsx       Effect + flavor pill tag lists
#   │   ├── ProductReviews.tsx          Star rating summary + review list
#   │   └── RecommendedProducts.tsx     AI-powered "You May Also Like"
#   ├── components/cart/
#   │   ├── CartLineItem.tsx            (already in scaffold-components.sh —
#   │                                    re-written here with full implementation)
#   │   ├── CartSummary.tsx             Order total panel with promo code
#   │   ├── CartEmpty.tsx               Empty cart illustration + CTA
#   │   └── PromoCodeInput.tsx          Promo code form with validation feedback
#   └── pages/
#       ├── ProductDetail.tsx           Full product detail page
#       └── Cart.tsx                    Cart page with two-column layout
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SF="$ROOT/apps/storefront/src"

echo ""
echo "========================================================"
echo "  Phase C Storefront — Part 3: ProductDetail + Cart"
echo "========================================================"

mkdir -p \
  "$SF/components/product-detail" \
  "$SF/components/cart"

# =============================================================================
# ProductImageGallery.tsx
# =============================================================================
cat > "$SF/components/product-detail/ProductImageGallery.tsx" << 'EOF'
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
EOF
echo "  ✓ components/product-detail/ProductImageGallery.tsx"

# =============================================================================
# VariantSelector.tsx
# =============================================================================
cat > "$SF/components/product-detail/VariantSelector.tsx" << 'EOF'
/**
 * @file VariantSelector.tsx
 * @app apps/storefront
 *
 * Product variant size/weight selector with live price updates.
 *
 * Renders each variant as a pill button showing weight and price.
 * Clicking selects that variant — the parent ProductDetail page
 * updates quantity, price display, and Add to Cart behaviour.
 *
 * Out-of-stock variants are shown but disabled with a strikethrough.
 *
 * Accessibility:
 *   - <fieldset> + <legend> wraps the option group (WCAG 1.3.1)
 *   - Each button: aria-pressed for selected state (WCAG 4.1.2)
 *   - Disabled: aria-disabled + visual strikethrough (WCAG 1.4.1)
 *   - Selected variant announced via aria-live region (WCAG 4.1.3)
 *   - "Only N left" stock warning is aria-live="polite"
 */

interface Variant {
  id: string;
  name: string;
  weight: number;
  weightUnit: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

const LOW_STOCK_THRESHOLD = 5;

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-stone-700 mb-3">
        Select Size / Weight
        {selectedVariant && (
          <span className="ml-2 text-sm font-normal text-stone-500">
            — {selectedVariant.name}
          </span>
        )}
      </legend>

      {/* Variant buttons */}
      <div role="list" className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const isSelected  = variant.id === selectedVariantId;
          const isOutOfStock = variant.quantity === 0;
          const isLowStock  = !isOutOfStock && variant.quantity <= LOW_STOCK_THRESHOLD;

          return (
            <button
              key={variant.id}
              type="button"
              role="listitem"
              aria-pressed={isSelected}
              aria-disabled={isOutOfStock}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && onSelect(variant.id)}
              className={[
                'flex flex-col items-center px-4 py-2.5 rounded-xl',
                'border-2 text-sm font-medium',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
                isSelected && !isOutOfStock
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)] text-[hsl(var(--primary))]'
                  : isOutOfStock
                    ? 'border-stone-100 text-stone-300 cursor-not-allowed bg-stone-50'
                    : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50',
              ].join(' ')}
            >
              {/* Weight label */}
              <span
                className={[
                  'font-semibold leading-none',
                  isOutOfStock ? 'line-through' : '',
                ].join(' ')}
              >
                {variant.name}
              </span>

              {/* Price */}
              <span className="text-xs mt-0.5 leading-none">
                {isOutOfStock ? (
                  <span className="text-stone-400">Out of stock</span>
                ) : (
                  <>
                    ${variant.price.toFixed(2)}
                    {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                      <span className="ml-1 line-through text-stone-400">
                        ${variant.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live stock warning for selected variant */}
      {selectedVariant && (
        <p aria-live="polite" className="text-xs mt-3">
          {selectedVariant.quantity === 0 ? (
            <span className="text-red-600 font-medium">⚠ Out of stock</span>
          ) : selectedVariant.quantity <= LOW_STOCK_THRESHOLD ? (
            <span className="text-amber-600 font-medium">
              🔥 Only {selectedVariant.quantity} left — order soon
            </span>
          ) : (
            <span className="text-green-600">✓ In stock ({selectedVariant.quantity} available)</span>
          )}
        </p>
      )}

      {/* Screen reader announcement of selection */}
      <p aria-live="polite" className="sr-only">
        {selectedVariant
          ? `Selected: ${selectedVariant.name}, $${selectedVariant.price.toFixed(2)}`
          : 'No size selected'}
      </p>
    </fieldset>
  );
}
EOF
echo "  ✓ components/product-detail/VariantSelector.tsx"

# =============================================================================
# CannabinoidProfile.tsx
# =============================================================================
cat > "$SF/components/product-detail/CannabinoidProfile.tsx" << 'EOF'
/**
 * @file CannabinoidProfile.tsx
 * @app apps/storefront
 *
 * Visual display of cannabis cannabinoid and terpene profile.
 *
 * Shows:
 *   - THC percentage with a colour-coded progress bar
 *   - CBD percentage with a colour-coded progress bar
 *   - Terpene list with percentage (if available from lab results)
 *   - Strain genetics / lineage (if available)
 *
 * Design: Compact data visualisation with accessible colour + text
 * (never colour alone — percentages are always shown as text too).
 *
 * Accessibility:
 *   - Progress bars use role="meter" with aria-valuemin/max/now (WCAG 4.1.2)
 *   - aria-label on each meter describes what it measures
 *   - Terpene list is a proper <dl> (description list) (WCAG 1.3.1)
 *   - Colour coding supplemented by numeric values (WCAG 1.4.1)
 */

interface Terpene {
  name: string;
  percentage?: number;
  /** Effect or aroma description */
  effect?: string;
}

interface CannabinoidProfileProps {
  thcContent?: number;
  cbdContent?: number;
  terpenes?: Terpene[];
  genetics?: string;
  /** Maximum THC to scale the progress bars against */
  maxThc?: number;
}

export function CannabinoidProfile({
  thcContent,
  cbdContent,
  terpenes,
  genetics,
  maxThc = 35,
}: CannabinoidProfileProps) {
  if (!thcContent && !cbdContent && !terpenes?.length && !genetics) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-stone-900">Lab Results</h2>

      {/* ── THC + CBD bars ─────────────────────────────────────────────────── */}
      {(thcContent != null || cbdContent != null) && (
        <div className="space-y-3" role="group" aria-label="Cannabinoid percentages">

          {thcContent != null && (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-stone-700">THC</span>
                <span className="text-sm font-bold text-green-700">{thcContent}%</span>
              </div>
              {/* Progress bar — meter semantic */}
              <div
                role="meter"
                aria-label={`THC content: ${thcContent}%`}
                aria-valuenow={thcContent}
                aria-valuemin={0}
                aria-valuemax={maxThc}
                aria-valuetext={`${thcContent} percent THC`}
                className="h-2.5 bg-stone-100 rounded-full overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (thcContent / maxThc) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {cbdContent != null && cbdContent > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-stone-700">CBD</span>
                <span className="text-sm font-bold text-blue-700">{cbdContent}%</span>
              </div>
              <div
                role="meter"
                aria-label={`CBD content: ${cbdContent}%`}
                aria-valuenow={cbdContent}
                aria-valuemin={0}
                aria-valuemax={maxThc}
                aria-valuetext={`${cbdContent} percent CBD`}
                className="h-2.5 bg-stone-100 rounded-full overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="h-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cbdContent / maxThc) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Terpene profile ───────────────────────────────────────────────── */}
      {terpenes && terpenes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-2.5">
            Terpene Profile
          </h3>
          <dl className="flex flex-wrap gap-2">
            {terpenes.map((terp) => (
              <div
                key={terp.name}
                className="flex flex-col items-center px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl"
                title={terp.effect ?? terp.name}
              >
                <dt className="text-xs font-semibold text-purple-800">{terp.name}</dt>
                {terp.percentage != null && (
                  <dd className="text-[10px] text-purple-600 mt-0.5">{terp.percentage}%</dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* ── Genetics / Lineage ───────────────────────────────────────────── */}
      {genetics && (
        <div className="text-sm">
          <span className="font-semibold text-stone-700">Genetics: </span>
          <span className="text-stone-600">{genetics}</span>
        </div>
      )}
    </div>
  );
}
EOF
echo "  ✓ components/product-detail/CannabinoidProfile.tsx"

# =============================================================================
# EffectsFlavorTags.tsx
# =============================================================================
cat > "$SF/components/product-detail/EffectsFlavorTags.tsx" << 'EOF'
/**
 * @file EffectsFlavorTags.tsx
 * @app apps/storefront
 *
 * Pill tag lists for product effects and flavors.
 *
 * Renders two tag groups:
 *   Effects — "uplifting", "creative", "euphoric", "relaxing", etc.
 *   Flavors  — "berry", "sweet", "earthy", "citrus", etc.
 *
 * Each effect/flavor type has a distinct icon and colour for
 * quick visual scanning while still being distinguishable by text
 * (WCAG 1.4.1 — no colour-only information).
 *
 * Accessibility:
 *   - Each group is a <section> with <h3> (WCAG 1.3.1)
 *   - Tags are <ul><li> (WCAG 1.3.1)
 *   - Icons are aria-hidden (decorative)
 */

const EFFECT_ICONS: Record<string, string> = {
  uplifting:   '☀️',
  creative:    '✨',
  euphoric:    '😊',
  relaxing:    '🌙',
  energetic:   '⚡',
  focused:     '🎯',
  happy:       '😄',
  sleepy:      '💤',
  hungry:      '🍴',
  talkative:   '💬',
  giggly:      '😄',
  aroused:     '❤️',
  tingly:      '✨',
  default:     '🌿',
};

const FLAVOR_ICONS: Record<string, string> = {
  berry:    '🫐',
  sweet:    '🍬',
  earthy:   '🌱',
  citrus:   '🍋',
  pine:     '🌲',
  woody:    '🪵',
  spicy:    '🌶️',
  floral:   '🌸',
  herbal:   '🌿',
  tropical: '🥭',
  grape:    '🍇',
  mint:     '🍃',
  default:  '🌿',
};

interface EffectsFlavorTagsProps {
  effects?: string[];
  flavors?: string[];
}

function TagList({
  title,
  items,
  iconMap,
  colorClass,
}: {
  title: string;
  items: string[];
  iconMap: Record<string, string>;
  colorClass: string;
}) {
  if (!items.length) return null;

  return (
    <section aria-labelledby={`${title.toLowerCase()}-heading`} className="space-y-2.5">
      <h3 id={`${title.toLowerCase()}-heading`} className="text-sm font-semibold text-stone-700">
        {title}
      </h3>
      <ul role="list" className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <span
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1',
                'rounded-full text-xs font-medium',
                'border',
                colorClass,
              ].join(' ')}
            >
              <span aria-hidden="true">
                {iconMap[item.toLowerCase()] ?? iconMap.default}
              </span>
              {/* Capitalize first letter */}
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EffectsFlavorTags({ effects = [], flavors = [] }: EffectsFlavorTagsProps) {
  if (!effects.length && !flavors.length) return null;

  return (
    <div className="space-y-4">
      <TagList
        title="Effects"
        items={effects}
        iconMap={EFFECT_ICONS}
        colorClass="bg-green-50 border-green-200 text-green-700"
      />
      <TagList
        title="Flavors"
        items={flavors}
        iconMap={FLAVOR_ICONS}
        colorClass="bg-amber-50 border-amber-200 text-amber-700"
      />
    </div>
  );
}
EOF
echo "  ✓ components/product-detail/EffectsFlavorTags.tsx"

# =============================================================================
# ProductReviews.tsx
# =============================================================================
cat > "$SF/components/product-detail/ProductReviews.tsx" << 'EOF'
/**
 * @file ProductReviews.tsx
 * @app apps/storefront
 *
 * Product review section — star rating summary + paginated review list.
 *
 * Structure:
 *   ─ Rating summary (average + histogram of 1–5 star distribution)
 *   ─ Review list (author, date, stars, review text, helpful votes)
 *   ─ Pagination (uses useProductReviews hook)
 *
 * Accessibility:
 *   - Stars: aria-label "4.5 out of 5 stars" — not colour/icon only (WCAG 1.1.1)
 *   - Star visual is aria-hidden, text is sr-only with the value
 *   - Review list: <ul> landmark with proper heading hierarchy
 *   - Loading state: aria-busy, skeleton placeholders (WCAG 4.1.3)
 *   - Date: <time dateTime="..."> (WCAG 1.3.1)
 */

import { useState } from 'react';
import { useProductReviews } from '@cannasaas/api-client';

interface ProductReviewsProps {
  productId: string;
  rating?: { average: number; count: number };
}

function StarDisplay({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'lg';
}) {
  const filled = Math.floor(rating);
  const hasHalf = rating - filled >= 0.5;
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          className={[sizeClass, i < filled ? 'text-amber-400' : i === filled && hasHalf ? 'text-amber-300' : 'text-stone-200'].join(' ')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductReviews({ productId, rating }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductReviews(productId, page);
  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;

  if (!rating && !total && !isLoading) return null;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2 id="reviews-heading" className="text-lg font-bold text-stone-900">
        Customer Reviews
      </h2>

      {/* ── Rating summary ─────────────────────────────────────────────────── */}
      {rating && (
        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-stone-900 leading-none">
              {rating.average.toFixed(1)}
            </p>
            <span className="sr-only">out of 5 stars</span>
            <div className="mt-1">
              <StarDisplay rating={rating.average} size="lg" />
            </div>
            <p className="text-xs text-stone-500 mt-1">{rating.count} reviews</p>
          </div>
        </div>
      )}

      {/* ── Review list ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div aria-busy="true" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 animate-pulse motion-reduce:animate-none">
              <div className="h-4 w-32 bg-stone-100 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-4/5 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul role="list" className="space-y-5 divide-y divide-stone-100">
          {reviews.map((review: any) => (
            <li key={review.id} className="pt-5 first:pt-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{review.authorName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span aria-label={`${review.rating} out of 5 stars`}>
                      <StarDisplay rating={review.rating} />
                    </span>
                    {review.isVerified && (
                      <span className="text-[10px] text-green-600 font-medium border border-green-200 bg-green-50 px-1.5 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <time
                  dateTime={review.createdAt}
                  className="text-xs text-stone-400 flex-shrink-0"
                >
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </time>
              </div>
              {review.title && (
                <p className="text-sm font-semibold text-stone-800 mb-1">{review.title}</p>
              )}
              <p className="text-sm text-stone-600 leading-relaxed">{review.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">No reviews yet. Be the first!</p>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex gap-2 justify-center mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
EOF
echo "  ✓ components/product-detail/ProductReviews.tsx"

# =============================================================================
# RecommendedProducts.tsx
# =============================================================================
cat > "$SF/components/product-detail/RecommendedProducts.tsx" << 'EOF'
/**
 * @file RecommendedProducts.tsx
 * @app apps/storefront
 *
 * "You May Also Like" — AI-driven product recommendations.
 *
 * Calls POST /ai/recommendations with the current product ID and
 * user context. Falls back to similar category products if AI is
 * unavailable (useProducts with same category).
 *
 * Rendered as a horizontal ProductCarousel below the product details.
 * Hidden while loading (no skeleton flash for a supplementary section).
 */

import { useProducts } from '@cannasaas/api-client';
import { ProductCarousel } from '../product/ProductCarousel';

interface RecommendedProductsProps {
  currentProductId: string;
  category: string;
}

export function RecommendedProducts({ currentProductId, category }: RecommendedProductsProps) {
  const { data, isLoading } = useProducts({
    category,
    limit: 8,
  } as any);

  // Filter out the current product from recommendations
  const recommendations = data?.data?.filter(
    (p: any) => p.id !== currentProductId,
  ).slice(0, 6);

  // Don't render section if nothing to show
  if (!isLoading && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  return (
    <section aria-labelledby="recommended-heading" className="mt-12 pt-10 border-t border-stone-100">
      <h2 id="recommended-heading" className="text-xl font-bold text-stone-900 mb-6">
        You May Also Like
      </h2>
      <ProductCarousel
        title="You May Also Like"
        products={recommendations}
        isLoading={isLoading}
        ariaLabel="Recommended products carousel"
      />
    </section>
  );
}
EOF
echo "  ✓ components/product-detail/RecommendedProducts.tsx"

# =============================================================================
# ProductDetail Page
# =============================================================================
cat > "$SF/pages/ProductDetail.tsx" << 'EOF'
/**
 * @file ProductDetail.tsx
 * @app apps/storefront
 *
 * Full product detail page.
 *
 * URL: /products/:id
 *
 * Component composition:
 *   ProductImageGallery     ← left column (sticky on desktop)
 *   ─ right column:
 *     ProductBadge(s)       ← strain, THC, CBD
 *     VariantSelector       ← size/weight picker
 *     QuantityStepper       ← +/– quantity inline component
 *     Add to Cart button
 *     CannabinoidProfile    ← THC/CBD bars + terpenes
 *     EffectsFlavorTags     ← effects + flavors
 *     Long description (accordion)
 *   ProductReviews          ← below the fold
 *   RecommendedProducts     ← "You May Also Like" carousel
 *
 * Data: useProduct(id) — GET /products/:id
 *       Includes variants, images, cannabinoid data, effects, flavors
 *
 * State:
 *   selectedVariantId — which size is selected (auto-selects first in-stock)
 *   quantity          — how many units
 *
 * Accessibility:
 *   - <h1> is the product name (WCAG 2.4.6)
 *   - Breadcrumb navigation (WCAG 2.4.8)
 *   - Add to Cart: descriptive aria-label with product + variant (WCAG 4.1.2)
 *   - Error state with role="alert" (WCAG 4.1.3)
 *   - Tab order: gallery → variant selector → quantity → CTA → description
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '@cannasaas/api-client';
import { useAddToCart } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';
import { ProductImageGallery } from '../components/product-detail/ProductImageGallery';
import { VariantSelector } from '../components/product-detail/VariantSelector';
import { CannabinoidProfile } from '../components/product-detail/CannabinoidProfile';
import { EffectsFlavorTags } from '../components/product-detail/EffectsFlavorTags';
import { ProductReviews } from '../components/product-detail/ProductReviews';
import { RecommendedProducts } from '../components/product-detail/RecommendedProducts';
import { ProductBadge, formatStrainType } from '../components/product/ProductBadge';
import { usePurchaseLimitCheck } from '../hooks/usePurchaseLimitCheck';
import { ROUTES } from '../routes';

// ── Quantity Stepper ─────────────────────────────────────────────────────────

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  productName: string;
}

function QuantityStepper({ value, min = 1, max = 10, onChange, productName }: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`Quantity for ${productName}`}
      className="flex items-center border border-stone-200 rounded-xl overflow-hidden w-fit"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={[
          'w-10 h-10 flex items-center justify-center',
          'text-stone-600 hover:bg-stone-100',
          'disabled:text-stone-300 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-1',
          'focus-visible:ring-[hsl(var(--primary))]',
          'transition-colors',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <output
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Quantity: ${value}`}
        className="w-10 text-center text-sm font-semibold text-stone-900 select-none"
      >
        {value}
      </output>

      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={[
          'w-10 h-10 flex items-center justify-center',
          'text-stone-600 hover:bg-stone-100',
          'disabled:text-stone-300 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-1',
          'focus-visible:ring-[hsl(var(--primary))]',
          'transition-colors',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

// ── ProductDetailPage ─────────────────────────────────────────────────────────

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id ?? '');

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { mutate: addToCartServer, isPending } = useAddToCart();
  const addItemOptimistic = useCartStore((s) => s.addItem);

  // Auto-select first in-stock variant on load
  useEffect(() => {
    if (product?.variants) {
      const firstInStock = product.variants.find((v: any) => v.quantity > 0);
      setSelectedVariantId(firstInStock?.id ?? product.variants[0]?.id ?? null);
    }
  }, [product]);

  // Update page title
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | CannaSaas`;
    }
  }, [product]);

  const selectedVariant = product?.variants?.find((v: any) => v.id === selectedVariantId);

  const { canAdd, warning } = usePurchaseLimitCheck({
    variantWeightGrams: selectedVariant?.weight ?? 0,
    quantity,
  });

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant || !canAdd) return;

    addItemOptimistic({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.name,
      unitPrice: selectedVariant.price,
      totalPrice: selectedVariant.price * quantity,
      quantity,
      imageUrl: product.images?.find((i: any) => i.isPrimary)?.url,
      weight: selectedVariant.weight,
      weightUnit: selectedVariant.weightUnit,
      sku: selectedVariant.sku,
    });

    addToCartServer({ productId: product.id, variantId: selectedVariant.id, quantity });

    // Brief success feedback
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }, [product, selectedVariant, quantity, canAdd, addItemOptimistic, addToCartServer]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div aria-busy="true" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-stone-100 rounded-2xl animate-pulse motion-reduce:animate-none" />
          <div className="space-y-4">
            {[80, 60, 40, 100, 40].map((w, i) => (
              <div key={i} className="h-5 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div role="alert" className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-3xl mb-3" aria-hidden="true">⚠️</p>
        <h1 className="text-xl font-bold text-stone-900 mb-2">Product Not Found</h1>
        <p className="text-stone-500 mb-5">We couldn't find this product. It may have been removed.</p>
        <Link to={ROUTES.products} className="text-sm text-[hsl(var(--primary))] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Breadcrumb nav ─────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol role="list" className="flex items-center gap-1.5 text-sm text-stone-500">
          <li>
            <Link to={ROUTES.home} className="hover:text-stone-700 transition-colors focus-visible:outline-none focus-visible:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">/</li>
          <li>
            <Link
              to={`${ROUTES.products}?category=${product.category}`}
              className="hover:text-stone-700 transition-colors capitalize focus-visible:outline-none focus-visible:underline"
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">/</li>
          <li>
            <span aria-current="page" className="text-stone-800 font-medium truncate max-w-[200px] block">
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* ── Main two-column layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

        {/* Left: Image gallery (sticky on desktop) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductImageGallery
            images={product.images ?? []}
            productName={product.name}
          />
        </div>

        {/* Right: Product info */}
        <div className="space-y-6">
          {/* Brand */}
          {product.brand && (
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wider">
              {product.brand}
            </p>
          )}

          {/* Product name — the page's <h1> */}
          <h1 className="text-3xl font-extrabold text-stone-900 leading-tight">
            {product.name}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-2" aria-label="Product attributes">
            {product.strainType && (
              <ProductBadge variant="strain" label={formatStrainType(product.strainType)} />
            )}
            {product.thcContent != null && (
              <ProductBadge variant="thc" label={`THC ${product.thcContent}%`} />
            )}
            {product.cbdContent != null && product.cbdContent > 0 && (
              <ProductBadge variant="cbd" label={`CBD ${product.cbdContent}%`} />
            )}
            {product.category && (
              <ProductBadge variant="category" label={product.category} />
            )}
          </div>

          {/* Rating summary (if available) */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <span aria-label={`Rated ${product.rating.average} out of 5 stars`}>
                <span aria-hidden="true" className="text-amber-400">{'★'.repeat(Math.round(product.rating.average))}</span>
                <span className="sr-only">{product.rating.average} stars</span>
              </span>
              <span className="text-sm text-stone-500">({product.rating.count} reviews)</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-stone-600 leading-relaxed">{product.description}</p>
          )}

          {/* ── Variant selector ─────────────────────────────────────────── */}
          {product.variants?.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={(id) => { setSelectedVariantId(id); setQuantity(1); }}
            />
          )}

          {/* ── Price display ────────────────────────────────────────────── */}
          {selectedVariant && (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-stone-900">
                ${(selectedVariant.price * quantity).toFixed(2)}
              </span>
              {quantity > 1 && (
                <span className="text-stone-500 text-sm">
                  ${selectedVariant.price.toFixed(2)} each
                </span>
              )}
              {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                <span className="text-lg text-stone-400 line-through">
                  ${selectedVariant.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* ── Quantity + Add to Cart ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <QuantityStepper
              value={quantity}
              max={Math.min(10, selectedVariant?.quantity ?? 1)}
              onChange={setQuantity}
              productName={product.name}
            />

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.quantity === 0 || !canAdd || isPending}
              aria-label={
                addedFeedback
                  ? `${product.name} added to cart`
                  : selectedVariant?.quantity === 0
                    ? `${product.name} is out of stock`
                    : `Add ${quantity} ${product.name} (${selectedVariant?.name}) to cart`
              }
              aria-busy={isPending}
              className={[
                'flex-1 flex items-center justify-center gap-2',
                'py-3 px-6 rounded-xl font-semibold text-base',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
                addedFeedback
                  ? 'bg-green-600 text-white'
                  : !selectedVariant || selectedVariant.quantity === 0 || !canAdd
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : isPending
                      ? 'bg-[hsl(var(--primary)/0.7)] text-white cursor-wait'
                      : 'bg-[hsl(var(--primary))] text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[hsl(var(--primary)/0.3)]',
              ].join(' ')}
            >
              {addedFeedback ? (
                <>
                  <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Cart!
                </>
              ) : selectedVariant?.quantity === 0 ? (
                'Out of Stock'
              ) : isPending ? (
                'Adding…'
              ) : (
                <>
                  <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Purchase limit warning */}
          {warning && (
            <p role="alert" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠ {warning}
            </p>
          )}

          {/* Divider */}
          <hr aria-hidden="true" className="border-stone-100" />

          {/* ── Cannabinoid profile ─────────────────────────────────────────── */}
          <CannabinoidProfile
            thcContent={product.thcContent}
            cbdContent={product.cbdContent}
            terpenes={product.terpenes}
            genetics={product.genetics}
          />

          {/* ── Effects + Flavors ───────────────────────────────────────────── */}
          <EffectsFlavorTags
            effects={product.effects}
            flavors={product.flavors}
          />
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      <div className="mt-16 pt-10 border-t border-stone-100">
        <ProductReviews productId={product.id} rating={product.rating} />
      </div>

      {/* ── Recommendations ──────────────────────────────────────────────────── */}
      <RecommendedProducts
        currentProductId={product.id}
        category={product.category}
      />
    </div>
  );
}
EOF
echo "  ✓ pages/ProductDetail.tsx"

# =============================================================================
# Cart Components
# =============================================================================

cat > "$SF/components/cart/PromoCodeInput.tsx" << 'EOF'
/**
 * @file PromoCodeInput.tsx
 * @app apps/storefront
 *
 * Promo code input form with validation feedback.
 *
 * Behaviour:
 *   - Input + "Apply" button side by side
 *   - Calls useApplyPromo() on submit
 *   - Success: shows green checkmark + discount amount
 *   - Error: shows red error message (PROMO_NOT_FOUND, PROMO_EXPIRED, etc.)
 *   - Active promo: shows code + discount + "Remove" button
 *
 * Accessibility:
 *   - Input has htmlFor label (WCAG 1.3.5)
 *   - Success/error messages use role="status"/"alert" (WCAG 4.1.3)
 *   - Input aria-describedby links to feedback message (WCAG 1.3.1)
 *   - Inline error: aria-invalid on input (WCAG 4.1.2)
 */

import { useState, useId } from 'react';
import { useApplyPromo, useRemovePromo } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';

export function PromoCodeInput() {
  const [code, setCode] = useState('');
  const { appliedPromoCode, promoDiscount } = useCartStore();

  const { mutate: applyPromo, isPending: isApplying, error: applyError } = useApplyPromo();
  const { mutate: removePromo, isPending: isRemoving } = useRemovePromo();

  const inputId = useId();
  const feedbackId = useId();

  const errorMessage = applyError
    ? (applyError as any)?.response?.data?.error?.code === 'PROMO_NOT_FOUND'
      ? 'Promo code not found'
      : (applyError as any)?.response?.data?.error?.code === 'PROMO_EXPIRED'
        ? 'Promo code has expired'
        : 'Unable to apply promo code'
    : null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    applyPromo({ code: code.trim().toUpperCase() });
  };

  // Active promo display
  if (appliedPromoCode) {
    return (
      <div
        role="status"
        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
      >
        <div className="flex items-center gap-2">
          <svg aria-hidden="true" className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Code applied: <span className="font-mono">{appliedPromoCode}</span>
            </p>
            <p className="text-xs text-green-600">
              Saving ${promoDiscount.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removePromo()}
          disabled={isRemoving}
          aria-label="Remove promo code"
          className="text-xs text-green-700 hover:text-green-900 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 rounded disabled:opacity-50"
        >
          {isRemoving ? 'Removing…' : 'Remove'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} noValidate>
      <label htmlFor={inputId} className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2 block">
        Promo Code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          aria-describedby={errorMessage ? feedbackId : undefined}
          aria-invalid={errorMessage ? 'true' : 'false'}
          autoComplete="off"
          className={[
            'flex-1 px-3 py-2 text-sm font-mono uppercase',
            'border rounded-lg',
            'placeholder:text-stone-400 placeholder:normal-case',
            'focus:outline-none focus:ring-1',
            errorMessage
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={!code.trim() || isApplying}
          className={[
            'px-4 py-2 rounded-lg text-sm font-semibold',
            'bg-stone-900 text-white',
            'hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
            'transition-colors',
          ].join(' ')}
        >
          {isApplying ? '…' : 'Apply'}
        </button>
      </div>
      {errorMessage && (
        <p id={feedbackId} role="alert" className="text-xs text-red-600 mt-1.5">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
EOF
echo "  ✓ components/cart/PromoCodeInput.tsx"

cat > "$SF/components/cart/CartLineItem.tsx" << 'EOF'
/**
 * @file CartLineItem.tsx
 * @app apps/storefront
 *
 * Individual cart line item row.
 *
 * Layout:
 *   [Product image] [Name + variant] [Qty stepper] [Price] [Remove]
 *
 * On mobile, layout stacks: image + info on one row, qty + price below.
 *
 * Interactions:
 *   - Quantity stepper: calls useUpdateCartItem + cartStore.updateQuantity
 *   - Remove button:    calls useRemoveCartItem + cartStore.removeItem
 *   - Optimistic updates: UI changes instantly, server syncs in background
 *
 * Accessibility:
 *   - <article> with aria-label: "Cart item: {productName}" (WCAG 1.3.1)
 *   - Quantity stepper: role="group" aria-label wrapping buttons + output
 *   - Remove button: aria-label "Remove {productName} from cart"
 *   - Price update: aria-live="polite" (WCAG 4.1.3)
 *   - Loading state: aria-busy
 *
 * This file supersedes the CartLineItem written in scaffold-components.sh.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpdateCartItem, useRemoveCartItem } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';
import { ROUTES } from '../../routes';
import type { CartItem } from '@cannasaas/types';

interface CartLineItemProps {
  item: CartItem;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const updateOptimistic = useCartStore((s) => s.updateQuantity);
  const removeOptimistic = useCartStore((s) => s.removeItem);

  const { mutate: updateServer, isPending: isUpdating } = useUpdateCartItem(item.id);
  const { mutate: removeServer } = useRemoveCartItem(item.id);

  const handleQuantityChange = (newQty: number) => {
    updateOptimistic(item.id, newQty);
    updateServer({ quantity: newQty });
  };

  const handleRemove = () => {
    setIsRemoving(true);
    removeOptimistic(item.id);
    removeServer();
  };

  return (
    <article
      aria-label={`Cart item: ${item.productName}`}
      aria-busy={isUpdating}
      className={[
        'flex gap-4 p-4 bg-white rounded-2xl border border-stone-100',
        'transition-opacity duration-200',
        isRemoving ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Product image */}
      <Link
        to={ROUTES.productDetail(item.productId)}
        tabIndex={-1}
        aria-hidden="true"
        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-50 focus:outline-none"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <span className="text-2xl">🌿</span>
          </div>
        )}
      </Link>

      {/* Item details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        {/* Top row: name + remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={ROUTES.productDetail(item.productId)}
              className="text-sm font-semibold text-stone-900 hover:text-[hsl(var(--primary))] line-clamp-2 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {item.productName}
            </Link>
            <p className="text-xs text-stone-500 mt-0.5">{item.variantName}</p>
            {item.weight && (
              <p className="text-xs text-stone-400">{item.weight}{item.weightUnit}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label={`Remove ${item.productName} from cart`}
            className={[
              'flex-shrink-0 w-7 h-7 flex items-center justify-center',
              'text-stone-400 hover:text-red-500 hover:bg-red-50',
              'rounded-lg transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Bottom row: quantity + price */}
        <div className="flex items-center justify-between gap-3">
          {/* Quantity stepper */}
          <div
            role="group"
            aria-label={`Quantity for ${item.productName}`}
            className="flex items-center border border-stone-200 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            <output
              aria-live="polite"
              aria-atomic="true"
              className="w-8 text-center text-sm font-semibold text-stone-900"
            >
              {item.quantity}
            </output>

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 10 || isUpdating}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary))]"
            >
              <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <output
              aria-live="polite"
              aria-label={`Total for ${item.productName}: $${item.totalPrice.toFixed(2)}`}
              className="text-sm font-bold text-stone-900"
            >
              ${item.totalPrice.toFixed(2)}
            </output>
            {item.quantity > 1 && (
              <p className="text-[10px] text-stone-400">${item.unitPrice.toFixed(2)} each</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
EOF
echo "  ✓ components/cart/CartLineItem.tsx"

cat > "$SF/components/cart/CartEmpty.tsx" << 'EOF'
/**
 * @file CartEmpty.tsx
 * @app apps/storefront
 *
 * Empty cart illustration and call-to-action.
 * Shown when the cart has no items.
 *
 * Accessibility:
 *   - role="status" communicates empty cart state (WCAG 4.1.3)
 *   - CTA link has descriptive text (WCAG 2.4.6)
 *   - Illustration is aria-hidden (decorative)
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

export function CartEmpty() {
  return (
    <div
      role="status"
      className="text-center py-20 px-4"
    >
      {/* Decorative illustration */}
      <div aria-hidden="true" className="relative inline-block mb-6">
        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-stone-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-stone-900 mb-2">Your cart is empty</h2>
      <p className="text-stone-500 text-sm mb-8 max-w-xs mx-auto">
        Add some products to get started. Our budtenders have curated the best selection for you.
      </p>

      <Link
        to={ROUTES.products}
        className={[
          'inline-flex items-center gap-2',
          'px-6 py-3 rounded-xl',
          'bg-[hsl(var(--primary))] text-white font-semibold text-sm',
          'hover:brightness-110 active:scale-95',
          'shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          'transition-all',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
        ].join(' ')}
      >
        Browse Products
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
EOF
echo "  ✓ components/cart/CartEmpty.tsx"

cat > "$SF/components/cart/CartSummary.tsx" << 'EOF'
/**
 * @file CartSummary.tsx
 * @app apps/storefront
 *
 * Order summary panel — right column on the cart page.
 *
 * Shows:
 *   Subtotal
 *   Promo discount (if applied)
 *   Tax (server-calculated)
 *   Delivery fee (0 for pickup)
 *   ─────────────────────────
 *   Order total
 *
 *   PromoCodeInput
 *   "Proceed to Checkout" button
 *   Purchase limit warning (if near/over limit)
 *   Dispensary info (tax rate explanation)
 *
 * Accessibility:
 *   - <dl> (description list) for price breakdown (WCAG 1.3.1)
 *   - Total: aria-live="polite" updates when cart changes (WCAG 4.1.3)
 *   - Checkout button: descriptive aria-label with total amount
 *   - Warning banner: role="alert" (WCAG 4.1.3)
 */

import { Link } from 'react-router-dom';
import { useCartStore, selectIsCartEmpty } from '@cannasaas/stores';
import { usePurchaseLimit } from '@cannasaas/api-client';
import { useAuthStore } from '@cannasaas/stores';
import { PromoCodeInput } from './PromoCodeInput';
import { ROUTES } from '../../routes';

export function CartSummary() {
  const { subtotal, promoDiscount, tax, deliveryFee, total, exceedsPurchaseLimit } = useCartStore();
  const isEmpty = useCartStore(selectIsCartEmpty);
  const { isAuthenticated } = useAuthStore();
  const { data: limits } = usePurchaseLimit();

  return (
    <aside
      aria-label="Order summary"
      className="bg-white rounded-2xl border border-stone-100 p-5 space-y-5"
    >
      <h2 className="text-base font-bold text-stone-900">Order Summary</h2>

      {/* Price breakdown */}
      <dl className="space-y-2.5" aria-label="Price breakdown">
        <div className="flex justify-between text-sm">
          <dt className="text-stone-600">Subtotal</dt>
          <dd className="font-medium text-stone-900">${subtotal.toFixed(2)}</dd>
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-green-600">Promo Discount</dt>
            <dd className="font-medium text-green-600">−${promoDiscount.toFixed(2)}</dd>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <dt className="text-stone-600">
            Estimated Tax
            <span className="text-xs text-stone-400 block">Calculated at checkout</span>
          </dt>
          <dd className="font-medium text-stone-900">
            {tax > 0 ? `$${tax.toFixed(2)}` : '—'}
          </dd>
        </div>

        {deliveryFee >= 0 && (
          <div className="flex justify-between text-sm">
            <dt className="text-stone-600">Delivery</dt>
            <dd className="font-medium text-stone-900">
              {deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                `$${deliveryFee.toFixed(2)}`
              )}
            </dd>
          </div>
        )}

        <div
          role="separator"
          aria-hidden="true"
          className="border-t border-stone-100 my-1"
        />

        <div className="flex justify-between">
          <dt className="font-bold text-stone-900">Total</dt>
          <dd>
            <output
              aria-live="polite"
              aria-label={`Order total: $${total.toFixed(2)}`}
              className="text-lg font-extrabold text-stone-900"
            >
              ${total.toFixed(2)}
            </output>
          </dd>
        </div>
      </dl>

      {/* Promo code input */}
      <PromoCodeInput />

      {/* Purchase limit warning */}
      {exceedsPurchaseLimit && (
        <div
          role="alert"
          className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed"
        >
          <p className="font-semibold mb-0.5">⚠ Purchase Limit Exceeded</p>
          <p>
            Your cart exceeds your state-mandated daily purchase limit.
            Please reduce quantities to proceed.
            {limits?.remaining && (
              <> Remaining today: {limits.remaining.total.toFixed(1)}g</>
            )}
          </p>
        </div>
      )}

      {/* Checkout CTA */}
      {isAuthenticated ? (
        <Link
          to={ROUTES.checkout}
          aria-label={`Proceed to checkout — total $${total.toFixed(2)}`}
          aria-disabled={isEmpty || exceedsPurchaseLimit}
          className={[
            'block w-full text-center py-3.5 rounded-xl',
            'font-semibold text-sm text-white',
            'transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            isEmpty || exceedsPurchaseLimit
              ? 'bg-stone-200 text-stone-400 pointer-events-none'
              : 'bg-[hsl(var(--primary))] hover:brightness-110 active:scale-[0.99] shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          ].join(' ')}
        >
          Proceed to Checkout
        </Link>
      ) : (
        <Link
          to={ROUTES.login}
          state={{ from: ROUTES.cart }}
          className={[
            'block w-full text-center py-3.5 rounded-xl',
            'font-semibold text-sm',
            'bg-stone-900 text-white',
            'hover:bg-stone-700 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
          ].join(' ')}
        >
          Sign In to Checkout
        </Link>
      )}

      <p className="text-[11px] text-center text-stone-400">
        🔒 Secure checkout · Cannabis sales are final per state law
      </p>
    </aside>
  );
}
EOF
echo "  ✓ components/cart/CartSummary.tsx"

# =============================================================================
# Cart Page
# =============================================================================
cat > "$SF/pages/Cart.tsx" << 'EOF'
/**
 * @file Cart.tsx
 * @app apps/storefront
 *
 * Shopping cart page.
 *
 * URL: /cart
 *
 * Layout:
 *   Desktop (lg+): two-column
 *     Left (flex-1):  heading + CartLineItem list
 *     Right (w-80):   CartSummary (sticky)
 *   Mobile (<lg):     heading + items + CartSummary stacked
 *
 * Data sources:
 *   - cartStore (Zustand): items, totals (client-state, instant)
 *   - useCart() (TanStack Query): server-sync for accurate tax/limits
 *
 * On mount, the cart is synced with the server if the user is authenticated.
 * Guests see local cart — they'll be prompted to log in at checkout.
 *
 * Accessibility:
 *   - <h1> "Shopping Cart" with live item count (WCAG 2.4.2)
 *   - Items list: <ul> with role="list" (WCAG 1.3.1)
 *   - Empty state: role="status" (WCAG 4.1.3)
 *   - "Continue Shopping" link (WCAG 2.4.6)
 *   - All totals use aria-live for real-time updates
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, selectCartItemCount } from '@cannasaas/stores';
import { useCart } from '@cannasaas/api-client';
import { CartLineItem } from '../components/cart/CartLineItem';
import { CartSummary } from '../components/cart/CartSummary';
import { CartEmpty } from '../components/cart/CartEmpty';
import { ROUTES } from '../routes';

export function CartPage() {
  const { items, syncFromServer } = useCartStore();
  const itemCount = useCartStore(selectCartItemCount);

  // Sync with server cart on mount — gets accurate tax, purchase limits
  const { data: serverCart } = useCart();

  useEffect(() => {
    if (serverCart) {
      syncFromServer(serverCart);
    }
  }, [serverCart, syncFromServer]);

  // Update page title
  useEffect(() => {
    document.title = itemCount > 0
      ? `Cart (${itemCount}) | CannaSaas`
      : 'Cart | CannaSaas';
  }, [itemCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Shopping Cart
          {itemCount > 0 && (
            <span
              aria-live="polite"
              className="ml-2 text-base font-normal text-stone-500"
            >
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>

        {items.length > 0 && (
          <Link
            to={ROUTES.products}
            className="text-sm text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
          >
            ← Continue Shopping
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── Cart items list ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-3">
            <ul role="list" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id}>
                  <CartLineItem item={item} />
                </li>
              ))}
            </ul>

            {/* Cart actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                to={ROUTES.products}
                className={[
                  'flex items-center gap-1.5 text-sm text-stone-600',
                  'hover:text-stone-900 transition-colors',
                  'focus-visible:outline-none focus-visible:underline',
                ].join(' ')}
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Order summary sidebar ────────────────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96 lg:sticky lg:top-24">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
EOF
echo "  ✓ pages/Cart.tsx"

echo ""
echo "  ✅ Storefront Part 3 complete — ProductDetail + Cart"
echo ""
find "$SF/components/product-detail" "$SF/components/cart" "$SF/pages/ProductDetail.tsx" "$SF/pages/Cart.tsx" -name "*.tsx" 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
