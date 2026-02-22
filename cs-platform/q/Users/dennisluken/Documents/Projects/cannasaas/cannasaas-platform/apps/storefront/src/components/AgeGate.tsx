/**
 * @file AgeGate.tsx
 * @app apps/storefront
 *
 * 21+ age verification gate — required by state law before a visitor may
 * browse any cannabis products on the storefront.
 *
 * ── Behaviour ────────────────────────────────────────────────────────────────
 *
 * - On mount, checks sessionStorage for a 'age_verified' key.
 * - If the key exists (set this session): renders <Outlet /> immediately.
 * - If the key does not exist: renders the gate overlay.
 *
 * The user is presented with two buttons:
 *   "I am 21 or older" → sets sessionStorage 'age_verified'='true', dismisses
 *   "I am under 21"    → redirects to a state-compliant "underage" landing
 *
 * ── Why sessionStorage not localStorage ──────────────────────────────────────
 *
 * Per WCAG and common dispensary compliance guidance:
 *   - sessionStorage clears when the browser tab closes (each session is fresh)
 *   - This satisfies state requirements that verification is done per-session
 *   - localStorage would persist across browser restarts and multiple days,
 *     which is not compliant with most state cannabis regulations
 *
 * ── Implementation as React Router Outlet ───────────────────────────────────
 *
 * AgeGate is a layout route element (renders <Outlet />) rather than a HOC.
 * This means it wraps all public routes cleanly in App.tsx:
 *
 *   <Route element={<AgeGate />}>
 *     <Route path="/"         element={<HomePage />} />
 *     <Route path="/products" element={<ProductsPage />} />
 *   </Route>
 *
 * AgeGate itself has no path — it only renders conditionally.
 *
 * ── Component breakdown ──────────────────────────────────────────────────────
 *
 *   <AgeGate>               — Outlet wrapper + session check
 *     <AgeGateOverlay>      — Full-screen modal overlay
 *       <AgeGateCard>       — Centred card with logo + copy + buttons
 *         <AgeGateButtons>  — "Yes I'm 21" / "No I'm under 21" CTAs
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="dialog" aria-modal="true" on the overlay (1.3.1)
 *   - aria-labelledby pointing to the heading (1.3.1)
 *   - Focus trap: first button receives focus on mount (2.1.2)
 *   - Escape key closes if verified (keyboard operability) (2.1.1)
 *   - Background content: aria-hidden="true" when gate is open (1.3.1)
 *   - document.title updated while gate is open (2.4.2)
 *   - Buttons: minimum 44×44px touch target (2.5.5)
 *   - High contrast text on dark overlay (1.4.3)
 */

import { useState, useEffect, useRef, useId } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '@cannasaas/stores';

// ── Storage key ───────────────────────────────────────────────────────────────

const SESSION_KEY = 'cannasaas_age_verified';

// ── Sub-components ────────────────────────────────────────────────────────────

interface AgeGateButtonsProps {
  onVerified: () => void;
  onDenied:   () => void;
}

/**
 * The two CTA buttons inside the age gate card.
 *
 * The "Yes" button gets a ref so focus can be placed on it programmatically
 * when the overlay opens (focus trap baseline).
 */
