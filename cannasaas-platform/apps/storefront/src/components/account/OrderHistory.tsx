/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderHistory — Order List with Filters + Pagination
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/OrderHistory.tsx
 *
 * Route: /account/orders
 *
 * Displays paginated order history from GET /orders with optional
 * status filtering. Each order renders as an OrderCard.
 *
 * ─── API ───────────────────────────────────────────────────────
 *
 *   GET /orders?page=1&limit=10&status=delivered
 *   → { data: OrderSummary[], pagination: { page, totalPages } }
 *
 * ─── FILTER BAR ────────────────────────────────────────────────
 *
 *   [All] [Active] [Delivered] [Cancelled]
 *
 *   "Active" is a virtual filter that maps to:
 *   status=pending,confirmed,preparing,ready,out_for_delivery
 *
 * Accessibility (WCAG):
 *   - Filter: <fieldset>/<legend> + radio pills (1.3.1)
 *   - Order list: role="list" (1.3.1)
 *   - aria-live="polite" on results area (4.1.3)
 *   - Loading skeleton: role="status" aria-busy (4.1.2)
 *   - Empty state: role="status" (4.1.2)
 *   - Pagination reuses existing Pagination component
 *   - focus-visible rings (2.4.7)
 *
 * Responsive:
 *   - Filter pills: horizontal scroll on mobile
 *   - Order cards: full-width stacked
 */

import { useState } from 'react';
import { useOrders } from '@cannasaas/api-client';
import { OrderCard } from './OrderCard';

type FilterOption = 'all' | 'active' | 'delivered' | 'cancelled';

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all',       label: 'All Orders' },
  { value: 'active',    label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Map virtual "active" filter to actual API status values */
function getStatusParam(filter: FilterOption): string | undefined {
  switch (filter) {
    case 'active':
      return 'pending,confirmed,preparing,ready,ready_for_pickup,out_for_delivery';
    case 'delivered':
      return 'delivered,completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return undefined; // all
  }
}

export function OrderHistory() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    page,
    limit: 10,
    status: getStatusParam(filter),
  });

  const orders = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Order History</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and manage your past orders.
        </p>
      </div>

      {/* ── Filter pills ── */}
      <fieldset className="mb-6">
        <legend className="sr-only">Filter orders by status</legend>
        <div
          className="
            flex gap-2 overflow-x-auto pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
        >
          {FILTERS.map((f) => (
            <label
              key={f.value}
              className={`
                flex-shrink-0
                px-3 py-2 min-h-[44px]
                rounded-full text-xs sm:text-sm font-medium
                border cursor-pointer transition-colors whitespace-nowrap
                focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1
                ${filter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/40'}
              `}
            >
              <input
                type="radio"
                name="orderFilter"
                value={f.value}
                checked={filter === f.value}
                onChange={() => { setFilter(f.value); setPage(1); }}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Results ── */}
      <div aria-live="polite" aria-atomic="true">
        {isLoading ? (
          <div className="space-y-4" role="status" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
            ))}
            <span className="sr-only">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div role="status" className="py-12 text-center">
            <span aria-hidden="true" className="text-5xl block mb-3">📦</span>
            <p className="text-base font-semibold mb-1">No orders found</p>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all'
                ? 'Try a different filter or browse products to place your first order.'
                : "You haven't placed any orders yet."}
            </p>
          </div>
        ) : (
          <div role="list" className="space-y-4">
            {orders.map((order) => (
              <div role="listitem" key={order.id}>
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <nav aria-label="Order history pages" className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="
              px-3 py-2 min-h-[44px]
              text-sm font-medium rounded-lg border border-border
              disabled:opacity-40
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            ←
          </button>
          <span className="flex items-center px-3 text-sm text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="
              px-3 py-2 min-h-[44px]
              text-sm font-medium rounded-lg border border-border
              disabled:opacity-40
              hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            →
          </button>
        </nav>
      )}
    </div>
  );
}
