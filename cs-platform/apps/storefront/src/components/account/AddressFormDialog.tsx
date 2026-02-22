/**
 * ═══════════════════════════════════════════════════════════════════
 * AddressFormDialog — Modal for Add / Edit Address
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/AddressFormDialog.tsx
 *
 * Native <dialog> modal for creating or editing a saved address.
 * Uses React Hook Form + Zod for validation. Calls POST /users/me/addresses
 * (create) or PUT /users/me/addresses/:id (update).
 *
 * Accessibility (WCAG):
 *   - Native <dialog> — built-in focus trapping + Escape close (2.4.7)
 *   - aria-labelledby on dialog title (4.1.2)
 *   - All inputs via FormField (label, aria-invalid) (1.3.1)
 *   - autoComplete attributes for browser autofill (1.3.5)
 *   - Close button has aria-label (4.1.2)
 *   - focus-visible rings (2.4.7)
 *   - Form uses noValidate (custom Zod validation) (3.3.1)
 *
 * Responsive:
 *   - Full-width on mobile (mx-4), max-w-lg on sm+
 *   - City/State/ZIP: 3-col on sm+, stacked on mobile
 */

import { useEffect, useRef, useId } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAddress, useUpdateAddress } from '@cannasaas/api-client';
import { FormField } from '@/components/checkout/FormField';
import type { SavedAddress } from './AddressCard';

const INPUT_CLS = 'w-full px-3 py-2.5 min-h-[44px] text-sm bg-background border border-border rounded-lg placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(['home', 'work', 'other']),
  street: z.string().min(1, 'Street is required'),
  apt: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2).max(2, 'Use 2-letter code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP required'),
  isDefault: z.boolean().default(false),
  deliveryInstructions: z.string().max(500).optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  /** null = add mode, SavedAddress = edit mode */
  editingAddress: SavedAddress | null;
  open: boolean;
  onClose: () => void;
}

export function AddressFormDialog({ editingAddress, open, onClose }: AddressFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isEdit = editingAddress != null;

  const { mutateAsync: createAddr, isPending: isCreating } = useCreateAddress();
  const { mutateAsync: updateAddr, isPending: isUpdating } = useUpdateAddress();
  const isPending = isCreating || isUpdating;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onTouched',
    defaultValues: {
      label: '', type: 'home', street: '', apt: '', city: '', state: '', zip: '',
      isDefault: false, deliveryInstructions: '',
    },
  });

  /** Open/close the native dialog and populate form */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      if (editingAddress) {
        form.reset({
          label: editingAddress.label,
          type: editingAddress.type as 'home' | 'work' | 'other',
          street: editingAddress.street,
          apt: editingAddress.apt ?? '',
          city: editingAddress.city,
          state: editingAddress.state,
          zip: editingAddress.zip,
          isDefault: editingAddress.isDefault,
          deliveryInstructions: editingAddress.deliveryInstructions ?? '',
        });
      } else {
        form.reset();
      }
      el.showModal();
    } else {
      el.close();
    }
  }, [open, editingAddress, form]);

  /** Close on backdrop click */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSubmit = async (data: AddressFormData) => {
    try {
      if (isEdit) {
        await updateAddr({ id: editingAddress!.id, ...data });
      } else {
        await createAddr(data);
      }
      onClose();
    } catch {
      form.setError('root', { message: 'Failed to save address. Please try again.' });
    }
  };

  const { errors } = form.formState;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={onClose}
      aria-labelledby={titleId}
      className="
        backdrop:bg-black/40 backdrop:backdrop-blur-sm
        rounded-2xl border border-border shadow-xl
        p-0 w-full max-w-lg mx-4
        open:animate-in open:fade-in-0 open:zoom-in-95
      "
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          noValidate
          className="p-5 sm:p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 id={titleId} className="text-lg font-bold">
              {isEdit ? 'Edit Address' : 'Add New Address'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="
                w-8 h-8 min-w-[44px] min-h-[44px]
                flex items-center justify-center rounded-lg
                text-muted-foreground hover:text-foreground hover:bg-muted
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-1
                transition-colors
              "
            >
              ✕
            </button>
          </div>

          {errors.root && (
            <p role="alert" className="text-xs sm:text-sm text-destructive font-medium">
              {errors.root.message}
            </p>
          )}

          {/* Label + Type */}
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <FormField label="Label" error={errors.label?.message} required>
              <input type="text" {...form.register('label')} placeholder="Home" className={INPUT_CLS} />
            </FormField>
            <FormField label="Type" error={errors.type?.message}>
              <select {...form.register('type')} className={INPUT_CLS}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>

          <FormField label="Street Address" error={errors.street?.message} required>
            <input type="text" {...form.register('street')} autoComplete="address-line1" placeholder="123 Main St" className={INPUT_CLS} />
          </FormField>

          <FormField label="Apt / Suite" error={errors.apt?.message}>
            <input type="text" {...form.register('apt')} autoComplete="address-line2" placeholder="Apt 4B" className={INPUT_CLS} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px] gap-3">
            <FormField label="City" error={errors.city?.message} required>
              <input type="text" {...form.register('city')} autoComplete="address-level2" className={INPUT_CLS} />
            </FormField>
            <FormField label="State" error={errors.state?.message} required>
              <input type="text" {...form.register('state')} autoComplete="address-level1" placeholder="NY" maxLength={2} className={INPUT_CLS} />
            </FormField>
            <FormField label="ZIP" error={errors.zip?.message} required>
              <input type="text" {...form.register('zip')} autoComplete="postal-code" inputMode="numeric" maxLength={10} className={INPUT_CLS} />
            </FormField>
          </div>

          <FormField label="Delivery Instructions" error={errors.deliveryInstructions?.message}>
            <textarea {...form.register('deliveryInstructions')} rows={2} maxLength={500} placeholder="Gate code, landmarks…" className={`${INPUT_CLS} resize-y`} />
          </FormField>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...form.register('isDefault')} className="w-5 h-5 rounded accent-primary cursor-pointer" />
            <span className="text-sm">Set as default address</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 min-h-[44px] text-sm font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-60 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors"
            >
              {isPending ? 'Saving…' : isEdit ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </FormProvider>
    </dialog>
  );
}
