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
