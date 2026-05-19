import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';

import { CartService } from '../cart/cart.service';
import { CartStockGuardianService } from './cart-stock-guardian.service';
import { StockUpdate, StockUpdatesService } from './stock-updates.service';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

function dispensaryStub(): DispensaryContextService {
  // CartService now injects DispensaryContextService (sc-605).
  // We just need entityId() to return a stable id so per-tenant
  // persistence works in tests.
  return {
    entityId: signal('test-disp').asReadonly(),
  } as unknown as DispensaryContextService;
}

type LiveMap = ReadonlyMap<string, StockUpdate>;

function makeStockUpdatesStub(): {
  service: StockUpdatesService;
  setMap: (m: LiveMap) => void;
} {
  const inner = signal<LiveMap>(new Map());
  const stub = {
    updates: inner.asReadonly(),
    entryFor: (id: string) => signal(inner().get(id) ?? null).asReadonly(),
  } as unknown as StockUpdatesService;
  return { service: stub, setMap: (m) => inner.set(m) };
}

function buildLive(
  entries: Array<Pick<StockUpdate, 'variantId' | 'status' | 'available'>>,
): LiveMap {
  const map = new Map<string, StockUpdate>();
  for (const e of entries) {
    map.set(e.variantId, {
      variantId: e.variantId,
      available: e.available,
      status: e.status,
      timestamp: '2026-05-19T00:00:00.000Z',
    });
  }
  return map;
}

describe('CartStockGuardianService', () => {
  it('removes cart items whose variant goes out_of_stock and records evictions', () => {
    const { service: stockStub, setMap } = makeStockUpdatesStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: DispensaryContextService, useFactory: dispensaryStub },
        CartService,
        { provide: StockUpdatesService, useValue: stockStub },
        CartStockGuardianService,
      ],
    });

    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.addItem({
      productId: 'p-1',
      variantId: 'v-keep',
      name: 'Keep',
      variantName: '3.5g',
      price: 30,
    });
    cart.addItem({
      productId: 'p-2',
      variantId: 'v-evict',
      name: 'Evict',
      variantName: '1g',
      price: 12,
    });

    const guardian = TestBed.inject(CartStockGuardianService);
    expect(guardian.evictions()).toEqual([]);

    setMap(buildLive([{ variantId: 'v-evict', status: 'out_of_stock', available: 0 }]));
    TestBed.tick();

    expect(cart.items().map((i) => i.variantId)).toEqual(['v-keep']);
    expect(guardian.evictions().map((e) => e.variantId)).toEqual(['v-evict']);
    expect(guardian.evictions()[0].name).toBe('Evict');
  });

  it('ignores low_stock — only out_of_stock prunes the cart', () => {
    const { service: stockStub, setMap } = makeStockUpdatesStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: DispensaryContextService, useFactory: dispensaryStub },
        CartService,
        { provide: StockUpdatesService, useValue: stockStub },
        CartStockGuardianService,
      ],
    });

    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Keep',
      variantName: '3.5g',
      price: 30,
    });

    const guardian = TestBed.inject(CartStockGuardianService);
    setMap(buildLive([{ variantId: 'v-1', status: 'low_stock', available: 2 }]));
    TestBed.tick();

    expect(cart.items().map((i) => i.variantId)).toEqual(['v-1']);
    expect(guardian.evictions()).toEqual([]);
  });

  it('dismiss(variantId) removes a single eviction from the queue', () => {
    const { service: stockStub, setMap } = makeStockUpdatesStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: DispensaryContextService, useFactory: dispensaryStub },
        CartService,
        { provide: StockUpdatesService, useValue: stockStub },
        CartStockGuardianService,
      ],
    });

    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'A',
      variantName: '1g',
      price: 10,
    });
    cart.addItem({
      productId: 'p-2',
      variantId: 'v-2',
      name: 'B',
      variantName: '1g',
      price: 10,
    });

    const guardian = TestBed.inject(CartStockGuardianService);
    setMap(
      buildLive([
        { variantId: 'v-1', status: 'out_of_stock', available: 0 },
        { variantId: 'v-2', status: 'out_of_stock', available: 0 },
      ]),
    );
    TestBed.tick();

    expect(
      guardian
        .evictions()
        .map((e) => e.variantId)
        .sort(),
    ).toEqual(['v-1', 'v-2']);
    guardian.dismiss('v-1');
    expect(guardian.evictions().map((e) => e.variantId)).toEqual(['v-2']);
  });
});
