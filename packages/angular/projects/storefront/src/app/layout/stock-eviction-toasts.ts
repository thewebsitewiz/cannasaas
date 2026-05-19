import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartStockGuardianService } from '../core/stock-updates/cart-stock-guardian.service';

@Component({
  selector: 'cs-stock-eviction-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (evictions().length > 0) {
      <div
        class="pointer-events-none fixed bottom-6 right-6 z-[60] flex max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        @for (e of evictions(); track e.variantId) {
          <div
            class="pointer-events-auto flex items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 shadow-lg"
          >
            <svg
              class="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-stone-900">Sold out — removed from cart</p>
              <p class="truncate text-xs text-stone-500">{{ e.name }} ({{ e.variantName }})</p>
            </div>
            <button
              type="button"
              class="text-stone-400 hover:text-stone-700"
              aria-label="Dismiss"
              (click)="dismiss(e.variantId)"
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
          </div>
        }
      </div>
    }
  `,
})
export class StockEvictionToasts {
  private readonly guardian = inject(CartStockGuardianService);

  protected readonly evictions = this.guardian.evictions;

  protected dismiss(variantId: string): void {
    this.guardian.dismiss(variantId);
  }
}
