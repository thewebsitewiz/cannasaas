/**
 * @file order.ts
 * @package @cannasaas/types
 *
 * Order model — mirrors the NestJS Order entity and the shapes from:
 *   GET  /orders             (list — returns Order[])
 *   POST /orders             (create — request + response)
 *   GET  /orders/:id         (detail)
 *   PUT  /orders/:id/status  (status update — Manager+)
 *   POST /orders/:id/cancel
 *   POST /orders/:id/refund
 *
 * Status lifecycle (from api-reference.md):
 *   pending → confirmed → preparing → ready_for_pickup → completed
 *                      → out_for_delivery → delivered   → completed
 *   pending → cancelled
 *   completed → refunded
 */

import type { CartItem, AppliedCoupon } from './cart-item';
import type { Address, UserSummary } from './user';

// ── Status ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type FulfillmentMethod = 'pickup' | 'delivery';

export type PaymentMethod = 'card' | 'cash' | 'debit';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

// ── Order Line Item ───────────────────────────────────────────────────────────

/**
 * A line item snapshot captured at order creation.
 * Prices are frozen at purchase time — product price changes don't affect
 * existing orders.
 */
export interface OrderLineItem {
  id: string;
  orderId: string;

  productId: string;
  variantId: string;

  /** Denormalised at order creation — preserved for order history display */
  productName: string;
  variantName: string;
  sku: string;
  imageUrl?: string | null;

  /** Price per unit at time of purchase */
  unitPrice: number;
  quantity: number;
  totalPrice: number;

  /** Weight in grams per unit — recorded for compliance audit trail */
  weightGrams: number;

  /** Metrc tag assigned to this line item (populated after METRC sync) */
  metrcTag?: string | null;
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface Order {
  id: string;

  /** Sequential display-friendly ID, e.g. "#CS-00042" */
  orderNumber: string;

  organizationId: string;
  dispensaryId: string;

  /** The customer who placed the order */
  customer: UserSummary;

  items: OrderLineItem[];

  fulfillmentMethod: FulfillmentMethod;

  /** Populated when fulfillmentMethod is 'delivery' */
  deliveryAddress?: Address | null;

  /** Scheduled fulfillment time — customer selects during checkout */
  scheduledAt?: string | null;

  /** Driver assigned to this order (delivery only) */
  driverId?: string | null;
  driver?: UserSummary | null;

  status: OrderStatus;

  /** Ordered history of status transitions for the order timeline UI */
  statusHistory: OrderStatusEvent[];

  // ── Financials ──────────────────────────────────────────────────────────────
  subtotal: number;
  appliedCoupon?: AppliedCoupon | null;
  promoDiscount: number;
  deliveryFee: number;
  tax: number;
  taxRate: number;
  total: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  /** Stripe PaymentIntent ID — used to track refunds */
  stripePaymentIntentId?: string | null;

  /** Amount refunded so far (supports partial refunds) */
  refundedAmount?: number;

  /** Manager notes visible to staff only */
  staffNotes?: string | null;

  /** Customer-facing order notes */
  customerNotes?: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * A single step in the order's status history timeline.
 * Drives the Order Tracker UI visible to customers.
 */
export interface OrderStatusEvent {
  status: OrderStatus;
  /** ISO 8601 timestamp of the transition */
  timestamp: string;
  /** Staff member who triggered the transition */
  changedBy?: UserSummary | null;
  /** Optional note explaining the status change */
  note?: string | null;
}

// ── Create Order Request ──────────────────────────────────────────────────────

/**
 * POST /orders request body sent from the Checkout page.
 */
export interface CreateOrderRequest {
  dispensaryId: string;
  fulfillmentMethod: FulfillmentMethod;
  /** Required when fulfillmentMethod is 'delivery' */
  deliveryAddressId?: string;
  paymentMethod: PaymentMethod;
  /** Stripe PaymentMethod ID from Stripe.js */
  stripePaymentMethodId?: string;
  scheduledAt?: string;
  customerNotes?: string;
  /** Applied promo code (validated server-side) */
  couponCode?: string;
}
