/**
 * @file delivery-zone.ts
 * @package @cannasaas/types
 *
 * Delivery zone types — mirrors:
 *   GET  /delivery/zones                (Manager+)
 *   POST /delivery/zones                (Admin+)
 *   POST /delivery/check-address        (Public)
 *
 * Zones are stored as PostGIS geography(Polygon, 4326) objects in the
 * backend and serialised as GeoJSON for the API.
 *
 * The storefront uses check-address during checkout to determine if the
 * customer's address falls within an active delivery zone.
 */

// ── GeoJSON Primitives ────────────────────────────────────────────────────────

/** A [longitude, latitude] coordinate pair (GeoJSON order — note: lon first) */
export type GeoJsonCoordinate = [number, number];

/**
 * A GeoJSON Polygon geometry.
 * The first and last coordinate in each ring must be identical (closed ring).
 * `coordinates[0]` is the outer boundary; subsequent arrays are holes.
 */
export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: GeoJsonCoordinate[][];
}

// ── Delivery Zone ─────────────────────────────────────────────────────────────

/**
 * Delivery fee structure supporting tiered pricing by order value.
 */
export interface DeliveryFeeConfig {
  /** Base fee in dollars */
  baseFee: number;
  /** Minimum order subtotal before delivery is available */
  minimumOrderAmount: number;
  /** Order subtotal above which delivery is free */
  freeDeliveryThreshold?: number | null;
}

/**
 * A geographic polygon that defines where a dispensary delivers.
 * A dispensary may have multiple non-overlapping zones with different fees.
 */
export interface DeliveryZone {
  id: string;
  dispensaryId: string;
  organizationId: string;

  /** Display name shown in admin UI, e.g. "Manhattan Zone A" */
  name: string;

  /** Optional description, e.g. "Lower Manhattan below 14th St" */
  description?: string | null;

  /** GeoJSON polygon boundary stored via PostGIS */
  polygon: GeoJsonPolygon;

  feeConfig: DeliveryFeeConfig;

  /**
   * Estimated delivery time range in minutes.
   * Displayed to customers: "30–60 min delivery"
   */
  estimatedMinutes: {
    min: number;
    max: number;
  };

  /** Operating hours for deliveries — may differ from dispensary hours */
  deliveryHours?: {
    [day: string]: { start: string; end: string } | null;
  };

  /** Maximum concurrent delivery orders accepted from this zone */
  maxConcurrentOrders?: number | null;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response from POST /delivery/check-address.
 * Used on the checkout page to gate delivery fulfillment.
 */
export interface AddressDeliveryCheck {
  isDeliverable: boolean;
  /** The zone the address falls within (null if not deliverable) */
  zone: DeliveryZone | null;
  /** Computed fee for this specific order/address combination */
  deliveryFee: number;
  estimatedMinutes: {
    min: number;
    max: number;
  };
}
