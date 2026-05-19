import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { CartService } from './cart.service';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

function makeDispensaryStub(initialId: string | null): {
  service: DispensaryContextService;
  setId: (id: string | null) => void;
} {
  const id = signal<string | null>(initialId);
  return {
    service: { entityId: id.asReadonly() } as unknown as DispensaryContextService,
    setId: (next) => id.set(next),
  };
}

function configure(initialId: string | null): {
  service: CartService;
  setId: (id: string | null) => void;
} {
  const stub = makeDispensaryStub(initialId);
  TestBed.configureTestingModule({
    providers: [
      CartService,
      { provide: DispensaryContextService, useValue: stub.service },
    ],
  });
  return { service: TestBed.inject(CartService), setId: stub.setId };
}

describe('CartService — per-tenant isolation (sc-605)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('starts empty when no tenant is resolved yet', () => {
    const { service } = configure(null);
    expect(service.items()).toEqual([]);
  });

  it('does not persist while tenant is null', () => {
    const { service } = configure(null);
    service.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    expect(localStorage.length).toBe(0);
  });

  it('writes to the dispensary-scoped key once tenant resolves', () => {
    const { service, setId } = configure(null);
    setId('disp-a');
    TestBed.tick();
    service.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    expect(localStorage.getItem('cs.storefront.cart:disp-a')).not.toBeNull();
    expect(localStorage.getItem('cs.storefront.cart:disp-b')).toBeNull();
  });

  it('swaps active cart when tenant changes', () => {
    const { service, setId } = configure('disp-a');
    TestBed.tick();
    service.addItem({
      productId: 'p-a',
      variantId: 'v-a',
      name: 'A',
      variantName: '1g',
      price: 12,
    });
    expect(service.items().length).toBe(1);

    setId('disp-b');
    TestBed.tick();
    expect(service.items()).toEqual([]);

    service.addItem({
      productId: 'p-b',
      variantId: 'v-b',
      name: 'B',
      variantName: '1g',
      price: 30,
    });
    expect(service.items().length).toBe(1);

    setId('disp-a');
    TestBed.tick();
    expect(service.items().map((i) => i.variantId)).toEqual(['v-a']);
  });

  it('clears the legacy cs.storefront.cart key on first run', () => {
    localStorage.setItem(
      'cs.storefront.cart',
      JSON.stringify([{ productId: 'old', variantId: 'old' }]),
    );
    configure(null);
    expect(localStorage.getItem('cs.storefront.cart')).toBeNull();
  });

  it('clear() empties the current tenant cart only', () => {
    const { service, setId } = configure('disp-a');
    TestBed.tick();
    service.addItem({
      productId: 'p-a',
      variantId: 'v-a',
      name: 'A',
      variantName: '1g',
      price: 12,
    });
    setId('disp-b');
    TestBed.tick();
    service.addItem({
      productId: 'p-b',
      variantId: 'v-b',
      name: 'B',
      variantName: '1g',
      price: 30,
    });

    service.clear();
    expect(service.items()).toEqual([]);
    setId('disp-a');
    TestBed.tick();
    expect(service.items().map((i) => i.variantId)).toEqual(['v-a']);
  });
});
