/**
 * ═══════════════════════════════════════════════════════════════════
 * AuthLayout — Minimal Shell for Authentication Pages
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/layouts/AuthLayout.tsx
 *
 * Renders auth pages (Login, Register, ForgotPassword, ResetPassword)
 * without the storefront Header or Footer. Users who aren't logged in
 * shouldn't see nav links, cart icons, or account menus.
 *
 * ─── POSITION IN ROUTE TREE ────────────────────────────────────
 *
 *   RootLayout  (path: "/")
 *   ├── StorefrontLayout  (pathless — has Header + Footer)
 *   │   └── Home, Products, Cart, Account …
 *   │
 *   └── AuthLayout        ← this file (no path prefix)
 *       ├── /login
 *       ├── /register
 *       ├── /forgot-password
 *       └── /reset-password
 *
 * ─── LAYOUT ────────────────────────────────────────────────────
 *
 *   Full-screen centered card:
 *
 *   ┌──────────────────────────────────────┐
 *   │                                      │
 *   │          🌿  CannaSaas               │  ← logo / wordmark
 *   │                                      │
 *   │   ┌──────────────────────────────┐   │
 *   │   │                              │   │
 *   │   │   <Outlet />                 │   │  ← Login / Register etc.
 *   │   │   (auth page content)        │   │
 *   │   │                              │   │
 *   │   └──────────────────────────────┘   │
 *   │                                      │
 *   │   © 2025 CannaSaas · Privacy Policy  │  ← minimal footer text
 *   │                                      │
 *   └──────────────────────────────────────┘
 *
 * Accessibility (WCAG):
 *   - <main id="main-content"> landmark (1.3.1)
 *   - Logo link: aria-label "CannaSaas — go to home page" (2.4.4)
 *   - focus-visible ring on logo link (2.4.7)
 *   - min-h-screen ensures the layout never collapses on short pages
 *
 * Responsive:
 *   - Card: w-full max-w-md, mx-auto, px-4 on mobile
 *   - Centered vertically with flex + min-h-screen
 */

import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">

      {/* ── Centered content wrapper ── */}
      <main
        id="main-content"
        className="
          flex flex-1 flex-col items-center justify-center
          px-4 py-12 sm:py-16
        "
      >
        {/* ── Logo / Wordmark ── */}
        <Link
          to="/"
          aria-label="CannaSaas — go to home page"
          className="
            flex items-center gap-2 mb-8
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            rounded-sm
          "
        >
          <span aria-hidden="true" className="text-3xl">🌿</span>
          <span className="text-xl font-bold tracking-tight">CannaSaas</span>
        </Link>

        {/* ── Auth page card ── */}
        <div
          className="
            w-full max-w-md
            bg-background border border-border
            rounded-2xl shadow-sm
            p-6 sm:p-8
          "
        >
          {/* React Router renders Login / Register / etc. here */}
          <Outlet />
        </div>
      </main>

      {/* ── Minimal footer ── */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} CannaSaas
          {' · '}
          <Link
            to="/privacy"
            className="
              hover:text-foreground transition-colors
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              rounded-sm
            "
          >
            Privacy Policy
          </Link>
          {' · '}
          <Link
            to="/terms"
            className="
              hover:text-foreground transition-colors
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              rounded-sm
            "
          >
            Terms of Use
          </Link>
        </p>
      </footer>

    </div>
  );
}
