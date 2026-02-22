/**
 * @file SkeletonCard.tsx
 * @app apps/storefront
 *
 * Generic skeleton loading card — matches the ProductCard dimensions.
 *
 * Used as the loading fallback in:
 *   - PageLoadingFallback (lazy route loading)
 *   - ProductsPage (while useProducts is fetching)
 *   - HomePage featured product carousel
 *
 * Accessibility:
 *   - aria-busy="true" on the container communicates loading state
 *   - aria-label provides context: "Loading product" (WCAG 4.1.3)
 *   - The pulse animation is paused for users who prefer reduced motion
 *     (prefers-reduced-motion: reduce) — WCAG 2.3.3
 */

export function SkeletonCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="bg-white rounded-2xl overflow-hidden border border-stone-100"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-stone-100 animate-pulse motion-reduce:animate-none" />

      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <div className="h-4 w-16 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
        {/* Product name */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
        </div>
        {/* THC/CBD badges */}
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
          <div className="h-5 w-12 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
        </div>
        {/* Price + button */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-20 bg-stone-100 rounded-lg animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
