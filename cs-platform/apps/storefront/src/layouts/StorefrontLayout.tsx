/**
 * @file StorefrontLayout.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/StorefrontLayout.tsx
 *
 * Root layout component for the CannaSaas dispensary storefront.
 *
 * ─── ROLE IN REACT ROUTER v6 ───────────────────────────────────────────────
 * This component is used as the `element` prop on the parent <Route> in the
 * app's router config. Child routes render via the <Outlet /> component,
 * which is placed between the Header and Footer.
 *
 *   Example router config:
 *   ```tsx
 *   <Route element={<StorefrontLayout />}>
 *     <Route index element={<HomePage />} />
 *     <Route path="shop" element={<ShopPage />} />
 *     <Route path="products/:id" element={<ProductDetailPage />} />
 *   </Route>
 *   ```
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • <main id="main-content"> is the skip-link target from the Header.
 *   • aria-busy="true" on <main> while the org data is loading prevents
 *     screen readers from reading a partially-populated page.
 *   • Page title is set via a useEffect — each child route is responsible
 *     for updating document.title via its own <title> element or a hook,
 *     but the layout sets the base "{Org Name} — CannaSaas" title.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • CSS design tokens (custom properties) are injected dynamically from
 *     organizationStore brand colors, enabling true per-tenant theming
 *     without rebuilding the app.
 *   • Auth context is read here and passed to Header to avoid a separate
 *     global subscription in the Header sub-tree.
 *   • ErrorBoundary wraps the Outlet so page-level errors don't crash the
 *     entire layout (Header and Footer remain visible).
 */

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useOrganizationStore } from '../../stores/organizationStore';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import styles from './StorefrontLayout.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StorefrontLayoutProps {
  /**
   * Currently authenticated user.
   * In a real app this would come from an auth context (AuthContext, Clerk, etc.).
   * Prop-drilled here to keep the layout self-contained and testable.
   */
  user?: {
    displayName: string;
    email: string;
    avatarUrl?: string;
    loyaltyPoints?: number;
  } | null;

  /** Sign-out handler */
  onSignOut?: () => void;
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Lightweight class-based ErrorBoundary wrapping the <Outlet />.
 * Prevents a page-level JS error from crashing the Header and Footer.
 *
 * Note: React does not yet support function-based error boundaries.
 * Once the `use()` hook + Suspense ErrorBoundary lands in stable React,
 * migrate this to that pattern.
 */
class OutletErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this would send to Sentry / DataDog
    console.error('[OutletErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorFallback} role="alert">
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <p className={styles.errorMessage}>
            We hit an unexpected error loading this page. Please try refreshing.
          </p>
          <button
            type="button"
            className={styles.errorRetry}
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Brand Color Injection ────────────────────────────────────────────────────

/**
 * Injects the tenant's brand colors as CSS custom properties on <html>.
 * This enables true per-tenant theming without rebuilding or reloading CSS.
 *
 * @param brandColor - Hex color string (e.g., "#2D6A4F")
 * @param accentColor - Hex color string for accent
 */
function injectBrandColors(brandColor: string | null, accentColor: string | null) {
  const root = document.documentElement;

  if (brandColor) {
    root.style.setProperty('--cs-brand', brandColor);
    // Compute RGB values for rgba() usage in component CSS
    const [r, g, b] = hexToRgb(brandColor);
    root.style.setProperty('--cs-accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--cs-accent', brandColor);
  }

  if (accentColor) {
    root.style.setProperty('--cs-accent-hover', accentColor);
  }
}

/** Converts a hex color string to an [r, g, b] tuple */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StorefrontLayout
 *
 * The root layout shell for all storefront pages.
 * Renders the sticky Header, the page Outlet, and the Footer.
 *
 * @example
 * // In router config (router.tsx):
 * <Route element={<StorefrontLayout user={authUser} onSignOut={signOut} />}>
 *   <Route index element={<HomePage />} />
 * </Route>
 */
export function StorefrontLayout({ user = null, onSignOut }: StorefrontLayoutProps) {
  const organization = useOrganizationStore((s) => s.organization);
  const isLoading = useOrganizationStore((s) => s.isLoading);

  // ── Document Title ────────────────────────────────────────────────────
  useEffect(() => {
    if (organization?.name) {
      // Base title — child pages append their own: "Product Name | Store Name"
      document.title = organization.name;
    }
  }, [organization?.name]);

  // ── Brand Color Injection ─────────────────────────────────────────────
  useEffect(() => {
    if (organization) {
      injectBrandColors(organization.brandColor, organization.accentColor);
    }
  }, [organization?.brandColor, organization?.accentColor]);

  return (
    <div className={styles.layout}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Header
        mainContentId="main-content"
        user={user}
        onSignOut={onSignOut}
      />

      {/* ── Page Content ────────────────────────────────────────────── */}
      {/*
       * id="main-content" is the skip-link target — MUST match the
       * `mainContentId` prop passed to Header above.
       *
       * aria-busy while the org is loading prevents premature announcement
       * of partial content by screen readers.
       *
       * role="main" is implicit on <main>, but added for clarity and
       * compatibility with older assistive technologies.
       */}
      <main
        id="main-content"
        role="main"
        className={styles.main}
        aria-busy={isLoading}
        aria-label="Main content"
      >
        <OutletErrorBoundary>
          {/*
           * React Router v6 Outlet — renders the matched child route component.
           * All storefront pages (HomePage, ShopPage, ProductDetailPage, etc.)
           * render here, wrapped inside our persistent Header + Footer.
           */}
          <Outlet />
        </OutletErrorBoundary>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
