/**
 * ═══════════════════════════════════════════════════════════════════
 * AccountSidebar — Navigation for Nested Account Routes
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/AccountSidebar.tsx
 *
 * Vertical sidebar (desktop) or horizontal pill bar (mobile) that
 * links to each nested account route: Profile, Orders, Addresses,
 * Loyalty, and Notifications.
 *
 * Uses NavLink from react-router-dom for automatic active state
 * detection. The `end` prop ensures the profile link only matches
 * /account exactly (not /account/orders).
 *
 * ─── LAYOUT ────────────────────────────────────────────────────
 *
 *   Desktop (lg+): Vertical sticky sidebar
 *   ┌─────────────────┐
 *   │ 👤 Profile       │  ← active
 *   │ 📦 Orders        │
 *   │ 📍 Addresses     │
 *   │ ⭐ Loyalty       │
 *   │ 🔔 Notifications │
 *   │ ─────────────── │
 *   │ 🚪 Sign Out      │
 *   └─────────────────┘
 *
 *   Mobile (< lg): Horizontal scrollable pill bar
 *   [Profile] [Orders] [Addresses] [Loyalty] [Notif.]
 *
 * Accessibility (WCAG):
 *   - <nav aria-label="Account navigation"> landmark (1.3.1)
 *   - NavLink renders aria-current="page" when active (4.1.2)
 *   - Icons are aria-hidden (decorative) (1.1.1)
 *   - Sign Out button is a <button>, not a link (semantics)
 *   - focus-visible rings on all items (2.4.7)
 *   - Touch targets: min-h-[44px] (2.5.8)
 *   - Horizontal scroll bar: overscroll-x-auto with snap (mobile)
 *
 * Responsive:
 *   - lg+: flex-col, w-56, sticky top-24
 *   - < lg: flex-row, overflow-x-auto, horizontal pills
 */

import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** If true, NavLink only matches exact path (for /account root) */
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/account',               label: 'Profile',       icon: '👤', end: true },
  { to: '/account/orders',        label: 'Orders',        icon: '📦' },
  { to: '/account/addresses',     label: 'Addresses',     icon: '📍' },
  { to: '/account/loyalty',       label: 'Loyalty',       icon: '⭐' },
  { to: '/account/notifications', label: 'Notifications', icon: '🔔' },
];

export function AccountSidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <nav aria-label="Account navigation">
      {/* ── Desktop: Vertical sidebar ── */}
      <div className="hidden lg:flex flex-col gap-1 w-56 sticky top-24">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              flex items-center gap-3
              px-4 py-2.5 min-h-[44px]
              rounded-lg text-sm font-medium
              transition-colors
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
            `}
          >
            <span aria-hidden="true" className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Divider */}
        <hr className="my-2 border-border" aria-hidden="true" />

        {/* Sign Out */}
        <button
          onClick={logout}
          className="
            flex items-center gap-3
            px-4 py-2.5 min-h-[44px]
            rounded-lg text-sm font-medium
            text-muted-foreground hover:bg-destructive/10 hover:text-destructive
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-destructive focus-visible:ring-offset-1
            transition-colors
          "
        >
          <span aria-hidden="true" className="text-base">🚪</span>
          Sign Out
        </button>
      </div>

      {/* ── Mobile: Horizontal pill bar ── */}
      <div
        className="
          lg:hidden flex gap-2
          overflow-x-auto pb-2 -mx-4 px-4
          scroll-smooth snap-x snap-mandatory
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              flex-shrink-0 snap-start
              flex items-center gap-1.5
              px-3 py-2 min-h-[44px]
              rounded-full text-xs sm:text-sm font-medium
              border transition-colors whitespace-nowrap
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              ${isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/40'}
            `}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
