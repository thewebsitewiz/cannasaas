import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Stricter than `authRequiredGuard`: requires the JWT to carry a
 * `dispensaryId` claim (or be a super-admin). Use on any route that reads
 * or writes dispensary-scoped data — orders, inventory, timesheets, etc.
 *
 * A user authenticated without a dispensary scope (e.g., an org-admin who
 * hasn't picked a dispensary) gets bounced to `/login?reason=no-dispensary`
 * rather than landing on a screen that silently 403s every query.
 */
export const dispensaryScopedGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    const requested = '/' + segments.map((s) => s.path).join('/');
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: requested },
    });
  }
  if (!auth.hasDispensaryScope()) {
    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'no-dispensary' },
    });
  }
  return true;
};
