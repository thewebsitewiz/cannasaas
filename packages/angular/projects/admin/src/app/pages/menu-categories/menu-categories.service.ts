import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type DispensaryProductTypeInput,
  DispensaryProductTypesGQL,
  type DispensaryProductTypesQuery,
  SaveDispensaryProductTypesGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type ProductTypeConfig = DispensaryProductTypesQuery['dispensaryProductTypes'][number];

/**
 * Wraps `DispensaryProductTypesGQL` for the menu-categories editor.
 * Save accepts the full ordered list; backend persists `sortOrder`
 * sequentially and `isEnabled` per-row. Reload counter refetches on
 * success so the resource value reflects the server's canonical order.
 */
@Injectable({ providedIn: 'root' })
export class MenuCategoriesService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async save(types: readonly DispensaryProductTypeInput[]): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    this._saving.set(true);
    try {
      const gql = this.injector.get(SaveDispensaryProductTypesGQL);
      await firstValueFrom(
        gql.mutate({
          variables: { dispensaryId, types: [...types] },
        }),
      );
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
      const gql = this.injector.get(DispensaryProductTypesGQL);
      return gql.fetch({ variables: { dispensaryId: params.dispensaryId } }).pipe(
        map((r): readonly ProductTypeConfig[] => {
          const rows = r.data?.dispensaryProductTypes ?? [];
          return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
        }),
      );
    },
  });

  readonly types = computed<readonly ProductTypeConfig[]>(() => this.resource.value() ?? []);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
