/**
 * @file TopBar.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/TopBar/TopBar.tsx
 *
 * The horizontal top bar of the admin portal layout.
 * Contains the sidebar collapse toggle (desktop) and mobile menu trigger,
 * along with a global notification bell and the sign-out action.
 *
 * WCAG: Buttons have descriptive aria-labels reflecting current state
 * (e.g., "Collapse sidebar" vs "Expand sidebar").
 */

import React, { forwardRef } from 'react';
import { useAdminUiStore } from '../../../../stores/adminUiStore';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import styles from './TopBar.module.css';

export interface TopBarProps {
  className?: string;
}

export const TopBar = forwardRef<HTMLButtonElement, TopBarProps>(
  function TopBar({ className }, mobileToggleRef) {
    const { isSidebarCollapsed, toggleSidebarCollapsed, openMobileNav, isMobileNavOpen } =
      useAdminUiStore((s) => ({
        isSidebarCollapsed: s.isSidebarCollapsed,
        toggleSidebarCollapsed: s.toggleSidebarCollapsed,
        openMobileNav: s.openMobileNav,
        isMobileNavOpen: s.isMobileNavOpen,
      }));

    const signOut = useAdminAuthStore((s) => s.signOut);

    return (
      <header className={`${styles.topBar} ${className ?? ''}`} role="banner">
        <div className={styles.left}>
          {/* Desktop: collapse/expand sidebar toggle */}
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.desktopOnly}`}
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isSidebarCollapsed}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Mobile: open sidebar drawer */}
          <button
            ref={mobileToggleRef}
            type="button"
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            onClick={openMobileNav}
            aria-label="Open navigation menu"
            aria-expanded={isMobileNavOpen}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.right}>
          {/* Sign out */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={signOut}
            aria-label="Sign out"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>
    );
  },
);

