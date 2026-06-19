import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CartService, type AddCartItem } from './cart.service';

/**
 * Covers the §3 automation target in `packages/angular/projects/kiosk/TEST-PLAN.md`:
 * "addItem (new + increment), updateQuantity (cap, zero-to-remove),
 *  removeItem, clearCart, itemCount, subtotal computed."
 *
 * Note: §3 also names "localStorage persistence covered by a single
 * round-trip test" — but the kiosk `CartService` doesn't persist (cart
 * is intentionally in-memory so it clears on idle/attract reset between
 * customers, see `clearCart` lifecycle). The TEST-PLAN row for that
 * persistence test is being updated alongside this spec.
 */

const blueDream1g: AddCartItem = {
  productId: 'p-1',
  variantId: 'v-1g',
  name: 'Blue Dream',
  variantName: '1g',
  price: 12,
};
const blueDream3_5g: AddCartItem = {
  productId: 'p-1',
  variantId: 'v-3.5g',
  name: 'Blue Dream',
  variantName: '3.5g',
  price: 35,
};
const sourDiesel1g: AddCartItem = {
  productId: 'p-2',
  variantId: 'v-sd-1g',
  name: 'Sour Diesel',
  variantName: '1g',
  price: 14.5,
};

describe('CartService — items + computed totals', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  describe('addItem', () => {
    it('appends a new variant with quantity 1', () => {
      service.addItem(blueDream1g);
      expect(service.items()).toEqual([{ ...blueDream1g, quantity: 1 }]);
    });

    it('increments quantity when the same variantId is added again', () => {
      service.addItem(blueDream1g);
      service.addItem(blueDream1g);
      service.addItem(blueDream1g);
      expect(service.items()).toHaveLength(1);
      expect(service.items()[0]?.quantity).toBe(3);
    });

    it('keeps distinct variants as separate rows (variantId is the key, not productId)', () => {
      // Both rows are the same product (p-1) but different variants.
      service.addItem(blueDream1g);
      service.addItem(blueDream3_5g);
      expect(service.items()).toHaveLength(2);
      expect(service.items().map((i) => i.variantId)).toEqual(['v-1g', 'v-3.5g']);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      service.addItem(blueDream1g);
      service.addItem(blueDream3_5g);
    });

    it('sets the quantity for a matching variant (no cap — the page enforces stock)', () => {
      service.updateQuantity('v-1g', 7);
      const item = service.items().find((i) => i.variantId === 'v-1g');
      expect(item?.quantity).toBe(7);
    });

    it('removes the line when quantity is set to 0', () => {
      service.updateQuantity('v-1g', 0);
      expect(service.items().map((i) => i.variantId)).toEqual(['v-3.5g']);
    });

    it('removes the line when quantity is set to a negative value', () => {
      service.updateQuantity('v-1g', -5);
      expect(service.items().map((i) => i.variantId)).toEqual(['v-3.5g']);
    });

    it('is a no-op for an unknown variantId (no crash, no insert)', () => {
      service.updateQuantity('v-does-not-exist', 4);
      expect(service.items()).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('drops the matching variant only', () => {
      service.addItem(blueDream1g);
      service.addItem(blueDream3_5g);
      service.removeItem('v-1g');
      expect(service.items().map((i) => i.variantId)).toEqual(['v-3.5g']);
    });

    it('is a no-op for an unknown variantId', () => {
      service.addItem(blueDream1g);
      service.removeItem('v-not-here');
      expect(service.items()).toHaveLength(1);
    });
  });

  describe('clearCart', () => {
    it('empties items even when there are multiple distinct lines', () => {
      service.addItem(blueDream1g);
      service.addItem(blueDream3_5g);
      service.addItem(sourDiesel1g);
      service.clearCart();
      expect(service.items()).toEqual([]);
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('itemCount (computed)', () => {
    it('is 0 on an empty cart', () => {
      expect(service.itemCount()).toBe(0);
    });

    it('sums quantity across all variants (not just row count)', () => {
      service.addItem(blueDream1g);
      service.addItem(blueDream1g); // qty 2
      service.addItem(blueDream3_5g); // qty 1 on a different variant
      service.updateQuantity('v-1g', 5);
      // v-1g qty 5 + v-3.5g qty 1
      expect(service.itemCount()).toBe(6);
    });
  });

  describe('subtotal (computed)', () => {
    it('is 0 on an empty cart', () => {
      expect(service.subtotal()).toBe(0);
    });

    it('sums price × quantity per line', () => {
      service.addItem(blueDream1g); // 12 × 1
      service.addItem(blueDream3_5g); // 35 × 1
      service.updateQuantity('v-1g', 3); // 12 × 3 = 36
      // 36 + 35
      expect(service.subtotal()).toBe(71);
    });

    it('handles decimal pricing without rounding artifacts (single multiply)', () => {
      service.addItem(sourDiesel1g); // 14.5 × 1
      service.updateQuantity('v-sd-1g', 4); // 14.5 × 4 = 58
      expect(service.subtotal()).toBe(58);
    });
  });
});

describe('CartService — customer state', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  it('starts with no checked-in customer', () => {
    expect(service.customer()).toBeNull();
  });

  it('setCustomer stores the matched customer', () => {
    service.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: 'Doe',
      loyaltyPoints: 120,
    });
    expect(service.customer()).toMatchObject({
      customerId: 'c-1',
      firstName: 'Alex',
      loyaltyPoints: 120,
    });
  });

  it('setCustomer(null) clears the customer (walk-in)', () => {
    service.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: 'Doe',
      loyaltyPoints: 120,
    });
    service.setCustomer(null);
    expect(service.customer()).toBeNull();
  });

  it('clearCart resets both items AND customer (idle/attract path)', () => {
    service.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    service.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: null,
      loyaltyPoints: 0,
    });

    service.clearCart();

    expect(service.items()).toEqual([]);
    expect(service.customer()).toBeNull();
  });

  it('customer survives addItem / removeItem / quantity edits', () => {
    service.setCustomer({
      customerId: 'c-1',
      firstName: 'Alex',
      lastName: null,
      loyaltyPoints: 0,
    });
    service.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    service.addItem({
      productId: 'p-1',
      variantId: 'v-1',
      name: 'Blue Dream',
      variantName: '1g',
      price: 12,
    });
    service.updateQuantity('v-1', 5);
    service.removeItem('v-1');

    expect(service.customer()?.customerId).toBe('c-1');
    expect(service.items()).toEqual([]);
  });
});
