import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CashDiscountService } from './cash-discount.service';

const PREVIEW_ROWS = [25, 50, 75, 100, 150];

/**
 * Settings hub for the dispensary admin. Two surfaces:
 *
 * 1. Two navigation cards that deep-link to `/settings/theme` (sc-636)
 *    and `/settings/payments` (sc-637) — both placeholder routes
 *    until those stories ship.
 * 2. Cash-discount card: slider for `percent` (0–15%), checkbox for
 *    "allow cash on delivery", Save → mutation, preview table.
 *
 * The React `DesignSystemPicker` is intentionally **not ported**:
 * admin's CLAUDE.md prohibits per-tenant theme injection inside the
 * admin app itself (storefront themes are configured via the
 * upcoming ThemePage in sc-636).
 */
@Component({
  selector: 'cs-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Settings</h1>

      <!-- Sub-page nav cards -->
      <div class="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
        <a
          routerLink="/settings/theme"
          class="group rounded-xl border border-(--color-border) bg-(--color-surface) p-5 transition-colors hover:border-(--color-primary)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="rounded-lg bg-(--color-primary)/10 p-2 text-lg text-(--color-primary)"
                aria-hidden="true"
              >
                🎨
              </div>
              <div>
                <h3 class="text-sm font-semibold text-(--color-text)">Storefront theme</h3>
                <p class="mt-0.5 text-xs text-(--color-text-muted)">
                  Customize colors, fonts &amp; branding
                </p>
              </div>
            </div>
            <span
              class="text-(--color-text-muted) transition-colors group-hover:text-(--color-primary)"
              aria-hidden="true"
            >
              ›
            </span>
          </div>
        </a>

        <a
          routerLink="/settings/payments"
          class="group rounded-xl border border-(--color-border) bg-(--color-surface) p-5 transition-colors hover:border-(--color-primary)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="rounded-lg bg-(--color-primary)/10 p-2 text-lg text-(--color-primary)"
                aria-hidden="true"
              >
                💳
              </div>
              <div>
                <h3 class="text-sm font-semibold text-(--color-text)">Payment processors</h3>
                <p class="mt-0.5 text-xs text-(--color-text-muted)">
                  Enable Aeropay / CanPay, provision merchant credentials
                </p>
              </div>
            </div>
            <span
              class="text-(--color-text-muted) transition-colors group-hover:text-(--color-primary)"
              aria-hidden="true"
            >
              ›
            </span>
          </div>
        </a>
      </div>

      <!-- Cash discount -->
      <div class="max-w-lg rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <span aria-hidden="true">$</span> Cash discount
        </h2>
        <p class="mb-6 text-sm text-(--color-text-secondary)">
          Offer a percentage discount to customers who pay with cash. Reduces processor fees and
          encourages cash transactions.
        </p>

        @if (isLoading()) {
          <p class="text-sm text-(--color-text-muted)">Loading cash discount…</p>
        } @else if (error(); as err) {
          <p class="text-sm text-rose-500" role="alert">
            Couldn't load cash discount: {{ errorMessage() }}
          </p>
        } @else {
          <label class="mb-4 block">
            <span class="flex items-center gap-1 text-sm font-medium text-(--color-text-secondary)">
              <span aria-hidden="true">%</span> Discount percentage
            </span>
            <div class="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                [value]="percent()"
                (input)="onPercentInput($event)"
                aria-label="Discount percentage"
                class="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-(--color-border) accent-(--color-primary)"
              />
              <span class="w-16 text-right text-2xl font-bold tabular-nums text-(--color-primary)">
                {{ percent() }}%
              </span>
            </div>
            <p class="mt-1 text-xs text-(--color-text-muted)">
              @if (percent() === 0) {
                No cash discount active
              } @else {
                Customers save {{ savingsHint() }} on a $50 order
              }
            </p>
          </label>

          <label class="mb-6 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              [checked]="cashDelivery()"
              (change)="onCashDeliveryChange($event)"
              aria-label="Allow cash on delivery"
              class="h-5 w-5 rounded border-(--color-border) accent-(--color-primary)"
            />
            <div>
              <span class="text-sm font-medium text-(--color-text-secondary)">
                Allow cash on delivery
              </span>
              <p class="text-xs text-(--color-text-muted)">
                Customers can pay with cash when the driver arrives
              </p>
            </div>
          </label>

          <button
            type="button"
            (click)="onSave()"
            [disabled]="saving() || !isDirty()"
            class="flex items-center gap-2 rounded-lg bg-(--color-primary) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
          >
            @if (saving()) {
              Saving…
            } @else {
              Save settings
            }
          </button>

          @if (savedTick()) {
            <p class="mt-3 text-sm text-emerald-500" role="status">Settings saved successfully.</p>
          }
        }
      </div>

      @if (percent() > 0) {
        <div
          class="max-w-lg rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/5 p-6"
        >
          <h3 class="mb-2 font-semibold text-(--color-primary)">Cash discount preview</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-(--color-text-secondary)">
                <th class="pb-1">Order</th>
                <th class="pb-1">Discount</th>
                <th class="pb-1">Customer pays</th>
              </tr>
            </thead>
            <tbody class="text-(--color-text)">
              @for (amt of previewRows; track amt) {
                <tr>
                  <td class="py-0.5">{{ formatMoney(amt) }}</td>
                  <td class="py-0.5">-{{ formatMoney(discountFor(amt)) }}</td>
                  <td class="py-0.5 font-semibold">{{ formatMoney(payFor(amt)) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class SettingsPage {
  private readonly svc = inject(CashDiscountService);

  protected readonly previewRows = PREVIEW_ROWS;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;

  protected readonly percent = signal<number>(0);
  protected readonly cashDelivery = signal<boolean>(true);
  protected readonly savedTick = signal<boolean>(false);

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unknown error.';
  });

  protected readonly isDirty = computed(() => {
    const c = this.svc.config();
    if (!c) return this.percent() !== 0 || this.cashDelivery() !== true;
    return (
      this.percent() !== c.cashDiscountPercent || this.cashDelivery() !== c.cashDeliveryEnabled
    );
  });

  protected readonly savingsHint = computed(() => '$' + ((50 * this.percent()) / 100).toFixed(2));

  constructor() {
    // Mirror loaded config into the local edit signals so user edits
    // diverge from server state cleanly.
    effect(() => {
      const c = this.svc.config();
      if (!c) return;
      this.percent.set(c.cashDiscountPercent);
      this.cashDelivery.set(c.cashDeliveryEnabled);
    });
  }

  protected onPercentInput(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.percent.set(Number.isNaN(value) ? 0 : value);
  }

  protected onCashDeliveryChange(event: Event): void {
    this.cashDelivery.set((event.target as HTMLInputElement).checked);
  }

  protected async onSave(): Promise<void> {
    await this.svc.save(this.percent(), this.cashDelivery());
    this.savedTick.set(true);
    setTimeout(() => this.savedTick.set(false), 3000);
  }

  protected discountFor(amount: number): number {
    return (amount * this.percent()) / 100;
  }

  protected payFor(amount: number): number {
    return amount - this.discountFor(amount);
  }

  protected formatMoney(value: number): string {
    return (
      '$' +
      value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
}
