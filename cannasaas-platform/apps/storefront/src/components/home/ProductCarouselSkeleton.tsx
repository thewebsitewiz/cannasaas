/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductCarouselSkeleton
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/ProductCarouselSkeleton.tsx
 *
 * Loading placeholder for product carousels. Renders 4 shimmer cards
 * that match the exact dimensions of real product cards at each
 * breakpoint, preventing layout shift (CLS) when data arrives.
 *
 * Accessibility:
 *   - role="status" with aria-label announces loading to readers
 *   - aria-busy="true" signals ongoing activity
 *   - Individual skeleton cards are aria-hidden (decorative)
 *   - motion-reduce:animate-none disables pulse for reduced motion
 *   - sr-only text: "Loading products, please wait."
 */

export function ProductCarouselSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading products"
      aria-busy="true"
      className="flex gap-3 sm:gap-4 overflow-hidden"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[220px] sm:w-[260px] md:w-[280px]"
          aria-hidden="true"
        >
          <div className="rounded-xl border bg-card overflow-hidden animate-pulse motion-reduce:animate-none">
            {/* Image placeholder */}
            <div className="aspect-square bg-muted" />
            {/* Text line placeholders */}
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-5 bg-muted rounded w-1/4 mt-3" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading products, please wait.</span>
    </div>
  );
}
