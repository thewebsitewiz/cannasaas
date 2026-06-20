import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ProductGQL } from '@cannasaas/ui-ng';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject, of, throwError } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';
import { ProductPage } from './product-page';

/**
 * Covers the §3 "Automated coverage target" row for `ProductPage` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Variant selection resets quantity, quantity caps to stock,
 *    add-to-cart loops N times, 'Sold Out' disables button.
 *    Mock ProductGQL."
 *
 * Note: ProductPage has the SAME rxResource error gap as MenuPage —
 * `product = computed(() => resource.value() ?? null)` only coalesces
 * undefined, not error. Filed as sc-733; the error-branch test below
 * asserts current behavior (throw) and points to that ticket.
 */

interface ProductGQLMock {
  fetch: ReturnType<typeof vi.fn>;
}

interface RouterMock {
  navigateByUrl: ReturnType<typeof vi.fn>;
}

interface Variant {
  variantId: string;
  name: string;
  retailPrice: number | null;
  stockQuantity: number | null;
  stockStatus?: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  strainType?: string | null;
  strainName?: string | null;
  thcPercent?: number | null;
  cbdPercent?: number | null;
  description?: string | null;
  effects?: unknown;
  flavors?: unknown;
  variants: Variant[];
}

interface ProductPageExposed {
  loading: () => boolean;
  error: () => Error | null;
  product: () => Product | null;
  activeVariant: () => Variant | undefined;
  quantity: { set: (n: number) => void; (): number };
  added: { set: (v: boolean) => void; (): boolean };
  reload: () => void;
  priceFor: (v: Variant | undefined) => number;
  effectsOf: (p: Product) => string[];
  flavorsOf: (p: Product) => string[];
  strainStyleFor: (v: string | null | undefined) => unknown;
  orbStyle: (name: string) => { size: number; top: number; left: number };
  selectVariant: (variantId: string) => void;
  isVariantInStock: (v: Variant) => boolean;
  stockFor: (v: Variant | undefined) => number;
  inc: () => void;
  dec: () => void;
  add: () => void;
}

function makeVariant(overrides: Partial<Variant> = {}): Variant {
  // Use key-presence checks so explicit `null` overrides aren't
  // silently replaced by the default (which `??` would do).
  return {
    variantId: 'variantId' in overrides ? (overrides.variantId as string) : 'v-1',
    name: 'name' in overrides ? (overrides.name as string) : '1g',
    retailPrice: 'retailPrice' in overrides ? (overrides.retailPrice as number | null) : 12,
    stockQuantity: 'stockQuantity' in overrides ? (overrides.stockQuantity as number | null) : 5,
    stockStatus: 'stockStatus' in overrides ? overrides.stockStatus : 'in_stock',
    isActive: 'isActive' in overrides ? overrides.isActive : true,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? 'p-1',
    name: overrides.name ?? 'Blue Dream',
    strainType: overrides.strainType ?? 'hybrid',
    strainName: overrides.strainName ?? null,
    thcPercent: overrides.thcPercent ?? 22,
    cbdPercent: overrides.cbdPercent ?? null,
    description: overrides.description ?? null,
    effects: overrides.effects ?? null,
    flavors: overrides.flavors ?? null,
    variants: overrides.variants ?? [makeVariant()],
  };
}

