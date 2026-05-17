import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { OrderGQL, OrderQuery } from '@cannasaas/ui-ng';
import { filter, firstValueFrom } from 'rxjs';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';
import { OrderSocketService } from '../../core/order-socket/order-socket.service';

type OrderRecord = NonNullable<OrderQuery['order']>;

interface Step {
  readonly key: string;
  readonly label: string;
  readonly path: string;
}

const STEPS: readonly Step[] = [
  {
    key: 'confirmed',
    label: 'Confirmed',
    path: 'M5 13l4 4L19 7',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    path: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  },
  { key: 'ready', label: 'Ready', path: 'M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z' },
  {
    key: 'out_for_delivery',
    label: 'On the way',
    path: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM6 19a2 2 0 100 4 2 2 0 000-4zM18 19a2 2 0 100 4 2 2 0 000-4z',
  },
  {
    key: 'completed',
    label: 'Completed',
    path: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  },
] as const;

const STEP_INDEX: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  preparing: 1,
  ready: 2,
  out_for_delivery: 3,
  delivered: 4,
  completed: 4,
  picked_up: 4,
};

@Component({
  selector: 'cs-order-tracking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (orderResource.isLoading()) {
      <div class="mx-auto max-w-2xl px-4 py-20 text-center text-stone-500">Loading…</div>
    } @else if (!order()) {
      <div class="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 class="text-xl font-bold text-stone-900">Order not found</h1>
        <a
          class="mt-2 inline-block text-sm font-medium text-emerald-700"
          [routerLink]="['/products']"
          >Back to menu</a
        >
      </div>
    } @else {
      <div class="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <a
          class="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
          [routerLink]="['/account']"
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Account
        </a>

        <div class="mb-6 rounded-xl border border-stone-200 bg-white p-6">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-stone-900">Order #{{ shortId() }}</h1>
              <p class="text-sm capitalize text-stone-500">
                {{ orderTypeLabel() }} · {{ createdAtLabel() }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold tabular-nums text-emerald-700">\${{ totalLabel() }}</p>
              @if (connected()) {
                <span class="flex items-center justify-end gap-1 text-xs text-emerald-700">
                  <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-700"></span>
                  Live
                </span>
              }
            </div>
          </div>

          @if (isCancelled()) {
            <div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4" role="status">
              <p class="text-sm font-medium text-rose-700">This order has been cancelled.</p>
              @if (order()?.cancellationReason; as reason) {
                <p class="mt-1 text-xs text-rose-700/80">{{ reason }}</p>
              }
            </div>
          } @else {
            <div class="mt-8">
              <div class="relative flex items-center justify-between">
                <div class="absolute left-0 right-0 top-5 h-0.5 bg-stone-200">
                  <div
                    class="h-full bg-emerald-700 transition-all duration-500"
                    [style.width.%]="progressPercent()"
                  ></div>
                </div>

                @for (step of visibleSteps(); track step.key; let i = $index) {
                  <div class="relative z-10 flex flex-col items-center">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                      [class]="stepCircleClass(i)"
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
                        <path [attr.d]="step.path" />
                      </svg>
                    </div>
                    <span
                      class="mt-2 text-xs font-medium"
                      [class]="i <= currentStep() ? 'text-emerald-700' : 'text-stone-500'"
                      >{{ step.label }}</span
                    >
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <h2 class="font-semibold text-stone-900">{{ summaryHeadline() }}</h2>

          <div class="space-y-1.5 border-t border-stone-200 pt-4 text-sm">
            <div class="flex justify-between">
              <span class="text-stone-700">Subtotal</span>
              <span class="tabular-nums text-stone-900">\${{ subtotalLabel() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-stone-700">Tax</span>
              <span class="tabular-nums text-stone-900">\${{ taxLabel() }}</span>
            </div>
            <div class="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
              <span class="text-stone-900">Total</span>
              <span class="tabular-nums text-stone-900">\${{ totalLabel() }}</span>
            </div>
          </div>

          <p class="text-xs text-stone-500">Order ID: {{ id() }}</p>
        </div>
      </div>
    }
  `,
})
export class OrderTrackingPage {
  readonly id = input.required<string>();

  private readonly orderGQL = inject(OrderGQL);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly orderSocket = inject(OrderSocketService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly liveStatus = signal<string | null>(null);
  protected readonly connected = this.orderSocket.connected;

  protected readonly orderResource = resource<
    OrderRecord | null,
    { id: string; dispensaryId: string | null }
  >({
    params: () => ({ id: this.id(), dispensaryId: this.dispensary.entityId() }),
    loader: async ({ params }) => {
      const result = await firstValueFrom(
        this.orderGQL.fetch({
          variables: { orderId: params.id, dispensaryId: params.dispensaryId },
        }),
      );
      return result.data?.order ?? null;
    },
  });

  protected readonly order = computed<OrderRecord | null>(() => {
    const fetched = this.orderResource.value();
    if (!fetched) return null;
    const live = this.liveStatus();
    return live ? { ...fetched, orderStatus: live } : fetched;
  });

  protected readonly currentStep = computed(
    () => STEP_INDEX[this.order()?.orderStatus ?? ''] ?? -1,
  );
  protected readonly isCancelled = computed(() => this.order()?.orderStatus === 'cancelled');
  protected readonly isPickup = computed(() => {
    const t = this.order()?.orderType;
    return t === 'pickup' || t === 'in_store';
  });
  protected readonly isComplete = computed(() => this.currentStep() >= 4);
  protected readonly visibleSteps = computed<readonly Step[]>(() =>
    this.isPickup() ? STEPS.filter((_, i) => i !== 3) : STEPS,
  );
  protected readonly progressPercent = computed(() => {
    const visible = this.visibleSteps().length;
    if (visible <= 1) return 0;
    const stepIdx = Math.max(0, this.currentStep());
    // Subtract 1 for the "On the way" step that's hidden in pickup orders so
    // the index lines up with the visible step count.
    const adjusted = this.isPickup() && stepIdx >= 3 ? stepIdx - 1 : stepIdx;
    return (adjusted / (visible - 1)) * 100;
  });

  protected readonly shortId = computed(() => this.id().slice(0, 8).toUpperCase());
  protected readonly orderTypeLabel = computed(
    () => this.order()?.orderType?.replace('_', ' ') ?? '',
  );
  protected readonly createdAtLabel = computed(() => {
    const created = this.order()?.createdAt;
    return created ? new Date(created).toLocaleDateString() : '';
  });
  protected readonly subtotalLabel = computed(() => Number(this.order()?.subtotal ?? 0).toFixed(2));
  protected readonly taxLabel = computed(() => Number(this.order()?.taxTotal ?? 0).toFixed(2));
  protected readonly totalLabel = computed(() => Number(this.order()?.total ?? 0).toFixed(2));

  protected readonly summaryHeadline = computed(() => {
    if (this.isCancelled()) return 'Order Cancelled';
    if (this.isComplete()) return 'Order Complete!';
    if (this.isPickup())
      return "Your order is being prepared. We'll notify you when it's ready for pickup.";
    return 'Your order is on its way!';
  });

  constructor() {
    // Subscribe to per-order room events whenever the route id changes.
    // Effect cleanup unsubscribes on destroy and on id changes.
    effect((onCleanup) => {
      const orderId = this.id();
      if (!orderId) return;
      this.liveStatus.set(null);
      this.orderSocket.subscribeToOrder(orderId);
      onCleanup(() => this.orderSocket.unsubscribeFromOrder(orderId));
    });

    // Mirror order:update status changes onto the local liveStatus signal so
    // the timeline advances without a full refetch. Filter to this order only.
    this.orderSocket.events$
      .pipe(
        filter((event) => event.kind === 'order' && event.orderId === this.id()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.liveStatus.set(event.status);
      });
  }

  stepCircleClass(stepIdx: number): string {
    const current = this.currentStep();
    const adjusted = this.isPickup() && current >= 3 ? current - 1 : current;
    if (stepIdx === adjusted) {
      return 'bg-emerald-700 text-white ring-4 ring-emerald-50';
    }
    if (stepIdx < adjusted) {
      return 'bg-emerald-700 text-white';
    }
    return 'bg-stone-100 text-stone-500';
  }
}
