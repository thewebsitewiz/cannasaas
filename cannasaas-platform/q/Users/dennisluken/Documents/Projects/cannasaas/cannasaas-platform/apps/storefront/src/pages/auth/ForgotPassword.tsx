/**
 * @file ForgotPassword.tsx
 * @app apps/storefront
 *
 * Password reset request page.
 *
 * ── Flow ─────────────────────────────────────────────────────────────────────
 *
 * 1. User enters email address
 * 2. POST /auth/forgot-password { email }
 * 3. On success (200 or 404 — same response to prevent user enumeration):
 *    → show "Check your email" confirmation screen
 *    → never reveal whether the email exists in the system
 *
 * ── Security note ────────────────────────────────────────────────────────────
 *
 * The API returns 200 regardless of whether the email exists (anti-enumeration).
 * The UI always shows the confirmation state after submission, so an attacker
 * cannot tell if an email is registered by observing the response.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Single focused form, one input (1.3.1)
 *   - Success state: role="status" aria-live (4.1.3)
 *   - document.title updated per state (2.4.2)
 *   - Return to login: descriptive link (2.4.6)
 */

import { useState, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationStore } from '@cannasaas/stores';
import { apiClient } from '@cannasaas/api-client';

export function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const emailId = useId();
  const { organization } = useOrganizationStore();
  const dispensaryName = organization?.name ?? 'CannaSaas';

  useEffect(() => {
    document.title = submitted ? 'Check Your Email | ' + dispensaryName : 'Reset Password | ' + dispensaryName;
  }, [submitted, dispensaryName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Fire and forget — we always show the confirmation regardless of outcome
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Intentionally swallow — anti-enumeration pattern
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center"
          role="status" aria-live="polite">
          <span aria-hidden="true" className="text-5xl block mb-4">📧</span>
          <h1 className="text-2xl font-extrabold text-stone-900 mb-2">Check your inbox</h1>
          <p className="text-stone-500 text-sm mb-2">
            If an account exists for <strong className="text-stone-700">{email}</strong>,
            you'll receive a password reset link within a few minutes.
          </p>
          <p className="text-stone-400 text-xs mb-8">
            Don't see it? Check your spam folder.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <span aria-hidden="true" className="text-4xl block mb-4">🔑</span>
          <h1 className="text-2xl font-extrabold text-stone-900 mb-1">Forgot your password?</h1>
          <p className="text-sm text-stone-400">
            Enter your email and we'll send you a reset link.
          </p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor={emailId} className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address</label>
            <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required aria-required="true" autoComplete="email"
              placeholder="jane@example.com"
              className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)] placeholder:text-stone-300" />
          </div>
          <button type="submit" disabled={loading || !email} aria-busy={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-[hsl(var(--primary,154_40%_30%))] text-white hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all active:scale-[0.98]">
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-stone-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
