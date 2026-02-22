/**
 * @file HeroBanner.tsx
 * @app apps/storefront
 *
 * Full-width hero banner for the storefront home page.
 *
 * Design: Rich, organic aesthetic with a large gradient background,
 * dispensary name/tagline, CTA to products, and an optional promotion badge.
 *
 * Content:
 *   - Headline: dispensary name + tagline from organizationStore
 *   - Subheadline: promotional message (optional)
 *   - Primary CTA: "Shop Now" → /products
 *   - Secondary CTA: "Delivery & Pickup Info" → /about
 *   - Promotions badge if active promotions exist
 *
 * Accessibility:
 *   - <section> with aria-label (WCAG 1.3.1)
 *   - Background image (if any) via CSS, not <img> — decorative only
 *   - Headline uses <h1> (home page; only <h1> on the page)
 *   - CTA links are <a> (navigation) not <button>
 *   - High contrast text on dark overlay (WCAG 1.4.3 ≥ 4.5:1)
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { useOrganizationStore } from '@cannasaas/stores';

interface HeroBannerProps {
  promotionText?: string;
}

export function HeroBanner({ promotionText }: HeroBannerProps) {
  const { dispensary, organization } = useOrganizationStore();
  const name = dispensary?.name ?? organization?.name ?? 'Welcome';
  const tagline =
    dispensary?.tagline ??
    organization?.tagline ??
    'Premium cannabis, expertly curated';

  return (
    <section
      aria-label="Welcome banner"
      className={[
        'relative overflow-hidden',
        'bg-gradient-to-br from-stone-900 via-stone-800 to-[hsl(var(--primary,154_40%_20%))]',
        'min-h-[420px] sm:min-h-[480px] lg:min-h-[540px]',
        'flex items-center',
      ].join(' ')}
    >
      {/* Decorative organic texture overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circle accents */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[hsl(var(--primary,154_40%_30%))] opacity-20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[hsl(var(--secondary,154_40%_50%))] opacity-10 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl">
          {/* Promo badge */}
          {promotionText && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 mb-6">
              <span aria-hidden="true" className="text-xs">
                🔥
              </span>
              <span className="text-xs font-semibold text-amber-300 tracking-wide">
                {promotionText}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
            {name}
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-stone-300 mb-8 leading-relaxed max-w-lg">
            {tagline}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.products}
              className={[
                'inline-flex items-center gap-2 px-6 py-3',
                'bg-[hsl(var(--primary,154_40%_30%))] hover:brightness-110',
                'text-white font-semibold text-sm rounded-xl',
                'shadow-lg shadow-[hsl(var(--primary,154_40%_30%)/0.4)]',
                'transition-all active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-white focus-visible:ring-offset-2',
                'focus-visible:ring-offset-stone-900',
              ].join(' ')}
            >
              Shop Now
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <Link
              to="/about"
              className={[
                'inline-flex items-center gap-2 px-6 py-3',
                'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
                'text-white font-medium text-sm rounded-xl border border-white/20',
                'transition-all active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-white focus-visible:ring-offset-2',
                'focus-visible:ring-offset-stone-900',
              ].join(' ')}
            >
              Hours & Locations
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            {[
              { icon: '🌿', text: 'Lab Tested' },
              { icon: '🚚', text: 'Same-Day Delivery' },
              { icon: '🔞', text: 'Must be 21+' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-1.5 text-stone-400 text-xs"
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
