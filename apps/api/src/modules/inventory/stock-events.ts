/**
 * Inventory stock-level events. Three event names land on EventEmitter2:
 *
 *   inventory.stock_changed   — every quantity-available change
 *   inventory.low_stock       — crossover from above-threshold → at-or-below
 *   inventory.out_of_stock    — crossover from non-zero → zero
 *
 * The low/out events deliberately reuse the payload shape already
 * consumed by the WS gateway (see modules/ws/order.gateway.ts) so the
 * staff app's `inventory:alert` broadcast keeps working untouched.
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export const STOCK_CHANGED_EVENT = 'inventory.stock_changed';
export const STOCK_LOW_EVENT = 'inventory.low_stock';
export const STOCK_OUT_EVENT = 'inventory.out_of_stock';

export type StockChangeSource = 'adjustment' | 'reserve' | 'release';

export interface StockChangedEvent {
  readonly dispensaryId: string;
  readonly inventoryId: string;
  readonly variantId: string;
  readonly productName: string;
  readonly previousAvailable: number;
  readonly newAvailable: number;
  readonly reorderThreshold: number | null;
  readonly status: StockStatus;
  readonly source: StockChangeSource;
}

/**
 * Existing payload shape consumed by OrderGateway.handleLowStock —
 * keeping it stable so this story doesn't have to touch the gateway.
 */
export interface LowStockEvent {
  readonly dispensaryId: string;
  readonly productName: string;
  readonly quantity: number;
}

export function computeStockStatus(
  available: number,
  threshold: number | null,
): StockStatus {
  if (available <= 0) return 'out_of_stock';
  if (threshold != null && available <= threshold) return 'low_stock';
  return 'in_stock';
}
