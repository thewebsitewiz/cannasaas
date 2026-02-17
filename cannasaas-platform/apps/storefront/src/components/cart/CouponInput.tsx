/**
 * ═══════════════════════════════════════════════════════════════════
 * CouponInput — Promo Code Validation & Application
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/cart/CouponInput.tsx
 *
 * Expandable promo code input that calls the Sprint 5 coupon
 * validation endpoint:
 *
 *   POST /api/v1/cart/coupon
 *   Body:     { code: "SUMMER20" }
 *   Response: { valid, type, value, maxDiscount, description, message }
 *
 * ─── STATE MACHINE ─────────────────────────────────────────────
 *
 *   ┌───────────┐  click  ┌──────────┐  Apply  ┌─────────┐
 *   │ COLLAPSED ├────────►│ EXPANDED ├────────►│ LOADING │
 *   └───────────┘         └────┬─────┘         └────┬────┘
 *                              │ Esc                 │
 *                              ▼                     ▼ valid?
 *                         COLLAPSED            ┌─────┴─────┐
 *                                        ┌─────┤           ├─────┐
 *                                        ▼     │           │     ▼
 *                                   ┌─────────┐│      ┌─────────┐
 *                                   │ SUCCESS ││      │  ERROR  │
 *                                   │ (applied)│      │ (retry) │
 *                                   └─────────┘      └─────────┘
 *
 * The validated coupon is persisted in useCartStore.appliedCoupon.
 * The useCartTotals hook reads it to compute the discount.
 *
 * Accessibility (WCAG):
 *   - <label> linked to input via htmlFor/id (1.3.1)
 *   - aria-invalid="true" when error is present (4.1.2)
 *   - Error message linked via aria-describedby (4.1.2)
 *   - Success/error use role="status" for live announce (4.1.3)
 *   - Enter submits, Escape collapses (keyboard efficiency)
 *   - focus-visible rings on input and buttons (2.4.7)
 *   - Touch targets ≥ 44px height (2.5.8)
 *
 * Responsive:
 *   - Input + button: flex row, button shrinks on mobile
 *   - Applied coupon: flex row with truncation on name
 *   - Full width of its container (sidebar or stacked)
 */

import { useState, useRef, useId, useCallback, type KeyboardEvent } from 'react';
import { useCartStore } from '@cannasaas/stores';
import { useApplyCoupon } from '@cannasaas/api-client';

export function CouponInput() {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const { mutateAsync: applyCoupon, isPending } = useApplyCoupon();

  /** Validate and apply the coupon code via Sprint 5 API */
  const handleApply = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a promo code.');
      inputRef.current?.focus();
      return;
    }

    setError('');

    try {
      const result = await applyCoupon({ code: trimmed });

      if (result.valid) {
        setCoupon({
          code: trimmed,
          type: result.type,
          value: result.value,
          maxDiscount: result.maxDiscount,
          description: result.description,
        });
        setCode('');
        setIsExpanded(false);
      } else {
        setError(result.message ?? 'Invalid or expired promo code.');
        inputRef.current?.focus();
      }
    } catch {
      setError('Unable to validate code. Please try again.');
      inputRef.current?.focus();
    }
  }, [code, applyCoupon, setCoupon]);

  /** Remove the applied coupon */
  const handleRemove = useCallback(() => {
    removeCoupon();
    setCode('');
    setError('');
  }, [removeCoupon]);

  /** Enter submits, Escape collapses */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setCode('');
      setError('');
    }
  };

  // ── Applied state: green success bar with Remove ──
  if (appliedCoupon) {
    return (
      <div
        role="status"
        className="
          flex items-center justify-between gap-2
          px-3 py-2.5
          bg-emerald-50 border border-emerald-200
          rounded-lg text-sm
        "
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-emerald-600 flex-shrink-0">✓</span>
          <span className="font-semibold text-emerald-800 truncate">
            {appliedCoupon.code}
          </span>
          {appliedCoupon.description && (
            <span className="text-emerald-600 text-xs hidden sm:inline truncate">
              — {appliedCoupon.description}
            </span>
          )}
        </div>
        <button
          onClick={handleRemove}
          aria-label={`Remove promo code ${appliedCoupon.code}`}
          className="
            text-xs font-medium text-emerald-700 hover:text-emerald-900
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary rounded-sm
            flex-shrink-0 transition-colors min-h-[44px]
            px-2
          "
        >
          Remove
        </button>
      </div>
    );
  }

  // ── Collapsed: "Have a promo code?" link ──
  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="
          text-sm font-medium text-primary hover:text-primary/80
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-primary focus-visible:ring-offset-1
          rounded-sm transition-colors min-h-[44px]
        "
      >
        Have a promo code?
      </button>
    );
  }

  // ── Expanded: input + Apply button ──
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        Promo Code
      </label>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter code"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          spellCheck={false}
          className={`
            flex-1 min-w-0
            px-3 py-2.5 min-h-[44px] text-sm
            bg-background border rounded-lg
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-1
            transition-colors uppercase tracking-wider
            ${error
              ? 'border-destructive focus-visible:ring-destructive'
              : 'border-border'}
          `}
        />

        <button
          onClick={handleApply}
          disabled={isPending}
          className="
            flex-shrink-0
            px-4 py-2.5 min-h-[44px]
            bg-primary text-primary-foreground
            rounded-lg text-sm font-semibold
            disabled:opacity-60
            hover:bg-primary/90
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-1
            transition-colors
          "
        >
          {isPending ? 'Checking…' : 'Apply'}
        </button>
      </div>

      {error && (
        <p
          id={errorId}
          role="status"
          className="text-xs sm:text-sm text-destructive font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
}
