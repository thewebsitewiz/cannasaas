// apps/storefront/src/pages/Checkout/components/CheckoutProgress.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface Step { id: string; label: string; }
interface CheckoutProgressProps { steps: Step[]; currentStep: string; className?: string; }

/**
 * CheckoutProgress — WCAG: nav+ol (1.3.1), icon+text not color alone (1.4.1),
 * aria-current="step" (4.1.2).
 */
export function CheckoutProgress({ steps, currentStep, className }: CheckoutProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  return (
    <nav aria-label="Checkout steps" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent   = step.id === currentStep;
          return (
            <li key={step.id} className="flex items-center flex-1" aria-current={isCurrent ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-[var(--p-text-sm)] font-bold transition-all duration-[var(--p-dur-normal)]',
                    isCompleted
                      ? 'bg-[var(--color-success)] text-white'
                      : isCurrent
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border)]',
                  )}
                  aria-label={isCompleted ? `${step.label}: completed` : isCurrent ? `${step.label}: current step` : `${step.label}: upcoming`}>
                  {isCompleted ? <Check size={14} aria-hidden="true" /> : <span aria-hidden="true">{index + 1}</span>}
                </div>
                <span className={cn(
                  'text-[var(--p-text-xs)] mt-1.5 font-semibold whitespace-nowrap',
                  isCurrent ? 'text-[var(--color-brand)]' : isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]',
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-[var(--p-dur-slow)]',
                  isCompleted ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                )} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
