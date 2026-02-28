// apps/storefront/src/pages/Checkout/CheckoutPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@cannasaas/stores';
import { CheckoutProgress } from './components/CheckoutProgress';
import { ReviewStep } from './steps/ReviewStep';
import { FulfillmentStep } from './steps/FulfillmentStep';
import { PaymentStep } from './steps/PaymentStep';
import { OrderSummary } from './components/OrderSummary';
import { usePurchaseLimitCheck } from '@cannasaas/api-client';

type CheckoutStep = 'review' | 'fulfillment' | 'payment';

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'review',      label: 'Review Cart'      },
  { id: 'fulfillment', label: 'Delivery / Pickup' },
  { id: 'payment',     label: 'Payment'           },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const { items, subtotal, promoDiscount } = useCartStore();
  const { data: limitCheck } = usePurchaseLimitCheck(items);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleStepComplete = (step: CheckoutStep) => {
    const next = STEPS[currentStepIndex + 1];
    if (next) { setCurrentStep(next.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  return (
    <>
      <Helmet><title>Checkout | CannaSaas</title></Helmet>
      <div className="min-h-screen bg-[var(--color-bg-secondary)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-8">Checkout</h1>
          <CheckoutProgress steps={STEPS} currentStep={currentStep} className="mb-8" />

          {limitCheck && !limitCheck.allowed && (
            <div role="alert" className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-[var(--p-radius-md)]">
              <p className="font-semibold text-amber-800 mb-1">Purchase Limit Warning</p>
              <ul className="text-sm text-amber-700 list-disc list-inside">
                {limitCheck.violations.map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0">
              {currentStep === 'review' && (
                <ReviewStep onComplete={() => handleStepComplete('review')} />
              )}
              {currentStep === 'fulfillment' && (
                <FulfillmentStep
                  fulfillmentType={fulfillmentType}
                  onFulfillmentChange={setFulfillmentType}
                  onAddressChange={setDeliveryAddress}
                  onComplete={() => handleStepComplete('fulfillment')} />
              )}
              {currentStep === 'payment' && (
                <PaymentStep
                  fulfillmentType={fulfillmentType}
                  deliveryAddress={deliveryAddress}
                  onSuccess={(orderId) => navigate(`/orders/${orderId}/success`)} />
              )}
            </div>
            <div className="w-full lg:w-80 lg:sticky lg:top-24">
              <OrderSummary items={items} subtotal={subtotal()} promoDiscount={promoDiscount} fulfillmentType={fulfillmentType} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
