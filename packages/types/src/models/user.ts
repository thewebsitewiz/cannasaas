/**
 * @file user.ts
 * @package @cannasaas/types
 *
 * User model — mirrors the NestJS User entity and the shapes returned by:
 *   GET  /auth/profile
 *   GET  /users/:id
 *   POST /auth/register  (returns User within the response)
 *
 * Roles align with the RBAC matrix in api-reference.md:
 *   super_admin | owner | admin | manager | budtender | driver | customer
 *
 * IMPORTANT: `passwordHash` is never returned by the API.
 *            Always use the User type (not a backend entity) client-side.
 */

// ── Role & Permission Primitives ─────────────────────────────────────────────

/**
 * All role strings that can appear in the JWT payload `roles` array
 * and in the User record returned by the API.
 */
export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'budtender'
  | 'driver'
  | 'customer';

/**
 * Granular permission strings used in the JWT payload `permissions` array.
 * Format: `resource:action`
 */
export type Permission =
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:write'
  | 'analytics:read'
  | 'users:read'
  | 'users:write'
  | 'compliance:read'
  | 'delivery:read'
  | 'delivery:write';

// ── Address ───────────────────────────────────────────────────────────────────

/**
 * Physical address — used on users, dispensaries, and orders.
 * The `coordinates` field is populated by the backend via PostGIS when
 * an address is geocoded during delivery zone checks.
 */
export interface Address {
  /** Street number and name, e.g. "123 Main St, Apt 4B" */
  street: string;
  city: string;
  /** Two-letter US state abbreviation, e.g. "NY" */
  state: string;
  zip: string;
  /** ISO 3166-1 alpha-2 country code. Defaults to "US". */
  country?: string;
  /** PostGIS-resolved geographic coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ── User ─────────────────────────────────────────────────────────────────────

/**
 * Core User record as returned by the CannaSaas API.
 *
 * This interface intentionally omits `passwordHash` — the backend
 * uses the `@Exclude()` decorator to strip it before serialisation.
 */
export interface User {
  /** UUID v4 primary key */
  id: string;

  /** The organization this user belongs to (null for super_admin) */
  organizationId: string | null;

  /** Optional — set for staff/managers scoped to a single dispensary */
  dispensaryId?: string | null;

  email: string;
  firstName: string;
  lastName: string;

  /** Full display name derived by the backend from firstName + lastName */
  fullName: string;

  /** Phone in E.164 format, e.g. "+12125551234" */
  phone?: string | null;

  /** URL to S3-hosted avatar image */
  avatarUrl?: string | null;

  roles: UserRole[];
  permissions: Permission[];

  /** Whether the user's email address has been confirmed */
  isEmailVerified: boolean;

  /**
   * Age verification status for customers.
   * Drives UI gating on 21+ product pages.
   */
  ageVerificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';

  /** Whether the account is active. Soft-deleted accounts are `false`. */
  isActive: boolean;

  /** Loyalty points balance (customer accounts only) */
  loyaltyPoints?: number;

  /** Saved delivery addresses for this customer */
  savedAddresses?: SavedAddress[];

  /** ISO 8601 datetime strings */
  createdAt: string;
  updatedAt: string;

  /** ISO 8601 — populated on first login, used for "Last seen" in admin UI */
  lastLoginAt?: string | null;
}

/**
 * A named, saved delivery address attached to a customer's account.
 * Displayed in the checkout address selector.
 */
export interface SavedAddress extends Address {
  id: string;
  /** Customer-supplied label, e.g. "Home", "Office" */
  label: string;
  isDefault: boolean;
}

/**
 * The decoded JWT access token payload.
 * Access tokens expire in 15 minutes per the API spec.
 */
export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: UserRole[];
  permissions: Permission[];
  /** Issued-at unix timestamp */
  iat: number;
  /** Expiry unix timestamp (iat + 900) */
  exp: number;
}

/**
 * Lightweight user summary returned in list endpoints and embedded in
 * Order, ComplianceEvent, etc. to avoid over-fetching.
 */
export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roles: UserRole[];
}
