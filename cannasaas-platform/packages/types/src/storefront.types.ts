/**
 * @file storefront.types.ts
 * @package @cannasaas/types
 *
 * Shared TypeScript type definitions for the CannaSaas storefront layout system.
 * These types are consumed by both the storefront app and any SSR/API layers.
 *
 * Design note: All types are exported as named exports (not default) to support
 * tree-shaking in consuming packages.
 */

// ─── Organization / Tenant ───────────────────────────────────────────────────

/**
 * Represents the public-facing configuration of a dispensary tenant.
 * Sourced from the multi-tenant `organizations` table via the NestJS API.
 */
export interface Organization {
  /** UUID primary key */
  id: string;

  /** Display name shown in the header and page title */
  name: string;

  /** Public URL to the organization's logo asset (CDN-hosted) */
  logoUrl: string | null;

  /**
   * Accessible alt text for the logo image.
   * Falls back to `${name} logo` if not provided.
   */
  logoAlt: string | null;

  /** Primary brand color (hex, e.g. "#2D6A4F") used for CSS custom property injection */
  brandColor: string | null;

  /** Accent brand color (hex) */
  accentColor: string | null;

  /** Street address line 1 */
  addressLine1: string;

  /** Street address line 2 (suite, unit, etc.) */
  addressLine2: string | null;

  /** City */
  city: string;

  /** State abbreviation (NY, NJ, CT) */
  state: string;

  /** ZIP code */
  zip: string;

  /** Display phone number */
  phone: string | null;

  /** Contact email */
  email: string | null;

  /** Social media handles – all optional */
  social: OrganizationSocial;

  /** Operating hours keyed by day abbreviation */
  hours: Record<Weekday, DailyHours | null>;

  /** Minimum age for entry (21 in rec states, 18 for medical-only) */
  minimumAge: 18 | 21;
}

/** Weekday keys used for hours mapping */
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Operating hours for a single day */
export interface DailyHours {
  open: string;   // e.g. "09:00"
  close: string;  // e.g. "21:00"
  closed: boolean;
}

/** Social media platform handles */
export interface OrganizationSocial {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  leafly?: string;
  weedmaps?: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

/**
 * Lightweight cart summary used by the CartButton badge.
 * The full cart state lives in cartStore.ts.
 */
export interface CartSummary {
  /** Total number of individual units across all line items */
  itemCount: number;

  /** Subtotal in cents (USD) before taxes and discounts */
  subtotalCents: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * A single navigation link in the primary or footer nav.
 * Supports nested children for dropdown menus.
 */
export interface NavItem {
  /** Unique key for React rendering */
  key: string;

  /** Visible label text */
  label: string;

  /** Route path (React Router v6 format) */
  to: string;

  /** Optional icon name from the icon library */
  icon?: string;

  /** Nested children for mega-menu or dropdown */
  children?: NavItem[];

  /** Whether this item should be hidden from unauthenticated users */
  requiresAuth?: boolean;
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * A single autocomplete suggestion returned by the search API.
 */
export interface SearchSuggestion {
  /** Unique identifier (product ID, category slug, etc.) */
  id: string;

  /** Display label shown in the dropdown */
  label: string;

  /** Type determines routing behavior on selection */
  type: 'product' | 'category' | 'brand' | 'strain';

  /** Optional image thumbnail URL */
  thumbnailUrl?: string;

  /** Price in cents (for product suggestions) */
  priceCents?: number;
}

