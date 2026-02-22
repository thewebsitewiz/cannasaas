/**
 * @file Login.tsx
 * @app apps/storefront
 *
 * Customer login page for the storefront.
 *
 * ── Auth flow ────────────────────────────────────────────────────────────────
 *
 * 1. User submits email + password
 * 2. useLogin() mutation calls POST /auth/login
 * 3. On success: authStore.login(user, accessToken, refreshToken)
 * 4. Redirect to location.state.from (the page they came from) or /products
 *
 * The `location.state.from` pattern is set by ProtectedRoute when it
 * redirects an unauthenticated user, so after login they land exactly
 * where they tried to go (e.g. /checkout).
 *
 * ── Component breakdown ──────────────────────────────────────────────────────
 *
 *   <StorefrontLogin>
 *     <LoginLayout>          Brand panel + form panel (two-column on md+)
 *       <BrandPanel>         Dispensary logo, name, tagline (left side, md+)
 *       <LoginFormPanel>     Email/password form + social links + register CTA
 *         <EmailField>       Reusable labelled input
 *         <PasswordField>    Password with show/hide toggle
 *         <LoginError>       Error message with role="alert"
 *
 * Accessibility (WCAG 2.1 AA):
 *   - All inputs have explicit <label> elements (1.3.5)
 *   - Error: role="alert" aria-live="assertive" (4.1.3)
 *   - Submit: aria-busy during request (4.1.2)
 *   - Password toggle: aria-label describes action (4.1.2)
 *   - Form: noValidate + custom validation messaging (3.3.1)
 *   - document.title updated (2.4.2)
 *   - Link to register: descriptive text (2.4.6)
 */

import { useState, useEffect, useId } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import { useLogin } from '@cannasaas/api-client';

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Left/top brand panel — dispensary identity on the login page.
 * Hidden on mobile (stacked layout), visible on md+ (side-by-side).
 */
function BrandPanel({ name, logoUrl }: { name: string; logoUrl?: string }) {
  return (
    <div
      aria-hidden="true"                                  // Decorative — screen readers focus on the form
      className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--primary,154_40%_30%))] to-[hsl(var(--primary,154_40%_20%))] p-10 text-white rounded-l-3xl"
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" className="h-20 w-auto object-contain mb-6" loading="eager" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl mb-6">🌿</div>
      )}
      <h2 className="text-2xl font-extrabold text-center mb-2">{name}</h2>
      <p className="text-white/70 text-sm text-center max-w-xs leading-relaxed">
        Premium cannabis products, curated for your well-being.
        Shop with confidence — every product is lab-tested.
      </p>
      {/* Decorative dots pattern */}
      <div className="mt-10 flex gap-2 opacity-30">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-white" />
        ))}
      </div>
    </div>
  );
}

/**
 * Labelled email input — reusable across auth pages.
 */
function EmailField({
  id, value, onChange, error,
}: { id: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-stone-700 mb-1.5">
        Email Address
      </label>
      <input
        id={id}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="username"
        placeholder="you@example.com"
        className={[
          'w-full px-4 py-3 text-sm border rounded-xl bg-white',
          'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)] focus:border-[hsl(var(--primary,154_40%_30%)/0.5)]',
          'placeholder:text-stone-300 transition-shadow',
          error ? 'border-red-400 bg-red-50' : 'border-stone-200',
        ].join(' ')}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/**
 * Labelled password input with show/hide toggle.
 */
function PasswordField({
  id, value, onChange, label = 'Password', autoComplete = 'current-password',
}: {
  id:           string;
  value:        string;
  onChange:     (v: string) => void;
  label?:       string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-stone-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          aria-required="true"
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={[
            'w-full px-4 py-3 pr-12 text-sm border border-stone-200 rounded-xl bg-white',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)] focus:border-[hsl(var(--primary,154_40%_30%)/0.5)]',
            'placeholder:text-stone-300 transition-shadow',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 transition-colors"
        >
          <span aria-hidden="true">{visible ? '🙈' : '👁️'}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Inline error banner — shown when the login mutation fails.
 */
function LoginError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
    >
      <span aria-hidden="true" className="text-base flex-shrink-0">⚠️</span>
      <p>{message}</p>
    </div>
  );
}

// ── StorefrontLogin (main export) ─────────────────────────────────────────────

export function StorefrontLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const emailId    = useId();
  const passwordId = useId();

  const navigate          = useNavigate();
  const location          = useLocation();
  const { login }         = useAuthStore();
  const { organization }  = useOrganizationStore();
  const { mutate: loginMutation, isPending, error } = useLogin();

  const dispensaryName = organization?.name ?? 'CannaSaas';
  const logoUrl        = organization?.resolvedBranding?.logoUrl;

  useEffect(() => {
    document.title = `Sign In | ${dispensaryName}`;
  }, [dispensaryName]);

  // Where to go after successful login — defaults to /products
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/products';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation(
      { email, password },
      {
        onSuccess: ({ user, accessToken, refreshToken }) => {
          login(user, accessToken, refreshToken);
          navigate(from, { replace: true });
        },
      },
    );
  };

  const errorMessage = error
    ? 'Invalid email or password. Please check your credentials and try again.'
    : null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-[1fr_1.4fr]">

        {/* Brand panel (md+ left column) */}
        <BrandPanel name={dispensaryName} logoUrl={logoUrl} />

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile brand header (shown only on small screens) */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div aria-hidden="true" className="w-10 h-10 rounded-xl bg-[hsl(var(--primary,154_40%_30%))] flex items-center justify-center text-white text-lg">
              🌿
            </div>
            <p className="text-sm font-bold text-stone-800">{dispensaryName}</p>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 mb-1">Welcome back</h1>
          <p className="text-sm text-stone-400 mb-7">Sign in to your account to continue</p>

          {errorMessage && <LoginError message={errorMessage} />}

          <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-5">
            <EmailField id={emailId} value={email} onChange={setEmail} />
            <PasswordField id={passwordId} value={password} onChange={setPassword} />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded text-[hsl(var(--primary,154_40%_30%))] focus:ring-[hsl(var(--primary,154_40%_30%))]" />
                <span className="text-stone-500">Keep me signed in</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[hsl(var(--primary,154_40%_30%))] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending || !email || !password}
              aria-busy={isPending}
              className={[
                'w-full py-3.5 rounded-xl text-sm font-bold transition-all',
                'bg-[hsl(var(--primary,154_40%_30%))] text-white',
                'hover:brightness-110 active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-2',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
              ].join(' ')}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span aria-hidden="true" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-stone-500">
            New customer?{' '}
            <Link
              to="/register"
              className="font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
