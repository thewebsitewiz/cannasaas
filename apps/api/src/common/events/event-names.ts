/**
 * Single source of truth for cross-module event names emitted on
 * `EventEmitter2`. Import from here instead of inlining the string —
 * the typo radius for `@OnEvent('order.complete')` vs `'order.completed'`
 * is silent (the listener never fires) and historically painful.
 *
 * Inventory events also have a parallel module-local export in
 * `modules/inventory/stock-events.ts` so the inventory module can stay
 * self-contained; the values here are the same and both re-export the
 * same constants where it matters.
 */

// ── Orders ────────────────────────────────────────────────────────
export const ORDER_CREATED = 'order.created';
export const ORDER_STATUS_CHANGED = 'order.status_changed';
export const ORDER_COMPLETED = 'order.completed';

// ── Inventory ─────────────────────────────────────────────────────
export const INVENTORY_STOCK_CHANGED = 'inventory.stock_changed';
export const INVENTORY_LOW_STOCK = 'inventory.low_stock';
export const INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock';

// ── Customers ─────────────────────────────────────────────────────
export const CUSTOMER_REGISTERED = 'customer.registered';
