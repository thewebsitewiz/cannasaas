import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart/cart.service';

interface NavLink {
  readonly label: string;
  readonly path: string;
  readonly category?: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Menu', path: '/products' },
  { label: 'Flower', path: '/products', category: 'flower' },
  { label: 'Edibles', path: '/products', category: 'edibles' },
  { label: 'Vapes', path: '/products', category: 'vapes' },
];

const MOBILE_NAV_LABELS = ['Menu', 'Flower', 'Edibles', 'Vapes', 'Pre-Rolls'] as const;

const SCROLL_THRESHOLD_PX = 20;

@Component({
  selector: 'cs-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header
      class="fixed left-0 right-0 top-0 z-50 transition-all duration-500"
      [class]="
        solid()
          ? 'bg-white/90 backdrop-blur-xl border-b border-stone-100 shadow-sm'
          : 'bg-transparent'
      "
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a class="flex items-center gap-2.5" [routerLink]="['/']">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black tracking-tighter transition-colors duration-300"
            [class]="
              solid()
                ? 'bg-emerald-600 text-white'
                : 'bg-white/10 text-white border border-white/20 backdrop-blur-sm'
            "
          >
            GL
          </div>
          <span
            class="text-lg font-semibold tracking-tight transition-colors duration-300"
            [class]="solid() ? 'text-stone-900' : 'text-white'"
            style="font-family: 'Playfair Display', Georgia, serif"
            >GreenLeaf</span
          >
        </a>

        <nav class="hidden items-center gap-8 md:flex">
          @for (link of navLinks; track link.label) {
            <a
              class="text-sm font-medium transition-colors duration-300"
              [class]="
                solid() ? 'text-stone-500 hover:text-stone-900' : 'text-white/60 hover:text-white'
              "
              [routerLink]="[link.path]"
              [queryParams]="link.category ? { category: link.category } : null"
              >{{ link.label }}</a
            >
          }
          <a
            class="flex items-center gap-1.5 text-sm font-medium transition-colors duration-300"
            [class]="
              solid()
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-emerald-300 hover:text-emerald-200'
            "
            [routerLink]="['/express-checkout']"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            Express
          </a>
        </nav>

        <div class="flex items-center gap-2">
          <a
            class="rounded-full p-2.5 transition-all duration-300"
            [class]="
              solid()
                ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            "
            [routerLink]="['/products']"
            aria-label="Search"
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
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </a>

          <a
            class="relative rounded-full p-2.5 transition-all duration-300"
            [class]="
              solid()
                ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            "
            [routerLink]="['/cart']"
            aria-label="Cart"
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
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
            @if (itemCount() > 0) {
              <span
                class="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm"
              >
                {{ itemCount() }}
              </span>
            }
          </a>

          @if (isLoggedIn()) {
            <a
              class="hidden items-center gap-2 rounded-full py-1.5 pl-2 pr-3 transition-all duration-300 sm:flex"
              [class]="solid() ? 'hover:bg-stone-100' : 'hover:bg-white/10'"
              [routerLink]="['/account']"
            >
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                <span class="text-xs font-bold text-emerald-700">{{ initial() }}</span>
              </div>
              <span
                class="text-sm font-medium transition-colors duration-300"
                [class]="solid() ? 'text-stone-700' : 'text-white/80'"
                >{{ shortName() }}</span
              >
            </a>
          } @else {
            <a
              class="hidden items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:flex"
              [class]="
                solid()
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-white bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm'
              "
              [routerLink]="['/login']"
              >Sign In</a
            >
          }

          <button
            type="button"
            class="rounded-full p-2.5 transition-colors md:hidden"
            [class]="
              solid() ? 'text-stone-600 hover:bg-stone-100' : 'text-white/70 hover:bg-white/10'
            "
            aria-label="Toggle menu"
            [attr.aria-expanded]="mobileOpen()"
            (click)="toggleMobile()"
          >
            @if (mobileOpen()) {
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
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
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            }
          </button>
        </div>
      </div>

      @if (mobileOpen()) {
        <div class="border-t border-stone-100 bg-white shadow-lg md:hidden">
          <nav class="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            @for (label of mobileNavLabels; track label) {
              <a
                class="border-b border-stone-50 py-2.5 text-sm font-medium text-stone-600 last:border-0 hover:text-emerald-700"
                [routerLink]="['/products']"
                [queryParams]="label === 'Menu' ? null : { category: label.toLowerCase() }"
                (click)="closeMobile()"
                >{{ label }}</a
              >
            }

            <div class="mt-3 border-t border-stone-100 pt-3">
              @if (isLoggedIn()) {
                <a
                  class="flex items-center justify-between py-2.5 text-sm font-medium text-stone-700 hover:text-emerald-700"
                  [routerLink]="['/orders']"
                  (click)="closeMobile()"
                >
                  <span>My Orders</span>
                  <svg
                    class="h-3.5 w-3.5 text-stone-300"
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
                <a
                  class="flex items-center justify-between py-2.5 text-sm font-medium text-stone-700 hover:text-emerald-700"
                  [routerLink]="['/account']"
                  (click)="closeMobile()"
                >
                  <span>Account</span>
                  <svg
                    class="h-3.5 w-3.5 text-stone-300"
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
                <button
                  type="button"
                  class="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-rose-700 hover:text-rose-600"
                  (click)="onMobileLogout()"
                >
                  Sign Out
                </button>
              } @else {
                <a
                  class="block rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
                  [routerLink]="['/login']"
                  (click)="closeMobile()"
                  >Sign In</a
                >
              }
            </div>
          </nav>
        </div>
      }
    </header>
  `,
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navLinks = NAV_LINKS;
  protected readonly mobileNavLabels = MOBILE_NAV_LABELS;

  protected readonly itemCount = this.cart.itemCount;
  protected readonly isLoggedIn = this.auth.isAuthenticated;
  private readonly user = this.auth.user;

  protected readonly initial = computed(() => {
    const u = this.user();
    if (!u) return 'U';
    return (u.firstName?.[0] ?? u.email[0] ?? 'U').toUpperCase();
  });
  protected readonly shortName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.firstName ?? u.email.split('@')[0];
  });

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  private readonly isHomepage = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '';
  });

  private readonly scrolled = signal(false);
  protected readonly solid = computed(() => !this.isHomepage() || this.scrolled());

  protected readonly mobileOpen = signal(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const onScroll = (): void => this.scrolled.set(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  protected toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  protected closeMobile(): void {
    this.mobileOpen.set(false);
  }

  protected async onMobileLogout(): Promise<void> {
    this.closeMobile();
    await this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
