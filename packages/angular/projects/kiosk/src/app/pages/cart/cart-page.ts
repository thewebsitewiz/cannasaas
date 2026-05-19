import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService, type CartItem } from '../../core/cart/cart.service';

@Component({
  selector: 'cs-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  template: `
    @if (cart.isEmpty()) {
      <div class="flex h-[60vh] flex-col items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-4 text-gray-300"
        >
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path
            d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
          />
        </svg>
        <p class="mb-6 text-xl text-gray-400">Your cart is empty</p>
        <a
          routerLink="/"
          class="rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white active:bg-emerald-800"
        >
          Browse Menu
        </a>
      </div>
    } @else {
      <div class="mx-auto max-w-2xl p-6">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">Your Cart</h1>

        <div class="space-y-3">
          @for (item of cart.items(); track item.variantId) {
            <div class="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
              <div class="flex-1">
                <p class="text-lg font-semibold text-gray-900">{{ item.name }}</p>
                <p class="text-sm text-gray-500">
                  {{ item.variantName }} · {{ item.price | currency }} each
                </p>
              </div>
              <div class="flex items-center gap-2 rounded-full border border-gray-200">
                <button
                  type="button"
                  (click)="dec(item)"
                  aria-label="Decrease quantity"
                  class="p-3 active:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span class="px-2 text-lg font-bold tabular-nums">
                  {{ item.quantity }}
                </span>
                <button
                  type="button"
                  (click)="inc(item)"
                  aria-label="Increase quantity"
                  class="p-3 active:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
              </div>
              <p class="w-20 text-right text-lg font-bold tabular-nums">
                {{ item.price * item.quantity | currency }}
              </p>
              <button
                type="button"
                (click)="remove(item)"
                aria-label="Remove from cart"
                class="p-2 text-red-400 active:text-red-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </div>
          }
        </div>

        <div class="mt-8 rounded-2xl border border-gray-100 bg-white p-6">
          <div class="flex justify-between text-xl font-bold">
            <span>Subtotal</span>
            <span class="tabular-nums">{{ cart.subtotal() | currency }}</span>
          </div>
          <p class="mt-1 text-sm text-gray-400">Tax calculated at checkout</p>
          <button
            type="button"
            (click)="checkout()"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-lg font-bold text-white active:bg-emerald-800"
          >
            Checkout
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
})
export class CartPage {
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected inc(item: CartItem): void {
    this.cart.updateQuantity(item.variantId, item.quantity + 1);
  }

  protected dec(item: CartItem): void {
    this.cart.updateQuantity(item.variantId, item.quantity - 1);
  }

  protected remove(item: CartItem): void {
    void this.cart.removeItem(item.variantId);
  }

  protected checkout(): void {
    void this.router.navigateByUrl('/checkout');
  }
}
