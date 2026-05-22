import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type SaveThemeConfigInput,
  SaveThemeConfigGQL,
  ThemeConfigGQL,
  type ThemeConfigQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';

export type ThemeConfig = NonNullable<ThemeConfigQuery['themeConfig']>;

/**
 * Loads + persists the per-dispensary storefront theme config.
 * Components diverge local edit state from this server snapshot.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async save(input: SaveThemeConfigInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(SaveThemeConfigGQL);
      await firstValueFrom(gql.mutate({ variables: { input } }));
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  readonly resource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(ThemeConfigGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): ThemeConfig | null => r.data?.themeConfig ?? null));
    },
  });

  readonly config = computed<ThemeConfig | null>(() => this.resource.value() ?? null);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
