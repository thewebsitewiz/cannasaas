/**
 * ═══════════════════════════════════════════════════════════════════
 * PurchaseLimitWarning — Compliance Alert Banner
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/PurchaseLimitWarning.tsx
 *
 * Displays a prominent warning when the cart contents exceed
 * state-regulated purchase limits. Cannabis regulations in
 * NY/NJ/CT impose per-transaction limits (e.g., 3oz flower
 * per purchase in NY). This component blocks checkout until
 * the customer reduces their cart.
 *
 * Visual:
 *   ┌─────────────────────────────────────────────┐
 *   │ ⚠️  Purchase Limit Exceeded                  │
 *   │                                               │
 *   │  • Flower exceeds the 3 oz limit (95.2g)     │
 *   │                                               │
 *   │  Please reduce quantities to proceed.         │
 *   └─────────────────────────────────────────────┘
 *
 * Accessibility (WCAG):
 *   - role="alert" forces immediate announcement (4.1.3)
 *   - aria-live="assertive" — this is a blocking error (4.1.3)
 *   - Warning icon is aria-hidden (decorative) (1.1.1)
 *   - <ul> lists individual violations (1.3.1)
 *   - High-contrast destructive colors (1.4.3)
 *   - Not color-alone: icon + text + border pattern (1.4.1)
 *
 * Responsive:
 *   - Full-width banner, padding scales with breakpoint
 *   - Text wraps naturally in narrow viewports
 */

interface PurchaseLimitWarningProps {
  /** Human-readable limit violation messages from useCartTotals */
  warnings: string[];
}

export function PurchaseLimitWarning({ warnings }: PurchaseLimitWarningProps) {
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="
        rounded-xl border-2 border-destructive/30
        bg-destructive/5
        px-4 py-3 sm:px-5 sm:py-4
        space-y-2
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">⚠️</span>
        <h3 className="font-bold text-sm sm:text-base text-destructive">
          Purchase Limit Exceeded
        </h3>
      </div>

      {/* Violation list */}
      <ul className="space-y-1 pl-7 list-disc list-outside">
        {warnings.map((warning, idx) => (
          <li key={idx} className="text-xs sm:text-sm text-destructive/90 capitalize">
            {warning}
          </li>
        ))}
      </ul>

      {/* Instructions */}
      <p className="text-xs sm:text-sm text-muted-foreground pl-7">
        Please reduce quantities to comply with state regulations before
        proceeding to checkout.
      </p>
    </div>
  );
}
