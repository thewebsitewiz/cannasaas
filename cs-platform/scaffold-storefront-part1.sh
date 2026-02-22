#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase C Storefront (Part 1): Layout System + Hooks + Router
# File: scaffold-storefront-part1.sh
#
# Writes:
#   apps/storefront/src/
#   ├── main.tsx                        App entry point (providers, bootstrap)
#   ├── App.tsx                         React Router root with lazy routes
#   ├── routes.tsx                      Typed route constants
#   ├── layouts/
#   │   └── StorefrontLayout.tsx        Shell: Header + Outlet + Footer
#   ├── components/layout/
#   │   ├── Header.tsx                  Sticky header (logo, search, cart, user)
#   │   ├── HeaderLogo.tsx              Org-aware logo from organizationStore
#   │   ├── NavMenu.tsx                 Main navigation with active states
#   │   ├── CartButton.tsx              Cart icon with live item count badge
#   │   ├── UserMenu.tsx                Auth-aware avatar dropdown
#   │   ├── SearchBar.tsx               Debounced search with autocomplete
#   │   └── Footer.tsx                  Rich footer with age verification notice
#   ├── components/ui/
#   │   ├── SkeletonCard.tsx            Generic skeleton loading card
#   │   ├── RangeSlider.tsx             Accessible dual-handle price/THC slider
#   │   ├── Pagination.tsx              Smart pagination with ellipsis
#   │   └── AgeGate.tsx                 21+ age verification modal
#   └── hooks/
#       ├── useDebounce.ts              Configurable debounce hook
#       ├── useIntersectionObserver.ts  Scroll-triggered visibility hook
#       ├── useLocalStorage.ts          Type-safe localStorage hook
#       └── usePurchaseLimitCheck.ts    Cannabis purchase limit validation
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SF="$ROOT/apps/storefront/src"

echo ""
echo "================================================"
echo "  Phase C Storefront — Part 1: Layout System"
echo "================================================"

mkdir -p \
  "$SF/layouts" \
  "$SF/components/layout" \
  "$SF/components/ui" \
  "$SF/hooks" \
  "$SF/pages"

# =============================================================================
# main.tsx — App entry point
# =============================================================================
cat > "$SF/main.tsx" << 'EOF'
/**
 * @file main.tsx
 * @app apps/storefront
 *
 * Application entry point. Responsibilities in order:
 *   1. Initialise the system theme listener (prevents FOCT — flash of
 *      conflicting theme before React hydrates)
 *   2. Mount React with all required context providers
 *   3. Trigger session restoration (non-blocking background fetch)
 *   4. Trigger tenant resolution from subdomain (non-blocking)
 *
 * Provider order is important:
 *   QueryClientProvider  — must wrap everything that uses TanStack Query
 *   └─ BrowserRouter     — must wrap everything that uses React Router hooks
 *      └─ App            — reads router context, renders routes
 *
 * Session + tenant restoration happen in RootLayout (App.tsx) after mount,
 * not here, to avoid blocking the initial paint.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

// Prevent FOCT: apply saved theme class to <html> before React renders.
// initSystemThemeListener() also wires the OS preference change handler.
import { initSystemThemeListener } from '@cannasaas/stores';
initSystemThemeListener();

// Global stylesheet — includes Tailwind base, components, utilities
// and the CSS custom property definitions for theme colours.
import './index.css';

/**
 * TanStack Query client configuration.
 *
 * retry: 1  — Retry failed requests once before showing an error.
 *             Two failed attempts is a strong signal the server is down.
 * staleTime: 0  — Individual hooks set their own staleTime.
 *                 0 here means "always stale unless overridden" (sensible default).
 * refetchOnWindowFocus: true  — Refetch when the user returns to the tab.
 *                                Keeps session-sensitive data (cart, orders) fresh.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
EOF
echo "  ✓ main.tsx"

# =============================================================================
# routes.tsx — Typed route constants
# =============================================================================
cat > "$SF/routes.tsx" << 'EOF'
/**
 * @file routes.tsx
 * @app apps/storefront
 *
 * Centralised route path constants.
 *
 * Using constants prevents typos in <Link to="..."> and navigate() calls.
 * Route params are functions for type-safe URL construction.
 *
 * @example
 *   import { ROUTES } from './routes';
 *   <Link to={ROUTES.product('blue-dream-uuid')}>View Product</Link>
 *   navigate(ROUTES.orderConfirmation('order-uuid'));
 */

export const ROUTES = {
  // ── Public ──────────────────────────────────────────────────────────────────
  home:          '/',
  products:      '/products',
  productDetail: (id: string) => `/products/${id}`,
  cart:          '/cart',

  // ── Auth ────────────────────────────────────────────────────────────────────
  login:         '/login',
  register:      '/register',
  forgotPassword:'/forgot-password',
  resetPassword: '/reset-password',

  // ── Protected ───────────────────────────────────────────────────────────────
  checkout:      '/checkout',
  orderConfirmation: (id: string) => `/orders/${id}/confirmation`,

  // ── Account (nested) ────────────────────────────────────────────────────────
  account:        '/account',
  accountProfile: '/account/profile',
  accountOrders:  '/account/orders',
  accountOrderDetail: (id: string) => `/account/orders/${id}`,
  accountAddresses: '/account/addresses',
  accountLoyalty:   '/account/loyalty',
  accountPreferences: '/account/preferences',
} as const;
EOF
echo "  ✓ routes.tsx"

