/**
 * @file tenant.ts
 * @package @cannasaas/utils
 *
 * Tenant resolution utilities — used by RootLayout in all three apps to
 * derive the organisation slug from the current hostname.
 *
 * ── Hostname strategy ────────────────────────────────────────────────────────
 *
 * CannaSaas uses subdomain-based multi-tenancy:
 *
 *   green-leaf.cannasaas.com    → slug "green-leaf"    (production)
 *   nyc-green.cannasaas.com     → slug "nyc-green"
 *   localhost:5173              → slug from VITE_DEV_SLUG env var (dev)
 *   green-leaf.localhost        → slug "green-leaf"    (local dev alternative)
 *
 * The extracted slug is used to call:
 *   GET /organizations/by-slug/:slug
 * which returns the full Organization with company and dispensary tree.
 *
 * ── Admin + Staff portals ────────────────────────────────────────────────────
 *
 * The admin portal lives at:
 *   admin.green-leaf.cannasaas.com  OR  admin.cannasaas.com?org=green-leaf
 *
 * For simplicity, all three apps use the same slug extraction logic and
 * the backend resolves the full org from the slug regardless of subdomain
 * depth. The `extractTenantSlug` function handles 1-2 subdomain levels.
 *
 * ── Local development ────────────────────────────────────────────────────────
 *
 * In local dev (hostname === 'localhost'), the slug falls back to:
 *   1. `VITE_DEV_SLUG` env variable if set
 *   2. The `?org=` query param (useful for testing multiple tenants locally)
 *   3. Hardcoded fallback 'demo' for zero-config startup
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface TenantSlugResult {
  slug:   string;
  source: 'subdomain' | 'env' | 'query' | 'fallback';
}

// ── Constants ────────────────────────────────────────────────────────────────

/** The apex domain — subdomains to the left of this are tenant slugs */
const APEX_DOMAIN = 'cannasaas.com';

/** Reserved subdomains that are NOT tenant slugs */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'cdn', 'admin', 'staff', 'app', 'dashboard',
]);

// ── Core extraction function ─────────────────────────────────────────────────

/**
 * Extracts the tenant slug from the current browser hostname.
 *
 * Priority order:
 *   1. Subdomain of cannasaas.com (production + staging)
 *   2. Subdomain of localhost (local dev: green-leaf.localhost)
 *   3. VITE_DEV_SLUG env variable
 *   4. `?org=` query parameter
 *   5. Hardcoded 'demo' fallback
 *
 * @example
 *   // On https://green-leaf.cannasaas.com
 *   extractTenantSlug() // → { slug: 'green-leaf', source: 'subdomain' }
 *
 *   // On localhost with VITE_DEV_SLUG=nyc-green
 *   extractTenantSlug() // → { slug: 'nyc-green', source: 'env' }
 *
 *   // On localhost:5173?org=brooklyn-buds
 *   extractTenantSlug() // → { slug: 'brooklyn-buds', source: 'query' }
 */
export function extractTenantSlug(
  hostname = window.location.hostname,
  search   = window.location.search,
): TenantSlugResult {

  // 1. Production subdomain: green-leaf.cannasaas.com
  if (hostname.endsWith(`.${APEX_DOMAIN}`)) {
    const parts    = hostname.replace(`.${APEX_DOMAIN}`, '').split('.');
    // Take the leftmost non-reserved part (skip 'admin.green-leaf' → 'green-leaf')
    const slug     = parts.reverse().find((p) => !RESERVED_SUBDOMAINS.has(p));
    if (slug) return { slug, source: 'subdomain' };
  }

  // 2. Local dev subdomain: green-leaf.localhost
  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace('.localhost', '').split('.').pop();
    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      return { slug, source: 'subdomain' };
    }
  }

  // 3. VITE env variable (set in .env.local for local development)
  const envSlug = (import.meta as any).env?.VITE_DEV_SLUG as string | undefined;
  if (envSlug) return { slug: envSlug, source: 'env' };

  // 4. Query parameter: localhost:5173?org=green-leaf
  const params   = new URLSearchParams(search);
  const queryOrg = params.get('org');
  if (queryOrg) return { slug: queryOrg, source: 'query' };

  // 5. Fallback
  return { slug: 'demo', source: 'fallback' };
}

/**
 * Returns just the slug string — convenience wrapper for most use cases.
 *
 * @example
 *   const slug = getTenantSlug(); // 'green-leaf'
 */
export function getTenantSlug(): string {
  return extractTenantSlug().slug;
}

/**
 * Inject CSS custom properties for the tenant branding into the document root.
 *
 * Called by RootLayout after setOrganization() resolves the branding config.
 * Using CSS custom properties means:
 *   - All Tailwind utilities that reference `hsl(var(--primary))` etc. update
 *     instantly without a re-render of every component.
 *   - The ThemeProvider in @cannasaas/ui can read these values for shadcn themes.
 *
 * Branding keys map to the CSS property names defined in tailwind.config.js:
 *   primaryColor    → --primary  (hsl values)
 *   secondaryColor  → --secondary
 *   accentColor     → --accent
 *   fontFamily      → --font-heading, --font-body
 *
 * @example
 *   injectTenantTheme({
 *     primaryColor:   '#2D6A4F',
 *     secondaryColor: '#52B788',
 *     accentColor:    '#B7E4C7',
 *     fontFamily:     'Inter',
 *   });
 */
export function injectTenantTheme(branding: {
  primaryColor?:   string;
  secondaryColor?: string;
  accentColor?:    string;
  fontFamily?:     string;
  logoUrl?:        string;
}): void {
  const root = document.documentElement;

  if (branding.primaryColor) {
    root.style.setProperty('--primary',   hexToHslVars(branding.primaryColor));
  }
  if (branding.secondaryColor) {
    root.style.setProperty('--secondary', hexToHslVars(branding.secondaryColor));
  }
  if (branding.accentColor) {
    root.style.setProperty('--accent',    hexToHslVars(branding.accentColor));
  }
  if (branding.fontFamily) {
    root.style.setProperty('--font-heading', branding.fontFamily);
    root.style.setProperty('--font-body',    branding.fontFamily);
  }
}

/**
 * Converts a hex colour string to HSL channel values compatible with
 * Tailwind's `hsl(var(--primary))` syntax.
 *
 * CSS custom property stores just the H S% L% channels (no `hsl()` wrapper)
 * so Tailwind can apply opacity modifiers: `bg-[hsl(var(--primary)/0.1)]`.
 *
 * @example
 *   hexToHslVars('#2D6A4F') // → '154 40% 29%'
 */
function hexToHslVars(hex: string): string {
  // Remove hash
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max  = Math.max(r, g, b);
  const min  = Math.min(r, g, b);
  const l    = (max + min) / 2;
  let s = 0, hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
