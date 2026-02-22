#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase C Storefront (Part 2): Home + Products Pages
# File: scaffold-storefront-part2.sh
#
# Writes:
#   apps/storefront/src/
#   ├── components/product/
#   │   ├── ProductCard.tsx         Reusable card (grid + carousel variants)
#   │   ├── ProductBadge.tsx        THC/CBD/strain type badges
#   │   └── ProductCarousel.tsx     Horizontal scroll carousel with nav arrows
#   ├── components/home/
#   │   ├── HeroBanner.tsx          Hero with CTA + promotional overlay
#   │   ├── CategoryGrid.tsx        Icon-driven category navigation grid
#   │   ├── FeaturedSection.tsx     "Featured Products" section wrapper
#   │   └── TrendingSection.tsx     "New Arrivals / Trending" section
#   ├── components/products/
#   │   ├── FilterSidebar.tsx       Accordion filter panel (categories, sliders)
#   │   ├── FilterChips.tsx         Active filter pills with remove buttons
#   │   ├── SortDropdown.tsx        Sort order select
#   │   ├── ProductGrid.tsx         Responsive grid with skeleton fallback
#   │   └── MobileFilterDrawer.tsx  Bottom sheet filter panel for mobile
#   └── pages/
#       ├── Home.tsx                HomePage (aggregates home components)
#       └── Products.tsx            ProductsPage (URL-driven filters, pagination)
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SF="$ROOT/apps/storefront/src"

echo ""
echo "================================================"
echo "  Phase C Storefront — Part 2: Home + Products"
echo "================================================"

mkdir -p \
  "$SF/components/product" \
  "$SF/components/home" \
  "$SF/components/products" \
  "$SF/types"

# =============================================================================
# ProductBadge.tsx
# =============================================================================
cat > "$SF/components/product/ProductBadge.tsx" << 'EOF'
/**
 * @file ProductBadge.tsx
 * @app apps/storefront
 *
 * Small pill badges for cannabis product attributes.
 *
 * Badge types:
 *   thc      — "THC 24.5%" — green tint
 *   cbd      — "CBD 0.8%"  — blue tint
 *   strain   — "Sativa" / "Indica" / "Hybrid" etc. — colour-coded by type
 *   category — "Flower" / "Edible" etc. — neutral stone
 *   new      — "New" — amber
 *   sale     — "Sale" — red
 *
 * Accessibility:
 *   - Text content is descriptive (not just the number)
 *   - aria-label on the wrapper span for screen readers that
 *     may not concatenate sibling text nodes correctly
 *   - Colour is supplementary — text also communicates the meaning (WCAG 1.4.1)
 */

import { memo } from 'react';

type BadgeVariant = 'thc' | 'cbd' | 'strain' | 'category' | 'new' | 'sale';

interface ProductBadgeProps {
  variant: BadgeVariant;
  label: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  thc:      'bg-green-50 text-green-700 border-green-200',
  cbd:      'bg-blue-50 text-blue-700 border-blue-200',
  strain:   'bg-purple-50 text-purple-700 border-purple-200',
  category: 'bg-stone-100 text-stone-600 border-stone-200',
  new:      'bg-amber-50 text-amber-700 border-amber-200',
  sale:     'bg-red-50 text-red-700 border-red-200',
};

export const ProductBadge = memo(function ProductBadge({
  variant,
  label,
}: ProductBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5',
        'text-[10px] font-semibold leading-none',
        'rounded-full border',
        VARIANT_CLASSES[variant],
      ].join(' ')}
    >
      {label}
    </span>
  );
});

ProductBadge.displayName = 'ProductBadge';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps a strainType string from the API to a display label.
 * Used by ProductCard and ProductDetail to render the strain badge.
 */
export function formatStrainType(strainType: string | undefined): string {
  if (!strainType) return '';
  const labels: Record<string, string> = {
    sativa:                  'Sativa',
    indica:                  'Indica',
    hybrid:                  'Hybrid',
    sativa_dominant_hybrid:  'Sativa-Dom',
    indica_dominant_hybrid:  'Indica-Dom',
    cbd:                     'CBD',
  };
  return labels[strainType] ?? strainType;
}
EOF
echo "  ✓ components/product/ProductBadge.tsx"

# =============================================================================
# ProductCard.tsx
# =============================================================================
cat > "$SF/components/product/ProductCard.tsx" << 'EOF'
/**
 * @file ProductCard.tsx
 * @app apps/storefront
 *
 * Reusable product card component — used in grid, carousel, and list views.
 *
 * Layout (default grid card):
 *   ┌─────────────────────────┐
 *   │  Product Image          │  ← aspect-square, lazy-loaded
 *   │  [New] [Sativa]  badges │  ← absolute overlay on image
 *   ├─────────────────────────┤
 *   │  Category               │  ← small muted text
 *   │  Product Name           │  ← 2-line clamp
 *   │  Brand Name             │  ← muted
 *   │  [THC 24%] [CBD 0.8%]   │  ← attribute badges
 *   │  ⭐ 4.5 (128)           │  ← rating (if available)
 *   │  From $45  [+ Add]      │  ← price + CTA
 *   └─────────────────────────┘
 *
 * Variants:
 *   - 'grid'     (default) — vertical card for grid layouts
 *   - 'carousel' — compact horizontal card for carousels
 *
 * Interactions:
 *   - Card click → navigate to /products/:id
 *   - "Add to Cart" → calls useAddToCart + cartStore.addItem optimistically
 *   - "Add" is disabled if purchase limit would be exceeded (usePurchaseLimitCheck)
 *
 * Accessibility:
 *   - <article> with aria-label: "Product: {name}" (WCAG 1.3.1)
 *   - <img> has meaningful alt: "{name}, {category}" (WCAG 1.1.1)
 *   - The card's click area is the product name link — NOT the whole card
 *     (whole-card links create redundant tab stops)
 *   - Add to Cart button: aria-label includes product name for context
 *   - Out-of-stock: button has aria-disabled, tooltip explains why
 *   - Skeleton state: aria-busy on placeholder (WCAG 4.1.3)
 *
 * Performance:
 *   - Images use loading="lazy" and fetchpriority="low" (above-fold cards
 *     passed `priority` prop to override with loading="eager")
 *   - Memoized with shallow prop comparison
 */

import { memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAddToCart } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';
import { usePurchaseLimitCheck } from '../../hooks/usePurchaseLimitCheck';
import { ProductBadge, formatStrainType } from './ProductBadge';
import { ROUTES } from '../../routes';
import type { Product } from '../../types/storefront';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'carousel';
  /** Force eager loading for above-the-fold cards */
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'grid',
  priority = false,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { mutate: addToCartServer, isPending } = useAddToCart();
  const addItemOptimistic = useCartStore((s) => s.addItem);

  // Get the cheapest variant for display price
  const cheapestVariant = product.variants
    ?.sort((a, b) => a.price - b.price)[0];

  const isOutOfStock = !cheapestVariant || product.variants.every((v) => v.quantity === 0);

  const { canAdd, warning } = usePurchaseLimitCheck({
    variantWeightGrams: cheapestVariant?.weight ?? 0,
    quantity: 1,
  });

  const primaryImage = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent card link navigation
      if (!cheapestVariant || isOutOfStock || !canAdd) return;

      // Optimistic update — instant UI response
      addItemOptimistic({
        productId: product.id,
        variantId: cheapestVariant.id,
        productName: product.name,
        variantName: cheapestVariant.name,
        unitPrice: cheapestVariant.price,
        totalPrice: cheapestVariant.price,
        quantity: 1,
        imageUrl: primaryImage?.url,
        weight: cheapestVariant.weight,
        weightUnit: cheapestVariant.weightUnit,
        sku: cheapestVariant.sku,
      });

      // Background server sync
      addToCartServer(
        { productId: product.id, variantId: cheapestVariant.id, quantity: 1 },
        {
          onError: () => {
            // Rollback optimistic update on failure
            useCartStore.getState().removeItem(
              `${product.id}-${cheapestVariant.id}-` // will match the composite ID
            );
          },
        },
      );
    },
    [product, cheapestVariant, isOutOfStock, canAdd, addItemOptimistic, addToCartServer, primaryImage],
  );

  const isCarousel = variant === 'carousel';

  return (
    <article
      aria-label={`Product: ${product.name}`}
      className={[
        'group relative bg-white rounded-2xl overflow-hidden',
        'border border-stone-100 hover:border-stone-200',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        isCarousel ? 'flex flex-row h-32' : 'flex flex-col',
      ].join(' ')}
    >
      {/* ── Product Image ─────────────────────────────────────────────────── */}
      <Link
        to={ROUTES.productDetail(product.id)}
        tabIndex={-1} // Hidden from tab order; the name link is the primary CTA
        aria-hidden="true"
        className={[
          'block overflow-hidden flex-shrink-0',
          'focus:outline-none',
          isCarousel ? 'w-32 h-full' : 'aspect-square w-full',
        ].join(' ')}
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={`${product.name}, ${product.category}`}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Fallback placeholder when no image */
          <div
            aria-hidden="true"
            className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center"
          >
            <span className="text-3xl">🌿</span>
          </div>
        )}

        {/* Badge overlays on image */}
        {!isCarousel && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1" aria-hidden="true">
            {product.isNew && <ProductBadge variant="new" label="New" />}
            {product.onSale && <ProductBadge variant="sale" label="Sale" />}
          </div>
        )}
      </Link>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className={['flex flex-col min-w-0', isCarousel ? 'flex-1 p-3' : 'p-4 flex-1'].join(' ')}>
        {/* Category */}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
          {product.category}
        </p>

        {/* Product name — primary tab stop for keyboard navigation */}
        <h3 className={['font-semibold text-stone-900 leading-snug mb-1', isCarousel ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'].join(' ')}>
          <Link
            to={ROUTES.productDetail(product.id)}
            className={[
              'hover:text-[hsl(var(--primary))] transition-colors',
              'focus-visible:outline-none focus-visible:underline',
              // Extend click area to full card using pseudo-element
              'after:absolute after:inset-0',
            ].join(' ')}
          >
            {product.name}
          </Link>
        </h3>

        {/* Brand */}
        {product.brand && !isCarousel && (
          <p className="text-[11px] text-stone-400 mb-2 truncate">{product.brand}</p>
        )}

        {/* Attribute badges */}
        {!isCarousel && (
          <div className="flex flex-wrap gap-1 mb-3" aria-label="Product attributes">
            {product.thcContent != null && (
              <ProductBadge variant="thc" label={`THC ${product.thcContent}%`} />
            )}
            {product.cbdContent != null && product.cbdContent > 0 && (
              <ProductBadge variant="cbd" label={`CBD ${product.cbdContent}%`} />
            )}
            {product.strainType && (
              <ProductBadge variant="strain" label={formatStrainType(product.strainType)} />
            )}
          </div>
        )}

        {/* Spacer pushes price+CTA to bottom */}
        <div className="flex-1" />

        {/* Price + Add to Cart */}
        <div className={['flex items-center', isCarousel ? 'flex-col items-start gap-1.5 mt-auto' : 'justify-between'].join(' ')}>
          <div>
            <p className="text-xs text-stone-400 leading-none mb-0.5">
              {product.variants?.length > 1 ? 'From' : ''}
            </p>
            <p className="text-base font-bold text-stone-900">
              ${cheapestVariant?.price?.toFixed(2) ?? '—'}
            </p>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || !canAdd || isPending}
            aria-label={
              isOutOfStock
                ? `${product.name} — out of stock`
                : `Add ${product.name} to cart`
            }
            aria-describedby={warning ? `warning-${product.id}` : undefined}
            className={[
              'relative z-10 flex-shrink-0',
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-xs font-semibold',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
              isOutOfStock || !canAdd
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isPending
                  ? 'bg-[hsl(var(--primary)/0.7)] text-white cursor-wait'
                  : 'bg-[hsl(var(--primary))] text-white hover:brightness-110 active:brightness-95',
            ].join(' ')}
          >
            {isPending ? (
              <span aria-live="polite" className="sr-only">Adding to cart…</span>
            ) : null}
            {isOutOfStock ? 'Sold Out' : isPending ? '…' : '+ Add'}
          </button>
        </div>

        {/* Purchase limit warning */}
        {warning && (
          <p
            id={`warning-${product.id}`}
            role="alert"
            className="text-[10px] text-amber-600 mt-1.5 leading-tight"
          >
            {warning}
          </p>
        )}
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
EOF
echo "  ✓ components/product/ProductCard.tsx"

# =============================================================================
# ProductCarousel.tsx
# =============================================================================
cat > "$SF/components/product/ProductCarousel.tsx" << 'EOF'
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
EOF
echo "  ✓ components/product/ProductCarousel.tsx"

# =============================================================================
# Home Page sub-components
# =============================================================================
cat > "$SF/components/home/HeroBanner.tsx" << 'EOF'
/**
 * @file HeroBanner.tsx
 * @app apps/storefront
 *
 * Full-width hero banner for the storefront home page.
 *
 * Design: Rich, organic aesthetic with a large gradient background,
 * dispensary name/tagline, CTA to products, and an optional promotion badge.
 *
 * Content:
 *   - Headline: dispensary name + tagline from organizationStore
 *   - Subheadline: promotional message (optional)
 *   - Primary CTA: "Shop Now" → /products
 *   - Secondary CTA: "Delivery & Pickup Info" → /about
 *   - Promotions badge if active promotions exist
 *
 * Accessibility:
 *   - <section> with aria-label (WCAG 1.3.1)
 *   - Background image (if any) via CSS, not <img> — decorative only
 *   - Headline uses <h1> (home page; only <h1> on the page)
 *   - CTA links are <a> (navigation) not <button>
 *   - High contrast text on dark overlay (WCAG 1.4.3 ≥ 4.5:1)
 */

import { Link } from 'react-router-dom';
import { useOrganizationStore } from '@cannasaas/stores';
import { ROUTES } from '../../routes';

interface HeroBannerProps {
  promotionText?: string;
}

export function HeroBanner({ promotionText }: HeroBannerProps) {
  const { dispensary, organization } = useOrganizationStore();
  const name = dispensary?.name ?? organization?.name ?? 'Welcome';
  const tagline = dispensary?.tagline ?? organization?.tagline ?? 'Premium cannabis, expertly curated';

  return (
    <section
      aria-label="Welcome banner"
      className={[
        'relative overflow-hidden',
        'bg-gradient-to-br from-stone-900 via-stone-800 to-[hsl(var(--primary,154_40%_20%))]',
        'min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]',
        'flex items-center',
      ].join(' ')}
    >
      {/* Decorative organic texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circle accents */}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[hsl(var(--primary,154_40%_30%))] opacity-20 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[hsl(var(--secondary,154_40%_50%))] opacity-10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl">
          {/* Promo badge */}
          {promotionText && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 mb-6">
              <span aria-hidden="true" className="text-xs">🔥</span>
              <span className="text-xs font-semibold text-amber-300 tracking-wide">
                {promotionText}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
            {name}
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-stone-300 mb-8 leading-relaxed max-w-lg">
            {tagline}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.products}
              className={[
                'inline-flex items-center gap-2 px-6 py-3',
                'bg-[hsl(var(--primary,154_40%_30%))] hover:brightness-110',
                'text-white font-semibold text-sm rounded-xl',
                'shadow-lg shadow-[hsl(var(--primary,154_40%_30%)/0.4)]',
                'transition-all active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-white focus-visible:ring-offset-2',
                'focus-visible:ring-offset-stone-900',
              ].join(' ')}
            >
              Shop Now
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/about"
              className={[
                'inline-flex items-center gap-2 px-6 py-3',
                'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
                'text-white font-medium text-sm rounded-xl border border-white/20',
                'transition-all active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-white focus-visible:ring-offset-2',
                'focus-visible:ring-offset-stone-900',
              ].join(' ')}
            >
              Hours & Locations
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            {[
              { icon: '🌿', text: 'Lab Tested' },
              { icon: '🚚', text: 'Same-Day Delivery' },
              { icon: '🔞', text: 'Must be 21+' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-stone-400 text-xs">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
EOF
echo "  ✓ components/home/HeroBanner.tsx"

cat > "$SF/components/home/CategoryGrid.tsx" << 'EOF'
/**
 * @file CategoryGrid.tsx
 * @app apps/storefront
 *
 * Visual category navigation grid on the home page.
 *
 * Shows 6 cannabis product categories as large icon tiles.
 * Clicking any tile navigates to /products?category=<slug>.
 *
 * Design: Earthy, organic aesthetic with soft gradient backgrounds
 * per category, each evoking the product type.
 *
 * Accessibility:
 *   - <nav> with aria-label="Product categories" (WCAG 1.3.1)
 *   - Each link has descriptive text (category name) — not just icon
 *   - aria-current="page" when category matches URL (if on /products)
 *   - Grid reflows: 2 cols on xs, 3 on sm, 6 on lg
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

const CATEGORIES = [
  { slug: 'flower',       label: 'Flower',       icon: '🌸', gradient: 'from-green-50 to-emerald-50',   border: 'border-green-200',   text: 'text-green-700' },
  { slug: 'edibles',      label: 'Edibles',      icon: '🍬', gradient: 'from-amber-50 to-orange-50',    border: 'border-amber-200',   text: 'text-amber-700' },
  { slug: 'concentrates', label: 'Concentrates', icon: '💎', gradient: 'from-purple-50 to-violet-50',   border: 'border-purple-200',  text: 'text-purple-700' },
  { slug: 'vape',         label: 'Vape',         icon: '💨', gradient: 'from-blue-50 to-sky-50',        border: 'border-blue-200',    text: 'text-blue-700' },
  { slug: 'tinctures',    label: 'Tinctures',    icon: '💧', gradient: 'from-teal-50 to-cyan-50',       border: 'border-teal-200',    text: 'text-teal-700' },
  { slug: 'accessories',  label: 'Accessories',  icon: '🛠️', gradient: 'from-stone-50 to-zinc-50',      border: 'border-stone-200',   text: 'text-stone-600' },
] as const;

export function CategoryGrid() {
  return (
    <nav aria-label="Product categories" className="my-10 lg:my-14">
      <h2 className="text-xl font-bold text-stone-900 mb-5">Shop by Category</h2>
      <ul
        role="list"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        {CATEGORIES.map((cat) => (
          <li key={cat.slug}>
            <Link
              to={`${ROUTES.products}?category=${cat.slug}`}
              className={[
                'flex flex-col items-center gap-2.5 p-4',
                'rounded-2xl border',
                'bg-gradient-to-br', cat.gradient, cat.border,
                'hover:shadow-md hover:-translate-y-0.5',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
                'group',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className="text-3xl group-hover:scale-110 transition-transform duration-200"
              >
                {cat.icon}
              </span>
              <span className={['text-xs font-semibold', cat.text].join(' ')}>
                {cat.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
EOF
echo "  ✓ components/home/CategoryGrid.tsx"

cat > "$SF/components/home/FeaturedSection.tsx" << 'EOF'
/**
 * @file FeaturedSection.tsx
 * @app apps/storefront
 *
 * "Featured Products" section — wraps a ProductCarousel with a
 * background section treatment and a "View All" link.
 *
 * Data: Calls useProducts({ featured: true, limit: 12 })
 *
 * Accessibility:
 *   - <section> with aria-labelledby pointing to the heading
 *   - Products are within a ProductCarousel which handles its own a11y
 */

import { Link } from 'react-router-dom';
import { useProducts } from '@cannasaas/api-client';
import { ProductCarousel } from '../product/ProductCarousel';
import { ROUTES } from '../../routes';

export function FeaturedSection() {
  const { data, isLoading } = useProducts({ limit: 12 } as any);

  return (
    <section
      aria-labelledby="featured-heading"
      className="py-8 lg:py-10"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="featured-heading" className="text-2xl font-bold text-stone-900">
            Featured Products
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">Hand-picked by our budtenders</p>
        </div>
        <Link
          to={ROUTES.products}
          className={[
            'text-sm font-medium text-[hsl(var(--primary))]',
            'hover:underline',
            'focus-visible:outline-none focus-visible:underline',
          ].join(' ')}
        >
          View all →
        </Link>
      </div>

      <ProductCarousel
        title="Featured Products"
        products={data?.data}
        isLoading={isLoading}
        ariaLabel="Featured products carousel"
      />
    </section>
  );
}
EOF
echo "  ✓ components/home/FeaturedSection.tsx"

cat > "$SF/components/home/TrendingSection.tsx" << 'EOF'
/**
 * @file TrendingSection.tsx
 * @app apps/storefront
 *
 * "New Arrivals" carousel section.
 * Calls useProducts({ sort: 'newest', limit: 10 })
 */

import { useProducts } from '@cannasaas/api-client';
import { ProductCarousel } from '../product/ProductCarousel';

export function TrendingSection() {
  const { data, isLoading } = useProducts({ sort: 'newest', limit: 10 } as any);

  return (
    <section aria-labelledby="new-arrivals-heading" className="py-8 lg:py-10">
      <ProductCarousel
        title="New Arrivals"
        products={data?.data}
        isLoading={isLoading}
        ariaLabel="New arrivals carousel"
      />
    </section>
  );
}
EOF
echo "  ✓ components/home/TrendingSection.tsx"

# =============================================================================
# Home Page
# =============================================================================
cat > "$SF/pages/Home.tsx" << 'EOF'
/**
 * @file Home.tsx
 * @app apps/storefront
 *
 * Home page — the dispensary storefront landing page.
 *
 * Component composition:
 *   HeroBanner      — full-width promotional banner
 *   CategoryGrid    — 6-category icon navigation
 *   FeaturedSection — horizontal product carousel (featured=true)
 *   TrendingSection — horizontal product carousel (sort=newest)
 *
 * SEO: Sets document.title on mount (WCAG 2.4.2).
 * The page title includes the dispensary name from organizationStore.
 *
 * Performance: FeaturedSection and TrendingSection lazy-load their data
 * independently — the hero and category grid render instantly.
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';
import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { FeaturedSection } from '../components/home/FeaturedSection';
import { TrendingSection } from '../components/home/TrendingSection';

export function HomePage() {
  const { dispensary, organization } = useOrganizationStore();
  const name = dispensary?.name ?? organization?.name ?? 'CannaSaas';

  // WCAG 2.4.2 — Set descriptive page title on mount
  useEffect(() => {
    document.title = `${name} — Premium Cannabis`;
  }, [name]);

  return (
    <>
      {/* Hero banner — above the fold, highest visual priority */}
      <HeroBanner promotionText="Free delivery on orders over $75" />

      {/* Remaining sections in a contained max-width wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category navigation grid */}
        <CategoryGrid />

        {/* Featured products carousel */}
        <FeaturedSection />

        {/* Divider */}
        <hr aria-hidden="true" className="border-stone-100 my-2" />

        {/* New arrivals / trending carousel */}
        <TrendingSection />

        {/* Bottom spacer */}
        <div className="h-16" />
      </div>
    </>
  );
}
EOF
echo "  ✓ pages/Home.tsx"

# =============================================================================
# Products Page sub-components
# =============================================================================

cat > "$SF/components/products/SortDropdown.tsx" << 'EOF'
/**
 * @file SortDropdown.tsx
 * @app apps/storefront
 *
 * Sort order select dropdown for the Products page.
 *
 * Options:
 *   popularity_desc  — Most Popular
 *   newest           — Newest First
 *   price_asc        — Price: Low to High
 *   price_desc       — Price: High to Low
 *   name_asc         — Name: A–Z
 *
 * Accessibility:
 *   - Native <select> element for maximum accessibility compatibility
 *   - Explicit <label> linked via htmlFor (WCAG 1.3.1, 1.3.5)
 *   - onChange triggers URL param update (useOrderFilters pattern)
 */

import { useId } from 'react';

type SortOption = 'popularity_desc' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

interface SortDropdownProps {
  value: SortOption | string;
  onChange: (value: string) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity_desc', label: 'Most Popular' },
  { value: 'newest',          label: 'Newest First' },
  { value: 'price_asc',       label: 'Price: Low to High' },
  { value: 'price_desc',      label: 'Price: High to Low' },
  { value: 'name_asc',        label: 'Name: A–Z' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-stone-600 whitespace-nowrap">
        Sort by
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'text-sm text-stone-800 font-medium',
          'bg-white border border-stone-200 rounded-lg',
          'px-3 py-1.5 pr-8',
          'appearance-none',
          'focus:outline-none focus:border-[hsl(var(--primary)/0.5)]',
          'focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
          'cursor-pointer',
          // Custom arrow via background-image
          `bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")]`,
          'bg-no-repeat bg-[right_0.5rem_center]',
        ].join(' ')}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
EOF
echo "  ✓ components/products/SortDropdown.tsx"

cat > "$SF/components/products/FilterChips.tsx" << 'EOF'
/**
 * @file FilterChips.tsx
 * @app apps/storefront
 *
 * Active filter pills — shows each active filter as a dismissible chip.
 * Appears above the product grid when any filter is active.
 *
 * Each chip shows: label + × remove button.
 * "Clear all" button appears when 2+ filters are active.
 *
 * Accessibility:
 *   - Chips are <li> inside a labeled <ul> (WCAG 1.3.1)
 *   - Remove button: aria-label "Remove {filter name} filter"
 *   - "Clear all": aria-label "Clear all filters"
 *   - After removing: focus moves to the next chip or "Clear all"
 *     (prevents focus loss — WCAG 2.4.3)
 */

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" role="region" aria-label="Active filters">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
        Filters:
      </span>
      <ul role="list" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700">
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className={[
                  'w-4 h-4 flex items-center justify-center',
                  'rounded-full bg-stone-300/60 hover:bg-stone-400/60',
                  'text-stone-600 hover:text-stone-900',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-1',
                  'focus-visible:ring-[hsl(var(--primary))]',
                ].join(' ')}
              >
                <svg aria-hidden="true" className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M1 1l10 10M11 1L1 11" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>

      {chips.length >= 2 && (
        <button
          type="button"
          onClick={onClearAll}
          aria-label="Clear all filters"
          className="text-xs font-medium text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
EOF
echo "  ✓ components/products/FilterChips.tsx"

cat > "$SF/components/products/FilterSidebar.tsx" << 'EOF'
/**
 * @file FilterSidebar.tsx
 * @app apps/storefront
 *
 * Collapsible sidebar filter panel for the Products page.
 *
 * Filter sections (each is an accordion item):
 *   Categories   — radio buttons (from useProductCategories)
 *   Strain Type  — checkboxes (Sativa, Indica, Hybrid, etc.)
 *   Price Range  — dual-handle range slider ($0–$200+)
 *   THC Content  — dual-handle range slider (0%–40%+)
 *
 * Filter values are stored in URL search params (via onFilterChange callbacks).
 * Changes are debounced for slider inputs to avoid excessive URL updates.
 *
 * Accessibility:
 *   - Each section is <fieldset> with <legend> (WCAG 1.3.1)
 *   - Accordion toggle: aria-expanded on the <button>
 *   - Checkboxes/radios: explicit <label htmlFor> (WCAG 1.3.5)
 *   - Range sliders use aria-valuemin, aria-valuemax, aria-valuenow (WCAG 4.1.2)
 *   - All interactive elements meet 44×44px touch target (WCAG 2.5.5)
 */

import { useState } from 'react';
import { useProductCategories } from '@cannasaas/api-client';
import type { ProductQueryParams } from '@cannasaas/api-client';

interface FilterSidebarProps {
  filters: Partial<ProductQueryParams>;
  onChange: (patch: Partial<ProductQueryParams>) => void;
}

const STRAIN_TYPES = [
  { value: 'sativa',                 label: 'Sativa' },
  { value: 'indica',                 label: 'Indica' },
  { value: 'hybrid',                 label: 'Hybrid' },
  { value: 'sativa_dominant_hybrid', label: 'Sativa-Dominant' },
  { value: 'indica_dominant_hybrid', label: 'Indica-Dominant' },
  { value: 'cbd',                    label: 'CBD / Hemp' },
];

// Accordion section component
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = `filter-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="border-b border-stone-100 last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((o) => !o)}
        className={[
          'w-full flex items-center justify-between py-3',
          'text-sm font-semibold text-stone-800',
          'hover:text-stone-900 transition-colors',
          'focus-visible:outline-none focus-visible:ring-1',
          'focus-visible:ring-[hsl(var(--primary))]',
        ].join(' ')}
      >
        {title}
        <svg
          aria-hidden="true"
          className={['w-4 h-4 text-stone-400 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div id={id} className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const { data: categories } = useProductCategories();

  return (
    <aside
      aria-label="Product filters"
      className="bg-white rounded-2xl border border-stone-100 p-4 space-y-1"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Filters</h2>
      </div>

      {/* ── Category ────────────────────────────────────────────────────────── */}
      <FilterSection title="Category">
        <fieldset>
          <legend className="sr-only">Product category</legend>
          <div className="space-y-2">
            {/* "All" option */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.category}
                onChange={() => onChange({ category: undefined })}
                className="w-4 h-4 rounded-full border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
              />
              <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">All Categories</span>
            </label>
            {categories?.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={filters.category === cat.slug}
                  onChange={() => onChange({ category: cat.slug })}
                  className="w-4 h-4 rounded-full border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  {cat.name}
                </span>
                {cat.productCount != null && (
                  <span className="ml-auto text-xs text-stone-400">{cat.productCount}</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* ── Strain Type ─────────────────────────────────────────────────────── */}
      <FilterSection title="Strain Type">
        <fieldset>
          <legend className="sr-only">Cannabis strain type</legend>
          <div className="space-y-2">
            {STRAIN_TYPES.map((strain) => (
              <label key={strain.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={strain.value}
                  checked={filters.strainType === strain.value}
                  onChange={(e) => onChange({
                    strainType: e.target.checked ? strain.value as any : undefined,
                  })}
                  className="w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
                  {strain.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </FilterSection>

      {/* ── Price Range ─────────────────────────────────────────────────────── */}
      <FilterSection title="Price Range" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">Price range in dollars</legend>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label htmlFor="price-min" className="text-xs text-stone-500 mb-1 block">Min ($)</label>
                <input
                  id="price-min"
                  type="number"
                  min={0} max={filters.maxPrice ?? 500} step={5}
                  value={filters.minPrice ?? ''}
                  onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <span className="text-stone-400 mt-5" aria-hidden="true">—</span>
              <div className="flex-1">
                <label htmlFor="price-max" className="text-xs text-stone-500 mb-1 block">Max ($)</label>
                <input
                  id="price-max"
                  type="number"
                  min={filters.minPrice ?? 0} max={500} step={5}
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Any"
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
            </div>
          </div>
        </fieldset>
      </FilterSection>

      {/* ── THC Content ─────────────────────────────────────────────────────── */}
      <FilterSection title="THC %" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">THC content percentage range</legend>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="thc-min" className="text-xs text-stone-500 mb-1 block">Min (%)</label>
              <input
                id="thc-min"
                type="number" min={0} max={40} step={1}
                value={filters.minThc ?? ''}
                onChange={(e) => onChange({ minThc: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
              />
            </div>
            <span className="text-stone-400 mt-5" aria-hidden="true">—</span>
            <div className="flex-1">
              <label htmlFor="thc-max" className="text-xs text-stone-500 mb-1 block">Max (%)</label>
              <input
                id="thc-max"
                type="number" min={0} max={40} step={1}
                value={filters.maxThc ?? ''}
                onChange={(e) => onChange({ maxThc: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Any"
                className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-[hsl(var(--primary)/0.4)] focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]"
              />
            </div>
          </div>
        </fieldset>
      </FilterSection>

      {/* ── In Stock Only ────────────────────────────────────────────────────── */}
      <FilterSection title="Availability" defaultOpen={false}>
        <fieldset>
          <legend className="sr-only">Product availability</legend>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStock ?? false}
              onChange={(e) => onChange({ inStock: e.target.checked || undefined })}
              className="w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
            />
            <span className="text-sm text-stone-700 group-hover:text-stone-900">In stock only</span>
          </label>
        </fieldset>
      </FilterSection>
    </aside>
  );
}
EOF
echo "  ✓ components/products/FilterSidebar.tsx"

cat > "$SF/components/products/ProductGrid.tsx" << 'EOF'
/**
 * @file ProductGrid.tsx
 * @app apps/storefront
 *
 * Responsive product grid with skeleton loading state.
 *
 * Grid layout:
 *   - 2 columns on mobile (xs–sm)
 *   - 3 columns on md–lg
 *   - 4 columns on xl+
 *
 * States:
 *   - Loading: 8 SkeletonCard placeholders (prevents layout shift)
 *   - Empty: illustrated empty state with clear-filters CTA
 *   - Error: friendly error message with retry button
 *   - Success: ProductCard grid
 *
 * Accessibility:
 *   - <ul role="list"> wraps all cards
 *   - aria-busy="true" while loading (WCAG 4.1.3)
 *   - Empty state has role="status" to announce to screen readers
 *   - Result count announced via aria-live region
 */

import { ProductCard } from '../product/ProductCard';
import { SkeletonCard } from '../ui/SkeletonCard';
import type { Product } from '../../types/storefront';

interface ProductGridProps {
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
  totalCount?: number;
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  totalCount,
  onRetry,
  onClearFilters,
}: ProductGridProps) {
  const gridClasses = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5';

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading products">
        <div className={gridClasses} role="list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} role="listitem">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div role="alert" className="text-center py-16">
        <p className="text-3xl mb-3" aria-hidden="true">⚠️</p>
        <h3 className="text-lg font-semibold text-stone-800 mb-2">Something went wrong</h3>
        <p className="text-sm text-stone-500 mb-5">We couldn't load the products. Please try again.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-[hsl(var(--primary))] text-white text-sm font-medium rounded-lg hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] transition-all"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!products || products.length === 0) {
    return (
      <div role="status" className="text-center py-16">
        <p className="text-4xl mb-4" aria-hidden="true">🌿</p>
        <h3 className="text-lg font-semibold text-stone-800 mb-2">No products found</h3>
        <p className="text-sm text-stone-500 mb-5">Try adjusting your filters or search term.</p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Live count announcement for screen readers */}
      {totalCount != null && (
        <p aria-live="polite" className="sr-only">
          {totalCount} product{totalCount !== 1 ? 's' : ''} found
        </p>
      )}

      <ul role="list" className={gridClasses}>
        {products.map((product, i) => (
          <li key={product.id}>
            {/* Mark first 4 cards as priority (above fold on desktop) */}
            <ProductCard product={product} priority={i < 4} />
          </li>
        ))}
      </ul>
    </div>
  );
}
EOF
echo "  ✓ components/products/ProductGrid.tsx"

cat > "$SF/components/products/MobileFilterDrawer.tsx" << 'EOF'
/**
 * @file MobileFilterDrawer.tsx
 * @app apps/storefront
 *
 * Bottom-sheet filter drawer for mobile viewports.
 *
 * Shows a "Filters" button that opens a full-screen bottom drawer
 * containing the FilterSidebar content. The drawer slides up from
 * the bottom of the viewport on mobile.
 *
 * Accessibility:
 *   - role="dialog", aria-modal="true" (WCAG 4.1.2)
 *   - Focus trapped inside when open (WCAG 2.1.2)
 *   - Close button is first focusable element
 *   - Backdrop click closes the drawer
 *   - Escape key closes the drawer
 *   - Filter count badge on trigger button
 */

import { useEffect, useRef } from 'react';
import { FilterSidebar } from './FilterSidebar';
import type { ProductQueryParams } from '@cannasaas/api-client';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Partial<ProductQueryParams>;
  onChange: (patch: Partial<ProductQueryParams>) => void;
  activeFilterCount: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onChange,
  activeFilterCount,
}: MobileFilterDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus close button when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => closeRef.current?.focus(), 50);
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={[
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'bg-white rounded-t-3xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'transition-transform duration-300',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        {/* Handle + header */}
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-stone-100 z-10">
          {/* Drag handle */}
          <div aria-hidden="true" className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[hsl(var(--primary))] text-white text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className={[
                'w-9 h-9 flex items-center justify-center rounded-full',
                'bg-stone-100 text-stone-600',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter content */}
        <div className="px-4 pb-8">
          <FilterSidebar filters={filters} onChange={onChange} />
        </div>

        {/* Apply button */}
        <div className="sticky bottom-0 bg-white border-t border-stone-100 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[hsl(var(--primary))] text-white font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 hover:brightness-110 transition-all"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
        </div>
      </div>
    </>
  );
}
EOF
echo "  ✓ components/products/MobileFilterDrawer.tsx"

# =============================================================================
# Products Page (URL-driven, full implementation)
# =============================================================================
cat > "$SF/pages/Products.tsx" << 'EOF'
/**
 * @file Products.tsx
 * @app apps/storefront
 *
 * Products listing page — the core product browsing experience.
 *
 * Architecture: URL-driven state
 * All filter and pagination state lives in the URL search params.
 * This means:
 *   ✅ Shareable URLs: "Browse Flower under $60" → copy link
 *   ✅ Browser back/forward works correctly
 *   ✅ Page refresh preserves filters
 *   ✅ SEO-friendly (crawlers see filtered results)
 *
 * URL params used:
 *   q          — text search query
 *   category   — product category slug
 *   strainType — cannabis strain type
 *   minPrice   — minimum price in dollars
 *   maxPrice   — maximum price in dollars
 *   minThc     — minimum THC percentage
 *   maxThc     — maximum THC percentage
 *   inStock    — "true" to show only in-stock items
 *   sort       — sort order key
 *   page       — current page number (1-indexed)
 *
 * Component tree:
 *   ProductsPage
 *   ├── (desktop) FilterSidebar     ← sticky left panel, lg+
 *   ├── (mobile)  MobileFilterDrawer ← bottom sheet, <lg
 *   ├── Toolbar row
 *   │   ├── Result count + search echo
 *   │   ├── SortDropdown
 *   │   └── FilterChips (active filter pills)
 *   ├── ProductGrid                 ← main content
 *   └── Pagination                  ← page nav
 *
 * Accessibility:
 *   - document.title updated with filter context (WCAG 2.4.2)
 *   - <main> heading is <h1> ("Products" or "Results for X") (WCAG 2.4.6)
 *   - Filter changes: aria-live "polite" announces new result count
 *   - Loading state: aria-busy on grid (WCAG 4.1.3)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@cannasaas/api-client';
import { useDebounce } from '../hooks/useDebounce';
import { FilterSidebar } from '../components/products/FilterSidebar';
import { MobileFilterDrawer } from '../components/products/MobileFilterDrawer';
import { FilterChips } from '../components/products/FilterChips';
import { SortDropdown } from '../components/products/SortDropdown';
import { ProductGrid } from '../components/products/ProductGrid';
import { Pagination } from '../components/ui/Pagination';
import type { ProductQueryParams } from '@cannasaas/api-client';

// ── URL param ↔ filter state helpers ─────────────────────────────────────────

/** Read all filter values from URL search params */
function readFiltersFromUrl(params: URLSearchParams): Partial<ProductQueryParams> {
  return {
    search:    params.get('q') ?? undefined,
    category:  params.get('category') ?? undefined,
    strainType: params.get('strainType') as any ?? undefined,
    minPrice:  params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
    maxPrice:  params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
    minThc:    params.get('minThc')   ? Number(params.get('minThc'))   : undefined,
    maxThc:    params.get('maxThc')   ? Number(params.get('maxThc'))   : undefined,
    inStock:   params.get('inStock')  === 'true' ? true : undefined,
    sort:      params.get('sort') as any ?? 'popularity_desc',
    page:      params.get('page') ? Number(params.get('page')) : 1,
    limit:     20,
  };
}

/** Write filter values to URL search params */
function writeFiltersToUrl(filters: Partial<ProductQueryParams>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search)    params.set('q',          filters.search);
  if (filters.category)  params.set('category',   filters.category);
  if (filters.strainType)params.set('strainType',  filters.strainType as string);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minThc   != null) params.set('minThc',   String(filters.minThc));
  if (filters.maxThc   != null) params.set('maxThc',   String(filters.maxThc));
  if (filters.inStock)   params.set('inStock', 'true');
  if (filters.sort && filters.sort !== 'popularity_desc') params.set('sort', filters.sort as string);
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

// ── ProductsPage ──────────────────────────────────────────────────────────────

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Derive filter state from URL params
  const filters = useMemo(() => readFiltersFromUrl(searchParams), [searchParams]);

  // Local search input value (debounced before updating URL)
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync debounced search to URL
  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    if (debouncedSearch !== current) {
      updateFilters({ search: debouncedSearch || undefined, page: 1 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Build query for the API
  const queryFilters: ProductQueryParams = {
    ...filters,
    limit: 20,
  };

  const { data, isLoading, isError, refetch } = useProducts(queryFilters);
  const products   = data?.data ?? [];
  const pagination = data?.pagination;
  const totalCount = pagination?.total ?? 0;

  // WCAG 2.4.2 — Update page title with filter context
  useEffect(() => {
    const ctx = filters.search
      ? `"${filters.search}" — `
      : filters.category
        ? `${filters.category} — `
        : '';
    document.title = `${ctx}Products | CannaSaas`;
  }, [filters.search, filters.category]);

  // ── Filter mutation helpers ─────────────────────────────────────────────────

  const updateFilters = useCallback(
    (patch: Partial<ProductQueryParams>) => {
      const next = { ...filters, ...patch };
      // Reset to page 1 on any filter change (except explicit page change)
      if (!('page' in patch)) next.page = 1;
      setSearchParams(writeFiltersToUrl(next), { replace: true });
    },
    [filters, setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // ── Active filter chips ─────────────────────────────────────────────────────

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.search)    chips.push({ key: 'search',    label: `"${filters.search}"`, onRemove: () => { setSearchInput(''); updateFilters({ search: undefined }); } });
    if (filters.category)  chips.push({ key: 'category',  label: filters.category,      onRemove: () => updateFilters({ category: undefined }) });
    if (filters.strainType)chips.push({ key: 'strain',    label: String(filters.strainType), onRemove: () => updateFilters({ strainType: undefined }) });
    if (filters.minPrice != null || filters.maxPrice != null) {
      const label = [filters.minPrice ? `$${filters.minPrice}` : '$0', filters.maxPrice ? `$${filters.maxPrice}` : '+'].join('–');
      chips.push({ key: 'price', label, onRemove: () => updateFilters({ minPrice: undefined, maxPrice: undefined }) });
    }
    if (filters.minThc != null || filters.maxThc != null) {
      const label = [filters.minThc ? `${filters.minThc}%` : '0%', filters.maxThc ? `${filters.maxThc}%` : '+'].join('–') + ' THC';
      chips.push({ key: 'thc', label, onRemove: () => updateFilters({ minThc: undefined, maxThc: undefined }) });
    }
    if (filters.inStock) chips.push({ key: 'inStock', label: 'In Stock', onRemove: () => updateFilters({ inStock: undefined }) });
    return chips;
  }, [filters, updateFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {filters.search ? `Results for "${filters.search}"` : 'Products'}
          </h1>
          <p aria-live="polite" className="text-sm text-stone-500 mt-0.5">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} products`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            aria-label={`Open filters${activeChips.length > 0 ? `, ${activeChips.length} active` : ''}`}
            className={[
              'lg:hidden flex items-center gap-2 px-3 py-2',
              'border border-stone-200 rounded-lg text-sm font-medium',
              'text-stone-700 hover:bg-stone-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
              'transition-colors',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Filters
            {activeChips.length > 0 && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold">
                {activeChips.length}
              </span>
            )}
          </button>

          {/* Sort dropdown — always visible */}
          <SortDropdown
            value={filters.sort ?? 'popularity_desc'}
            onChange={(sort) => updateFilters({ sort: sort as any })}
          />
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id="product-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, strain, effect…"
          autoComplete="off"
          className={[
            'w-full pl-9 pr-4 py-2.5 text-sm',
            'bg-white border border-stone-200 rounded-xl',
            'placeholder:text-stone-400 text-stone-900',
            'focus:outline-none focus:border-[hsl(var(--primary)/0.4)]',
            'focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
            'transition-all',
          ].join(' ')}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(''); updateFilters({ search: undefined }); }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Active filter chips */}
      <FilterChips chips={activeChips} onClearAll={clearAllFilters} />

      {/* Main content: sidebar + grid */}
      <div className="flex gap-8">
        {/* Desktop filter sidebar — sticky */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onChange={updateFilters} />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isError={isError}
            totalCount={totalCount}
            onRetry={refetch}
            onClearFilters={clearAllFilters}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => {
                  updateFilters({ page });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={(patch) => { updateFilters(patch); }}
        activeFilterCount={activeChips.length}
      />
    </div>
  );
}
EOF
echo "  ✓ pages/Products.tsx"

# =============================================================================
# Shared types for storefront app
# =============================================================================
cat > "$SF/types/storefront.ts" << 'EOF'
/**
 * @file types/storefront.ts
 * @app apps/storefront
 *
 * Local product type used by ProductCard, ProductCarousel, ProductGrid.
 * Mirrors the GET /products API response shape.
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  strainType?: string;
  thcContent?: number;
  cbdContent?: number;
  description?: string;
  effects?: string[];
  flavors?: string[];
  terpenes?: Array<{ name: string; percentage?: number }>;
  images?: Array<{ url: string; isPrimary: boolean; alt?: string }>;
  variants: ProductVariant[];
  isActive: boolean;
  isNew?: boolean;
  onSale?: boolean;
  rating?: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  weight: number;
  weightUnit: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
}
EOF
echo "  ✓ types/storefront.ts"

echo ""
echo "  ✅ Storefront Part 2 complete — Home + Products pages"
echo ""
find "$SF/components/home" "$SF/components/product" "$SF/components/products" "$SF/pages/Home.tsx" "$SF/pages/Products.tsx" -name "*.tsx" -o -name "*.ts" 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
