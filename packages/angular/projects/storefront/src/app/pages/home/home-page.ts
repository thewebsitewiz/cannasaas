import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { DispensaryContextService } from '../../core/tenant/dispensary-context.service';
import { ProductCard, ProductListItem } from '../../features/products/product-card';

@Component({
  selector: 'cs-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductCard],
  template: `
    <section class="bg-linear-to-br from-emerald-700 to-emerald-600 py-20 text-white">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <div class="mb-4 flex justify-center">
          <svg
            class="h-12 w-12 opacity-70"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
            />
          </svg>
        </div>
        <h1 class="font-display mb-4 text-4xl font-bold sm:text-5xl">Welcome to GreenLeaf</h1>
        <p class="mx-auto mb-8 max-w-2xl text-lg opacity-80">
          Licensed cannabis dispensary in Tappan, NY. Browse our curated menu and order for pickup
          or delivery.
        </p>
        <div class="flex justify-center gap-4">
          <a
            class="rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 transition-colors hover:bg-stone-50"
            [routerLink]="['/products']"
            >Shop Menu</a
          >
          <a
            class="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            [routerLink]="['/products']"
            >View Strains</a
          >
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        @for (feature of features; track feature.title) {
          <div class="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-6">
            <svg
              class="mt-0.5 h-6 w-6 shrink-0 text-emerald-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path [attr.d]="feature.iconPath" />
            </svg>
            <div>
              <h3 class="font-semibold text-stone-900">{{ feature.title }}</h3>
              <p class="mt-1 text-sm text-stone-500">{{ feature.body }}</p>
            </div>
          </div>
        }
      </div>
    </section>

    @if (productsResource.isLoading()) {
      <section class="mx-auto max-w-7xl px-4 pb-16 text-center sm:px-6">
        <p class="py-12 text-stone-500">Loading products…</p>
      </section>
    } @else if (products().length > 0) {
      <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-stone-900">Featured Products</h2>
          <a
            class="text-sm font-medium text-emerald-700 hover:text-emerald-600"
            [routerLink]="['/products']"
            >View all →</a
          >
        </div>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
          @for (product of products(); track product.id) {
            <cs-product-card [product]="product" />
          }
        </div>
      </section>
    }
  `,
})
export class HomePage {
  private readonly dispensary = inject(DispensaryContextService);
  private readonly productsGQL = inject(ProductsGQL);

  protected readonly features = [
    {
      title: 'Delivery & Pickup',
      body: 'Free local delivery within 3 miles. Same-day pickup available.',
      iconPath:
        'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM6 19a2 2 0 100 4 2 2 0 000-4zM18 19a2 2 0 100 4 2 2 0 000-4z',
    },
    {
      title: '100% Compliant',
      body: 'All products tested and tracked via Metrc. Fully licensed in NY.',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
    },
    {
      title: 'Order Ahead',
      body: 'Schedule your pickup time and skip the wait.',
      iconPath: 'M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z',
    },
  ] as const;

  protected readonly productsResource = resource<
    ProductListItem[],
    { dispensaryId: string | null }
  >({
    params: () => ({ dispensaryId: this.dispensary.entityId() }),
    loader: async ({ params }) => {
      if (!params.dispensaryId) return [];
      const result = await firstValueFrom(
        this.productsGQL.fetch({
          variables: { dispensaryId: params.dispensaryId, limit: 8 },
        }),
      );
      return result.data?.products ?? [];
    },
  });

  protected readonly products = computed(() => this.productsResource.value() ?? []);
}
