import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProductsGQL } from '@cannasaas/ui-ng';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';
import { MenuPage } from './menu-page';

/**
 * Covers the §3 "Automated coverage target" row for `MenuPage` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Filter signal updates query variables, empty/loading/error
 *    branches. Mock ProductsGQL."
 *
 * Tests target the protected class methods + signals directly via
 * `TestBed.createComponent` (no DOM assertions). `rxResource` reacts
 * to the `filter` signal — we wait one microtask after a filter
 * change for the new fetch call to land.
 */

interface ProductsGQLMock {
  fetch: ReturnType<typeof vi.fn>;
}

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn>;
}

interface MenuPageExposed {
  filters: ReadonlyArray<{ label: string; productTypeId: number | null }>;
  filter: {
    set: (f: { label: string; productTypeId: number | null }) => void;
    (): { label: string; productTypeId: number | null };
  };
  loading: () => boolean;
  error: () => Error | null;
  filtered: () => readonly unknown[];
  addedId: () => string | null;
  reload: () => void;
  goToProduct: (id: string) => void;
  onAddClick: (e: Event, p: unknown) => void;
  priceOf: (p: unknown) => number;
  isInStock: (p: unknown) => boolean;
  addControlClasses: (inStock: boolean, isAdded: boolean) => string;
}

function makeProduct(
  overrides: Partial<{
    id: string;
    name: string;
    strainType: string | null;
    thcPercent: number | null;
    strainName: string | null;
    effects: unknown;
    variants: Array<{
      variantId: string;
      name: string;
      retailPrice: number | null;
      stockQuantity: number | null;
      stockStatus?: string;
      isActive?: boolean;
    }>;
  }> = {},
): unknown {
  return {
    id: overrides.id ?? 'p-1',
    name: overrides.name ?? 'Blue Dream',
    strainType: overrides.strainType ?? 'hybrid',
    strainName: overrides.strainName ?? null,
    thcPercent: overrides.thcPercent ?? 22,
    effects: overrides.effects ?? null,
    variants: overrides.variants ?? [
      {
        variantId: 'v-1',
        name: '1g',
        retailPrice: 12,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        isActive: true,
      },
    ],
  };
}

function makeComponent(productsGQL: ProductsGQLMock, router: RouterMock) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ProductsGQL, useValue: productsGQL },
      { provide: Router, useValue: router },
    ],
  });
  const fixture = TestBed.createComponent(MenuPage);
  // detectChanges() puts the resource() into the change-detection
  // graph so its reactive `params: () => …` effect runs and the
  // stream fires its first fetch. Without this, rxResource stays
  // lazy and `productsGQL.fetch` is never invoked.
  fixture.detectChanges();
  return {
    cmp: fixture.componentInstance as unknown as MenuPageExposed,
    fixture,
    cart: TestBed.inject(CartService),
  };
}

function tick(fixture: { detectChanges: () => void }): void {
  fixture.detectChanges();
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MenuPage — filter signal updates query variables', () => {
  it('initial fetch sends productTypeId: null for the All filter', async () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    makeComponent(productsGQL, router);

    // rxResource runs the initial fetch synchronously in setup; await
    // a microtask to flush any pending observables.
    await Promise.resolve();

    expect(productsGQL.fetch).toHaveBeenCalledTimes(1);
    expect(productsGQL.fetch).toHaveBeenCalledWith({
      variables: {
        dispensaryId: environment.dispensaryId,
        productTypeId: null,
      },
    });
  });

  it('changing the filter triggers a new fetch with the matching productTypeId', async () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, fixture } = makeComponent(productsGQL, router);
    await Promise.resolve();
    expect(productsGQL.fetch).toHaveBeenCalledTimes(1);

    cmp.filter.set({ label: 'Vape', productTypeId: 3 });
    tick(fixture); // flush rxResource's reactive params effect
    await Promise.resolve();

    expect(productsGQL.fetch).toHaveBeenCalledTimes(2);
    expect(productsGQL.fetch).toHaveBeenLastCalledWith({
      variables: {
        dispensaryId: environment.dispensaryId,
        productTypeId: 3,
      },
    });
  });
});

describe('MenuPage — loading / empty / error / data branches', () => {
  it('loading() is true while the fetch observable has not emitted', () => {
    // Use a Subject that never emits → loading stays true.
    const pending = new Subject<{ data: { products: unknown[] } }>();
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(pending.asObservable()),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    expect(cmp.loading()).toBe(true);
    expect(cmp.filtered()).toEqual([]);
  });

  it('filtered() is empty when the fetch returns []', async () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);
    await Promise.resolve();

    expect(cmp.loading()).toBe(false);
    expect(cmp.filtered()).toEqual([]);
  });

  it('filtered() returns the products array on a successful fetch', async () => {
    const products = [makeProduct({ id: 'p-1' }), makeProduct({ id: 'p-2' })];
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);
    await Promise.resolve();

    expect(cmp.filtered()).toHaveLength(2);
    expect(cmp.filtered().map((p) => (p as { id: string }).id)).toEqual(['p-1', 'p-2']);
  });

  it('error branch: loading flips false, error() is set, filtered() is empty (sc-733 fix)', async () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(throwError(() => new Error('API down'))),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);
    await Promise.resolve();

    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBeInstanceOf(Error);
    expect(cmp.error()?.message).toBe('API down');
    // filtered() no longer throws — graceful empty so the template
    // can render the error branch without re-entering an error throw.
    expect(() => cmp.filtered()).not.toThrow();
    expect(cmp.filtered()).toEqual([]);
  });

  it('error branch: non-Error throws still surface as Error via rxResource wrapping', async () => {
    // rxResource itself wraps non-Error throws so error() always
    // returns a real Error instance. We don't re-wrap.
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(throwError(() => 'boom')),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);
    await Promise.resolve();

    expect(cmp.error()).toBeInstanceOf(Error);
    expect((cmp.error() as Error & { cause?: unknown }).cause).toBe('boom');
  });

  it('reload(): re-invokes the fetch and clears error on success', async () => {
    const fetch = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('API down')))
      .mockReturnValueOnce(of({ data: { products: [makeProduct({ id: 'p-1' })] } }));
    const productsGQL: ProductsGQLMock = { fetch };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, fixture } = makeComponent(productsGQL, router);
    await Promise.resolve();

    expect(cmp.error()).toBeInstanceOf(Error);
    expect(cmp.filtered()).toEqual([]);

    cmp.reload();
    tick(fixture); // flush the reload-triggered effect
    await Promise.resolve();

    expect(cmp.error()).toBeNull();
    expect(cmp.filtered()).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('MenuPage — goToProduct nav', () => {
  it('navigates to /product/:id', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    cmp.goToProduct('abc-123');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/product/abc-123');
  });
});

