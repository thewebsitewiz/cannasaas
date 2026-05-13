import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CreateOrderGQL,
  MyFavoritesGQL,
  MyFavoritesQuery,
  MyLastOrderGQL,
  MyLastOrderQuery,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

type LastOrder = NonNullable<MyLastOrderQuery['myLastOrder']>;
type Favorite = MyFavoritesQuery['myFavorites'][number];

@Component({
  selector: 'cs-express-checkout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (!isAuthenticated()) {
      <div class="mx-auto max-w-2xl px-4 py-20 text-center">
        <svg
          class="mx-auto mb-4 h-12 w-12 text-emerald-400"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        <h1 class="mb-2 text-2xl font-bold text-stone-900">Express Checkout</h1>
        <p class="mb-6 text-stone-500">Sign in to use express checkout</p>
        <a
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
          [routerLink]="['/login']"
          [queryParams]="{ redirect: '/express-checkout' }"
        >
          Sign In
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    } @else {
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div class="mb-8 flex items-center gap-3">
          <svg
            class="h-7 w-7 text-emerald-700"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          <h1 class="text-2xl font-bold text-stone-900">Express Checkout</h1>
        </div>

        @if (initialLoading()) {
          <p class="py-12 text-center text-stone-500">Loading…</p>
        } @else {
          <div class="space-y-6">
            @if (lastOrder(); as order) {
              <section class="rounded-xl border border-stone-200 bg-white p-6">
                <div class="mb-4 flex items-center gap-2">
                  <svg
                    class="h-4 w-4 text-emerald-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 019-9 9 9 0 016 2.3L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9 9 0 01-6-2.3L3 16M3 21v-5h5" />
                  </svg>
                  <h2 class="text-lg font-semibold text-stone-900">
                    Reorder Last Order
                  </h2>
                </div>
                <div class="mb-4 space-y-2">
                  @for (li of order.lineItems; track li.productId + li.variantId) {
                    <div class="flex justify-between text-sm">
                      <span class="text-stone-700">
                        {{ li.productName }}
                        <span class="text-stone-400"> x{{ li.quantity }}</span>
                      </span>
                      <span class="font-medium tabular-nums"
                        >\${{ (li.price * li.quantity).toFixed(2) }}</span
                      >
                    </div>
                  }
                  <div
                    class="flex justify-between border-t border-stone-100 pt-2 font-semibold"
                  >
                    <span>Total</span>
                    <span class="tabular-nums">\${{ order.total.toFixed(2) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                  [disabled]="placing()"
                  (click)="onReorder(order)"
                >
                  @if (placing()) {
                    Processing…
                  } @else {
                    Reorder Now
                  }
                </button>
              </section>
            }

            @if (favorites().length > 0) {
              <section class="rounded-xl border border-stone-200 bg-white p-6">
                <div class="mb-4 flex items-center gap-2">
                  <svg
                    class="h-4 w-4 text-emerald-700"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 21 12 16.5 5.8 21l2.4-7.1L2 9.4h7.6z" />
                  </svg>
                  <h2 class="text-lg font-semibold text-stone-900">
                    Your Favorites
                  </h2>
                </div>
                <div class="mb-4 space-y-2">
                  @for (fav of favorites(); track fav.productId) {
                    <button
                      type="button"
                      class="flex w-full items-center justify-between rounded-xl border-2 p-3 transition-colors"
                      [class]="
                        selectedFavorites().has(fav.productId)
                          ? 'border-emerald-700 bg-emerald-50'
                          : 'border-stone-200 hover:bg-stone-50'
                      "
                      (click)="toggleFavorite(fav.productId)"
                    >
                      <div class="flex items-center gap-3 text-left">
                        <div
                          class="flex h-6 w-6 items-center justify-center rounded-full border-2"
                          [class]="
                            selectedFavorites().has(fav.productId)
                              ? 'border-emerald-700 bg-emerald-700'
                              : 'border-stone-300'
                          "
                        >
                          @if (selectedFavorites().has(fav.productId)) {
                            <svg
                              class="h-3.5 w-3.5 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="3"
                              stroke-linecap="round"
                              aria-hidden="true"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          }
                        </div>
                        <div>
                          <p class="font-medium text-stone-900">
                            {{ fav.productName }}
                          </p>
                          <p class="text-xs text-stone-500">
                            {{ fav.variantName }} · Ordered {{ fav.orderCount }}x
                          </p>
                        </div>
                      </div>
                      <span class="font-semibold tabular-nums text-stone-900"
                        >\${{ fav.price.toFixed(2) }}</span
                      >
                    </button>
                  }
                </div>
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-800 py-3 font-semibold text-white transition-colors hover:bg-stone-900 disabled:opacity-50"
                  [disabled]="placing() || selectedFavorites().size === 0"
                  (click)="onQuickOrder()"
                >
                  @if (placing()) {
                    Processing…
                  } @else {
                    Quick Order ({{ selectedFavorites().size }})
                  }
                </button>
              </section>
            }

            @if (!lastOrder() && favorites().length === 0) {
              <div class="py-12 text-center">
                <svg
                  class="mx-auto mb-4 h-12 w-12 text-stone-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
                <p class="mb-4 text-stone-500">
                  No order history yet. Place your first order to unlock
                  express checkout!
                </p>
                <a
                  class="font-semibold text-emerald-700 hover:underline"
                  [routerLink]="['/products']"
                  >Browse Menu</a
                >
              </div>
            }

            @if (errorMessage()) {
              <div
                class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
                role="alert"
              >
                {{ errorMessage() }}
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class ExpressCheckoutPage {
  private readonly auth = inject(AuthService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly myLastOrderGQL = inject(MyLastOrderGQL);
  private readonly myFavoritesGQL = inject(MyFavoritesGQL);
  private readonly createOrderGQL = inject(CreateOrderGQL);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly placing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly selectedFavorites = signal<ReadonlySet<string>>(new Set());

  private readonly lastOrderResource = resource<
    LastOrder | null,
    { dispensaryId: string | null; isAuthenticated: boolean }
  >({
    params: () => ({
      dispensaryId: this.dispensary.entityId(),
      isAuthenticated: this.isAuthenticated(),
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated || !params.dispensaryId) return null;
      const result = await firstValueFrom(
        this.myLastOrderGQL.fetch({ variables: { dispensaryId: params.dispensaryId } }),
      );
      return result.data?.myLastOrder ?? null;
    },
  });

  private readonly favoritesResource = resource<
    readonly Favorite[],
    { dispensaryId: string | null; isAuthenticated: boolean }
  >({
    params: () => ({
      dispensaryId: this.dispensary.entityId(),
      isAuthenticated: this.isAuthenticated(),
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated || !params.dispensaryId) return [];
      const result = await firstValueFrom(
        this.myFavoritesGQL.fetch({
          variables: { dispensaryId: params.dispensaryId, limit: 5 },
        }),
      );
      return result.data?.myFavorites ?? [];
    },
  });

  protected readonly lastOrder = computed(() => this.lastOrderResource.value() ?? null);
  protected readonly favorites = computed(() => this.favoritesResource.value() ?? []);
  protected readonly initialLoading = computed(
    () => this.lastOrderResource.isLoading() || this.favoritesResource.isLoading(),
  );

  protected toggleFavorite(productId: string): void {
    this.selectedFavorites.update((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  protected onReorder(order: LastOrder): void {
    void this.placeOrder(
      order.lineItems.map((li) => ({
        productId: li.productId,
        variantId: li.variantId ?? undefined,
        quantity: li.quantity,
      })),
      order.orderType || 'pickup',
    );
  }

  protected onQuickOrder(): void {
    const selected = this.selectedFavorites();
    if (selected.size === 0) return;
    const items = this.favorites()
      .filter((f) => selected.has(f.productId))
      .map((f) => ({
        productId: f.productId,
        variantId: f.variantId ?? undefined,
        quantity: 1,
      }));
    void this.placeOrder(items, this.lastOrder()?.orderType ?? 'pickup');
  }

  private async placeOrder(
    lineItems: { productId: string; variantId?: string; quantity: number }[],
    orderType: string,
  ): Promise<void> {
    const dispensaryId = this.dispensary.entityId();
    if (!dispensaryId) {
      this.errorMessage.set('No dispensary resolved for this URL.');
      return;
    }
    this.placing.set(true);
    this.errorMessage.set(null);
    try {
      const result = await firstValueFrom(
        this.createOrderGQL.mutate({
          variables: { input: { dispensaryId, orderType, lineItems } },
        }),
      );
      const orderId = result.data?.createOrder?.orderId;
      if (!orderId) throw new Error('Failed to create order');
      void this.router.navigate(['/orders', orderId]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      this.errorMessage.set(message);
    } finally {
      this.placing.set(false);
    }
  }
}
