/**
 * @file App.tsx
 * @app apps/storefront
 *
 * Root application component.
 *
 * Responsibilities:
 *   1. On mount: restore JWT session + resolve tenant from subdomain
 *   2. Render a full-page loading skeleton while initialization completes
 *   3. Render an error page if tenant resolution fails (unknown subdomain)
 *   4. Define all React Router routes with lazy-loaded page components
 *
 * Route structure:
 *   /                       → Home (public)
 *   /products               → Products list (public)
 *   /products/:id           → Product detail (public)
 *   /cart                   → Cart (public)
 *   /login                  → Login page
 *   /register               → Register page
 *   /checkout               → Checkout (ProtectedRoute)
 *   /orders/:id/confirmation → Order confirmation (ProtectedRoute)
 *   /account/*              → Account pages (ProtectedRoute + nested)
 *
 * Lazy loading: All page components are split at the route boundary to
 * minimise initial bundle size. The storefront's critical path is:
 *   Home → Products → ProductDetail → Cart → Checkout
 * All five pages are critical; Account pages are secondary.
 */

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { restoreSession } from '@cannasaas/api-client';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { AgeGate } from './components/ui/AgeGate';
import { SkeletonCard } from './components/ui/SkeletonCard';
import { ROUTES } from './routes';

// ── Lazy Page Imports ─────────────────────────────────────────────────────────

const HomePage          = lazy(() => import('./pages/Home').then(m => ({ default: m.HomePage })));
const ProductsPage      = lazy(() => import('./pages/Products').then(m => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetailPage })));
const CartPage          = lazy(() => import('./pages/Cart').then(m => ({ default: m.CartPage })));
const CheckoutPage      = lazy(() => import('./pages/Checkout').then(m => ({ default: m.CheckoutPage })));
const AccountPage       = lazy(() => import('./pages/Account').then(m => ({ default: m.AccountPage })));
const LoginPage         = lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })));
const RegisterPage      = lazy(() => import('./pages/Register').then(m => ({ default: m.RegisterPage })));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation').then(m => ({ default: m.OrderConfirmationPage })));
const NotFoundPage      = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFoundPage })));

// ── Page Loading Fallback ─────────────────────────────────────────────────────

/**
 * Shown during lazy-loaded page chunk fetch.
 * Uses SkeletonCard grid to prevent layout shift.
 */
function PageLoadingFallback() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────────────────────

/**
 * Wraps routes that require authentication.
 * While session restoration is in progress (isInitializing=true), renders
 * a loading state rather than immediately redirecting to /login — this
 * prevents a jarring redirect flash for users with valid sessions.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return <PageLoadingFallback />;
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL so we can redirect back after login
    return <Navigate to={ROUTES.login} state={{ from: window.location.pathname }} replace />;
  }

  return <>{children}</>;
}

// ── Tenant Resolution ─────────────────────────────────────────────────────────

/**
 * Resolves the tenant context from the current subdomain.
 * Calls GET /organizations/by-slug/:slug and populates organizationStore.
 *
 * Note: In development (localhost), defaults to the first available tenant.
 */
function useTenantResolution() {
  const { setOrganization, setLoading, setError } = useOrganizationStore();

  useEffect(() => {
    async function resolve() {
      setLoading(true);
      try {
        const hostname = window.location.hostname;
        // Extract subdomain: "green-leaf.cannasaas.com" → "green-leaf"
        // Local dev: "localhost" → use "demo" tenant
        const slug = hostname === 'localhost' || hostname === '127.0.0.1'
          ? 'demo'
          : hostname.split('.')[0];

        // Dynamic import to avoid circular dependency at module load time
        const { apiClient } = await import('@cannasaas/api-client');
        const { data } = await apiClient.get(`/organizations/by-slug/${slug}`);
        const ctx = data.data;
        setOrganization(ctx.organization, ctx.company, ctx.dispensary);
      } catch (err) {
        setError('Dispensary not found. Please check the URL and try again.');
      }
    }
    resolve();
  }, [setOrganization, setLoading, setError]);
}

// ── Scroll To Top On Navigation ───────────────────────────────────────────────

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// ── ThemeProvider ─────────────────────────────────────────────────────────────

/**
 * Applies the resolved tenant branding as CSS custom properties on <html>.
 * This enables Tailwind's `text-[hsl(var(--primary))]` utilities to respond
 * to tenant branding changes without requiring a full re-render.
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const cssVars = useOrganizationStore((s) => {
    const b = s.resolvedBranding;
    // hexToHsl is computed inside selectCssVars in organizationStore
    return s;
  });

  useEffect(() => {
    const { selectCssVars } = require('@cannasaas/stores');
    const vars = selectCssVars(useOrganizationStore.getState());
    const root = document.documentElement;
    Object.entries(vars).forEach(([prop, value]) => {
      root.style.setProperty(prop, value as string);
    });

    // Apply custom CSS from tenant branding (sanitised on backend)
    const customCss = useOrganizationStore.getState().resolvedBranding.customCss;
    if (customCss) {
      let styleEl = document.getElementById('tenant-custom-css') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'tenant-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = customCss;
    }
  }, [cssVars]);

  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const { isLoading, isResolved, error } = useOrganizationStore();

  // Bootstrap: restore session + resolve tenant (run once on mount)
  useEffect(() => {
    restoreSession(); // Non-blocking — updates authStore in background
  }, []);

  useTenantResolution();

  // Show full-page loading while tenant is being resolved
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading dispensary"
        className="min-h-screen flex items-center justify-center bg-stone-50"
      >
        {/* Organic spinner matching cannabis brand aesthetic */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-[hsl(var(--primary,154_40%_30%))] animate-spin" />
          <p className="text-sm text-stone-500 font-medium tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  // Tenant not found — show branded error page
  if (error || !isResolved) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4" aria-hidden="true">🌿</p>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Dispensary Not Found</h1>
          <p className="text-stone-500">
            {error ?? 'We couldn\'t find a dispensary at this address. Please check the URL.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <ThemeProvider>
      <ScrollToTop />
      {/* Age gate — renders as a modal overlay until session confirms 21+ */}
      <AgeGate />

      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* ── Storefront Layout (shared shell) ────────────────────────────── */}
          <Route element={<StorefrontLayout />}>
            <Route path={ROUTES.home}          element={<HomePage />} />
            <Route path={ROUTES.products}      element={<ProductsPage />} />
            <Route path="/products/:id"        element={<ProductDetailPage />} />
            <Route path={ROUTES.cart}          element={<CartPage />} />

            {/* Login / Register — redirect to home if already authenticated */}
            <Route path={ROUTES.login}    element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path={ROUTES.checkout} element={
              <ProtectedRoute><CheckoutPage /></ProtectedRoute>
            } />
            <Route path="/orders/:id/confirmation" element={
              <ProtectedRoute><OrderConfirmation /></ProtectedRoute>
            } />
            <Route path="/account/*" element={
              <ProtectedRoute><AccountPage /></ProtectedRoute>
            } />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
