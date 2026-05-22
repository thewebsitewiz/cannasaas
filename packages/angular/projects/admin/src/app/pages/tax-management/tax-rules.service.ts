import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AddTaxRuleGQL,
  PlatformTaxRulesGQL,
  type PlatformTaxRulesQuery,
  UpdateTaxRuleGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

export type TaxRule = PlatformTaxRulesQuery['platformTaxRules'][number];

export interface AddTaxRuleInput {
  readonly state: string;
  readonly code: string;
  readonly name: string;
  readonly rate: number;
  readonly taxBasis: string;
  readonly statutoryReference?: string | null;
}

export interface UpdateTaxRuleInput {
  readonly taxCategoryId: number;
  readonly rate?: number;
  readonly isActive?: boolean;
  readonly name?: string;
}

/**
 * Platform-level tax rules — read all + add + update.
 * No dispensary scope: this is a super_admin-only surface.
 * `add()` and `update()` bump the reload counter so the list
 * refetches via the rxResource.
 */
@Injectable({ providedIn: 'root' })
export class TaxRulesService {
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async add(input: AddTaxRuleInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(AddTaxRuleGQL);
      await firstValueFrom(
        gql.mutate({
          variables: {
            state: input.state,
            code: input.code,
            name: input.name,
            rate: input.rate,
            taxBasis: input.taxBasis,
            statutoryReference: input.statutoryReference ?? null,
          },
        }),
      );
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  async update(input: UpdateTaxRuleInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(UpdateTaxRuleGQL);
      await firstValueFrom(
        gql.mutate({
          variables: {
            taxCategoryId: input.taxCategoryId,
            rate: input.rate ?? null,
            isActive: input.isActive ?? null,
            name: input.name ?? null,
          },
        }),
      );
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  readonly resource = rxResource({
    params: () => ({ reload: this._reload() }),
    stream: () => {
      const gql = this.injector.get(PlatformTaxRulesGQL);
      return gql.fetch().pipe(map((r): readonly TaxRule[] => r.data?.platformTaxRules ?? []));
    },
  });

  readonly rules = computed<readonly TaxRule[]>(() => this.resource.value() ?? []);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;
}
