/**
 * @file src/stores/__tests__/cartStore.test.ts
 * @description Unit tests for the Zustand cart store.
 *
 * The cart store is the most business-critical piece of client-side state:
 * it drives the checkout flow, enforces purchase-limit warnings, and must
 * remain consistent across add / remove / update operations.
 *
 * Test strategy — what we're testing:
 *   ✅ Initial state is empty and well-formed
 *   ✅ addItem creates a new line item
 *   ✅ addItem increments quantity when the same variant is added again
 *   ✅ removeItem deletes a line item and recalculates totals
 *   ✅ updateQuantity changes item count; removing to 0 deletes the item
 *   ✅ clearCart resets state to initial values
 *   ✅ Derived totals (subtotal, tax, total) are calculated correctly
 *   ✅ itemCount (badge number) reflects the sum of all quantities
 *   ✅ Store resets between tests (no state bleed)
 *
 * Testing approach:
 *   Zustand stores are plain JS objects with functions — we call the actions
 *   directly and assert on the resulting state. No React rendering needed.
 *   This makes these tests extremely fast (< 5ms each).
 *
 * @see src/stores/cartStore.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Minimal product variant fixture for testing */
const VARIANT_BLUE_DREAM = {
  id: 'var-001',
  productId: 'prod-001',
  productName: 'Blue Dream',
  variantName: '1/8 oz',
  price: 45.0,
  weight: 3.5,
  weightUnit: 'g' as const,
  category: 'flower' as const,
  imageUrl: 'https://cdn.cannasaas.com/products/blue-dream.jpg',
};

const VARIANT_OG_KUSH = {
  id: 'var-003',
  productId: 'prod-002',
  productName: 'OG Kush Live Resin',
  variantName: '1g',
  price: 55.0,
  weight: 1.0,
  weightUnit: 'g' as const,
  category: 'concentrate' as const,
  imageUrl: 'https://cdn.cannasaas.com/products/og-kush-resin.jpg',
};

/**
 * New York state tax rate for recreational cannabis: 13% excise + 4% sales =
 * 17%. Using NY as the test dispensary state to match fixtures in handlers.ts.
 */
const NY_TAX_RATE = 0.17;

// ---------------------------------------------------------------------------
// Helper: get store state without subscribing to React
// ---------------------------------------------------------------------------

/**
 * Reads the current Zustand store state in a non-React (plain JS) context.
 * Zustand stores expose getState() on the store's internal API, but since
 * we're testing the hook we call useCartStore.getState() directly.
 *
 * This avoids rendering a React component just to access store state.
 */
