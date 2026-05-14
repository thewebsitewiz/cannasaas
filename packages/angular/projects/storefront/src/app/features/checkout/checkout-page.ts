import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CreateOrderGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import {
  DeliveryEligibility,
  DeliveryService,
} from '../../core/delivery/delivery.service';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

type OrderType = 'pickup' | 'delivery';
type PaymentMethod = 'cash';

const TAX_RATE = 0.22;
const DEFAULT_DELIVERY_FEE = 5;

@Component({
  selector: 'cs-checkout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (isEmpty()) {
      <div class="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 class="mb-2 text-2xl font-bold text-stone-900">Nothing to checkout</h1>
        <a class="font-medium text-emerald-700" [routerLink]="['/products']">Back to menu</a>
      </div>
    } @else {
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 class="mb-8 text-2xl font-bold text-stone-900">Checkout</h1>

        <div class="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
          <div class="space-y-6">
            @if (!isAuthenticated()) {
              <div
                class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
              >
                <svg
                  class="h-5 w-5 shrink-0 text-amber-700"
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
                <div>
                  <p class="text-sm font-medium text-stone-900">
                    Please log in to complete your order
                  </p>
                  <a
                    class="text-sm font-medium text-emerald-700"
                    [routerLink]="['/login']"
                    [queryParams]="{ redirect: '/checkout' }"
                    >Sign in</a
                  >
                </div>
              </div>
            }

            <section class="rounded-xl border border-stone-200 bg-white p-6">
              <h2 class="mb-4 text-lg font-semibold text-stone-900">Fulfillment</h2>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-xl border-2 p-4 transition-colors"
                  [class]="fulfillmentClass('pickup')"
                  (click)="orderType.set('pickup')"
                >
                  <svg
                    class="h-5 w-5"
                    [class]="orderType() === 'pickup' ? 'text-emerald-700' : 'text-stone-500'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l1-5h16l1 5M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9" />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium text-stone-900">Pickup</p>
                    <p class="text-xs text-stone-500">Ready in ~15 min</p>
                  </div>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-xl border-2 p-4 transition-colors"
                  [class]="fulfillmentClass('delivery')"
                  (click)="orderType.set('delivery')"
                >
                  <svg
                    class="h-5 w-5"
                    [class]="orderType() === 'delivery' ? 'text-emerald-700' : 'text-stone-500'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM6 19a2 2 0 100 4 2 2 0 000-4zM18 19a2 2 0 100 4 2 2 0 000-4z"
                    />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium text-stone-900">Delivery</p>
                    <p class="text-xs text-stone-500">
                      @if (eligibilityZone(); as z) {
                        {{ z.estimatedMinutesMin }}-{{ z.estimatedMinutesMax }} min
                      } @else {
                        45-60 min
                      }
                    </p>
                  </div>
                </button>
              </div>

              @if (orderType() === 'delivery') {
                <div class="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <div class="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-medium text-stone-900">Delivery Location</p>
                      <p class="text-xs text-stone-500">
                        We'll check you're in our delivery zone.
                      </p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 rounded-lg border border-emerald-700 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="locating()"
                      (click)="onUseMyLocation()"
                    >
                      @if (locating()) {
                        Locating…
                      } @else {
                        Use My Location
                      }
                    </button>
                  </div>

                  @if (locationError(); as err) {
                    <p class="text-xs text-rose-700">{{ err }}</p>
                  } @else if (eligibilityChecking()) {
                    <p class="text-xs text-stone-500">Checking delivery availability…</p>
                  } @else if (eligibility(); as e) {
                    @if (e.eligible && e.zone; as zone) {
                      <div class="flex items-center gap-2 text-xs">
                        <svg
                          class="h-4 w-4 text-emerald-700"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          aria-hidden="true"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-stone-700">
                          <span class="font-medium text-stone-900">{{ zone.name }}</span>
                          · \${{ zone.deliveryFee.toFixed(2) }} fee
                          @if (e.distance != null) {
                            · {{ e.distance.toFixed(1) }} mi away
                          }
                        </span>
                      </div>
                    } @else {
                      <p class="text-xs text-rose-700">
                        {{ e.reason ?? 'Delivery not available at this location.' }}
                      </p>
                    }
                  } @else {
                    <p class="text-xs text-stone-400">
                      Tap "Use My Location" to verify delivery availability.
                    </p>
                  }
                </div>
              }
            </section>

            <section class="rounded-xl border border-stone-200 bg-white p-6">
              <h2 class="mb-4 text-lg font-semibold text-stone-900">Payment Method</h2>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-xl border-2 border-emerald-700 bg-emerald-50 p-4"
                  aria-pressed="true"
                >
                  <svg
                    class="h-5 w-5 text-emerald-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium text-stone-900">Cash</p>
                    <p class="text-xs text-stone-500">Pay at pickup/delivery</p>
                  </div>
                </button>
                <div
                  class="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 p-4 opacity-60"
                >
                  <svg
                    class="h-5 w-5 text-stone-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium text-stone-500">Card</p>
                    <p class="text-xs text-stone-400">Coming soon</p>
                  </div>
                </div>
              </div>
              <p class="mt-3 text-xs text-stone-500">
                Card payments are pending integration with a cannabis-friendly processor.
              </p>
            </section>

            <section class="rounded-xl border border-stone-200 bg-white p-6">
              <h2 class="mb-4 text-lg font-semibold text-stone-900">Order Items</h2>
              <div class="space-y-2">
                @for (item of items(); track item.variantId) {
                  <div class="flex justify-between py-1.5 text-sm">
                    <span class="text-stone-900">
                      {{ item.name }}
                      @if (item.variantName) {
                        <span class="text-stone-500"> · {{ item.variantName }}</span>
                      }
                      <span class="text-stone-500"> × {{ item.quantity }}</span>
                    </span>
                    <span class="font-medium tabular-nums text-stone-900">
                      \${{ lineTotal(item.price, item.quantity) }}
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>

          <aside class="mt-6 lg:mt-0">
            <div class="sticky top-24 rounded-xl border border-stone-200 bg-white p-6">
              <h2 class="mb-4 font-semibold text-stone-900">Order Summary</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-stone-700">Subtotal</span>
                  <span class="tabular-nums text-stone-900">\${{ subtotalLabel() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-700">Est. Tax</span>
                  <span class="tabular-nums text-stone-900">\${{ taxLabel() }}</span>
                </div>
                @if (orderType() === 'delivery') {
                  <div class="flex justify-between">
                    <span class="text-stone-700">Delivery</span>
                    <span class="tabular-nums text-stone-900">\${{ deliveryFeeLabel() }}</span>
                  </div>
                }
                <p class="pt-1 text-xs text-stone-500">Final tax calculated at checkout by state</p>
              </div>
              <div
                class="mt-4 flex justify-between border-t border-stone-200 pt-4 text-lg font-bold"
              >
                <span class="text-stone-900">Total</span>
                <span class="tabular-nums text-stone-900">\${{ totalLabel() }}</span>
              </div>

              @if (errorMessage()) {
                <div
                  class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  role="alert"
                >
                  {{ errorMessage() }}
                </div>
              }

              <button
                type="button"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="!canPlaceOrder()"
                (click)="onPlaceOrder()"
              >
                @if (loading()) {
                  <svg
                    class="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                    />
                  </svg>
                  <span>Processing…</span>
                } @else {
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <span>Place Order</span>
                }
              </button>
            </div>
          </aside>
        </div>
      </div>
    }
  `,
})
export class CheckoutPage {
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly delivery = inject(DeliveryService);
  private readonly createOrderGQL = inject(CreateOrderGQL);
  private readonly router = inject(Router);

  protected readonly items = this.cart.items;
  protected readonly isEmpty = this.cart.isEmpty;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly orderType = signal<OrderType>('pickup');
  protected readonly paymentMethod = signal<PaymentMethod>('cash');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly coords = signal<{ lat: number; lng: number } | null>(null);
  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly eligibility = signal<DeliveryEligibility | null>(null);
  protected readonly eligibilityChecking = signal(false);

  protected readonly eligibilityZone = computed(() => {
    const e = this.eligibility();
    return e?.eligible && e.zone ? e.zone : null;
  });

  protected readonly subtotalLabel = computed(() => this.cart.subtotal().toFixed(2));
  protected readonly taxLabel = computed(() => (this.cart.subtotal() * TAX_RATE).toFixed(2));

  private readonly deliveryFee = computed(() => {
    if (this.orderType() !== 'delivery') return 0;
    return this.eligibilityZone()?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
  });

  protected readonly deliveryFeeLabel = computed(() => this.deliveryFee().toFixed(2));

  protected readonly totalLabel = computed(() => {
    const subtotal = this.cart.subtotal();
    const tax = subtotal * TAX_RATE;
    return (subtotal + tax + this.deliveryFee()).toFixed(2);
  });

  protected readonly canPlaceOrder = computed(() => {
    if (this.loading() || !this.isAuthenticated() || this.isEmpty()) return false;
    if (this.orderType() === 'delivery') {
      const e = this.eligibility();
      return !!e?.eligible;
    }
    return true;
  });

  constructor() {
    effect(() => {
      const c = this.coords();
      if (!c || untracked(() => this.orderType()) !== 'delivery') return;
      void this.runEligibilityCheck(c.lat, c.lng);
    });

    effect(() => {
      if (this.orderType() === 'pickup') {
        this.eligibility.set(null);
        this.locationError.set(null);
      }
    });
  }

  protected fulfillmentClass(type: OrderType): string {
    return this.orderType() === type ? 'border-emerald-700 bg-emerald-50' : 'border-stone-200';
  }

  protected lineTotal(price: number, qty: number): string {
    return (price * qty).toFixed(2);
  }

  protected onUseMyLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationError.set('Geolocation is not available in this browser.');
      return;
    }
    this.locating.set(true);
    this.locationError.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.locating.set(false);
      },
      (err) => {
        this.locationError.set(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable location to check delivery.'
            : 'Could not determine your location. Try again.',
        );
        this.locating.set(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  private async runEligibilityCheck(lat: number, lng: number): Promise<void> {
    this.eligibilityChecking.set(true);
    try {
      const result = await this.delivery.checkEligibility(lat, lng, this.cart.subtotal());
      this.eligibility.set(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check delivery';
      this.locationError.set(message);
    } finally {
      this.eligibilityChecking.set(false);
    }
  }

  async onPlaceOrder(): Promise<void> {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { redirect: '/checkout' },
      });
      return;
    }
    const dispensaryId = this.dispensary.entityId();
    if (!dispensaryId) {
      this.errorMessage.set('No dispensary resolved for this URL.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const result = await firstValueFrom(
        this.createOrderGQL.mutate({
          variables: {
            input: {
              dispensaryId,
              orderType: this.orderType(),
              lineItems: this.items().map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            },
          },
        }),
      );
      const order = result.data?.createOrder;
      if (!order) {
        throw new Error('Failed to create order');
      }
      this.cart.clear();
      void this.router.navigate(['/orders', order.orderId]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }
}
