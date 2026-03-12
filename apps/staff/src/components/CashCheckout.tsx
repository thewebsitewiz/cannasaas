import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { DollarSign, CreditCard, CheckCircle, Calculator } from 'lucide-react';

const PREVIEW_DISCOUNT = `query($id: ID!, $subtotal: Float!) { previewCashDiscount(dispensaryId: $id, subtotal: $subtotal) { discountPercent discountAmount adjustedSubtotal } }`;
const PROCESS_CASH = `mutation($orderId: ID!, $dispId: ID!, $tendered: Float!, $apply: Boolean) { processCashPayment(orderId: $orderId, dispensaryId: $dispId, cashTendered: $tendered, applyDiscount: $apply) { paymentId method amount cashTendered changeGiven status } }`;
const COMPLETE_ORDER = `mutation($orderId: ID!, $dispId: ID!) { completeOrder(input: { orderId: $orderId, dispensaryId: $dispId }) }`;

interface CashCheckoutProps {
  orderId: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  onComplete?: () => void;
}

export function CashCheckout({ orderId, subtotal, taxTotal, total, onComplete }: CashCheckoutProps) {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [result, setResult] = useState<any>(null);

  const { data: discount } = useQuery({
    queryKey: ['cashPreview', dispensaryId, subtotal],
    queryFn: () => gqlRequest<{ previewCashDiscount: any }>(PREVIEW_DISCOUNT, { id: dispensaryId, subtotal }),
    select: (d) => d.previewCashDiscount,
    enabled: !!dispensaryId && paymentMethod === 'cash',
  });

  const adjustedTotal = applyDiscount && discount
    ? parseFloat((subtotal - discount.discountAmount + taxTotal).toFixed(2))
    : total;

  const tendered = parseFloat(cashTendered) || 0;
  const change = tendered - adjustedTotal;

  const completeMutation = useMutation({
    mutationFn: () => gqlRequest(COMPLETE_ORDER, { orderId, dispId: dispensaryId }),
  });

  const cashMutation = useMutation({
    mutationFn: () => gqlRequest<{ processCashPayment: any }>(PROCESS_CASH, {
      orderId, dispId: dispensaryId, tendered, apply: applyDiscount,
    }),
    onSuccess: (data) => {
      setResult(data.processCashPayment);
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['staffDashboard'] });
    },
  });

  const handleProcessPayment = async () => {
    // Complete order first, then process payment
    await completeMutation.mutateAsync();
    await cashMutation.mutateAsync();
  };

  const QUICK_AMOUNTS = [20, 40, 50, 60, 80, 100];

  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle size={48} className="mx-auto text-green-600 mb-3" />
        <h3 className="text-lg font-bold text-green-800">Payment Complete</h3>
        <div className="mt-4 space-y-1 text-sm">
          <p className="text-green-700">Amount: <span className="font-bold">${result.amount.toFixed(2)}</span></p>
          <p className="text-green-700">Tendered: <span className="font-bold">${result.cashTendered.toFixed(2)}</span></p>
          <p className="text-2xl font-bold text-green-900 mt-2">Change: ${result.changeGiven.toFixed(2)}</p>
        </div>
        <button onClick={onComplete} className="mt-4 bg-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-700">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>

      {/* Payment Method Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPaymentMethod('cash')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
            paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'
          }`}
        >
          <DollarSign size={18} /> Cash
        </button>
        <button
          onClick={() => setPaymentMethod('card')}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
            paymentMethod === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
          }`}
        >
          <CreditCard size={18} /> Card
        </button>
      </div>

      {paymentMethod === 'cash' && (
        <>
          {/* Cash Discount */}
          {discount && discount.discountPercent > 0 && (
            <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
                className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Apply {discount.discountPercent}% cash discount
                </p>
                <p className="text-xs text-green-600">Save ${discount.discountAmount.toFixed(2)}</p>
              </div>
              <span className="text-lg font-bold text-green-700">-${discount.discountAmount.toFixed(2)}</span>
            </label>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {applyDiscount && discount && discount.discountAmount > 0 && (
              <div className="flex justify-between text-green-600"><span>Cash discount ({discount.discountPercent}%)</span><span>-${discount.discountAmount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
              <span>Total</span><span>${adjustedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Cash Tendered</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashTendered(amt.toString())}
                  className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                    cashTendered === amt.toString()
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="Custom amount"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-lg font-bold tabular-nums outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Change Display */}
          {tendered > 0 && (
            <div className={`rounded-lg p-4 text-center ${change >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-sm text-gray-500">Change Due</p>
              <p className={`text-3xl font-bold tabular-nums ${change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${change >= 0 ? change.toFixed(2) : 'Insufficient'}
              </p>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcessPayment}
            disabled={tendered < adjustedTotal || cashMutation.isPending}
            className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Calculator size={20} />
            {cashMutation.isPending ? 'Processing...' : `Complete — $${adjustedTotal.toFixed(2)}`}
          </button>
        </>
      )}

      {paymentMethod === 'card' && (
        <div className="text-center py-8 text-gray-400">
          <CreditCard size={32} className="mx-auto mb-2" />
          <p>Card terminal integration coming soon</p>
          <p className="text-sm">Use cash payment for now</p>
        </div>
      )}
    </div>
  );
}
