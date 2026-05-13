import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Dispensary } from './types';
import { DispensaryContextService } from './dispensary-context.service';
import { environment } from '../../../environments/environment';

/**
 * Bootstraps the slug from the URL and fetches the public dispensary record
 * via `DispensaryBySlugGQL`. The fetched record is stored on
 * `DispensaryContextService` and also returned to the route for completeness.
 *
 * Returns null when the slug doesn't match an active tenant. Downstream
 * features check `dispensary.entityId()` and render a "no dispensary
 * resolved" state when it's null.
 */
export const dispensaryResolver: ResolveFn<Dispensary | null> = async () => {
  const ctx = inject(DispensaryContextService);
  if (ctx.current()) return ctx.current();

  const slug = ctx.bootstrap() ?? environment.defaultDispensarySlug;
  if (!slug) return null;

  return ctx.loadBySlug(slug);
};
