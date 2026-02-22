/**
 * @file Register.tsx
 * @app apps/storefront
 *
 * Customer registration page.
 *
 * Fields: firstName, lastName, email, password, confirmPassword
 * Age attestation checkbox (must confirm 21+ — WCAG + regulatory)
 * On success: auto-login + navigate to /
 */

import { Link, useNavigate } from 'react-router-dom';

import { ROUTES } from '../routes';
import { useForm } from 'react-hook-form';
import { useRegister } from '@cannasaas/api-client';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    ageConfirmed: z.literal(true, {
      errorMap: () => ({
        message: 'You must confirm you are 21 or older to register',
      }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { mutate: register_, isPending, error } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data: RegisterValues) => {
    register_(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      },
      { onSuccess: () => navigate(ROUTES.home, { replace: true }) },
    );
  };

  const serverError = error
    ? (error as any)?.response?.data?.error?.code === 'EMAIL_EXISTS'
      ? 'An account with this email already exists'
      : 'Registration failed. Please try again.'
    : null;

  const inputClass = (err: boolean) =>
    [
      'w-full px-3 py-2.5 text-sm border rounded-xl',
      'focus:outline-none focus:ring-1',
      err
        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-stone-200 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]',
    ].join(' ');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900 mt-4">
            Create Account
          </h1>
          <p className="text-stone-500 text-sm mt-1">Must be 21+ to register</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-7 shadow-sm">
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-first"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  First Name *
                </label>
                <input
                  id="reg-first"
                  {...register('firstName')}
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-required="true"
                  aria-invalid={errors.firstName ? 'true' : 'false'}
                  className={inputClass(!!errors.firstName)}
                />
                {errors.firstName && (
                  <p role="alert" className="text-xs text-red-600 mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="reg-last"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Last Name *
                </label>
                <input
                  id="reg-last"
                  {...register('lastName')}
                  type="text"
                  autoComplete="family-name"
                  required
                  aria-required="true"
                  aria-invalid={errors.lastName ? 'true' : 'false'}
                  className={inputClass(!!errors.lastName)}
                />
                {errors.lastName && (
                  <p role="alert" className="text-xs text-red-600 mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Email *
              </label>
              <input
                id="reg-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-pw"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  id="reg-pw"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className={inputClass(!!errors.password) + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide' : 'Show'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none"
                >
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Confirm Password *
              </label>
              <input
                id="reg-confirm"
                {...register('confirmPassword')}
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                aria-required="true"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                className={inputClass(!!errors.confirmPassword)}
              />
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Age attestation — regulatory requirement */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  {...register('ageConfirmed')}
                  type="checkbox"
                  aria-required="true"
                  aria-invalid={errors.ageConfirmed ? 'true' : 'false'}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.3)] cursor-pointer"
                />
                <span className="text-xs text-stone-600 leading-relaxed">
                  I confirm that I am <strong>21 years of age or older</strong>{' '}
                  and agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.ageConfirmed && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {errors.ageConfirmed.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="w-full py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
            >
              {isPending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-center text-stone-500 mt-5">
            Already have an account?{' '}
            <Link
              to={ROUTES.login}
              className="text-[hsl(var(--primary))] font-medium hover:underline focus-visible:outline-none focus-visible:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
