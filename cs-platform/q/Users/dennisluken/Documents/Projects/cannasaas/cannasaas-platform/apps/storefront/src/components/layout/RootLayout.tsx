/**
 * @file RootLayout.tsx
 * @app Storefront
 *
 * Root layout component — the outermost wrapper rendered before any page.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *
 * 1. TENANT RESOLUTION
 *    Reads the tenant slug from the hostname via `extractTenantSlug()`
 *    and calls GET /organizations/by-slug/:slug to populate organizationStore.
 *    All child routes are blocked from rendering until this resolves.
 *
 * 2. THEME INJECTION
 *    Once the organisation resolves, `injectTenantTheme()` writes CSS custom
 *    properties (`--primary`, `--secondary`, etc.) to `:root` so the entire
 *    app reflects the tenant's brand without a re-render cascade.
 *
 * 3. FONT LOADING
 *    If the organisation uses a Google Font, a `<link>` element is appended
 *    to `<head>` to load it. The font is applied via the `--font-body` CSS var.
 *
 * 4. ERROR HANDLING
 *    If the slug cannot be resolved (404 from the API), shows a branded
 *    "Dispensary not found" error page rather than a blank screen.
 *
 * ── Tenant resolution flow ───────────────────────────────────────────────────
 *
 *   RootLayout mounts
 *   → extractTenantSlug()    reads hostname / env / query param
 *   → GET /organizations/by-slug/:slug
 *   → setOrganization(org)   populates organizationStore
 *   → injectTenantTheme()    writes CSS vars to :root
 *   → <Outlet />             child routes render
 *
 * ── Header injection ─────────────────────────────────────────────────────────
 *
 * The Axios client (axiosClient.ts) reads organizationStore at request time
 * and injects X-Organization-Id + X-Dispensary-Id headers. RootLayout does
 * NOT need to wire these manually — the store is the single source of truth.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Loading: role="status" aria-live="polite" (4.1.3)
 *   - Error: role="alert" (4.1.3)
 *   - document.title updated with org name (2.4.2)
 */

import { useEffect, useId } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useOrganizationStore } from '@cannasaas/stores';
import { extractTenantSlug, injectTenantTheme } from '@cannasaas/utils';
import { apiClient } from '@cannasaas/api-client';

// ── Google Fonts loader ──────────────────────────────────────────────────────

const GOOGLE_FONTS = new Set([
  'Inter', 'DM Sans', 'Plus Jakarta Sans',
  'Nunito', 'Poppins', 'Merriweather',
]);

function loadGoogleFont(family: string): void {
  if (!GOOGLE_FONTS.has(family)) return;
  const id = `gf-${family.replace(/\s/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return; // Already loaded
  const link = document.createElement('link');
  link.id    = id;
  link.rel   = 'stylesheet';
  link.href  = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

// ── Loading screen ────────────────────────────────────────────────────────────

function TenantLoadingScreen({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-label={message}
      aria-live="polite"
      className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 gap-4"
    >
      <div
        aria-hidden="true"
        className="w-12 h-12 border-4 border-[hsl(var(--primary,154_40%_30%))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
      />
      <p className="text-sm text-stone-400">{message}</p>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────

function TenantNotFound({ slug }: { slug: string }) {
  useEffect(() => { document.title = 'Dispensary Not Found | CannaSaas'; }, []);
  return (
    <div
      role="alert"
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-stone-50"
    >
      <span aria-hidden="true" className="text-6xl mb-4">🌿</span>
      <h1 className="text-2xl font-extrabold text-stone-900 mb-2">Dispensary Not Found</h1>
      <p className="text-stone-500 max-w-sm mb-1">
        We couldn't find a dispensary at this address.
      </p>
      <p className="text-xs text-stone-400 font-mono mt-1">slug: {slug}</p>
      <a
        href="https://cannasaas.com"
        className="mt-6 text-sm font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded"
      >
        Visit CannaSaas.com →
      </a>
    </div>
  );
}

// ── RootLayout ────────────────────────────────────────────────────────────────

export function RootLayout() {
  const { slug, source } = extractTenantSlug();
  const { setOrganization, organization } = useOrganizationStore();

  /**
   * Fetch organization by slug — this is the single call that bootstraps
   * the entire tenant context. Every subsequent API call inherits the
   * organizationId from the store via the Axios interceptor.
   *
   * queryKey includes slug so switching orgs (admin super view) re-fetches.
   * staleTime: Infinity — org data never goes stale in a session; the user
   * must refresh the page to pick up org config changes.
   */
  const {
    data:    org,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organization', 'by-slug', slug],
    queryFn:  async () => {
      const { data } = await apiClient.get(`/organizations/by-slug/${slug}`);
      return data.data ?? data;
    },
    staleTime: Infinity,
    retry: 1,
  });

  // Populate the store and inject CSS vars when org resolves
  useEffect(() => {
    if (!org) return;
    setOrganization(org);

    const branding = org.resolvedBranding ?? org.branding;
    if (branding) {
      injectTenantTheme(branding);
      if (branding.fontFamily) loadGoogleFont(branding.fontFamily);
    }

    document.title = `${org.name} | Storefront`;
  }, [org, setOrganization]);

  if (isLoading) {
    return <TenantLoadingScreen message="Loading your dispensary…" />;
  }

  if (isError || !org) {
    return <TenantNotFound slug={slug} />;
  }

  // Child routes (pages + their own layouts) render here
  return <Outlet />;
}
