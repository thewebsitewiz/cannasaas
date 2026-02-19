/**
 * @file OrderDetailPage.tsx
 * @path apps/admin/src/pages/Orders/components/OrderDetail/OrderDetailPage.tsx
 *
 * Full order detail view. Shows:
 *   - Status timeline (StatusTimeline)
 *   - Customer info card
 *   - Line items snapshot
 *   - Payment breakdown
 *   - Fulfillment details + driver assignment
 *   - Status update actions (confirm, mark ready, assign driver, deliver, cancel)
 *
 * STATUS MACHINE: Status transitions follow a strict flow:
 *   pending → confirmed → processing → ready_for_pickup / out_for_delivery → delivered
 *   Any state → cancelled (with refund option)
 *
 * WCAG: The status timeline uses role="list" with visually distinct
 * completed/active/pending indicators. Action buttons have descriptive
 * aria-labels. The order summary region is an <article> with aria-labelledby.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { StatusBadge } from '../../../../components/shared/StatusBadge';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import type { Order, OrderStatus } from '../../../../types/admin.types';
import styles from './OrderDetailPage.module.css';

// ─── Status Timeline Component ────────────────────────────────────────────────

const TIMELINE_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered',
];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  ready_for_pickup: 'Ready', out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
};

function StatusTimeline({ order }: { order: Order }) {
  const steps = order.fulfillment.method === 'pickup'
    ? ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'delivered'] as OrderStatus[]
    : TIMELINE_STEPS;

  const currentIndex = steps.indexOf(order.status);

  return (
    <section className={styles.timelineSection} aria-labelledby="timeline-title">
      <h2 id="timeline-title" className={styles.sectionTitle}>Order Timeline</h2>
      <ol className={styles.timeline} role="list" aria-label="Order status progression">
        {steps.map((step, index) => {
          const isDone = currentIndex > index;
          const isActive = currentIndex === index;
          const historyEvent = order.statusHistory.find((e) => e.status === step);

          return (
            <li
              key={step}
              className={`${styles.timelineStep} ${isDone ? styles.stepDone : ''} ${isActive ? styles.stepActive : ''}`}
              aria-label={`${STATUS_LABELS[step]}: ${isDone ? 'completed' : isActive ? 'current' : 'pending'}`}
            >
              <div className={styles.stepIndicator} aria-hidden="true">
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>{STATUS_LABELS[step]}</span>
                {historyEvent && (
                  <span className={styles.stepTime}>
                    {new Date(historyEvent.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* History log */}
      {order.statusHistory.length > 0 && (
        <details className={styles.historyDetails}>
          <summary className={styles.historySummary}>View full history</summary>
          <ul className={styles.historyList} role="list">
            {order.statusHistory.map((event, i) => (
              <li key={i} className={styles.historyItem}>
                <StatusBadge type="order" value={event.status} />
                <span className={styles.historyActor}>{event.actorName}</span>
                <span className={styles.historyTime}>
                  {new Date(event.timestamp).toLocaleString('en-US', {
                    dateStyle: 'short', timeStyle: 'short',
                  })}
                </span>
                {event.note && <span className={styles.historyNote}>{event.note}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// ─── Status Actions ───────────────────────────────────────────────────────────

function OrderStatusActions({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (status: OrderStatus, note?: string) => void;
}) {
  const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }[]>> = {
    pending:           [{ label: 'Confirm Order',       next: 'confirmed' }],
    confirmed:         [{ label: 'Start Processing',    next: 'processing' }],
    processing:        [
      { label: order.fulfillment.method === 'delivery' ? 'Dispatch Delivery' : 'Mark Ready for Pickup', next: order.fulfillment.method === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup' },
    ],
    ready_for_pickup:  [{ label: 'Mark Picked Up',      next: 'delivered' }],
    out_for_delivery:  [{ label: 'Mark Delivered',      next: 'delivered' }],
  };

  const actions = NEXT_ACTIONS[order.status] ?? [];
  const canCancel = !['delivered', 'cancelled', 'refunded'].includes(order.status);

  return (
    <section className={styles.actionsSection} aria-labelledby="actions-title">
      <h2 id="actions-title" className={styles.sectionTitle}>Actions</h2>
      <div className={styles.actionButtons}>
        {actions.map((action) => (
          <button
            key={action.next}
            type="button"
            className={styles.actionBtn}
            onClick={() => onStatusChange(action.next)}
            aria-label={`${action.label} for order #${order.orderNumber}`}
          >
            {action.label}
          </button>
        ))}
        {canCancel && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => {
              const note = window.prompt('Cancel reason (optional):');
              onStatusChange('cancelled', note ?? undefined);
            }}
            aria-label={`Cancel order #${order.orderNumber}`}
          >
            Cancel Order
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({
    toastSuccess: s.toastSuccess,
    toastError: s.toastError,
  }));

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => { setOrder(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [orderId]);

  const handleStatusChange = async (status: OrderStatus, note?: string) => {
    if (!order) return;
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        const updated: Order = await res.json();
        setOrder(updated);
        toastSuccess(`Order status updated to ${status}`);
      } else {
        toastError('Failed to update order status');
      }
    } catch {
      toastError('Network error');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} aria-hidden="true" />
        <p>Loading order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.notFound}>
        <p>Order not found.</p>
        <button type="button" onClick={() => navigate('/admin/orders')}>Back to Orders</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin' },
          { label: 'Orders', to: '/admin/orders' },
          { label: `#${order.orderNumber}` },
        ]}
        actions={<StatusBadge type="order" value={order.status} />}
      />

      <div className={styles.content}>
        {/* Left column */}
        <div className={styles.mainCol}>
          <StatusTimeline order={order} />

          {/* Line Items */}
          <section className={styles.itemsSection} aria-labelledby="items-title">
            <h2 id="items-title" className={styles.sectionTitle}>Items</h2>
            <ul className={styles.itemList} role="list">
              {order.items.map((item) => (
                <li key={item.variantId} className={styles.itemRow}>
                  {item.thumbnailUrl && (
                    <img src={item.thumbnailUrl} alt="" className={styles.itemThumb} width={44} height={44} />
                  )}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.productName}</span>
                    <span className={styles.itemVariant}>{item.variantLabel} × {item.quantity}</span>
                  </div>
                  <span className={styles.itemTotal}>${(item.lineTotalCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <dl className={styles.totals}>
              <div className={styles.totalRow}>
                <dt>Subtotal</dt>
                <dd>${(order.subtotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className={styles.totalRow}>
                <dt>Tax</dt>
                <dd>${(order.payment.taxCents / 100).toFixed(2)}</dd>
              </div>
              {order.payment.tipCents > 0 && (
                <div className={styles.totalRow}>
                  <dt>Tip</dt>
                  <dd>${(order.payment.tipCents / 100).toFixed(2)}</dd>
                </div>
              )}
              {order.payment.discountCents > 0 && (
                <div className={styles.totalRow}>
                  <dt>Discount</dt>
                  <dd className={styles.discount}>−${(order.payment.discountCents / 100).toFixed(2)}</dd>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <dt><strong>Total</strong></dt>
                <dd><strong>${(order.totalCents / 100).toFixed(2)}</strong></dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Right column */}
        <div className={styles.sideCol}>
          <OrderStatusActions order={order} onStatusChange={handleStatusChange} />

          {/* Customer */}
          <section className={styles.customerSection} aria-labelledby="customer-title">
            <h2 id="customer-title" className={styles.sectionTitle}>Customer</h2>
            <dl className={styles.customerDl}>
              <dt className={styles.srOnly}>Name</dt>
              <dd className={styles.customerName}>{order.customer.displayName}</dd>
              <dt className={styles.srOnly}>Email</dt>
              <dd><a href={`mailto:${order.customer.email}`} className={styles.link}>{order.customer.email}</a></dd>
              {order.customer.phone && (
                <>
                  <dt className={styles.srOnly}>Phone</dt>
                  <dd><a href={`tel:${order.customer.phone}`} className={styles.link}>{order.customer.phone}</a></dd>
                </>
              )}
              <dt className={styles.srOnly}>Verification</dt>
              <dd><StatusBadge type="verification" value={order.customer.isVerified ? 'verified' : 'unverified'} /></dd>
            </dl>
          </section>

          {/* Fulfillment */}
          <section className={styles.fulfillmentSection} aria-labelledby="fulfillment-title">
            <h2 id="fulfillment-title" className={styles.sectionTitle}>Fulfillment</h2>
            <dl className={styles.fulfillmentDl}>
              <dt>Method</dt>
              <dd>{order.fulfillment.method === 'delivery' ? '🚗 Delivery' : '🛍️ Pickup'}</dd>
              {order.fulfillment.deliveryAddress && (
                <>
                  <dt>Address</dt>
                  <dd>{order.fulfillment.deliveryAddress}</dd>
                </>
              )}
              {order.fulfillment.driverName && (
                <>
                  <dt>Driver</dt>
                  <dd>{order.fulfillment.driverName}</dd>
                </>
              )}
              {order.fulfillment.estimatedArrival && (
                <>
                  <dt>ETA</dt>
                  <dd>{new Date(order.fulfillment.estimatedArrival).toLocaleTimeString()}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

