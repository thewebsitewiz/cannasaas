/**
 * ═══════════════════════════════════════════════════════════════════
 * routes.tsx — Storefront Route Configuration
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/routes.tsx
 *
 * Route tree:
 *
 *   /                      → RootLayout  (AuthProvider, no UI)
 *     /                    → StorefrontLayout  (Header + Footer, pathless)
 *         index            → Home
 *         products         → Products
 *         products/:productId → ProductDetail   ← was "product/:productId"
 *         cart             → Cart
 *         checkout         → Checkout  (protected)
 *         account/*        → Account   (protected)
 *           index          → ProfileSection
 *           orders         → OrderHistory
 *           addresses      → SavedAddresses
 *           loyalty        → LoyaltyDashboard
 *           notifications  → NotificationPreferences
 *         dispensaries     → DispensaryLocator
 *         about            → About
 *         contact          → Contact
 *         *                → NotFound
 *
 *   /login                 → AuthLayout → Login
 *   /register              → AuthLayout → Register
 *   /forgot-password       → AuthLayout → ForgotPassword
 *   /reset-password        → AuthLayout → ResetPassword
 *
 * Fixes vs the original broken routes.tsx:
 *   1. Removed { path: 'product', element: <RecommendedProducts /> }
 *      RecommendedProducts is a component, not a page — it requires
 *      a productId prop and renders inside ProductDetail.
 *   2. Fixed path 'product/:productId' → 'products/:productId' to match
 *      all `to={`/products/${id}`}` links in the component tree.
 *   3. Added StorefrontLayout as a pathless nested route so every
 *      storefront page automatically gets the Header/Footer shell.
 *   4. Moved auth routes to root level (/login, /register …) to match
 *      navigate('/login') calls in AuthProvider's session handler.
 *   5. Removed the Shop import/route — no Shop.tsx page exists in the
 *      file manifest. Add back once that page is built.
 *   6. Non-critical pages use React.lazy + Suspense for code-splitting.
 */

import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';

// ── Layouts ───────────────────────────────────────────────────────────────────
import RootLayout       from '@/layouts/RootLayout';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AuthLayout       from '@/layouts/AuthLayout';

// ── Guard ─────────────────────────────────────────────────────────────────────
import ProtectedRoute from '@/components/ProtectedRoute';

// ── Eagerly loaded pages (above-the-fold, no spinner on first render) ─────────
import Home          from '@/pages/Home';
import Products      from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart          from '@/pages/Cart';
import Account       from '@/pages/Account';

// ── Account sub-sections (small, bundled with Account) ───────────────────────
import {
  ProfileSection,
  OrderHistory,
  SavedAddresses,
  LoyaltyDashboard,
  NotificationPreferences,
} from '@/components/account';

// ── Lazily loaded pages (code-split) ──────────────────────────────────────────
const Checkout          = lazy(() => import('@/pages/Checkout'));
const DispensaryLocator = lazy(() => import('@/pages/DispensaryLocator'));
const About             = lazy(() => import('@/pages/About'));
const Contact           = lazy(() => import('@/pages/Contact'));
const Login             = lazy(() => import('@/pages/Login'));
const Register          = lazy(() => import('@/pages/Register'));
const ForgotPassword    = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword     = lazy(() => import('@/pages/ResetPassword'));
const NotFound          = lazy(() => import('@/pages/NotFound'));

// ── Suspense wrapper ──────────────────────────────────────────────────────────
function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading page"
          className="flex items-center justify-center min-h-[50vh]"
        >
          <span className="sr-only">Loading…</span>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE TREE
// ═══════════════════════════════════════════════════════════════════

export const routes: RouteObject[] = [

  // ── Root (AuthProvider wrapper, no UI) ──────────────────────────
  {
    path: '/',
    element: <RootLayout />,
    children: [

      // ── Storefront shell (Header + Footer, pathless) ───────────
      {
        element: <StorefrontLayout />,
        children: [

          // ── Public routes ──────────────────────────────────────
          { index: true,       element: <Home /> },
          { path: 'products',  element: <Products /> },
          {
            // FIX: was 'product/:productId' — missing the 's'
            path: 'products/:productId',
            element: <ProductDetail />,
          },
          {
            path: 'dispensaries',
            element: <PageSuspense><DispensaryLocator /></PageSuspense>,
          },
          {
            path: 'about',
            element: <PageSuspense><About /></PageSuspense>,
          },
          {
            path: 'contact',
            element: <PageSuspense><Contact /></PageSuspense>,
          },

          // ── Cart (public — guests can build a cart) ────────────
          { path: 'cart', element: <Cart /> },

          // ── Checkout (protected) ───────────────────────────────
          {
            path: 'checkout',
            element: (
              <ProtectedRoute>
                <PageSuspense><Checkout /></PageSuspense>
              </ProtectedRoute>
            ),
          },

          // ── Account (protected, nested) ────────────────────────
          {
            path: 'account',
            element: (
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            ),
            children: [
              { index: true,            element: <ProfileSection /> },
              { path: 'orders',         element: <OrderHistory /> },
              { path: 'addresses',      element: <SavedAddresses /> },
              { path: 'loyalty',        element: <LoyaltyDashboard /> },
              { path: 'notifications',  element: <NotificationPreferences /> },
            ],
          },

          // ── 404 ────────────────────────────────────────────────
          {
            path: '*',
            element: <PageSuspense><NotFound /></PageSuspense>,
          },
        ],
      },
    ],
  },

  // ── Auth routes (no header/footer, no guard) ─────────────────────
  // FIX: At root level so they match navigate('/login') in AuthProvider.
  // If you prefer /auth/login, update navigate() calls in AuthProvider too.
  {
    element: <AuthLayout />,
    children: [
      { path: 'login',           element: <PageSuspense><Login /></PageSuspense> },
      { path: 'register',        element: <PageSuspense><Register /></PageSuspense> },
      { path: 'forgot-password', element: <PageSuspense><ForgotPassword /></PageSuspense> },
      { path: 'reset-password',  element: <PageSuspense><ResetPassword /></PageSuspense> },
    ],
  },
];
