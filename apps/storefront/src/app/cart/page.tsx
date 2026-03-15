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
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Browse our menu and add some products</p>
        <Link href="/products" className="inline-block bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({itemCount} items)</h1>

      <div className="lg:grid lg:grid-cols-[1fr_18rem] lg:gap-8">
        <div className="space-y-3">
          {items.map((item: CartItem) => (
            <div key={item.variantId} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs shrink-0">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : 'IMG'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-500">{item.variantName}</p>
                {item.strainType && <span className="text-xs text-gray-400 capitalize">{item.strainType}</span>}
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-gray-50"><Minus size={14} /></button>
                <span className="px-2 text-sm font-medium tabular-nums w-8 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-gray-50"><Plus size={14} /></button>
              </div>
              <p className="text-sm font-bold tabular-nums w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.productId)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <aside className="mt-6 lg:mt-0">
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="tabular-nums font-medium">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-400">Calculated at checkout</span></div>
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between text-lg font-bold">
              <span>Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors">
              Checkout <ArrowRight size={18} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
