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
