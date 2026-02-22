/**
 * @file App.tsx
 * @app apps/storefront
 *
 * Root React Router v6 application shell for the storefront.
 *
 * ── Route hierarchy ──────────────────────────────────────────────────────────
 *
 *   RootLayout          ← tenant resolution + theme injection
 *   ├── AgeGate         ← 21+ confirmation (session cookie, all public routes)
 *   │
 *   ├── / (public)
 *   │   ├── /                 → HomePage
 *   │   ├── /products         → ProductsPage
 *   │   ├── /products/:slug   → ProductDetailPage
 *   │   ├── /search           → SearchResultsPage
 *   │   ├── /login            → StorefrontLogin
 *   │   ├── /register         → RegisterPage
 *   │   └── /forgot-password  → ForgotPasswordPage
 *   │
 *   └── / (requires auth: customer)
 *       ├── /cart             → CartPage
 *       ├── /checkout         → CheckoutPage
 *       ├── /orders           → OrderHistoryPage
 *       └── /account          → AccountPage
 *
 * ── Code splitting ───────────────────────────────────────────────────────────
 *
 * Every page is lazy-loaded behind React.lazy + Suspense so the initial bundle
 * only includes the router shell and shared layout components.
 *
 * ── Auth flow ────────────────────────────────────────────────────────────────
 *
 * After login, the user is redirected to location.state.from (the page they
 * were trying to reach before being bounced to /login). If no prior location
 * exists, they go to /products.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Suspense fallback: role="status" (4.1.3)
 *   - All pages update document.title (2.4.2)
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout }      from './components/layout/RootLayout';
import { AgeGate }         from './components/AgeGate';
import { ProtectedRoute }  from '@cannasaas/ui';

// ── Lazy-loaded pages ────────────────────────────────────────────────────────

const HomePage           = lazy(() => import('./pages/Home').then((m) => ({ default: m.HomePage })));
const ProductsPage       = lazy(() => import('./pages/Products').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage  = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetailPage })));
const SearchPage         = lazy(() => import('./pages/Search').then((m) => ({ default: m.SearchPage })));
const CartPage           = lazy(() => import('./pages/Cart').then((m) => ({ default: m.CartPage })));
const CheckoutPage       = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.CheckoutPage })));
const OrderHistoryPage   = lazy(() => import('./pages/OrderHistory').then((m) => ({ default: m.OrderHistoryPage })));
const AccountPage        = lazy(() => import('./pages/Account').then((m) => ({ default: m.AccountPage })));
const StorefrontLogin    = lazy(() => import('./pages/auth/Login').then((m) => ({ default: m.StorefrontLogin })));
const RegisterPage       = lazy(() => import('./pages/auth/Register').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPasswordPage })));

// ── Suspense fallback ────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    >
      <div
        aria-hidden="true"
        className="w-8 h-8 border-4 border-[hsl(var(--primary,154_40%_30%))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
      />
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/*
         * RootLayout is the outermost route — all other routes are children.
         * It handles tenant resolution before any page renders.
         */}
        <Route element={<RootLayout />}>

          {/* Public routes — visible to all (behind AgeGate) */}
          <Route element={<AgeGate />}>
            <Route index element={<HomePage />} />
            <Route path="products"          element={<ProductsPage />} />
            <Route path="products/:slug"    element={<ProductDetailPage />} />
            <Route path="search"            element={<SearchPage />} />
          </Route>

          {/* Auth pages — no AgeGate, no login requirement */}
          <Route path="login"           element={<StorefrontLogin />} />
          <Route path="register"        element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated customer routes */}
          <Route element={<ProtectedRoute requiredRole="customer" />}>
            <Route path="cart"     element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders"   element={<OrderHistoryPage />} />
            <Route path="account"  element={<AccountPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Route>
      </Routes>
    </Suspense>
  );
}
