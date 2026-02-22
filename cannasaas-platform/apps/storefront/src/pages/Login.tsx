/**
 * @file Login.tsx
 * @app apps/storefront
 *
 * Customer login page.
 *
 * Form fields: email + password
 * On success: navigate to from (preserved URL) or /
 * On error: show error banner below form
 *
 * Accessibility:
 *   - <main> equivalent label (WCAG 1.3.1)
 *   - All inputs: label + aria-required (WCAG 1.3.5)
 *   - Error: role="alert" (WCAG 4.1.3)
 *   - "Show password" toggle (WCAG 1.4.10)
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@cannasaas/api-client';
import { ROUTES } from '../routes';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from ?? ROUTES.home;

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginValues) => {
    login(data, { onSuccess: () => navigate(from, { replace: true }) });
  };

  const errorMessage = error
    ? (error as any)?.response?.data?.error?.code === 'INVALID_CREDENTIALS'
      ? 'Invalid email or password'
      : 'Sign in failed. Please try again.'
    : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-stone-900 mt-4">Sign In</h1>
          <p className="text-stone-500 text-sm mt-1">Welcome back</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-7 shadow-sm">
          {errorMessage && (
            <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-stone-700 mb-1">
                Email <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={errors.email ? 'true' : 'false'}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
              />
              {errors.email && <p role="alert" className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="login-password" className="text-sm font-medium text-stone-700">
                  Password <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <Link to={ROUTES.forgotPassword} className="text-xs text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary)/0.4)] focus:ring-[hsl(var(--primary)/0.2)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus-visible:outline-none"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="w-full mt-2 py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 transition-all"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center text-stone-500 mt-5">
            Don't have an account?{' '}
            <Link to={ROUTES.register} className="text-[hsl(var(--primary))] font-medium hover:underline focus-visible:outline-none focus-visible:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
