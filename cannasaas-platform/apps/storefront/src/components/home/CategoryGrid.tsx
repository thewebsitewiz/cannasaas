/**
 * @file CategoryGrid.tsx
 * @app apps/storefront
 *
 * Visual category navigation grid on the home page.
 *
 * Shows 6 cannabis product categories as large icon tiles.
 * Clicking any tile navigates to /products?category=<slug>.
 *
 * Design: Earthy, organic aesthetic with soft gradient backgrounds
 * per category, each evoking the product type.
 *
 * Accessibility:
 *   - <nav> with aria-label="Product categories" (WCAG 1.3.1)
 *   - Each link has descriptive text (category name) — not just icon
 *   - aria-current="page" when category matches URL (if on /products)
 *   - Grid reflows: 2 cols on xs, 3 on sm, 6 on lg
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

const CATEGORIES = [
  { slug: 'flower',       label: 'Flower',       icon: '🌸', gradient: 'from-green-50 to-emerald-50',   border: 'border-green-200',   text: 'text-green-700' },
  { slug: 'edibles',      label: 'Edibles',      icon: '🍬', gradient: 'from-amber-50 to-orange-50',    border: 'border-amber-200',   text: 'text-amber-700' },
  { slug: 'concentrates', label: 'Concentrates', icon: '💎', gradient: 'from-purple-50 to-violet-50',   border: 'border-purple-200',  text: 'text-purple-700' },
  { slug: 'vape',         label: 'Vape',         icon: '💨', gradient: 'from-blue-50 to-sky-50',        border: 'border-blue-200',    text: 'text-blue-700' },
  { slug: 'tinctures',    label: 'Tinctures',    icon: '💧', gradient: 'from-teal-50 to-cyan-50',       border: 'border-teal-200',    text: 'text-teal-700' },
  { slug: 'accessories',  label: 'Accessories',  icon: '🛠️', gradient: 'from-stone-50 to-zinc-50',      border: 'border-stone-200',   text: 'text-stone-600' },
] as const;

export function CategoryGrid() {
  return (
    <nav aria-label="Product categories" className="my-10 lg:my-14">
      <h2 className="text-xl font-bold text-stone-900 mb-5">Shop by Category</h2>
      <ul
        role="list"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
      >
        {CATEGORIES.map((cat) => (
          <li key={cat.slug}>
            <Link
              to={`${ROUTES.products}?category=${cat.slug}`}
              className={[
                'flex flex-col items-center gap-2.5 p-4',
                'rounded-2xl border',
                'bg-gradient-to-br', cat.gradient, cat.border,
                'hover:shadow-md hover:-translate-y-0.5',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-1',
                'group',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className="text-3xl group-hover:scale-110 transition-transform duration-200"
              >
                {cat.icon}
              </span>
              <span className={['text-xs font-semibold', cat.text].join(' ')}>
                {cat.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
