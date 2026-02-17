/**
 * ═══════════════════════════════════════════════════════════════════
 * CategoryGrid
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/home/CategoryGrid.tsx
 *
 * Visual navigation tiles for product categories. Wrapped in
 * React.memo because categories are static per tenant session —
 * they won't change unless the user switches dispensaries.
 *
 * Semantic structure (WCAG 1.3.1):
 *   <nav aria-label="Product categories">
 *     <ul role="list">
 *       <li><a href="/products?category=flower">...</a></li>
 *     </ul>
 *   </nav>
 *
 * Screen readers list this as a "Product categories navigation"
 * landmark. Users can jump to it from the landmarks/regions menu.
 *
 * Responsive grid:
 *   2 cols (320px base) → 3 cols (sm: 640px) → 4 cols (lg: 1024px)
 *   gap-3 (12px) mobile → gap-4 (16px) sm+
 *   Tile padding: p-4 mobile → p-6 sm+
 *
 * Accessibility:
 *   - Icons are aria-hidden (decorative) — link text is the label
 *   - focus-visible ring on each tile for keyboard navigation
 *   - motion-reduce:transition-none on hover scale effect
 *   - min-h-[100px] ensures consistent tile height
 *   - Pluralization on product count ("1 product" vs "3 products")
 */

import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { ProductCategory } from '@cannasaas/types';

interface CategoryGridProps {
  categories: ProductCategory[];
}

/** Emoji fallbacks for categories. Replace with SVG/icon library in prod. */
const CATEGORY_ICONS: Record<string, string> = {
  flower: '🌿',
  vapes: '💨',
  concentrates: '💎',
  edibles: '🍪',
  tinctures: '💧',
  topicals: '🧴',
  accessories: '🔧',
  prerolls: '🚬',
};

export const CategoryGrid = memo(function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Product categories">
      <ul
        role="list"
        className="
          grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
          gap-3 sm:gap-4
          list-none p-0 m-0
        "
      >
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={`/products?category=${category.slug}`}
              className="
                group flex flex-col items-center justify-center
                p-4 sm:p-6 rounded-xl min-h-[100px]
                border border-border bg-card
                hover:border-primary/50 hover:shadow-lg
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-2
                transition-all duration-200
              "
            >
              {/* Icon — decorative, hidden from assistive tech */}
              <span
                aria-hidden="true"
                className="
                  text-3xl sm:text-4xl mb-2 sm:mb-3
                  group-hover:scale-110
                  transition-transform duration-200
                  motion-reduce:transition-none
                "
              >
                {CATEGORY_ICONS[category.slug] ?? '🌱'}
              </span>

              {/* Category name — IS the accessible label for this link */}
              <span className="font-medium text-xs sm:text-sm text-center leading-tight">
                {category.name}
              </span>

              {/* Product count */}
              {category.productCount != null && category.productCount > 0 && (
                <span className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                  {category.productCount} product{category.productCount !== 1 ? 's' : ''}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
});
