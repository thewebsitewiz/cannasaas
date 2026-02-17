/**
 * ═══════════════════════════════════════════════════════════════════
 * Section — Compound Component
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/layout/Section.tsx
 *
 * Compound Component pattern — three cooperating components that
 * compose declaratively:
 *
 *   <Section>
 *     <Section.Content>
 *       <Section.Header title="Featured" subtitle="Staff picks" />
 *       {children}
 *     </Section.Content>
 *   </Section>
 *
 * Benefits over a monolithic <Section title="" subtitle="" viewAll="">:
 *   • No prop drilling — each sub-component owns its own props
 *   • Consumers can reorder, omit, or duplicate sub-components freely
 *   • Each piece is independently testable
 *   • TypeScript enforces correct prop shapes per sub-component
 *
 * Accessibility:
 *   • Renders semantic <section> element
 *   • Section.Header auto-generates a heading ID via useId()
 *   • "View All" link includes sr-only text with section title
 *     so screen readers hear "View All Featured Products"
 *   • Decorative arrow uses aria-hidden
 *
 * Responsive:
 *   • py-10 (40px) mobile → py-12 (48px) sm → py-16 (64px) md+
 *   • Section.Content: px-4 mobile → px-6 sm → px-8 lg, max-w-7xl
 *   • Section.Header: stacks vertically on mobile, side-by-side on sm+
 *
 * Animation:
 *   • Scroll-triggered fade-up entrance (8px translate)
 *   • Disabled entirely when prefers-reduced-motion is active
 */

import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion, useIntersectionObserver } from '@/hooks';

/* ─── Section (parent wrapper) ────────────────────────────────────── */

interface SectionProps {
  /** Additional CSS classes for the outer <section> */
  className?: string;
  children: ReactNode;
}

/**
 * Section
 * ────────
 * Renders a semantic <section> with a scroll-triggered entrance
 * animation (fade-up from 8px below). Animation is disabled when
 * the user prefers reduced motion.
 */
function Section({ className = '', children }: SectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [ref, isVisible] = useIntersectionObserver();

  return (
    <section
      ref={ref}
      className={[
        'py-10 sm:py-12 md:py-16',
        // Entrance animation — skip entirely for reduced motion users
        prefersReducedMotion
          ? ''
          : `transition-all duration-700 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  );
}

/* ─── Section.Header ──────────────────────────────────────────────── */

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Route path for the "View All →" link */
  viewAllHref?: string;
  /** Override heading level — defaults to h2. Use h3 for nested sections. */
  as?: 'h2' | 'h3';
}

/**
 * Section.Header
 * ───────────────
 * Title bar with optional subtitle and "View All →" link. The heading
 * ID is auto-generated via useId() for potential aria-labelledby usage.
 *
 * The "View All" link appends a sr-only span with the section title so
 * screen readers announce "View All Featured Products" instead of just
 * "View All" — satisfying WCAG 2.4.4 Link Purpose (In Context).
 */
function SectionHeader({ title, subtitle, viewAllHref, as: Tag = 'h2' }: SectionHeaderProps) {
  const headingId = useId();

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
      <div>
        <Tag id={headingId} className="text-xl sm:text-2xl font-bold tracking-tight">
          {title}
        </Tag>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="
            text-sm font-medium text-primary
            hover:text-primary/80
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2
            rounded-sm transition-colors
          "
        >
          View All
          {/* Expanded label for screen readers */}
          <span className="sr-only"> {title}</span>
          {/* Decorative arrow hidden from assistive tech */}
          <span aria-hidden="true"> →</span>
        </Link>
      )}
    </div>
  );
}

/* ─── Section.Content ─────────────────────────────────────────────── */

/**
 * Section.Content
 * ────────────────
 * Max-width container with responsive horizontal padding. Matches the
 * global content width used across all storefront pages.
 *
 *   px-4 (16px) mobile → px-6 (24px) sm → px-8 (32px) lg
 *   max-w-7xl (1280px) caps width on xl+ screens
 */
function SectionContent({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>;
}

/* ─── Attach sub-components for compound usage ────────────────────── */

Section.Header = SectionHeader;
Section.Content = SectionContent;

export { Section };
