import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsQuery } from '@cannasaas/ui-ng';
import { CartService } from '../../core/cart/cart.service';

export type ProductListItem = ProductsQuery['products'][number];

const STRAIN_BADGE_CLASS: Record<string, string> = {
  sativa: 'bg-orange-50 text-orange-700 border-orange-200',
  indica: 'bg-purple-50 text-purple-700 border-purple-200',
  hybrid: 'bg-green-50 text-green-700 border-green-200',
};

const STOCK_LABEL: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Sold Out',
};

const STOCK_CLASS: Record<string, string> = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-700',
  out_of_stock: 'bg-rose-50 text-rose-700',
};

@Component({
  selector: 'cs-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/products', product().id]"
      class="group block overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md"
      [class.opacity-70]="isOutOfStock()"
    >
      <div
        class="relative flex aspect-square items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100"
      >
        <svg
          class="h-12 w-12 text-emerald-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
          />
        </svg>
        @if (product().strainType; as strain) {
          <span
            class="absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            [class]="strainBadge()"
            >{{ strain }}</span
          >
        }
        @if (stockStatus() !== 'in_stock') {
          <span
            class="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            [class]="stockClass()"
          >
            {{ stockLabel() }}
          </span>
        }
        @if (!isOutOfStock()) {
          <button
            type="button"
            class="absolute bottom-3 right-3 rounded-full p-2 transition-opacity"
            [class]="addButtonClass()"
            [disabled]="atMax()"
            [attr.aria-label]="addAriaLabel()"
            (click)="onAdd($event)"
          >
            <svg
              class="h-4 w-4"
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
        }
      </div>

      <div class="p-4">
        <h3 class="font-semibold text-stone-900 transition-colors group-hover:text-emerald-700">
          {{ product().name }}
        </h3>
        <div class="mt-2 flex items-center gap-3 text-xs text-stone-500">
          @if (product().thcPercent != null) {
            <span>THC {{ product().thcPercent }}%</span>
          }
          @if (product().cbdPercent != null) {
            <span>CBD {{ product().cbdPercent }}%</span>
          }
        </div>
        <div class="mt-2 flex items-center justify-between">
          @if (price() > 0) {
            <p class="text-lg font-bold text-emerald-700">\${{ priceLabel() }}</p>
          }
          @if (stockStatus() === 'in_stock') {
            <span class="text-[10px] font-medium text-emerald-700">In Stock</span>
          }
        </div>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<ProductListItem>();

  private readonly cart = inject(CartService);

  private readonly firstVariant = computed(() => this.product().variants[0] ?? null);

  readonly price = computed(() => Number(this.firstVariant()?.retailPrice ?? 0));
  readonly priceLabel = computed(() => this.price().toFixed(2));
  readonly stockStatus = computed(() => this.firstVariant()?.stockStatus ?? 'in_stock');
  readonly isOutOfStock = computed(() => this.stockStatus() === 'out_of_stock');
  readonly stockLabel = computed(() => STOCK_LABEL[this.stockStatus()] ?? STOCK_LABEL['in_stock']);
  readonly stockClass = computed(() => STOCK_CLASS[this.stockStatus()] ?? STOCK_CLASS['in_stock']);
  readonly strainBadge = computed(() => {
    const strain = this.product().strainType?.toLowerCase() ?? 'hybrid';
    return STRAIN_BADGE_CLASS[strain] ?? STRAIN_BADGE_CLASS['hybrid'];
  });

  readonly atMax = computed(() => {
    const variant = this.firstVariant();
    if (!variant?.stockQuantity) return false;
    const variantId = variant.variantId;
    const inCart = this.cart.items().find((i) => i.variantId === variantId);
    return inCart != null && inCart.quantity >= variant.stockQuantity;
  });

  readonly addButtonClass = computed(() =>
    this.atMax()
      ? 'bg-stone-400 text-white opacity-100 cursor-not-allowed'
      : 'bg-emerald-700 text-white opacity-0 group-hover:opacity-100 hover:bg-emerald-600',
  );

  readonly addAriaLabel = computed(() =>
    this.atMax()
      ? `${this.product().name} — maximum quantity in cart`
      : `Add ${this.product().name} to cart`,
  );

  onAdd(event: Event): void {
    event.preventDefault();
    if (this.isOutOfStock() || this.atMax()) return;
    const variant = this.firstVariant();
    const product = this.product();
    this.cart.addItem({
      productId: product.id,
      variantId: variant?.variantId ?? product.id,
      name: product.name,
      variantName: variant?.name ?? 'Standard',
      price: this.price(),
      maxQuantity: variant?.stockQuantity ?? undefined,
      strainType: product.strainType ?? undefined,
    });
  }
}
