import { Injectable, computed, inject, signal } from '@angular/core';
import { DispensaryGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { Dispensary } from './types';
import { resolveSlugFromLocation } from './slug';

/**
 * Holds the currently-active dispensary for the request. Set once by the
 * DispensaryResolver and consumed by every downstream feature via DI.
 *
 * The slug signal is set early (in `bootstrap`) so age-gate and theming can
 * run before the full Dispensary record has been fetched.
 */
@Injectable({ providedIn: 'root' })
export class DispensaryContextService {
  private readonly dispensaryGQL = inject(DispensaryGQL);
  private readonly _slug = signal<string | null>(null);
  private readonly _current = signal<Dispensary | null>(null);
  private readonly _loading = signal(false);

  readonly slug = this._slug.asReadonly();
  readonly current = this._current.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly entityId = computed(() => this._current()?.entityId ?? null);
  readonly isReady = computed(() => this._current() !== null);

  bootstrap(): string | null {
    const slug = resolveSlugFromLocation();
    this._slug.set(slug);
    return slug;
  }

  /**
   * Fetches the Dispensary record by entityId and seeds the context.
   *
   * TODO(post-scaffold): swap for `DispensaryBySlugGQL` so we can drop the
   * `defaultDispensaryEntityId` dev override and resolve straight from slug.
   */
  async loadById(entityId: string): Promise<Dispensary | null> {
    this._loading.set(true);
    try {
      const result = await firstValueFrom(this.dispensaryGQL.fetch({ variables: { entityId } }));
      const dispensary = result.data?.dispensary;
      if (!dispensary) return null;
      const mapped: Dispensary = {
        entityId: dispensary.entityId,
        name: dispensary.name,
        isActive: dispensary.isActive,
        isPickupEnabled: dispensary.isPickupEnabled,
        isDeliveryEnabled: dispensary.isDeliveryEnabled,
      };
      this._current.set(mapped);
      return mapped;
    } finally {
      this._loading.set(false);
    }
  }

  setCurrent(dispensary: Dispensary | null): void {
    this._current.set(dispensary);
  }

  clear(): void {
    this._current.set(null);
    this._slug.set(null);
  }
}
