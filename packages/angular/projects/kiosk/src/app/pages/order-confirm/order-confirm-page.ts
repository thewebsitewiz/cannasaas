import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const RESET_SECONDS = 15;

@Component({
  selector: 'cs-order-confirm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-[70vh] flex-col items-center justify-center px-8 text-center">
      <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-green-600"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </div>

      <h1 class="mb-2 text-3xl font-bold text-gray-900">Order Placed!</h1>

      <p class="mb-2 text-xl text-gray-600">
        Order
        <span class="font-mono font-bold text-emerald-700"> #{{ shortOrderId() }} </span>
      </p>

      <p class="mb-8 text-lg text-gray-500">
        Please proceed to the counter to pay and pick up your order.
        <br />
        Have your ID ready.
      </p>

      <div class="rounded-2xl bg-gray-100 px-8 py-4">
        <p class="text-sm text-gray-400">Screen resets in</p>
        <p class="text-4xl font-bold text-gray-900 tabular-nums">{{ countdown() }}s</p>
      </div>

      <button
        type="button"
        (click)="goHome()"
        class="mt-8 text-lg font-semibold text-emerald-600 active:text-emerald-800"
      >
        Start New Order
      </button>
    </div>
  `,
})
export class OrderConfirmPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orderId = toSignal(this.route.paramMap.pipe(map((p) => p.get('orderId'))), {
    initialValue: null,
  });

  protected readonly shortOrderId = computed(() => {
    const id = this.orderId();
    return id ? id.slice(0, 8).toUpperCase() : '—';
  });

  protected readonly countdown = signal(RESET_SECONDS);

  constructor() {
    const interval = setInterval(() => {
      this.countdown.update((n) => {
        if (n <= 1) {
          clearInterval(interval);
          void this.router.navigateByUrl('/');
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  protected goHome(): void {
    void this.router.navigateByUrl('/');
  }
}
