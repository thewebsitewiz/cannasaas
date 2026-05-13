import { environment } from '../../../environments/environment';

/**
 * Resolves the dispensary slug from the current browser location.
 *
 * - Production: subdomain (`greenleaf.cannasaas.com` → `greenleaf`).
 * - Local dev: first path segment (`localhost:5273/greenleaf/...` → `greenleaf`)
 *   falling back to environment.defaultDispensarySlug for bare `/` traffic.
 *
 * Returns `null` if no slug can be resolved.
 */
export function resolveSlugFromLocation(): string | null {
  if (typeof window === 'undefined') return environment.defaultDispensarySlug;

  const { hostname, pathname } = window.location;
  const fromSubdomain = slugFromSubdomain(hostname);
  if (fromSubdomain) return fromSubdomain;

  const fromPath = slugFromPath(pathname);
  if (fromPath) return fromPath;

  return environment.defaultDispensarySlug;
}

function slugFromSubdomain(hostname: string): string | null {
  // Skip IPs and bare localhost.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  if (hostname === 'localhost') return null;

  const parts = hostname.split('.');
  if (parts.length < 3) return null;

  const candidate = parts[0];
  if (candidate === 'www' || candidate === 'app') return null;
  return candidate || null;
}

function slugFromPath(pathname: string): string | null {
  const first = pathname.split('/').filter(Boolean)[0];
  if (!first) return null;
  // Reserved paths that are never tenant slugs.
  if (RESERVED_TOP_LEVEL.has(first)) return null;
  return first;
}

const RESERVED_TOP_LEVEL = new Set<string>([
  'age-gate',
  'login',
  'register',
  'account',
  'cart',
  'checkout',
  'orders',
  'products',
  'themes',
  'assets',
  'favicon.ico',
]);
