import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cart.store';
import { gql, DISPENSARY_ID } from '../lib/graphql';
import { Check, Loader2 } from 'lucide-react';

const CREATE_ORDER = `mutation($input: CreateOrderInput!) { createOrder(input: $input) { orderId dispensaryId orderStatus total taxTotal } }`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const total = subtotal();

  const handleOrder = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true);
    setError('');
    try {
      const input = {
        dispensaryId: DISPENSARY_ID,
        orderType: 'pickup',
        notes: 'Kiosk order for: ' + name.trim(),
        lineItems: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      };
      const data = await gql<any>(CREATE_ORDER, { input });
      if (data.createOrder) {
        clearCart();
        navigate('/confirm/' + data.createOrder.orderId);
      } else {
        setError('Order failed — please try again');
      }
    } catch (err: any) {
      setError(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
        {items.map((i) => (
          <div key={i.variantId} className="flex justify-between py-2 text-sm">
            <span>{i.name} x {i.quantity}</span>
            <span className="tabular-nums font-medium">${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">${total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">+ tax · Pay at counter</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name (for pickup)</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name"
          className="w-full px-4 py-4 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          autoFocus />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}

      <button onClick={handleOrder} disabled={loading}
        className="w-full bg-brand-600 text-white text-lg font-bold py-5 rounded-xl hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 size={22} className="animate-spin" /> Placing Order...</> : <><Check size={22} /> Place Order</>}
      </button>
    </div>
  );
}
