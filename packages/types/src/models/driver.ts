/**
 * @file driver.ts
 * @package @cannasaas/types
 *
 * Delivery driver types — mirrors:
 *   GET  /delivery/drivers        (Manager+)
 *   POST /delivery/assign         (Manager+)
 *   WS   /delivery/tracking       (WebSocket — real-time location)
 *
 * Drivers are Users with the 'driver' role.
 * This type extends the base User with delivery-specific fields tracked
 * in the drivers table (separate from users to avoid coupling).
 */

import type { UserSummary } from './user';

// ── Driver Status ─────────────────────────────────────────────────────────────

/**
 * A driver's current operational status.
 * Only 'available' drivers can be assigned new orders.
 */
export type DriverStatus =
  | 'offline'       // Not clocked in
  | 'available'     // Clocked in, no active delivery
  | 'en_route'      // Picked up order, heading to customer
  | 'returning'     // Returning to dispensary after delivery
  | 'break';        // On break

// ── Location ─────────────────────────────────────────────────────────────────

/**
 * Real-time driver location — broadcast via WebSocket (/delivery/tracking).
 * Stored transiently in Redis, not persisted in PostgreSQL.
 */
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  /** Speed in km/h — used to estimate arrival times */
  speed?: number;
  /** Heading in degrees (0–360) for map arrow orientation */
  heading?: number;
  /** ISO 8601 timestamp of last location update */
  updatedAt: string;
}

// ── Driver ────────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;

  /** Links to the users table for authentication and roles */
  user: UserSummary;

  organizationId: string;
  dispensaryId: string;

  /** State-issued driver's license number */
  licenseNumber: string;

  /** Vehicle description for dispatch reference */
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    /** License plate */
    plate: string;
  } | null;

  status: DriverStatus;

  /** Currently assigned order (null if available/offline) */
  activeOrderId?: string | null;

  /** Real-time GPS location (refreshed every 10s when en_route) */
  currentLocation?: DriverLocation | null;

  /** Total deliveries completed — shown in admin driver stats */
  totalDeliveries: number;

  /** Average customer rating from delivery reviews (1–5) */
  averageRating?: number | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── WebSocket Tracking Payload ────────────────────────────────────────────────

/**
 * Message shape emitted by the WS /delivery/tracking endpoint.
 * The client subscribes with `{ orderId }` and receives these updates.
 */
export interface DeliveryTrackingUpdate {
  type: 'location_update' | 'status_change' | 'eta_update';
  orderId: string;
  driver: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string | null;
  };
  location?: DriverLocation;
  /** Updated status (for 'status_change' events) */
  newStatus?: string;
  /** Estimated minutes to arrival (for 'eta_update' events) */
  etaMinutes?: number;
  timestamp: string;
}
