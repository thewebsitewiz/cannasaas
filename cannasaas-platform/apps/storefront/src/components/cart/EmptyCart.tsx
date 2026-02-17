/**
 * ═══════════════════════════════════════════════════════════════════
 * EmptyCart — Empty State with Shop CTA
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/EmptyCart.tsx
 *
 * Displayed when the cart has zero items. Provides a clear message
 * and a prominent CTA linking back to the Products page.
 *
 * Accessibility (WCAG):
 *   - role="status" so screen readers announce the state (4.1.2)
 *   - Decorative icon is aria-hidden (1.1.1)
 *   - CTA has descriptive text, not just "Click here" (2.4.4)
 *   - focus-visible ring on the link (2.4.7)
 *   - min-h-[44px] on CTA for touch target (2.5.8)
 *
 * Responsive:
 *   - Centered with max-w constraint for readability
 *   - Padding scales: py-12 → sm:py-16 → lg:py-20
 *   - Icon/text sizes scale across breakpoints
 */

import { Link } from 'react-router-dom';

export function EmptyCart() {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center"
    >
      <span aria-hidden="true" className="text-6xl sm:text-7xl mb-4">
        🛒
      </span>

      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Your cart is empty
      </h2>

      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm">
        Looks like you haven't added any products yet.
        Browse our selection to find something you'll love.
      </p>

      <Link
        to="/products"
        className="
          inline-flex items-center gap-2
          px-6 py-3 min-h-[44px]
          bg-primary text-primary-foreground
          rounded-xl font-semibold text-sm sm:text-base
          hover:bg-primary/90
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-2
          transition-colors
        "
      >
        Browse Products
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
