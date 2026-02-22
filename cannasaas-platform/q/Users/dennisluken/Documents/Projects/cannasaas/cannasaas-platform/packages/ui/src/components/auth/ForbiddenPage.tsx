/**
 * @file ForbiddenPage.tsx
 * @package @cannasaas/ui
 *
 * Full-page 403 Forbidden component — shown when a user is authenticated
 * but lacks the required role for the requested resource.
 *
 * Distinct from the inline `ForbiddenInline` in ProtectedRoute.tsx:
 *   - This renders as a standalone full-page view (outside the app shell)
 *   - Used for deep-link access attempts where no layout is present
 *
 * Features:
 *   - Updates document.title (WCAG 2.4.2)
 *   - Provides a "Go back" link to navigate away safely
 *   - Shows current user role so the user understands why access was denied
 *   - Includes a "Contact admin" mailto link
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="main" landmark (1.3.1)
 *   - Heading hierarchy: h1 (1.3.1)
 *   - Error conveyed by text not colour alone (1.4.1)
 *   - Links are descriptive (2.4.6)
 *   - document.title updated (2.4.2)
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = '403 Access Denied | CannaSaas';
  }, []);

  const primaryRole = user?.roles?.[0] ?? 'unknown';

  return (
    <main
      role="main"
      className="min-h-screen bg-stone-50 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center">
        {/* Status code — visual only, screen readers get the heading below */}
        <p aria-hidden="true" className="text-8xl font-black text-stone-200 mb-4 select-none">
          403
        </p>

        <h1 className="text-2xl font-extrabold text-stone-900 mb-3">
          Access Denied
        </h1>

        <p className="text-stone-500 mb-2">
          You don't have permission to view this page.
        </p>

        {user && (
          <p className="text-sm text-stone-400 mb-6">
            Logged in as{' '}
            <strong className="text-stone-600">
              {user.firstName} {user.lastName}
            </strong>
            {' '}with role{' '}
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs font-semibold capitalize">
              {primaryRole}
            </span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={[
              'px-5 py-2.5 text-sm font-semibold text-stone-700',
              'border border-stone-200 rounded-xl bg-white',
              'hover:bg-stone-50 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400',
            ].join(' ')}
          >
            ← Go Back
          </button>

          <a
            href="mailto:support@cannasaas.com"
            className={[
              'px-5 py-2.5 text-sm font-semibold',
              'bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl',
              'hover:brightness-110 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))]',
            ].join(' ')}
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
