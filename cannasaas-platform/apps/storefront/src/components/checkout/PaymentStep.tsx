/**
 * @file PaymentStep.tsx
 * @app apps/storefront
 *
 * Checkout Step 2 — Payment method selection.
 *
 * Payment options:
 *   A. Card — Stripe Elements (CardElement from @stripe/react-stripe-js)
 *   B. Cash — Pay at pickup / on delivery
 *
 * Note: Stripe Elements integration requires:
 *   - @stripe/stripe-js loaded via StripeProvider in app root
 *   - VITE_STRIPE_PUBLISHABLE_KEY env var
 *
 * This component renders the payment UI. The actual payment intent
 * is created in Checkout.tsx on final submit (POST /payments).
 *
 * Accessibility:
 *   - Payment method radio group: role="radiogroup" (WCAG 1.3.1)
 *   - Card errors from Stripe: role="alert" aria-live="assertive"
 *   - "Back" button allows returning to step 1 (WCAG 2.1.1)
 */

import { useState } from 'react';

type PaymentMethod = 'card' | 'cash';

interface PaymentStepProps {
  onBack: () => void;
  onSubmit: (paymentMethod: PaymentMethod) => void;
  isProcessing?: boolean;
}

export function PaymentStep({ onBack, onSubmit, isProcessing = false }: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card' && cardError) return;
    onSubmit(paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Payment information">
      {/* Payment method selection */}
      <fieldset>
        <legend className="text-base font-bold text-stone-900 mb-4">
          Payment Method
        </legend>

        <div
          role="radiogroup"
          aria-labelledby="payment-legend"
          className="space-y-3"
        >
          {[
            {
              value: 'card' as const,
              icon: '💳',
              label: 'Credit or Debit Card',
              description: 'Visa, Mastercard, Amex accepted',
            },
            {
              value: 'cash' as const,
              icon: '💵',
              label: 'Cash',
              description: 'Pay at pickup or on delivery',
            },
          ].map((opt) => (
            <label
              key={opt.value}
              className={[
                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer',
                'transition-all',
                paymentMethod === opt.value
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)]'
                  : 'border-stone-200 hover:border-stone-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={opt.value}
                checked={paymentMethod === opt.value}
                onChange={() => setPaymentMethod(opt.value)}
                className="w-4 h-4 text-[hsl(var(--primary))] border-stone-300 focus:ring-[hsl(var(--primary)/0.3)]"
              />
              <span className="text-xl" aria-hidden="true">{opt.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-900">{opt.label}</p>
                <p className="text-xs text-stone-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Stripe Card Element placeholder */}
      {paymentMethod === 'card' && (
        <div className="mt-5 space-y-4">
          {/*
           * INTEGRATION NOTE:
           * Replace this placeholder with actual Stripe Elements:
           *
           *   import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
           *
           *   <CardElement
           *     options={{ style: { base: { fontSize: '14px' } } }}
           *     onChange={(e) => setCardError(e.error?.message ?? null)}
           *   />
           *
           * Wrap the page in <Elements stripe={stripePromise}> in App.tsx.
           * stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
           */}
          <div className="p-4 border border-stone-200 rounded-xl bg-stone-50">
            <p className="text-sm text-stone-500 text-center">
              🔒 Secure card entry via Stripe
              <br />
              <span className="text-xs">(Stripe Elements component goes here)</span>
            </p>
          </div>

          {/* Card validation error */}
          {cardError && (
            <p role="alert" aria-live="assertive" className="text-xs text-red-600">
              {cardError}
            </p>
          )}

          <p className="text-[11px] text-stone-400 flex items-center gap-1">
            <span aria-hidden="true">🔒</span>
            Your payment is encrypted and processed securely by Stripe. We never store your card details.
          </p>
        </div>
      )}

      {/* Cash notice */}
      {paymentMethod === 'cash' && (
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium mb-1">Cash Payment</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Please have exact change ready. Your order will be reserved for 30 minutes.
            Cash payment is collected at the point of sale.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to fulfillment options"
          className={[
            'flex-1 py-3 rounded-xl font-medium text-sm',
            'border border-stone-200 text-stone-700',
            'hover:bg-stone-50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
          ].join(' ')}
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          aria-busy={isProcessing}
          className={[
            'flex-[2] py-3 rounded-xl font-semibold text-sm text-white',
            'bg-[hsl(var(--primary))] hover:brightness-110',
            'disabled:opacity-70 disabled:cursor-wait',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            'transition-all active:scale-[0.99]',
            'shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          ].join(' ')}
        >
          {isProcessing ? 'Processing…' : 'Review Order →'}
        </button>
      </div>
    </form>
  );
}
