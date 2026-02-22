/**
 * @file src/utils/__tests__/validators.test.ts
 * @description Unit tests for Zod validation schemas.
 *
 * The project guide specifies Zod for all form and API input validation.
 * Zod schemas serve as the single source of truth for:
 *   - React Hook Form field-level validation (frontend)
 *   - DTO validation on the API (the NestJS backend uses class-validator,
 *     but the shared @cannasaas/types package exposes Zod schemas so the
 *     frontend and shared utilities can validate before submitting)
 *
 * Schemas tested:
 *   loginSchema         — email + password validation
 *   checkoutSchema      — delivery address + order type validation
 *   productSchema       — manager form for creating/editing products
 *   purchaseLimitSchema — validates compliance limit API response shape
 *
 * @see src/utils/validators.ts
 * @see https://zod.dev/
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  loginSchema,
  checkoutSchema,
  productSchema,
  purchaseLimitResponseSchema,
} from '@/utils/validators';

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  it('should pass with valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should fail when email is missing', () => {
    const result = loginSchema.safeParse({ password: 'SecurePass123!' });
    expect(result.success).toBe(false);
  });

  it('should fail with an invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(false);
    // Check that the error is on the email field
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email');
      expect(emailError).toBeDefined();
    }
  });

  it('should fail when password is shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'Short1!',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when password has no uppercase letter', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'alllowercase1!',
    });
    expect(result.success).toBe(false);
  });

  it('should fail when password has no special character', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'NoSpecialChar1',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkoutSchema
// ---------------------------------------------------------------------------

describe('checkoutSchema', () => {
  const validPickupPayload = {
    orderType: 'pickup' as const,
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '555-867-5309',
  };

  const validDeliveryPayload = {
    orderType: 'delivery' as const,
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '555-867-5309',
    address: {
      street: '123 Main St',
      city: 'Brooklyn',
      state: 'NY',
      zip: '11201',
    },
  };

  it('should pass for a valid pickup order', () => {
    expect(checkoutSchema.safeParse(validPickupPayload).success).toBe(true);
  });

  it('should pass for a valid delivery order with address', () => {
    expect(checkoutSchema.safeParse(validDeliveryPayload).success).toBe(true);
  });

  it('should fail when firstName is empty', () => {
    const result = checkoutSchema.safeParse({
      ...validPickupPayload,
      firstName: '',
    });
    expect(result.success).toBe(false);
  });

  it('should require address fields for delivery orders', () => {
    // Delivery without an address should fail
    const result = checkoutSchema.safeParse({
      ...validDeliveryPayload,
      address: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('should not require address fields for pickup orders', () => {
    // Pickup without an address is fine
    const result = checkoutSchema.safeParse(validPickupPayload);
    expect(result.success).toBe(true);
  });

  it('should fail with an invalid US ZIP code', () => {
    const result = checkoutSchema.safeParse({
      ...validDeliveryPayload,
      address: { ...validDeliveryPayload.address, zip: 'ABCDE' },
    });
    expect(result.success).toBe(false);
  });

  it('should only accept NY, NJ, or CT as valid states', () => {
    // Florida is not an active CannaSaas market
    const result = checkoutSchema.safeParse({
      ...validDeliveryPayload,
      address: { ...validDeliveryPayload.address, state: 'FL' },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// productSchema (manager form)
// ---------------------------------------------------------------------------

describe('productSchema', () => {
  const validProduct = {
    name: 'Blue Dream',
    category: 'flower' as const,
    brand: 'Premium Farms',
    strainType: 'sativa_dominant_hybrid' as const,
    thcContent: 24.5,
    cbdContent: 0.8,
    description: 'A balanced sativa-dominant hybrid.',
  };

  it('should pass with a fully valid product', () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });

  it('should fail when product name is missing', () => {
    const { name, ...rest } = validProduct;
    expect(productSchema.safeParse(rest).success).toBe(false);
  });

  it('should fail when THC content is negative', () => {
    expect(productSchema.safeParse({ ...validProduct, thcContent: -1 }).success).toBe(false);
  });

  it('should fail when THC content exceeds 100%', () => {
    expect(productSchema.safeParse({ ...validProduct, thcContent: 101 }).success).toBe(false);
  });

  it('should allow null CBD content (hemp products have no CBD declared)', () => {
    expect(productSchema.safeParse({ ...validProduct, cbdContent: null }).success).toBe(true);
  });

  it('should reject an invalid category value', () => {
    expect(
      productSchema.safeParse({ ...validProduct, category: 'candy' }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// purchaseLimitResponseSchema
// ---------------------------------------------------------------------------

describe('purchaseLimitResponseSchema', () => {
  it('should validate a well-formed purchase limit API response', () => {
    const response = {
      state: 'NY',
      window: '24h',
      remaining: { flowerOz: 2.5, concentrateG: 24 },
      limits: { flowerOz: 3, concentrateG: 24 },
    };
    expect(purchaseLimitResponseSchema.safeParse(response).success).toBe(true);
  });

  it('should fail when a required field is missing', () => {
    const response = {
      state: 'NY',
      // window is missing
      remaining: { flowerOz: 2.5, concentrateG: 24 },
      limits: { flowerOz: 3, concentrateG: 24 },
    };
    expect(purchaseLimitResponseSchema.safeParse(response).success).toBe(false);
  });

  it('should fail if remaining.flowerOz exceeds the limit', () => {
    // This would indicate a data error in the API response
    const response = {
      state: 'NY',
      window: '24h',
      remaining: { flowerOz: 5, concentrateG: 24 }, // 5 > 3 limit
      limits: { flowerOz: 3, concentrateG: 24 },
    };
    expect(purchaseLimitResponseSchema.safeParse(response).success).toBe(false);
  });
});
