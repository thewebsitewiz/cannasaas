/**
 * @file Register.tsx
 * @app apps/storefront
 *
 * New customer registration page for the storefront.
 *
 * ── Registration flow ─────────────────────────────────────────────────────────
 *
 * 1. User fills in first name, last name, email, password, confirm password
 * 2. Client-side validation (password match, length, email format)
 * 3. useRegister() mutation calls POST /auth/register
 * 4. On success: authStore.login() + navigate to /products
 * 5. On error: inline error message
 *
 * ── Component breakdown ───────────────────────────────────────────────────────
 *
 *   <RegisterPage>
 *     <NameRow>          First name + last name side by side
 *     <EmailField>       (reused from Login pattern)
 *     <PasswordField>    New password with strength indicator
 *     <ConfirmField>     Confirm password with match validation
 *     <TermsCheckbox>    Must agree before submitting
 *     <RegisterError>    role="alert" error banner
 *
 * Accessibility (WCAG 2.1 AA):
 *   - All inputs labelled (1.3.5), grouped by fieldset where logical (1.3.1)
 *   - Password strength: text description not colour alone (1.4.1)
 *   - Error: role="alert" (4.1.3)
 *   - aria-describedby links inputs to requirement hints (1.3.1)
 *   - document.title updated (2.4.2)
 */

import { useState, useEffect, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import { useRegister } from '@cannasaas/api-client';

// ── Password strength scorer ──────────────────────────────────────────────────

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

function scorePassword(pw: string): StrengthLevel {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; bars: number; colour: string }> = {
  weak:   { label: 'Weak',   bars: 1, colour: 'bg-red-400'    },
  fair:   { label: 'Fair',   bars: 2, colour: 'bg-amber-400'  },
  good:   { label: 'Good',   bars: 3, colour: 'bg-yellow-400' },
  strong: { label: 'Strong', bars: 4, colour: 'bg-green-500'  },
};

/**
 * Password strength meter — 4 segment bars with text label.
 * Uses both colour AND text so colour-blind users can read the strength (WCAG 1.4.1).
 */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const level  = scorePassword(password);
  const config = STRENGTH_CONFIG[level];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1 mb-1" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 flex-1 rounded-full transition-all',
              i < config.bars ? config.colour : 'bg-stone-200',
            ].join(' ')}
          />
        ))}
      </div>
      <p className="text-xs text-stone-500">
        Password strength: <span className="font-semibold text-stone-700">{config.label}</span>
      </p>
    </div>
  );
}

// ── RegisterPage ──────────────────────────────────────────────────────────────

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [agreedToTerms, setAgreed] = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const firstId    = useId();
  const lastId     = useId();
  const emailId    = useId();
  const passwordId = useId();
  const confirmId  = useId();
  const termsId    = useId();

  const navigate           = useNavigate();
  const { login }          = useAuthStore();
  const { organization }   = useOrganizationStore();
  const { mutate: register, isPending, error } = useRegister();

  const dispensaryName = organization?.name ?? 'CannaSaas';

  useEffect(() => {
    document.title = `Create Account | ${dispensaryName}`;
  }, [dispensaryName]);

  // Client-side validation before submitting
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim())  errs.lastName  = 'Last name is required.';
    if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email address.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    if (!agreedToTerms) errs.terms = 'You must agree to the terms to continue.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    register(
      { firstName, lastName, email, password },
      {
        onSuccess: ({ user, accessToken, refreshToken }) => {
          login(user, accessToken, refreshToken);
          navigate('/products', { replace: true });
        },
      },
    );
  };

  const inputCls = (err?: string) => [
    'w-full px-4 py-3 text-sm border rounded-xl bg-white',
    'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)]',
    'placeholder:text-stone-300 transition-shadow',
    err ? 'border-red-400 bg-red-50' : 'border-stone-200',
  ].join(' ');

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary,154_40%_30%))] text-white text-2xl flex items-center justify-center mx-auto mb-4">🌿</div>
          <h1 className="text-2xl font-extrabold text-stone-900 mb-1">Create your account</h1>
          <p className="text-sm text-stone-400">{dispensaryName}</p>
        </div>

        {/* API error */}
        {error && (
          <div role="alert" aria-live="assertive"
            className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span aria-hidden="true">⚠️</span>
            <p>Registration failed. That email may already be in use.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name row */}
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Your full name</legend>
            <div>
              <label htmlFor={firstId} className="block text-sm font-semibold text-stone-700 mb-1.5">First Name</label>
              <input id={firstId} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                required aria-required="true" aria-invalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? `${firstId}-err` : undefined}
                autoComplete="given-name" placeholder="Jane" className={inputCls(fieldErrors.firstName)} />
              {fieldErrors.firstName && <p id={`${firstId}-err`} role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor={lastId} className="block text-sm font-semibold text-stone-700 mb-1.5">Last Name</label>
              <input id={lastId} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                required aria-required="true" aria-invalid={!!fieldErrors.lastName}
                aria-describedby={fieldErrors.lastName ? `${lastId}-err` : undefined}
                autoComplete="family-name" placeholder="Smith" className={inputCls(fieldErrors.lastName)} />
              {fieldErrors.lastName && <p id={`${lastId}-err`} role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>}
            </div>
          </fieldset>

          {/* Email */}
          <div>
            <label htmlFor={emailId} className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address</label>
            <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required aria-required="true" aria-invalid={!!fieldErrors.email}
              autoComplete="email" placeholder="jane@example.com" className={inputCls(fieldErrors.email)} />
            {fieldErrors.email && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor={passwordId} className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
            <div className="relative">
              <input id={passwordId} type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} required aria-required="true"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={`${passwordId}-hint`}
                autoComplete="new-password" placeholder="Min. 8 characters" className={inputCls(fieldErrors.password) + ' pr-12'} />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400">
                <span aria-hidden="true">{showPw ? '🙈' : '👁️'}</span>
              </button>
            </div>
            <p id={`${passwordId}-hint`} className="sr-only">Password must be at least 8 characters</p>
            {fieldErrors.password && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            <PasswordStrength password={password} />
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor={confirmId} className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm Password</label>
            <input id={confirmId} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required aria-required="true" aria-invalid={!!fieldErrors.confirm}
              autoComplete="new-password" placeholder="Re-enter password" className={inputCls(fieldErrors.confirm)} />
            {fieldErrors.confirm && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.confirm}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input id={termsId} type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreed(e.target.checked)}
              aria-invalid={!!fieldErrors.terms}
              className="w-4 h-4 rounded mt-0.5 text-[hsl(var(--primary,154_40%_30%))] focus:ring-[hsl(var(--primary,154_40%_30%))]" />
            <label htmlFor={termsId} className="text-sm text-stone-500 cursor-pointer leading-relaxed">
              I am 21 or older and agree to the{' '}
              <a href="/terms" className="text-[hsl(var(--primary,154_40%_30%))] font-semibold hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-[hsl(var(--primary,154_40%_30%))] font-semibold hover:underline">Privacy Policy</a>
            </label>
          </div>
          {fieldErrors.terms && <p role="alert" className="text-xs text-red-600">{fieldErrors.terms}</p>}

          <button type="submit" disabled={isPending} aria-busy={isPending}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-[hsl(var(--primary,154_40%_30%))] text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-2 transition-all active:scale-[0.98]">
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
