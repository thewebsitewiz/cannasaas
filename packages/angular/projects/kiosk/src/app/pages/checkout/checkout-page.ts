import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CreateOrderGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'cs-checkout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    @if (cart.isEmpty()) {
      <div class="flex h-[60vh] flex-col items-center justify-center text-gray-400">
        <p class="mb-4 text-xl">Your cart is empty.</p>
        <button
          type="button"
          (click)="goHome()"
          class="rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white active:bg-emerald-800"
        >
          Browse Menu
        </button>
      </div>
    } @else {
      <div class="mx-auto max-w-lg p-6">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

        <div class="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h2 class="mb-3 font-semibold text-gray-900">Order Summary</h2>
          @for (i of cart.items(); track i.variantId) {
            <div class="flex justify-between py-2 text-sm">
              <span>{{ i.name }} × {{ i.quantity }}</span>
              <span class="font-medium tabular-nums">
                {{ i.price * i.quantity | currency }}
              </span>
            </div>
          }
          <div
            class="mt-3 flex justify-between border-t border-gray-100 pt-3 text-lg font-bold"
          >
            <span>Total</span>
            <span class="tabular-nums">{{ cart.subtotal() | currency }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-400">+ tax · Pay at counter</p>
        </div>

        @if (error(); as e) {
          <div
            class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            role="alert"
          >
            {{ e }}
          </div>
        }

        <button
          type="button"
          (click)="placeOrder()"
          [disabled]="loading()"
          class="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-5 text-lg font-bold text-white active:bg-emerald-800 disabled:opacity-50"
        >
          @if (loading()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="animate-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Placing Order...
          } @else {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Place Order — Pay at Counter
          }
        </button>
      </div>
    }
  `,
})
export class CheckoutPage {
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly createOrderGQL = inject(CreateOrderGQL);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected goHome(): void {
    this.router.navigateByUrl('/');
  }

  protected async placeOrder(): Promise<void> {
    if (this.cart.isEmpty() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.ensureLoggedIn();
      const lineItems = this.cart.items().map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      const result = await firstValueFrom(
        this.createOrderGQL.mutate({
          variables: {
            input: {
              dispensaryId: environment.dispensaryId,
              orderType: 'pickup',
              notes: 'Kiosk pre-order',
              lineItems,
            },
          },
        }),
      );
      const orderId = result.data?.createOrder?.orderId;
      void if (orderId) {
        this.cart.clearCart();
        this.router.navigateByUrl(`/confirm/${orderId}`);
      } else {
        this.error.set('Order failed — please try again');
      }
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Order failed');
    } finally {
      this.loading.set(false);
    }
  }
}
