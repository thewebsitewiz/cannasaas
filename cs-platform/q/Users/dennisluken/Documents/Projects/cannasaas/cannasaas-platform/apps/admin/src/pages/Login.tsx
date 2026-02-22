/**
 * @file Login.tsx
 * @app apps/admin
 *
 * Admin portal login page.
 *
 * ── Differences from storefront login ────────────────────────────────────────
 *
 * - Accepts admin, manager, owner, or super_admin roles only.
 *   If a customer account logs in, they are redirected back to login with
 *   an "Insufficient privileges" error. Role validation happens client-side
 *   after the login mutation succeeds; the backend still enforces roles on
 *   every API request.
 *
 * - No "Create account" link — admin accounts are provisioned by admins.
 *
 * - "Forgot password" still available (same backend endpoint).
 *
 * - Two-column layout: left dark brand panel + right form (desktop only).
 *
 * Accessibility (WCAG 2.1 AA):
 *   - All inputs labelled (1.3.5)
 *   - Error: role="alert" aria-live="assertive" (4.1.3)
 *   - Submit: aria-busy (4.1.2)
 *   - document.title updated (2.4.2)
 */

import { useState, useEffect, useId } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
import { useLogin } from '@cannasaas/api-client';

// Roles that may access the admin portal
const ADMIN_ROLES = new Set(['super_admin', 'owner', 'admin', 'manager']);

export function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [roleError, setRoleError] = useState(false);

  const emailId    = useId();
  const passwordId = useId();

  const navigate         = useNavigate();
  const location         = useLocation();
  const { login }        = useAuthStore();
  const { organization } = useOrganizationStore();
  const { mutate: loginMutation, isPending, error: apiError } = useLogin();

  const dispensaryName = organization?.name ?? 'CannaSaas';

  useEffect(() => {
    document.title = `Admin Sign In | ${dispensaryName}`;
  }, [dispensaryName]);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(false);
    loginMutation(
      { email, password },
      {
        onSuccess: ({ user, accessToken, refreshToken }) => {
          // Client-side role check — gate admin portal to appropriate roles
          const hasAccess = (user.roles ?? []).some((r) => ADMIN_ROLES.has(r));
          if (!hasAccess) {
            setRoleError(true);
            return;
          }
          login(user, accessToken, refreshToken);
          navigate(from, { replace: true });
        },
      },
    );
  };

  const errorMsg = roleError
    ? 'This account does not have access to the admin portal. Contact your administrator.'
    : apiError
    ? 'Invalid email or password.'
    : null;

  const inputCls = 'w-full px-4 py-3 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)] placeholder:text-stone-300 transition-shadow';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-[1fr_1.4fr]">

        {/* Dark brand panel */}
        <div aria-hidden="true"
          className="hidden md:flex flex-col items-center justify-center bg-stone-900 p-10 text-white rounded-l-3xl">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--primary,154_40%_30%))] flex items-center justify-center text-3xl mb-6">🌿</div>
          <h2 className="text-xl font-extrabold text-center mb-2">{dispensaryName}</h2>
          <p className="text-stone-400 text-xs text-center">Admin Portal</p>
          <div className="mt-8 w-full border-t border-stone-800 pt-6 space-y-2 text-xs text-stone-500">
            <p>✓ Product & inventory management</p>
            <p>✓ Order lifecycle + compliance logs</p>
            <p>✓ Analytics & revenue insights</p>
            <p>✓ Staff & settings administration</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-base">🌿</div>
            <div>
              <p className="text-xs font-bold text-stone-900">{dispensaryName}</p>
              <p className="text-[10px] text-stone-400">Admin Portal</p>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 mb-1">Admin Sign In</h1>
          <p className="text-sm text-stone-400 mb-7">Authorised personnel only</p>

          {errorMsg && (
            <div role="alert" aria-live="assertive"
              className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span aria-hidden="true">⚠️</span><p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor={emailId} className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required aria-required="true" autoComplete="username"
                placeholder="admin@dispensary.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor={passwordId} className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <input id={passwordId} type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required aria-required="true"
                  autoComplete="current-password" placeholder="••••••••" className={inputCls + ' pr-12'} />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400">
                  <span aria-hidden="true">{showPw ? '🙈' : '👁️'}</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-semibold text-[hsl(var(--primary,154_40%_30%))] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] rounded">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={isPending || !email || !password} aria-busy={isPending}
              className="w-full py-3.5 rounded-xl text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-700 focus-visible:ring-offset-2 transition-all active:scale-[0.98]">
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
