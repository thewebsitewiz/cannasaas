import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductGQL, ProductQuery } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../core/cart/cart.service';
import { StockUpdatesService } from '../../core/stock-updates/stock-updates.service';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';

type ProductDetail = NonNullable<ProductQuery['product']>;
type ProductVariant = ProductDetail['variants'][number];

const STOCK_LABEL: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock — Order Soon',
  out_of_stock: 'Out of Stock',
};

const STOCK_CLASS: Record<string, string> = {
  in_stock: 'text-emerald-700',
  low_stock: 'text-amber-700',
  out_of_stock: 'text-rose-700',
};

const STRAIN_BADGE: Record<string, string> = {
  indica: 'bg-purple-100 text-purple-700',
  sativa: 'bg-orange-50 text-orange-700',
  hybrid: 'bg-green-100 text-green-700',
};

@Component({
  selector: 'cs-product-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button
        type="button"
        class="mb-6 flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        (click)="onBack()"
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>

      @if (productResource.isLoading()) {
        <div class="grid animate-pulse grid-cols-1 gap-12 md:grid-cols-2">
          <div class="aspect-square rounded-2xl bg-stone-100"></div>
          <div class="space-y-4">
            <div class="h-8 w-3/4 rounded bg-stone-100"></div>
            <div class="h-4 w-1/2 rounded bg-stone-100"></div>
            <div class="h-32 rounded bg-stone-100"></div>
          </div>
        </div>
      } @else if (productResource.error()) {
        <p class="py-20 text-center text-rose-700">Could not load product. {{ errorMessage() }}</p>
      } @else if (!product()) {
        <div class="py-16 text-center">
          <svg
            class="mx-auto mb-4 h-12 w-12 text-stone-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <p class="mb-4 text-stone-500">Product not found</p>
          <a
            class="font-medium text-emerald-700 hover:text-emerald-600"
            [routerLink]="['/products']"
            >Back to Menu</a
          >
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          <div
            class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-100"
          >
            <svg
              class="h-24 w-24 text-emerald-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
              />
            </svg>
            @if (product()?.strainType; as strain) {
              <span
                class="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase"
                [class]="strainBadgeClass()"
                >{{ strain }}</span
              >
            }
            @if (isOutOfStock()) {
              <div class="absolute inset-0 flex items-center justify-center bg-white/60">
                <span class="rounded-full bg-rose-700 px-4 py-2 text-sm font-bold text-white"
                  >Sold Out</span
                >
              </div>
            }
          </div>

          <div>
            <h1 class="font-display text-3xl font-bold text-stone-900">
              {{ product()?.name }}
            </h1>

            <div class="mt-3 flex items-center gap-4">
              @if (product()?.thcPercent != null) {
                <div class="rounded-lg bg-stone-100 px-3 py-1.5">
                  <span class="text-xs text-stone-500">THC</span>
                  <p class="text-sm font-bold text-stone-900">{{ product()?.thcPercent }}%</p>
                </div>
              }
              @if (product()?.cbdPercent != null) {
                <div class="rounded-lg bg-stone-100 px-3 py-1.5">
                  <span class="text-xs text-stone-500">CBD</span>
                  <p class="text-sm font-bold text-stone-900">{{ product()?.cbdPercent }}%</p>
                </div>
              }
            </div>

            <div class="mt-6 flex items-center gap-3">
              <p class="text-3xl font-bold text-emerald-700">
                {{ price() > 0 ? '$' + priceLabel() : 'Price unavailable' }}
              </p>
              <span class="text-sm font-medium" [class]="stockClass()">
                {{ stockLabel() }}
              </span>
            </div>

            @if (showLowStockHint()) {
              <p class="mt-1 text-xs text-amber-700">Only {{ stockQty() }} left</p>
            }
            @if (inCartQty() > 0) {
              <p class="mt-1 text-xs text-emerald-700">{{ inCartQty() }} already in cart</p>
            }

            @if (variants().length > 1) {
              <div class="mt-6">
                <p class="mb-2 text-sm font-medium text-stone-700">Size</p>
                <div class="flex flex-wrap gap-2">
                  @for (v of variants(); track v.variantId) {
                    <button
                      type="button"
                      class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                      [class]="variantButtonClass(v)"
                      [disabled]="v.stockStatus === 'out_of_stock'"
                      (click)="onSelectVariant(v.variantId)"
                    >
                      {{ v.name }}
                      @if (v.quantityPerUnit) {
                        <span class="ml-1 text-xs text-stone-500">({{ v.quantityPerUnit }}g)</span>
                      }
                      @if ((v.retailPrice ?? 0) > 0) {
                        <span class="ml-2 font-bold">\${{ (v.retailPrice ?? 0).toFixed(2) }}</span>
                      }
                    </button>
                  }
                </div>
              </div>
            } @else if (active(); as a) {
              <p class="mt-3 text-sm text-stone-500">
                {{ a.name }}
                @if (a.quantityPerUnit) {
                  · {{ a.quantityPerUnit }}g
                }
              </p>
            }

            <div class="mt-8 flex items-center gap-4">
              @if (showStepper()) {
                <div class="flex items-center rounded-lg border border-stone-200">
                  <button
                    type="button"
                    class="px-3 py-2 text-stone-500 hover:text-stone-900"
                    (click)="dec()"
                  >
                    −
                  </button>
                  <span class="px-3 py-2 font-medium text-stone-900 tabular-nums">{{
                    quantity()
                  }}</span>
                  <button
                    type="button"
                    class="px-3 py-2 text-stone-500 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                    [disabled]="quantity() >= maxAddable()"
                    (click)="inc()"
                  >
                    +
                  </button>
                </div>
              }
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all disabled:opacity-50"
                [class]="addButtonClass()"
                [disabled]="!addable()"
                (click)="onAddToCart()"
              >
                @if (isOutOfStock()) {
                  <span>Out of Stock</span>
                } @else if (maxAddable() <= 0) {
                  <span>Maximum in Cart</span>
                } @else if (added()) {
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added to Cart</span>
                } @else {
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 19a1 1 0 11-2 0 1 1 0 012 0zM20 19a1 1 0 11-2 0 1 1 0 012 0zM3 3h2l3.6 11h11l2.4-8H6"
                    />
                  </svg>
                  <span>Add to Cart — \${{ totalPriceLabel() }}</span>
                }
              </button>
            </div>

            @if (product()?.description; as description) {
              <div class="mt-8">
                <h3 class="mb-2 text-sm font-semibold text-stone-900">About</h3>
                <p class="text-sm leading-relaxed text-stone-600">
                  {{ description }}
                </p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductDetailPage {
  // Bound from the route param via withComponentInputBinding().
  readonly id = input.required<string>();

  private readonly productGQL = inject(ProductGQL);
  private readonly cart = inject(CartService);
  private readonly stockUpdates = inject(StockUpdatesService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly selectedVariantId = signal<string | null>(null);
  protected readonly quantity = signal(1);
  protected readonly added = signal(false);

  protected readonly productResource = resource<
    ProductDetail | null,
    { id: string; dispensaryId: string | null }
  >({
    params: () => ({ id: this.id(), dispensaryId: this.dispensary.entityId() }),
    loader: async ({ params }) => {
      if (!params.dispensaryId) return null;
      const result = await firstValueFrom(
        this.productGQL.fetch({
          variables: { id: params.id, dispensaryId: params.dispensaryId },
        }),
      );
      return result.data?.product ?? null;
    },
  });

  protected readonly product = computed(() => this.productResource.value() ?? null);
  protected readonly variants = computed<ProductVariant[]>(() => this.product()?.variants ?? []);
  protected readonly active = computed<ProductVariant | null>(() => {
    const list = this.variants();
    if (list.length === 0) return null;
    const id = this.selectedVariantId();
    return id ? (list.find((v) => v.variantId === id) ?? list[0]) : list[0];
  });

  private readonly liveStock = computed(() => {
    const variant = this.active();
    if (!variant) return null;
    return this.stockUpdates.updates().get(variant.variantId) ?? null;
  });

  protected readonly price = computed(() => Number(this.active()?.retailPrice ?? 0));
  protected readonly priceLabel = computed(() => this.price().toFixed(2));
  protected readonly stockStatus = computed(
    () => this.liveStock()?.status ?? this.active()?.stockStatus ?? 'in_stock',
  );
  protected readonly stockQty = computed(() => {
    const live = this.liveStock();
    if (live != null) return live.available;
    const q = this.active()?.stockQuantity;
    return q != null ? Number(q) : null;
  });
  protected readonly isOutOfStock = computed(() => this.stockStatus() === 'out_of_stock');
  protected readonly stockLabel = computed(
    () => STOCK_LABEL[this.stockStatus()] ?? STOCK_LABEL['in_stock'],
  );
  protected readonly stockClass = computed(
    () => STOCK_CLASS[this.stockStatus()] ?? STOCK_CLASS['in_stock'],
  );
  protected readonly strainBadgeClass = computed(() => {
    const strain = this.product()?.strainType?.toLowerCase() ?? 'hybrid';
    return STRAIN_BADGE[strain] ?? STRAIN_BADGE['hybrid'];
  });
  protected readonly showLowStockHint = computed(
    () => this.stockStatus() === 'low_stock' && this.stockQty() != null,
  );

  protected readonly inCartQty = computed(() => {
    const variant = this.active();
    if (!variant) return 0;
    return this.cart.items().find((i) => i.variantId === variant.variantId)?.quantity ?? 0;
  });
  protected readonly maxAddable = computed(() => {
    const qty = this.stockQty();
    if (qty == null) return 99;
    return Math.max(0, qty - this.inCartQty());
  });
  protected readonly showStepper = computed(() => !this.isOutOfStock() && this.maxAddable() > 0);
  protected readonly addable = computed(
    () =>
      this.active() != null && !this.isOutOfStock() && this.price() > 0 && this.maxAddable() > 0,
  );
  protected readonly addButtonClass = computed(() => {
    if (this.isOutOfStock() || this.maxAddable() <= 0)
      return 'bg-stone-100 text-stone-500 cursor-not-allowed';
    if (this.added()) return 'bg-emerald-600 text-white';
    return 'bg-emerald-700 hover:bg-emerald-600 text-white';
  });
  protected readonly totalPriceLabel = computed(() =>
    (this.price() * Math.min(this.quantity(), this.maxAddable())).toFixed(2),
  );
  protected readonly errorMessage = computed(() => {
    const err = this.productResource.error();
    if (!err) return '';
    return err instanceof Error ? err.message : String(err);
  });

  constructor() {
    // Reset stepper to 1 whenever the active variant changes (matches React).
    effect(() => {
      void this.active()?.variantId;
      this.quantity.set(1);
    });
  }

  variantButtonClass(v: ProductVariant): string {
    if (v.stockStatus === 'out_of_stock') {
      return 'border-stone-200 text-stone-400 line-through opacity-50 cursor-not-allowed';
    }
    const activeId = this.active()?.variantId;
    if (activeId === v.variantId) {
      return 'border-emerald-700 bg-emerald-50 text-emerald-700';
    }
    return 'border-stone-200 text-stone-700 hover:border-stone-400';
  }

  onSelectVariant(variantId: string): void {
    this.selectedVariantId.set(variantId);
  }

  inc(): void {
    this.quantity.update((q) => Math.min(q + 1, this.maxAddable()));
  }

  dec(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  onBack(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/products');
    }
  }

  onAddToCart(): void {
    const variant = this.active();
    const product = this.product();
    if (!variant || !product || this.isOutOfStock() || this.maxAddable() <= 0) {
      return;
    }
    const qtyToAdd = Math.min(this.quantity(), this.maxAddable());
    for (let i = 0; i < qtyToAdd; i++) {
      this.cart.addItem({
        productId: product.id,
        variantId: variant.variantId,
        name: product.name,
        variantName: variant.name,
        price: this.price(),
        maxQuantity: this.stockQty() ?? undefined,
        strainType: product.strainType ?? undefined,
      });
    }
    this.added.set(true);
    this.quantity.set(1);
    setTimeout(() => this.added.set(false), 2000);
  }
}
