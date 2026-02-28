#!/usr/bin/env zsh
# =============================================================================
# CannaSaas — Part 7: Customer Storefront — Full Implementation
# Scaffold Script  |  Version 3.0  |  February 2026
# =============================================================================
#
# COVERS SECTION 7  (lines 2466-3875 of CannaSaas-PublicBeta-DeepDive.md)
#
# FILES EXPLICITLY DEFINED IN THE DOCUMENT
# -----------------------------------------
#   7.1  apps/storefront/src/main.tsx
#        apps/storefront/src/App.tsx
#   7.2  apps/storefront/src/components/AgeGate/AgeGate.tsx
#   7.3  apps/storefront/src/layouts/StorefrontLayout.tsx
#        apps/storefront/src/components/Navigation/StorefrontHeader.tsx
#   7.4  apps/storefront/src/pages/Home/HomePage.tsx
#   7.5  apps/storefront/src/pages/Products/ProductsPage.tsx
#   7.7  apps/storefront/src/pages/Checkout/CheckoutPage.tsx
#        apps/storefront/src/pages/Checkout/components/CheckoutProgress.tsx
#   7.9  apps/storefront/src/pages/Orders/OrderTrackingPage.tsx
#
# REQUIRED COMPANION FILES (referenced but not defined in doc)
# ------------------------------------------------------------
#   apps/storefront/src/providers/ThemeBootstrap.tsx  (glue: ThemeProvider + branding)
#   Navigation: MobileNav, StorefrontFooter, SearchModal
#   Cart: CartDrawer
#   Home sections: HeroSection, FeaturedProductsSection, CategoryCardsSection,
#                  SpecialsSection, DispensaryInfoSection
#   Products: ProductDetailPage (7.6 not in doc), FilterSidebar, FilterDrawer,
#             SortSelect, ActiveFilters
#   Cart page: CartPage (7.8 not in doc)
#   Checkout: ReviewStep, FulfillmentStep, PaymentStep, OrderSummary
#   Orders: OrderSuccessPage, StatusTimeline
#   Auth/Account: RegisterPage, AccountPage, NotFoundPage
#   packages/ui: PageLoader, Skeleton, Toaster  (imported by storefront)
#   packages/api-client: useOrders.ts  (useOrder + usePurchaseLimitCheck)
#
# USAGE
#   zsh scaffold-cannasaas-part7.zsh                   # uses ./cannasaas-platform
#   zsh scaffold-cannasaas-part7.zsh ~/projects        # uses ~/projects/cannasaas-platform
#   zsh scaffold-cannasaas-part7.zsh ~/projects --skip-existing
#
# =============================================================================

set -euo pipefail

autoload -U colors && colors
info()    { print -P "%F{cyan}  ▸%f  $*" }
ok()      { print -P "%F{green}  ✔%f  $*" }
skip()    { print -P "%F{yellow}  ↷%f  $* (skipped)" }
warn()    { print -P "%F{yellow}  ⚠%f  $*" }
section() { print -P "\n%F{magenta}%B── $* ──%b%f" }
err()     { print -P "%F{red}  ✘%f  $*" >&2; exit 1 }

SKIP_EXISTING=false
BASE=""
for arg in "$@"; do
  case "$arg" in
    --skip-existing) SKIP_EXISTING=true ;;
    *)               BASE="$arg" ;;
  esac
done

BASE="${BASE:-$(pwd)}"
ROOT="${BASE}/cannasaas-platform"

[[ -d "${ROOT}" ]] || err "cannasaas-platform/ not found at ${ROOT}\nRun Parts 3-6 scaffolds first."

print -P "\n%F{green}%B╔══════════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  CannaSaas · Part 7 — Customer Storefront        ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════════╝%b%f\n"
info "Target root: ${ROOT}"
[[ "${SKIP_EXISTING}" == "true" ]] && warn "Skip-existing mode ON"

write_file() {
  local target="$1"
  if [[ "${SKIP_EXISTING}" == "true" && -f "$target" ]]; then
    skip "$target"; cat > /dev/null; return 0
  fi
  mkdir -p "$(dirname "$target")"
  cat > "$target"
  ok "Wrote $target"
}

mkd() { [[ -d "$1" ]] || { mkdir -p "$1"; ok "(dir) $1"; } }

# =========================================================================
# 7.1 - main.tsx
# =========================================================================
section "7.1 · main.tsx"
mkd "${ROOT}/apps/storefront/src"

write_file "${ROOT}/apps/storefront/src/main.tsx" << 'EOF'
// apps/storefront/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import '@cannasaas/ui/styles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
EOF

# =========================================================================
# 7.1 - App.tsx
# =========================================================================
section "7.1 · App.tsx"

write_file "${ROOT}/apps/storefront/src/App.tsx" << 'EOF'
// apps/storefront/src/App.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TenantProvider } from './providers/TenantProvider';
import { ThemeBootstrap } from './providers/ThemeBootstrap';
import { AgeGate } from './components/AgeGate/AgeGate';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from '@cannasaas/ui';

const HomePage = lazy(() => import('./pages/Home/HomePage'));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/Products/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/Orders/OrderSuccessPage'));
const OrderTrackingPage = lazy(() => import('./pages/Orders/OrderTrackingPage'));
const AccountPage = lazy(() => import('./pages/Account/AccountPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <TenantProvider>
      <ThemeBootstrap>
        <AgeGate>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<StorefrontLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/orders/:id/success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                <Route path="/orders/:id/track" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AgeGate>
      </ThemeBootstrap>
    </TenantProvider>
  );
}
EOF

# =========================================================================
# ThemeBootstrap - glue provider (not in doc, required by App.tsx)
# =========================================================================
section "ThemeBootstrap · glue provider"
mkd "${ROOT}/apps/storefront/src/providers"

write_file "${ROOT}/apps/storefront/src/providers/ThemeBootstrap.tsx" << 'EOF'
// apps/storefront/src/providers/ThemeBootstrap.tsx
// Glue layer: connects organizationStore branding to ThemeProvider (packages/ui)
import React, { type ReactNode } from 'react';
import { ThemeProvider } from '@cannasaas/ui';
import { useTenantBranding } from '@cannasaas/stores';

