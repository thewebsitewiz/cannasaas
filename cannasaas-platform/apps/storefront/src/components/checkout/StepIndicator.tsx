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
