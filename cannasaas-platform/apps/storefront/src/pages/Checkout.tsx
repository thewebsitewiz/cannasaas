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

import { selectIsCartEmpty, useCartStore } from '@cannasaas/stores';
import { useEffect, useRef, useState } from 'react';

import type { FulfillmentFormValues } from '../components/checkout/FulfillmentStep';
import { FulfillmentStep } from '../components/checkout/FulfillmentStep';
import { OrderReviewStep } from '../components/checkout/OrderReviewStep';
import { PaymentStep } from '../components/checkout/PaymentStep';
import { ROUTES } from '../routes';
import { StepIndicator } from '../components/checkout/StepIndicator';
import { useCreateOrder } from '@cannasaas/api-client';
import { useNavigate } from 'react-router-dom';

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
  const [fulfillmentData, setFulfillmentData] =
    useState<FulfillmentFormValues | null>(null);
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
        deliveryAddress:
          fulfillmentData.method === 'delivery' && 'address' in fulfillmentData
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
          const msg =
            err?.response?.data?.error?.message ??
            'Failed to place order. Please try again.';
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
