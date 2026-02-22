/**
 * @file PromoCodeInput.tsx
 * @app apps/storefront
 *
 * Promo code input form with validation feedback.
 *
 * Behaviour:
 *   - Input + "Apply" button side by side
 *   - Calls useApplyPromo() on submit
 *   - Success: shows green checkmark + discount amount
 *   - Error: shows red error message (PROMO_NOT_FOUND, PROMO_EXPIRED, etc.)
 *   - Active promo: shows code + discount + "Remove" button
 *
 * Accessibility:
 *   - Input has htmlFor label (WCAG 1.3.5)
 *   - Success/error messages use role="status"/"alert" (WCAG 4.1.3)
 *   - Input aria-describedby links to feedback message (WCAG 1.3.1)
 *   - Inline error: aria-invalid on input (WCAG 4.1.2)
 */

import { useState, useId } from 'react';
import { useApplyPromo, useRemovePromo } from '@cannasaas/api-client';
import { useCartStore } from '@cannasaas/stores';

export function PromoCodeInput() {
  const [code, setCode] = useState('');
  const { appliedPromoCode, promoDiscount } = useCartStore();

  const { mutate: applyPromo, isPending: isApplying, error: applyError } = useApplyPromo();
  const { mutate: removePromo, isPending: isRemoving } = useRemovePromo();

  const inputId = useId();
  const feedbackId = useId();

  const errorMessage = applyError
    ? (applyError as any)?.response?.data?.error?.code === 'PROMO_NOT_FOUND'
      ? 'Promo code not found'
      : (applyError as any)?.response?.data?.error?.code === 'PROMO_EXPIRED'
        ? 'Promo code has expired'
        : 'Unable to apply promo code'
    : null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    applyPromo({ code: code.trim().toUpperCase() });
  };

  // Active promo display
  if (appliedPromoCode) {
    return (
      <div
        role="status"
        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
      >
        <div className="flex items-center gap-2">
          <svg aria-hidden="true" className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Code applied: <span className="font-mono">{appliedPromoCode}</span>
            </p>
            <p className="text-xs text-green-600">
              Saving ${promoDiscount.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removePromo()}
          disabled={isRemoving}
          aria-label="Remove promo code"
          className="text-xs text-green-700 hover:text-green-900 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 rounded disabled:opacity-50"
        >
          {isRemoving ? 'Removing…' : 'Remove'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} noValidate>
      <label htmlFor={inputId} className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2 block">
        Promo Code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          aria-describedby={errorMessage ? feedbackId : undefined}
          aria-invalid={errorMessage ? 'true' : 'false'}
          autoComplete="off"
          className={[
            'flex-1 px-3 py-2 text-sm font-mono uppercase',
            'border rounded-lg',
            'placeholder:text-stone-400 placeholder:normal-case',
            'focus:outline-none focus:ring-1',
            errorMessage
              ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
              : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={!code.trim() || isApplying}
          className={[
            'px-4 py-2 rounded-lg text-sm font-semibold',
            'bg-stone-900 text-white',
            'hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
            'transition-colors',
          ].join(' ')}
        >
          {isApplying ? '…' : 'Apply'}
        </button>
      </div>
      {errorMessage && (
        <p id={feedbackId} role="alert" className="text-xs text-red-600 mt-1.5">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
