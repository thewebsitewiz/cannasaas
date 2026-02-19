/**
 * ═══════════════════════════════════════════════════════════════════
 * RootLayout — App-Level Provider Wrapper
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/layouts/RootLayout.tsx
 *
 * The topmost layout component rendered by React Router. Its sole
 * responsibility is to provide context that must live *inside* the
 * router (i.e., anything that calls useNavigate or useLocation).
 *
 * ─── WHY HERE AND NOT IN App.tsx? ──────────────────────────────
 *
 *   AuthProvider calls useNavigate() to redirect on session expiry.
 *   useNavigate() can only be called inside a component that is
 *   rendered by <RouterProvider> — calling it in App.tsx (outside
 *   the router) would throw:
 *
 *     "useNavigate() may be used only in the context of a <Router>"
 *
 *   RootLayout is the first component rendered *inside* the router,
 *   making it the correct home for AuthProvider.
 *
 * ─── POSITION IN ROUTE TREE ────────────────────────────────────
 *
 *   App.tsx
 *   └── RouterProvider
 *       └── RootLayout          ← this file  (path: "/")
 *           └── StorefrontLayout              (pathless)
 *               ├── Header
 *               ├── <main> <Outlet /> </main>
 *               └── Footer
 *
 * ─── EXTENDING THIS FILE ───────────────────────────────────────
 *
 *   Add additional router-aware providers here:
 *     - ThemeProvider (if reading theme from a URL param or cookie)
 *     - AnalyticsProvider (if tracking route changes)
 *     - FeatureFlagProvider (if reading flags from route state)
 *
 *   Context that does NOT need router access (Zustand stores,
 *   TanStack Query) stays in App.tsx / QueryProvider.
 *
 * Accessibility:
 *   This component renders no DOM of its own — it is a pure
 *   context wrapper. All accessibility landmarks are provided
 *   by StorefrontLayout (<header>, <main>, <footer>).
 */

import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      {/*
       * <Outlet /> renders the matched child route:
       *   - StorefrontLayout  for all storefront paths
       *   - AuthLayout        for /login, /register, etc.
       */}
      <Outlet />
    </AuthProvider>
  );
}