interface ThemeBootstrapProps { children: ReactNode; }

export function ThemeBootstrap({ children }: ThemeBootstrapProps) {
  const branding = useTenantBranding();
  return (
    <ThemeProvider branding={branding ?? undefined} defaultColorScheme="system">
      {children}
    </ThemeProvider>
  );
}
EOF

# =========================================================================
# 7.2 - AgeGate
# =========================================================================
section "7.2 · AgeGate"
mkd "${ROOT}/apps/storefront/src/components/AgeGate"

write_file "${ROOT}/apps/storefront/src/components/AgeGate/AgeGate.tsx" << 'EOF'
// apps/storefront/src/components/AgeGate/AgeGate.tsx
import React, { useState, useEffect, type ReactNode } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useCurrentTenant } from '@cannasaas/stores';

interface AgeGateProps { children: ReactNode; }

const SESSION_KEY = 'cannasaas-age-verified';

/**
 * AgeGate - Full-page interstitial before any cannabis content.
 * WCAG: 1.3.1 dialog+aria-modal, 2.1.1 keyboard/Escape prevention, 2.4.3 autoFocus.
 * Compliance: sessionStorage only (re-verifies each browser session).
 */
export function AgeGate({ children }: AgeGateProps) {
  const tenant = useCurrentTenant();
  const [isVerified, setIsVerified] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsVerified(sessionStorage.getItem(SESSION_KEY) === 'true');
    setIsChecking(false);
  }, []);

  const handleConfirm = () => { sessionStorage.setItem(SESSION_KEY, 'true'); setIsVerified(true); };
  const handleDeny = () => { setIsDenied(true); window.location.href = 'https://www.google.com'; };

  if (isChecking) return null;
  if (isVerified) return <>{children}</>;

  if (isDenied) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center p-6" role="status" aria-live="polite">
        <p className="text-[var(--color-text-secondary)] text-center">
          We're sorry. You must be 21 or older to access this site.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-50" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-6 focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }}
      >
        <div className={[
          'w-full max-w-md text-center',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-lg)]',
          'p-8 md:p-10',
        ].join(' ')}>
          {tenant?.brandingConfig?.logoUrl ? (
            <img src={tenant.brandingConfig.logoUrl} alt={`${tenant.dispensaryName} logo`} className="mx-auto mb-6 h-14 object-contain" />
          ) : (
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center" aria-hidden="true">
              <Shield className="w-8 h-8 text-[var(--color-brand)]" aria-hidden="true" />
            </div>
          )}
          <h1 id="age-gate-title" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-3" tabIndex={-1}>
            Age Verification Required
          </h1>
          <p id="age-gate-desc" className="text-[var(--color-text-secondary)] text-[var(--p-text-base)] mb-2">
            {tenant?.dispensaryName ?? 'This website'} sells cannabis products.
            You must be <strong>21 years of age or older</strong> to enter.
          </p>
          <p className="text-[var(--color-text-secondary)] text-[var(--p-text-sm)] mb-8">
            By clicking "I am 21 or Older" you confirm you are of legal age to purchase cannabis in your
            jurisdiction and agree to our{' '}
            <a href="/terms" className="text-[var(--color-brand)] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[var(--color-brand)] hover:underline">Privacy Policy</a>.
          </p>
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[var(--p-radius-md)] p-3 mb-6 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[var(--p-text-xs)] text-amber-700 dark:text-amber-400">
              Cannabis products have intoxicating effects. Keep out of reach of children. For use by adults 21 and older only.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={handleConfirm} autoFocus>
              I am 21 or Older
            </Button>
            <Button variant="outline" size="lg" fullWidth onClick={handleDeny}>
              I am Under 21
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
EOF

# =========================================================================
# 7.3 - StorefrontLayout
# =========================================================================
section "7.3 · StorefrontLayout"
mkd "${ROOT}/apps/storefront/src/layouts"

write_file "${ROOT}/apps/storefront/src/layouts/StorefrontLayout.tsx" << 'EOF'
// apps/storefront/src/layouts/StorefrontLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from '../components/Navigation/StorefrontHeader';
import { StorefrontFooter } from '../components/Navigation/StorefrontFooter';
import { CartDrawer } from '../components/Cart/CartDrawer';
import { Toaster } from '@cannasaas/ui';

export function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <StorefrontHeader />
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        <Outlet />
      </main>
      <StorefrontFooter />
      <CartDrawer />
      <Toaster />
    </div>
  );
}
EOF

# =========================================================================
# 7.3 - StorefrontHeader
# =========================================================================
section "7.3 · StorefrontHeader"
mkd "${ROOT}/apps/storefront/src/components/Navigation"

write_file "${ROOT}/apps/storefront/src/components/Navigation/StorefrontHeader.tsx" << 'EOF'
// apps/storefront/src/components/Navigation/StorefrontHeader.tsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useCartStore, useAuthStore, useCurrentTenant } from '@cannasaas/stores';
import { useTheme, Button } from '@cannasaas/ui';
import { MobileNav } from './MobileNav';
import { SearchModal } from '../Search/SearchModal';

const NAV_LINKS = [
  { label: 'Flower',       href: '/products?category=flower'      },
  { label: 'Pre-rolls',    href: '/products?category=pre_roll'    },
  { label: 'Vapes',        href: '/products?category=vape'        },
  { label: 'Edibles',      href: '/products?category=edible'      },
  { label: 'Concentrates', href: '/products?category=concentrate' },
];

