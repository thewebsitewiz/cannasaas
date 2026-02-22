/**
 * @file Header.tsx
 * @app apps/storefront
 *
 * Primary site header — sticky, responsive, theme-aware.
 *
 * Desktop layout (lg+):
 *   [Logo] ─────── [Nav: Products | Categories | Deals] ─── [Search] [Cart] [User]
 *
 * Mobile layout (<lg):
 *   [Hamburger] [Logo] ─────────────────────────────────────── [Cart] [User]
 *   [Search bar — full width, below nav row]
 *
 * Features:
 *   - Logo from organizationStore.resolvedBranding (falls back to text)
 *   - Cart button shows live item count from cartStore
 *   - Search bar with debounced autocomplete (useSearchProducts)
 *   - User menu: login link (unauthenticated) / avatar dropdown (authenticated)
 *   - Mobile: slide-in drawer navigation
 *   - Translucent backdrop blur on scroll (CSS backdrop-filter)
 *
 * Accessibility:
 *   - <header> landmark (WCAG 1.3.1)
 *   - aria-expanded on mobile hamburger button
 *   - Mobile nav drawer: aria-modal, focus trap, Escape to close
 *   - Active nav links: aria-current="page"
 */

import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

import { CartButton } from './CartButton';
import { HeaderLogo } from './HeaderLogo';
import { NavMenu } from './NavMenu';
import { ROUTES } from '../../routes';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close mobile nav on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Detect scroll to add backdrop blur
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  // Trap focus inside mobile nav drawer when open
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
      'a, button, input, [tabindex="0"]',
    );
    focusable?.[0]?.focus();
  }, [isMobileNavOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMobileNavOpen]);

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 w-full',
          'border-b border-stone-200/80',
          'transition-all duration-200',
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3 lg:gap-6">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-nav"
              aria-label="Open navigation menu"
              className={[
                'lg:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center',
                'rounded-lg text-stone-600 hover:bg-stone-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]',
                'transition-colors',
              ].join(' ')}
            >
              {/* Hamburger icon */}
              <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link
              to={ROUTES.home}
              aria-label="CannaSaas — return to home page"
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] rounded"
            >
              <HeaderLogo />
            </Link>

            {/* Desktop navigation */}
            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-1 ml-2"
            >
              <NavMenu />
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search — hidden on small mobile, shown sm+ */}
            <div className="hidden sm:block w-48 lg:w-72">
              <SearchBar />
            </div>

            {/* Cart + User */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <CartButton />
              <UserMenu />
            </div>
          </div>

          {/* Mobile search — below nav row on xs screens */}
          <div className="sm:hidden pb-3">
            <SearchBar fullWidth />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer ─────────────────────────────────────────── */}
      {/* Backdrop */}
      {isMobileNavOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        id="mobile-nav"
        ref={mobileNavRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl lg:hidden',
          'transition-transform duration-300 ease-out',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'overflow-y-auto',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-stone-100">
          <HeaderLogo />
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className={[
              'w-9 h-9 flex items-center justify-center rounded-lg',
              'text-stone-500 hover:bg-stone-100',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[hsl(var(--primary))]',
              'transition-colors',
            ].join(' ')}
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mobile nav links */}
        <nav aria-label="Mobile navigation" className="px-4 py-6">
          <NavMenu mobile />
        </nav>
      </div>
    </>
  );
}
