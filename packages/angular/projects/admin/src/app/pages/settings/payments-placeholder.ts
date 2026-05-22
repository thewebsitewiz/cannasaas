import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Stand-in for `/settings/payments` until sc-637 ships the real
 * PaymentProcessorsPage. Blocked on sc-194 backend payment-processor
 * abstraction.
 */
@Component({
  selector: 'cs-payments-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-4">
      <a
        routerLink="/settings"
        class="text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
      >
        ← Back to settings
      </a>
      <h1 class="text-2xl font-bold text-(--color-text)">Payment processors</h1>
      <p
        class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)"
      >
        Aeropay / CanPay config lands in sc-637 (blocked on sc-194 backend payment-processor
        abstraction).
      </p>
    </section>
  `,
})
export class PaymentsPlaceholder {}