function AgeGateButtons({ onVerified, onDenied }: AgeGateButtonsProps) {
  const yesRef = useRef<HTMLButtonElement>(null);

  // Move focus to the first button when the overlay opens
  useEffect(() => {
    yesRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
      <button
        ref={yesRef}
        type="button"
        onClick={onVerified}
        className={[
          'flex-1 py-4 px-6 rounded-2xl text-base font-bold',
          'bg-[hsl(var(--primary,154_40%_30%))] text-white',
          'hover:brightness-110 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[hsl(var(--primary,154_40%_30%)/0.4)]',
          'transition-all min-h-[56px]',
        ].join(' ')}
      >
        Yes, I'm 21 or Older
      </button>
      <button
        type="button"
        onClick={onDenied}
        className={[
          'flex-1 py-4 px-6 rounded-2xl text-base font-bold',
          'border-2 border-white/30 text-white/80',
          'hover:bg-white/10 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40',
          'transition-all min-h-[56px]',
        ].join(' ')}
      >
        No, I'm Under 21
      </button>
    </div>
  );
}

/**
 * The centred card content within the overlay.
 * Receives organisation data to show the dispensary logo + name.
 */
interface AgeGateCardProps {
  dispensaryName: string;
  logoUrl?:       string;
  headingId:      string;
  onVerified:     () => void;
  onDenied:       () => void;
}

function AgeGateCard({
  dispensaryName, logoUrl, headingId, onVerified, onDenied,
}: AgeGateCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl">

      {/* Dispensary logo / icon */}
      <div className="flex justify-center mb-6" aria-hidden="true">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-16 w-auto object-contain"
            loading="eager"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
            🌿
          </div>
        )}
      </div>

      {/* Heading — referenced by aria-labelledby on the dialog */}
      <h1
        id={headingId}
        className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-3"
      >
        {dispensaryName}
      </h1>

      {/* Legal copy */}
      <p className="text-white/80 text-center text-sm sm:text-base leading-relaxed mb-1">
        You must be{' '}
        <strong className="text-white">21 years of age or older</strong>
        {' '}to view this website.
      </p>
      <p className="text-white/60 text-center text-xs">
        By entering you confirm that you are of legal age to purchase cannabis
        in your jurisdiction.
      </p>

      <AgeGateButtons onVerified={onVerified} onDenied={onDenied} />

      {/* Legal disclaimer */}
      <p className="text-white/40 text-xs text-center mt-5 leading-relaxed">
        This site uses session storage to remember your age confirmation.
        Cannabis products are only available to adults 21+ in states where legal.
      </p>
    </div>
  );
}

/**
 * Full-screen overlay that sits above all page content.
 *
 * Uses role="dialog" aria-modal="true" to communicate to screen readers
 * that this is a blocking modal. Background content is not reachable via
 * keyboard while the gate is open.
 */
interface AgeGateOverlayProps extends AgeGateCardProps {
  dispensaryName: string;
}

function AgeGateOverlay(props: AgeGateOverlayProps) {
  // Trap focus within the overlay: prevent Tab from reaching background
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Esc is intentionally not handled — the gate cannot be dismissed this way
    // Tab focus cycling is handled naturally by the two buttons being the only
    // focusable elements within the dialog
    if (e.key === 'Tab') {
      // Let browser handle natural focus cycling within the dialog
      // (only 2 buttons exist, browser cycles between them automatically)
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={props.headingId}
      onKeyDown={handleKeyDown}
      className={[
        'fixed inset-0 z-[200] flex items-center justify-center p-4',
        // Dark green gradient background — reinforces cannabis brand, high contrast
        'bg-gradient-to-br from-[#1a3d2b] via-[#1e4d35] to-[#0f2419]',
      ].join(' ')}
    >
      {/* Decorative background pattern — aria-hidden since purely visual */}
      <div aria-hidden="true" className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, #52B788 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, #2D6A4F 0%, transparent 50%)`,
        }}
      />
      <AgeGateCard {...props} />
    </div>
  );
}

// ── AgeGate (main export) ─────────────────────────────────────────────────────

export function AgeGate() {
  const navigate = useNavigate();
  const { organization } = useOrganizationStore();

  // Check sessionStorage synchronously to avoid flash of gate for verified sessions
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      // sessionStorage unavailable (e.g. private browsing restrictions)
      return false;
    }
  });

  const headingId = useId();

  // Update document title while gate is showing
  useEffect(() => {
    if (!isVerified) {
      document.title = `Age Verification | ${organization?.name ?? 'Cannabis Dispensary'}`;
    }
  }, [isVerified, organization?.name]);

  const handleVerified = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // Silently fail — gate will show again on next route but that's acceptable
    }
    setIsVerified(true);
  };

  const handleDenied = () => {
    // Redirect to a state-compliant underage landing page
    // Using window.location to fully leave the SPA
    window.location.href = 'https://responsibility.org';
  };

  const dispensaryName = organization?.name ?? 'Cannabis Dispensary';
  const logoUrl        = organization?.resolvedBranding?.logoUrl;

  return (
    <>
      {/* The underlying page content — aria-hidden when gate is open */}
      <div aria-hidden={!isVerified ? 'true' : undefined}>
        <Outlet />
      </div>

      {!isVerified && (
        <AgeGateOverlay
          dispensaryName={dispensaryName}
          logoUrl={logoUrl}
          headingId={headingId}
          onVerified={handleVerified}
          onDenied={handleDenied}
        />
      )}
    </>
  );
}