describe('MenuPage — onAddClick (add-to-cart + flash)', () => {
  it('adds the first variant to the cart with name, price, variant name, strainType', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(productsGQL, router);
    const product = makeProduct({
      id: 'p-99',
      name: 'Sour Diesel',
      strainType: 'sativa',
      variants: [
        {
          variantId: 'v-99',
          name: '3.5g',
          retailPrice: 40,
          stockQuantity: 5,
          isActive: true,
        },
      ],
    });

    const stop = vi.fn();
    cmp.onAddClick({ stopPropagation: stop } as unknown as Event, product);

    expect(stop).toHaveBeenCalledOnce();
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0]).toMatchObject({
      productId: 'p-99',
      variantId: 'v-99',
      name: 'Sour Diesel',
      variantName: '3.5g',
      price: 40,
      strainType: 'sativa',
      quantity: 1,
    });
  });

  it('flashes addedId for ADDED_FLASH_MS (1500ms) then clears', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);
    const product = makeProduct({ id: 'p-flash' });

    cmp.onAddClick({ stopPropagation: vi.fn() } as unknown as Event, product);
    expect(cmp.addedId()).toBe('p-flash');

    vi.advanceTimersByTime(1499);
    expect(cmp.addedId()).toBe('p-flash');

    vi.advanceTimersByTime(1);
    expect(cmp.addedId()).toBeNull();
  });

  it('a second add of a DIFFERENT product takes over the flash — the prior timer does not clear it', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    cmp.onAddClick({ stopPropagation: vi.fn() } as unknown as Event, makeProduct({ id: 'p-1' }));
    vi.advanceTimersByTime(800);
    cmp.onAddClick({ stopPropagation: vi.fn() } as unknown as Event, makeProduct({ id: 'p-2' }));
    expect(cmp.addedId()).toBe('p-2');

    // The first timer fires at 1500ms total. It sees addedId === 'p-2'
    // (not 'p-1'), so it does NOT clear.
    vi.advanceTimersByTime(700); // total 1500ms from first add
    expect(cmp.addedId()).toBe('p-2');

    // The second timer fires at 800ms + 1500ms = 2300ms total → clears.
    vi.advanceTimersByTime(800);
    expect(cmp.addedId()).toBeNull();
  });

  it('is a no-op when the product has no variants', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(productsGQL, router);

    cmp.onAddClick({ stopPropagation: vi.fn() } as unknown as Event, makeProduct({ variants: [] }));

    expect(cart.items()).toEqual([]);
    expect(cmp.addedId()).toBeNull();
  });
});

describe('MenuPage — helpers', () => {
  it('priceOf returns the first variant retailPrice (0 fallback)', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    expect(cmp.priceOf(makeProduct())).toBe(12);
    expect(cmp.priceOf(makeProduct({ variants: [] }))).toBe(0);
  });

  it('isInStock: true when first variant has stockQuantity > 0 and isActive', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    expect(cmp.isInStock(makeProduct())).toBe(true);
    expect(
      cmp.isInStock(
        makeProduct({
          variants: [
            {
              variantId: 'v-0',
              name: 'gone',
              retailPrice: 5,
              stockQuantity: 0,
              isActive: true,
            },
          ],
        }),
      ),
    ).toBe(false);
    expect(
      cmp.isInStock(
        makeProduct({
          variants: [
            {
              variantId: 'v-inactive',
              name: 'off',
              retailPrice: 5,
              stockQuantity: 5,
              isActive: false,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('isInStock: null stockQuantity falls back to stockStatus !== out_of_stock', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    expect(
      cmp.isInStock(
        makeProduct({
          variants: [
            {
              variantId: 'v',
              name: 'n',
              retailPrice: 5,
              stockQuantity: null,
              stockStatus: 'low_stock',
              isActive: true,
            },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      cmp.isInStock(
        makeProduct({
          variants: [
            {
              variantId: 'v',
              name: 'n',
              retailPrice: 5,
              stockQuantity: null,
              stockStatus: 'out_of_stock',
              isActive: true,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('addControlClasses: sold-out / added / default produce distinct strings', () => {
    const productsGQL: ProductsGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { products: [] } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(productsGQL, router);

    const soldOut = cmp.addControlClasses(false, false);
    const added = cmp.addControlClasses(true, true);
    const def = cmp.addControlClasses(true, false);

    expect(soldOut).toContain('cursor-not-allowed');
    expect(soldOut).toContain('bg-gray-200');
    expect(added).toContain('bg-emerald-100');
    expect(def).toContain('bg-emerald-600');
  });
});
