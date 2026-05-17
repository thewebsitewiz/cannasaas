import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StaffInventoryProductsGQL } from '@cannasaas/ui-ng';
import { AuthService } from '../../core/auth/auth.service';

interface InventoryVariant {
  readonly variantId: string;
  readonly name: string;
  readonly sku: string | null;
  readonly barcode: string | null;
  readonly retailPrice: number | null;
  readonly stockQuantity: number | null;
  readonly stockStatus: string | null;
  readonly isActive: boolean;
}

interface InventoryProduct {
  readonly id: string;
  readonly name: string;
  readonly sku: string | null;
  readonly strainName: string | null;
  readonly strainType: string | null;
  readonly thcPercent: number | null;
  readonly cbdPercent: number | null;
  readonly isActive: boolean;
  readonly variants: readonly InventoryVariant[];
}

function stockLabel(status: string | null): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function stockClass(status: string | null): string {
  switch (status) {
    case 'in_stock':
      return 'bg-emerald-50 text-emerald-700';
    case 'low_stock':
      return 'bg-amber-50 text-amber-700';
    case 'out_of_stock':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-(--color-surface-alt) text-(--color-text-muted)';
  }
}

@Component({
  selector: 'cs-inventory-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Inventory</h1>
      <span class="text-sm text-(--color-text-muted)"> {{ products().length }} products </span>
    </header>

    <section class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-2xl font-bold">{{ products().length }}</p>
        <p class="text-xs text-(--color-text-muted)">Products</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-2xl font-bold text-emerald-600">{{ inStockCount() }}</p>
        <p class="text-xs text-(--color-text-muted)">In Stock</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-2xl font-bold text-amber-600">{{ lowStockCount() }}</p>
        <p class="text-xs text-(--color-text-muted)">Low Stock</p>
      </div>
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <p class="text-2xl font-bold text-rose-600">{{ outOfStockCount() }}</p>
        <p class="text-xs text-(--color-text-muted)">Out of Stock</p>
      </div>
    </section>

    <div class="mb-6 max-w-md">
      <input
        type="text"
        placeholder="Search products…"
        class="min-h-11 w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm"
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
      />
    </div>

    @if (loading() && products().length === 0) {
      <ul class="space-y-3">
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <li
            class="animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
          >
            <div class="mb-2 h-4 w-48 rounded bg-(--color-surface-alt)"></div>
            <div class="h-3 w-32 rounded bg-(--color-surface-alt)"></div>
          </li>
        }
      </ul>
    } @else if (products().length === 0) {
      <div class="rounded-xl border border-(--color-border) bg-(--color-surface) p-12 text-center">
        <p class="text-sm text-(--color-text-muted)">
          No products found{{ debouncedSearch() ? ' matching "' + debouncedSearch() + '"' : '' }}
        </p>
      </div>
    } @else {
      <ul class="space-y-3">
        @for (product of products(); track product.id) {
          <li
            class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
          >
            <header
              class="flex items-center justify-between border-b border-(--color-border) px-5 py-4"
            >
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold">{{ product.name }}</h3>
                  @if (!product.isActive) {
                    <span
                      class="rounded-full bg-(--color-surface-alt) px-2 py-0.5 text-[10px] font-medium text-(--color-text-muted)"
                    >
                      Inactive
                    </span>
                  }
                </div>
                <div class="mt-1 flex items-center gap-3 text-xs text-(--color-text-muted)">
                  @if (product.sku) {
                    <span class="font-mono">{{ product.sku }}</span>
                  }
                  @if (product.strainName) {
                    <span>
                      {{ product.strainName
                      }}{{ product.strainType ? ' (' + product.strainType + ')' : '' }}
                    </span>
                  }
                  @if (product.thcPercent != null && product.thcPercent > 0) {
                    <span>THC {{ product.thcPercent }}%</span>
                  }
                  @if (product.cbdPercent != null && product.cbdPercent > 0) {
                    <span>CBD {{ product.cbdPercent }}%</span>
                  }
                </div>
              </div>
              <span class="text-xs text-(--color-text-muted)">
                {{ product.variants.length }} variant{{ product.variants.length === 1 ? '' : 's' }}
              </span>
            </header>

            @if (product.variants.length > 0) {
              <table class="w-full text-sm">
                <thead>
                  <tr
                    class="bg-(--color-surface-alt)/50 text-left text-xs text-(--color-text-muted)"
                  >
                    <th class="px-5 py-2 font-medium">Variant</th>
                    <th class="px-3 py-2 font-medium">SKU</th>
                    <th class="px-3 py-2 font-medium">Barcode</th>
                    <th class="px-3 py-2 text-right font-medium">Price</th>
                    <th class="px-3 py-2 text-right font-medium">Qty</th>
                    <th class="px-5 py-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-(--color-border)">
                  @for (v of product.variants; track v.variantId) {
                    <tr [class.opacity-50]="!v.isActive">
                      <td class="px-5 py-2.5">{{ v.name || '—' }}</td>
                      <td class="px-3 py-2.5 font-mono text-xs text-(--color-text-muted)">
                        {{ v.sku || '—' }}
                      </td>
                      <td class="px-3 py-2.5 font-mono text-xs text-(--color-text-muted)">
                        {{ v.barcode || '—' }}
                      </td>
                      <td class="px-3 py-2.5 text-right tabular-nums">
                        {{ v.retailPrice != null ? '$' + v.retailPrice.toFixed(2) : '—' }}
                      </td>
                      <td class="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {{ v.stockQuantity ?? '—' }}
                      </td>
                      <td class="px-5 py-2.5 text-center">
                        <span
                          class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          [class]="stockClass(v.stockStatus)"
                        >
                          {{ stockLabel(v.stockStatus) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </li>
        }
      </ul>
    }
  `,
})
export class InventoryPage {
  private readonly auth = inject(AuthService);
  private readonly inventoryGQL = inject(StaffInventoryProductsGQL);

  protected readonly search = signal('');
  protected readonly products = signal<readonly InventoryProduct[]>([]);
  protected readonly loading = signal(true);

  protected readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly dispensaryId = computed(() => this.auth.user()?.dispensaryId ?? null);

  protected readonly stockLabel = stockLabel;
  protected readonly stockClass = stockClass;

  protected readonly inStockCount = computed(() =>
    this.products().reduce(
      (sum, p) => sum + p.variants.filter((v) => v.stockStatus === 'in_stock').length,
      0,
    ),
  );

  protected readonly lowStockCount = computed(() =>
    this.products().reduce(
      (sum, p) => sum + p.variants.filter((v) => v.stockStatus === 'low_stock').length,
      0,
    ),
  );

  protected readonly outOfStockCount = computed(() =>
    this.products().reduce(
      (sum, p) => sum + p.variants.filter((v) => v.stockStatus === 'out_of_stock').length,
      0,
    ),
  );

  constructor() {
    effect(() => {
      const id = this.dispensaryId();
      const search = this.debouncedSearch();
      if (!id) return;
      void this.load(id, search);
    });
  }

  private async load(dispensaryId: string, search: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.inventoryGQL
        .fetch({
          variables: {
            dispensaryId,
            limit: 200,
            offset: 0,
            search: search || null,
          },
          fetchPolicy: 'network-only',
        })
        .toPromise();
      const rows = (result?.data?.products ?? []) as unknown as InventoryProduct[];
      this.products.set(rows);
    } catch {
      this.products.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
