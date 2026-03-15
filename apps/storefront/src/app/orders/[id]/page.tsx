'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { Package, Clock, CheckCircle, Truck, MapPin, ArrowLeft } from 'lucide-react';

const ORDER_QUERY = `query($id: ID!) {
  order(orderId: $id) {
    orderId orderStatus orderType total taxTotal createdAt
  }
}`;

const STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Clock },
  { key: 'out_for_delivery', label: 'On the way', icon: Truck },
  { key: 'completed', label: 'Completed', icon: MapPin },
];

const STEP_INDEX: Record<string, number> = { confirmed: 0, preparing: 1, ready: 2, out_for_delivery: 3, delivered: 4, completed: 4, picked_up: 4 };

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lastUpdate, subscribeToOrder, connected } = useOrderSocket();

  useEffect(() => {
    if (orderId) {
      gqlAuth<any>(ORDER_QUERY, { id: orderId })
        .then((d) => { if (d.order) setOrder(d.order); })
        .catch(() => {})
        .finally(() => setLoading(false));

      subscribeToOrder(orderId);
    }
  }, [orderId]);

  // Live updates via WebSocket
  useEffect(() => {
    if (lastUpdate && lastUpdate.orderId === orderId) {
      setOrder((prev: any) => prev ? { ...prev, orderStatus: lastUpdate.status } : prev);
    }
  }, [lastUpdate, orderId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><h1 className="text-xl font-bold text-gray-900">Order not found</h1></div>;

  const currentStep = STEP_INDEX[order.orderStatus] ?? 0;
  const isPickup = order.orderType === 'pickup';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/account" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{orderId.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-gray-500 capitalize">{order.orderType} · {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-700">${parseFloat(order.total).toFixed(2)}</p>
            {connected && <span className="text-xs text-green-600 flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live</span>}
          </div>
        </div>

        {/* Progress tracker */}
        <div className="mt-8">
          <div className="flex items-center justify-between relative">
            {/* Progress bar */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div className="h-full bg-brand-600 transition-all duration-500" style={{ width: (currentStep / (STEPS.length - 1) * 100) + '%' }} />
            </div>

            {STEPS.filter((_, i) => isPickup ? i !== 3 : true).map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.key} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCurrent ? 'bg-brand-600 text-white ring-4 ring-brand-100' : isActive ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isActive ? 'text-brand-700' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">
          {order.orderStatus === 'completed' || order.orderStatus === 'picked_up' || order.orderStatus === 'delivered'
            ? 'Order Complete!'
            : isPickup ? 'Your order is being prepared. We\'ll notify you when it\'s ready for pickup.'
            : 'Your order is on its way!'}
        </h2>
        <p className="text-sm text-gray-500">Order ID: {orderId}</p>
      </div>
    </div>
  );
}
