/**
 * @file AccountNav.tsx
 * @app apps/storefront
 *
 * Left sidebar navigation for account pages.
 * On mobile, renders as a horizontal scrollable tab strip.
 *
 * Accessibility:
 *   - <nav> with aria-label="Account navigation" (WCAG 1.3.1)
 *   - Active link: aria-current="page" (WCAG 4.1.2)
 */

import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';

const NAV_ITEMS = [
  { href: ROUTES.accountProfile,    label: 'Profile',        icon: '👤' },
  { href: ROUTES.accountOrders,     label: 'Orders',         icon: '📦' },
  { href: ROUTES.accountAddresses,  label: 'Addresses',      icon: '📍' },
  { href: ROUTES.accountLoyalty,    label: 'Loyalty Points', icon: '⭐' },
  { href: ROUTES.accountPreferences,label: 'Preferences',    icon: '⚙️' },
];

export function AccountNav() {
  return (
    <nav
      aria-label="Account navigation"
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
    >
      <ul role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              end
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
              className={({ isActive }) => [
                'flex items-center gap-3 px-4 py-3.5',
                'text-sm font-medium border-l-2 transition-all',
                isActive
                  ? 'border-l-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)] text-[hsl(var(--primary))]'
                  : 'border-l-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