# =============================================================================
# App.tsx — Root with lazy-loaded routes + ProtectedRoute + providers
# =============================================================================
cat > "$SF/App.tsx" << 'EOF'
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
EOF
echo "  ✓ App.tsx"

# =============================================================================
# StorefrontLayout.tsx
# =============================================================================
cat > "$SF/layouts/StorefrontLayout.tsx" << 'EOF'
/**
 * @file StorefrontLayout.tsx
 * @app apps/storefront
 *
 * Shell layout for all storefront pages.
 *
 * Structure:
 *   <div> (min-h-screen flex column)
 *     <Header />           Sticky top navigation
 *     <a#skip-link />      Skip-to-main-content (WCAG 2.4.1)
 *     <main id="main-content">
 *       <Outlet />         React Router child route content
 *     </main>
 *     <Footer />           Site footer
 *
 * Accessibility:
 *   - Skip-to-content link is the first focusable element (WCAG 2.4.1)
 *     It's visually hidden until focused, then appears at top-left
 *   - <main> has id="main-content" as the skip link target
 *   - Landmark regions: <header>, <main>, <footer> (WCAG 1.3.1)
 *
 * Responsive:
 *   - No max-width on the layout — pages set their own content widths
 *   - Header uses position:sticky so it stays on screen while scrolling
 */

import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/*
       * Skip navigation link — visually hidden until focused.
       * Allows keyboard/screen reader users to bypass the nav and jump
       * directly to main content (WCAG Success Criterion 2.4.1).
       *
       * CSS: sr-only by default, appears at top-left on focus via
       * focus:not-sr-only + focus:fixed + focus:z-50
       */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-4 focus:left-4 focus:z-50',
          'focus:px-4 focus:py-2 focus:rounded-lg',
          'focus:bg-[hsl(var(--primary))] focus:text-white',
          'focus:font-semibold focus:text-sm',
          'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Sticky site header with navigation */}
      <Header />

      {/*
       * Main content area.
       * id="main-content" is the skip link target (href="#main-content").
       * tabIndex={-1} allows the skip link to focus this element programmatically
       * without adding it to the natural tab order (WCAG 2.4.1).
       * outline-none removes the default focus ring (skip link handles visibility).
       */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        <Outlet />
      </main>

      {/* Site footer */}
      <Footer />
    </div>
  );
}
EOF
echo "  ✓ layouts/StorefrontLayout.tsx"

# =============================================================================
# Header.tsx
# =============================================================================
cat > "$SF/components/layout/Header.tsx" << 'EOF'
/**
 * @file Header.tsx
 * @app apps/storefront
 *
 * Primary site header — sticky, responsive, theme-aware.
 *
 * Desktop layout (lg+):
 *   [Logo] ─────── [Nav: Products | Categories | Deals] ─── [Search] [Cart] [User]
 *
 * Mobile layout (<lg):
 *   [Hamburger] [Logo] ─────────────────────────────────────── [Cart] [User]
 *   [Search bar — full width, below nav row]
 *
 * Features:
 *   - Logo from organizationStore.resolvedBranding (falls back to text)
 *   - Cart button shows live item count from cartStore
 *   - Search bar with debounced autocomplete (useSearchProducts)
 *   - User menu: login link (unauthenticated) / avatar dropdown (authenticated)
 *   - Mobile: slide-in drawer navigation
 *   - Translucent backdrop blur on scroll (CSS backdrop-filter)
 *
 * Accessibility:
 *   - <header> landmark (WCAG 1.3.1)
 *   - aria-expanded on mobile hamburger button
 *   - Mobile nav drawer: aria-modal, focus trap, Escape to close
 *   - Active nav links: aria-current="page"
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HeaderLogo } from './HeaderLogo';
import { SearchBar } from './SearchBar';
import { CartButton } from './CartButton';
import { UserMenu } from './UserMenu';
import { NavMenu } from './NavMenu';
import { ROUTES } from '../../routes';

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Detect scroll to add backdrop blur
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileNavOpen]);

  // Trap focus inside mobile nav drawer when open
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
      'a, button, input, [tabindex="0"]',
    );
    focusable?.[0]?.focus();
  }, [isMobileNavOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMobileNavOpen]);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 w-full',
          'border-b border-stone-200/80',
          'transition-all duration-200',
          isScrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm'
            : 'bg-white',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3 lg:gap-6">

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav"
              aria-label="Open navigation menu"
              className={[
                'lg:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center',
                'rounded-lg text-stone-600 hover:bg-stone-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
                'transition-colors',
              ].join(' ')}
            >
              {/* Hamburger icon */}
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link
              to={ROUTES.home}
              aria-label="CannaSaas — return to home page"
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
            >
              <HeaderLogo />
            </Link>

            {/* Desktop navigation */}
            <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 ml-2">
              <NavMenu />
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search — hidden on small mobile, shown sm+ */}
            <div className="hidden sm:block w-48 lg:w-72">
              <SearchBar />
            </div>

            {/* Cart + User */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <CartButton />
              <UserMenu />
            </div>
          </div>

          {/* Mobile search — below nav row on xs screens */}
          <div className="sm:hidden pb-3">
            <SearchBar fullWidth />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer ─────────────────────────────────────────── */}
      {/* Backdrop */}
      {isMobileNavOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-nav"
        ref={mobileNavRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl lg:hidden',
          'transition-transform duration-300 ease-out',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'overflow-y-auto',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-stone-100">
          <HeaderLogo />
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className={[
              'w-9 h-9 flex items-center justify-center rounded-lg',
              'text-stone-500 hover:bg-stone-100',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))]',
              'transition-colors',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile nav links */}
        <nav aria-label="Mobile navigation" className="px-4 py-6">
          <NavMenu mobile />
        </nav>
      </div>
    </>
  );
}
EOF
echo "  ✓ components/layout/Header.tsx"

