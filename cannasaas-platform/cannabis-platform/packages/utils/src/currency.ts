/**
 * New York cannabis excise tax rates (2026).
 * Source: NY Tax Law § 496 — subject to annual adjustment.
 *
 * Flower:      $0.005 per mg of total THC
 * Concentrate: $0.008 per mg of total THC
 * Edible:      $0.03  per mg of total THC
 * Retail tax:  13%    on the retail price
 */
export const NY_CANNABIS_TAX_RATE = {
  retail:      0.13,
  flower_per_mg_thc:      0.005,
  concentrate_per_mg_thc: 0.008,
  edible_per_mg_thc:      0.03,
} as const;

/**
 * Calculate a simple retail tax for a subtotal amount.
 * Full THC-weight excise tax calculation requires product data
 * from the order service — this utility covers the retail portion only.
 */
export function calculateTax(subtotal: number, rate = NY_CANNABIS_TAX_RATE.retail): number {
  return Math.round(subtotal * rate * 100) / 100;
}
