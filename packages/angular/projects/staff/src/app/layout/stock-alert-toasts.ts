import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { StockAlertsService } from '../core/stock-alerts/stock-alerts.service';

const AUTO_DISMISS_MS = 8000;

@Component({
  selector: 'cs-stock-alert-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (visible().length > 0) {
      <div
        class="pointer-events-none fixed right-4 top-16 z-[60] flex max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        @for (alert of visible(); track alert.id) {
          <a
            [routerLink]="['/inventory']"
            (click)="onClick(alert.id)"
            class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-colors"
            [class]="cardClass(alert.type)"
          >
            <svg
              class="mt-0.5 h-5 w-5 shrink-0"
              [class]="iconClass(alert.type)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              @if (alert.type === 'out_of_stock') {
                <circle cx="12" cy="12" r="10" />
                <path d="M9 9l6 6M15 9l-6 6" />
              } @else {
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              }
            </svg>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold">
                {{ alert.type === 'out_of_stock' ? 'Out of stock' : 'Low stock' }}
              </p>
              <p class="truncate text-xs opacity-80">
                {{ alert.productName }} · {{ alert.quantity }} left
              </p>
            </div>
            <button
              type="button"
              class="text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss"
              (click)="onDismiss($event, alert.id)"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </a>
        }
      </div>
    }
  `,
})
export class StockAlertToasts {
  private readonly service = inject(StockAlertsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scheduled = new Set<string>();

  protected readonly visible = computed(() => this.service.alerts().filter((a) => !a.read));

  constructor() {
    effect(() => {
      const alerts = this.service.alerts();
      for (const alert of alerts) {
        if (alert.read || this.scheduled.has(alert.id)) continue;
        this.scheduled.add(alert.id);
        const timer = setTimeout(() => {
          this.service.markRead(alert.id);
        }, AUTO_DISMISS_MS);
        this.destroyRef.onDestroy(() => clearTimeout(timer));
      }
    });
  }

  protected onClick(id: string): void {
    this.service.markRead(id);
  }

  protected onDismiss(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.service.dismiss(id);
  }

  protected cardClass(type: string): string {
    return type === 'out_of_stock'
      ? 'border-rose-200 bg-white text-rose-900'
      : 'border-amber-200 bg-white text-amber-900';
  }

  protected iconClass(type: string): string {
    return type === 'out_of_stock' ? 'text-rose-600' : 'text-amber-600';
  }
}
