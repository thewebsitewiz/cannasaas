/**
 * @file ProtectedRoute.tsx
 * @package @cannasaas/ui
 *
 * Shared RBAC route guard for all three CannaSaas frontend apps.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 *
 * ProtectedRoute wraps any route that requires authentication and/or
 * a specific RBAC role. It reads from the Zustand authStore and makes
 * three decisions:
 *
 *   1. Not authenticated  → redirect to `loginPath` (preserves `from` state
 *                           so the user lands back on the page after login)
 *   2. Authenticated but wrong role → render <ForbiddenPage />
 *   3. Authenticated + correct role → render <Outlet /> (the child route)
 *
 * ── Role hierarchy ───────────────────────────────────────────────────────────
 *
 * Roles are ordered from most to least privileged. If `requiredRole` is set,
 * the user must have that role OR a higher-privilege role:
 *
 *   super_admin > owner > admin > manager > budtender > driver > customer
 *
 * This means a route requiring "manager" will also admit "admin" and "owner".
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 * In React Router v6, wrap routes inside a layout route:
 *
 *   // Require any authenticated user:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   // Require manager-or-above:
 *   <Route element={<ProtectedRoute requiredRole="manager" />}>
 *     <Route path="/analytics" element={<Analytics />} />
 *   </Route>
 *
 *   // Custom login path for the admin app:
 *   <Route element={<ProtectedRoute loginPath="/admin/login" requiredRole="admin" />}>
 *     <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *   </Route>
 *
 * ── Loading state ────────────────────────────────────────────────────────────
 *
 * On initial app load, the authStore may still be hydrating from localStorage.
 * ProtectedRoute renders a full-page spinner during `isHydrating` to prevent
 * a flash of the login redirect before persisted state is loaded.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Loading spinner: role="status" aria-label (4.1.3)
 *   - Redirect preserves intended URL in location.state.from (2.4.1)
 *   - ForbiddenPage has document.title update (2.4.2)
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';

// ── Role hierarchy ─────────────────────────────────────────────────────────────

export type AppRole =
  | 'super_admin' | 'owner' | 'admin'
  | 'manager' | 'budtender' | 'driver' | 'customer';

/**
 * Numeric privilege level per role.
 * Higher number = more privileges.
 */
const ROLE_LEVEL: Record<AppRole, number> = {
  super_admin: 100,
  owner:       80,
  admin:       70,
  manager:     60,
  budtender:   40,
  driver:      30,
  customer:    10,
};

/**
 * Returns true if the user has at least the required privilege level.
 * Users with HIGHER privilege levels also satisfy lower requirements.
 */
function hasRole(userRoles: string[], required: AppRole): boolean {
  const requiredLevel = ROLE_LEVEL[required] ?? 0;
  return userRoles.some(
    (r) => (ROLE_LEVEL[r as AppRole] ?? 0) >= requiredLevel,
  );
}

// ── Full-page spinner (shown during store hydration) ──────────────────────────

function HydrationSpinner() {
  return (
    <div
      role="status"
      aria-label="Verifying authentication, please wait"
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          aria-hidden="true"
          className="w-10 h-10 border-4 border-[hsl(var(--primary,154_40%_30%))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
        />
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    </div>
  );
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  /**
   * Minimum role required to access the wrapped routes.
   * If omitted, any authenticated user may access (no role restriction).
   */
  requiredRole?: AppRole;

  /**
   * Where to redirect unauthenticated users.
   * Defaults to '/login'. Override per-app:
   *   admin portal → '/admin/login'
   *   staff portal → '/login'  (already the default)
   */
  loginPath?: string;

  /**
   * Optional component to render on forbidden access instead of the default
   * ForbiddenPage. Allows apps to use a custom 403 page.
   */
  forbiddenElement?: React.ReactNode;
}

export function ProtectedRoute({
  requiredRole,
  loginPath = '/login',
  forbiddenElement,
}: ProtectedRouteProps) {
  const location           = useLocation();
  const { user, isHydrating } = useAuthStore();

  // Wait for Zustand persist middleware to rehydrate from localStorage
  if (isHydrating) return <HydrationSpinner />;

  // Not authenticated → redirect to login, preserving intended destination
  if (!user) {
    return (
      <Navigate
        to={loginPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Authenticated but missing required role → 403
  if (requiredRole && !hasRole(user.roles ?? [], requiredRole)) {
    return forbiddenElement ? <>{forbiddenElement}</> : <ForbiddenInline />;
  }

  // All checks pass → render child route
  return <Outlet />;
}

// ── Inline Forbidden component (used as default) ──────────────────────────────

/**
 * Minimal 403 component shown inline when the user lacks the required role.
 * Keeps the app layout (sidebar etc.) intact while showing the error.
 * For a full-page 403, use ForbiddenPage.tsx instead.
 */
function ForbiddenInline() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8"
    >
      <span aria-hidden="true" className="text-6xl mb-4">🚫</span>
      <h1 className="text-2xl font-extrabold text-stone-900 mb-2">Access Denied</h1>
      <p className="text-stone-500 max-w-md">
        You don't have permission to view this page. Contact your administrator
        if you believe this is an error.
      </p>
    </div>
  );
}
