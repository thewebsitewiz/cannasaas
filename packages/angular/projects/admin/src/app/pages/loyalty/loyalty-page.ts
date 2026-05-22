import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LoyaltyService, type LoyaltyReward } from './loyalty.service';

interface CreateRewardFormControls {
  readonly name: FormControl<string>;
  readonly pointsCost: FormControl<string>;
  readonly rewardType: FormControl<string>;
  readonly rewardValue: FormControl<string>;
  readonly description: FormControl<string>;
}

const REWARD_TYPES = [
  { value: 'discount_percent', label: '% Discount' },
  { value: 'discount_fixed', label: '$ Off' },
  { value: 'free_item', label: 'Free Item' },
  { value: 'free_delivery', label: 'Free Delivery' },
];

/**
 * Loyalty admin: 5 KPI cards + tier breakdown + create-reward form
 * + rewards catalog table. Mirrors React parity.
 *
 * Filed scope mentioned customer-points adjust (manual credit/debit
 * with audit reason) and "loyalty settings" (points-per-dollar,
 * redemption rules). React surfaces neither — file a follow-up if
 * those become workflow needs.
 */
@Component({
  selector: 'cs-loyalty-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-(--color-text)">Loyalty program</h1>
        <button
          type="button"
          (click)="toggleCreate()"
          class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
        >
          {{ showCreate() ? 'Cancel' : '+ New reward' }}
        </button>
      </header>

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading loyalty…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load loyalty</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        @if (stats(); as s) {
          <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                {{ s.activeMembers }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Active members</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-2xl font-bold text-emerald-500 tabular-nums">
                {{ s.totalEarned.toLocaleString() }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Points earned</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-2xl font-bold text-purple-500 tabular-nums">
                {{ s.totalRedeemed.toLocaleString() }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Points redeemed</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                {{ s.redemptionCount }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Redemptions</p>
            </article>
            <article
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
            >
              <p class="text-2xl font-bold text-amber-500 tabular-nums">
                {{ s.birthdayClaims }}
              </p>
              <p class="text-xs text-(--color-text-secondary)">Birthday claims</p>
            </article>
          </div>

          @if (s.tierBreakdown.length > 0) {
            <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
              <h2 class="mb-3 font-semibold text-(--color-text)">Member tiers</h2>
              <ul class="grid grid-cols-2 gap-3 md:grid-cols-4">
                @for (t of s.tierBreakdown; track t.tier) {
                  <li class="text-center">
                    <span
                      class="mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize"
                      [class]="tierBadgeClass(t.tier)"
                    >
                      {{ t.tier }}
                    </span>
                    <p class="text-2xl font-bold text-(--color-text) tabular-nums">
                      {{ t.count }}
                    </p>
                    <p class="text-xs text-(--color-text-secondary)">members</p>
                  </li>
                }
              </ul>
            </div>
          }
        }

        @if (showCreate()) {
          <form
            [formGroup]="createForm"
            (ngSubmit)="onSubmit()"
            class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-6"
            aria-label="Create reward"
          >
            <h2 class="text-lg font-semibold text-(--color-text)">New reward</h2>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                formControlName="name"
                placeholder="Reward name *"
                aria-label="Reward name"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <input
                type="number"
                formControlName="pointsCost"
                placeholder="Points cost *"
                aria-label="Points cost"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <select
                formControlName="rewardType"
                aria-label="Reward type"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              >
                @for (t of rewardTypes; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
              <input
                type="number"
                step="any"
                formControlName="rewardValue"
                placeholder="Value (e.g. 10 for 10%)"
                aria-label="Reward value"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
              />
              <input
                type="text"
                formControlName="description"
                placeholder="Description"
                aria-label="Description"
                class="rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none md:col-span-2"
              />
            </div>
            <button
              type="submit"
              [disabled]="createForm.invalid || saving()"
              class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
            >
              @if (saving()) {
                Saving…
              } @else {
                Create reward
              }
            </button>
          </form>
        }

        <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <header
            class="border-b border-(--color-border) bg-(--color-bg) px-4 py-3 font-semibold text-(--color-text)"
          >
            Rewards catalog
          </header>
          @if (rewards().length === 0) {
            <p class="p-8 text-center text-sm text-(--color-text-muted)">No rewards yet.</p>
          } @else {
            <table class="w-full text-sm">
              <thead>
                <tr class="text-(--color-text-secondary)">
                  <th class="px-4 py-2 text-left">Reward</th>
                  <th class="px-4 py-2 text-right">Points cost</th>
                  <th class="px-4 py-2 text-center">Type</th>
                  <th class="px-4 py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (r of rewards(); track r.rewardId) {
                  <tr>
                    <td class="px-4 py-3">
                      <p class="font-medium text-(--color-text)">{{ r.name }}</p>
                      @if (r.description) {
                        <p class="text-xs text-(--color-text-muted)">{{ r.description }}</p>
                      }
                    </td>
                    <td class="px-4 py-3 text-right font-bold tabular-nums text-(--color-primary)">
                      {{ r.pointsCost }} pts
                    </td>
                    <td class="px-4 py-3 text-center text-xs text-(--color-text-secondary)">
                      {{ formatType(r.rewardType) }}
                    </td>
                    <td class="px-4 py-3 text-right tabular-nums text-(--color-text)">
                      {{ formatValue(r) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </section>
  `,
})
export class LoyaltyPage {
  private readonly svc = inject(LoyaltyService);

  protected readonly rewardTypes = REWARD_TYPES;

  protected readonly stats = this.svc.stats;
  protected readonly rewards = this.svc.rewards;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;

  protected readonly showCreate = signal<boolean>(false);

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load loyalty data.';
  });

  /* eslint-disable @typescript-eslint/unbound-method --
   * Validators.* are pure functions; the rule's `this:void` warning
   * is a false positive for these references.
   */
  protected readonly createForm = new FormGroup<CreateRewardFormControls>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    pointsCost: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rewardType: new FormControl('discount_percent', { nonNullable: true }),
    rewardValue: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected toggleCreate(): void {
    this.showCreate.update((v) => !v);
  }

  protected async onSubmit(): Promise<void> {
    if (this.createForm.invalid) return;
    const v = this.createForm.getRawValue();
    const points = parseInt(v.pointsCost, 10);
    const value = parseFloat(v.rewardValue);
    if (Number.isNaN(points) || Number.isNaN(value)) return;
    await this.svc.createReward({
      name: v.name,
      pointsCost: points,
      rewardType: v.rewardType,
      rewardValue: value,
      description: v.description.trim() || null,
    });
    this.createForm.reset({
      name: '',
      pointsCost: '',
      rewardType: 'discount_percent',
      rewardValue: '',
      description: '',
    });
    this.showCreate.set(false);
  }

  protected tierBadgeClass(tier: string): string {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-amber-500/15 text-amber-500';
      case 'silver':
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
      case 'gold':
        return 'bg-yellow-500/15 text-yellow-500';
      case 'platinum':
        return 'bg-purple-500/15 text-purple-500';
      default:
        return 'bg-(--color-surface-hover) text-(--color-text-secondary)';
    }
  }

  protected formatType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  protected formatValue(r: LoyaltyReward): string {
    return r.rewardType.includes('percent') ? r.rewardValue + '%' : '$' + r.rewardValue.toFixed(2);
  }
}
