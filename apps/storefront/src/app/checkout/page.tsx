'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import {
  Store,
  Truck,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const CREATE_ORDER = `mutation($input: CreateOrderInput!) {
  createOrder(input: $input) {
    orderId dispensaryId orderStatus subtotal taxTotal total
    taxBreakdown { label ratePercent amount }
    lineItemCount createdAt
  }
}`;

// ── Main Checkout Page ──────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const token = useAuthStore((s) => s.token);

  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const taxEstimate = subtotal * 0.22;
  const totalEstimate =
    subtotal + taxEstimate + (orderType === 'delivery' ? 5 : 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-txt mb-2">
          Nothing to checkout
        </h1>
        <Link href="/products" className="text-brand-600 font-medium">
          Back to menu
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const input = {
        dispensaryId: DEFAULT_DISPENSARY_ID,
        orderType,
        lineItems: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };

      const data = await gqlAuth<{
        createOrder: { orderId: string; total: string } | null;
      }>(CREATE_ORDER, { input });
      const order = data.createOrder;
      if (!order) throw new Error('Failed to create order');

      clearCart();
      router.push(`/orders/${order.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setLoading(false);
    }
  };

  // ── Order Details Step ────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-txt mb-8">Checkout</h1>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="space-y-6">
          {/* Auth check */}
          {!token && (
            <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-warning shrink-0" />
              <div>
                <p className="text-sm text-txt font-medium">
                  Please log in to complete your order
                </p>
                <Link
                  href="/login?redirect=/checkout"
                  className="text-sm text-brand-600 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Fulfillment */}
          <section className="bg-surface rounded-xl border border-bdr p-6">
            <h2 className="text-lg font-semibold text-txt mb-4">Fulfillment</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType('pickup')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  orderType === 'pickup'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-bdr'
                }`}
              >
                <Store
                  size={20}
                  className={
                    orderType === 'pickup' ? 'text-brand-600' : 'text-txt-muted'
                  }
                />
                <div className="text-left">
                  <p className="font-medium text-txt">Pickup</p>
                  <p className="text-xs text-txt-muted">Ready in ~15 min</p>
                </div>
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  orderType === 'delivery'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-bdr'
                }`}
              >
                <Truck
                  size={20}
                  className={
                    orderType === 'delivery'
                      ? 'text-brand-600'
                      : 'text-txt-muted'
                  }
                />
                <div className="text-left">
                  <p className="font-medium text-txt">Delivery</p>
                  <p className="text-xs text-txt-muted">45-60 min</p>
                </div>
              </button>
            </div>
          </section>

          {/* Payment Method — cash only until cannabis-friendly processor lands */}
          <section className="bg-surface rounded-xl border border-bdr p-6">
            <h2 className="text-lg font-semibold text-txt mb-4">
              Payment Method
            </h2>
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-brand-600 bg-brand-50">
              <DollarSign size={20} className="text-brand-600" />
              <div className="text-left">
                <p className="font-medium text-txt">Cash</p>
                <p className="text-xs text-txt-muted">Pay at pickup/delivery</p>
              </div>
            </div>
          </section>

          {/* Order items */}
          <section className="bg-surface rounded-xl border border-bdr p-6">
            <h2 className="text-lg font-semibold text-txt mb-4">Order Items</h2>
            <div className="space-y-2">
              {items.map((i) => (
                <div
                  key={`${i.productId}-${i.variantId}`}
                  className="flex justify-between text-sm py-1.5"
                >
                  <span className="text-txt">
                    {i.name}
                    {i.variantName && (
                      <span className="text-txt-muted"> · {i.variantName}</span>
                    )}
                    <span className="text-txt-muted"> × {i.quantity}</span>
                  </span>
                  <span className="tabular-nums font-medium text-txt">
                    ${(i.price * i.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary sidebar */}
        <aside className="mt-6 lg:mt-0">
          <div className="bg-surface rounded-xl border border-bdr p-6 sticky top-24">
            <h2 className="font-semibold text-txt mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-txt-secondary">Subtotal</span>
                <span className="tabular-nums text-txt">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Est. Tax</span>
                <span className="tabular-nums text-txt">
                  ${taxEstimate.toFixed(2)}
                </span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Delivery</span>
                  <span className="tabular-nums text-txt">$5.00</span>
                </div>
              )}
              <p className="text-xs text-txt-muted pt-1">
                Final tax calculated at checkout by state
              </p>
            </div>
            <div className="border-t border-bdr mt-4 pt-4 flex justify-between text-lg font-bold">
              <span className="text-txt">Total</span>
              <span className="tabular-nums text-txt">
                ${totalEstimate.toFixed(2)}
              </span>
            </div>

            {error && (
              <div className="mt-3 bg-danger-bg border border-danger/20 text-danger text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                void handlePlaceOrder();
              }}
              disabled={loading || !token}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-600 text-txt-inverse py-3 rounded-lg font-semibold hover:bg-brand-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Place Order
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
