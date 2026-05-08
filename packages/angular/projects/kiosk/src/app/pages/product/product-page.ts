import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductGQL, type ProductQuery } from '@cannasaas/ui-ng';
import { map, of } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';

type ApiProduct = NonNullable<ProductQuery['product']>;
type ApiVariant = ApiProduct['variants'][number];

interface StrainStyle {
  readonly bg: string;
  readonly badge: string;
  readonly orb: string;
}

const STRAIN_STYLE: Record<'sativa' | 'indica' | 'hybrid', StrainStyle> = {
  sativa: {
    bg: 'from-amber-100 via-orange-50 to-yellow-50',
    badge: 'bg-amber-500 text-white',
    orb: '#f59e0b',
  },
  indica: {
    bg: 'from-violet-100 via-purple-50 to-indigo-50',
    badge: 'bg-violet-500 text-white',
    orb: '#8b5cf6',
  },
  hybrid: {
    bg: 'from-emerald-100 via-green-50 to-teal-50',
    badge: 'bg-emerald-500 text-white',
    orb: '#10b981',
  },
};

const ADDED_RESET_MS = 1500;

function asStrainKey(value: string | null | undefined): 'sativa' | 'indica' | 'hybrid' {
  return value === 'sativa' || value === 'indica' || value === 'hybrid' ? value : 'hybrid';
}

function asStringArray(value: Record<string, unknown> | null | undefined): string[] {
  return Array.isArray(value) ? (value as string[]).filter((s) => typeof s === 'string') : [];
}

function priceOf(variant: ApiVariant | undefined): number {
  return typeof variant?.retailPrice === 'number' ? variant.retailPrice : 0;
}

function variantInStock(variant: ApiVariant | undefined): boolean {
  if (!variant || variant.isActive === false) return false;
  if (typeof variant.stockQuantity === 'number') return variant.stockQuantity > 0;
  return variant.stockStatus !== 'out_of_stock';
}

