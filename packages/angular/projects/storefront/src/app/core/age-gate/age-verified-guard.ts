import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DispensaryContextService } from '../tenant/dispensary-context.service';
import { isVerified } from './age-storage';

/**
 * Blocks every customer-facing route until the visitor has confirmed they are
 * 21+. Verification persists in localStorage for 24 hours per tenant.
 *
 * Runs as `canMatch` (not `canActivate`) so the storefront can short-circuit
 * the lazy-loaded feature chunks — no product imagery or pricing should be
 * fetched before verification.
 */
export const ageVerifiedGuard: CanMatchFn = () => {
  const ctx = inject(DispensaryContextService);
  const router = inject(Router);

  // Bootstrap the slug eagerly so the storage key is stable before the
  // dispensary resolver runs.
  const slug = ctx.slug() ?? ctx.bootstrap();
  const tenantKey = slug ?? 'anonymous';

  if (isVerified(tenantKey)) return true;
  return router.createUrlTree(['/age-gate']);
};