function makeComponent(routeId: string | null, productGQL: ProductGQLMock, router: RouterMock) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ProductGQL, useValue: productGQL },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap(routeId !== null ? { id: routeId } : {})),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ProductPage);
  // detectChanges() wires rxResource's reactive params effect so the
  // fetch fires + product() resolves. Same trick used in the MenuPage
  // spec — without this the resource stays lazy.
  fixture.detectChanges();
  return {
    cmp: fixture.componentInstance as unknown as ProductPageExposed,
    fixture,
    cart: TestBed.inject(CartService),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ProductPage — product resolution', () => {
  it('fetches with route :id + environment.dispensaryId', async () => {
    const product = makeProduct();
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    expect(productGQL.fetch).toHaveBeenCalledTimes(1);
    expect(productGQL.fetch).toHaveBeenCalledWith({
      variables: { dispensaryId: environment.dispensaryId, id: 'p-1' },
    });
  });

  it('does NOT fetch when route has no :id (stream emits of(null))', async () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(null, productGQL, router);
    await Promise.resolve();

    expect(productGQL.fetch).not.toHaveBeenCalled();
    expect(cmp.product()).toBeNull();
  });

  it('loading() is true while the fetch observable has not emitted', () => {
    const pending = new Subject<{ data: { product: Product | null } }>();
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(pending.asObservable()),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);

    expect(cmp.loading()).toBe(true);
    expect(cmp.product()).toBeNull();
  });

  it('product() is null when fetch returns { data: { product: null } } (not found)', async () => {
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product: null } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-missing', productGQL, router);
    await Promise.resolve();

    expect(cmp.loading()).toBe(false);
    expect(cmp.product()).toBeNull();
  });

  it('error branch: loading flips false, error() is set, product() is null (sc-733 fix)', async () => {
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(throwError(() => new Error('API down'))),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBeInstanceOf(Error);
    expect(cmp.error()?.message).toBe('API down');
    // product() no longer throws — graceful null so the template can
    // render the error branch without re-entering an error throw.
    expect(() => cmp.product()).not.toThrow();
    expect(cmp.product()).toBeNull();
  });

  it('error branch: non-Error throws still surface as Error via rxResource wrapping', async () => {
    // rxResource itself wraps non-Error throws so error() always
    // returns a real Error instance. We don't re-wrap.
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(throwError(() => 'boom')),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    expect(cmp.error()).toBeInstanceOf(Error);
    expect((cmp.error() as Error & { cause?: unknown }).cause).toBe('boom');
  });

  it('reload(): re-invokes the fetch and clears error on success', async () => {
    const product = makeProduct({ id: 'p-1' });
    const fetch = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('API down')))
      .mockReturnValueOnce(of({ data: { product } }));
    const productGQL: ProductGQLMock = { fetch };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, fixture } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    expect(cmp.error()).toBeInstanceOf(Error);
    expect(cmp.product()).toBeNull();

    cmp.reload();
    fixture.detectChanges();
    await Promise.resolve();

    expect(cmp.error()).toBeNull();
    expect(cmp.product()?.id).toBe('p-1');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('ProductPage — activeVariant', () => {
  it('defaults to variants[0] when no selection has been made', async () => {
    const product = makeProduct({
      variants: [
        makeVariant({ variantId: 'v-1g', name: '1g' }),
        makeVariant({ variantId: 'v-3.5g', name: '3.5g' }),
      ],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    expect(cmp.activeVariant()?.variantId).toBe('v-1g');
  });

  it('honors selectVariant() and updates activeVariant', async () => {
    const product = makeProduct({
      variants: [
        makeVariant({ variantId: 'v-1g', name: '1g' }),
        makeVariant({ variantId: 'v-3.5g', name: '3.5g' }),
      ],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.selectVariant('v-3.5g');

    expect(cmp.activeVariant()?.variantId).toBe('v-3.5g');
  });

  it('falls back to variants[0] when the selected id is no longer in the list', async () => {
    const product = makeProduct({
      variants: [makeVariant({ variantId: 'v-only' })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.selectVariant('v-doesnt-exist');
    // selectVariant filters by inStock; doesn't-exist isn't in the
    // list so the early return leaves selectedVariantId unchanged.
    expect(cmp.activeVariant()?.variantId).toBe('v-only');
  });
});

describe('ProductPage — selectVariant', () => {
  it('resets the quantity to 1 on variant change', async () => {
    const product = makeProduct({
      variants: [
        makeVariant({ variantId: 'v-1g', stockQuantity: 10 }),
        makeVariant({ variantId: 'v-3.5g', stockQuantity: 10 }),
      ],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.quantity.set(5);
    cmp.selectVariant('v-3.5g');

    expect(cmp.quantity()).toBe(1);
  });

  it('is a no-op when the target variant is sold out', async () => {
    const product = makeProduct({
      variants: [
        makeVariant({ variantId: 'v-1g', stockQuantity: 10 }),
        makeVariant({ variantId: 'v-out', stockQuantity: 0 }),
      ],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.quantity.set(3);
    cmp.selectVariant('v-out');

    expect(cmp.activeVariant()?.variantId).toBe('v-1g');
    expect(cmp.quantity()).toBe(3); // untouched
  });
});

describe('ProductPage — quantity caps to stock (inc / dec)', () => {
  it('inc() increments up to stockQuantity then stops', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 3 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.inc();
    cmp.inc();
    expect(cmp.quantity()).toBe(3);
    cmp.inc(); // capped
    cmp.inc(); // still capped
    expect(cmp.quantity()).toBe(3);
  });

  it('dec() floors at 1, never below', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 10 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.dec();
    cmp.dec();
    cmp.dec();
    expect(cmp.quantity()).toBe(1);
  });

  it('inc() caps at 0 when stockQuantity is null (no Math.min lower bound)', async () => {
    // variantStockQty returns 0 for null stockQuantity → Math.min(0,
    // 1+1) → quantity stays at 0. The template's inStock check
    // (driven by variantInStock's stockStatus fallback) gates the
    // button so this matters only as a defensive guard.
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: null, stockStatus: 'low_stock' })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.inc();
    expect(cmp.quantity()).toBe(0);
  });
});

describe('ProductPage — add (loops N times into cart)', () => {
  it('adds one cart line per quantity unit (loop semantics)', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 10 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.quantity.set(3);
    cmp.add();

    // CartService.addItem increments quantity for the same variantId
    // → 3 calls collapse to one line with qty 3.
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0]?.quantity).toBe(3);
    expect(cart.items()[0]).toMatchObject({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
      strainType: 'hybrid',
    });
  });

  it('caps the loop at stockQuantity (defensive — quantity should already be capped)', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 2 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.quantity.set(99); // simulate stale signal value past stock
    cmp.add();

    expect(cart.items()[0]?.quantity).toBe(2);
  });

  it('flashes added → resets + navigates to / after 1500ms', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 5 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.add();
    expect(cmp.added()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1499);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cmp.added()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('is a no-op when no product is resolved', () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent(null, productGQL, router);

    cmp.add();

    expect(cart.items()).toEqual([]);
    expect(cmp.added()).toBe(false);
  });

  it('is a no-op when the active variant is sold out (Sold Out button disabled equivalent)', async () => {
    const product = makeProduct({
      variants: [makeVariant({ stockQuantity: 0 })],
    });
    const productGQL: ProductGQLMock = {
      fetch: vi.fn().mockReturnValue(of({ data: { product } })),
    };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp, cart } = makeComponent('p-1', productGQL, router);
    await Promise.resolve();

    cmp.add();

    expect(cart.items()).toEqual([]);
    expect(cmp.added()).toBe(false);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('ProductPage — helpers', () => {
  it('priceFor returns retailPrice (0 fallback)', () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(null, productGQL, router);

    expect(cmp.priceFor(makeVariant({ retailPrice: 25 }))).toBe(25);
    expect(cmp.priceFor(undefined)).toBe(0);
    expect(cmp.priceFor(makeVariant({ retailPrice: null }))).toBe(0);
  });

  it('isVariantInStock: stockQuantity > 0 + isActive', () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(null, productGQL, router);

    expect(cmp.isVariantInStock(makeVariant({ stockQuantity: 5 }))).toBe(true);
    expect(cmp.isVariantInStock(makeVariant({ stockQuantity: 0 }))).toBe(false);
    expect(cmp.isVariantInStock(makeVariant({ stockQuantity: 5, isActive: false }))).toBe(false);
  });

  it('stockFor floors / clamps to 0 for null', () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(null, productGQL, router);

    expect(cmp.stockFor(makeVariant({ stockQuantity: 7 }))).toBe(7);
    expect(cmp.stockFor(makeVariant({ stockQuantity: 3.9 }))).toBe(3);
    expect(cmp.stockFor(makeVariant({ stockQuantity: null }))).toBe(0);
    expect(cmp.stockFor(undefined)).toBe(0);
  });

  it('effectsOf / flavorsOf coerce array-shaped jsonb to string[]', () => {
    const productGQL: ProductGQLMock = { fetch: vi.fn() };
    const router: RouterMock = { navigateByUrl: vi.fn() };
    const { cmp } = makeComponent(null, productGQL, router);

    expect(cmp.effectsOf(makeProduct({ effects: ['relaxed', 'happy'] }))).toEqual([
      'relaxed',
      'happy',
    ]);
    expect(cmp.flavorsOf(makeProduct({ flavors: null }))).toEqual([]);
  });
});
