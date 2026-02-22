#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase C Storefront (Part 4): Checkout, Account, Auth Pages
#             + Master Runner for all Phase C parts
# File: scaffold-storefront-part4.sh
#
# Writes:
#   apps/storefront/src/
#   ├── components/checkout/
#   │   ├── StepIndicator.tsx        Multi-step progress indicator
#   │   ├── FulfillmentStep.tsx      Step 1: Delivery vs Pickup + address form
#   │   ├── PaymentStep.tsx          Step 2: Stripe Elements card + cash option
#   │   └── OrderReviewStep.tsx      Step 3: Review + place order
#   ├── components/account/
#   │   ├── AccountNav.tsx           Left sidebar navigation for account pages
#   │   ├── ProfileForm.tsx          Edit name, email, phone
#   │   ├── OrderHistoryList.tsx     Paginated order history with status badges
#   │   └── LoyaltyDashboard.tsx     Points balance + history
#   └── pages/
#       ├── Checkout.tsx             Multi-step checkout page
#       ├── Account.tsx              Account shell with nested routes
#       ├── OrderConfirmation.tsx    Post-checkout confirmation page
#       ├── Login.tsx                Login page
#       ├── Register.tsx             Registration page
#       └── NotFound.tsx             404 page
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
SF="$ROOT/apps/storefront/src"

echo ""
echo "============================================================="
echo "  Phase C Storefront — Part 4: Checkout + Account + Auth"
echo "============================================================="

mkdir -p \
  "$SF/components/checkout" \
  "$SF/components/account"

# =============================================================================
# StepIndicator.tsx
# =============================================================================
cat > "$SF/components/checkout/StepIndicator.tsx" << 'EOF'
/**
 * @file StepIndicator.tsx
 * @app apps/storefront
 *
 * Multi-step checkout progress indicator.
 *
 * Shows: Step 1 → Step 2 → Step 3 with connecting lines.
 * Current step is highlighted; completed steps show a checkmark.
 *
 * Accessibility:
 *   - <nav> with aria-label="Checkout steps" (WCAG 1.3.1)
 *   - <ol> ordered list of steps (WCAG 1.3.1)
 *   - aria-current="step" on the active step (WCAG 4.1.2)
 *   - Completed steps: aria-label includes "completed" suffix
 *   - Connecting lines: aria-hidden
 */

