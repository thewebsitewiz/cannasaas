import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

type AdminRole = 'super_admin' | 'org_admin' | 'dispensary_admin' | 'budtender';

interface RoleRouteProps {
  allowedRoles: readonly AdminRole[];
  children: React.ReactNode;
  /** Where to send users who don't qualify. Defaults to `/` (dashboard). */
  redirectTo?: string;
}

/**
 * Route-level role guard. Sits inside `<ProtectedRoute>` (which has
 * already established that we have a token) and gates by the role
 * claim on the JWT.
 *
 * Today only `/tax-management` uses this — that route was hidden from
 * the nav for non-super_admins but was still reachable by direct URL.
 * The admin app's CLAUDE.md flagged this gap; this component closes it.
 */
export function RoleRoute({
  allowedRoles,
  children,
  redirectTo = '/',
}: RoleRouteProps) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allowedRoles.includes(role as AdminRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