const getState = () => useCartStore.getState();

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('cartStore', () => {
  /**
   * Reset the store before each test to ensure complete isolation.
   * Zustand stores are singletons — without a reset, state from one test
   * would leak into the next.
   */
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      promoCode: null,
      promoDiscount: 0,
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('should have an empty items array', () => {
      expect(getState().items).toEqual([]);
    });

    it('should have zero subtotal', () => {
      expect(getState().subtotal).toBe(0);
    });

    it('should have zero item count', () => {
      expect(getState().itemCount).toBe(0);
    });

    it('should have no promo code applied', () => {
      expect(getState().promoCode).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // addItem
  // -------------------------------------------------------------------------

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);

      const { items } = getState();
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe('var-001');
      expect(items[0].quantity).toBe(1);
    });

    it('should set the correct price on the new item', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);

      expect(getState().items[0].unitPrice).toBe(45.0);
    });

    it('should increment quantity when the same variant is added again', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().addItem(VARIANT_BLUE_DREAM, 1);

      const { items } = getState();
      // Should still be one line item, not two
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should add a quantity of 2 in a single addItem call', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2);

      expect(getState().items[0].quantity).toBe(2);
    });

    it('should support multiple different products in the cart', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().addItem(VARIANT_OG_KUSH, 1);

      expect(getState().items).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // removeItem
  // -------------------------------------------------------------------------

  describe('removeItem', () => {
    it('should remove an item from the cart by variant ID', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().removeItem('var-001');

      expect(getState().items).toHaveLength(0);
    });

    it('should not affect other items when removing one', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().addItem(VARIANT_OG_KUSH, 1);
      getState().removeItem('var-001');

      const { items } = getState();
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe('var-003');
    });

    it('should be a no-op when removing a non-existent variant ID', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().removeItem('does-not-exist');

      // Cart should be unchanged
      expect(getState().items).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // updateQuantity
  // -------------------------------------------------------------------------

  describe('updateQuantity', () => {
    it('should update the quantity of an existing item', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().updateQuantity('var-001', 3);

      expect(getState().items[0].quantity).toBe(3);
    });

    it('should remove the item when quantity is set to 0', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().updateQuantity('var-001', 0);

      expect(getState().items).toHaveLength(0);
    });

    it('should remove the item when quantity is negative', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2);
      getState().updateQuantity('var-001', -1);

      expect(getState().items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // clearCart
  // -------------------------------------------------------------------------

  describe('clearCart', () => {
    it('should remove all items', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2);
      getState().addItem(VARIANT_OG_KUSH, 1);
      getState().clearCart();

      expect(getState().items).toHaveLength(0);
    });

    it('should reset subtotal, tax, and total to 0', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().clearCart();

      expect(getState().subtotal).toBe(0);
      expect(getState().tax).toBe(0);
      expect(getState().total).toBe(0);
    });

    it('should clear any applied promo code', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().applyPromo('SAVE10', 10.0);
      getState().clearCart();

      expect(getState().promoCode).toBeNull();
      expect(getState().promoDiscount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Derived calculations (subtotal, tax, total, itemCount)
  // -------------------------------------------------------------------------

  describe('derived calculations', () => {
    it('should calculate subtotal correctly for a single item', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2);
      // 2 × $45.00 = $90.00
      expect(getState().subtotal).toBe(90.0);
    });

    it('should calculate subtotal correctly for multiple items', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);  // $45.00
      getState().addItem(VARIANT_OG_KUSH, 2);     // $110.00
      // Total subtotal: $155.00
      expect(getState().subtotal).toBe(155.0);
    });

    it('should apply NY cannabis tax (17%) to the subtotal', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1); // $45.00
      // Tax = $45.00 × 0.17 = $7.65
      expect(getState().tax).toBeCloseTo(7.65, 2);
    });

    it('should calculate total as subtotal + tax - promoDiscount', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1); // $45.00
      // subtotal: $45.00, tax: $7.65, total: $52.65
      expect(getState().total).toBeCloseTo(52.65, 2);
    });

    it('should deduct promo discount from the total', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1); // $45.00
      getState().applyPromo('SAVE10', 10.0);
      // total = $45.00 + $7.65 tax - $10.00 promo = $42.65
      expect(getState().total).toBeCloseTo(42.65, 2);
    });

    it('should calculate itemCount as the sum of all quantities', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2);
      getState().addItem(VARIANT_OG_KUSH, 3);
      // 2 + 3 = 5
      expect(getState().itemCount).toBe(5);
    });

    it('should update totals after removing an item', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 2); // $90.00
      getState().addItem(VARIANT_OG_KUSH, 1);   // $55.00
      getState().removeItem('var-003');

      expect(getState().subtotal).toBe(90.0);
    });
  });

  // -------------------------------------------------------------------------
  // applyPromo / removePromo
  // -------------------------------------------------------------------------

  describe('promo codes', () => {
    it('should store the applied promo code and discount amount', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1);
      getState().applyPromo('WELCOME20', 20.0);

      expect(getState().promoCode).toBe('WELCOME20');
      expect(getState().promoDiscount).toBe(20.0);
    });

    it('should remove the promo code when removePromo is called', () => {
      getState().applyPromo('WELCOME20', 20.0);
      getState().removePromo();

      expect(getState().promoCode).toBeNull();
      expect(getState().promoDiscount).toBe(0);
    });

    it('should not allow the total to go below 0 with a large promo discount', () => {
      getState().addItem(VARIANT_BLUE_DREAM, 1); // $45.00
      getState().applyPromo('FREE100', 1000.0);  // Extreme discount

      // Total should floor at 0, never negative
      expect(getState().total).toBeGreaterThanOrEqual(0);
    });
  });
});
