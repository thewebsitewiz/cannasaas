/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderStatusBadge — Status Pill + Optional Step Tracker
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/OrderStatusBadge.tsx
 *
 * Two rendering modes:
 *   1. Compact badge — colored pill for list views (OrderCard)
 *   2. Expanded tracker — horizontal step dots for detail views
 *
 * ─── STATUS FLOW ───────────────────────────────────────────────
 *
 *   pending → confirmed → preparing → ready → out_for_delivery → delivered
 *                                        └→ (pickup) ready_for_pickup → completed
 *                  └→ cancelled (terminal)
 *
 * ─── COLORS ────────────────────────────────────────────────────
 *
 *   pending          → amber   (waiting)
 *   confirmed        → blue    (acknowledged)
 *   preparing        → violet  (in progress)
 *   ready*           → cyan    (action needed)
 *   out_for_delivery → indigo  (en route)
 *   delivered/completed → emerald (done)
 *   cancelled        → red     (terminal)
 *
 * Accessibility (WCAG):
 *   - Badge uses both color AND text label (1.4.1)
 *   - Tracker: aria-label on each dot with status name (4.1.2)
 *   - Connector lines aria-hidden (1.1.1)
 *   - sr-only text describes full status for badge mode
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

interface StatusConfig {
  label: string;
  classes: string;
  dotClasses: string;
}

const STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  pending:            { label: 'Pending',           classes: 'bg-amber-50 text-amber-700 border-amber-200',     dotClasses: 'bg-amber-500' },
  confirmed:          { label: 'Confirmed',         classes: 'bg-blue-50 text-blue-700 border-blue-200',        dotClasses: 'bg-blue-500' },
  preparing:          { label: 'Preparing',         classes: 'bg-violet-50 text-violet-700 border-violet-200',  dotClasses: 'bg-violet-500' },
  ready:              { label: 'Ready',             classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',        dotClasses: 'bg-cyan-500' },
  ready_for_pickup:   { label: 'Ready for Pickup',  classes: 'bg-cyan-50 text-cyan-700 border-cyan-200',        dotClasses: 'bg-cyan-500' },
  out_for_delivery:   { label: 'Out for Delivery',  classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',  dotClasses: 'bg-indigo-500' },
  delivered:          { label: 'Delivered',          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClasses: 'bg-emerald-500' },
  completed:          { label: 'Completed',          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClasses: 'bg-emerald-500' },
  cancelled:          { label: 'Cancelled',          classes: 'bg-red-50 text-red-700 border-red-200',           dotClasses: 'bg-red-400' },
};

/** Step sequence for delivery orders */
const DELIVERY_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered',
];

/** Step sequence for pickup orders */
const PICKUP_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed',
];

/* ── Compact Badge ──────────────────────────────────────────── */

interface BadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: BadgeProps) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.pending;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-full text-[11px] sm:text-xs font-semibold
        border
        ${config.classes}
      `}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full ${config.dotClasses}`}
      />
      {config.label}
    </span>
  );
}

/* ── Expanded Step Tracker ──────────────────────────────────── */

interface TrackerProps {
  currentStatus: OrderStatus;
  /** 'delivery' or 'pickup' — determines the step sequence */
  fulfillment: 'delivery' | 'pickup';
}

export function OrderStatusTracker({ currentStatus, fulfillment }: TrackerProps) {
  const steps = fulfillment === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS;

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <span aria-hidden="true" className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm font-medium text-red-700">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between" role="list" aria-label="Order progress">
      {steps.map((step, idx) => {
        const config = STATUS_MAP[step];
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-initial" role="listitem">
            <div className="flex flex-col items-center gap-1">
              <span
                aria-label={`${config.label}: ${isPast ? 'completed' : isCurrent ? 'current' : 'upcoming'}`}
                className={`
                  w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors
                  ${isPast || isCurrent ? config.dotClasses : 'bg-muted border-2 border-border'}
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-primary/30' : ''}
                `}
              />
              <span
                aria-hidden="true"
                className={`
                  text-[8px] sm:text-[10px] font-medium whitespace-nowrap
                  ${isCurrent ? 'text-primary' : isFuture ? 'text-muted-foreground/50' : 'text-muted-foreground'}
                `}
              >
                {config.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={`
                  flex-1 h-0.5 mx-1 sm:mx-2 rounded-full
                  ${idx < currentIdx ? 'bg-primary' : 'bg-border'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
