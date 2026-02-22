/**
 * @file CartEmpty.tsx
 * @app apps/storefront
 *
 * Empty cart illustration and call-to-action.
 * Shown when the cart has no items.
 *
 * Accessibility:
 *   - role="status" communicates empty cart state (WCAG 4.1.3)
 *   - CTA link has descriptive text (WCAG 2.4.6)
 *   - Illustration is aria-hidden (decorative)
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

export function CartEmpty() {
  return (
    <div role="status" className="text-center py-20 px-4">
      {/* Decorative illustration */}
      <div aria-hidden="true" className="relative inline-block mb-6">
        <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10 text-stone-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
            />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
      </div>

      <h2 className="text-xl font-bold text-stone-900 mb-2">
        Your cart is empty
      </h2>
      <p className="text-stone-500 text-sm mb-8 max-w-xs mx-auto">
        Add some products to get started. Our budtenders have curated the best
        selection for you.
      </p>

      <Link
        to={ROUTES.products}
        className={[
          'inline-flex items-center gap-2',
          'px-6 py-3 rounded-xl',
          'bg-[hsl(var(--primary))] text-white font-semibold text-sm',
          'hover:brightness-110 active:scale-95',
          'shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          'transition-all',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
        ].join(' ')}
      >
        Browse Products
        <svg
          aria-hidden="true"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
