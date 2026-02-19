/**
 * @file Footer.tsx
 * @path apps/storefront/src/layouts/StorefrontLayout/components/Footer/Footer.tsx
 *
 * Storefront footer with store information, quick links, social media,
 * and the legally required age verification notice.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Rendered as <footer role="contentinfo"> — the ARIA landmark for page footers.
 *   • All link groups wrapped in <nav aria-label="…"> for distinct landmarks.
 *   • Social media icons include aria-label with platform name (not icon alone).
 *   • Phone/email links have descriptive text alongside the contact value.
 *   • Age verification notice is role="note" with a high-contrast visual style.
 *   • Focus rings on all interactive elements pass 3:1 contrast (§1.4.11).
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Reads from organizationStore via the `useOrganizationContact()` selector —
 *     pinpoint subscription to avoid re-renders on unrelated org changes.
 *   • Hours display uses a memoized helper to compute "open now" status based
 *     on the current time, so the label updates without a server roundtrip.
 *   • Footer link groups are defined as static data arrays, making it trivial
 *     for operators to add custom quick links via org config in the future.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrganizationContact } from '../../../../stores/organizationStore';
import type { Weekday } from '@cannasaas/types';
import styles from './Footer.module.css';

// ─── Static Quick Links ───────────────────────────────────────────────────────

/**
 * Quick link columns shown in the footer.
 * These are static defaults; tenant customization can be layered on top
 * by reading from organizationStore once that config field is added.
 */
