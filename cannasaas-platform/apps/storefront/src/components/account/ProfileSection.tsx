/**
 * ═══════════════════════════════════════════════════════════════════
 * ProfileSection — User Profile Editing
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/ProfileSection.tsx
 *
 * Route: /account (index route)
 *
 * Editable profile form backed by React Hook Form + Zod. Fetches
 * the current user via GET /users/me and submits changes via
 * PUT /users/me. Fields: first name, last name, email (read-only),
 * phone, date of birth, and medical card info.
 *
 * ─── FORM PATTERN ──────────────────────────────────────────────
 *
 *   Uses useForm with defaultValues populated from the API response.
 *   The form starts in a "view" mode (fields are read-only). The
 *   "Edit Profile" button switches to edit mode. Save submits via
 *   PUT /users/me. Cancel resets to server values.
 *
 * ─── DATA FROM PROJECT GUIDE ───────────────────────────────────
 *
 *   GET /users/me → { profile: { firstName, lastName, displayName,
 *     avatar, dateOfBirth, medicalCard }, email, phone }
 *
 *   PUT /users/me → { profile: { firstName, phone, ... },
 *     preferences: { ... } }
 *
 * Accessibility (WCAG):
 *   - All inputs via FormField (label, aria-invalid, describedby)
 *   - Read-only mode: inputs have aria-readonly (4.1.2)
 *   - Email: disabled + aria-disabled + helper text (4.1.2)
 *   - Medical card section: <fieldset>/<legend> (1.3.1)
 *   - Success toast: role="status" (4.1.3)
 *   - focus-visible rings (2.4.7)
 *   - Touch targets ≥ 44px (2.5.8)
 *
 * Responsive:
 *   - Single column mobile, 2-column sm+ for name fields
 *   - Avatar section: centered mobile, left-aligned sm+
 */

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCurrentUser, useUpdateProfile } from '@cannasaas/api-client';
import { FormField } from '@/components/checkout/FormField';

const INPUT_CLS = 'w-full px-3 py-2.5 min-h-[44px] text-sm bg-background border border-border rounded-lg placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors';
const INPUT_RO_CLS = `${INPUT_CLS} bg-muted/50 cursor-default`;

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^\+?[\d\s-()]{7,}$/, 'Valid phone number required').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  medicalCardNumber: z.string().optional(),
  medicalCardState: z.string().optional(),
  medicalCardExpiry: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSection() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      medicalCardNumber: '',
      medicalCardState: '',
      medicalCardExpiry: '',
    },
  });

  /** Populate form when user data arrives */
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.profile.firstName ?? '',
        lastName: user.profile.lastName ?? '',
        phone: user.phone ?? '',
        dateOfBirth: user.profile.dateOfBirth ?? '',
        medicalCardNumber: user.profile.medicalCard?.number ?? '',
        medicalCardState: user.profile.medicalCard?.state ?? '',
        medicalCardExpiry: user.profile.medicalCard?.expirationDate ?? '',
      });
    }
  }, [user, form]);

  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth || undefined,
          medicalCard: data.medicalCardNumber
            ? {
                number: data.medicalCardNumber,
                state: data.medicalCardState,
                expirationDate: data.medicalCardExpiry,
              }
            : undefined,
        },
        phone: data.phone || undefined,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      form.setError('root', { message: 'Failed to save. Please try again.' });
    }
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-busy="true">
        <div className="h-8 w-40 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-11 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading profile…</span>
      </div>
    );
  }

  const { errors } = form.formState;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} noValidate>
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Profile</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your personal information.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="
                px-4 py-2 min-h-[44px]
                text-sm font-medium text-primary
                border border-primary rounded-lg
                hover:bg-primary/5
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-1
                transition-colors
              "
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="
                  px-4 py-2 min-h-[44px]
                  text-sm font-medium text-muted-foreground
                  border border-border rounded-lg
                  hover:bg-muted
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary focus-visible:ring-offset-1
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="
                  px-4 py-2 min-h-[44px]
                  text-sm font-semibold text-primary-foreground
                  bg-primary rounded-lg
                  disabled:opacity-60
                  hover:bg-primary/90
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-primary focus-visible:ring-offset-1
                  transition-colors
                "
              >
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Success message */}
        {saveSuccess && (
          <div role="status" className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
            ✓ Profile updated successfully.
          </div>
        )}

        {/* Root error */}
        {errors.root && (
          <div role="alert" className="mb-4 px-4 py-2.5 bg-destructive/5 border border-destructive/30 rounded-lg text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        {/* ── Avatar ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center text-2xl sm:text-3xl overflow-hidden flex-shrink-0">
            {user?.profile.avatar ? (
              <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">👤</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base">
              {user?.profile.firstName} {user?.profile.lastName}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
            {user?.loyalty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                ⭐ {user.loyalty.tier} Member
              </span>
            )}
          </div>
        </div>

        {/* ── Personal Info ── */}
        <fieldset className="space-y-4 mb-8">
          <legend className="text-sm font-semibold mb-3">Personal Information</legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.firstName?.message} required>
              <input
                type="text"
                {...form.register('firstName')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                autoComplete="given-name"
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>

            <FormField label="Last Name" error={errors.lastName?.message} required>
              <input
                type="text"
                {...form.register('lastName')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                autoComplete="family-name"
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>
          </div>

          <FormField label="Email" description="Contact support to change your email address.">
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              aria-disabled="true"
              className={`${INPUT_RO_CLS} opacity-60`}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone" error={errors.phone?.message}>
              <input
                type="tel"
                {...form.register('phone')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>

            <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
              <input
                type="date"
                {...form.register('dateOfBirth')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                autoComplete="bday"
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>
          </div>
        </fieldset>

        {/* ── Medical Card ── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold mb-3">Medical Card (Optional)</legend>
          <p className="text-xs text-muted-foreground -mt-2 mb-3">
            Verified medical card holders may receive tax exemptions and access to higher purchase limits.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Card Number" error={errors.medicalCardNumber?.message}>
              <input
                type="text"
                {...form.register('medicalCardNumber')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                placeholder="MED-12345"
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>

            <FormField label="Issuing State" error={errors.medicalCardState?.message}>
              <input
                type="text"
                {...form.register('medicalCardState')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                placeholder="NY"
                maxLength={2}
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>

            <FormField label="Expiration" error={errors.medicalCardExpiry?.message}>
              <input
                type="date"
                {...form.register('medicalCardExpiry')}
                readOnly={!isEditing}
                aria-readonly={!isEditing || undefined}
                className={isEditing ? INPUT_CLS : INPUT_RO_CLS}
              />
            </FormField>
          </div>

          {user?.profile.medicalCard?.verified && (
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span aria-hidden="true">✓</span> Verified
            </p>
          )}
        </fieldset>
      </form>
    </FormProvider>
  );
}
