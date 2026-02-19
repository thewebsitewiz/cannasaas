/**
 * @file PageHeader.tsx
 * @path apps/admin/src/components/shared/PageHeader/PageHeader.tsx
 *
 * Consistent page header used at the top of every admin page.
 * Renders the page title, optional breadcrumb trail, and an actions slot
 * for primary CTA buttons (e.g., "New Product", "Export CSV").
 *
 * WCAG: The <h1> is set once per page via this component, ensuring a
 * correct heading hierarchy. Breadcrumbs use <nav aria-label="Breadcrumb">
 * with aria-current="page" on the final item per WCAG technique G128.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PageHeader.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string;
  to?: string; // If omitted, renders as plain text (current page)
}

export interface PageHeaderProps {
  /** The page <h1> title */
  title: string;
  /** Optional subtitle / description below the title */
  subtitle?: string;
  /** Breadcrumb trail — last item should be the current page (no `to`) */
  breadcrumbs?: Breadcrumb[];
  /** Action buttons/controls rendered to the right of the title */
  actions?: React.ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PageHeader
 *
 * @example
 * <PageHeader
 *   title="Products"
 *   breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Products' }]}
 *   actions={<button onClick={openCreateModal}>+ New Product</button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${className ?? ''}`}>
      {/* ── Breadcrumbs ─────────────────────────────────────────── */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
          <ol className={styles.breadcrumbList} role="list">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li key={index} className={styles.breadcrumbItem}>
                  {isLast ? (
                    <span
                      className={styles.breadcrumbCurrent}
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link to={crumb.to!} className={styles.breadcrumbLink}>
                        {crumb.label}
                      </Link>
                      {/* Separator — decorative, hidden from AT */}
                      <span aria-hidden="true" className={styles.breadcrumbSep}>
                        /
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── Title Row ───────────────────────────────────────────── */}
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className={styles.actions}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

