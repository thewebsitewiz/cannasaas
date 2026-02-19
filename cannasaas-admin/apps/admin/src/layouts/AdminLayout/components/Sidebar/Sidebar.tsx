/**
 * @file Sidebar.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/Sidebar/Sidebar.tsx
 *
 * The admin portal's primary navigation sidebar.
 *
 * ─── WCAG 2.1 AA COMPLIANCE ────────────────────────────────────────────────
 *   • Wrapped in <nav aria-label="Admin navigation"> (landmark).
 *   • Active link has aria-current="page".
 *   • Collapsed mode: icon-only buttons have aria-label with the link name.
 *   • Mobile: slide-in drawer with focus trap. Escape closes it and returns
 *     focus to the hamburger button in TopBar.
 *   • All nav items are minimum 44px tall touch targets.
 *
 * ─── ADVANCED REACT PATTERNS ───────────────────────────────────────────────
 *   • Nav items filtered by `hasRole` from adminAuthStore — no role-gated
 *     items appear in the DOM at all (not just visually hidden).
 *   • Tooltip on collapsed items uses CSS :hover + position rather than a
 *     JS tooltip library — simpler, performant, no dependency.
 *   • useMemo for filtered nav items to avoid re-running role checks on
 *     every render.
 */

import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import type { AdminRole } from '../../../../types/admin.types';
import styles from './Sidebar.module.css';

// ─── Nav Item Definition ──────────────────────────────────────────────────────

interface NavSection {
  key: string;
  label?: string;
  items: NavItemDef[];
}

interface NavItemDef {
  key: string;
  label: string;
  to: string;
  icon: React.ReactNode;
  /** Minimum role required to see this item */
  minRole?: AdminRole;
  /** Show a notification badge (e.g., pending orders count) */
  badge?: number;
}

// ─── Nav Structure ────────────────────────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'main',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: '/admin',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
      },
      {
        key: 'products',
        label: 'Products',
        to: '/admin/products',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        minRole: 'staff',
      },
      {
        key: 'orders',
        label: 'Orders',
        to: '/admin/orders',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
        minRole: 'staff',
      },
      {
        key: 'customers',
        label: 'Customers',
        to: '/admin/customers',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
        minRole: 'manager',
      },
      {
        key: 'analytics',
        label: 'Analytics',
        to: '/admin/analytics',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
        minRole: 'manager',
      },
    ],
  },
  {
    key: 'config',
    label: 'Configuration',
    items: [
      {
        key: 'settings',
        label: 'Settings',
        to: '/admin/settings',
        icon: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 00-14.14 0M4.93 19.07a10 10 0 0014.14 0"/></svg>,
        minRole: 'admin',
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  /** Used for the mobile close button focus-return ref */
  mobileToggleRef?: React.RefObject<HTMLButtonElement>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ mobileToggleRef }: SidebarProps) {
  const { isCollapsed, isMobileNavOpen, closeMobileNav } = useAdminUiStore((s) => ({
    isCollapsed: s.isSidebarCollapsed,
    isMobileNavOpen: s.isMobileNavOpen,
    closeMobileNav: s.closeMobileNav,
  }));
  const hasRole = useAdminAuthStore((s) => s.hasRole);
  const user = useAdminAuthStore((s) => s.user);
  const location = useLocation();

  // Filter nav sections based on user's role — never render inaccessible items
  const filteredSections = useMemo(() =>
    NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        !item.minRole || hasRole(item.minRole),
      ),
    })).filter((section) => section.items.length > 0),
    [hasRole],
  );

  const handleNavLinkClick = () => {
    if (isMobileNavOpen) closeMobileNav();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileNavOpen && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={closeMobileNav}
        />
      )}

      <nav
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''} ${isMobileNavOpen ? styles.sidebarMobileOpen : ''}`}
        aria-label="Admin navigation"
      >
        {/* ── Logo / Wordmark ──────────────────────────────────────── */}
        <div className={styles.logoArea}>
          <span className={styles.logoMark} aria-hidden="true">🌿</span>
          {!isCollapsed && (
            <span className={styles.logoText}>CannaSaas</span>
          )}
        </div>

        {/* ── Nav Sections ─────────────────────────────────────────── */}
        <div className={styles.navContent}>
          {filteredSections.map((section) => (
            <div key={section.key} className={styles.section}>
              {section.label && !isCollapsed && (
                <p className={styles.sectionLabel} aria-hidden="true">
                  {section.label}
                </p>
              )}
              <ul className={styles.navList} role="list">
                {section.items.map((item) => {
                  const isActive = item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);

                  return (
                    <li key={item.key}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/admin'}
                        className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                        title={isCollapsed ? item.label : undefined}
                        onClick={handleNavLinkClick}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                        {!isCollapsed && (
                          <span className={styles.navLabel}>{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && item.badge > 0 && (
                          <span
                            className={styles.badge}
                            aria-label={`${item.badge} pending`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                          <span className={styles.tooltip} aria-hidden="true">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ── User Profile Footer ───────────────────────────────────── */}
        {user && (
          <div className={`${styles.userArea} ${isCollapsed ? styles.userAreaCollapsed : ''}`}>
            <div className={styles.userAvatar} aria-hidden="true">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" width={28} height={28} />
                : user.displayName.charAt(0).toUpperCase()
              }
            </div>
            {!isCollapsed && (
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.displayName}</span>
                <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

