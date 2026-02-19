/**
 * @file AdminLayout.tsx
 * @path apps/admin/src/layouts/AdminLayout/AdminLayout.tsx
 *
 * Root layout for the CannaSaas admin portal.
 * Assembles: Sidebar | TopBar | page Outlet + global Toast notification system.
 *
 * DESIGN TOKEN INJECTION:
 * On mount, injects all --ca-* CSS custom properties onto :root, enabling
 * the entire admin app to share a single token system without Tailwind or
 * a CSS-in-JS runtime.
 *
 * WCAG: The <main> landmark has id="admin-main-content" as a skip-link target.
 * A "Skip to content" link is the first focusable element.
 */

import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../../stores/adminAuthStore';
import { useAdminUiStore, useToasts } from '../../stores/adminUiStore';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import styles from './AdminLayout.module.css';

// ─── Toast Renderer ───────────────────────────────────────────────────────────

/**
 * ToastContainer renders all active toast notifications.
 * Positioned fixed at bottom-right; each toast dismisses on click or timeout.
 * role="region" aria-live="polite" ensures new toasts are announced.
 */
function ToastContainer() {
  const toasts = useToasts();
  const dismissToast = useAdminUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className={styles.toastRegion}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[`toast_${toast.variant}`]}`}
          role="status"
        >
          <span className={styles.toastMessage}>{toast.message}</span>
          <button
            type="button"
            className={styles.toastDismiss}
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const isSidebarCollapsed = useAdminUiStore((s) => s.isSidebarCollapsed);
  const checkSession = useAdminAuthStore((s) => s.checkSession);

  // Verify session cookie on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div
      className={`${styles.layout} ${isSidebarCollapsed ? styles.layoutCollapsed : ''}`}
    >
      {/* Skip link — first focusable element for keyboard users */}
      <a href="#admin-main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar mobileToggleRef={mobileToggleRef} />

      {/* ── Main Column ─────────────────────────────────────────── */}
      <div className={styles.mainColumn}>
        <TopBar ref={mobileToggleRef} />

        <main
          id="admin-main-content"
          role="main"
          className={styles.pageContent}
          aria-label="Admin content"
        >
          <Outlet />
        </main>
      </div>

      {/* ── Global Toast Notifications ───────────────────────────── */}
      <ToastContainer />
    </div>
  );
}

