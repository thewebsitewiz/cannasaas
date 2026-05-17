import { Injectable, computed, inject, signal } from '@angular/core';
import { DispensaryBySlugGQL } from '@cannasaas/ui-ng';
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
  private readonly dispensaryBySlugGQL = inject(DispensaryBySlugGQL);
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
   * Fetches the public Dispensary record by URL slug and seeds the context.
   * Returns null when the slug doesn't match an active tenant — callers
   * should treat that as "redirect to a generic landing page".
   */
  async loadBySlug(slug: string): Promise<Dispensary | null> {
    this._loading.set(true);
    try {
      const result = await firstValueFrom(
        this.dispensaryBySlugGQL.fetch({ variables: { slug } }),
      );
      const dispensary = result.data?.dispensaryBySlug;
      if (!dispensary) return null;
      const mapped: Dispensary = {
        entityId: dispensary.entityId,
        name: dispensary.name,
        isActive: dispensary.isActive,
        isPickupEnabled: dispensary.isPickupEnabled,
        isDeliveryEnabled: dispensary.isDeliveryEnabled,
      };
      this._current.set(mapped);
      this._slug.set(dispensary.slug);
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
