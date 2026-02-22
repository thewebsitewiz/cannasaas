/**
 * @file OrderStatusBadge.tsx
 * @description Status chip for Order and Staff portal order lists.
 *
 * Accessibility:
 *   - Uses aria-label to convey the full status name (not just the
 *     colored dot) so colour is not the only visual indicator (WCAG 1.4.1).
 *   - The badge text also conveys status — colour is supplementary.
 *
 * @pattern Pure presentational — no side effects, fully deterministic
 */

import React, { memo } from 'react';
import type { OrderStatus } from '@cannasaas/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** Optional size variant */
  size?: 'sm' | 'md';
}

/** Maps each order status to a Tailwind colour pair + display label */
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending:           { label: 'Pending',            bg: 'bg-yellow-50',  text: 'text-yellow-800', dot: 'bg-yellow-400' },
  confirmed:         { label: 'Confirmed',           bg: 'bg-blue-50',    text: 'text-blue-800',   dot: 'bg-blue-400' },
  preparing:         { label: 'Preparing',           bg: 'bg-indigo-50',  text: 'text-indigo-800', dot: 'bg-indigo-400' },
  ready_for_pickup:  { label: 'Ready for Pickup',    bg: 'bg-teal-50',    text: 'text-teal-800',   dot: 'bg-teal-500' },
  out_for_delivery:  { label: 'Out for Delivery',    bg: 'bg-purple-50',  text: 'text-purple-800', dot: 'bg-purple-400' },
  delivered:         { label: 'Delivered',           bg: 'bg-green-50',   text: 'text-green-800',  dot: 'bg-green-500' },
  completed:         { label: 'Completed',           bg: 'bg-green-50',   text: 'text-green-800',  dot: 'bg-green-500' },
  cancelled:         { label: 'Cancelled',           bg: 'bg-red-50',     text: 'text-red-800',    dot: 'bg-red-400' },
  refunded:          { label: 'Refunded',            bg: 'bg-orange-50',  text: 'text-orange-800', dot: 'bg-orange-400' },
};

export const OrderStatusBadge = memo(function OrderStatusBadge({
  status,
  size = 'md',
}: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      role="status"
      aria-label={`Order status: ${config.label}`}
      className={[
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg, config.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      ].join(' ')}
    >
      {/* Colour indicator dot — supplementary to text (WCAG 1.4.1) */}
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`}
      />
      {config.label}
    </span>
  );
});

OrderStatusBadge.displayName = 'OrderStatusBadge';
