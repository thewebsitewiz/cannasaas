import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  CashDiscountConfigGQL,
  type CashDiscountConfigQuery,
  SetCashDiscountGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type CashDiscountConfig = NonNullable<CashDiscountConfigQuery['cashDiscountConfig']>;

/**
 * Backs the cash-discount card on the Settings hub. Mirrors the
 * React `SettingsPage` flow: lazy-load config by dispensary, save
 * via mutation that returns the updated config (refetch via reload
 * counter to keep the resource value canonical).
 */
@Injectable({ providedIn: 'root' })
export class CashDiscountService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async save(percent: number, cashDeliveryEnabled: boolean): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    this._saving.set(true);
    try {
      const gql = this.injector.get(SetCashDiscountGQL);
      await firstValueFrom(
        gql.mutate({ variables: { dispensaryId, percent, cashDeliveryEnabled } }),
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
      const gql = this.injector.get(CashDiscountConfigGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): CashDiscountConfig | null => r.data?.cashDiscountConfig ?? null));
    },
  });

  readonly config = computed<CashDiscountConfig | null>(() => this.resource.value() ?? null);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
