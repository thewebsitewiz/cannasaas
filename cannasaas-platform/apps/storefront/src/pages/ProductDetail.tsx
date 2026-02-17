/**
 * ═══════════════════════════════════════════════════════════════════
 * CannaSaas Storefront — Product Detail Page (Orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 *
 * File:   apps/storefront/src/pages/ProductDetail.tsx
 * Route:  /products/:productId
 *
 * Displays full cannabis product information. Thin orchestrator that
 * fetches a single product by ID, manages variant selection state,
 * and composes all detail sub-components.
 *
 * ─── DATA FETCHING ──────────────────────────────────────────────
 *
 *   useProduct(productId)         → Sprint 4 Product API
 *   useRecommendations(productId) → Sprint 9 Recommendations API
 *                                    (handled internally by
 *                                     RecommendedProducts component)
 *
 * The product query uses staleTime: 2min (product data changes
 * infrequently) and includes retry logic for transient failures.
 *
 * ─── LAYOUT STRUCTURE ───────────────────────────────────────────
 *
 *   Desktop (lg+):
 *   ┌──────────────────────────────────────────────────┐
 *   │ Home / Products / Flower / Blue Dream            │ ← Breadcrumbs
 *   ├───────────────────────┬──────────────────────────┤
 *   │                       │ [Sativa] ⭐ 4.5 (128)    │
 *   │                       │ GREENLEAF                 │
 *   │   Product Gallery     │ Blue Dream                │ ← h1
 *   │   (aspect-square)     │ Description text...       │
 *   │                       │                           │
 *   │   [T1][T2][T3][T4]   │ ┌─ Cannabinoid Profile ──┐│
 *   │                       │ │ THC ████████░░ 24.5%   ││
 *   │                       │ │ CBD ██░░░░░░░░  1.2%   ││
 *   │                       │ └────────────────────────┘│
 *   │                       │                           │
 *   │                       │ ┌─ Terpene Profile ──────┐│
 *   │                       │ │ Myrcene ████████ 1.20% ││
 *   │                       │ │ Limonene █████░░ 0.80% ││
 *   │                       │ └────────────────────────┘│
 *   │                       │                           │
 *   │                       │ Effects: [Happy] [Relaxed]│
 *   │                       │ Flavors: [Citrus] [Pine]  │
 *   │                       │                           │
 *   │                       │ Select Size:              │
 *   │                       │ [1g] [3.5g] [▶7g] [14g]  │
 *   │                       │                           │
 *   │                       │ $45.00 / 7g               │
 *   │                       │ [−] 2 [+]                 │
 *   │                       │ [ Add to Cart — $90.00 ]  │
 *   ├───────────────────────┴──────────────────────────┤
 *   │ You May Also Like                                │
 *   │ [Card] [Card] [Card] [Card] →                    │
 *   └──────────────────────────────────────────────────┘
 *
 *   Mobile (< lg): Same content stacked vertically.
 *   Gallery → Info → Cannabinoids → Terpenes → Effects →
 *   Variants → Recommendations. Sticky bottom bar for cart CTA.
 *
 * ─── STATE MANAGEMENT ───────────────────────────────────────────
 *
 *   selectedVariantId — owned here, passed to VariantSelector and
 *   AddToCartSection. Initialized to the first variant. When the
 *   user picks a different size, the price updates instantly.
 *
 * ─── ERROR HANDLING ─────────────────────────────────────────────
 *
 *   - Product not found → Navigate to /products (or 404)
 *   - API error → SectionErrorBoundary shows retry prompt
 *   - Recommendations error → Section silently hidden
 *
 * ─── SEO / HEAD ─────────────────────────────────────────────────
 *
 *   Uses react-helmet-async (or your meta management) to set:
 *     <title>{product.name} — {dispensary.name}</title>
 *     <meta name="description" content={product.description} />
 *     <meta property="og:image" content={product.images[0].url} />
 *
 * ─── FILE MAP ───────────────────────────────────────────────────
 *
 *   components/products/detail/
 *     Breadcrumbs.tsx           WAI-ARIA breadcrumb trail
 *     ProductGallery.tsx        Image + thumbnail strip
 *     ProductInfo.tsx           h1 name, brand, badges, description
 *     CannabinoidProfile.tsx    THC/CBD/minor meter bars
 *     TerpeneProfile.tsx        Ranked terpene bars
 *     EffectsAndFlavors.tsx     Effect + flavor tag chips
 *     VariantSelector.tsx       Size/weight radio group
 *     AddToCartSection.tsx      Price, qty stepper, CTA + mobile bar
 *     RecommendedProducts.tsx   Sprint 9 recommendations carousel
 *     ProductDetailSkeleton.tsx Full-page loading placeholder
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@cannasaas/api-client';
import { useOrganizationStore } from '@cannasaas/stores';
import { SectionErrorBoundary } from '@/components/layout';
import {
  Breadcrumbs,
  ProductGallery,
  ProductInfo,
  CannabinoidProfile,
  TerpeneProfile,
  EffectsAndFlavors,
  VariantSelector,
  AddToCartSection,
  RecommendedProducts,
  ProductDetailSkeleton,
} from '@/components/products/detail';
import type { Crumb } from '@/components/products/detail';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { dispensary } = useOrganizationStore();

  // ── Data Fetching ──
  const {
    data: product,
    isLoading,
    isError,
  } = useProduct(productId!, {
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ── Variant Selection State ──
  // Initialized to the first variant when the product loads.
  // Must live here (not in VariantSelector) because AddToCartSection
  // also needs the selected variant to display the correct price.
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  useEffect(() => {
    if (product?.variants?.length && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  const selectedVariant = product?.variants?.find(
    (v) => v.id === selectedVariantId,
  ) ?? product?.variants?.[0];

  // ── Error States ──
  if (isError) {
    // Product not found or API failure — redirect to products list.
    // In production, this could show a 404 page instead.
    navigate('/products', { replace: true });
    return null;
  }

  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  // ── Breadcrumb Trail ──
  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    ...(product.category
      ? [{ label: product.category, href: `/products?category=${product.category}` }]
      : []),
    { label: product.name },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* ══════════════════════════════════════════════════
          BREADCRUMBS
          ══════════════════════════════════════════════════ */}
      <Breadcrumbs crumbs={crumbs} />

      {/* ══════════════════════════════════════════════════
          MAIN LAYOUT — Gallery + Product Info
          ══════════════════════════════════════════════════
          2-column on lg+: gallery left, info right.
          Stacked on mobile: gallery → info. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* ── Left Column: Gallery ── */}
        <SectionErrorBoundary>
          <ProductGallery
            images={product.images ?? []}
            productName={product.name}
          />
        </SectionErrorBoundary>

        {/* ── Right Column: All product details + actions ── */}
        <div className="space-y-6 sm:space-y-8">

          {/* Product identity: badges, name, description */}
          <SectionErrorBoundary>
            <ProductInfo product={product} />
          </SectionErrorBoundary>

          {/* Divider */}
          <hr className="border-border" aria-hidden="true" />

          {/* Cannabinoid profile: THC, CBD, minor cannabinoids */}
          <SectionErrorBoundary>
            <CannabinoidProfile
              thcContent={product.thcContent}
              cbdContent={product.cbdContent}
              cannabinoids={product.cannabinoids}
            />
          </SectionErrorBoundary>

          {/* Terpene profile */}
          {product.terpenes && product.terpenes.length > 0 && (
            <SectionErrorBoundary>
              <TerpeneProfile terpenes={product.terpenes} />
            </SectionErrorBoundary>
          )}

          {/* Effects and flavors */}
          <SectionErrorBoundary>
            <EffectsAndFlavors
              effects={product.effects}
              flavors={product.flavors}
            />
          </SectionErrorBoundary>

          {/* Divider before purchase section */}
          <hr className="border-border" aria-hidden="true" />

          {/* Variant selector: sizes/weights with prices */}
          {product.variants && product.variants.length > 1 && (
            <SectionErrorBoundary>
              <VariantSelector
                variants={product.variants}
                selectedId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            </SectionErrorBoundary>
          )}

          {/* Price, quantity, Add to Cart (desktop CTA + mobile sticky bar) */}
          {selectedVariant && (
            <SectionErrorBoundary>
              <AddToCartSection
                product={product}
                selectedVariant={selectedVariant}
              />
            </SectionErrorBoundary>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RECOMMENDATIONS — "You May Also Like"
          ══════════════════════════════════════════════════
          Full-width below the 2-column layout.
          Fetches from Sprint 9 recommendations API.
          Gracefully hidden on error. */}
      <SectionErrorBoundary>
        <RecommendedProducts
          productId={product.id}
          category={product.category}
        />
      </SectionErrorBoundary>
    </main>
  );
}
