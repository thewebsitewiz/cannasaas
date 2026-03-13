// === CartPage.tsx ===
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cart.store';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCartStore();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <ShoppingCart size={64} className="text-gray-300 mb-4" />
        <p className="text-xl text-gray-400 mb-6">Your cart is empty</p>
        <button onClick={() => navigate('/')} className="bg-brand-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-brand-700">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.variantId} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
              <p className="text-sm text-gray-500">{item.variantName} · ${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl">
              <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-3"><Minus size={18} /></button>
              <span className="px-2 text-lg font-bold tabular-nums">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-3"><Plus size={18} /></button>
            </div>
            <p className="text-lg font-bold tabular-nums w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={() => removeItem(item.variantId)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex justify-between text-xl font-bold">
          <span>Subtotal</span>
          <span className="tabular-nums">${total.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">Tax calculated at checkout</p>
        <button onClick={() => navigate('/checkout')}
          className="w-full mt-4 bg-brand-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2">
          Checkout <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
