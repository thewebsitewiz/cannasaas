// apps/storefront/src/components/AgeGate/AgeGate.tsx
import React, { useState, useEffect, type ReactNode } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useCurrentTenant } from '@cannasaas/stores';

interface AgeGateProps { children: ReactNode; }

const SESSION_KEY = 'cannasaas-age-verified';

/**
 * AgeGate - Full-page interstitial before any cannabis content.
 * WCAG: 1.3.1 dialog+aria-modal, 2.1.1 keyboard/Escape prevention, 2.4.3 autoFocus.
 * Compliance: sessionStorage only (re-verifies each browser session).
 */
export function AgeGate({ children }: AgeGateProps) {
  const tenant = useCurrentTenant();
  const [isVerified, setIsVerified] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsVerified(sessionStorage.getItem(SESSION_KEY) === 'true');
    setIsChecking(false);
  }, []);

  const handleConfirm = () => { sessionStorage.setItem(SESSION_KEY, 'true'); setIsVerified(true); };
  const handleDeny = () => { setIsDenied(true); window.location.href = 'https://www.google.com'; };

  if (isChecking) return null;
  if (isVerified) return <>{children}</>;

  if (isDenied) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center p-6" role="status" aria-live="polite">
        <p className="text-[var(--color-text-secondary)] text-center">
          We're sorry. You must be 21 or older to access this site.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-50" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-6 focus:outline-none"
        onKeyDown={(e) => { if (e.key === 'Escape') e.preventDefault(); }}
      >
        <div className={[
          'w-full max-w-md text-center',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-lg)]',
          'p-8 md:p-10',
        ].join(' ')}>
          {tenant?.brandingConfig?.logoUrl ? (
            <img src={tenant.brandingConfig.logoUrl} alt={`${tenant.dispensaryName} logo`} className="mx-auto mb-6 h-14 object-contain" />
          ) : (
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center" aria-hidden="true">
              <Shield className="w-8 h-8 text-[var(--color-brand)]" aria-hidden="true" />
            </div>
          )}
          <h1 id="age-gate-title" className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-3" tabIndex={-1}>
            Age Verification Required
          </h1>
          <p id="age-gate-desc" className="text-[var(--color-text-secondary)] text-[var(--p-text-base)] mb-2">
            {tenant?.dispensaryName ?? 'This website'} sells cannabis products.
            You must be <strong>21 years of age or older</strong> to enter.
          </p>
          <p className="text-[var(--color-text-secondary)] text-[var(--p-text-sm)] mb-8">
            By clicking "I am 21 or Older" you confirm you are of legal age to purchase cannabis in your
            jurisdiction and agree to our{' '}
            <a href="/terms" className="text-[var(--color-brand)] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[var(--color-brand)] hover:underline">Privacy Policy</a>.
          </p>
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[var(--p-radius-md)] p-3 mb-6 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[var(--p-text-xs)] text-amber-700 dark:text-amber-400">
              Cannabis products have intoxicating effects. Keep out of reach of children. For use by adults 21 and older only.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={handleConfirm} autoFocus>
              I am 21 or Older
            </Button>
            <Button variant="outline" size="lg" fullWidth onClick={handleDeny}>
              I am Under 21
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
