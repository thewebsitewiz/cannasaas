/**
 * ═══════════════════════════════════════════════════════════════════
 * ProductDetailSkeleton — Full-Page Loading State
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/ProductDetailSkeleton.tsx
 *
 * Renders a complete skeleton that mirrors the real ProductDetail
 * layout: gallery placeholder on the left, text/controls on the
 * right. Prevents layout shift (CLS) when the API response arrives.
 *
 * Accessibility (WCAG):
 *   - role="status" with aria-label announces loading (4.1.2)
 *   - aria-busy="true" signals ongoing activity
 *   - motion-reduce:animate-none disables pulse animation
 *   - sr-only text: "Loading product details, please wait."
 */

export function ProductDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading product details"
      aria-busy="true"
      className="animate-pulse motion-reduce:animate-none"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb placeholder */}
        <div className="flex gap-2 mb-6">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>

        {/* Main layout: gallery + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-muted rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Right: Product info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted rounded-full" />
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>

            {/* Brand */}
            <div className="h-3 w-24 bg-muted rounded" />

            {/* Name */}
            <div className="h-9 w-3/4 bg-muted rounded" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>

            {/* Cannabinoid bars */}
            <div className="space-y-3 pt-4">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-4 bg-muted rounded" />
                <div className="flex-1 h-3 bg-muted rounded-full" />
                <div className="w-14 h-4 bg-muted rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-4 bg-muted rounded" />
                <div className="flex-1 h-3 bg-muted rounded-full" />
                <div className="w-14 h-4 bg-muted rounded" />
              </div>
            </div>

            {/* Variant selector */}
            <div className="space-y-2 pt-4">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-20 h-16 bg-muted rounded-xl" />
                ))}
              </div>
            </div>

            {/* Price + CTA */}
            <div className="space-y-3 pt-4">
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-12 w-full bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading product details, please wait.</span>
    </div>
  );
}
