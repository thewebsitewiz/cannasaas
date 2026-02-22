/**
 * @file OrderTimeline.tsx
 * @description Vertical timeline of order status history events.
 *
 * Accessibility:
 *   - Uses <ol> (ordered list) — history is sequential (WCAG 1.3.1)
 *   - Each event has a time element with dateTime attribute (machine-readable)
 *   - Current step indicated by aria-current="step"
 *   - Decorative timeline line is aria-hidden
 *
 * @pattern Presentational — receives statusHistory as prop
 */

import React, { memo } from 'react';
import type { OrderStatusEvent, OrderStatus } from '@cannasaas/types';

interface OrderTimelineProps {
  statusHistory: OrderStatusEvent[];
  currentStatus: OrderStatus;
}

/** Friendly verb for each status transition */
const STATUS_VERB: Record<OrderStatus, string> = {
  pending:           'Order placed',
  confirmed:         'Order confirmed',
  preparing:         'Being prepared',
  ready_for_pickup:  'Ready for pickup',
  out_for_delivery:  'Out for delivery',
  delivered:         'Delivered',
  completed:         'Order complete',
  cancelled:         'Order cancelled',
  refunded:          'Order refunded',
};

export const OrderTimeline = memo(function OrderTimeline({
  statusHistory,
  currentStatus,
}: OrderTimelineProps) {
  return (
    <section aria-label="Order status timeline">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Timeline</h3>

      {/*
       * <ol> communicates sequence to screen readers.
       * Reversed because newest event is rendered first (top of list).
       */}
      <ol
        aria-label={`${statusHistory.length} status events`}
        className="relative space-y-0"
      >
        {/* Decorative vertical line */}
        <div
          aria-hidden="true"
          className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200"
        />

        {statusHistory.map((event, index) => {
          const isLatest = index === statusHistory.length - 1;
          const isCurrent = event.status === currentStatus;

          return (
            <li
              key={`${event.status}-${event.timestamp}`}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative pl-8 pb-6 last:pb-0"
            >
              {/* Step indicator dot */}
              <div
                aria-hidden="true"
                className={[
                  'absolute left-0 w-6 h-6 rounded-full',
                  'flex items-center justify-center',
                  'border-2 bg-white z-10',
                  isLatest
                    ? 'border-[hsl(var(--primary))]'
                    : 'border-gray-300',
                ].join(' ')}
              >
                {isLatest ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))]" />
                ) : (
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                    <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z" />
                  </svg>
                )}
              </div>

              {/* Event content */}
              <div>
                <p className={[
                  'text-sm font-medium',
                  isLatest ? 'text-gray-900' : 'text-gray-500',
                ].join(' ')}>
                  {STATUS_VERB[event.status]}
                </p>

                {event.note && (
                  <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>
                )}

                {/*
                 * <time> with dateTime provides machine-readable timestamp.
                 * The text content is human-friendly (WCAG 1.3.1).
                 */}
                <time
                  dateTime={event.timestamp}
                  className="text-xs text-gray-400 mt-0.5 block"
                >
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>

                {event.changedBy && (
                  <p className="text-xs text-gray-400">
                    by {event.changedBy.fullName}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
});

OrderTimeline.displayName = 'OrderTimeline';
