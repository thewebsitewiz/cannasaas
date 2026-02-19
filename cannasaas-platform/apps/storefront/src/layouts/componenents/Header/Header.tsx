/**
 * @file Header.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Header/Header.tsx
 *
 * The primary storefront header — aggregates the Logo, SearchBar, Navigation,
 * CartButton, and UserMenu sub-components into a cohesive, responsive banner.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Rendered as <header role="banner"> — the ARIA landmark for primary headers.
 *   • Contains a "Skip to main content" skip link as the FIRST focusable element,
 *     enabling keyboard users to bypass repetitive navigation (§2.4.1).
 *   • Logo link has a descriptive aria-label (not just an image alt).
 *   • Sticky header does not obscure focused elements below — uses scroll-margin
 *     on section targets via CSS custom property --cs-header-height.
 *   • Reduced-motion respected: no CSS transitions fire under the media query.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Reads from organizationStore via pinpoint selectors — only re-renders
 *     if the logo URL or store name changes, not on any org field change.
 *   • Sticky scroll-shadow effect driven by an IntersectionObserver on a
 *     sentinel element (zero-height div above the header) — avoids a scroll
 *     event listener entirely.
 *   • useRef-forwarding to SearchBar so mobile "expand search" can programmatically
 *     focus the input.
 *   • useMemo for the skip-link href to avoid string construction on every render.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationLogo } from '../../../../stores/organizationStore';
import { SearchBar } from './components/SearchBar';
import { CartButton } from './components/CartButton';
import { UserMenu } from './components/UserMenu';
import { Navigation } from './components/Navigation';
import styles from './Header.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  /**
   * ID of the main content element — used for the skip-link href.
   * Must match the `id` prop on the page's <main> element.
   * @default "main-content"
   */
  mainContentId?: string;

  /**
   * Currently authenticated user passed from the app's auth context.
   * Null when unauthenticated — Header passes it down to UserMenu.
   */
  user?: {
    displayName: string;
    email: string;
    avatarUrl?: string;
    loyaltyPoints?: number;
  } | null;

  /** Sign-out handler passed from the auth context */
  onSignOut?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Header
 *
 * Sticky site header with skip link, logo, search, navigation, cart, and user menu.
 * Uses an IntersectionObserver sentinel to add an elevation shadow when scrolled.
 *
 * @example
 * <Header mainContentId="main-content" user={authUser} onSignOut={handleSignOut} />
 */
export function Header({
  mainContentId = 'main-content',
  user = null,
  onSignOut,
}: HeaderProps) {
  // ── Organization Branding ─────────────────────────────────────────────
  // Pinpoint selector — avoids re-renders on unrelated org field changes
  const { logoUrl, logoAlt, name } = useOrganizationLogo();

  // ── Scroll Shadow (IntersectionObserver) ──────────────────────────────
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel leaves the viewport (scrolled past top), add shadow
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // ── Mobile Search Expand ──────────────────────────────────────────────
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen((v) => !v);
    if (!mobileSearchOpen) {
      // Focus the input after state update causes it to render
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  };

  // ── Skip Link Href ─────────────────────────────────────────────────────
  const skipHref = useMemo(() => `#${mainContentId}`, [mainContentId]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {/*
       * Sentinel: zero-height div placed ABOVE the header in DOM order.
       * The IntersectionObserver watches this to detect scroll position
       * without attaching any scroll event listeners.
       */}
      <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />

      <header
        className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}
        role="banner"
      >
        {/*
         * SKIP LINK — WCAG 2.4.1 "Bypass Blocks"
         * Visually hidden by default, appears on :focus-visible.
         * Must be the very first focusable element in the document.
         */}
        <a href={skipHref} className={styles.skipLink}>
          Skip to main content
        </a>

        {/* ── Inner Layout ───────────────────────────────────────────── */}
        <div className={styles.inner}>

          {/* ── Left: Logo ─────────────────────────────────────────── */}
          <div className={styles.logoArea}>
            <Link
              to="/"
              className={styles.logoLink}
              aria-label={`${name} — go to homepage`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  className={styles.logoImage}
                  width={140}
                  height={40}
                  /*
                   * fetchpriority="high" marks this as an LCP candidate image
                   * so browsers load it before other resources.
                   */
                  fetchPriority="high"
                />
              ) : (
                /*
                 * Text fallback logo — renders the org name in the display font.
                 * Shown when no logo URL is configured for the tenant.
                 */
                <span className={styles.logoText} aria-hidden="false">
                  {name}
                </span>
              )}
            </Link>
          </div>

          {/* ── Center: Navigation (desktop) ───────────────────────── */}
          <div className={styles.navArea}>
            <Navigation />
          </div>

          {/* ── Center: Search Bar (desktop inline) ────────────────── */}
          <div className={styles.searchArea}>
            <SearchBar
              ref={searchInputRef}
              placeholder="Search flower, edibles, concentrates…"
            />
          </div>

          {/* ── Right: Actions ─────────────────────────────────────── */}
          <div className={styles.actionsArea}>
            {/* Mobile search toggle – hidden on desktop */}
            <button
              type="button"
              className={styles.mobileSearchToggle}
              aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={mobileSearchOpen}
              onClick={handleMobileSearchToggle}
            >
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileSearchOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </>
                )}
              </svg>
            </button>

            <CartButton />

            <UserMenu user={user} onSignOut={onSignOut} />
          </div>
        </div>

        {/* ── Mobile Search Expansion Area ───────────────────────────── */}
        {mobileSearchOpen && (
          <div className={styles.mobileSearchBar} role="search">
            <SearchBar
              ref={searchInputRef}
              placeholder="Search products…"
              className={styles.mobileSearchInput}
            />
          </div>
        )}
      </header>
    </>
  );
}
