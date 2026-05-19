import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import { ErrorDisplay } from '../../shared/error-display/error-display';

@Component({
  selector: 'cs-kiosk-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, ErrorDisplay],
  template: `
    <div class="flex h-screen flex-col select-none bg-stone-50">
      <header class="flex h-20 shrink-0 items-center justify-between bg-[#0a1a0f] px-8">
        <div class="flex items-center gap-4">
          @if (!isHome()) {
            <button
              type="button"
              (click)="goBack()"
              aria-label="Back"
              class="rounded-xl bg-white/10 p-3 active:bg-white/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-white"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>
          }
          <a routerLink="/" class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black tracking-tighter text-white"
            >
              GL
            </span>
            <span
              class="text-2xl font-semibold text-white"
              style="font-family: 'Playfair Display', Georgia, serif;"
            >
              GreenLeaf
            </span>
          </a>
        </div>

        <div class="flex items-center gap-3">
          @if (customer(); as c) {
            <a
              routerLink="/checkin"
              class="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3.5 text-base font-semibold text-white active:scale-95"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ c.firstName ?? 'Account' }} · {{ c.loyaltyPoints }} pts
            </a>
          } @else {
            <a
              routerLink="/checkin"
              class="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3.5 text-base font-semibold text-white/80 active:scale-95"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Check In
            </a>
          }
          <a
            routerLink="/cart"
            class="relative flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-lg font-semibold text-white active:scale-95"
          >
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
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Cart
            @if (itemCount() > 0) {
              <span
                class="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-emerald-700 shadow-md"
              >
                {{ itemCount() }}
              </span>
            }
          </a>
          <button
            type="button"
            (click)="reset()"
            aria-label="Reset session"
            class="rounded-xl bg-white/10 p-3 text-white/60"
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
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <router-outlet />
      </main>

      <footer class="shrink-0 bg-[#0a1a0f] px-6 py-3 text-center text-xs text-white/30">
        Must be 21+ with valid ID · Tap any product to learn more
      </footer>

      <cs-error-display />
    </div>
  `,
})
export class KioskLayout {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly cart = inject(CartService);

  protected readonly itemCount = this.cart.itemCount;
  protected readonly customer = this.cart.customer;
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly isHome = computed(() => this.url() === '/');

  protected goBack(): void {
    this.location.back();
  }

  protected reset(): void {
    this.cart.clearCart();
    void this.router.navigateByUrl('/');
  }
}
