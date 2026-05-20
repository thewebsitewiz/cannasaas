import { inject } from '@angular/core';
import { type CanMatchFn, Router, type Route, type UrlSegment } from '@angular/router';

import { ADMIN_BASELINE_ROLES, AuthService, type AdminRole } from './auth.service';

/**
 * Blocks unauthenticated access. Redirects to `/login` and round-trips
 * back via the `redirect` query param.
 */
export const authGuard: CanMatchFn = (_route: Route, segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  const url = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { redirect: url } });
};

/**
 * `roleGuard('super_admin', 'org_admin')` — accepts only the listed
 * roles. Pairs with `authGuard` (sequenced before it on the route
 * `canMatch` array). Mirrors the React `<RoleRoute allowedRoles>`
 * (sc-604, sc-612..615).
 */
export function roleGuard(...allowed: readonly AdminRole[]): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();
    if (role && allowed.includes(role)) return true;
    return router.createUrlTree(['/login']);
  };
}

/**
 * Convenience: the baseline tuple that every admin route accepts.
 * Re-exported so route configs read clean (`canMatch: [authGuard, adminBaselineGuard]`).
 */
export const adminBaselineGuard = roleGuard(...ADMIN_BASELINE_ROLES);
