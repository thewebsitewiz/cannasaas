'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { Package, Clock, CheckCircle, Truck, MapPin, ArrowLeft } from 'lucide-react';

const ORDER_QUERY = `query($id: ID!, $dispensaryId: ID) {
  order(orderId: $id, dispensaryId: $dispensaryId) {
    orderId orderStatus orderType subtotal taxTotal total
    createdAt updatedAt
  }
}`;

const STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Clock },
  { key: 'out_for_delivery', label: 'On the way', icon: Truck },
  { key: 'completed', label: 'Completed', icon: MapPin },
];

const STEP_INDEX: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  preparing: 1,
  ready: 2,
  out_for_delivery: 3,
  delivered: 4,
  completed: 4,
  picked_up: 4,
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lastUpdate, subscribeToOrder, connected } = useOrderSocket();

  useEffect(() => {
    if (orderId) {
      gqlAuth<any>(ORDER_QUERY, { id: orderId, dispensaryId: DEFAULT_DISPENSARY_ID })
        .then((d) => { if (d.order) setOrder(d.order); })
        .catch(() => {})
        .finally(() => setLoading(false));

      subscribeToOrder(orderId);
    }
  }, [orderId, subscribeToOrder]);

  useEffect(() => {
    if (lastUpdate && lastUpdate.orderId === orderId) {
      setOrder((prev: any) => prev ? { ...prev, orderStatus: lastUpdate.status } : prev);
    }
  }, [lastUpdate, orderId]);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-txt-muted">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-txt">Order not found</h1>
        <Link href="/products" className="text-sm text-brand-600 font-medium mt-2 inline-block">Back to menu</Link>
      </div>
    );
  }

  const currentStep = STEP_INDEX[order.orderStatus] ?? -1;
  const isPickup = order.orderType === 'pickup' || order.orderType === 'in_store';
  const isCancelled = order.orderStatus === 'cancelled';
  const isComplete = currentStep >= 4;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/account" className="flex items-center gap-1 text-sm text-txt-muted hover:text-txt mb-6">
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <div className="bg-surface rounded-xl border border-bdr p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-txt">Order #{orderId.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-txt-muted capitalize">
              {order.orderType?.replace('_', ' ')} · {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600 tabular-nums">
              ${parseFloat(order.total).toFixed(2)}
            </p>
            {connected && (
              <span className="text-xs text-success flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live
              </span>
            )}
          </div>
        </div>

        {isCancelled && (
          <div className="bg-danger-bg border border-danger/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-danger">This order has been cancelled.</p>
          </div>
        )}

        {!isCancelled && (
          <div className="mt-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-bdr">
                <div
                  className="h-full bg-brand-600 transition-all duration-500"
                  style={{ width: `${Math.max(0, currentStep) / (STEPS.length - 1) * 100}%` }}
                />
              </div>

              {STEPS.filter((_, i) => isPickup ? i !== 3 : true).map((step, i) => {
                const Icon = step.icon;
                const isActive = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="relative flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-brand-600 text-txt-inverse ring-4 ring-brand-50'
                        : isActive
                        ? 'bg-brand-600 text-txt-inverse'
                        : 'bg-bg-alt text-txt-muted'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-brand-600' : 'text-txt-muted'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-bdr p-6 space-y-4">
        <h2 className="font-semibold text-txt">
          {isCancelled
            ? 'Order Cancelled'
            : isComplete
            ? 'Order Complete!'
            : isPickup
            ? "Your order is being prepared. We'll notify you when it's ready for pickup."
            : 'Your order is on its way!'}
        </h2>

        <div className="border-t border-bdr pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Subtotal</span>
            <span className="tabular-nums text-txt">${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Tax</span>
            <span className="tabular-nums text-txt">${parseFloat(order.taxTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-bdr pt-2 font-bold text-base">
            <span className="text-txt">Total</span>
            <span className="tabular-nums text-txt">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        <p className="text-xs text-txt-muted">Order ID: {orderId}</p>
      </div>
    </div>
  );
}