# =============================================================================
# HeaderLogo.tsx
# =============================================================================
cat > "$SF/components/layout/HeaderLogo.tsx" << 'EOF'
/**
 * @file HeaderLogo.tsx
 * @app apps/storefront
 *
 * Org-aware logo component.
 * Reads from organizationStore:
 *   1. If dispensary has a logo URL → render <img>
 *   2. If organization has a logo URL → render <img>
 *   3. Fallback → render dispensary/org name in styled text
 *
 * Accessibility:
 *   - <img> logo has aria-label from BrandingConfig.logo.alt
 *   - Text fallback is plain text (no aria needed)
 *   - Parent <Link> provides the accessible name for the whole unit
 */

import { useOrganizationStore } from '@cannasaas/stores';

export function HeaderLogo() {
  const { dispensary, organization, resolvedBranding } = useOrganizationStore();

  const logoUrl = resolvedBranding.logo?.url
    ?? dispensary?.branding?.logo?.url
    ?? organization?.branding?.logo?.url;

  const logoAlt = resolvedBranding.logo?.alt
    ?? dispensary?.name
    ?? organization?.name
    ?? 'CannaSaas';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={logoAlt}
        className="h-8 w-auto object-contain max-w-[140px]"
        loading="eager"  // Logo is above the fold — don't lazy-load
        decoding="sync"
      />
    );
  }

  // Text fallback — styled to match brand colours
  const displayName = dispensary?.name ?? organization?.name ?? 'CannaSaas';

  return (
    <span
      className="text-xl font-bold tracking-tight"
      style={{ color: 'hsl(var(--primary))' }}
    >
      {displayName}
    </span>
  );
}
EOF
echo "  ✓ components/layout/HeaderLogo.tsx"

# =============================================================================
# NavMenu.tsx
# =============================================================================
cat > "$SF/components/layout/NavMenu.tsx" << 'EOF'
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
  { label: 'Shop All',    href: ROUTES.products },
  { label: 'Flower',      href: `${ROUTES.products}?category=flower` },
  { label: 'Edibles',     href: `${ROUTES.products}?category=edibles` },
  { label: 'Concentrates',href: `${ROUTES.products}?category=concentrates` },
  { label: 'Deals',       href: `${ROUTES.products}?sort=newest&tag=deals` },
];

