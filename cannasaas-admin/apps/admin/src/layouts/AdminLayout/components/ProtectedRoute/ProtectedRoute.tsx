/**
 * @file ProtectedRoute.tsx
 * @path apps/admin/src/layouts/AdminLayout/components/ProtectedRoute/ProtectedRoute.tsx
 *
 * React Router v6 wrapper that enforces authentication and role-based access.
 *
 * USAGE IN ROUTER CONFIG:
 *   <Route element={<ProtectedRoute requiredRole="admin" />}>
 *     <Route path="products" element={<ProductsPage />} />
 *   </Route>
 *
 * BEHAVIOR:
 *   1. While session check is in-flight → renders a full-screen loading state.
 *   2. Unauthenticated → redirects to /admin/sign-in with the attempted path
 *      stored in location.state so sign-in can redirect back afterward.
 *   3. Authenticated but insufficient role → renders an access-denied message.
 *   4. Authenticated + sufficient role → renders the child <Outlet />.
 *
 * WCAG: The loading and denied states are proper <main> regions with
 * appropriate role and aria attributes so screen readers don't get a
 * blank page.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '../../../../stores/adminAuthStore';
import type { AdminRole } from '../../../../types/admin.types';
import styles from './ProtectedRoute.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProtectedRouteProps {
  /** Minimum role required. Defaults to 'staff'. */
  requiredRole?: AdminRole;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProtectedRoute({ requiredRole = 'staff' }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const isLoading = useAdminAuthStore((s) => s.isLoading);
  const hasRole = useAdminAuthStore((s) => s.hasRole);

  // ── Loading State ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.fullScreen} role="status" aria-label="Verifying session">
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.loadingText}>Verifying access…</p>
      </div>
    );
  }

  // ── Unauthenticated → Redirect to Sign In ─────────────────────────────

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/sign-in"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // ── Insufficient Role → Access Denied ────────────────────────────────

  if (!hasRole(requiredRole)) {
    return (
      <main className={styles.fullScreen} aria-labelledby="denied-title">
        <div className={styles.deniedCard}>
          <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.deniedIcon}>
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <h1 id="denied-title" className={styles.deniedTitle}>Access Denied</h1>
          <p className={styles.deniedText}>
            You don't have permission to access this page.
            A minimum role of <strong>{requiredRole}</strong> is required.
          </p>
          <a href="/admin" className={styles.backLink}>Return to Dashboard</a>
        </div>
      </main>
    );
  }

  // ── Authorized → Render Child Routes ─────────────────────────────────

  return <Outlet />;
}

