import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CartService } from './cart.service';

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