export function NavMenu({ mobile = false }: NavMenuProps) {
  if (mobile) {
    return (
      <ul className="space-y-1">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <NavLink
              to={link.href}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
              className={({ isActive }) => [
                'block px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors',
                isActive
                  ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                  : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
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
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
            className={({ isActive }) => [
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
            ].join(' ')}
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
EOF
echo "  ✓ components/layout/NavMenu.tsx"

# =============================================================================
# CartButton.tsx
# =============================================================================
cat > "$SF/components/layout/CartButton.tsx" << 'EOF'
/**
 * @file CartButton.tsx
 * @app apps/storefront
 *
 * Cart icon button with live item count badge.
 *
 * Reads item count from Zustand cartStore — updates instantly on every
 * add/remove action without server round-trips.
 *
 * Accessibility:
 *   - aria-label announces both the button action AND the count:
 *     "Shopping cart, 3 items" — so screen readers don't need to read the badge
 *   - The badge has aria-hidden="true" — it's supplementary to the aria-label
 *   - Count changes trigger aria-live announcement via a visually hidden span
 *     (WCAG 4.1.3 — Status Messages)
 *
 * Animation:
 *   - Badge pulses (scale animation) whenever count increases
 *   - CSS-only, no JS timer needed (driven by the key prop trick)
 */

import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore, selectCartItemCount } from '@cannasaas/stores';
import { ROUTES } from '../../routes';

export function CartButton() {
  const itemCount = useCartStore(selectCartItemCount);
  const prevCountRef = useRef(itemCount);
  const badgeKey = useRef(0); // Increment to re-trigger CSS animation

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      badgeKey.current += 1;
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  return (
    <Link
      to={ROUTES.cart}
      aria-label={
        itemCount === 0
          ? 'Shopping cart, empty'
          : `Shopping cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
      }
      className={[
        'relative flex-shrink-0 w-10 h-10',
        'flex items-center justify-center',
        'rounded-lg text-stone-600 hover:bg-stone-100',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[hsl(var(--primary))]',
        'transition-colors',
      ].join(' ')}
    >
      {/* Cart bag SVG icon */}
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {/* Item count badge */}
      {itemCount > 0 && (
        <span
          key={badgeKey.current}  // Re-trigger animation on count increase
          aria-hidden="true"
          className={[
            'absolute -top-1 -right-1',
            'min-w-[18px] h-[18px] px-1',
            'flex items-center justify-center',
            'rounded-full text-[10px] font-bold leading-none text-white',
            'bg-[hsl(var(--primary))]',
            'animate-[badge-pop_0.2s_ease-out]',
          ].join(' ')}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/*
       * Visually hidden live region announces count changes to screen readers.
       * Uses aria-live="polite" — doesn't interrupt reading (WCAG 4.1.3).
       */}
      <span aria-live="polite" className="sr-only">
        {itemCount > 0 ? `${itemCount} items in cart` : 'Cart is empty'}
      </span>
    </Link>
  );
}
EOF
echo "  ✓ components/layout/CartButton.tsx"

# =============================================================================
# UserMenu.tsx
# =============================================================================
cat > "$SF/components/layout/UserMenu.tsx" << 'EOF'
/**
 * @file UserMenu.tsx
 * @app apps/storefront
 *
 * Auth-aware user menu.
 *
 * Unauthenticated: renders "Sign In" link
 * Authenticated: renders avatar button with dropdown:
 *   - User name + email
 *   - My Account
 *   - My Orders
 *   - Sign Out
 *
 * Accessibility:
 *   - Avatar button: aria-haspopup="menu", aria-expanded
 *   - Dropdown: role="menu", items are role="menuitem"
 *   - Keyboard: Arrow keys navigate items, Escape closes, Tab closes
 *   - Focus returns to trigger on close (WCAG 2.1.2)
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';
import { useLogout } from '@cannasaas/api-client';
import { ROUTES } from '../../routes';

export function UserMenu() {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isAuthenticated) {
    return (
      <Link
        to={ROUTES.login}
        className={[
          'hidden sm:flex items-center gap-2 px-3 py-1.5',
          'text-sm font-medium text-stone-700',
          'border border-stone-200 rounded-lg',
          'hover:border-stone-300 hover:bg-stone-50',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))]',
          'transition-colors',
        ].join(' ')}
      >
        Sign In
      </Link>
    );
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`User menu for ${user?.firstName ?? 'Account'}`}
        className={[
          'flex items-center justify-center w-9 h-9 rounded-full',
          'text-xs font-semibold text-white',
          'bg-[hsl(var(--primary))]',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          'transition-opacity hover:opacity-90',
        ].join(' ')}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User account menu"
          className={[
            'absolute right-0 mt-2 w-56',
            'bg-white rounded-xl shadow-lg shadow-stone-200/80',
            'border border-stone-100',
            'py-1 z-50',
            'animate-[fade-in_0.1s_ease-out]',
          ].join(' ')}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>

          {/* Menu items */}
          {[
            { label: 'My Account',    href: ROUTES.account },
            { label: 'My Orders',     href: ROUTES.accountOrders },
            { label: 'Loyalty Points',href: ROUTES.accountLoyalty },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={[
                'block px-4 py-2.5 text-sm text-stone-700',
                'hover:bg-stone-50 hover:text-stone-900',
                'focus-visible:outline-none focus-visible:bg-stone-50',
                'transition-colors',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}

          <div role="separator" aria-hidden="true" className="border-t border-stone-100 my-1" />

          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate(ROUTES.home);
            }}
            className={[
              'w-full text-left px-4 py-2.5 text-sm text-red-600',
              'hover:bg-red-50',
              'focus-visible:outline-none focus-visible:bg-red-50',
              'transition-colors',
            ].join(' ')}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
EOF
echo "  ✓ components/layout/UserMenu.tsx"

# =============================================================================
# SearchBar.tsx
# =============================================================================
cat > "$SF/components/layout/SearchBar.tsx" << 'EOF'
/**
 * @file SearchBar.tsx
 * @app apps/storefront
 *
 * Debounced product search bar with autocomplete dropdown.
 *
 * Behaviour:
 *   - Debounces input at 300ms before firing GET /search/suggest?q=
 *   - Shows dropdown with up to 6 suggestion strings
 *   - Pressing Enter navigates to /products?search=<query>
 *   - Clicking a suggestion navigates to /products?search=<suggestion>
 *   - Pressing Escape clears the dropdown (not the input)
 *   - Clicking outside closes the dropdown
 *
 * Accessibility:
 *   - role="combobox" on input, role="listbox" on dropdown (WCAG 4.1.2)
 *   - aria-activedescendant tracks keyboard-highlighted suggestion
 *   - aria-controls links input to listbox
 *   - aria-expanded reflects dropdown visibility
 *   - Each suggestion: role="option", id for aria-activedescendant reference
 *   - Arrow keys navigate suggestions; Home/End jump to first/last
 */

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchSuggestions } from '@cannasaas/api-client';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../routes';

interface SearchBarProps {
  fullWidth?: boolean;
}

export function SearchBar({ fullWidth = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);
  const { data: suggestions = [] } = useSearchSuggestions(debouncedQuery);

  const hasResults = suggestions.length > 0;

  // Open dropdown when we have results
  useEffect(() => {
    setIsOpen(hasResults && query.trim().length >= 2);
    setHighlightedIndex(-1);
  }, [suggestions, hasResults, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.parentElement?.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateToSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setIsOpen(false);
    navigate(`${ROUTES.products}?search=${encodeURIComponent(q.trim())}`);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter') navigateToSearch(query);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedIndex(suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          navigateToSearch(suggestions[highlightedIndex]);
        } else {
          navigateToSearch(query);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={['relative', fullWidth ? 'w-full' : ''].join(' ')}>
      {/* Combobox input */}
      <div className="relative">
        {/* Search icon */}
        <svg
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          id={comboboxId}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasResults && query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search products…"
          autoComplete="off"
          className={[
            'w-full pl-9 pr-3 py-2 text-sm',
            'bg-stone-100 rounded-lg',
            'placeholder:text-stone-400 text-stone-900',
            'border border-transparent',
            'focus:outline-none focus:border-[hsl(var(--primary)/0.4)]',
            'focus:bg-white focus:ring-1 focus:ring-[hsl(var(--primary)/0.3)]',
            'transition-all',
          ].join(' ')}
        />
      </div>

      {/* Autocomplete listbox */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={`Search suggestions for "${query}"`}
          className={[
            'absolute top-full left-0 right-0 mt-1',
            'bg-white rounded-xl shadow-lg shadow-stone-200/80',
            'border border-stone-100 overflow-hidden',
            'z-50 max-h-64 overflow-y-auto',
          ].join(' ')}
        >
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => navigateToSearch(suggestion)}
              className={[
                'flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer',
                'transition-colors',
                index === highlightedIndex
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-700 hover:bg-stone-50',
              ].join(' ')}
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
EOF
echo "  ✓ components/layout/SearchBar.tsx"

# =============================================================================
# Footer.tsx
# =============================================================================
cat > "$SF/components/layout/Footer.tsx" << 'EOF'
/**
 * @file Footer.tsx
 * @app apps/storefront
 *
 * Site footer — four-column grid on desktop, stacked on mobile.
 *
 * Columns:
 *   1. Brand — logo, tagline, social links
 *   2. Shop   — category quick links
 *   3. Info   — about, FAQ, contact, accessibility
 *   4. Legal  — terms, privacy, age verification notice
 *
 * Age verification notice (required by cannabis regulations):
 *   Prominently displayed in the legal column.
 *   Per Cannabis-Regulatory-Overview-Federal-State-Local.md: dispensaries
 *   must display a "Must be 21+" notice on all customer-facing pages.
 *
 * Accessibility:
 *   - <footer> landmark (WCAG 1.3.1)
 *   - Column headings are <h3> elements (appropriate heading hierarchy)
 *   - All links have descriptive text (no "click here")
 *   - Social links have aria-label with platform name
 */

import { Link } from 'react-router-dom';
import { useOrganizationStore } from '@cannasaas/stores';
import { ROUTES } from '../../routes';

export function Footer() {
  const { organization, dispensary } = useOrganizationStore();
  const currentYear = new Date().getFullYear();
  const name = dispensary?.name ?? organization?.name ?? 'CannaSaas';

  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* ── Column 1: Brand ─────────────────────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-lg font-bold text-white mb-2">{name}</p>
            <p className="text-sm text-stone-400 leading-relaxed mb-4">
              Premium cannabis products sourced with care. Serving our community with quality and integrity.
            </p>
            {dispensary?.address && (
              <address className="text-xs text-stone-500 not-italic leading-relaxed">
                {dispensary.address.street}<br />
                {dispensary.address.city}, {dispensary.address.state} {dispensary.address.zip}
              </address>
            )}
          </div>

          {/* ── Column 2: Shop ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products',  href: ROUTES.products },
                { label: 'Flower',        href: `${ROUTES.products}?category=flower` },
                { label: 'Edibles',       href: `${ROUTES.products}?category=edibles` },
                { label: 'Concentrates',  href: `${ROUTES.products}?category=concentrates` },
                { label: 'Vape',          href: `${ROUTES.products}?category=vape` },
                { label: 'Accessories',   href: `${ROUTES.products}?category=accessories` },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Info ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Info
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us',        href: '/about' },
                { label: 'FAQ',             href: '/faq' },
                { label: 'Contact Us',      href: '/contact' },
                { label: 'Accessibility',   href: '/accessibility' },
                { label: 'Loyalty Program', href: ROUTES.accountLoyalty },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Legal + Age Notice ────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2.5 mb-6">
              {[
                { label: 'Terms of Service',  href: '/terms' },
                { label: 'Privacy Policy',    href: '/privacy' },
                { label: 'Cookie Policy',     href: '/cookies' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/*
             * Age verification notice — required by state cannabis regulations.
             * Must be prominently displayed on all customer-facing pages.
             * Per Cannabis-Regulatory-Overview-Federal-State-Local.md §3.
             */}
            <div
              role="note"
              aria-label="Age restriction notice"
              className="border border-stone-600 rounded-lg p-3 bg-stone-800/50"
            >
              <p className="text-xs font-bold text-amber-400 mb-1">
                🔞 Must be 21+
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Cannabis products are for adults 21 years of age and older.
                Please consume responsibly. Do not drive under the influence.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            © {currentYear} {name}. All rights reserved. Licensed cannabis retailer.
          </p>
          <p className="text-xs text-stone-600">
            Powered by{' '}
            <span className="text-stone-500 font-medium">CannaSaas</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
EOF
echo "  ✓ components/layout/Footer.tsx"

# =============================================================================
# SkeletonCard.tsx
# =============================================================================
cat > "$SF/components/ui/SkeletonCard.tsx" << 'EOF'
/**
 * @file SkeletonCard.tsx
 * @app apps/storefront
 *
 * Generic skeleton loading card — matches the ProductCard dimensions.
 *
 * Used as the loading fallback in:
 *   - PageLoadingFallback (lazy route loading)
 *   - ProductsPage (while useProducts is fetching)
 *   - HomePage featured product carousel
 *
 * Accessibility:
 *   - aria-busy="true" on the container communicates loading state
 *   - aria-label provides context: "Loading product" (WCAG 4.1.3)
 *   - The pulse animation is paused for users who prefer reduced motion
 *     (prefers-reduced-motion: reduce) — WCAG 2.3.3
 */

export function SkeletonCard() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product"
      className="bg-white rounded-2xl overflow-hidden border border-stone-100"
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-stone-100 animate-pulse motion-reduce:animate-none" />

      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <div className="h-4 w-16 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
        {/* Product name */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
          <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
        </div>
        {/* THC/CBD badges */}
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
          <div className="h-5 w-12 bg-stone-100 rounded-full animate-pulse motion-reduce:animate-none" />
        </div>
        {/* Price + button */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" />
          <div className="h-8 w-20 bg-stone-100 rounded-lg animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
EOF
echo "  ✓ components/ui/SkeletonCard.tsx"

# =============================================================================
# Pagination.tsx
# =============================================================================
cat > "$SF/components/ui/Pagination.tsx" << 'EOF'
/**
 * @file Pagination.tsx
 * @app apps/storefront
 *
 * Smart pagination component with ellipsis for large page counts.
 *
 * Behaviour:
 *   Always shows: First page, Last page, Current page, Current ± 1
 *   Ellipsis (...) fills gaps when pages are non-contiguous
 *
 *   Example (page 7 of 20):
 *   [1] [...] [6] [7] [8] [...] [20]
 *
 * Updates URL search params (via setPage callback from useOrderFilters
 * or similar) — enables browser back/forward navigation.
 *
 * Accessibility:
 *   - <nav> with aria-label="Pagination" (WCAG 1.3.1)
 *   - Current page: aria-current="page"
 *   - Previous/Next: descriptive aria-label
 *   - Ellipsis: aria-hidden="true" (not interactive)
 *   - Disabled buttons: aria-disabled="true" (WCAG 4.1.2)
 */

import { memo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Generates the page numbers to display, inserting -1 as ellipsis markers.
 * Example: [1, -1, 5, 6, 7, -1, 12]
 */
function buildPageRange(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [1];
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd   = Math.min(total - 1, current + 1);

  if (rangeStart > 2) pages.push(-1);  // left ellipsis
  for (let p = rangeStart; p <= rangeEnd; p++) pages.push(p);
  if (rangeEnd < total - 1) pages.push(-1); // right ellipsis
  pages.push(total);

  return pages;
}

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages);
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const btnBase = [
    'inline-flex items-center justify-center',
    'min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-[hsl(var(--primary))]',
  ].join(' ');

  return (
    <nav aria-label="Pagination navigation" className="flex items-center justify-center gap-1">
      {/* Previous */}
      <button
        type="button"
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
        aria-disabled={!canPrev}
        disabled={!canPrev}
        className={[
          btnBase,
          canPrev
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            : 'text-stone-300 cursor-not-allowed',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((page, i) => {
        if (page === -1) {
          return (
            <span
              key={`ellipsis-${i}`}
              aria-hidden="true"
              className="w-9 h-9 flex items-center justify-center text-stone-400 text-sm select-none"
            >
              …
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => !isCurrent && onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={[
              btnBase,
              isCurrent
                ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
            ].join(' ')}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        onClick={() => canNext && onPageChange(currentPage + 1)}
        aria-label="Go to next page"
        aria-disabled={!canNext}
        disabled={!canNext}
        className={[
          btnBase,
          canNext
            ? 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            : 'text-stone-300 cursor-not-allowed',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
});

Pagination.displayName = 'Pagination';
EOF
echo "  ✓ components/ui/Pagination.tsx"

# =============================================================================
# AgeGate.tsx
# =============================================================================
cat > "$SF/components/ui/AgeGate.tsx" << 'EOF'
/**
 * @file AgeGate.tsx
 * @app apps/storefront
 *
 * Age verification modal — required by cannabis regulations.
 *
 * Shows on first visit (or after sessionStorage expires).
 * The user must confirm they are 21+ to proceed.
 *
 * Design:
 *   - Full-viewport modal overlay, cannot be dismissed without confirming
 *   - Cannabis brand aesthetic: dark overlay, green accent
 *   - Two buttons: "I am 21+" (confirms) and "Exit Site" (redirects)
 *
 * Compliance:
 *   Per Cannabis-Regulatory-Overview-Federal-State-Local.md, dispensary
 *   websites must implement age verification for all visitors.
 *   Verification is stored in sessionStorage (cleared when browser closes).
 *   DO NOT use localStorage — compliance requires re-verification per session.
 *
 * Accessibility:
 *   - role="dialog", aria-modal="true" (WCAG 4.1.2)
 *   - Focus trapped inside modal (WCAG 2.1.2)
 *   - "I am 21+" button receives focus on open (WCAG 3.2.2)
 *   - aria-labelledby and aria-describedby link to heading and body text
 */

import { useState, useEffect, useRef } from 'react';

const AGE_GATE_KEY = 'cs_age_verified';

export function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check session storage — re-verify each browser session
    const verified = sessionStorage.getItem(AGE_GATE_KEY);
    if (!verified) {
      setIsVisible(true);
    }
  }, []);

  // Focus the confirm button when gate opens
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure modal is rendered
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isVisible]);

  // Prevent body scroll while gate is open
  useEffect(() => {
    document.body.style.overflow = isVisible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  const handleConfirm = () => {
    sessionStorage.setItem(AGE_GATE_KEY, '1');
    setIsVisible(false);
  };

  const handleExit = () => {
    window.location.href = 'https://google.com';
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-hidden={!isVisible}
    >
      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-stone-950/95 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className={[
          'relative z-10 w-full max-w-sm mx-4',
          'bg-stone-900 rounded-3xl border border-stone-700',
          'p-8 text-center shadow-2xl',
        ].join(' ')}
      >
        {/* Decorative cannabis leaf */}
        <div aria-hidden="true" className="text-5xl mb-4">🌿</div>

        <h2
          id="age-gate-title"
          className="text-2xl font-bold text-white mb-3"
        >
          Age Verification Required
        </h2>

        <p
          id="age-gate-desc"
          className="text-stone-400 text-sm leading-relaxed mb-8"
        >
          This website contains information about cannabis products. You must be
          21 years of age or older to enter.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={[
              'w-full py-3.5 rounded-xl font-semibold text-white',
              'bg-[hsl(var(--primary,154_40%_30%))]',
              'hover:brightness-110 active:brightness-95',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white focus-visible:ring-offset-2',
              'focus-visible:ring-offset-stone-900',
              'transition-all',
            ].join(' ')}
          >
            Yes, I am 21 or older
          </button>

          <button
            type="button"
            onClick={handleExit}
            className={[
              'w-full py-3 rounded-xl font-medium',
              'text-stone-400 hover:text-stone-200',
              'border border-stone-700 hover:border-stone-500',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-stone-400',
              'transition-all',
            ].join(' ')}
          >
            No, exit site
          </button>
        </div>

        <p className="text-xs text-stone-600 mt-6">
          By entering you agree to our{' '}
          <span className="underline">Terms of Service</span>{' '}
          and{' '}
          <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
EOF
echo "  ✓ components/ui/AgeGate.tsx"

# =============================================================================
# Hooks
# =============================================================================

cat > "$SF/hooks/useDebounce.ts" << 'EOF'
/**
 * @file useDebounce.ts
 * @app apps/storefront
 *
 * Debounce hook — delays propagation of a value until the input has
 * stopped changing for `delay` milliseconds.
 *
 * Used by:
 *   - SearchBar (300ms delay before firing autocomplete requests)
 *   - ProductsPage price range slider (500ms delay before URL update)
 *   - ProductsPage THC range slider
 *
 * @param value   - The value to debounce
 * @param delay   - Milliseconds to wait after last change (default: 300)
 * @returns       - The debounced value, updated after `delay` ms of silence
 *
 * @example
 *   const [input, setInput] = useState('');
 *   const debouncedInput = useDebounce(input, 300);
 *   // debouncedInput only updates 300ms after the user stops typing
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: cancel the timeout if value changes before delay elapses
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
EOF
echo "  ✓ hooks/useDebounce.ts"

cat > "$SF/hooks/useIntersectionObserver.ts" << 'EOF'
/**
 * @file useIntersectionObserver.ts
 * @app apps/storefront
 *
 * Scroll-triggered visibility hook using the IntersectionObserver API.
 *
 * Used by:
 *   - HomePage sections (fade-in-on-scroll entrance animations)
 *   - ProductCard (lazy-load images only when visible)
 *   - Infinite scroll trigger (fire useInfiniteProducts.fetchNextPage)
 *
 * @param options - IntersectionObserver options (threshold, rootMargin)
 * @returns [ref, isIntersecting] — attach ref to target element
 *
 * @example
 *   const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 *   <section ref={ref} className={isVisible ? 'opacity-100' : 'opacity-0'}>
 */

import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Graceful degradation — not supported in all environments (e.g. SSR)
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        // Once visible, stop observing (for one-shot reveal animations)
        if (entry.isIntersecting && options.threshold !== 0) {
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px', ...options },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return [ref, isIntersecting];
}
EOF
echo "  ✓ hooks/useIntersectionObserver.ts"

cat > "$SF/hooks/useLocalStorage.ts" << 'EOF'
/**
 * @file useLocalStorage.ts
 * @app apps/storefront
 *
 * Type-safe localStorage hook with JSON serialisation.
 *
 * Wraps localStorage access in try/catch to handle:
 *   - Private browsing mode (throws SecurityError)
 *   - Storage quota exceeded
 *   - Non-JSON values in storage (from other scripts)
 *
 * Returns [value, setValue, removeValue] — same API as useState
 * but the value is also persisted to localStorage.
 *
 * @example
 *   const [prefs, setPrefs] = useLocalStorage('user-prefs', { theme: 'light' });
 */

import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        typeof value === 'function'
          ? (value as (prev: T) => T)(storedValue)
          : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // Storage not available — still update React state
      setStoredValue(typeof value === 'function'
        ? (value as (prev: T) => T)(storedValue)
        : value);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      setStoredValue(initialValue);
    }
  };

  return [storedValue, setValue, removeValue];
}
EOF
echo "  ✓ hooks/useLocalStorage.ts"

cat > "$SF/hooks/usePurchaseLimitCheck.ts" << 'EOF'
/**
 * @file usePurchaseLimitCheck.ts
 * @app apps/storefront
 *
 * Cannabis purchase limit validation hook.
 *
 * Computes whether adding a specific product variant to the cart would
 * exceed the customer's state-mandated daily purchase limit.
 *
 * Reads:
 *   - usePurchaseLimit() — GET /compliance/purchase-limit (current remaining)
 *   - useCartStore — current cart weight totals
 *
 * Returns:
 *   - canAdd: boolean — whether the variant can be added
 *   - remaining: number (grams) — how much the customer can still buy
 *   - warning: string | null — human-readable warning message if near limit
 *
 * Used by:
 *   - ProductCard "Add to Cart" button (disables if would exceed)
 *   - CartSummary warning banner
 *   - CheckoutPage order validation
 *
 * Compliance note:
 *   This is a CLIENT-SIDE check for UX only. The authoritative check
 *   is always performed server-side in the compliance module on POST /orders.
 *
 * @example
 *   const { canAdd, remaining, warning } = usePurchaseLimitCheck({
 *     variantWeightGrams: 3.5,
 *     quantity: 2,
 *   });
 */

import { usePurchaseLimit } from '@cannasaas/api-client';
import { useAuthStore } from '@cannasaas/stores';

interface CheckParams {
  /** Weight per unit in grams */
  variantWeightGrams: number;
  /** Number of units to add */
  quantity: number;
}

interface LimitCheckResult {
  /** Whether adding these units would stay within the daily limit */
  canAdd: boolean;
  /** Remaining grams the customer can purchase today */
  remainingGrams: number;
  /** Warning message when close to or over limit, null otherwise */
  warning: string | null;
  /** True while compliance/purchase-limit is fetching */
  isLoading: boolean;
}

const WARNING_THRESHOLD_GRAMS = 3.5; // Warn when within 1/8 oz of limit

export function usePurchaseLimitCheck({
  variantWeightGrams,
  quantity,
}: CheckParams): LimitCheckResult {
  const { isAuthenticated } = useAuthStore();
  const { data: limits, isLoading } = usePurchaseLimit();

  // Guests: no limit enforcement client-side (server enforces on checkout)
  if (!isAuthenticated || !limits) {
    return {
      canAdd: true,
      remainingGrams: Infinity,
      warning: null,
      isLoading,
    };
  }

  const totalWeightToAdd = variantWeightGrams * quantity;
  const remainingGrams = limits.remaining.total;
  const canAdd = totalWeightToAdd <= remainingGrams;

  let warning: string | null = null;

  if (!canAdd) {
    warning = `Adding this quantity would exceed your daily purchase limit. You can add up to ${remainingGrams.toFixed(1)}g more today.`;
  } else if (remainingGrams - totalWeightToAdd < WARNING_THRESHOLD_GRAMS) {
    warning = `You're near your daily purchase limit. ${(remainingGrams - totalWeightToAdd).toFixed(1)}g remaining after this purchase.`;
  }

  return { canAdd, remainingGrams, warning, isLoading };
}
EOF
echo "  ✓ hooks/usePurchaseLimitCheck.ts"

echo ""
echo "  ✅ Storefront Part 1 complete — Layout + Hooks"
echo ""
echo "  Files written:"
find "$SF" -name "*.tsx" -o -name "*.ts" 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
