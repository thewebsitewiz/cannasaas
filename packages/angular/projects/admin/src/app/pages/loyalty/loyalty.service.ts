import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AvailableRewardsGQL,
  type AvailableRewardsQuery,
  CreateRewardGQL,
  LoyaltyStatsGQL,
  type LoyaltyStatsQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type LoyaltyReward = AvailableRewardsQuery['availableRewards'][number];
export type LoyaltyStats = NonNullable<LoyaltyStatsQuery['loyaltyStats']>;

export interface CreateRewardInput {
  readonly name: string;
  readonly pointsCost: number;
  readonly rewardType: string;
  readonly rewardValue: number;
  readonly description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);

  readonly saving = this._saving.asReadonly();

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async createReward(input: CreateRewardInput): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) return;
    this._saving.set(true);
    try {
      const gql = this.injector.get(CreateRewardGQL);
      await firstValueFrom(
        gql.mutate({
          variables: {
            dispensaryId,
            name: input.name,
            pointsCost: input.pointsCost,
            rewardType: input.rewardType,
            rewardValue: input.rewardValue,
            description: input.description ?? null,
          },
        }),
      );
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  readonly statsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(LoyaltyStatsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): LoyaltyStats | null => r.data?.loyaltyStats ?? null));
    },
  });

  readonly rewardsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(AvailableRewardsGQL);
      return gql
        .fetch({ variables: { dispensaryId: params.dispensaryId } })
        .pipe(map((r): readonly LoyaltyReward[] => r.data?.availableRewards ?? []));
    },
  });

  readonly stats = computed<LoyaltyStats | null>(() => this.statsResource.value() ?? null);
  readonly rewards = computed<readonly LoyaltyReward[]>(() => this.rewardsResource.value() ?? []);
  readonly isLoading = computed(
    () => this.statsResource.isLoading() || this.rewardsResource.isLoading(),
  );
  readonly error = computed(() => this.statsResource.error() ?? this.rewardsResource.error());
}
