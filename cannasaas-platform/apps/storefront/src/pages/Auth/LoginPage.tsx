// apps/storefront/src/pages/Auth/LoginPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '@cannasaas/utils';
import { Button } from '@cannasaas/ui';
import { useLogin } from '@cannasaas/api-client';
import { useCurrentTenant } from '@cannasaas/stores';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useCurrentTenant();
  const { mutateAsync: login, isPending, error } = useLogin();

  // Return to originally intended page after login
  const from = (location.state as { from?: string })?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch {
      // Set a root-level form error — displayed in a live region
      setError('root', {
        message: 'Invalid email or password. Please try again.',
      });
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg-secondary)]"
      // WCAG 2.4.2: page has a meaningful title (set via Helmet)
    >
      <div className="w-full max-w-md">
        {/* Dispensary branding */}
        {tenant?.brandingConfig?.logoUrl && (
          <img
            src={tenant.brandingConfig.logoUrl}
            alt={`${tenant.dispensaryName} logo`}
            className="mx-auto mb-8 h-12 object-contain"
          />
        )}

        <div
          className={[
            'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--p-shadow-lg)] p-8',
          ].join(' ')}
        >
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-2">
            Sign in
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Welcome back to {tenant?.dispensaryName ?? 'CannaSaas'}
          </p>

          {/* WCAG 4.1.3: Status messages — error is in a live region */}
          {errors.root && (
            <div
              role="alert"
              aria-live="assertive"
              className={[
                'flex items-start gap-3 p-4 mb-6 rounded-[var(--p-radius-md)]',
                'bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]',
                'text-[var(--color-error)] text-[var(--p-text-sm)]',
              ].join(' ')}
            >
              {errors.root.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate // We handle validation ourselves with Zod
            aria-label="Sign in form"
          >
            {/* Email field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
              >
                Email address
                <span
                  className="text-[var(--color-error)] ml-1"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                className={[
                  'w-full h-11 px-4 rounded-[var(--p-radius-md)]',
                  'bg-[var(--color-bg)] border text-[var(--color-text)]',
                  'text-[var(--p-text-base)] placeholder:text-[var(--color-text-disabled)]',
                  'transition-all duration-[var(--p-dur-fast)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                  errors.email
                    ? 'border-[var(--color-error)] bg-red-50/50 dark:bg-red-950/10'
                    : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                ].join(' ')}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field with show/hide toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
                >
                  Password
                  <span
                    className="text-[var(--color-error)] ml-1"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[var(--p-text-sm)] text-[var(--color-brand)] hover:underline focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  aria-invalid={!!errors.password}
                  className={[
                    'w-full h-11 pl-4 pr-12 rounded-[var(--p-radius-md)]',
                    'bg-[var(--color-bg)] border text-[var(--color-text)]',
                    'text-[var(--p-text-base)]',
                    'transition-all duration-[var(--p-dur-fast)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                    errors.password
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                  ].join(' ')}
                  {...register('password')}
                />
                {/* WCAG 2.5.3: show/hide label matches visual button label */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1 rounded"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending || isSubmitting}
              loadingText="Signing in..."
              leftIcon={<LogIn size={18} aria-hidden="true" />}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            New customer?{' '}
            <Link
              to="/auth/register"
              className="text-[var(--color-brand)] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
