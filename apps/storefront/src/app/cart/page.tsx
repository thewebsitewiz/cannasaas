'use client';

import Link from 'next/link';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-txt-faint mb-4" />
        <h1 className="text-2xl font-bold text-txt mb-2">Your cart is empty</h1>
        <p className="text-txt-muted mb-6">Browse our menu and add some products</p>
        <Link href="/products" className="inline-block bg-brand-600 text-txt-inverse px-6 py-3 rounded-lg font-semibold hover:bg-brand-500 transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-txt mb-6">Shopping Cart ({itemCount} items)</h1>

      <div className="lg:grid lg:grid-cols-[1fr_18rem] lg:gap-8">
        <div className="space-y-3">
          {items.map((item: CartItem) => (
            <div key={`${item.productId}-${item.variantId}`} className="bg-surface rounded-xl border border-bdr p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-bg-alt rounded-lg flex items-center justify-center text-txt-muted text-xs shrink-0">
                IMG
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-txt truncate">{item.name}</p>
                <p className="text-sm text-txt-muted">{item.variantName}</p>
                {item.strainType && <span className="text-xs text-txt-faint capitalize">{item.strainType}</span>}
              </div>
              <div className="flex items-center gap-1 border border-bdr rounded-lg">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-surface-hover rounded-l-lg transition-colors"><Minus size={14} className="text-txt-muted" /></button>
                <span className="px-2 text-sm font-medium tabular-nums w-8 text-center text-txt">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-surface-hover rounded-r-lg transition-colors"><Plus size={14} className="text-txt-muted" /></button>
              </div>
              <p className="text-sm font-bold tabular-nums w-16 text-right text-txt">${(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.productId)} className="p-1.5 text-txt-muted hover:text-danger transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <aside className="mt-6 lg:mt-0">
          <div className="bg-surface rounded-xl border border-bdr p-6 sticky top-24">
            <h2 className="font-semibold text-txt mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-txt-secondary">Subtotal</span>
                <span className="tabular-nums font-medium text-txt">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-secondary">Tax</span>
                <span className="text-txt-muted">Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-bdr mt-4 pt-4 flex justify-between text-lg font-bold">
              <span className="text-txt">Subtotal</span>
              <span className="tabular-nums text-txt">${subtotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-600 text-txt-inverse py-3 rounded-lg font-semibold hover:bg-brand-500 transition-colors">
              Checkout <ArrowRight size={18} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
