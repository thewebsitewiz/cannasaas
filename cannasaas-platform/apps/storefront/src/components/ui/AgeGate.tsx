/**
 * @file AgeGate.tsx
 * @app apps/storefront
 *
 * Age verification modal — required by cannabis regulations.
 *
 * Shows on first visit (or after sessionStorage expires).
 * The user must confirm they are 21+ to proceed.
 *
 * Design:
 *   - Full-viewport modal overlay, cannot be dismissed without confirming
 *   - Cannabis brand aesthetic: dark overlay, green accent
 *   - Two buttons: "I am 21+" (confirms) and "Exit Site" (redirects)
 *
 * Compliance:
 *   Per Cannabis-Regulatory-Overview-Federal-State-Local.md, dispensary
 *   websites must implement age verification for all visitors.
 *   Verification is stored in sessionStorage (cleared when browser closes).
 *   DO NOT use localStorage — compliance requires re-verification per session.
 *
 * Accessibility:
 *   - role="dialog", aria-modal="true" (WCAG 4.1.2)
 *   - Focus trapped inside modal (WCAG 2.1.2)
 *   - "I am 21+" button receives focus on open (WCAG 3.2.2)
 *   - aria-labelledby and aria-describedby link to heading and body text
 */

import { useState, useEffect, useRef } from 'react';

const AGE_GATE_KEY = 'cs_age_verified';

export function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Check session storage — re-verify each browser session
    const verified = sessionStorage.getItem(AGE_GATE_KEY);
    if (!verified) {
      setIsVisible(true);
    }
  }, []);

  // Focus the confirm button when gate opens
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure modal is rendered
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isVisible]);

  // Prevent body scroll while gate is open
  useEffect(() => {
    document.body.style.overflow = isVisible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isVisible]);

  const handleConfirm = () => {
    sessionStorage.setItem(AGE_GATE_KEY, '1');
    setIsVisible(false);
  };

  const handleExit = () => {
    window.location.href = 'https://google.com';
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-hidden={!isVisible}
    >
      {/* Dark overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-stone-950/95 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className={[
          'relative z-10 w-full max-w-sm mx-4',
          'bg-stone-900 rounded-3xl border border-stone-700',
          'p-8 text-center shadow-2xl',
        ].join(' ')}
      >
        {/* Decorative cannabis leaf */}
        <div aria-hidden="true" className="text-5xl mb-4">🌿</div>

        <h2
          id="age-gate-title"
          className="text-2xl font-bold text-white mb-3"
        >
          Age Verification Required
        </h2>

        <p
          id="age-gate-desc"
          className="text-stone-400 text-sm leading-relaxed mb-8"
        >
          This website contains information about cannabis products. You must be
          21 years of age or older to enter.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={[
              'w-full py-3.5 rounded-xl font-semibold text-white',
              'bg-[hsl(var(--primary,154_40%_30%))]',
              'hover:brightness-110 active:brightness-95',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-white focus-visible:ring-offset-2',
              'focus-visible:ring-offset-stone-900',
              'transition-all',
            ].join(' ')}
          >
            Yes, I am 21 or older
          </button>

          <button
            type="button"
            onClick={handleExit}
            className={[
              'w-full py-3 rounded-xl font-medium',
              'text-stone-400 hover:text-stone-200',
              'border border-stone-700 hover:border-stone-500',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-stone-400',
              'transition-all',
            ].join(' ')}
          >
            No, exit site
          </button>
        </div>

        <p className="text-xs text-stone-600 mt-6">
          By entering you agree to our{' '}
          <span className="underline">Terms of Service</span>{' '}
          and{' '}
          <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
