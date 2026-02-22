/**
 * @file compliance-event.ts
 * @package @cannasaas/types
 *
 * Compliance and audit log types — mirrors:
 *   GET  /compliance/logs                 (Manager+)
 *   GET  /compliance/purchase-limit       (Authenticated)
 *   POST /compliance/reports/daily        (Manager+)
 *
 * All state-reportable events are written to compliance_logs by the
 * backend before returning the API response (not async) to ensure
 * the audit trail is always consistent.
 *
 * For NY, NJ, CT — compliance aligns with Metrc reporting requirements
 * documented in CannaSaas-Metrc-Otreeba-Integration-Guide.md.
 */

import type { UserSummary } from './user';

// ── Event Types ───────────────────────────────────────────────────────────────

/**
 * All auditable event categories tracked by the compliance module.
 * Maps to the `event_type` column in the compliance_logs table.
 */
export type ComplianceEventType =
  // Order lifecycle
  | 'order_created'
  | 'order_confirmed'
  | 'order_cancelled'
  | 'order_refunded'
  // Inventory
  | 'inventory_received'
  | 'inventory_adjusted'
  | 'inventory_destroyed'
  | 'inventory_transferred'
  // Age verification
  | 'age_verification_initiated'
  | 'age_verification_approved'
  | 'age_verification_rejected'
  // Purchase limits
  | 'purchase_limit_checked'
  | 'purchase_limit_exceeded'
  // Metrc sync
  | 'metrc_tag_assigned'
  | 'metrc_sync_success'
  | 'metrc_sync_failure'
  // Auth
  | 'login_success'
  | 'login_failure'
  | 'password_reset'
  // User management
  | 'user_created'
  | 'user_deactivated'
  | 'role_assigned';

// ── Metrc Context ─────────────────────────────────────────────────────────────

/**
 * Metrc-specific metadata attached to inventory/order compliance events.
 * Used to populate the Metrc transfer manifests.
 */
export interface MetrcContext {
  /** Metrc license number of the reporting entity */
  licenseNumber: string;
  /** RFID-style tag assigned to the cannabis package */
  packageTag?: string;
  /** Transfer manifest number */
  manifestNumber?: string;
  /** Metrc item category, e.g. "Flower" | "Concentrate" */
  itemCategory?: string;
  /** Response from Metrc API (200 = synced, null = pending) */
  metrcResponseCode?: number | null;
  /** ISO 8601 — when the event was reported to Metrc */
  reportedAt?: string | null;
}

// ── Compliance Event ─────────────────────────────────────────────────────────

/**
 * A single immutable audit log entry.
 * Rows in compliance_logs are never deleted — they form the tamper-evident
 * audit trail required by cannabis regulators.
 */
export interface ComplianceEvent {
  id: string;
  organizationId: string;
  dispensaryId: string;

  eventType: ComplianceEventType;

  /** The user whose action triggered this event */
  actor: UserSummary | null;

  /** The customer affected by the event (order/purchase-limit events) */
  subject?: UserSummary | null;

  /** UUID of the primary entity this event relates to */
  entityId?: string | null;
  /** The NestJS entity class name, e.g. "Order", "Product", "User" */
  entityType?: string | null;

  /**
   * Freeform JSON payload — schema varies by eventType.
   * Examples:
   *   order_created:          { orderId, total, itemCount }
   *   purchase_limit_checked: { purchasedGrams, limitGrams, remaining }
   *   metrc_sync_failure:     { error, endpoint, payload }
   */
  metadata: Record<string, unknown>;

  /** Metrc-specific context — only present on Metrc-related events */
  metrcContext?: MetrcContext | null;

  /** IP address of the actor — stored for security audit purposes */
  ipAddress?: string | null;

  /** ISO 8601 — immutable once written */
  occurredAt: string;
}

// ── Purchase Limit ────────────────────────────────────────────────────────────

/**
 * Response from GET /compliance/purchase-limit.
 * Drives the purchase limit warning banner on the cart and checkout pages.
 */
export interface PurchaseLimitStatus {
  customerId: string;
  dispensaryId: string;
  state: string;

  /** Daily limits by product category in grams */
  limits: {
    flower: number;
    concentrate: number;
    edible: number;
    /** Aggregate limit across all categories */
    total: number;
  };

  /** Amount purchased today in grams by category */
  purchased: {
    flower: number;
    concentrate: number;
    edible: number;
    total: number;
  };

  /** Remaining grams by category */
  remaining: {
    flower: number;
    concentrate: number;
    edible: number;
    total: number;
  };

  /** ISO 8601 midnight UTC — when the daily limit resets */
  resetsAt: string;
}
