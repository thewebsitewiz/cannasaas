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
