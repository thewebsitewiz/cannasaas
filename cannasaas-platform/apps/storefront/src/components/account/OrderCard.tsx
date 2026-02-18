/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderCard — Single Order Summary Card
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/OrderCard.tsx
 *
 * Renders one order in the order history list: order number, date,
 * status badge, item thumbnails, total, and action links (View
 * Details, Reorder, Track).
 *
 * Visual:
 *   ┌───────────────────────────────────────────────────┐
 *   │ ORD-20240120-001        Jan 20, 2024    [Delivered] │
 *   │                                                     │
 *   │ 🌿 🌿 🌿  +2 more                        $72.08  │
 *   │                                                     │
 *   │ [View Details]  [Reorder]           [Track Order]   │
 *   └───────────────────────────────────────────────────┘
 *
 * Accessibility (WCAG):
 *   - <article> with aria-label "Order ORD-..." (4.1.2)
 *   - Status badge: color + text (1.4.1)
 *   - Action links: descriptive text (2.4.4)
 *   - Thumbnails: aria-hidden (decorative summary) (1.1.1)
 *   - focus-visible rings on all links (2.4.7)
 *   - Touch targets ≥ 44px (2.5.8)
 *
 * Responsive:
 *   - Full-width card, stacked mobile
 *   - Actions: wrap on mobile, inline sm+
 */

import { Link } from 'react-router-dom';
import { formatCurrency } from '@cannasaas/utils';
import { OrderStatusBadge, type OrderStatus } from './OrderStatusBadge';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  items: Array<{
    name: string;
    imageUrl?: string;
    quantity: number;
  }>;
}

interface OrderCardProps {
  order: OrderSummary;
}

export function OrderCard({ order }: OrderCardProps) {
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);
  const visibleThumbs = order.items.slice(0, 4);
  const extraCount = order.items.length - 4;

  const canTrack = ['confirmed', 'preparing', 'out_for_delivery', 'ready', 'ready_for_pickup'].includes(order.status);
  const canReorder = ['delivered', 'completed', 'cancelled'].includes(order.status);

  return (
    <article
      aria-label={`Order ${order.orderNumber}`}
      className="
        border border-border rounded-xl
        p-4 sm:p-5
        hover:shadow-sm transition-shadow
      "
    >
      {/* ── Header: order number, date, status ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-sm sm:text-base">
            {order.orderNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {date} · {totalItems} item{totalItems !== 1 ? 's' : ''} · {order.fulfillmentMethod === 'pickup' ? '🏪 Pickup' : '🚗 Delivery'}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* ── Item thumbnails + total ── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {visibleThumbs.map((item, idx) => (
            <div
              key={idx}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🌿</div>
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-muted-foreground font-medium ml-1">
              +{extraCount} more
            </span>
          )}
        </div>

        <p className="text-base sm:text-lg font-bold tabular-nums flex-shrink-0">
          {formatCurrency(order.total)}
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          to={`/account/orders/${order.id}`}
          className="
            px-3 py-2 min-h-[44px]
            text-xs sm:text-sm font-medium
            text-primary border border-primary rounded-lg
            hover:bg-primary/5
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-1
            transition-colors
          "
        >
          View Details
        </Link>

        {canReorder && (
          <button
            className="
              px-3 py-2 min-h-[44px]
              text-xs sm:text-sm font-medium
              text-muted-foreground border border-border rounded-lg
              hover:bg-muted hover:text-foreground
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            Reorder
          </button>
        )}

        {canTrack && (
          <Link
            to={`/account/orders/${order.id}/track`}
            className="
              ml-auto
              px-3 py-2 min-h-[44px]
              text-xs sm:text-sm font-semibold
              text-primary-foreground bg-primary rounded-lg
              hover:bg-primary/90
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-primary focus-visible:ring-offset-1
              transition-colors
            "
          >
            Track Order
          </Link>
        )}
      </div>
    </article>
  );
}
