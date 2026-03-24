'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { gqlAuth, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';
import {
  Zap, RotateCcw, MapPin, CreditCard, Clock, Plus, Loader2,
  CheckCircle, Star, ShoppingBag, ArrowRight,
} from 'lucide-react';

const LAST_ORDER_QUERY = `query($dispensaryId: ID!) {
  myLastOrder(dispensaryId: $dispensaryId) {
    orderId orderType orderStatus total taxTotal createdAt
    lineItems { productId variantId productName variantName quantity price }
    shippingAddress { street city state zip }
    paymentMethod
  }
}`;

const FAVORITES_QUERY = `query($dispensaryId: ID!) {
  myFavorites(dispensaryId: $dispensaryId, limit: 5) {
    productId productName variantId variantName price orderCount
  }
}`;

const CREATE_ORDER = `mutation($input: CreateOrderInput!) {
  createOrder(input: $input) { orderId dispensaryId orderStatus total taxTotal }
}`;

export default function ExpressCheckoutPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);

  const { data: lastOrder } = useQuery({
    queryKey: ['myLastOrder'],
    queryFn: () => gqlAuth<any>(LAST_ORDER_QUERY, { dispensaryId: DEFAULT_DISPENSARY_ID }),
    select: (d) => d.myLastOrder,
    enabled: !!token,
  });

  const { data: favorites } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: () => gqlAuth<any>(FAVORITES_QUERY, { dispensaryId: DEFAULT_DISPENSARY_ID }),
    select: (d) => d.myFavorites,
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Zap size={48} className="mx-auto text-brand-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Express Checkout</h1>
        <p className="text-gray-500 mb-6">Sign in to use express checkout</p>
        <Link href="/login?redirect=/express-checkout" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors">
          Sign In <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const toggleFavorite = (productId: string) => {
    setSelectedFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleReorder = async () => {
    if (!lastOrder?.lineItems) return;
    await placeOrder(
      lastOrder.lineItems.map((li: any) => ({
        productId: li.productId,
        variantId: li.variantId,
        quantity: li.quantity,
      })),
      lastOrder.orderType || 'pickup',
    );
  };

  const handleExpressOrder = async () => {
    if (!favorites || selectedFavorites.length === 0) return;
    const items = favorites
      .filter((f: any) => selectedFavorites.includes(f.productId))
      .map((f: any) => ({ productId: f.productId, variantId: f.variantId, quantity: 1 }));
    await placeOrder(items, lastOrder?.orderType || 'pickup');
  };

  const placeOrder = async (lineItems: any[], orderType: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await gqlAuth<any>(CREATE_ORDER, {
        input: { dispensaryId: DEFAULT_DISPENSARY_ID, orderType, lineItems },
      });
      const order = data.createOrder;
      if (!order) throw new Error('Failed to create order');
      router.push('/orders/' + order.orderId);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTime = lastOrder?.orderType === 'delivery' ? '45-60 min' : '~15 min';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={28} className="text-brand-600" />
        <h1 className="text-2xl font-bold text-gray-900">Express Checkout</h1>
      </div>

      <div className="space-y-6">
        {/* Last order reorder */}
        {lastOrder && (
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw size={18} className="text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reorder Last Order</h2>
            </div>
            <div className="space-y-2 mb-4">
              {lastOrder.lineItems?.map((li: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{li.productName} <span className="text-gray-400">x{li.quantity}</span></span>
                  <span className="tabular-nums font-medium">${Number(li.price * li.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${Number(lastOrder.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Saved info */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
              {lastOrder.shippingAddress && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400" />
                  {lastOrder.shippingAddress.street}, {lastOrder.shippingAddress.city}
                </div>
              )}
              {lastOrder.paymentMethod && (
                <div className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-gray-400" />
                  {lastOrder.paymentMethod}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                Est. {estimatedTime}
              </div>
            </div>

            <button
              onClick={handleReorder}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><RotateCcw size={18} /> Reorder Now</>}
            </button>
          </section>
        )}

        {/* Favorites quick-add */}
        {favorites && favorites.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star size={18} className="text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Your Favorites</h2>
            </div>
            <div className="space-y-2 mb-4">
              {favorites.map((f: any) => {
                const selected = selectedFavorites.includes(f.productId);
                return (
                  <button
                    key={f.productId}
                    onClick={() => toggleFavorite(f.productId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                      selected ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selected ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                      }`}>
                        {selected && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{f.productName}</p>
                        <p className="text-xs text-gray-500">{f.variantName} &middot; Ordered {f.orderCount}x</p>
                      </div>
                    </div>
                    <span className="tabular-nums font-semibold text-gray-900">${Number(f.price).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleExpressOrder}
              disabled={loading || selectedFavorites.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><ShoppingBag size={18} /> Quick Order ({selectedFavorites.length})</>}
            </button>
          </section>
        )}

        {/* No data fallback */}
        {!lastOrder && (!favorites || favorites.length === 0) && (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No order history yet. Place your first order to unlock express checkout!</p>
            <Link href="/products" className="text-brand-600 font-semibold hover:underline">Browse Menu</Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>
        )}
      </div>
    </div>
  );
}
