import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { ProductsGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';
import { ProductCard, ProductListItem } from './product-card';

const STRAIN_FILTERS: readonly { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Indica', value: 'indica' },
  { label: 'Sativa', value: 'sativa' },
  { label: 'Hybrid', value: 'hybrid' },
];

@Component({
  selector: 'cs-products-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
  template: `
    <div class="mx-auto max-w-7xl px-6 py-12">
      <div class="mb-8">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-700">
          Our Selection
        </p>
        <h1 class="font-display text-3xl text-stone-900 sm:text-4xl">
          Browse the <span class="italic">Menu</span>
        </h1>
      </div>

      <div class="mb-10 flex flex-col gap-4 sm:flex-row">
        <div class="relative flex-1">
          <svg
            class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
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
          <input
            type="text"
            placeholder="Search products..."
            class="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-700"
            [value]="search()"
            (input)="onSearch($event)"
          />
        </div>
        <div class="flex items-center gap-2">
          @for (filter of strainFilters; track filter.label) {
            <button
              type="button"
              class="rounded-full px-5 py-2.5 text-sm font-medium transition-all"
              [class]="
                filter.value === strainFilter()
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              "
              (click)="strainFilter.set(filter.value)"
            >
              {{ filter.label }}
            </button>
          }
        </div>
      </div>

      @if (productsResource.isLoading()) {
        <p class="py-20 text-center text-stone-500">Loading products…</p>
      } @else if (productsResource.error()) {
        <p class="py-20 text-center text-rose-700">Could not load products. {{ errorMessage() }}</p>
      } @else if (!dispensary.entityId()) {
        <p class="py-20 text-center text-stone-500">No dispensary resolved for this URL.</p>
      } @else {
        @if (filtered().length === 0) {
          <div class="py-20 text-center">
            <svg
              class="mx-auto mb-4 h-12 w-12 text-stone-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
            <p class="text-stone-500">No products found</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            @for (product of filtered(); track product.id) {
              <cs-product-card [product]="product" />
            }
          </div>
        }
      }
    </div>
  `,
})
export class ProductsPage {
  protected readonly dispensary = inject(DispensaryContextService);
  private readonly productsGQL = inject(ProductsGQL);

  protected readonly strainFilters = STRAIN_FILTERS;
  protected readonly search = signal('');
  protected readonly strainFilter = signal<string | null>(null);

  protected readonly productsResource = resource<
    ProductListItem[],
    { dispensaryId: string | null }
  >({
    params: () => ({ dispensaryId: this.dispensary.entityId() }),
    loader: async ({ params }) => {
      if (!params.dispensaryId) return [];
      const result = await firstValueFrom(
        this.productsGQL.fetch({
          variables: { dispensaryId: params.dispensaryId, limit: 50 },
        }),
      );
      return result.data?.products ?? [];
    },
  });

  protected readonly filtered = computed(() => {
    const all = this.productsResource.value() ?? [];
    const term = this.search().trim().toLowerCase();
    const strain = this.strainFilter();
    return all.filter((p) => {
      const matchesSearch = !term || p.name.toLowerCase().includes(term);
      const matchesStrain = !strain || p.strainType?.toLowerCase() === strain;
      return matchesSearch && matchesStrain;
    });
  });

  protected readonly errorMessage = computed(() => {
    const err = this.productsResource.error();
    if (!err) return '';
    return err instanceof Error ? err.message : String(err);
  });

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }
}