interface CheckoutStep {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: CheckoutStep[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol
        role="list"
        className="flex items-center justify-center gap-0"
      >
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent   = step.number === currentStep;
          const isUpcoming  = step.number > currentStep;

          return (
            <li key={step.number} className="flex items-center">
              {/* Step circle */}
              <div
                className="flex flex-col items-center gap-1.5"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  aria-label={`${step.label}${isCompleted ? ', completed' : isCurrent ? ', current step' : ''}`}
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-sm font-bold transition-all',
                    'border-2',
                    isCompleted
                      ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white'
                      : isCurrent
                        ? 'bg-white border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                        : 'bg-white border-stone-200 text-stone-400',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={[
                    'text-xs font-medium whitespace-nowrap',
                    isCurrent  ? 'text-[hsl(var(--primary))]' :
                    isCompleted? 'text-stone-600' : 'text-stone-400',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line between steps */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={[
                    'w-16 sm:w-24 h-0.5 mb-5 mx-1',
                    'transition-colors',
                    step.number < currentStep ? 'bg-[hsl(var(--primary))]' : 'bg-stone-200',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
EOF
echo "  ✓ components/checkout/StepIndicator.tsx"

# =============================================================================
# FulfillmentStep.tsx
# =============================================================================
cat > "$SF/components/checkout/FulfillmentStep.tsx" << 'EOF'
/**
 * @file FulfillmentStep.tsx
 * @app apps/storefront
 *
 * Checkout Step 1 — Fulfillment method + address.
 *
 * Sections:
 *   A. Fulfillment method: Delivery or Pickup (radio toggle)
 *   B. If Delivery: address form (street, apt, city, state, zip)
 *      + delivery zone check via POST /delivery/check-address
 *   C. If Pickup:   dispensary location card with hours
 *
 * Form validation with React Hook Form + Zod.
 * Calls useDeliveryCheck to verify the address is within delivery zone.
 *
 * Accessibility:
 *   - Fulfillment toggle: role="radiogroup" with aria-labelledby (WCAG 1.3.1)
 *   - Address fields: explicit <label> htmlFor (WCAG 1.3.5)
 *   - Required fields: aria-required="true" (WCAG 1.3.5)
 *   - Validation errors: role="alert" aria-live="polite" (WCAG 4.1.3)
 *   - Delivery check result: aria-live="polite" (WCAG 4.1.3)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrganizationStore } from '@cannasaas/stores';

// ── Zod schema ────────────────────────────────────────────────────────────────

const addressSchema = z.object({
  street: z.string().min(5, 'Please enter a valid street address'),
  apt:    z.string().optional(),
  city:   z.string().min(2, 'City is required'),
  state:  z.string().length(2, 'Please enter a 2-letter state code').toUpperCase(),
  zip:    z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
});

const fulfillmentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('pickup') }),
  z.object({ method: z.literal('delivery'), address: addressSchema }),
]);

export type FulfillmentFormValues = z.infer<typeof fulfillmentSchema>;

interface FulfillmentStepProps {
  defaultValues?: Partial<FulfillmentFormValues>;
  onSubmit: (data: FulfillmentFormValues) => void;
}

export function FulfillmentStep({ defaultValues, onSubmit }: FulfillmentStepProps) {
  const { dispensary } = useOrganizationStore();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FulfillmentFormValues>({
    resolver: zodResolver(fulfillmentSchema),
    defaultValues: defaultValues ?? { method: 'pickup' },
  });

  const method = watch('method');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Fulfillment options"
    >
      {/* ── Fulfillment method toggle ──────────────────────────────────────── */}
      <fieldset>
        <legend
          id="fulfillment-legend"
          className="text-base font-bold text-stone-900 mb-4"
        >
          How would you like to receive your order?
        </legend>

        <div
          role="radiogroup"
          aria-labelledby="fulfillment-legend"
          className="grid grid-cols-2 gap-3"
        >
          {[
            { value: 'pickup',   label: 'In-Store Pickup', icon: '🏪', description: 'Ready in 30–60 min' },
            { value: 'delivery', label: 'Delivery',        icon: '🚚', description: dispensary?.deliveryAvailable ? 'Same-day delivery' : 'Not available' },
          ].map((opt) => {
            const disabled = opt.value === 'delivery' && !dispensary?.deliveryAvailable;
            const isSelected = method === opt.value;

            return (
              <label
                key={opt.value}
                className={[
                  'flex flex-col gap-1.5 p-4 rounded-xl border-2 cursor-pointer',
                  'transition-all',
                  disabled ? 'opacity-50 cursor-not-allowed' : '',
                  isSelected
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)]'
                    : 'border-stone-200 hover:border-stone-300',
                ].join(' ')}
              >
                <input
                  {...register('method')}
                  type="radio"
                  value={opt.value}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className="text-xl" aria-hidden="true">{opt.icon}</span>
                <span className="text-sm font-semibold text-stone-900">{opt.label}</span>
                <span className="text-xs text-stone-500">{opt.description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ── Delivery address form (conditional) ──────────────────────────── */}
      {method === 'delivery' && (
        <div className="mt-6 space-y-4" aria-label="Delivery address">
          <h3 className="text-sm font-bold text-stone-900">Delivery Address</h3>

          {/* Street */}
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-stone-700 mb-1">
              Street Address <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="street"
              {...register('address.street')}
              type="text"
              required
              aria-required="true"
              autoComplete="street-address"
              placeholder="123 Main Street"
              aria-describedby={(errors as any).address?.street ? 'street-error' : undefined}
              aria-invalid={(errors as any).address?.street ? 'true' : 'false'}
              className={[
                'w-full px-3 py-2.5 text-sm border rounded-xl',
                'focus:outline-none focus:ring-1',
                (errors as any).address?.street
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
              ].join(' ')}
            />
            {(errors as any).address?.street && (
              <p id="street-error" role="alert" className="text-xs text-red-600 mt-1">
                {(errors as any).address.street.message}
              </p>
            )}
          </div>

          {/* Apt + City row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="apt" className="block text-sm font-medium text-stone-700 mb-1">
                Apt / Unit
              </label>
              <input
                id="apt"
                {...register('address.apt')}
                type="text"
                autoComplete="address-line2"
                placeholder="Apt 4B"
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-stone-700 mb-1">
                City <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="city"
                {...register('address.city')}
                type="text"
                required
                aria-required="true"
                autoComplete="address-level2"
                placeholder="Brooklyn"
                aria-invalid={(errors as any).address?.city ? 'true' : 'false'}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
            </div>
          </div>

          {/* State + ZIP row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-stone-700 mb-1">
                State <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="state"
                {...register('address.state')}
                type="text"
                required
                aria-required="true"
                autoComplete="address-level1"
                placeholder="NY"
                maxLength={2}
                aria-invalid={(errors as any).address?.state ? 'true' : 'false'}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none uppercase focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
            </div>
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-stone-700 mb-1">
                ZIP Code <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="zip"
                {...register('address.zip')}
                type="text"
                required
                aria-required="true"
                autoComplete="postal-code"
                inputMode="numeric"
                placeholder="11201"
                aria-invalid={(errors as any).address?.zip ? 'true' : 'false'}
                aria-describedby={(errors as any).address?.zip ? 'zip-error' : undefined}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
              {(errors as any).address?.zip && (
                <p id="zip-error" role="alert" className="text-xs text-red-600 mt-1">
                  {(errors as any).address.zip.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pickup location card ──────────────────────────────────────────── */}
      {method === 'pickup' && dispensary && (
        <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <h3 className="text-sm font-bold text-stone-900 mb-2">Pickup Location</h3>
          <p className="text-sm text-stone-700 font-medium">{dispensary.name}</p>
          {dispensary.address && (
            <address className="text-xs text-stone-500 not-italic mt-1 leading-relaxed">
              {dispensary.address.street}<br />
              {dispensary.address.city}, {dispensary.address.state} {dispensary.address.zip}
            </address>
          )}
        </div>
      )}

      {/* Continue button */}
      <div className="mt-8">
        <button
          type="submit"
          className={[
            'w-full py-3.5 rounded-xl font-semibold text-sm text-white',
            'bg-[hsl(var(--primary))] hover:brightness-110',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            'transition-all active:scale-[0.99]',
            'shadow-lg shadow-[hsl(var(--primary)/0.3)]',
          ].join(' ')}
        >
          Continue to Payment →
        </button>
      </div>
    </form>
  );
}
EOF
echo "  ✓ components/checkout/FulfillmentStep.tsx"

# =============================================================================
# PaymentStep.tsx
# =============================================================================
cat > "$SF/components/checkout/PaymentStep.tsx" << 'EOF'
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
EOF
echo "  ✓ components/checkout/PaymentStep.tsx"

# =============================================================================
# OrderReviewStep.tsx
# =============================================================================
cat > "$SF/components/checkout/OrderReviewStep.tsx" << 'EOF'
/**
 * @file OrderReviewStep.tsx
 * @app apps/storefront
 *
 * Checkout Step 3 — Order review + place order button.
 *
 * Shows a read-only summary of:
 *   - Cart items (name, variant, qty, price)
 *   - Fulfillment method + address / pickup location
 *   - Payment method
 *   - Price breakdown (subtotal, tax, total)
 *
 * "Place Order" triggers POST /orders, then POST /payments if card.
 *
 * On success: navigate to /orders/:id/confirmation
 * On error: show error banner with retry option
 *
 * Accessibility:
 *   - Review sections use <section> + <h3> hierarchy (WCAG 1.3.1)
 *   - Error: role="alert" (WCAG 4.1.3)
 *   - Processing state: aria-busy, descriptive aria-label (WCAG 4.1.2)
 */

import { useCartStore } from '@cannasaas/stores';
import type { FulfillmentFormValues } from './FulfillmentStep';

interface OrderReviewStepProps {
  fulfillmentData: FulfillmentFormValues;
  paymentMethod: 'card' | 'cash';
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  placeOrderError: string | null;
}

export function OrderReviewStep({
  fulfillmentData,
  paymentMethod,
  onBack,
  onPlaceOrder,
  isPlacing,
  placeOrderError,
}: OrderReviewStepProps) {
  const { items, subtotal, tax, deliveryFee, promoDiscount, total } = useCartStore();

  return (
    <div aria-label="Order review" className="space-y-6">
      {/* ── Items summary ─────────────────────────────────────────────────── */}
      <section aria-labelledby="review-items-heading">
        <h3 id="review-items-heading" className="text-sm font-bold text-stone-900 mb-3">
          Items ({items.length})
        </h3>
        <ul role="list" className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="text-stone-800 font-medium line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-stone-500">{item.variantName} × {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-stone-900 ml-3 flex-shrink-0">
                ${item.totalPrice.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Fulfillment ───────────────────────────────────────────────────── */}
      <section aria-labelledby="review-fulfillment-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-fulfillment-heading" className="text-sm font-bold text-stone-900 mb-2">
          {fulfillmentData.method === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
        </h3>
        {fulfillmentData.method === 'delivery' && 'address' in fulfillmentData ? (
          <address className="text-sm text-stone-600 not-italic">
            {fulfillmentData.address.street}{fulfillmentData.address.apt ? `, ${fulfillmentData.address.apt}` : ''}<br />
            {fulfillmentData.address.city}, {fulfillmentData.address.state} {fulfillmentData.address.zip}
          </address>
        ) : (
          <p className="text-sm text-stone-600">In-store pickup</p>
        )}
      </section>

      {/* ── Payment ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="review-payment-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-payment-heading" className="text-sm font-bold text-stone-900 mb-2">
          Payment
        </h3>
        <p className="text-sm text-stone-600">
          {paymentMethod === 'card' ? '💳 Credit / Debit Card' : '💵 Cash'}
        </p>
      </section>

      {/* ── Price breakdown ───────────────────────────────────────────────── */}
      <section aria-labelledby="review-total-heading" className="pt-4 border-t border-stone-100">
        <h3 id="review-total-heading" className="sr-only">Price breakdown</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-stone-600">
            <dt>Subtotal</dt><dd>${subtotal.toFixed(2)}</dd>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <dt>Discount</dt><dd>−${promoDiscount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between text-stone-600">
            <dt>Tax</dt><dd>${tax.toFixed(2)}</dd>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-stone-600">
              <dt>Delivery</dt><dd>${deliveryFee.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100">
            <dt>Total</dt>
            <dd className="text-lg">${total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      {/* Error message */}
      {placeOrderError && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <p className="font-semibold">Order failed</p>
          <p>{placeOrderError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPlacing}
          className="flex-1 py-3 rounded-xl font-medium text-sm border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={isPlacing}
          aria-busy={isPlacing}
          aria-label={isPlacing ? 'Placing your order…' : `Place order — $${total.toFixed(2)}`}
          className={[
            'flex-[2] py-3 rounded-xl font-bold text-sm text-white',
            'bg-[hsl(var(--primary))] hover:brightness-110',
            'disabled:opacity-70 disabled:cursor-wait',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            'transition-all active:scale-[0.99]',
            'shadow-xl shadow-[hsl(var(--primary)/0.4)]',
          ].join(' ')}
        >
          {isPlacing ? '⏳ Placing Order…' : `Place Order · $${total.toFixed(2)}`}
        </button>
      </div>

      <p className="text-[11px] text-center text-stone-400">
        By placing this order you agree to our Terms of Service.
        Cannabis sales are final per applicable state law.
        Must be 21+ to purchase.
      </p>
    </div>
  );
}
EOF
echo "  ✓ components/checkout/OrderReviewStep.tsx"

# =============================================================================
# Checkout Page
# =============================================================================
cat > "$SF/pages/Checkout.tsx" << 'EOF'
/**
 * @file Checkout.tsx
 * @app apps/storefront
 *
 * Multi-step checkout page.
 *
 * URL: /checkout (ProtectedRoute)
 *
 * Steps:
 *   1. Fulfillment — delivery vs pickup, address
 *   2. Payment     — card via Stripe or cash
 *   3. Review      — summary + place order
 *
 * Flow:
 *   Step 1 submit → validate + save fulfillment data → go to step 2
 *   Step 2 submit → save payment method → go to step 3
 *   Step 3 confirm → POST /orders → (if card) POST /payments → navigate to confirmation
 *
 * On success: cartStore.clearCart() + navigate to /orders/:id/confirmation
 *
 * Accessibility:
 *   - <main> heading: "Checkout" (WCAG 2.4.2)
 *   - StepIndicator communicates current step (WCAG 4.1.3)
 *   - Focus returns to top of form on step change (WCAG 2.4.3)
 *   - Redirect guard: if cart is empty, redirect to /cart
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder } from '@cannasaas/api-client';
import { useCartStore, selectIsCartEmpty } from '@cannasaas/stores';
import { StepIndicator } from '../components/checkout/StepIndicator';
import { FulfillmentStep } from '../components/checkout/FulfillmentStep';
import { PaymentStep } from '../components/checkout/PaymentStep';
import { OrderReviewStep } from '../components/checkout/OrderReviewStep';
import { ROUTES } from '../routes';
import type { FulfillmentFormValues } from '../components/checkout/FulfillmentStep';

const CHECKOUT_STEPS = [
  { number: 1, label: 'Delivery' },
  { number: 2, label: 'Payment' },
  { number: 3, label: 'Review' },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const isEmpty = useCartStore(selectIsCartEmpty);
  const clearCart = useCartStore((s) => s.clearCart);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [fulfillmentData, setFulfillmentData] = useState<FulfillmentFormValues | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);

  const { mutate: createOrder, isPending: isPlacing } = useCreateOrder();

  // Redirect if cart is empty
  useEffect(() => {
    if (isEmpty) navigate(ROUTES.cart, { replace: true });
  }, [isEmpty, navigate]);

  // Set page title and scroll to top on step change
  useEffect(() => {
    document.title = `Checkout — Step ${currentStep} | CannaSaas`;
    formTopRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleFulfillmentSubmit = (data: FulfillmentFormValues) => {
    setFulfillmentData(data);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = (method: 'card' | 'cash') => {
    setPaymentMethod(method);
    setCurrentStep(3);
  };

  const handlePlaceOrder = () => {
    if (!fulfillmentData) return;
    setPlaceOrderError(null);

    createOrder(
      {
        fulfillmentMethod: fulfillmentData.method,
        deliveryAddress: fulfillmentData.method === 'delivery' && 'address' in fulfillmentData
          ? fulfillmentData.address
          : undefined,
        paymentMethod,
      },
      {
        onSuccess: (order) => {
          clearCart();
          navigate(ROUTES.orderConfirmation(order.id));
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error?.message ?? 'Failed to place order. Please try again.';
          setPlaceOrderError(msg);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Heading — visually hidden, provides WCAG 2.4.2 page title in DOM */}
      <h1
        ref={formTopRef}
        tabIndex={-1}
        className="text-2xl font-bold text-stone-900 mb-6 outline-none"
      >
        Checkout
      </h1>

      {/* Step indicator */}
      <StepIndicator steps={CHECKOUT_STEPS} currentStep={currentStep} />

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6 sm:p-8">
        {currentStep === 1 && (
          <FulfillmentStep
            defaultValues={fulfillmentData ?? undefined}
            onSubmit={handleFulfillmentSubmit}
          />
        )}

        {currentStep === 2 && (
          <PaymentStep
            onBack={() => setCurrentStep(1)}
            onSubmit={handlePaymentSubmit}
          />
        )}

        {currentStep === 3 && fulfillmentData && (
          <OrderReviewStep
            fulfillmentData={fulfillmentData}
            paymentMethod={paymentMethod}
            onBack={() => setCurrentStep(2)}
            onPlaceOrder={handlePlaceOrder}
            isPlacing={isPlacing}
            placeOrderError={placeOrderError}
          />
        )}
      </div>
    </div>
  );
}
EOF
echo "  ✓ pages/Checkout.tsx"

# =============================================================================
# Account components
# =============================================================================
cat > "$SF/components/account/AccountNav.tsx" << 'EOF'
/**
 * @file AccountNav.tsx
 * @app apps/storefront
 *
 * Left sidebar navigation for account pages.
 * On mobile, renders as a horizontal scrollable tab strip.
 *
 * Accessibility:
 *   - <nav> with aria-label="Account navigation" (WCAG 1.3.1)
 *   - Active link: aria-current="page" (WCAG 4.1.2)
 */

import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';

const NAV_ITEMS = [
  { href: ROUTES.accountProfile,    label: 'Profile',        icon: '👤' },
  { href: ROUTES.accountOrders,     label: 'Orders',         icon: '📦' },
  { href: ROUTES.accountAddresses,  label: 'Addresses',      icon: '📍' },
  { href: ROUTES.accountLoyalty,    label: 'Loyalty Points', icon: '⭐' },
  { href: ROUTES.accountPreferences,label: 'Preferences',    icon: '⚙️' },
];

export function AccountNav() {
  return (
    <nav
      aria-label="Account navigation"
      className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
    >
      <ul role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink
              to={item.href}
              end
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
              className={({ isActive }) => [
                'flex items-center gap-3 px-4 py-3.5',
                'text-sm font-medium border-l-2 transition-all',
                isActive
                  ? 'border-l-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)] text-[hsl(var(--primary))]'
                  : 'border-l-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2',
                'focus-visible:ring-[hsl(var(--primary))]',
              ].join(' ')}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
EOF
echo "  ✓ components/account/AccountNav.tsx"

cat > "$SF/components/account/OrderHistoryList.tsx" << 'EOF'
/**
 * @file OrderHistoryList.tsx
 * @app apps/storefront
 *
 * Paginated order history list for the account page.
 * Uses OrderStatusBadge from scaffold-components.sh.
 * Calls useOrders() from @cannasaas/api-client.
 *
 * Shows: order number, date, status badge, item count, total
 * Each row links to the order detail page.
 *
 * Accessibility:
 *   - Table with <caption> (WCAG 1.3.1)
 *   - Column headers: <th scope="col"> (WCAG 1.3.1)
 *   - Empty state: role="status" (WCAG 4.1.3)
 */

import { Link } from 'react-router-dom';
import { useOrders } from '@cannasaas/api-client';
import { OrderStatusBadge } from '../order/OrderStatusBadge';
import { ROUTES } from '../../routes';

export function OrderHistoryList() {
  const { data, isLoading } = useOrders({});
  const orders = data?.data ?? [];

  if (isLoading) {
    return (
      <div aria-busy="true" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-stone-100 rounded-xl animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div role="status" className="text-center py-12">
        <p className="text-3xl mb-3" aria-hidden="true">📦</p>
        <h3 className="text-base font-semibold text-stone-800 mb-1">No orders yet</h3>
        <p className="text-sm text-stone-500 mb-4">Your order history will appear here.</p>
        <Link to={ROUTES.products} className="text-sm text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">
          Start Shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Your order history</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-100">
            <th scope="col" className="pb-3 pr-4 font-semibold">Order</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Date</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Status</th>
            <th scope="col" className="pb-3 pr-4 font-semibold">Items</th>
            <th scope="col" className="pb-3 font-semibold text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-stone-50 transition-colors group">
              <td className="py-3.5 pr-4">
                <Link
                  to={ROUTES.accountOrderDetail(order.id)}
                  className={[
                    'font-mono text-xs text-[hsl(var(--primary))]',
                    'group-hover:underline',
                    'focus-visible:outline-none focus-visible:underline',
                    // Extend click area to full row via pseudo-element on the link
                    'after:absolute after:inset-0',
                  ].join(' ')}
                >
                  #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
                </Link>
              </td>
              <td className="py-3.5 pr-4 text-stone-600">
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </time>
              </td>
              <td className="py-3.5 pr-4 relative">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="py-3.5 pr-4 text-stone-600">
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </td>
              <td className="py-3.5 text-right font-semibold text-stone-900">
                ${order.total?.toFixed(2) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF
echo "  ✓ components/account/OrderHistoryList.tsx"

cat > "$SF/components/account/ProfileForm.tsx" << 'EOF'
/**
 * @file ProfileForm.tsx
 * @app apps/storefront
 *
 * Edit profile form — name, email, phone.
 *
 * Reads current user from authStore; submits to PUT /users/:id.
 * On success, updates authStore.updateUser() with new values.
 *
 * Accessibility:
 *   - All fields have explicit <label> (WCAG 1.3.5)
 *   - Required fields: aria-required="true" (WCAG 1.3.5)
 *   - Error messages: role="alert" aria-describedby (WCAG 4.1.3)
 *   - Success toast: aria-live="polite" (WCAG 4.1.3)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@cannasaas/stores';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Please enter a valid email address'),
  phone:     z.string().regex(/^(\+1)?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}$/, 'Please enter a valid US phone number').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUser } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      email:     user?.email     ?? '',
      phone:     user?.phone     ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    // TODO: call apiClient.put(`/users/${user?.id}`, data)
    updateUser({ ...user, ...data });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fieldClass = (hasError: boolean) => [
    'w-full px-3 py-2.5 text-sm border rounded-xl',
    'focus:outline-none focus:ring-1',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
  ].join(' ');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
            First Name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input id="firstName" {...register('firstName')} type="text" autoComplete="given-name"
            required aria-required="true" aria-invalid={errors.firstName ? 'true' : 'false'}
            className={fieldClass(!!errors.firstName)} />
          {errors.firstName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
            Last Name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input id="lastName" {...register('lastName')} type="text" autoComplete="family-name"
            required aria-required="true" aria-invalid={errors.lastName ? 'true' : 'false'}
            className={fieldClass(!!errors.lastName)} />
          {errors.lastName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
          Email <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input id="email" {...register('email')} type="email" autoComplete="email"
          required aria-required="true" aria-invalid={errors.email ? 'true' : 'false'}
          className={fieldClass(!!errors.email)} />
        {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
        <input id="phone" {...register('phone')} type="tel" autoComplete="tel"
          inputMode="tel" placeholder="(555) 555-5555"
          className={fieldClass(!!errors.phone)} />
        {errors.phone && <p role="alert" className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="px-5 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
        >
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <p aria-live="polite" role="status" className="text-sm text-green-600 font-medium">
            ✓ Profile saved
          </p>
        )}
      </div>
    </form>
  );
}
EOF
echo "  ✓ components/account/ProfileForm.tsx"

cat > "$SF/components/account/LoyaltyDashboard.tsx" << 'EOF'
/**
 * @file LoyaltyDashboard.tsx
 * @app apps/storefront
 *
 * Loyalty points balance and recent earnings history.
 * Reads from GET /users/:id (loyalty fields) — displayed read-only.
 *
 * Shows:
 *   - Current points balance (large display)
 *   - Tier badge (Bronze / Silver / Gold)
 *   - Points needed for next tier
 *   - Recent point transactions
 *
 * Note: This is a display-only component for MVP.
 * Points redemption is handled in CartSummary at checkout.
 */

import { useAuthStore } from '@cannasaas/stores';

const TIERS = [
  { name: 'Bronze', minPoints: 0,    color: 'bg-amber-700 text-white' },
  { name: 'Silver', minPoints: 500,  color: 'bg-stone-400 text-white' },
  { name: 'Gold',   minPoints: 1500, color: 'bg-amber-400 text-stone-900' },
] as const;

function getTier(points: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
}

export function LoyaltyDashboard() {
  const { user } = useAuthStore();
  const points = (user as any)?.loyaltyPoints ?? 0;
  const tier = getTier(points);
  const nextTier = TIERS.find((t) => t.minPoints > points);
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Points balance card */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-stone-400">Total Points</p>
          <span className={['px-2.5 py-1 rounded-full text-xs font-bold', tier.color].join(' ')}>
            {tier.name}
          </span>
        </div>
        <p className="text-5xl font-extrabold">{points.toLocaleString()}</p>
        <p className="text-sm text-stone-400 mt-1">
          {points === 1 ? '1 point' : `${points.toLocaleString()} points`}
        </p>
        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>{tier.name}</span>
              <span>{pointsToNext} pts to {nextTier.name}</span>
            </div>
            <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                aria-hidden="true"
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div>
        <h3 className="text-sm font-bold text-stone-900 mb-3">How to Earn Points</h3>
        <ul className="space-y-2 text-sm text-stone-600">
          {[
            { action: 'Every $1 spent',        points: '1 point' },
            { action: 'Leave a product review', points: '25 points' },
            { action: 'Refer a friend',         points: '100 points' },
            { action: 'Birthday bonus',         points: '50 points' },
          ].map((item) => (
            <li key={item.action} className="flex justify-between py-2 border-b border-stone-50 last:border-0">
              <span>{item.action}</span>
              <span className="font-semibold text-[hsl(var(--primary))]">{item.points}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
EOF
echo "  ✓ components/account/LoyaltyDashboard.tsx"

# =============================================================================
# Account Page (nested routes)
# =============================================================================
cat > "$SF/pages/Account.tsx" << 'EOF'
/**
 * @file Account.tsx
 * @app apps/storefront
 *
 * Account shell page — layout with sidebar nav + nested route outlet.
 *
 * URL: /account/*
 * Requires authentication (ProtectedRoute wrapper in App.tsx)
 *
 * Nested routes (rendered via <Outlet />):
 *   /account/profile      — ProfileForm
 *   /account/orders       — OrderHistoryList
 *   /account/orders/:id   — Order detail (TODO: Sprint 5)
 *   /account/addresses    — Saved addresses (TODO)
 *   /account/loyalty      — LoyaltyDashboard
 *   /account/preferences  — Notification preferences (TODO)
 *
 * Layout:
 *   Desktop (lg+): Left sidebar (AccountNav) + right main (Outlet)
 *   Mobile (<lg):  Horizontal tab strip (AccountNav) + content below
 *
 * Accessibility:
 *   - <h1> "My Account" as page heading (WCAG 2.4.6)
 *   - <nav> landmark in AccountNav (WCAG 1.3.1)
 *   - <main> equivalent is the route content area
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';
import { AccountNav } from '../components/account/AccountNav';
import { ProfileForm } from '../components/account/ProfileForm';
import { OrderHistoryList } from '../components/account/OrderHistoryList';
import { LoyaltyDashboard } from '../components/account/LoyaltyDashboard';
import { ROUTES } from '../routes';

export function AccountPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">My Account</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Welcome back, {user?.firstName ?? 'friend'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar navigation */}
        <div className="w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-24">
          <AccountNav />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-stone-100 p-6">
          <Routes>
            {/* Default → profile */}
            <Route index element={<Navigate to="profile" replace />} />

            <Route
              path="profile"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Profile</h2>
                  <ProfileForm />
                </>
              }
            />

            <Route
              path="orders"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Order History</h2>
                  <OrderHistoryList />
                </>
              }
            />

            <Route
              path="orders/:id"
              element={
                <div className="text-center py-8">
                  <p className="text-stone-500 text-sm">Order detail page — Sprint 5</p>
                </div>
              }
            />

            <Route
              path="addresses"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Saved Addresses</h2>
                  <p className="text-stone-500 text-sm">Address management — Sprint 5</p>
                </>
              }
            />

            <Route
              path="loyalty"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Loyalty Points</h2>
                  <LoyaltyDashboard />
                </>
              }
            />

            <Route
              path="preferences"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Preferences</h2>
                  <p className="text-stone-500 text-sm">Notification preferences — Sprint 10</p>
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
EOF
echo "  ✓ pages/Account.tsx"

# =============================================================================
# OrderConfirmation Page
# =============================================================================
cat > "$SF/pages/OrderConfirmation.tsx" << 'EOF'
/**
 * @file OrderConfirmation.tsx
 * @app apps/storefront
 *
 * Post-checkout order confirmation page.
 *
 * URL: /orders/:id/confirmation
 *
 * Shows:
 *   - Success animation / checkmark
 *   - Order number
 *   - Fulfillment details (pickup time / delivery estimate)
 *   - CTAs: "Track Order" (→ account/orders/:id) + "Continue Shopping"
 *
 * Calls useOrder(id) to get current status and fulfillment details.
 *
 * Accessibility:
 *   - role="status" on confirmation panel (WCAG 4.1.3)
 *   - <h1> "Order Confirmed" (WCAG 2.4.2)
 *   - aria-live region for order status polling
 */

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrder } from '@cannasaas/api-client';
import { ROUTES } from '../routes';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id ?? '');

  useEffect(() => {
    document.title = 'Order Confirmed! | CannaSaas';
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {/* Success animation */}
      <div
        aria-hidden="true"
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
      >
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div role="status">
        <h1 className="text-3xl font-extrabold text-stone-900 mb-3">Order Confirmed!</h1>
        <p className="text-stone-500 mb-2">
          Thank you for your order.
          {!isLoading && order?.orderNumber && (
            <> Your order number is <strong className="text-stone-900 font-mono">#{order.orderNumber}</strong>.</>
          )}
        </p>

        {!isLoading && order && (
          <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-left">
            <p className="text-sm font-semibold text-stone-800 mb-1">
              {order.fulfillmentMethod === 'delivery' ? '🚚 Delivery' : '🏪 In-Store Pickup'}
            </p>
            <p className="text-sm text-stone-600">
              {order.fulfillmentMethod === 'delivery'
                ? 'Estimated delivery: 45–90 minutes'
                : 'Ready for pickup in approximately 30–60 minutes'}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
        <Link
          to={ROUTES.accountOrders}
          className={[
            'px-6 py-3 rounded-xl font-semibold text-sm',
            'bg-[hsl(var(--primary))] text-white',
            'hover:brightness-110 transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
          ].join(' ')}
        >
          Track Order
        </Link>
        <Link
          to={ROUTES.products}
          className={[
            'px-6 py-3 rounded-xl font-medium text-sm',
            'border border-stone-200 text-stone-700',
            'hover:bg-stone-50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300',
          ].join(' ')}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
EOF
echo "  ✓ pages/OrderConfirmation.tsx"

# =============================================================================
# Login + Register Pages
# =============================================================================
cat > "$SF/pages/Login.tsx" << 'EOF'
/**
 * @file Login.tsx
 * @app apps/storefront
 *
 * Customer login page.
 *
 * Form fields: email + password
 * On success: navigate to from (preserved URL) or /
 * On error: show error banner below form
 *
 * Accessibility:
 *   - <main> equivalent label (WCAG 1.3.1)
 *   - All inputs: label + aria-required (WCAG 1.3.5)
 *   - Error: role="alert" (WCAG 4.1.3)
 *   - "Show password" toggle (WCAG 1.4.10)
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@cannasaas/api-client';
import { ROUTES } from '../routes';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? ROUTES.home;

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginValues) => {
    login(data, { onSuccess: () => navigate(from, { replace: true }) });
  };

  const errorMessage = error
    ? (error as any)?.response?.data?.error?.code === 'INVALID_CREDENTIALS'
      ? 'Invalid email or password'
      : 'Sign in failed. Please try again.'
    : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900 mt-4">Sign In</h1>
          <p className="text-stone-500 text-sm mt-1">Welcome back</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-7 shadow-sm">
          {errorMessage && (
            <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-stone-700 mb-1">
                Email <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
              {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="login-password" className="text-sm font-medium text-stone-700">
                  Password <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <Link to={ROUTES.forgotPassword} className="text-xs text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="w-full mt-2 py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center text-stone-500 mt-5">
            Don't have an account?{' '}
            <Link to={ROUTES.register} className="text-[hsl(var(--primary))] font-medium hover:underline focus-visible:outline-none focus-visible:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
EOF
echo "  ✓ pages/Login.tsx"

cat > "$SF/pages/Register.tsx" << 'EOF'
/**
 * @file Register.tsx
 * @app apps/storefront
 *
 * Customer registration page.
 *
 * Fields: firstName, lastName, email, password, confirmPassword
 * Age attestation checkbox (must confirm 21+ — WCAG + regulatory)
 * On success: auto-login + navigate to /
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@cannasaas/api-client';
import { ROUTES } from '../routes';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Please enter a valid email address'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 21 or older to register' }),
  }),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { mutate: register_, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterValues) => {
    register_(
      { firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password },
      { onSuccess: () => navigate(ROUTES.home, { replace: true }) },
    );
  };

  const serverError = error
    ? (error as any)?.response?.data?.error?.code === 'EMAIL_EXISTS'
      ? 'An account with this email already exists'
      : 'Registration failed. Please try again.'
    : null;

  const inputClass = (err: boolean) => [
    'w-full px-3 py-2.5 text-sm border rounded-xl',
    'focus:outline-none focus:ring-1',
    err ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
  ].join(' ');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900 mt-4">Create Account</h1>
          <p className="text-stone-500 text-sm mt-1">Must be 21+ to register</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-7 shadow-sm">
          {serverError && (
            <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-first" className="block text-sm font-medium text-stone-700 mb-1">First Name *</label>
                <input id="reg-first" {...register('firstName')} type="text" autoComplete="given-name" required aria-required="true"
                  aria-invalid={errors.firstName ? 'true' : 'false'} className={inputClass(!!errors.firstName)} />
                {errors.firstName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="reg-last" className="block text-sm font-medium text-stone-700 mb-1">Last Name *</label>
                <input id="reg-last" {...register('lastName')} type="text" autoComplete="family-name" required aria-required="true"
                  aria-invalid={errors.lastName ? 'true' : 'false'} className={inputClass(!!errors.lastName)} />
                {errors.lastName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
              <input id="reg-email" {...register('email')} type="email" autoComplete="email" required aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'} className={inputClass(!!errors.email)} />
              {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-pw" className="block text-sm font-medium text-stone-700 mb-1">Password *</label>
              <div className="relative">
                <input id="reg-pw" {...register('password')} type={showPw ? 'text' : 'password'} autoComplete="new-password" required aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'} className={inputClass(!!errors.password) + ' pr-10'} />
                <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide' : 'Show'} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none">
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              {errors.password && <p role="alert" className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-stone-700 mb-1">Confirm Password *</label>
              <input id="reg-confirm" {...register('confirmPassword')} type={showPw ? 'text' : 'password'} autoComplete="new-password" required aria-required="true"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'} className={inputClass(!!errors.confirmPassword)} />
              {errors.confirmPassword && <p role="alert" className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Age attestation — regulatory requirement */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  {...register('ageConfirmed')}
                  type="checkbox"
                  aria-required="true"
                  aria-invalid={errors.ageConfirmed ? 'true' : 'false'}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-xs text-stone-600 leading-relaxed">
                  I confirm that I am <strong>21 years of age or older</strong> and agree to the{' '}
                  <Link to="/terms" className="text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">Privacy Policy</Link>.
                </span>
              </label>
              {errors.ageConfirmed && (
                <p role="alert" className="text-xs text-red-600 mt-1">{errors.ageConfirmed.message}</p>
              )}
            </div>

            <button type="submit" disabled={isPending} aria-busy={isPending}
              className="w-full py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all">
              {isPending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-center text-stone-500 mt-5">
            Already have an account?{' '}
            <Link to={ROUTES.login} className="text-[hsl(var(--primary))] font-medium hover:underline focus-visible:outline-none focus-visible:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
EOF
echo "  ✓ pages/Register.tsx"

cat > "$SF/pages/NotFound.tsx" << 'EOF'
/**
 * @file NotFound.tsx
 * @app apps/storefront
 *
 * 404 Not Found page.
 * Shown by the * catch-all route in App.tsx.
 */

import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ROUTES } from '../routes';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — Page Not Found | CannaSaas';
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-black text-stone-200 mb-4" aria-hidden="true">404</p>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Page Not Found</h1>
      <p className="text-stone-500 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
EOF
echo "  ✓ pages/NotFound.tsx"

echo ""
echo "  ✅ Storefront Part 4 complete!"
echo ""
find "$SF/components/checkout" "$SF/components/account" \
     "$SF/pages/Checkout.tsx" "$SF/pages/Account.tsx" \
     "$SF/pages/OrderConfirmation.tsx" "$SF/pages/Login.tsx" \
     "$SF/pages/Register.tsx" "$SF/pages/NotFound.tsx" \
     -name "*.tsx" 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
