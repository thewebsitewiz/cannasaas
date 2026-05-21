import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  type CreateProductInput,
  CreateProductGQL,
  DeleteProductGQL,
  ProductsGQL,
  type ProductsQuery,
  type UpdateProductInput,
  UpdateProductGQL,
  type UpdateVariantPriceInput,
  UpdateVariantPriceGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

export type Product = ProductsQuery['products'][number];
export type ProductVariant = Product['variants'][number];

const PRODUCTS_PAGE_LIMIT = 100;

/**
 * Wraps the products query + the four product mutations
 * (create, update, updateVariantPrice, delete) for the admin
 * ProductsPage. Search is client-side over the loaded page since
 * the React parity keeps the dataset small (≤100 per dispensary).
 * Server-side search via `$search` is wired but unused for now;
 * flip on when admins start working at larger catalogs.
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly _search = signal<string>('');
  private readonly _reload = signal<number>(0);
  private readonly _saving = signal<boolean>(false);
  private readonly _savingPrice = signal<boolean>(false);
  private readonly _deleting = signal<boolean>(false);

  readonly search = this._search.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly savingPrice = this._savingPrice.asReadonly();
  readonly deleting = this._deleting.asReadonly();

  setSearch(value: string): void {
    this._search.set(value);
  }

  reload(): void {
    this._reload.update((n) => n + 1);
  }

  async create(input: CreateProductInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(CreateProductGQL);
      await firstValueFrom(gql.mutate({ variables: { input } }));
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  async update(input: UpdateProductInput): Promise<void> {
    this._saving.set(true);
    try {
      const gql = this.injector.get(UpdateProductGQL);
      await firstValueFrom(gql.mutate({ variables: { input } }));
      this.reload();
    } finally {
      this._saving.set(false);
    }
  }

  async updateVariantPrice(input: UpdateVariantPriceInput): Promise<void> {
    this._savingPrice.set(true);
    try {
      const gql = this.injector.get(UpdateVariantPriceGQL);
      await firstValueFrom(gql.mutate({ variables: { input } }));
      this.reload();
    } finally {
      this._savingPrice.set(false);
    }
  }

  async deleteProduct(productId: string, dispensaryId: string): Promise<void> {
    this._deleting.set(true);
    try {
      const gql = this.injector.get(DeleteProductGQL);
      await firstValueFrom(gql.mutate({ variables: { productId, dispensaryId } }));
      this.reload();
    } finally {
      this._deleting.set(false);
    }
  }

  readonly productsResource = rxResource({
    params: () => ({
      dispensaryId: this.auth.user()?.dispensaryId ?? null,
      reload: this._reload(),
    }),
    stream: ({ params }) => {
      if (!params.dispensaryId) {
        throw new Error('No dispensary in scope');
      }
      const gql = this.injector.get(ProductsGQL);
      return gql
        .fetch({
          variables: {
            dispensaryId: params.dispensaryId,
            limit: PRODUCTS_PAGE_LIMIT,
            offset: 0,
          },
        })
        .pipe(map((r): readonly Product[] => r.data?.products ?? []));
    },
  });

  readonly allProducts = computed<readonly Product[]>(() => this.productsResource.value() ?? []);

  readonly filteredProducts = computed<readonly Product[]>(() => {
    const term = this._search().trim().toLowerCase();
    const all = this.allProducts();
    if (!term) return all;
    return all.filter((p) => p.name.toLowerCase().includes(term));
  });

  readonly isLoading = this.productsResource.isLoading;
  readonly error = this.productsResource.error;
}
