import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoyaltyCard } from './loyalty-card';

@Component({
  selector: 'cs-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LoyaltyCard],
  template: `
    @if (user(); as u) {
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h1 class="font-display text-2xl font-bold text-stone-900">My Account</h1>
            <p class="text-sm text-stone-500">{{ u.email }}</p>
          </div>
          <button
            type="button"
            class="flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-rose-700"
            (click)="onLogout()"
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
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>

        <div class="mb-6 rounded-2xl border border-stone-200 bg-white p-6">
          <div class="mb-4 flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <svg
                class="h-6 w-6 text-emerald-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-stone-900">{{ displayName() }}</p>
              <div class="mt-0.5 flex items-center gap-2">
                <span class="text-xs capitalize text-stone-500">{{ u.role }}</span>
                @if (u.ageVerified) {
                  <span class="flex items-center gap-1 text-xs text-emerald-700">
                    <svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Age Verified
                  </span>
                } @else {
                  <a
                    class="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-600"
                    [routerLink]="['/account/verify']"
                  >
                    <svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Verify Age to Order
                    <svg
                      class="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </a>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <cs-loyalty-card />
        </div>

        <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            class="rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:bg-stone-50"
            [routerLink]="['/products']"
          >
            <svg
              class="mb-3 h-6 w-6 text-emerald-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              />
            </svg>
            <h3 class="mb-1 font-semibold text-stone-900">Browse Menu</h3>
            <p class="text-sm text-stone-500">Explore our curated cannabis menu</p>
          </a>
          @if (!u.ageVerified) {
            <a
              class="rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:bg-stone-50"
              [routerLink]="['/account/verify']"
            >
              <svg
                class="mb-3 h-6 w-6 text-amber-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h3 class="mb-1 font-semibold text-stone-900">Verify Your Age</h3>
              <p class="text-sm text-stone-500">Required before placing orders</p>
            </a>
          }
        </div>

        <a
          class="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:bg-stone-50"
          [routerLink]="['/orders']"
        >
          <div class="flex items-center gap-3">
            <svg
              class="h-5 w-5 text-emerald-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              />
            </svg>
            <div>
              <p class="font-semibold text-stone-900">Order History</p>
              <p class="text-xs text-stone-500">View past and active orders</p>
            </div>
          </div>
          <svg
            class="h-4 w-4 text-stone-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </a>
      </div>
    }
  `,
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.firstName) return `${u.firstName} ${u.lastName ?? ''}`.trim();
    return u.email.split('@')[0];
  });

  async onLogout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
