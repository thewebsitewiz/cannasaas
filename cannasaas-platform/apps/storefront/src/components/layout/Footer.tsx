/**
 * @file Footer.tsx
 * @app apps/storefront
 *
 * Site footer — four-column grid on desktop, stacked on mobile.
 *
 * Columns:
 *   1. Brand — logo, tagline, social links
 *   2. Shop   — category quick links
 *   3. Info   — about, FAQ, contact, accessibility
 *   4. Legal  — terms, privacy, age verification notice
 *
 * Age verification notice (required by cannabis regulations):
 *   Prominently displayed in the legal column.
 *   Per Cannabis-Regulatory-Overview-Federal-State-Local.md: dispensaries
 *   must display a "Must be 21+" notice on all customer-facing pages.
 *
 * Accessibility:
 *   - <footer> landmark (WCAG 1.3.1)
 *   - Column headings are <h3> elements (appropriate heading hierarchy)
 *   - All links have descriptive text (no "click here")
 *   - Social links have aria-label with platform name
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { useOrganizationStore } from '@cannasaas/stores';

export function Footer() {
  const { organization, dispensary } = useOrganizationStore();
  const currentYear = new Date().getFullYear();
  const name = dispensary?.name ?? organization?.name ?? 'CannaSaas';

  return (
    <footer
      className="bg-stone-900 text-stone-300 mt-auto"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* ── Column 1: Brand ─────────────────────────────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-lg font-bold text-white mb-2">{name}</p>
            <p className="text-sm text-stone-400 leading-relaxed mb-4">
              Premium cannabis products sourced with care. Serving our community
              with quality and integrity.
            </p>
            {dispensary?.address && (
              <address className="text-xs text-stone-500 not-italic leading-relaxed">
                {dispensary.address.street}
                <br />
                {dispensary.address.city}, {dispensary.address.state}{' '}
                {dispensary.address.zip}
              </address>
            )}
          </div>

          {/* ── Column 2: Shop ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'All Products', href: ROUTES.products },
                { label: 'Flower', href: `${ROUTES.products}?category=flower` },
                {
                  label: 'Edibles',
                  href: `${ROUTES.products}?category=edibles`,
                },
                {
                  label: 'Concentrates',
                  href: `${ROUTES.products}?category=concentrates`,
                },
                { label: 'Vape', href: `${ROUTES.products}?category=vape` },
                {
                  label: 'Accessories',
                  href: `${ROUTES.products}?category=accessories`,
                },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Info ──────────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Info
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Accessibility', href: '/accessibility' },
                { label: 'Loyalty Program', href: ROUTES.accountLoyalty },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Legal + Age Notice ────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2.5 mb-6">
              {[
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Cookie Policy', href: '/cookies' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/*
             * Age verification notice — required by state cannabis regulations.
             * Must be prominently displayed on all customer-facing pages.
             * Per Cannabis-Regulatory-Overview-Federal-State-Local.md §3.
             */}
            <div
              role="note"
              aria-label="Age restriction notice"
              className="border border-stone-600 rounded-lg p-3 bg-stone-800/50"
            >
              <p className="text-xs font-bold text-amber-400 mb-1">
                🔞 Must be 21+
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                Cannabis products are for adults 21 years of age and older.
                Please consume responsibly. Do not drive under the influence.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            © {currentYear} {name}. All rights reserved. Licensed cannabis
            retailer.
          </p>
          <p className="text-xs text-stone-600">
            Powered by{' '}
            <span className="text-stone-500 font-medium">CannaSaas</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