export function StorefrontHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const tenant = useCurrentTenant();
  const { colorScheme, setColorScheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <header className={[
        'sticky top-0 z-40 w-full',
        'bg-[var(--color-bg)]/95 backdrop-blur-md',
        'border-b border-[var(--color-border)]',
        'transition-shadow duration-[var(--p-dur-normal)]',
        scrolled ? 'shadow-[var(--p-shadow-md)]' : '',
      ].join(' ')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <Link to="/" aria-label={`${tenant?.dispensaryName ?? 'Home'} — Return to homepage`} className="flex-shrink-0 flex items-center">
              {tenant?.brandingConfig?.logoUrl ? (
                <img src={tenant.brandingConfig.logoUrl} alt={tenant.dispensaryName ?? 'Logo'} className="h-8 object-contain" />
              ) : (
                <span className="text-[var(--p-text-xl)] font-black text-[var(--color-brand)]">
                  {tenant?.dispensaryName ?? 'CannaSaas'}
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Product categories" className="hidden md:flex items-center gap-1 ml-6 flex-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} to={link.href}
                  className={({ isActive }) => [
                    'px-3 py-2 rounded-[var(--p-radius-md)] text-[var(--p-text-sm)] font-semibold',
                    'transition-colors duration-[var(--p-dur-fast)]',
                    isActive
                      ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]',
                  ].join(' ')}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1 ml-auto">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Open search"
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <Search size={20} aria-hidden="true" />
              </button>

              <button type="button"
                onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={colorScheme === 'dark'}
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                {colorScheme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <Link to="/account" aria-label={`My account — logged in as ${user?.firstName}`}
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                    <User size={20} aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={() => { clearAuth(); navigate('/'); }} aria-label="Sign out"
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex">
                    <LogOut size={20} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link to="/auth/login"
                  className="hidden sm:block text-[var(--p-text-sm)] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                  Sign in
                </Link>
              )}

              <Link to="/cart"
                aria-label={`Cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                className="relative p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <ShoppingCart size={20} aria-hidden="true" />
                {itemCount > 0 && (
                  <span aria-hidden="true" className={[
                    'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
                    'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
                    'text-[10px] font-bold rounded-full flex items-center justify-center',
                  ].join(' ')}>
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              <button type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]">
                {mobileNavOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav id="mobile-nav" isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} links={NAV_LINKS} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
EOF

# =========================================================================
# 7.4 - HomePage
# =========================================================================
section "7.4 · HomePage"
mkd "${ROOT}/apps/storefront/src/pages/Home/sections"

write_file "${ROOT}/apps/storefront/src/pages/Home/HomePage.tsx" << 'EOF'
// apps/storefront/src/pages/Home/HomePage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useCurrentTenant } from '@cannasaas/stores';
import { HeroSection } from './sections/HeroSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { CategoryCardsSection } from './sections/CategoryCardsSection';
import { SpecialsSection } from './sections/SpecialsSection';
import { DispensaryInfoSection } from './sections/DispensaryInfoSection';

export default function HomePage() {
  const tenant = useCurrentTenant();
  return (
    <>
      <Helmet>
        <title>{tenant?.dispensaryName ?? 'Shop'} | Cannabis Dispensary</title>
        <meta name="description"
          content={`Browse premium cannabis products at ${tenant?.dispensaryName ?? 'our dispensary'}. Order online for pickup or delivery.`} />
      </Helmet>

      <HeroSection />

      <section aria-labelledby="categories-heading" className="py-12 md:py-16 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="categories-heading" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-8">
            Shop by Category
          </h2>
          <CategoryCardsSection />
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-heading" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
              Featured Products
            </h2>
          </div>
          <FeaturedProductsSection />
        </div>
      </section>

      <SpecialsSection />
      <DispensaryInfoSection />
    </>
  );
}
EOF

# =========================================================================
# 7.5 - ProductsPage
# =========================================================================
section "7.5 · ProductsPage"
mkd "${ROOT}/apps/storefront/src/pages/Products/components"

write_file "${ROOT}/apps/storefront/src/pages/Products/ProductsPage.tsx" << 'EOF'
// apps/storefront/src/pages/Products/ProductsPage.tsx
import React, { useState, useCallback, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, Grid2X2, List } from 'lucide-react';
import { useInfiniteProducts } from '@cannasaas/api-client';
import { ProductCard, Button, Skeleton } from '@cannasaas/ui';
import { useCartStore } from '@cannasaas/stores';
import { FilterSidebar } from './components/FilterSidebar';
import { FilterDrawer } from './components/FilterDrawer';
import { SortSelect } from './components/SortSelect';
import { ActiveFilters } from './components/ActiveFilters';
import type { Product, ProductVariant } from '@cannasaas/types';
import type { ProductFilters } from '@cannasaas/api-client';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [, startTransition] = useTransition();
  const addItem = useCartStore((s) => s.addItem);

  const filters: ProductFilters = {
    category:   searchParams.get('category')   ?? undefined,
    strainType: searchParams.get('strainType') ?? undefined,
    minThc:     searchParams.get('minThc')     ? Number(searchParams.get('minThc'))   : undefined,
    maxPrice:   searchParams.get('maxPrice')   ? Number(searchParams.get('maxPrice')) : undefined,
    sort:       (searchParams.get('sort') as ProductFilters['sort']) ?? 'newest',
    search:     searchParams.get('q')          ?? undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteProducts(filters);

  const products = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    startTransition(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) { next.set(key, value); } else { next.delete(key); }
        next.delete('page');
        return next;
      });
    });
  }, [setSearchParams]);

  const handleAddToCart = useCallback((product: Product, variant: ProductVariant) => {
    addItem(product, variant, 1);
  }, [addItem]);

  return (
    <>
      <Helmet>
        <title>
          {filters.category
            ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Products`
            : 'All Products'} | Shop
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
              {filters.category
                ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
                : 'All Products'}
            </h1>
            {!isLoading && (
              <p className="text-[var(--color-text-secondary)] mt-1" aria-live="polite" aria-atomic="true">
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>
        </div>

        <ActiveFilters filters={filters} onRemove={handleFilterChange} className="mb-4" />

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0" aria-label="Product filters">
            <FilterSidebar currentFilters={filters} onFilterChange={handleFilterChange} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="md" leftIcon={<SlidersHorizontal size={16} aria-hidden="true" />}
                onClick={() => setFilterDrawerOpen(true)} className="lg:hidden"
                aria-haspopup="dialog" aria-expanded={filterDrawerOpen}>
                Filters
              </Button>
              <SortSelect value={filters.sort ?? 'newest'} onChange={(val) => handleFilterChange('sort', val)} className="ml-auto" />
              <div role="group" aria-label="View mode"
                className="hidden sm:flex border border-[var(--color-border)] rounded-[var(--p-radius-md)] overflow-hidden">
                {(['grid', 'list'] as const).map((mode) => (
                  <button key={mode} type="button"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view`}
                    className={['p-2 transition-colors',
                      viewMode === mode
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]',
                    ].join(' ')}>
                    {mode === 'grid' ? <Grid2X2 size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            {isError && (
              <div role="alert" className="py-12 text-center">
                <p className="text-[var(--color-error)]">Failed to load products. Please try again.</p>
                <Button variant="outline" size="md" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
              </div>
            )}

            {!isError && (
              <>
                <div
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
                    : 'flex flex-col gap-4'}
                  role="list" aria-label="Products" aria-busy={isLoading}>
                  {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-[var(--p-radius-lg)]" aria-hidden="true" />
                      ))
                    : products.map((product) => (
                        <div key={product.id} role="listitem">
                          <ProductCard product={product} onAddToCart={handleAddToCart} />
                        </div>
                      ))}
                </div>

                {hasNextPage && (
                  <div className="flex justify-center mt-10">
                    <Button variant="outline" size="lg" onClick={() => fetchNextPage()}
                      isLoading={isFetchingNextPage} loadingText="Loading more…" aria-label="Load more products">
                      Load More Products
                    </Button>
                  </div>
                )}

                {!isLoading && products.length === 0 && (
                  <div className="py-16 text-center" role="status">
                    <p className="text-[var(--color-text-secondary)] text-[var(--p-text-lg)] mb-4">
                      No products found for your filters.
                    </p>
                    <Button variant="outline" onClick={() => setSearchParams({})}>Clear all filters</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FilterDrawer isOpen={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}
        currentFilters={filters} onFilterChange={handleFilterChange} />
    </>
  );
}
EOF

# =========================================================================
# 7.7 - CheckoutPage
# =========================================================================
section "7.7 · CheckoutPage"
mkd "${ROOT}/apps/storefront/src/pages/Checkout/components"
mkd "${ROOT}/apps/storefront/src/pages/Checkout/steps"

write_file "${ROOT}/apps/storefront/src/pages/Checkout/CheckoutPage.tsx" << 'EOF'
// apps/storefront/src/pages/Checkout/CheckoutPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@cannasaas/stores';
import { CheckoutProgress } from './components/CheckoutProgress';
import { ReviewStep } from './steps/ReviewStep';
import { FulfillmentStep } from './steps/FulfillmentStep';
import { PaymentStep } from './steps/PaymentStep';
import { OrderSummary } from './components/OrderSummary';
import { usePurchaseLimitCheck } from '@cannasaas/api-client';

type CheckoutStep = 'review' | 'fulfillment' | 'payment';

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'review',      label: 'Review Cart'      },
  { id: 'fulfillment', label: 'Delivery / Pickup' },
  { id: 'payment',     label: 'Payment'           },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const { items, subtotal, promoDiscount } = useCartStore();
  const { data: limitCheck } = usePurchaseLimitCheck(items);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleStepComplete = (step: CheckoutStep) => {
    const next = STEPS[currentStepIndex + 1];
    if (next) { setCurrentStep(next.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <>
      <Helmet><title>Checkout | CannaSaas</title></Helmet>
      <div className="min-h-screen bg-[var(--color-bg-secondary)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-8">Checkout</h1>
          <CheckoutProgress steps={STEPS} currentStep={currentStep} className="mb-8" />

          {limitCheck && !limitCheck.allowed && (
            <div role="alert" className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-[var(--p-radius-md)]">
              <p className="font-semibold text-amber-800 mb-1">Purchase Limit Warning</p>
              <ul className="text-sm text-amber-700 list-disc list-inside">
                {limitCheck.violations.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0">
              {currentStep === 'review' && (
                <ReviewStep onComplete={() => handleStepComplete('review')} />
              )}
              {currentStep === 'fulfillment' && (
                <FulfillmentStep
                  fulfillmentType={fulfillmentType}
                  onFulfillmentChange={setFulfillmentType}
                  onAddressChange={setDeliveryAddress}
                  onComplete={() => handleStepComplete('fulfillment')} />
              )}
              {currentStep === 'payment' && (
                <PaymentStep
                  fulfillmentType={fulfillmentType}
                  deliveryAddress={deliveryAddress}
                  onSuccess={(orderId) => navigate(`/orders/${orderId}/success`)} />
              )}
            </div>
            <div className="w-full lg:w-80 lg:sticky lg:top-24">
              <OrderSummary items={items} subtotal={subtotal()} promoDiscount={promoDiscount} fulfillmentType={fulfillmentType} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
EOF

# =========================================================================
# 7.7 - CheckoutProgress
# =========================================================================
section "7.7 · CheckoutProgress"

write_file "${ROOT}/apps/storefront/src/pages/Checkout/components/CheckoutProgress.tsx" << 'EOF'
// apps/storefront/src/pages/Checkout/components/CheckoutProgress.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface Step { id: string; label: string; }
interface CheckoutProgressProps { steps: Step[]; currentStep: string; className?: string; }

/**
 * CheckoutProgress — WCAG: nav+ol (1.3.1), icon+text not color alone (1.4.1),
 * aria-current="step" (4.1.2).
 */
export function CheckoutProgress({ steps, currentStep, className }: CheckoutProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  return (
    <nav aria-label="Checkout steps" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent   = step.id === currentStep;
          return (
            <li key={step.id} className="flex items-center flex-1" aria-current={isCurrent ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-[var(--p-text-sm)] font-bold transition-all duration-[var(--p-dur-normal)]',
                    isCompleted
                      ? 'bg-[var(--color-success)] text-white'
                      : isCurrent
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border)]',
                  )}
                  aria-label={isCompleted ? `${step.label}: completed` : isCurrent ? `${step.label}: current step` : `${step.label}: upcoming`}>
                  {isCompleted ? <Check size={14} aria-hidden="true" /> : <span aria-hidden="true">{index + 1}</span>}
                </div>
                <span className={cn(
                  'text-[var(--p-text-xs)] mt-1.5 font-semibold whitespace-nowrap',
                  isCurrent ? 'text-[var(--color-brand)]' : isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]',
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-[var(--p-dur-slow)]',
                  isCompleted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                )} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
EOF

# =========================================================================
# 7.9 - OrderTrackingPage
# =========================================================================
section "7.9 · OrderTrackingPage"
mkd "${ROOT}/apps/storefront/src/pages/Orders/components"

write_file "${ROOT}/apps/storefront/src/pages/Orders/OrderTrackingPage.tsx" << 'EOF'
// apps/storefront/src/pages/Orders/OrderTrackingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useOrder } from '@cannasaas/api-client';
import { useAccessToken } from '@cannasaas/stores';
import type { OrderStatus } from '@cannasaas/types';
import { formatCurrency } from '@cannasaas/utils';
import { StatusTimeline } from './components/StatusTimeline';

interface TrackingEvent {
  type: 'status_update' | 'driver_location' | 'eta_update';
  orderId: string;
  status?: OrderStatus;
  driverLat?: number;
  driverLng?: number;
  etaMinutes?: number;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAccessToken();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { data: order, isLoading } = useOrder(id!);

  useEffect(() => {
    if (!id || !accessToken) return;
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/delivery/tracking?orderId=${id}&token=${accessToken}`);
    wsRef.current = ws;
    ws.onopen  = () => console.info('[Tracking] WS connected for order', id);
    ws.onclose = () => console.info('[Tracking] WS disconnected');
    ws.onmessage = (event: MessageEvent) => {
      try {
        const p: TrackingEvent = JSON.parse(event.data as string);
        if (p.type === 'status_update'  && p.status)                                      setLiveStatus(p.status);
        if (p.type === 'driver_location' && p.driverLat !== undefined && p.driverLng !== undefined)
          setDriverLocation({ lat: p.driverLat, lng: p.driverLng });
        if (p.type === 'eta_update'     && p.etaMinutes !== undefined)                    setEtaMinutes(p.etaMinutes);
      } catch { console.error('[Tracking] Failed to parse WS message'); }
    };
    return () => ws.close();
  }, [id, accessToken]);

  const effectiveStatus = liveStatus ?? order?.status;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true">
      <p className="text-[var(--color-text-secondary)]">Loading order details…</p>
    </div>
  );

  if (!order) return (
    <div role="alert" className="flex items-center justify-center min-h-[60vh]">
      <p className="text-[var(--color-error)]">Order not found.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-2">Track Your Order</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Order #{order.orderNumber}</p>

      {etaMinutes !== null && (
        <div className={[
          'flex items-center gap-3 p-4 mb-6 rounded-[var(--p-radius-lg)]',
          'bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]',
        ].join(' ')} aria-live="polite" aria-atomic="true">
          <Clock className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />
          <p className="font-semibold text-[var(--color-brand-text)]">
            Estimated arrival in <strong>{etaMinutes} {etaMinutes === 1 ? 'minute' : 'minutes'}</strong>
          </p>
        </div>
      )}

      <StatusTimeline currentStatus={effectiveStatus ?? 'pending'} fulfillmentType={order.fulfillmentType} className="mb-8" />

      <section aria-labelledby="items-heading"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6">
        <h2 id="items-heading" className="font-bold text-[var(--color-text)] mb-4">Order Summary</h2>
        <ul className="divide-y divide-[var(--color-border)]">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-[var(--color-text)]">{item.productName}</p>
                <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">{item.variantName} × {item.quantity}</p>
              </div>
              <span className="font-bold text-[var(--color-text)]">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex justify-between">
          <span className="font-bold text-[var(--color-text)]">Total</span>
          <span className="font-bold text-[var(--p-text-lg)] text-[var(--color-text)]">{formatCurrency(order.total)}</span>
        </div>
      </section>
    </div>
  );
}
EOF

# =========================================================================
# COMPANION STUBS - Navigation sub-components
# =========================================================================
section "Stubs · Navigation (MobileNav, Footer, SearchModal)"
mkd "${ROOT}/apps/storefront/src/components/Search"

write_file "${ROOT}/apps/storefront/src/components/Navigation/MobileNav.tsx" << 'EOF'
// apps/storefront/src/components/Navigation/MobileNav.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

interface NavLinkItem { label: string; href: string; }
interface MobileNavProps { id: string; isOpen: boolean; onClose: () => void; links: NavLinkItem[]; }

export function MobileNav({ id, isOpen, onClose, links }: MobileNavProps) {
  if (!isOpen) return null;
  return (
    <div id={id} role="dialog" aria-label="Mobile navigation" aria-modal="true" className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <nav className="absolute top-0 right-0 h-full w-72 bg-[var(--color-surface)] shadow-xl flex flex-col p-6">
        <button type="button" onClick={onClose} aria-label="Close menu"
          className="self-end mb-6 p-2 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
          <X size={20} aria-hidden="true" />
        </button>
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <NavLink to={link.href} onClick={onClose}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-[var(--p-radius-md)] text-[var(--p-text-base)] font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]'
                  }`
                }>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
EOF

write_file "${ROOT}/apps/storefront/src/components/Navigation/StorefrontFooter.tsx" << 'EOF'
// apps/storefront/src/components/Navigation/StorefrontFooter.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { useCurrentTenant } from '@cannasaas/stores';

export function StorefrontFooter() {
  const tenant = useCurrentTenant();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} {tenant?.dispensaryName ?? 'CannaSaas'}. For adults 21+ only.
        </p>
      </div>
    </footer>
  );
}
EOF

write_file "${ROOT}/apps/storefront/src/components/Search/SearchModal.tsx" << 'EOF'
// apps/storefront/src/components/Search/SearchModal.tsx
// STUB — implement in Part 7 follow-up
import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps { isOpen: boolean; onClose: () => void; }

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [isOpen]);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value;
    if (q.trim()) { navigate(`/products?q=${encodeURIComponent(q.trim())}`); onClose(); }
  };
  return (
    <div role="dialog" aria-label="Search products" aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--color-surface)] rounded-[var(--p-radius-lg)] shadow-[var(--p-shadow-lg)] p-4">
        <form onSubmit={handleSubmit} role="search">
          <label htmlFor="search-input" className="sr-only">Search products</label>
          <div className="flex items-center gap-3">
            <Search size={20} className="text-[var(--color-text-secondary)] flex-shrink-0" aria-hidden="true" />
            <input ref={inputRef} id="search-input" name="q" type="search" placeholder="Search products…"
              className="flex-1 bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-disabled)] outline-none text-[var(--p-text-lg)]" />
            <button type="button" onClick={onClose} aria-label="Close search"
              className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
EOF

# =========================================================================
# COMPANION STUBS - CartDrawer
# =========================================================================
section "Stubs · CartDrawer"
mkd "${ROOT}/apps/storefront/src/components/Cart"

write_file "${ROOT}/apps/storefront/src/components/Cart/CartDrawer.tsx" << 'EOF'
// apps/storefront/src/components/Cart/CartDrawer.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
export function CartDrawer() { return null; }
EOF

# =========================================================================
# COMPANION STUBS - Home page sections
# =========================================================================
section "Stubs · Home sections (×5)"

for sname in HeroSection FeaturedProductsSection CategoryCardsSection SpecialsSection DispensaryInfoSection; do
  write_file "${ROOT}/apps/storefront/src/pages/Home/sections/${sname}.tsx" << STUBEOF
// apps/storefront/src/pages/Home/sections/${sname}.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
export function ${sname}() {
  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <div className="h-32 rounded-[var(--p-radius-lg)] bg-[var(--color-bg-tertiary)] animate-pulse" aria-hidden="true" />
    </section>
  );
}
STUBEOF
done

# =========================================================================
# COMPANION STUBS - Products sub-components + ProductDetailPage
# =========================================================================
section "Stubs · Products (detail + 4 sub-components)"

write_file "${ROOT}/apps/storefront/src/pages/Products/ProductDetailPage.tsx" << 'EOF'
// apps/storefront/src/pages/Products/ProductDetailPage.tsx
// STUB — Section 7.6 not defined in doc
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '@cannasaas/api-client';
import { FullPageLoader } from '@cannasaas/ui';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug ?? '');
  if (isLoading) return <FullPageLoader message="Loading product…" />;
  if (!product) return (
    <div role="alert" className="p-8 text-center text-[var(--color-error)]">Product not found.</div>
  );
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-4">{product.name}</h1>
      <p className="text-[var(--color-text-secondary)]">{product.description}</p>
    </div>
  );
}
EOF

for comp in FilterSidebar FilterDrawer SortSelect ActiveFilters; do
  write_file "${ROOT}/apps/storefront/src/pages/Products/components/${comp}.tsx" << STUBEOF
// apps/storefront/src/pages/Products/components/${comp}.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
export function ${comp}(_props: Record<string, unknown>) { return null; }
STUBEOF
done

# =========================================================================
# COMPANION STUBS - CartPage (7.8 not in doc)
# =========================================================================
section "Stubs · CartPage"
mkd "${ROOT}/apps/storefront/src/pages/Cart"

write_file "${ROOT}/apps/storefront/src/pages/Cart/CartPage.tsx" << 'EOF'
// apps/storefront/src/pages/Cart/CartPage.tsx
// STUB — Section 7.8 not defined in doc
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@cannasaas/stores';
import { Button } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';

export default function CartPage() {
  const { items, subtotal, clearCart } = useCartStore();
  return (
    <>
      <Helmet><title>Your Cart | CannaSaas</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-8 flex items-center gap-3">
          <ShoppingCart aria-hidden="true" /> Your Cart
        </h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-secondary)] mb-6">Your cart is empty.</p>
            <Button variant="primary" size="lg" as={Link} to="/products">Browse Products</Button>
          </div>
        ) : (
          <>
            <ul className="space-y-4 mb-8">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{item.productName}</p>
                    <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">{item.variantName} × {item.quantity}</p>
                  </div>
                  <span className="font-bold text-[var(--color-text)]">{formatCurrency(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[var(--color-text)]">Subtotal</span>
              <span className="font-bold text-[var(--p-text-xl)] text-[var(--color-text)]">{formatCurrency(subtotal())}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
              <Button variant="primary" size="lg" as={Link} to="/checkout" fullWidth>Proceed to Checkout</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
EOF

# =========================================================================
# COMPANION STUBS - Checkout steps + OrderSummary
# =========================================================================
section "Stubs · Checkout steps + OrderSummary"

write_file "${ROOT}/apps/storefront/src/pages/Checkout/components/OrderSummary.tsx" << 'EOF'
// apps/storefront/src/pages/Checkout/components/OrderSummary.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { formatCurrency } from '@cannasaas/utils';

interface OrderSummaryProps {
  items: Array<{ id: string; productName: string; variantName: string; quantity: number; totalPrice: number }>;
  subtotal: number;
  promoDiscount: number;
  fulfillmentType: 'pickup' | 'delivery';
}

export function OrderSummary({ items, subtotal, promoDiscount, fulfillmentType }: OrderSummaryProps) {
  const deliveryFee = fulfillmentType === 'delivery' ? 5 : 0;
  const total = subtotal - promoDiscount + deliveryFee;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6">
      <h2 className="font-bold text-[var(--color-text)] mb-4">Order Summary</h2>
      <ul className="space-y-2 mb-4">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between text-[var(--p-text-sm)]">
            <span className="text-[var(--color-text-secondary)]">{item.productName} × {item.quantity}</span>
            <span>{formatCurrency(item.totalPrice)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
        <div className="flex justify-between text-[var(--p-text-sm)]">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-success)]">
            <span>Discount</span><span>−{formatCurrency(promoDiscount)}</span>
          </div>
        )}
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between text-[var(--p-text-sm)]">
            <span className="text-[var(--color-text-secondary)]">Delivery fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[var(--color-text)] pt-2 border-t border-[var(--color-border)]">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
EOF

for step in ReviewStep FulfillmentStep PaymentStep; do
  write_file "${ROOT}/apps/storefront/src/pages/Checkout/steps/${step}.tsx" << STUBEOF
// apps/storefront/src/pages/Checkout/steps/${step}.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { Button } from '@cannasaas/ui';
export function ${step}(props: Record<string, unknown>) {
  const onComplete = props.onComplete as (() => void) | undefined;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-8">
      <p className="text-[var(--color-text-secondary)] mb-6">${step} — stub</p>
      {onComplete && <Button variant="primary" size="lg" onClick={onComplete}>Continue</Button>}
    </div>
  );
}
STUBEOF
done

# =========================================================================
# COMPANION STUBS - Orders sub-components + OrderSuccessPage
# =========================================================================
section "Stubs · Orders (StatusTimeline + OrderSuccessPage)"

write_file "${ROOT}/apps/storefront/src/pages/Orders/OrderSuccessPage.tsx" << 'EOF'
// apps/storefront/src/pages/Orders/OrderSuccessPage.tsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@cannasaas/ui';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-[var(--color-success)] mx-auto mb-6" aria-hidden="true" />
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-3">Order Confirmed!</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Your order has been placed successfully.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary" as={Link} to={`/orders/${id}/track`}>Track Order</Button>
        <Button variant="outline" as={Link} to="/">Continue Shopping</Button>
      </div>
    </div>
  );
}
EOF

write_file "${ROOT}/apps/storefront/src/pages/Orders/components/StatusTimeline.tsx" << 'EOF'
// apps/storefront/src/pages/Orders/components/StatusTimeline.tsx
import React from 'react';
import type { OrderStatus, FulfillmentType } from '@cannasaas/types';
import { cn } from '@cannasaas/utils';

interface StatusTimelineProps { currentStatus: OrderStatus; fulfillmentType: FulfillmentType; className?: string; }

const PICKUP_STEPS:   { status: OrderStatus; label: string }[] = [
  { status: 'pending',          label: 'Order Placed'    },
  { status: 'confirmed',        label: 'Confirmed'       },
  { status: 'preparing',        label: 'Preparing'       },
  { status: 'ready_for_pickup', label: 'Ready'           },
  { status: 'completed',        label: 'Picked Up'       },
];
const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending',          label: 'Order Placed'    },
  { status: 'confirmed',        label: 'Confirmed'       },
  { status: 'preparing',        label: 'Preparing'       },
  { status: 'out_for_delivery', label: 'On the Way'      },
  { status: 'delivered',        label: 'Delivered'       },
];

export function StatusTimeline({ currentStatus, fulfillmentType, className }: StatusTimelineProps) {
  const steps = fulfillmentType === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIndex = steps.findIndex((s) => s.status === currentStatus);
  return (
    <ol className={cn('flex items-start', className)} aria-label="Order status">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent   = index === currentIndex;
        return (
          <li key={step.status} className="flex items-center flex-1" aria-current={isCurrent ? 'step' : undefined}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('w-4 h-4 rounded-full border-2',
                isCompleted ? 'bg-[var(--color-success)] border-[var(--color-success)]'
                : isCurrent ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
                : 'bg-transparent border-[var(--color-border)]'
              )} aria-label={`${step.label}: ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}`} />
              <span className={cn('text-[10px] mt-1 font-semibold text-center leading-tight max-w-[60px]',
                isCurrent ? 'text-[var(--color-brand)]'
                : isCompleted ? 'text-[var(--color-success)]'
                : 'text-[var(--color-text-disabled)]'
              )}>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-1 -mt-4',
                isCompleted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
              )} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
EOF

# =========================================================================
# COMPANION STUBS - Auth/Account/Error pages
# =========================================================================
section "Stubs · RegisterPage, AccountPage, NotFoundPage"
mkd "${ROOT}/apps/storefront/src/pages/Auth"
mkd "${ROOT}/apps/storefront/src/pages/Account"

write_file "${ROOT}/apps/storefront/src/pages/Auth/RegisterPage.tsx" << 'EOF'
// apps/storefront/src/pages/Auth/RegisterPage.tsx
// STUB — implement using useRegister hook
import React from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg-secondary)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--p-radius-lg)] border border-[var(--color-border)] shadow-[var(--p-shadow-lg)] p-8">
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-6">Create Account</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">Registration form stub — full implementation pending.</p>
        <p className="text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-[var(--color-brand)] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
EOF

write_file "${ROOT}/apps/storefront/src/pages/Account/AccountPage.tsx" << 'EOF'
// apps/storefront/src/pages/Account/AccountPage.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { useAuthStore } from '@cannasaas/stores';

export default function AccountPage() {
  const { user } = useAuthStore();
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-4">My Account</h1>
      {user && <p className="text-[var(--color-text-secondary)]">Welcome, {user.firstName} {user.lastName}</p>}
    </div>
  );
}
EOF

write_file "${ROOT}/apps/storefront/src/pages/NotFoundPage.tsx" << 'EOF'
// apps/storefront/src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@cannasaas/ui';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-[120px] font-black leading-none text-[var(--color-brand)] opacity-20 select-none" aria-hidden="true">404</p>
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-3 -mt-8">Page Not Found</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Button variant="primary" size="lg" as={Link} to="/">Return Home</Button>
      </div>
    </main>
  );
}
EOF

# =========================================================================
# packages/ui - PageLoader, Skeleton, Toaster
# =========================================================================
section "packages/ui · PageLoader, Skeleton, Toaster"
mkd "${ROOT}/packages/ui/src/components/PageLoader"
mkd "${ROOT}/packages/ui/src/components/Skeleton"
mkd "${ROOT}/packages/ui/src/components/Toaster"

write_file "${ROOT}/packages/ui/src/components/PageLoader/PageLoader.tsx" << 'EOF'
// packages/ui/src/components/PageLoader/PageLoader.tsx
// Suspense fallback alias for FullPageLoader
import React from 'react';
import { FullPageLoader } from '../FullPageLoader/FullPageLoader';
interface PageLoaderProps { message?: string; }
export function PageLoader({ message = 'Loading…' }: PageLoaderProps) {
  return <FullPageLoader message={message} />;
}
EOF

write_file "${ROOT}/packages/ui/src/components/Skeleton/Skeleton.tsx" << 'EOF'
// packages/ui/src/components/Skeleton/Skeleton.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
interface SkeletonProps { className?: string; 'aria-hidden'?: boolean | 'true' | 'false'; }
/** Animated loading placeholder. WCAG: aria-hidden="true" by default. */
export function Skeleton({ className, 'aria-hidden': ariaHidden = true }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-[var(--color-bg-tertiary)] rounded-[var(--p-radius-md)]', className)}
      aria-hidden={ariaHidden}
    />
  );
}
EOF

write_file "${ROOT}/packages/ui/src/components/Toaster/Toaster.tsx" << 'EOF'
// packages/ui/src/components/Toaster/Toaster.tsx
// STUB — implement in Part 8
import React from 'react';
/** Global aria-live toast notification region. WCAG 4.1.3. */
export function Toaster() {
  return (
    <div role="status" aria-live="polite" aria-atomic="false"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications">
      {/* Toast items rendered here */}
    </div>
  );
}
EOF

UI_INDEX="${ROOT}/packages/ui/src/index.ts"
if [[ -f "${UI_INDEX}" ]]; then
  for export_line in \
    "export { PageLoader } from './components/PageLoader/PageLoader';" \
    "export { Skeleton }   from './components/Skeleton/Skeleton';" \
    "export { Toaster }    from './components/Toaster/Toaster';"; do
    fragment=$(echo "$export_line" | grep -oP '(?<=\{ )[\w]+(?= [\}])|(?<=\{ )[\w]+(?=,)')
    if ! grep -q "$fragment" "${UI_INDEX}" 2>/dev/null; then
      echo "$export_line" >> "${UI_INDEX}"
      ok "  Appended ${fragment} to packages/ui/src/index.ts"
    else
      ok "  ${fragment} already exported"
    fi
  done
else
  warn "packages/ui/src/index.ts not found — skipping export activation"
fi

# =========================================================================
# packages/api-client - useOrders hook
# =========================================================================
section "packages/api-client · useOrders.ts"
mkd "${ROOT}/packages/api-client/src/hooks"

write_file "${ROOT}/packages/api-client/src/hooks/useOrders.ts" << 'EOF'
// packages/api-client/src/hooks/useOrders.ts
// Required by OrderTrackingPage (useOrder) and CheckoutPage (usePurchaseLimitCheck)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Order, OrderStatus, PurchaseLimitResult } from '@cannasaas/types';

export const orderKeys = {
  all:    ()         => ['orders']               as const,
  lists:  ()         => ['orders', 'list']       as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  limit:  (items: Array<{ variantId: string; quantity: number }>) =>
    ['orders', 'limit', items.map((i) => `${i.variantId}:${i.quantity}`).join(',')],
};

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Order }>(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function usePurchaseLimitCheck(items: Array<{ variantId: string; quantity: number }>) {
  return useQuery({
    queryKey: orderKeys.limit(items),
    queryFn: async () => {
      const { data } = await apiClient.post<{ data: PurchaseLimitResult }>('/compliance/purchase-limit/check', { items });
      return data.data;
    },
    enabled: items.length > 0,
    staleTime: 1000 * 60,
  });
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: [...orderKeys.lists(), { page }],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Order[]; meta: { total: number } }>('/orders', { params: { page, limit: 20 } });
      return data;
    },
    staleTime: 1000 * 60,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await apiClient.patch<{ data: Order }>(`/orders/${id}/status`, { status });
      return data.data;
    },
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(order.id), order);
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
EOF

AC_INDEX="${ROOT}/packages/api-client/src/index.ts"
if [[ -f "${AC_INDEX}" ]]; then
  if ! grep -q "useOrder" "${AC_INDEX}" 2>/dev/null; then
    echo "" >> "${AC_INDEX}"
    echo "// Part 7" >> "${AC_INDEX}"
    echo "export { orderKeys, useOrder, useOrders, useUpdateOrderStatus, usePurchaseLimitCheck } from './hooks/useOrders';" >> "${AC_INDEX}"
    ok "  Appended useOrders exports to packages/api-client/src/index.ts"
  else
    ok "  useOrder already exported in packages/api-client/src/index.ts"
  fi
else
  warn "packages/api-client/src/index.ts not found — skipping export activation"
fi

# =========================================================================
# SUMMARY
# =========================================================================
print -P "\n%F{green}%B╔══════════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  Part 7 complete!                                ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════════╝%b%f"
print ""
print -P "  %F{cyan}From the document:%f"
print -P "    main.tsx, App.tsx, AgeGate, StorefrontLayout,"
print -P "    StorefrontHeader, HomePage, ProductsPage,"
print -P "    CheckoutPage, CheckoutProgress, OrderTrackingPage"
print ""
print -P "  %F{cyan}Glue (not in doc, required by App.tsx):%f"
print -P "    ThemeBootstrap — connects ThemeProvider to organizationStore"
print ""
print -P "  %F{blue}Companion stubs (app compiles):%f"
print -P "    Navigation: MobileNav, StorefrontFooter, SearchModal"
print -P "    Cart: CartDrawer"
print -P "    Home sections ×5, Products sub-components ×4,"
print -P "    ProductDetailPage, CartPage, Checkout steps ×3,"
print -P "    OrderSummary, StatusTimeline, OrderSuccessPage,"
print -P "    RegisterPage, AccountPage, NotFoundPage"
print ""
print -P "  %F{cyan}packages/ui additions:%f"
print -P "    PageLoader (Suspense alias), Skeleton, Toaster"
print ""
print -P "  %F{cyan}packages/api-client additions:%f"
print -P "    useOrders.ts — useOrder, usePurchaseLimitCheck, useOrders, useUpdateOrderStatus"
print ""
print -P "  %F{yellow}Doc gaps covered by stubs:%f"
print -P "    7.6 ProductDetailPage · 7.8 CartPage"
print ""
print -P "  %F{yellow}Next step:%f  run Part 8 scaffold → Admin Portal"
print ""
