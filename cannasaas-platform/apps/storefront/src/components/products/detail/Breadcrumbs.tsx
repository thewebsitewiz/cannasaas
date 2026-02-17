/**
 * ═══════════════════════════════════════════════════════════════════
 * Breadcrumbs — Hierarchical Navigation
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/products/detail/Breadcrumbs.tsx
 *
 * Renders: Home → Products → [Category] → Product Name
 *
 * Follows WAI-ARIA Breadcrumb pattern:
 *   https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * Accessibility (WCAG):
 *   - <nav aria-label="Breadcrumb"> landmark (1.3.1)
 *   - <ol> ordered list conveys hierarchy to screen readers (1.3.1)
 *   - aria-current="page" on the final crumb (4.1.2)
 *   - Separators are aria-hidden (decorative) (1.1.1)
 *   - focus-visible ring on links (2.4.7)
 *   - Final crumb is a <span> — avoids "link to current page"
 *
 * Responsive:
 *   - On mobile (< sm), intermediate crumbs collapse to "…"
 *   - Product name truncates via max-w + truncate on narrow screens
 */

import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  /** Omit for the current page (last crumb) */
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
      <ol
        role="list"
        className="flex items-center gap-1.5 text-sm text-muted-foreground list-none p-0 m-0"
      >
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          const isHiddenOnMobile =
            crumbs.length > 3 && idx > 0 && idx < crumbs.length - 2;

          return (
            <li
              key={idx}
              className={`
                flex items-center gap-1.5
                ${isHiddenOnMobile ? 'hidden sm:flex' : 'flex'}
              `}
            >
              {idx > 0 && (
                <span aria-hidden="true" className="text-xs text-muted-foreground/50">/</span>
              )}

              {/* Mobile ellipsis for collapsed crumbs */}
              {idx === crumbs.length - 2 && crumbs.length > 3 && (
                <span className="sm:hidden text-xs text-muted-foreground/50 mr-1" aria-hidden="true">…</span>
              )}

              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px]"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href ?? '/'}
                  className="
                    hover:text-foreground whitespace-nowrap
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-primary focus-visible:ring-offset-1
                    rounded-sm transition-colors
                  "
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
