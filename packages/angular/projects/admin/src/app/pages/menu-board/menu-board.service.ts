import { DestroyRef, Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  ActivePromotionsGQL,
  type ActivePromotionsQuery,
  DispensaryProductTypesGQL,
  type DispensaryProductTypesQuery,
  MenuBoardProductsGQL,
  type MenuBoardProductsQuery,
} from '@cannasaas/ui-ng';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type MenuBoardProduct = MenuBoardProductsQuery['adminProducts'][number];
export type ActivePromotion = ActivePromotionsQuery['activePromotions'][number];
export type ProductType = DispensaryProductTypesQuery['dispensaryProductTypes'][number];

const REFETCH_INTERVAL_MS = 60_000;

/**
 * Data plumbing for the menu board.
 *
 * - Products + promotions refetch every 60s via a shared tick signal.
 * - Product type tabs come from `dispensaryProductTypes` so the board
 *   only shows tabs the dispensary has actually enabled, sorted by
 *   the operator's preferred order (sc-639 menu-categories admin).
 * - Per-tab filtering is computed on the client by matching
 *   `product.productTypeId` to the active tab's id.
 *
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

  readonly productTypesResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      tick: this._tick(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(DispensaryProductTypesGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly ProductType[] => r.data?.dispensaryProductTypes ?? []));
    },
  });

  readonly products = computed<readonly MenuBoardProduct[]>(
    () => this.productsResource.value() ?? [],
  );
  readonly promotions = computed<readonly ActivePromotion[]>(
    () => this.promotionsResource.value() ?? [],
  );

  /**
   * Enabled product types for this dispensary, sorted by the
   * operator's preferred order. Empty if the dispensary has never
   * visited /menu-categories — the page falls back to showing all
   * products and hiding tabs in that case.
   */
  readonly enabledProductTypes = computed<readonly ProductType[]>(() => {
    const types = this.productTypesResource.value() ?? [];
    return [...types].filter((t) => t.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
  });

  readonly isLoading = this.productsResource.isLoading;
  readonly error = this.productsResource.error;
}
