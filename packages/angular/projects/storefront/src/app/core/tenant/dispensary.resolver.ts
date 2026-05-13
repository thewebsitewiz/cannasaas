import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { Dispensary } from './types';
import { DispensaryContextService } from './dispensary-context.service';
import { environment } from '../../../environments/environment';

/**
 * Bootstraps the slug from the URL and fetches the active dispensary record
 * via `DispensaryGQL`. The fetched record is stored on
 * `DispensaryContextService` and also returned to the route for completeness.
 *
 * Dev flow: uses `environment.defaultDispensaryEntityId` directly. Prod flow
 * requires the eventual `DispensaryBySlugGQL` operation (see
 * `dispensary-by-slug.graphql` and the TODO in `dispensary-context.service.ts`).
 */
export const dispensaryResolver: ResolveFn<Dispensary | null> = async () => {
  const ctx = inject(DispensaryContextService);
  ctx.bootstrap();

  if (ctx.current()) return ctx.current();

  const entityId = environment.defaultDispensaryEntityId;
  if (!entityId) return null;

  return ctx.loadById(entityId);
};