const QUICK_LINKS = [
  {
    heading: 'Shop',
    links: [
      { label: 'Flower', to: '/shop/flower' },
      { label: 'Edibles', to: '/shop/edibles' },
      { label: 'Concentrates', to: '/shop/concentrates' },
      { label: 'Vapes', to: '/shop/vapes' },
      { label: 'Accessories', to: '/shop/accessories' },
      { label: 'All Products', to: '/shop' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign In', to: '/auth/sign-in' },
      { label: 'Register', to: '/auth/register' },
      { label: 'Order History', to: '/account/orders' },
      { label: 'Loyalty Rewards', to: '/account/loyalty' },
      { label: 'Preferences', to: '/account/preferences' },
    ],
  },
  {
    heading: 'Info',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Blog', to: '/learn' },
      { label: 'Deals & Specials', to: '/deals' },
      { label: 'Brands', to: '/brands' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Accessibility', to: '/accessibility' },
      { label: 'Age Verification', to: '/age-verification' },
    ],
  },
];

// ─── Weekday Display Order ────────────────────────────────────────────────────

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

// ─── Day Abbreviation → JS Date.getDay() index ───────────────────────────────

const DAY_MAP: Record<Weekday, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

// ─── Open-Now Helper ──────────────────────────────────────────────────────────

/**
 * Computes whether the store is currently open based on its hours config.
 * Returns null if hours are not configured.
 *
 * NOTE: This uses the client's local time. For timezone-correct behavior,
 * the server should return hours in the store's local timezone and we'd
 * use the Intl.DateTimeFormat API to convert. Leaving that as a TODO.
 */
function computeIsOpenNow(
  hours: Record<Weekday, { open: string; close: string; closed: boolean } | null>,
): boolean | null {
  if (!hours || Object.keys(hours).length === 0) return null;

  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday

  const todayKey = (Object.entries(DAY_MAP).find(([, v]) => v === todayIndex)?.[0]) as Weekday | undefined;
  if (!todayKey) return null;

  const todayHours = hours[todayKey];
  if (!todayHours || todayHours.closed) return false;

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

// ─── Social Icons ─────────────────────────────────────────────────────────────

/**
 * Inline SVG icons for each supported social platform.
 * Using inline SVGs (not an icon font) for: zero additional HTTP requests,
 * reliable rendering, and full color/size control via CSS.
 */
const SocialIcons: Record<string, React.ReactNode> = {
  instagram: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  facebook: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  ),
  twitter: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
    </svg>
  ),
  leafly: (
    /* Simplified leaf icon as a stand-in for Leafly branding */
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12M12 12C12 12 7 9 4 4c5 1 9 4 8 8z M12 12C12 12 17 9 20 4c-5 1-9 4-8 8z"/>
    </svg>
  ),
  weedmaps: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Footer
 *
 * Site-wide footer for the CannaSaas dispensary storefront.
 * Displays store contact info, operating hours, quick navigation links,
 * social media links, and a mandatory age-verification disclaimer.
 *
 * @example
 * <Footer />
 */
export function Footer() {
  // Pinpoint selector — only re-renders if contact-related org fields change
  const {
    name,
    addressLine1,
    addressLine2,
    city,
    state,
    zip,
    phone,
    email,
    hours,
    social,
    minimumAge,
  } = useOrganizationContact();

  // Memoize open-now status — recomputes only when `hours` reference changes
  const isOpenNow = useMemo(
    () => computeIsOpenNow(hours as Record<Weekday, { open: string; close: string; closed: boolean } | null>),
    [hours],
  );

  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">

      {/* ── Age Verification Banner ─────────────────────────────────── */}
      {/*
       * This is a legal requirement in NY, NJ, and CT for cannabis retailers.
       * role="note" makes it a distinct ARIA landmark (informational but not main).
       */}
      <div role="note" aria-label="Age restriction notice" className={styles.ageBanner}>
        <span className={styles.ageBannerIcon} aria-hidden="true">🔞</span>
        <p className={styles.ageBannerText}>
          <strong>You must be {minimumAge}+ years of age</strong> to purchase cannabis
          products. Valid government-issued ID required at pickup.
          Cannabis products are for adults only.
        </p>
      </div>

      {/* ── Main Footer Grid ────────────────────────────────────────── */}
      <div className={styles.main}>
        <div className={styles.inner}>

          {/* ── Column 1: Store Info ──────────────────────────────── */}
          <div className={styles.storeColumn}>
            {/* Store name / wordmark */}
            <p className={styles.storeName}>{name || 'CannaSaas'}</p>

            {/* Address */}
            <address className={styles.address}>
              {addressLine1 && <span>{addressLine1}</span>}
              {addressLine2 && <span>{addressLine2}</span>}
              {city && state && zip && (
                <span>{city}, {state} {zip}</span>
              )}
            </address>

            {/* Contact */}
            <div className={styles.contactLinks}>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className={styles.contactLink}
                  aria-label={`Call us at ${phone}`}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 012 1.18 2 2 0 014 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {phone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className={styles.contactLink}
                  aria-label={`Email us at ${email}`}
                >
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {email}
                </a>
              )}
            </div>

            {/* Operating Hours */}
            {hours && Object.keys(hours).length > 0 && (
              <div className={styles.hours}>
                <h3 className={styles.hoursHeading}>
                  Hours
                  {isOpenNow !== null && (
                    <span
                      className={`${styles.openStatus} ${isOpenNow ? styles.openStatusOpen : styles.openStatusClosed}`}
                      aria-label={isOpenNow ? 'Currently open' : 'Currently closed'}
                    >
                      {isOpenNow ? 'Open now' : 'Closed'}
                    </span>
                  )}
                </h3>
                <dl className={styles.hoursList}>
                  {WEEKDAYS.map(({ key, label }) => {
                    const dayHours = (hours as Record<Weekday, { open: string; close: string; closed: boolean } | null>)[key];
                    return (
                      <div key={key} className={styles.hoursRow}>
                        <dt className={styles.hoursDay}>{label.slice(0, 3)}</dt>
                        <dd className={styles.hoursTime}>
                          {!dayHours || dayHours.closed
                            ? <span className={styles.hoursClosed}>Closed</span>
                            : `${formatTime(dayHours.open)} – ${formatTime(dayHours.close)}`
                          }
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            {/* Social Media */}
            {social && Object.keys(social).length > 0 && (
              <nav aria-label="Social media links" className={styles.socialNav}>
                <ul className={styles.socialList} role="list">
                  {Object.entries(social).map(([platform, handle]) =>
                    handle ? (
                      <li key={platform}>
                        <a
                          href={getSocialUrl(platform, handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialLink}
                          aria-label={`Visit our ${capitalize(platform)} page`}
                        >
                          {SocialIcons[platform] ?? (
                            <span aria-hidden="true">{platform[0].toUpperCase()}</span>
                          )}
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
              </nav>
            )}
          </div>

          {/* ── Columns 2-5: Quick Links ──────────────────────────── */}
          {QUICK_LINKS.map((group) => (
            <nav
              key={group.heading}
              className={styles.linkColumn}
              aria-label={`${group.heading} links`}
            >
              <h3 className={styles.linkColumnHeading}>{group.heading}</h3>
              <ul className={styles.linkList} role="list">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            &copy; {currentYear} {name || 'CannaSaas'}. All rights reserved.
            Licensed cannabis retailer.
          </p>
          <p className={styles.legalLine}>
            Products have not been evaluated by the FDA. Not for use by minors.
            Keep out of reach of children.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/**
 * Formats a 24h time string (e.g., "09:00") to 12h display (e.g., "9:00 AM").
 */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Constructs the full URL for a social media platform given its handle.
 */
function getSocialUrl(platform: string, handle: string): string {
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${handle}`,
    facebook: `https://facebook.com/${handle}`,
    twitter: `https://twitter.com/${handle}`,
    leafly: `https://leafly.com/dispensary-info/${handle}`,
    weedmaps: `https://weedmaps.com/dispensaries/${handle}`,
  };
  return urls[platform] ?? '#';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

