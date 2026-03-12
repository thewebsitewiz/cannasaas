'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { useDeliveryCheck, useTimeSlots, useDeliveryZones } from '@/hooks/useDelivery';
import { Truck, Store, Clock, CheckCircle, AlertCircle, DollarSign, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState({ lat: 0, lng: 0, text: '' });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const { data: deliveryCheck } = useDeliveryCheck(
    fulfillmentType === 'delivery' ? address.lat : undefined,
    fulfillmentType === 'delivery' ? address.lng : undefined,
    subtotal,
  );

  const { data: zones } = useDeliveryZones();
  const { data: slots } = useTimeSlots(fulfillmentType, selectedDate);

  const taxRate = 0.22;
  const deliveryFee = deliveryCheck?.zone?.deliveryFee ?? 0;
  const cashDiscountRate = paymentMethod === 'cash' ? 0.07 : 0;
  const cashDiscount = subtotal * cashDiscountRate;
  const tax = (subtotal - cashDiscount) * taxRate;
  const total = subtotal - cashDiscount + tax + (fulfillmentType === 'delivery' ? deliveryFee : 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Nothing to checkout</h1>
        <Link href="/products" className="text-brand-600 font-medium hover:text-brand-700">Back to menu</Link>
      </div>
    );
  }

  const handleAddressCheck = () => {
    setAddress({ lat: 41.0226, lng: -73.9471, text: '123 Main St, Tappan, NY 10983' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
        <div className="space-y-6">
          {/* Fulfillment Type */}
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How would you like to get your order?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFulfillmentType('pickup')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  fulfillmentType === 'pickup' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Store size={20} className={fulfillmentType === 'pickup' ? 'text-brand-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-medium text-sm">Pickup</p>
                  <p className="text-xs text-gray-500">Free — ready in 15-30 min</p>
                </div>
              </button>
              <button
                onClick={() => setFulfillmentType('delivery')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  fulfillmentType === 'delivery' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Truck size={20} className={fulfillmentType === 'delivery' ? 'text-brand-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-medium text-sm">Delivery</p>
                  <p className="text-xs text-gray-500">From $0 — 20-60 min</p>
                </div>
              </button>
            </div>
          </section>

          {/* Delivery Address */}
          {fulfillmentType === 'delivery' && (
            <section className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your address"
                  value={address.text}
                  onChange={(e) => setAddress((a) => ({ ...a, text: e.target.value }))}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-500"
                />
                <button
                  onClick={handleAddressCheck}
                  className="bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-brand-700"
                >
                  Check
                </button>
              </div>

              {deliveryCheck && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${deliveryCheck.eligible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {deliveryCheck.eligible ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Delivery available</p>
                        <p className="text-xs mt-0.5">
                          {deliveryCheck.zone?.name} — {deliveryCheck.distance?.toFixed(1)} mi away
                          {deliveryCheck.zone?.deliveryFee > 0
                            ? ` — $${deliveryCheck.zone.deliveryFee.toFixed(2)} fee`
                            : ' — Free delivery'}
                        </p>
                        <p className="text-xs">{deliveryCheck.zone?.estimatedMinutesMin}-{deliveryCheck.zone?.estimatedMinutesMax} min estimated</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <p>{deliveryCheck.reason}</p>
                    </div>
                  )}
                </div>
              )}

              {zones && zones.length > 0 && (
                <div className="mt-3 text-xs text-gray-400">
                  Delivery zones: {zones.map((z: any) => `${z.name} (${z.radiusMiles} mi)`).join(', ')}
                </div>
              )}
            </section>
          )}

          {/* Time Slot */}
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} /> Schedule {fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
            </h2>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm mb-3 outline-none focus:border-brand-500"
            />

            {slots && slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot: any) => (
                  <button
                    key={slot.slotId}
                    onClick={() => setSelectedSlot(slot.slotId)}
                    className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                      selectedSlot === slot.slotId
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium">{slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</p>
                    <p className="text-xs text-gray-400">{slot.spotsRemaining} spots left</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No slots available for this date</p>
            )}
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign size={18} className={paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-medium text-sm">Cash</p>
                  {cashDiscountRate > 0 && <p className="text-xs text-green-600">Save {(cashDiscountRate * 100).toFixed(0)}%</p>}
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard size={18} className={paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'} />
                <div className="text-left">
                  <p className="font-medium text-sm">Card</p>
                  <p className="text-xs text-gray-400">Debit/Credit</p>
                </div>
              </button>
            </div>
            {paymentMethod === 'cash' && fulfillmentType === 'delivery' && (
              <p className="text-xs text-green-600 mt-2">Cash on delivery — have exact change ready for your driver</p>
            )}
          </section>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 lg:mt-0 h-fit lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-gray-600 truncate mr-2">{item.name} x{item.quantity}</span>
                <span className="tabular-nums shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
              {cashDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cash discount ({(cashDiscountRate * 100).toFixed(0)}%)</span>
                  <span className="tabular-nums">-${cashDiscount.toFixed(2)}</span>
                </div>
              )}
              {fulfillmentType === 'delivery' && deliveryFee > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="tabular-nums">${deliveryFee.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="tabular-nums">${tax.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
              <span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span>
            </div>
          </div>
          <button className="mt-6 w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors">
            {paymentMethod === 'cash' && fulfillmentType === 'delivery' ? 'Place Order (Cash on Delivery)' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
