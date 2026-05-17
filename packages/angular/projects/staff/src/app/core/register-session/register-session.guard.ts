import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CurrentSessionService } from './current-session.service';

/**
 * Order-mutating routes require an open RegisterSession. If the user
 * doesn't have one, route them to /register/open. The service refreshes
 * the cached session as soon as auth resolves; on first load we wait
 * once for that to settle before deciding.
 */
export const registerSessionGuard: CanMatchFn = async (_route, segments) => {
  const session = inject(CurrentSessionService);
  const router = inject(Router);

  if (session.activeSession() === null && session.loading()) {
    // Wait one tick for the initial refresh effect to land.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  if (session.hasOpenSession()) return true;

  const requested = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/register/open'], {
    queryParams: { redirect: requested },
  });
};
