/**
 * ═══════════════════════════════════════════════════════════════════
 * StorefrontLayout — Header + Main Content + Footer Shell
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/layouts/StorefrontLayout.tsx
 *
 * The primary layout wrapper for all storefront pages. Renders the
 * Header at the top, a <main> element with the React Router <Outlet>
 * for page content, and the Footer at the bottom.
 *
 * ─── POSITION IN THE ROUTER ───────────────────────────────────
 *
 *   RootLayout (providers)
 *   └── StorefrontLayout      ← this file
 *       ├── Header
 *       ├── <main id="main-content"> <Outlet /> </main>
 *       └── Footer
 *
 *   Every storefront route (Home, Products, ProductDetail, Cart,
 *   Checkout, Account) renders inside this layout's <Outlet>.
 *
 * ─── LAYOUT STRATEGY ──────────────────────────────────────────
 *
 *   Uses min-h-screen + flex-col to ensure the footer is always
 *   pushed to the bottom of the viewport, even on short pages.
 *   The <main> element gets flex-1 to fill remaining space.
 *
 *   The Header is sticky (handled internally). The Footer has
 *   mt-auto as a secondary push-down mechanism.
 *
 * ─── SCROLL RESTORATION ───────────────────────────────────────
 *
 *   <ScrollRestoration> from react-router-dom resets scroll to
 *   top on navigation, except when using browser back/forward
 *   (which restores the previous scroll position). This prevents
 *   the common SPA problem of landing mid-page after navigation.
 *
 * Accessibility (WCAG):
 *   - <main id="main-content"> is the skip-link target (2.4.1)
 *   - Landmark structure: <header>, <main>, <footer> (1.3.1)
 *   - Only one <main> element per page (best practice)
 *   - ScrollRestoration ensures focus isn't lost on navigate
 *
 * Responsive:
 *   - Full viewport height: min-h-screen
 *   - Content width: unconstrained (pages set their own max-w)
 *   - No horizontal padding here (pages handle their own)
 */

import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header, Footer } from '@/components/layout';

export default function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Header (sticky, handled internally) ── */}
      <Header />

      {/* ── Main Content Area ──
          id="main-content" is the target for the Header's
          skip-to-main-content link (WCAG 2.4.1). The flex-1
          ensures this area expands to fill available viewport
          height, pushing the Footer to the bottom. */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Scroll Restoration ──
          Resets scroll on forward navigation, preserves on
          back/forward. Must be inside the router context. */}
      <ScrollRestoration />
    </div>
  );
}
