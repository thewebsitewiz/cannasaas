import { DestroyRef, Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ActivePromotionsGQL,
  type ActivePromotionsQuery,
  MenuBoardProductsGQL,
  type MenuBoardProductsQuery,
} from '@cannasaas/ui-ng';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type MenuBoardProduct = MenuBoardProductsQuery['adminProducts'][number];
export type ActivePromotion = ActivePromotionsQuery['activePromotions'][number];

const REFETCH_INTERVAL_MS = 60_000;

/**
 * Data plumbing for the menu board. Both queries refetch every 60s
 * via a shared tick signal (mirrors React's `refetchInterval`).
 * setInterval is cleaned up against the injection's `DestroyRef`.
 */
@Injectable({ providedIn: 'root' })
export class MenuBoardService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tick = signal<number>(0);

  constructor() {
    const id = setInterval(() => this._tick.update((n) => n + 1), REFETCH_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  readonly productsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      tick: this._tick(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(MenuBoardProductsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly MenuBoardProduct[] => r.data?.adminProducts ?? []));
    },
  });

  readonly promotionsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      tick: this._tick(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(ActivePromotionsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly ActivePromotion[] => r.data?.activePromotions ?? []));
    },
  });

  readonly products = computed<readonly MenuBoardProduct[]>(
    () => this.productsResource.value() ?? [],
  );
  readonly promotions = computed<readonly ActivePromotion[]>(
    () => this.promotionsResource.value() ?? [],
  );
  readonly isLoading = this.productsResource.isLoading;
  readonly error = this.productsResource.error;
}