function variantStockQty(variant: ApiVariant | undefined): number {
  return typeof variant?.stockQuantity === 'number' ? Math.max(0, Math.floor(variant.stockQuantity)) : 0;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (((hash << 5) - hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

@Component({
  selector: 'cs-product-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="flex h-[60vh] items-center justify-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent"
        ></div>
      </div>
    } @else if (product(); as p) {
      @let strain = strainStyleFor(p.strainType);
      @let orb = orbStyle(p.name);
      @let active = activeVariant();
      @let qty = quantity();
      @let price = priceFor(active);
      @let effs = effectsOf(p);
      @let flavs = flavorsOf(p);
      @let stock = stockFor(active);
      @let inStock = stock > 0;
      @let canIncrease = qty < stock;
      <div class="mx-auto max-w-5xl p-6 lg:p-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <div
            class="relative aspect-square overflow-hidden rounded-3xl bg-linear-to-br"
            [class]="strain.bg"
          >
            <div
              class="absolute rounded-full opacity-20 blur-3xl"
              [style.width.%]="orb.size"
              [style.height.%]="orb.size"
              [style.top.%]="orb.top"
              [style.left.%]="orb.left"
              [style.background]="strain.orb"
            ></div>
            @if (p.strainType) {
              <span
                class="absolute top-5 left-5 rounded-full px-4 py-1.5 text-sm font-bold tracking-wider uppercase shadow-md"
                [class]="strain.badge"
              >
                {{ p.strainType }}
              </span>
            }
            <div class="absolute bottom-5 left-5 flex gap-2">
              @if (p.thcPercent !== null && p.thcPercent !== undefined) {
                <div
                  class="rounded-xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm"
                >
                  <span
                    class="text-[10px] tracking-wider text-gray-500 uppercase"
                  >
                    THC
                  </span>
                  <p class="text-lg font-bold text-gray-900">
                    {{ p.thcPercent }}%
                  </p>
                </div>
              }
              @if (p.cbdPercent !== null && p.cbdPercent !== undefined && p.cbdPercent > 0) {
                <div
                  class="rounded-xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur-sm"
                >
                  <span
                    class="text-[10px] tracking-wider text-gray-500 uppercase"
                  >
                    CBD
                  </span>
                  <p class="text-lg font-bold text-gray-900">
                    {{ p.cbdPercent }}%
                  </p>
                </div>
              }
            </div>
          </div>

          <div class="flex flex-col justify-center">
            <h1
              class="text-3xl font-light text-gray-900 lg:text-4xl"
              style="font-family: 'Playfair Display', Georgia, serif;"
            >
              {{ p.name }}
            </h1>
            @if (p.strainName && p.strainName !== p.name) {
              <p class="mt-1 text-sm text-gray-400 italic">{{ p.strainName }}</p>
            }
            @if (p.description) {
              <p class="mt-5 leading-relaxed text-gray-500">{{ p.description }}</p>
            }

            @if (effs.length > 0) {
              <div class="mt-6">
                <p
                  class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase"
                >
                  Effects
                </p>
                <div class="flex flex-wrap gap-2">
                  @for (e of effs; track e) {
                    <span
                      class="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                    >
                      {{ e }}
                    </span>
                  }
                </div>
              </div>
            }

            @if (flavs.length > 0) {
              <div class="mt-4">
                <p
                  class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase"
                >
                  Flavors
                </p>
                <div class="flex flex-wrap gap-2">
                  @for (f of flavs; track f) {
                    <span
                      class="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700"
                    >
                      {{ f }}
                    </span>
                  }
                </div>
              </div>
            }

            @if (p.variants.length > 1) {
              <div class="mt-6">
                <p
                  class="mb-2 text-xs font-medium tracking-wider text-gray-400 uppercase"
                >
                  Options
                </p>
                <div class="flex flex-wrap gap-2">
                  @for (v of p.variants; track v.variantId) {
                    @let vInStock = isVariantInStock(v);
                    <button
                      type="button"
                      [disabled]="!vInStock"
                      (click)="selectVariant(v.variantId)"
                      class="rounded-full border-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      [class.active:scale-95]="vInStock"
                      [class.border-emerald-500]="active?.variantId === v.variantId && vInStock"
                      [class.bg-emerald-50]="active?.variantId === v.variantId && vInStock"
                      [class.text-emerald-700]="active?.variantId === v.variantId && vInStock"
                      [class.border-gray-200]="active?.variantId !== v.variantId || !vInStock"
                      [class.text-gray-500]="active?.variantId !== v.variantId || !vInStock"
                    >
                      {{ v.name }}@if (!vInStock) {
                        <span class="ml-1 text-xs">(Sold out)</span>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <div class="mt-8 rounded-2xl bg-gray-50 p-6">
              <div class="mb-5 flex items-center justify-between">
                <span class="text-4xl font-bold text-gray-900">
                  {{ price | currency }}
                </span>
                @if (active && active.name && active.name !== 'Standard') {
                  <span class="text-sm text-gray-400">/ {{ active.name }}</span>
                }
              </div>

              @if (inStock) {
                <p class="mb-3 text-xs font-medium tracking-wider text-gray-400 uppercase">
                  {{ stock }} in stock
                </p>
              } @else {
                <p class="mb-3 text-xs font-medium tracking-wider text-red-600 uppercase">
                  Sold out
                </p>
              }

              <div class="flex items-center gap-4">
                <div
                  class="flex items-center rounded-full border border-gray-200 bg-white"
                >
                  <button
                    type="button"
                    (click)="dec()"
                    [disabled]="!inStock || qty <= 1"
                    aria-label="Decrease quantity"
                    class="rounded-l-full p-4 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
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
                      class="text-gray-600"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span class="px-5 text-xl font-bold text-gray-900 tabular-nums">
                    {{ qty }}
                  </span>
                  <button
                    type="button"
                    (click)="inc()"
                    [disabled]="!canIncrease"
                    aria-label="Increase quantity"
                    class="rounded-r-full p-4 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
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
                      class="text-gray-600"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  (click)="add()"
                  [disabled]="!active || !inStock"
                  class="flex flex-1 items-center justify-center gap-3 rounded-full py-4 text-lg font-semibold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
                  [class.bg-emerald-400]="added() && inStock"
                  [class.bg-emerald-600]="!added() && inStock"
                  [class.shadow-lg]="!added() && inStock"
                  [class.shadow-emerald-500\\/20]="!added() && inStock"
                >
                  @if (!inStock) {
                    Sold Out
                  } @else if (added()) {
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
                    Added!
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
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Add — {{ price * qty | currency }}
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="p-8 text-center text-gray-400">Product not found.</div>
    }
  `,
})
export class ProductPage {
  private readonly productGQL = inject(ProductGQL);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  protected readonly quantity = signal(1);
  protected readonly added = signal(false);
  private readonly selectedVariantId = signal<string | null>(null);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null },
  );

  private readonly resource = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) =>
      id
        ? this.productGQL
            .fetch({ variables: { dispensaryId: environment.dispensaryId, id } })
            .pipe(map((r) => (r.data?.product ?? null) as ApiProduct | null))
        : of(null),
  });

  protected readonly loading = this.resource.isLoading;
  protected readonly product = computed<ApiProduct | null>(
    () => this.resource.value() ?? null,
  );

  protected readonly activeVariant = computed<ApiVariant | undefined>(() => {
    const p = this.product();
    if (!p) return undefined;
    const selectedId = this.selectedVariantId();
    if (selectedId) {
      const found = p.variants.find((v) => v.variantId === selectedId);
      if (found) return found;
    }
    return p.variants[0];
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        this.selectedVariantId.set(null);
        this.quantity.set(1);
        this.added.set(false);
      }
    });
  }

  protected priceFor(variant: ApiVariant | undefined): number {
    return priceOf(variant);
  }

  protected effectsOf(p: ApiProduct): string[] {
    return asStringArray(p.effects);
  }

  protected flavorsOf(p: ApiProduct): string[] {
    return asStringArray(p.flavors);
  }

  protected strainStyleFor(value: string | null | undefined): StrainStyle {
    return STRAIN_STYLE[asStrainKey(value)];
  }

  protected orbStyle(name: string): { size: number; top: number; left: number } {
    const h = hashCode(name);
    return {
      size: 60 + (h % 30),
      top: 10 + (h % 25),
      left: 10 + ((h >> 4) % 25),
    };
  }

  protected selectVariant(variantId: string): void {
    if (!variantInStock(this.product()?.variants.find((v) => v.variantId === variantId))) return;
    this.selectedVariantId.set(variantId);
    this.quantity.set(1);
  }

  protected isVariantInStock(variant: ApiVariant): boolean {
    return variantInStock(variant);
  }

  protected stockFor(variant: ApiVariant | undefined): number {
    return variantStockQty(variant);
  }

  protected inc(): void {
    const max = variantStockQty(this.activeVariant());
    this.quantity.update((q) => Math.min(max, q + 1));
  }

  protected dec(): void {
    void this.quantity.update((q) => Math.max(1, q - 1));
  }

  protected add(): void {
    const p = this.product();
    const v = this.activeVariant();
    if (!p || !v || !variantInStock(v)) return;
    const max = variantStockQty(v);
    const price = priceOf(v);
    const qty = Math.min(this.quantity(), max);
    if (qty <= 0) return;
    for (let i = 0; i < qty; i += 1) {
      this.cart.addItem({
        productId: p.id,
        variantId: v.variantId,
        name: p.name,
        variantName: v.name,
        price,
        strainType: p.strainType ?? undefined,
      });
    }
    this.added.set(true);
    setTimeout(() => {
      this.added.set(false);
      this.router.navigateByUrl('/');
    }, ADDED_RESET_MS);
  }
}
