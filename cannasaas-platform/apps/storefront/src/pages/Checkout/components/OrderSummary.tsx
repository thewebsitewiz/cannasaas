// apps/storefront/src/pages/Checkout/components/OrderSummary.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { formatCurrency } from '@cannasaas/utils';

interface OrderSummaryProps {
  items: Array<{ id: string; productName: string; variantName: string; quantity: number; totalPrice: number }>;
  subtotal: number;
  promoDiscount: number;
  fulfillmentType: 'pickup' | 'delivery';
}

export function OrderSummary({ items, subtotal, promoDiscount, fulfillmentType }: OrderSummaryProps) {
  const deliveryFee = fulfillmentType === 'delivery' ? 5 : 0;
  const total = subtotal - promoDiscount + deliveryFee;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6">
      <h2 className="font-bold text-[var(--color-text)] mb-4">Order Summary</h2>
      <ul className="space-y-2 mb-4">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between text-[var(--p-text-sm)]">
            <span className="text-[var(--color-text-secondary)]">{item.productName} × {item.quantity}</span>
            <span>{formatCurrency(item.totalPrice)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
        <div className="flex justify-between text-[var(--p-text-sm)]">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-[var(--p-text-sm)] text-[var(--color-success)]">
            <span>Discount</span><span>−{formatCurrency(promoDiscount)}</span>
          </div>
        )}
        {fulfillmentType === 'delivery' && (
          <div className="flex justify-between text-[var(--p-text-sm)]">
            <span className="text-[var(--color-text-secondary)]">Delivery fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[var(--color-text)] pt-2 border-t border-[var(--color-border)]">
          <span>Total</span><span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
