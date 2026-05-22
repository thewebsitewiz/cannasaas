import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import {
  MenuBoardService,
  type ActivePromotion,
  type MenuBoardProduct,
} from './menu-board.service';

const CLOCK_INTERVAL_MS = 1_000;
const CATEGORY_ROTATE_MS = 15_000;
const CATEGORIES = [
  'Flower',
  'Edible',
  'Vape',
  'Pre-Roll',
  'Concentrate',
  'Topical',
  'Tincture',
] as const;

/**
 * In-store digital menu board. Mirrors the React `MenuBoardPage`:
 * full-bleed dark layout, live clock, auto-rotating category tabs,
 * promotions banner, product grid with strain + THC badges, and a
 * fullscreen toggle.
 *
 * **Known parity caveat:** the React filter `p.category === activeCategory`
 * runs against a field that doesn't exist on the current `Product`
 * type — so the React board renders empty grids in production today.
 * The Angular port keeps the category tabs as decorative auto-rotators
 * but shows all products in the grid. File a follow-up if real
 * category filtering is needed (the API has `primaryCategoryId` —
 * we'd need a categories lookup query to resolve the display name).
 *
 * Filed scope mentioned a "configure" form (featured products, layout,
 * refresh interval). React doesn't have one — this page IS the display,
 * not the configurator. Defer.
 */
@Component({
  selector: 'cs-menu-board-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="-m-8 min-h-screen bg-gray-950 p-8 text-white">
      <!-- Top bar -->
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-3xl text-emerald-400" aria-hidden="true">🌿</span>
          <h1 class="text-3xl font-bold">Menu Board</h1>
        </div>
        <div class="flex items-center gap-6">
          <span class="font-mono text-2xl tabular-nums text-gray-400" aria-label="Current time">
            {{ timeLabel() }}
          </span>
          <button
            type="button"
            (click)="onToggleFullscreen()"
            class="rounded-lg p-2 text-gray-400 transition-colors hover:text-white"
            [attr.aria-label]="isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'"
            [attr.title]="isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'"
          >
            {{ isFullscreen() ? '⊟' : '⊞' }}
          </button>
        </div>
      </div>

      <!-- Category tabs (auto-rotate every 15s) -->
      <nav class="mb-8 flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="Category tabs">
        @for (cat of categories; track cat; let i = $index) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="activeCategoryIndex() === i"
            (click)="setActiveCategory(i)"
            class="whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
            [class]="
              activeCategoryIndex() === i
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            "
          >
            {{ cat }}
          </button>
        }
      </nav>

      <!-- Promotions banner -->
      @if (promotions().length > 0) {
        <div
          class="mb-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 to-purple-600/20 p-6"
          aria-label="Daily specials"
        >
          <h2 class="mb-2 text-xl font-bold text-emerald-400">Daily Specials</h2>
          <ul class="flex flex-wrap gap-4">
            @for (promo of promotions(); track promo.promoId) {
              <li class="rounded-xl bg-gray-900/50 px-5 py-3">
                <p class="font-semibold text-white">{{ promo.name }}</p>
                @if (discountLabel(promo); as label) {
                  <p class="text-sm font-bold text-emerald-400">{{ label }}</p>
                }
                @if (promo.description) {
                  <p class="mt-1 text-sm text-gray-400">{{ promo.description }}</p>
                }
              </li>
            }
          </ul>
        </div>
      }

      <!-- Product grid -->
      @if (products().length === 0) {
        <p class="py-20 text-center text-xl text-gray-600">No products to display.</p>
      } @else {
        <ul class="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          @for (p of products(); track p.id) {
            <li class="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h3 class="mb-2 text-xl font-bold leading-tight text-white">{{ p.name }}</h3>
              <div class="mb-3 flex items-center gap-2">
                @if (p.strainType) {
                  <span
                    class="rounded-full border px-3 py-1 text-xs font-semibold uppercase"
                    [class]="strainBadgeClass(p.strainType)"
                  >
                    {{ p.strainType }}
                  </span>
                }
                @if (p.thcPercent != null) {
                  <span
                    class="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400"
                  >
                    THC {{ p.thcPercent }}%
                  </span>
                }
              </div>
              <p class="text-3xl font-bold text-emerald-400">
                {{ priceLabel(p) }}
              </p>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class MenuBoardPage {
  private readonly svc = inject(MenuBoardService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly categories = CATEGORIES;
  protected readonly products = this.svc.products;
  protected readonly promotions = this.svc.promotions;

  protected readonly activeCategoryIndex = signal<number>(0);
  protected readonly clock = signal<Date>(new Date());
  protected readonly isFullscreen = signal<boolean>(false);

  protected readonly timeLabel = computed(() =>
    this.clock().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  constructor() {
    const clockId = setInterval(() => this.clock.set(new Date()), CLOCK_INTERVAL_MS);
    const rotateId = setInterval(
      () => this.activeCategoryIndex.update((i) => (i + 1) % CATEGORIES.length),
      CATEGORY_ROTATE_MS,
    );
    const handler = () => this.isFullscreen.set(!!this.document.fullscreenElement);
    this.document.addEventListener('fullscreenchange', handler);

    this.destroyRef.onDestroy(() => {
      clearInterval(clockId);
      clearInterval(rotateId);
      this.document.removeEventListener('fullscreenchange', handler);
    });

    // Track effect so manual clock-set in tests triggers CD.
    effect(() => {
      void this.clock();
    });
  }

  protected setActiveCategory(index: number): void {
    this.activeCategoryIndex.set(index);
  }

  protected onToggleFullscreen(): void {
    if (!this.document.fullscreenElement) {
      const el = this.document.documentElement;
      if (el.requestFullscreen) void el.requestFullscreen();
      this.isFullscreen.set(true);
    } else if (this.document.exitFullscreen) {
      void this.document.exitFullscreen();
      this.isFullscreen.set(false);
    }
  }

  protected priceLabel(p: MenuBoardProduct): string {
    const price = p.variants[0]?.retailPrice ?? 0;
    return '$' + price.toFixed(2);
  }

  protected discountLabel(promo: ActivePromotion): string | null {
    if (!promo.discountValue) return null;
    if (promo.type === 'percent' || promo.type === 'percentage') {
      return promo.discountValue + '% OFF';
    }
    return '$' + promo.discountValue.toFixed(2) + ' OFF';
  }

  protected strainBadgeClass(strain: string | null | undefined): string {
    switch (strain) {
      case 'sativa':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'indica':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'hybrid':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  }
}
