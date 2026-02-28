// apps/storefront/src/pages/Orders/OrderTrackingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useOrder } from '@cannasaas/api-client';
import { useAccessToken } from '@cannasaas/stores';
import type { OrderStatus } from '@cannasaas/types';
import { formatCurrency } from '@cannasaas/utils';
import { StatusTimeline } from './components/StatusTimeline';

interface TrackingEvent {
  type: 'status_update' | 'driver_location' | 'eta_update';
  orderId: string;
  status?: OrderStatus;
  driverLat?: number;
  driverLng?: number;
  etaMinutes?: number;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAccessToken();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { data: order, isLoading } = useOrder(id!);

  useEffect(() => {
    if (!id || !accessToken) return;
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/delivery/tracking?orderId=${id}&token=${accessToken}`);
    wsRef.current = ws;
    ws.onopen  = () => console.info('[Tracking] WS connected for order', id);
    ws.onclose = () => console.info('[Tracking] WS disconnected');
    ws.onmessage = (event: MessageEvent) => {
      try {
        const p: TrackingEvent = JSON.parse(event.data as string);
        if (p.type === 'status_update'  && p.status)                                      setLiveStatus(p.status);
        if (p.type === 'driver_location' && p.driverLat !== undefined && p.driverLng !== undefined)
          setDriverLocation({ lat: p.driverLat, lng: p.driverLng });
        if (p.type === 'eta_update'     && p.etaMinutes !== undefined)                    setEtaMinutes(p.etaMinutes);
      } catch { console.error('[Tracking] Failed to parse WS message'); }
    };
    return () => ws.close();
  }, [id, accessToken]);

  const effectiveStatus = liveStatus ?? order?.status;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-busy="true">
      <p className="text-[var(--color-text-secondary)]">Loading order details…</p>
    </div>
  );

  if (!order) return (
    <div role="alert" className="flex items-center justify-center min-h-[60vh]">
      <p className="text-[var(--color-error)]">Order not found.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-2">Track Your Order</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Order #{order.orderNumber}</p>

      {etaMinutes !== null && (
        <div className={[
          'flex items-center gap-3 p-4 mb-6 rounded-[var(--p-radius-lg)]',
          'bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]',
        ].join(' ')} aria-live="polite" aria-atomic="true">
          <Clock className="text-[var(--color-brand)] flex-shrink-0" aria-hidden="true" />
          <p className="font-semibold text-[var(--color-brand-text)]">
            Estimated arrival in <strong>{etaMinutes} {etaMinutes === 1 ? 'minute' : 'minutes'}</strong>
          </p>
        </div>
      )}

      <StatusTimeline currentStatus={effectiveStatus ?? 'pending'} fulfillmentType={order.fulfillmentType} className="mb-8" />

      <section aria-labelledby="items-heading"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6">
        <h2 id="items-heading" className="font-bold text-[var(--color-text)] mb-4">Order Summary</h2>
        <ul className="divide-y divide-[var(--color-border)]">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-[var(--color-text)]">{item.productName}</p>
                <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">{item.variantName} × {item.quantity}</p>
              </div>
              <span className="font-bold text-[var(--color-text)]">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex justify-between">
          <span className="font-bold text-[var(--color-text)]">Total</span>
          <span className="font-bold text-[var(--p-text-lg)] text-[var(--color-text)]">{formatCurrency(order.total)}</span>
        </div>
      </section>
    </div>
  );
}
