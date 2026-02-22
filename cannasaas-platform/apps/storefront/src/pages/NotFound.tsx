/**
 * @file NotFound.tsx
 * @app apps/storefront
 *
 * 404 Not Found page.
 * Shown by the * catch-all route in App.tsx.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useEffect } from 'react';

export function NotFoundPage() {
  useEffect(() => {
    document.title = '404 — Page Not Found | CannaSaas';
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-black text-stone-200 mb-4" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Page Not Found</h1>
      <p className="text-stone-500 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white font-semibold text-sm rounded-xl hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
