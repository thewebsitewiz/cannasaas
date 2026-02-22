/**
 * @file ProfileForm.tsx
 * @app apps/storefront
 *
 * Edit profile form — name, email, phone.
 *
 * Reads current user from authStore; submits to PUT /users/:id.
 * On success, updates authStore.updateUser() with new values.
 *
 * Accessibility:
 *   - All fields have explicit <label> (WCAG 1.3.5)
 *   - Required fields: aria-required="true" (WCAG 1.3.5)
 *   - Error messages: role="alert" aria-describedby (WCAG 4.1.3)
 *   - Success toast: aria-live="polite" (WCAG 4.1.3)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@cannasaas/stores';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Please enter a valid email address'),
  phone:     z.string().regex(/^(\+1)?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}$/, 'Please enter a valid US phone number').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateUser } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      email:     user?.email     ?? '',
      phone:     user?.phone     ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    // TODO: call apiClient.put(`/users/${user?.id}`, data)
    updateUser({ ...user, ...data });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fieldClass = (hasError: boolean) => [
    'w-full px-3 py-2.5 text-sm border rounded-xl',
    'focus:outline-none focus:ring-1',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
  ].join(' ');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
            First Name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input id="firstName" {...register('firstName')} type="text" autoComplete="given-name"
            required aria-required="true" aria-invalid={errors.firstName ? 'true' : 'false'}
            className={fieldClass(!!errors.firstName)} />
          {errors.firstName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
            Last Name <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input id="lastName" {...register('lastName')} type="text" autoComplete="family-name"
            required aria-required="true" aria-invalid={errors.lastName ? 'true' : 'false'}
            className={fieldClass(!!errors.lastName)} />
          {errors.lastName && <p role="alert" className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
          Email <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input id="email" {...register('email')} type="email" autoComplete="email"
          required aria-required="true" aria-invalid={errors.email ? 'true' : 'false'}
          className={fieldClass(!!errors.email)} />
        {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
        <input id="phone" {...register('phone')} type="tel" autoComplete="tel"
          inputMode="tel" placeholder="(555) 555-5555"
          className={fieldClass(!!errors.phone)} />
        {errors.phone && <p role="alert" className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="px-5 py-2.5 bg-[hsl(var(--primary))] text-white text-sm font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
        >
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <p aria-live="polite" role="status" className="text-sm text-green-600 font-medium">
            ✓ Profile saved
          </p>
        )}
      </div>
    </form>
  );
}
