import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Blocks the matched segment when the visitor is not signed in. Redirects to
 * `/login` with a `redirect` query param pointing back at the requested URL,
 * so the post-login navigation lands them where they were headed.
 *
 * Use as `canMatch` (not `canActivate`) so the guarded feature's lazy chunk
 * is never fetched for an anonymous visitor — saves bandwidth and prevents
 * routes that depend on `auth.user()` from briefly rendering null state.
 */
export const authRequiredGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  const requested = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: { redirect: requested },
  });
};
