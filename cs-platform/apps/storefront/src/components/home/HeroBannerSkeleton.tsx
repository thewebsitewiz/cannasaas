/**
 * ═══════════════════════════════════════════════════════════════════
 * HeroBannerSkeleton
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/HeroBannerSkeleton.tsx
 *
 * Loading placeholder for the hero banner. Matches the exact height
 * at each breakpoint so there's zero layout shift when the real
 * content arrives.
 *
 * Accessibility:
 *   - role="status" announces loading state to screen readers
 *   - aria-busy="true" signals ongoing activity
 *   - motion-reduce:animate-none disables the pulse for users who
 *     prefer reduced motion
 *   - sr-only text provides a human-readable message
 */

export function HeroBannerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading promotions"
      aria-busy="true"
      className="
        w-full bg-muted
        h-[200px] sm:h-[400px] md:h-[480px]
        animate-pulse motion-reduce:animate-none
      "
    >
      <span className="sr-only">Loading promotions, please wait.</span>
    </div>
  );
}
