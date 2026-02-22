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
