// apps/storefront/src/pages/Cart/CartPage.tsx
// STUB — Section 7.8 not defined in doc
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@cannasaas/stores';
import { Button } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';

export default function CartPage() {
  const { items, subtotal, clearCart } = useCartStore();
  return (
    <>
      <Helmet><title>Your Cart | CannaSaas</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-8 flex items-center gap-3">
          <ShoppingCart aria-hidden="true" /> Your Cart
        </h1>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-secondary)] mb-6">Your cart is empty.</p>
            <Button variant="primary" size="lg" as={Link} to="/products">Browse Products</Button>
          </div>
        ) : (
          <>
            <ul className="space-y-4 mb-8">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)]">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{item.productName}</p>
                    <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">{item.variantName} × {item.quantity}</p>
                  </div>
                  <span className="font-bold text-[var(--color-text)]">{formatCurrency(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[var(--color-text)]">Subtotal</span>
              <span className="font-bold text-[var(--p-text-xl)] text-[var(--color-text)]">{formatCurrency(subtotal())}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
              <Button variant="primary" size="lg" as={Link} to="/checkout" fullWidth>Proceed to Checkout</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
