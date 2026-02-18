/**
 * ═══════════════════════════════════════════════════════════════════
 * CannaSaas Storefront — Account Page (Orchestrator)
 * ═══════════════════════════════════════════════════════════════════
 *
 * File:   apps/storefront/src/pages/Account.tsx
 * Route:  /account/*
 *
 * Layout shell for all account sub-pages. Renders the AccountSidebar
 * alongside a nested <Outlet> that React Router populates with the
 * active child route.
 *
 * ─── ROUTE STRUCTURE ───────────────────────────────────────────
 *
 *   /account             → ProfileSection (index route)
 *   /account/orders      → OrderHistory
 *   /account/orders/:id  → (future: OrderDetail)
 *   /account/addresses   → SavedAddresses
 *   /account/loyalty     → LoyaltyDashboard
 *   /account/notifications → NotificationPreferences
 *
 *   These are defined as child routes in the router config (see
 *   below). This component is the layout parent.
 *
 * ─── PROTECTED ROUTE ───────────────────────────────────────────
 *
 *   Per the Project Guide, the Account page is wrapped in
 *   <ProtectedRoute> at the router level:
 *
 *     {
 *       path: 'account/*',
 *       element: (
 *         <ProtectedRoute>
 *           <Suspense fallback={<LoadingSpinner />}>
 *             <AccountPage />
 *           </Suspense>
 *         </ProtectedRoute>
 *       ),
 *       children: [
 *         { index: true, element: <ProfileSection /> },
 *         { path: 'orders', element: <OrderHistory /> },
 *         { path: 'addresses', element: <SavedAddresses /> },
 *         { path: 'loyalty', element: <LoyaltyDashboard /> },
 *         { path: 'notifications', element: <NotificationPreferences /> },
 *       ],
 *     }
 *
 *   The ProtectedRoute (from components/ProtectedRoute.tsx) checks
 *   isAuthenticated from useAuthStore. If not authenticated, it
 *   redirects to /login with the current location in state (so the
 *   user returns to /account after login).
 *
 * ─── LAYOUT ────────────────────────────────────────────────────
 *
 *   Desktop (lg+):
 *   ┌────────────┬──────────────────────────────────┐
 *   │            │                                  │
 *   │  Sidebar   │  <Outlet />                      │
 *   │  (sticky)  │  (ProfileSection / OrderHistory  │
 *   │            │   / SavedAddresses / etc.)       │
 *   │  👤 Profile│                                  │
 *   │  📦 Orders │                                  │
 *   │  📍 Addrs  │                                  │
 *   │  ⭐ Loyalty│                                  │
 *   │  🔔 Notif. │                                  │
 *   │  ───────── │                                  │
 *   │  🚪 Sign   │                                  │
 *   │     Out    │                                  │
 *   │            │                                  │
 *   └────────────┴──────────────────────────────────┘
 *
 *   Mobile (< lg):
 *   ┌────────────────────────────────────────┐
 *   │ [Profile] [Orders] [Addrs] [Loyalty]   │  ← scroll
 *   ├────────────────────────────────────────┤
 *   │                                        │
 *   │  <Outlet />                            │
 *   │                                        │
 *   └────────────────────────────────────────┘
 *
 * ─── FILE MAP ──────────────────────────────────────────────────
 *
 *   components/account/
 *     AccountSidebar.tsx            Nav links (vertical lg, pills mobile)
 *     ProfileSection.tsx            Profile editing (RHF + Zod)
 *     OrderHistory.tsx              Order list with status filters
 *     OrderCard.tsx                 Single order card
 *     OrderStatusBadge.tsx          Status pill + step tracker
 *     SavedAddresses.tsx            Address list + add/edit/delete
 *     AddressCard.tsx               Single address card
 *     AddressFormDialog.tsx         <dialog> modal for address CRUD
 *     LoyaltyDashboard.tsx          Points, tier, progress, referral
 *     NotificationPreferences.tsx   Toggle switches for channels/types
 *     index.ts                      Barrel export
 *
 * ─── SEO / HEAD ────────────────────────────────────────────────
 *
 *   <title>Account — {dispensary.name}</title>
 *   noindex: account pages should not be indexed.
 *
 * Accessibility (WCAG):
 *   - <main> landmark wraps all content (1.3.1)
 *   - Sidebar: <nav aria-label="Account navigation"> (1.3.1)
 *   - Page heading: h1 "My Account" (only heading at this level)
 *   - Sub-pages provide h2 headings (Profile, Orders, etc.)
 *   - Skip link target: main content area
 *
 * Responsive:
 *   - Sidebar: sticky left column on lg+, horizontal pills on mobile
 *   - Content area: flex-1, min-w-0 to prevent overflow
 *   - Page padding: px-4 mobile → px-6 sm → px-8 lg
 */

import { Outlet } from 'react-router-dom';
import { AccountSidebar } from '@/components/account';

export default function Account() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* ══════════════════════════════════════════════════
          PAGE HEADER
          ══════════════════════════════════════════════════ */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8">
        My Account
      </h1>

      {/* ══════════════════════════════════════════════════
          MOBILE NAV — horizontal pill bar (below h1)
          ══════════════════════════════════════════════════ */}
      <div className="lg:hidden mb-6">
        <AccountSidebar />
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN LAYOUT — Sidebar + Content
          ══════════════════════════════════════════════════ */}
      <div className="flex gap-8 lg:gap-12">
        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block flex-shrink-0">
          <AccountSidebar />
        </div>

        {/* ── Content area — nested route renders here ── */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
