import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import {
  AvailableRewardsGQL,
  AvailableRewardsQuery,
  MyLoyaltyGQL,
  MyLoyaltyQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

type Loyalty = NonNullable<MyLoyaltyQuery['myLoyalty']>;
type Reward = AvailableRewardsQuery['availableRewards'][number];

@Component({
  selector: 'cs-loyalty-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loyalty(); as l) {
      <div class="space-y-4">
        <section class="rounded-2xl border border-stone-200 bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg
                class="h-5 w-5 text-amber-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 21 12 16.5 5.8 21l2.4-7.1L2 9.4h7.6z"
                />
              </svg>
              <h3 class="font-semibold text-stone-900">Loyalty Rewards</h3>
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              [style.background-color]="tierBadgeBg()"
              [style.color]="tierColor()"
            >
              {{ l.tierName }}
            </span>
          </div>

          <p class="text-3xl font-bold tabular-nums text-stone-900">
            {{ l.points.toLocaleString() }}
            <span class="text-sm font-normal text-stone-500">points</span>
          </p>
          <p class="mt-1 text-xs text-stone-400">
            Earning {{ l.multiplier }}x points per $1
          </p>

          @if (l.nextTier; as next) {
            <div class="mt-4">
              <div class="mb-1 flex justify-between text-xs text-stone-500">
                <span>{{ l.tierName }}</span>
                <span>{{ next.name }} — {{ next.pointsNeeded }} pts to go</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  class="h-full rounded-full transition-all"
                  [style.width.%]="progressPct()"
                  [style.background-color]="tierColor()"
                ></div>
              </div>
            </div>
          }
        </section>

        @if (rewards().length > 0) {
          <section class="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 class="mb-3 flex items-center gap-2 font-semibold text-stone-900">
              <svg
                class="h-4 w-4 text-emerald-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
              </svg>
              Available Rewards
            </h3>
            <div class="space-y-2">
              @for (r of rewards().slice(0, 4); track r.rewardId) {
                <div
                  class="flex items-center justify-between border-b border-stone-50 py-2 last:border-0"
                >
                  <div>
                    <p class="text-sm font-medium text-stone-900">{{ r.name }}</p>
                    @if (r.description) {
                      <p class="text-xs text-stone-400">{{ r.description }}</p>
                    }
                  </div>
                  <span
                    class="rounded-full px-2 py-1 text-xs font-bold tabular-nums"
                    [class]="
                      l.points >= r.pointsCost
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-stone-100 text-stone-500'
                    "
                  >
                    {{ r.pointsCost }} pts
                  </span>
                </div>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class LoyaltyCard {
  private readonly auth = inject(AuthService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly myLoyaltyGQL = inject(MyLoyaltyGQL);
  private readonly availableRewardsGQL = inject(AvailableRewardsGQL);

  private readonly isAuthenticated = this.auth.isAuthenticated;

  private readonly loyaltyResource = resource<
    Loyalty | null,
    { dispensaryId: string | null; isAuthenticated: boolean }
  >({
    params: () => ({
      dispensaryId: this.dispensary.entityId(),
      isAuthenticated: this.isAuthenticated(),
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated || !params.dispensaryId) return null;
      const result = await firstValueFrom(
        this.myLoyaltyGQL.fetch({
          variables: { dispensaryId: params.dispensaryId },
        }),
      );
      return result.data?.myLoyalty ?? null;
    },
  });

  private readonly rewardsResource = resource<
    readonly Reward[],
    { dispensaryId: string | null; isAuthenticated: boolean }
  >({
    params: () => ({
      dispensaryId: this.dispensary.entityId(),
      isAuthenticated: this.isAuthenticated(),
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated || !params.dispensaryId) return [];
      const result = await firstValueFrom(
        this.availableRewardsGQL.fetch({
          variables: { dispensaryId: params.dispensaryId },
        }),
      );
      return result.data?.availableRewards ?? [];
    },
  });

  protected readonly loyalty = computed(() => this.loyaltyResource.value() ?? null);
  protected readonly rewards = computed(() => this.rewardsResource.value() ?? []);

  protected readonly tierColor = computed(() => this.loyalty()?.tierColor ?? '#CD7F32');
  protected readonly tierBadgeBg = computed(() => this.tierColor() + '22');

  protected readonly progressPct = computed(() => {
    const l = this.loyalty();
    if (!l?.nextTier) return 100;
    const currentMin = l.allTiers.find((t) => t.code === l.tier)?.minPoints ?? 0;
    const earnedInTier = l.lifetimePoints - currentMin;
    const tierSpan = l.nextTier.pointsNeeded + earnedInTier;
    if (tierSpan <= 0) return 100;
    return Math.min(100, (earnedInTier / tierSpan) * 100);
  });
}
