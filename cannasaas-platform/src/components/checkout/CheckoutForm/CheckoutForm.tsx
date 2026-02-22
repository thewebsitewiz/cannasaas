/**
 * @file src/components/checkout/CheckoutForm/CheckoutForm.tsx
 * @description Multi-step checkout form — customer details and order type.
 *
 * WCAG 2.1 AA compliance:
 *   - All form fields have associated <label> elements (not placeholder-only)
 *   - Required fields marked with aria-required="true" AND visual indicator
 *   - Error messages linked to inputs via aria-describedby
 *   - Error summary announced to AT via role="alert" and aria-live="polite"
 *   - Focus is moved to the error summary on failed submission
 *   - Conditional address fields are hidden via aria-hidden when not visible
 *     (so keyboard users can't tab into invisible fields)
 *   - Field hints (format, example) linked via aria-describedby
 *
 * Advanced React patterns:
 *   - React Hook Form + Zod resolver for schema-driven validation
 *   - useId() for generating stable, unique IDs (React 18+) — avoids
 *     SSR hydration mismatches and name collisions in multiple form instances
 *   - Controlled error state lifted via onSubmit callback
 *
 * @see src/utils/validators.ts (checkoutSchema)
 */

import React, { useId, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { checkoutSchema } from '@/utils/validators';
import { cn } from '@/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export interface CheckoutFormProps {
  /** Called with validated data when the user submits the form */
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  /** Whether the form is in a submitting/loading state */
  isSubmitting?: boolean;
  /** Server-side error (e.g. purchase limit violation) to display above the form */
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Sub-component: FormField
// Encapsulates the label + input + error-message pattern to reduce repetition
// ---------------------------------------------------------------------------

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactElement;
}

/**
 * FormField wraps an input with a label, optional hint text, and error message.
 * The label is always visible (never replaced by placeholder).
 * Errors are linked to the input via aria-describedby on the child element.
 */
