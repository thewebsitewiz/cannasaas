/**
 * @file NavMenu.tsx
 * @app apps/storefront
 *
 * Primary navigation links — works in both desktop (horizontal) and
 * mobile (vertical) modes via the `mobile` prop.
 *
 * Links:
 *   Products  → /products
 *   Deals     → /products?sort=newest&tag=deals
 *   About     → /about (static page)
 *
 * Active state uses aria-current="page" (WCAG 4.1.2) + visual underline.
 * The active indicator is a coloured bottom border driven by --primary CSS var.
 */

import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';

interface NavMenuProps {
  mobile?: boolean;
}

const NAV_LINKS = [
  { label: 'Shop All', href: ROUTES.products },
  { label: 'Flower', href: `${ROUTES.products}?category=flower` },
  { label: 'Edibles', href: `${ROUTES.products}?category=edibles` },
  { label: 'Concentrates', href: `${ROUTES.products}?category=concentrates` },
  { label: 'Deals', href: `${ROUTES.products}?sort=newest&tag=deals` },
];

export function NavMenu({ mobile = false }: NavMenuProps) {
  if (mobile) {
    return (
      <ul className="space-y-1">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <NavLink
              to={link.href}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              className={({ isActive }) =>
                [
                  'block px-3 py-2.5 rounded-lg text-sm font-medium',
                  'transition-colors',
                  isActive
                    ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[hsl(var(--primary))]',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex items-center gap-1" role="list">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <NavLink
            to={link.href}
            aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            className={({ isActive }) =>
              [
                'relative px-3 py-2 text-sm font-medium rounded-md',
                'transition-colors',
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))]',
                // Active underline indicator
                isActive
                  ? 'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[hsl(var(--primary))]'
                  : '',
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
