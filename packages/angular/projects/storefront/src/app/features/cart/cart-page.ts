import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'cs-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (isEmpty()) {
      <div class="mx-auto max-w-2xl px-4 py-20 text-center">
        <svg
          class="mx-auto mb-4 h-16 w-16 text-stone-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
        </svg>
        <h1 class="mb-2 text-2xl font-bold text-stone-900">Your cart is empty</h1>
        <p class="mb-6 text-stone-500">Browse our menu and add some products</p>
        <a
          class="inline-block rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
          [routerLink]="['/products']"
          >Browse Menu</a
        >
      </div>
    } @else {
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 class="mb-6 text-2xl font-bold text-stone-900">
          Shopping Cart ({{ itemCount() }} items)
        </h1>

        <div class="lg:grid lg:grid-cols-[1fr_18rem] lg:gap-8">
          <div class="space-y-3">
            @for (item of items(); track item.variantId) {
              <div class="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-500"
                  aria-hidden="true"
                >
                  IMG
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-stone-900">
                    {{ item.name }}
                  </p>
                  <p class="text-sm text-stone-500">{{ item.variantName }}</p>
                  @if (item.strainType) {
                    <span class="text-xs capitalize text-stone-400">
                      {{ item.strainType }}
                    </span>
                  }
                  @if (atMax(item)) {
                    <p class="mt-0.5 text-[10px] font-medium text-amber-700">Max available qty</p>
                  }
                </div>
                <div
                  class="flex items-center gap-1 rounded-lg border border-stone-200"
                  role="group"
                  [attr.aria-label]="'Quantity for ' + item.name"
                >
                  <button
                    type="button"
                    class="rounded-l-lg p-2 text-stone-500 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    [disabled]="item.quantity <= 1"
                    [attr.aria-label]="'Decrease quantity of ' + item.name"
                    (click)="dec(item)"
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span
                    class="w-8 px-2 text-center text-sm font-medium tabular-nums text-stone-900"
                    aria-live="polite"
                    >{{ item.quantity }}</span
                  >
                  <button
                    type="button"
                    class="rounded-r-lg p-2 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                    [class]="atMax(item) ? 'text-stone-300' : 'text-stone-500'"
                    [disabled]="atMax(item)"
                    [attr.aria-label]="'Increase quantity of ' + item.name"
                    (click)="inc(item)"
                  >
                    <svg
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                <p class="w-16 text-right text-sm font-bold tabular-nums text-stone-900">
                  \${{ lineTotal(item) }}
                </p>
                <button
                  type="button"
                  class="p-1.5 text-stone-400 transition-colors hover:text-rose-700"
                  [attr.aria-label]="'Remove ' + item.name + ' from cart'"
                  (click)="remove(item)"
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
                    <path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                    />
                  </svg>
                </button>
              </div>
            }
          </div>

          <aside class="mt-6 lg:mt-0">
            <div class="sticky top-24 rounded-xl border border-stone-200 bg-white p-6">
              <h2 class="mb-4 font-semibold text-stone-900">Order Summary</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-stone-700">Subtotal</span>
                  <span class="font-medium text-stone-900 tabular-nums"
                    >\${{ subtotalLabel() }}</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-stone-700">Tax</span>
                  <span class="text-stone-500">Calculated at checkout</span>
                </div>
              </div>
              <div
                class="mt-4 flex justify-between border-t border-stone-200 pt-4 text-lg font-bold"
              >
                <span class="text-stone-900">Subtotal</span>
                <span class="text-stone-900 tabular-nums">\${{ subtotalLabel() }}</span>
              </div>
              <a
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
                [routerLink]="['/checkout']"
              >
                Checkout
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
          </aside>
        </div>
      </div>
    }
  `,
})
export class CartPage {
  private readonly cart = inject(CartService);

  protected readonly items = this.cart.items;
  protected readonly itemCount = this.cart.itemCount;
  protected readonly isEmpty = this.cart.isEmpty;
  protected readonly subtotalLabel = computed(() => this.cart.subtotal().toFixed(2));

  protected atMax(item: CartItem): boolean {
    return item.maxQuantity != null && item.quantity >= item.maxQuantity;
  }

  protected lineTotal(item: CartItem): string {
    return (item.price * item.quantity).toFixed(2);
  }

  protected inc(item: CartItem): void {
    if (this.atMax(item)) return;
    this.cart.updateQuantity(item.variantId, item.quantity + 1);
  }

  protected dec(item: CartItem): void {
    this.cart.updateQuantity(item.variantId, item.quantity - 1);
  }

  protected remove(item: CartItem): void {
    this.cart.removeItem(item.variantId);
  }
}
