/**
 * @file organization.ts
 * @package @cannasaas/types
 *
 * Three-level organizational hierarchy as documented in architecture.md §2:
 *
 *   Organization (Holding Company)
 *     └── Company  (Legal Business Entity, state-licensed)
 *           └── Dispensary  (Physical / Virtual Location)
 *
 * This mirrors the NestJS entities:
 *   - src/organizations/entities/organization.entity.ts
 *   - src/companies/entities/company.entity.ts
 *   - src/dispensaries/entities/dispensary.entity.ts
 *
 * Branding at each level inherits downward (Organization → Company →
 * Dispensary) and can be selectively overridden per the architecture doc.
 */

import type { Address } from './user';

// ── Branding ─────────────────────────────────────────────────────────────────

/**
 * White-label branding configuration applied to the storefront.
 * Colors are stored as hex strings; the ThemeProvider converts them to
 * HSL and injects them as CSS custom properties (`--primary`, etc.).
 */
export interface BrandingConfig {
  /** Primary brand color hex, e.g. "#2D6A4F" */
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  /** Page/card background override */
  backgroundColor?: string;
  /** Body text color override */
  textColor?: string;

  /**
   * Font family names.  Must be available via Google Fonts or system fonts.
   * Applied to `--font-heading` and `--font-body` CSS variables.
   */
  headingFont: string;
  bodyFont: string;

  logo?: {
    /** Full-size logo URL (S3) — used in header */
    url: string;
    /** Small favicon URL (S3) — injected into <link rel="icon"> */
    favicon?: string;
    /** Alt text for accessibility (WCAG 1.1.1 non-text content) */
    alt: string;
  };

  /**
   * Raw CSS injected into a <style> tag for advanced per-tenant overrides.
   * Stored encrypted in the DB; rendered only for verified tenants.
   */
  customCss?: string;
}

// ── Organization ─────────────────────────────────────────────────────────────

/** Top-level tenant entity — one per holding company / multi-location group */
export interface Organization {
  id: string;
  /** URL-safe slug used for subdomain routing, e.g. "green-leaf" */
  slug: string;
  name: string;
  contactEmail: string;
  phone?: string | null;
  website?: string | null;
  branding?: BrandingConfig | null;
  isActive: boolean;
  /** Subscription tier determines API rate limits and feature access */
  subscriptionTier: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

// ── Company ───────────────────────────────────────────────────────────────────

/**
 * A legal business entity within an Organization.
 * Holds the state cannabis license and payment processor config.
 */
export interface Company {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  /** State cannabis license number — required for Metrc integration */
  licenseNumber: string;
  /** Two-letter state abbreviation — drives compliance rule set */
  state: 'NY' | 'NJ' | 'CT' | string;
  branding?: Partial<BrandingConfig> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Dispensary ────────────────────────────────────────────────────────────────

/** License types align with state compliance categories */
export type LicenseType = 'medical' | 'recreational' | 'medical_recreational';

/**
 * Operating hours for a single day.
 * null values indicate the dispensary is closed that day.
 */
export interface DayHours {
  /** 24-hour time string "HH:MM", e.g. "09:00" */
  open: string | null;
  close: string | null;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

/**
 * A physical or virtual dispensary location.
 * Coordinates are stored via PostGIS geography(Point,4326) in the backend.
 */
export interface Dispensary {
  id: string;
  companyId: string;
  organizationId: string;
  slug: string;
  name: string;

  address: Address;

  /** PostGIS resolved coordinates — drives GET /dispensaries/nearby */
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  licenseType: LicenseType;
  /** State cannabis license number for this location */
  locationLicenseNumber?: string;
  operatingHours?: OperatingHours;
  deliveryAvailable: boolean;
  /** Distance in miles — only present in /dispensaries/nearby responses */
  distance?: number;

  /** Branding overrides at dispensary level (highest specificity) */
  branding?: Partial<BrandingConfig> | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resolved tenant context stored in `organizationStore`.
 * The React app boots by resolving this from the request subdomain.
 */
export interface TenantContext {
  organization: Organization;
  company: Company | null;
  dispensary: Dispensary | null;
  /** Merged branding (dispensary > company > organization precedence) */
  resolvedBranding: BrandingConfig;
}
