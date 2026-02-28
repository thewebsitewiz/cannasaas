// apps/storefront/src/pages/Checkout/steps/PaymentStep.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { Button } from '@cannasaas/ui';
export function PaymentStep(props: Record<string, unknown>) {
  const onComplete = props.onComplete as (() => void) | undefined;
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-8">
      <p className="text-[var(--color-text-secondary)] mb-6">PaymentStep — stub</p>
      {onComplete && <Button variant="primary" size="lg" onClick={onComplete}>Continue</Button>}
    </div>
  );
}
