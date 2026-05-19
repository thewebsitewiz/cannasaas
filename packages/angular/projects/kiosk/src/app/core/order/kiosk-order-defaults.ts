/**
 * Kiosk-specific defaults for `CreateOrderGQL` input.
 *
 * Kiosks today only place pre-orders for in-store pickup — the
 * customer taps "Place Order — Pay at Counter" and walks up to a
 * budtender to settle payment. If product ever wants the kiosk to
 * produce in-store-consume or delivery orders, the toggle would
 * live next to these defaults (and a new fulfillment-step UI would
 * pick the value).
 *
 * Lifted into a constant per sc-607 so the day product asks, the
 * change is one edit + one new form field — not a hunt through
 * checkout-page.ts.
 */
export const KIOSK_ORDER_DEFAULTS = {
  orderType: 'pickup',
  notes: 'Kiosk pre-order',
} as const;
