import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  type StockAlert,
  type StockAlertKind,
  StockAlertsService,
} from '../core/stock-alerts/stock-alerts.service';

interface ActiveToast {
  readonly id: string;
  readonly alert: StockAlert;
}

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 6000;

@Component({
  selector: 'cs-stock-alert-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-2"
      role="region"
      aria-label="Stock alerts"
      aria-live="polite"
    >
      @for (toast of active(); track toast.id) {
        <div
          [class]="toastClass(toast.alert.type)"
          class="pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-md"
          role="status"
        >
          <div class="flex-1">
            <div class="font-semibold">{{ kindLabel(toast.alert.type) }}</div>
            <div class="mt-0.5 text-xs">
              <span class="font-medium">{{ toast.alert.productName }}</span>
              — {{ toast.alert.quantity }} left
            </div>
          </div>
          <button
            type="button"
            (click)="dismiss(toast.id)"
            [attr.aria-label]="'Dismiss ' + toast.alert.productName + ' alert'"
            class="text-xs leading-none opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class StockAlertToast {
  private readonly svc = inject(StockAlertsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _active = signal<readonly ActiveToast[]>([]);
  protected readonly active = this._active.asReadonly();

  /** Tracks the (productName + timestamp) key of the alert we last reacted to. */
  private lastKey: string | null = null;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    effect(() => {
      const latest = this.svc.latest();
      if (!latest) return;
      const key = latest.productName + '|' + latest.timestamp;
      if (this.lastKey === key) return;
      this.lastKey = key;
      this.pushToast(latest);
    });

    this.destroyRef.onDestroy(() => {
      for (const t of this.timers.values()) clearTimeout(t);
      this.timers.clear();
    });
  }

  protected dismiss(id: string): void {
    this._active.update((list) => list.filter((t) => t.id !== id));
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  protected toastClass(kind: StockAlertKind): string {
    return kind === 'out_of_stock'
      ? 'border-rose-300 bg-rose-50 text-rose-800'
      : 'border-amber-300 bg-amber-50 text-amber-800';
  }

  protected kindLabel(kind: StockAlertKind): string {
    return kind === 'out_of_stock' ? 'Out of stock' : 'Low stock';
  }

  private pushToast(alert: StockAlert): void {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const toast: ActiveToast = { id, alert };
    this._active.update((list) => [...list, toast].slice(-MAX_VISIBLE));
    const timer = setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    this.timers.set(id, timer);
  }
}
