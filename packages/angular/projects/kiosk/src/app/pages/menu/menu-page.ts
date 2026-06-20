import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProductsGQL, type ProductsQuery } from '@cannasaas/ui-ng';
import { map } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';

type ApiProduct = ProductsQuery['products'][number];
type ApiVariant = ApiProduct['variants'][number];
type StrainKey = 'sativa' | 'indica' | 'hybrid';

interface StrainStyle {
  readonly bg: string;
  readonly badge: string;
  readonly orb: string;
}

const STRAIN_STYLE: Record<StrainKey, StrainStyle> = {
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

interface CategoryFilter {
  readonly label: string;
  /** `null` means "all" — omit productTypeId from the query. */
  readonly productTypeId: number | null;
}

const FILTERS: readonly CategoryFilter[] = [
  { label: 'All', productTypeId: null },
  { label: 'Flower', productTypeId: 1 },
  { label: 'Pre-Roll', productTypeId: 2 },
  { label: 'Vape', productTypeId: 3 },
  { label: 'Concentrate', productTypeId: 4 },
  { label: 'Edible', productTypeId: 5 },
];

const ADDED_FLASH_MS = 1500;

function asStrainKey(value: string | null | undefined): StrainKey {
  return value === 'sativa' || value === 'indica' || value === 'hybrid' ? value : 'hybrid';
}

function asStringArray(value: Record<string, unknown> | null | undefined): string[] {
  return Array.isArray(value) ? (value as string[]).filter((s) => typeof s === 'string') : [];
}

function getPrice(product: ApiProduct): number {
  const first = product.variants[0];
  return typeof first?.retailPrice === 'number' ? first.retailPrice : 0;
}

function variantInStock(variant: ApiVariant | undefined): boolean {
  if (!variant || variant.isActive === false) return false;
  if (typeof variant.stockQuantity === 'number') return variant.stockQuantity > 0;
  // Fallback when stockQuantity is null: trust stockStatus.
  return variant.stockStatus !== 'out_of_stock';
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

@Component({
  selector: 'cs-menu-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 lg:p-8">
      <div class="mb-8 text-center">
        <div
          class="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium tracking-wider text-emerald-700 uppercase"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
            />
          </svg>
          Welcome
        </div>
        <h1
          class="text-3xl font-light text-gray-900 lg:text-4xl"
          style="font-family: 'Playfair Display', Georgia, serif;"
        >
          Browse Our <span class="text-emerald-700 italic">Menu</span>
        </h1>
        <p class="mt-2 text-sm text-gray-400">
          Tap a product to learn more, or add directly to your cart
        </p>
      </div>

      <div class="mb-8 flex justify-center gap-2 overflow-x-auto pb-2">
        @for (f of filters; track f.label) {
          @let active = filter().productTypeId === f.productTypeId;
          <button
            type="button"
            (click)="filter.set(f)"
            class="rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap active:scale-95"
            [class.bg-emerald-600]="active"
            [class.text-white]="active"
            [class.shadow-md]="active"
            [class.shadow-emerald-500\\/20]="active"
            [class.bg-white]="!active"
            [class.text-gray-500]="!active"
            [class.border]="!active"
            [class.border-gray-200]="!active"
          >
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="py-20 text-center text-gray-400">
          <div
            class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent"
          ></div>
          Loading menu...
        </div>
      } @else if (error()) {
        <div class="py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto mb-4 text-red-300"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p class="font-medium text-gray-700">Couldn't load the menu</p>
          <p class="mt-1 text-sm text-gray-400">Check your connection, then try again.</p>
          <button
            type="button"
            (click)="reload()"
            class="mt-5 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 active:scale-95"
          >
            Retry
          </button>
        </div>
      } @else if (filtered().length === 0) {
        <div class="py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto mb-4 text-gray-200"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <p class="text-gray-400">No products found</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          @for (p of filtered(); track p.id) {
            @let strain = strainStyleFor(p.strainType);
            @let orb = orbStyle(p.name);
            @let isAdded = addedId() === p.id;
            @let inStock = isInStock(p);
            <button
              type="button"
              (click)="goToProduct(p.id)"
              class="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left transition-all duration-300 active:scale-[0.98]"
            >
              <div
                class="relative aspect-[4/3] overflow-hidden bg-linear-to-br"
                [class]="strain.bg"
              >
                <div
                  class="absolute rounded-full opacity-20 blur-xl"
                  [style.width.%]="orb.size"
                  [style.height.%]="orb.size"
                  [style.top.%]="orb.top"
                  [style.left.%]="orb.left"
                  [style.background]="strain.orb"
                ></div>
                @if (p.strainType) {
                  <span
                    class="absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-sm"
                    [class]="strain.badge"
                  >
                    {{ p.strainType }}
                  </span>
                }
                @if (p.thcPercent !== null && p.thcPercent !== undefined && p.thcPercent > 0) {
                  <span
                    class="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-gray-700 backdrop-blur-sm"
                  >
                    THC {{ p.thcPercent }}%
                  </span>
                }
              </div>

              <div class="p-5">
                <h3 class="text-lg leading-tight font-semibold text-gray-900">
                  {{ p.name }}
                </h3>
                @if (p.strainName && p.strainName !== p.name) {
                  <p class="mt-0.5 text-xs text-gray-400 italic">{{ p.strainName }}</p>
                }
                @let effs = effectsOf(p);
                @if (effs.length > 0) {
                  <div class="mt-3 flex flex-wrap gap-1">
                    @for (effect of effs.slice(0, 3); track effect) {
                      <span
                        class="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                      >
                        {{ effect }}
                      </span>
                    }
                  </div>
                }

                <div class="mt-4 flex items-center justify-between">
                  <span class="text-2xl font-bold text-gray-900">
                    {{ priceOf(p) | currency }}
                  </span>
                  <span
                    role="button"
                    [attr.aria-disabled]="!inStock"
                    [tabindex]="inStock ? 0 : -1"
                    (click)="inStock && onAddClick($event, p)"
                    [class]="addControlClasses(inStock, isAdded)"
                  >
                    @if (!inStock) {
                      Sold out
                    } @else if (isAdded) {
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
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Added
                    } @else {
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
                      Add
                    }
                  </span>
                </div>
              </div>
            </button>
          }
        </div>
      }
    </div>
  `,
  imports: [CurrencyPipe],
})
export class MenuPage {
  private readonly productsGQL = inject(ProductsGQL);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly filters = FILTERS;
  protected readonly filter = signal<CategoryFilter>(FILTERS[0]);
  protected readonly addedId = signal<string | null>(null);

  private readonly resource = rxResource({
    params: () => ({ productTypeId: this.filter().productTypeId }),
    stream: ({ params }) =>
      this.productsGQL
        .fetch({
          variables: {
            dispensaryId: environment.dispensaryId,
            productTypeId: params.productTypeId ?? null,
          },
        })
        .pipe(map((r) => (r.data?.products ?? []) as readonly ApiProduct[])),
  });

  protected readonly loading = this.resource.isLoading;
  protected readonly error = computed<Error | null>(() => this.resource.error() ?? null);
  protected readonly filtered = computed<readonly ApiProduct[]>(() => {
    if (this.resource.status() === 'error') return [];
    return this.resource.value() ?? [];
  });

  protected reload(): void {
    this.resource.reload();
  }

  protected goToProduct(id: string): void {
    void this.router.navigateByUrl(`/product/${id}`);
  }

  protected onAddClick(event: Event, product: ApiProduct): void {
    event.stopPropagation();
    const variant = product.variants[0];
    if (!variant) return;
    this.cart.addItem({
      productId: product.id,
      variantId: variant.variantId,
      name: product.name,
      variantName: variant.name,
      price: getPrice(product),
      strainType: product.strainType ?? undefined,
    });
    this.addedId.set(product.id);
    setTimeout(() => {
      if (this.addedId() === product.id) this.addedId.set(null);
    }, ADDED_FLASH_MS);
  }

  protected priceOf(p: ApiProduct): number {
    return getPrice(p);
  }

  protected effectsOf(p: ApiProduct): string[] {
    return asStringArray(p.effects);
  }

  protected strainStyleFor(value: string | null | undefined): StrainStyle {
    return STRAIN_STYLE[asStrainKey(value)];
  }

  protected orbStyle(name: string): { size: number; top: number; left: number } {
    const h = hashCode(name);
    return {
      size: 60 + (h % 40),
      top: 10 + (h % 30),
      left: 10 + ((h >> 4) % 30),
    };
  }

  protected isInStock(product: ApiProduct): boolean {
    return variantInStock(product.variants[0]);
  }

  protected addControlClasses(inStock: boolean, isAdded: boolean): string {
    const base =
      'flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all';
    if (!inStock) {
      return `${base} cursor-not-allowed bg-gray-200 text-gray-500`;
    }
    if (isAdded) {
      return `${base} bg-emerald-100 text-emerald-700 active:scale-95`;
    }
    return `${base} bg-emerald-600 text-white shadow-md shadow-emerald-500/20 active:scale-95`;
  }
}
