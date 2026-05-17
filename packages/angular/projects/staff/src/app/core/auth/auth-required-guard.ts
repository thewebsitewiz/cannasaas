import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Blocks the matched segment when the operator is not signed in. Redirects
 * to `/login` with a `redirect` query param so post-login navigation lands
 * them where they were headed. `CanMatch` not `CanActivate` so the guarded
 * feature's lazy chunk is never fetched for an anonymous visitor.
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