function FormField({ id, label, error, hint, required = false, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <>
            {/* Visual asterisk — hidden from AT since aria-required handles semantics */}
            <span aria-hidden="true" className="ml-1 text-destructive">*</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {/* Clone the input to inject id, aria-describedby, aria-required, and aria-invalid */}
      {React.cloneElement(children, {
        id,
        'aria-required': required || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })}

      {/* Error message — role="alert" not needed here; the error summary above
          handles the AT announcement. This is purely visual context. */}
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="status">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CheckoutForm({
  onSubmit,
  isSubmitting = false,
  serverError,
}: CheckoutFormProps) {
  /**
   * useId() generates a stable unique prefix for this form instance.
   * Prevents ID collisions if CheckoutForm is rendered multiple times
   * (e.g. in a modal and on the page simultaneously — unlikely but safe).
   */
  const formId = useId();
  const id = (name: string) => `${formId}-${name}`;

  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: 'pickup',
    },
  });

  const orderType = watch('orderType');
  const isDelivery = orderType === 'delivery';

  /**
   * When there are validation errors, move focus to the error summary so
   * screen-reader and keyboard users are immediately informed of the problem
   * without having to search the page.
   */
  const hasErrors = Object.keys(errors).length > 0 || !!serverError;
  useEffect(() => {
    if (hasErrors) {
      errorSummaryRef.current?.focus();
    }
  }, [hasErrors]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate /* We handle validation ourselves via Zod */
      aria-label="Checkout form"
      className="flex flex-col gap-6"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Error summary — announced to AT on submission failure               */}
      {/* ------------------------------------------------------------------ */}
      {hasErrors && (
        <div
          ref={errorSummaryRef}
          /**
           * tabIndex={-1} makes the div programmatically focusable (via .focus())
           * without adding it to the natural tab order. This is the standard
           * WCAG technique for moving focus to an error summary.
           */
          tabIndex={-1}
          /**
           * role="alert" causes screen readers to immediately announce the
           * content when it appears in the DOM — critical for form errors.
           */
          role="alert"
          aria-atomic="true"
          className={cn(
            'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
            'text-sm text-destructive',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
          )}
        >
          <p className="font-semibold">Please correct the following errors:</p>
          <ul className="mt-2 list-disc pl-4">
            {serverError && <li>{serverError}</li>}
            {Object.entries(errors).map(([field, err]) => (
              <li key={field}>
                {/* Link each error to its field for keyboard navigation */}
                <a
                  href={`#${id(field)}`}
                  className="underline hover:no-underline"
                >
                  {err?.message as string}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Order type selector                                                  */}
      {/* ------------------------------------------------------------------ */}
      <fieldset className="flex flex-col gap-2">
        {/*
         * <legend> is the accessible name for the fieldset group.
         * All radio inputs in the group are associated with this legend.
         */}
        <legend className="text-sm font-semibold">
          Order Type
          <span aria-hidden="true" className="ml-1 text-destructive">*</span>
        </legend>

        <div className="flex gap-4">
          {(['pickup', 'delivery'] as const).map((type) => (
            <label
              key={type}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border p-3',
                'transition-colors',
                orderType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <input
                {...register('orderType')}
                type="radio"
                value={type}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium capitalize">{type}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Customer details                                                      */}
      {/* ------------------------------------------------------------------ */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">Your Details</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id={id('firstName')}
            label="First Name"
            error={errors.firstName?.message}
            required
          >
            <input
              {...register('firstName')}
              type="text"
              autoComplete="given-name"
              className={cn(
                'h-10 rounded-md border border-input bg-background px-3 text-sm',
                'transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                errors.firstName && 'border-destructive',
              )}
            />
          </FormField>

          <FormField
            id={id('lastName')}
            label="Last Name"
            error={errors.lastName?.message}
            required
          >
            <input
              {...register('lastName')}
              type="text"
              autoComplete="family-name"
              className={cn(
                'h-10 rounded-md border border-input bg-background px-3 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                errors.lastName && 'border-destructive',
              )}
            />
          </FormField>
        </div>

        <FormField
          id={id('phone')}
          label="Phone Number"
          error={errors.phone?.message}
          hint="We'll text you when your order is ready."
          required
        >
          <input
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="555-867-5309"
            className={cn(
              'h-10 rounded-md border border-input bg-background px-3 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              errors.phone && 'border-destructive',
            )}
          />
        </FormField>
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Delivery address (conditional — only shown for delivery orders)     */}
      {/* ------------------------------------------------------------------ */}
      {/*
       * We use CSS visibility rather than conditional rendering so that form
       * state is preserved when the user switches between pickup and delivery.
       * aria-hidden ensures keyboard users can't tab into the hidden fields.
       */}
      <fieldset
        className={cn(
          'flex flex-col gap-4 overflow-hidden transition-all duration-300',
          isDelivery ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
        )}
        aria-hidden={!isDelivery}
        disabled={!isDelivery} /* Prevents hidden fields from submitting */
      >
        <legend className="text-sm font-semibold">Delivery Address</legend>

        <FormField
          id={id('address.street')}
          label="Street Address"
          error={errors.address?.street?.message}
          required={isDelivery}
        >
          <input
            {...register('address.street')}
            type="text"
            autoComplete="street-address"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <FormField
            id={id('address.city')}
            label="City"
            error={errors.address?.city?.message}
            required={isDelivery}
          >
            <input
              {...register('address.city')}
              type="text"
              autoComplete="address-level2"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </FormField>

          <FormField
            id={id('address.state')}
            label="State"
            error={errors.address?.state?.message}
            required={isDelivery}
          >
            <select
              {...register('address.state')}
              autoComplete="address-level1"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <option value="">Select…</option>
              <option value="NY">New York</option>
              <option value="NJ">New Jersey</option>
              <option value="CT">Connecticut</option>
            </select>
          </FormField>

          <FormField
            id={id('address.zip')}
            label="ZIP Code"
            error={errors.address?.zip?.message}
            required={isDelivery}
          >
            <input
              {...register('address.zip')}
              type="text"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
          </FormField>
        </div>
      </fieldset>

      {/* ------------------------------------------------------------------ */}
      {/* Submit button                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        size="lg"
        aria-label={isSubmitting ? 'Placing your order, please wait' : 'Place Order'}
      >
        {isSubmitting ? 'Placing Order…' : 'Place Order'}
      </Button>
    </form>
  );
}
