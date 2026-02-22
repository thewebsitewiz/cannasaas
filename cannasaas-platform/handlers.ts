/**
 * @file src/test/mocks/handlers.ts
 * @description MSW request handlers — the "fake backend" used in all
 * unit, component, and integration tests.
 *
 * Design principles:
 *   - Each handler mirrors the real API contract documented in api-reference.md
 *   - Handlers return realistic fixture data so component tests are meaningful
 *   - Handlers are PURE — they don't share mutable state between calls
 *   - Tests that need error states call server.use(errorHandlers.products)
 *     to temporarily override specific handlers
 *
 * Endpoint coverage:
 *   Authentication: /auth/login, /auth/logout, /auth/refresh, /auth/profile
 *   Products:       /products, /products/:id, /products/categories
 *   Cart:           /cart, /cart/items, /cart/items/:id, /cart/promo
 *   Orders:         /orders, /orders (POST), /orders/:id
 *   Compliance:     /compliance/purchase-limit
 *   Analytics:      /analytics/dashboard
 *
 * @see https://mswjs.io/docs/network-behavior/rest
 * @see api-reference.md
 */

import { http, HttpResponse, delay } from 'msw';

// ---------------------------------------------------------------------------
// Shared fixtures
// These objects are referenced by multiple handlers; centralising them
// prevents drift between, e.g., the product list and the product detail mock.
// ---------------------------------------------------------------------------

/** A representative cannabis product — Sativa flower */
export const MOCK_PRODUCT_BLUE_DREAM = {
  id: 'prod-001',
  name: 'Blue Dream',
  category: 'flower',
  brand: 'Premium Farms',
  strainType: 'sativa_dominant_hybrid',
  thcContent: 24.5,
  cbdContent: 0.8,
  description: 'A balanced sativa-dominant hybrid with sweet berry aroma.',
  effects: ['uplifting', 'creative', 'euphoric'],
  flavors: ['berry', 'sweet', 'earthy'],
  images: [
    {
      url: 'https://cdn.cannasaas.com/products/blue-dream.jpg',
      isPrimary: true,
    },
  ],
  variants: [
    {
      id: 'var-001',
      name: '1/8 oz',
      sku: 'BD-125',
      weight: 3.5,
      weightUnit: 'g',
      price: 45.0,
      quantity: 24,
    },
    {
      id: 'var-002',
      name: '1/4 oz',
      sku: 'BD-250',
      weight: 7.0,
      weightUnit: 'g',
      price: 85.0,
      quantity: 12,
    },
  ],
};

/** A representative cannabis product — Indica concentrate */
export const MOCK_PRODUCT_OG_KUSH = {
  id: 'prod-002',
  name: 'OG Kush Live Resin',
  category: 'concentrate',
  brand: 'Artisan Extracts',
  strainType: 'indica',
  thcContent: 78.2,
  cbdContent: 0.2,
  description: 'Premium live resin with earthy pine and sour lemon aroma.',
  effects: ['relaxing', 'sleepy', 'happy'],
  flavors: ['earthy', 'pine', 'lemon'],
  images: [
    {
      url: 'https://cdn.cannasaas.com/products/og-kush-resin.jpg',
      isPrimary: true,
    },
  ],
  variants: [
    {
      id: 'var-003',
      name: '1g',
      sku: 'OGK-1G',
      weight: 1.0,
      weightUnit: 'g',
      price: 55.0,
      quantity: 8,
    },
  ],
};

/** Authenticated user fixture */
export const MOCK_USER = {
  id: 'user-001',
  email: 'test@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  organizationId: 'org-001',
  roles: ['customer'],
  permissions: ['products:read', 'orders:write'],
};

/** Shopping cart fixture */
export const MOCK_CART = {
  id: 'cart-001',
  items: [
    {
      id: 'cart-item-001',
      productId: 'prod-001',
      variantId: 'var-001',
      productName: 'Blue Dream',
      variantName: '1/8 oz',
      quantity: 2,
      unitPrice: 45.0,
      totalPrice: 90.0,
    },
  ],
  subtotal: 90.0,
  promoDiscount: 0,
  tax: 18.68,
  total: 108.68,
};

// ---------------------------------------------------------------------------
// Handler definitions
// ---------------------------------------------------------------------------

/**
 * Base URL for all API handlers. Matches the CannaSaas API base URL so
 * that production Axios calls are intercepted without configuration changes.
 */
const API_BASE = 'https://api.cannasaas.com/v1';

export const handlers = [

  // =========================================================================
  // Authentication
  // =========================================================================

  /**
   * POST /auth/login
   * Returns a JWT access token + refresh token for valid credentials.
   * Returns 401 for anything else (tests can override for error scenarios).
   */
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        user: MOCK_USER,
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token',
      });
    }

    return HttpResponse.json(
      {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      },
      { status: 401 },
    );
  }),

  /**
   * POST /auth/logout
   * Always succeeds in tests — just clears the refresh token cookie.
   */
  http.post(`${API_BASE}/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  /**
   * POST /auth/refresh
   * Simulates the silent token refresh that the Axios interceptor performs
   * when an access token expires.
   */
  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'mock-new-access-token-jwt',
    });
  }),

  /**
   * GET /auth/profile
   * Returns the current user's profile data.
   */
  http.get(`${API_BASE}/auth/profile`, () => {
    return HttpResponse.json(MOCK_USER);
  }),

  // =========================================================================
  // Products
  // =========================================================================

  /**
   * GET /products
   * Returns a paginated list of products. Supports filtering by category,
   * strainType, and price range via query params (not yet implemented in
   * handlers — tests that need filtering should override via server.use()).
   */
  http.get(`${API_BASE}/products`, async () => {
    // Simulate a small network delay so loading states are testable
    await delay(50);

    return HttpResponse.json({
      data: [MOCK_PRODUCT_BLUE_DREAM, MOCK_PRODUCT_OG_KUSH],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      },
    });
  }),

  /**
   * GET /products/:id
   * Returns a single product by ID. Returns 404 for unknown IDs.
   */
  http.get(`${API_BASE}/products/:id`, ({ params }) => {
    const map: Record<string, typeof MOCK_PRODUCT_BLUE_DREAM> = {
      'prod-001': MOCK_PRODUCT_BLUE_DREAM,
      'prod-002': MOCK_PRODUCT_OG_KUSH,
    };

    const product = map[params.id as string];
    if (!product) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 },
      );
    }

    return HttpResponse.json(product);
  }),

  /**
   * GET /products/categories
   * Returns flat list of cannabis product categories.
   */
  http.get(`${API_BASE}/products/categories`, () => {
    return HttpResponse.json([
      { id: 'cat-001', name: 'Flower', slug: 'flower' },
      { id: 'cat-002', name: 'Concentrates', slug: 'concentrate' },
      { id: 'cat-003', name: 'Edibles', slug: 'edible' },
      { id: 'cat-004', name: 'Vaporizers', slug: 'vaporizer' },
      { id: 'cat-005', name: 'Tinctures', slug: 'tincture' },
      { id: 'cat-006', name: 'Topicals', slug: 'topical' },
    ]);
  }),

  // =========================================================================
  // Cart
  // =========================================================================

  /** GET /cart — returns the current cart */
  http.get(`${API_BASE}/cart`, () => {
    return HttpResponse.json(MOCK_CART);
  }),

  /**
   * POST /cart/items — adds an item; returns the updated cart.
   * This mock always succeeds; override with server.use() to test
   * out-of-stock / purchase limit error scenarios.
   */
  http.post(`${API_BASE}/cart/items`, () => {
    return HttpResponse.json({
      ...MOCK_CART,
      items: [
        ...MOCK_CART.items,
        {
          id: 'cart-item-002',
          productId: 'prod-002',
          variantId: 'var-003',
          productName: 'OG Kush Live Resin',
          variantName: '1g',
          quantity: 1,
          unitPrice: 55.0,
          totalPrice: 55.0,
        },
      ],
      subtotal: 145.0,
      tax: 30.12,
      total: 175.12,
    });
  }),

  /** DELETE /cart/items/:id — removes an item; returns updated cart */
  http.delete(`${API_BASE}/cart/items/:id`, () => {
    return HttpResponse.json({ ...MOCK_CART, items: [], subtotal: 0, tax: 0, total: 0 });
  }),

  /** PUT /cart/items/:id — updates quantity */
  http.put(`${API_BASE}/cart/items/:id`, () => {
    return HttpResponse.json(MOCK_CART);
  }),

  // =========================================================================
  // Orders
  // =========================================================================

  /** GET /orders — returns order history */
  http.get(`${API_BASE}/orders`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'order-001',
          status: 'completed',
          total: 108.68,
          createdAt: '2026-02-01T14:32:00Z',
          items: MOCK_CART.items,
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  }),

  /**
   * POST /orders — creates an order from the current cart.
   * Returns the new order with a 'pending' status.
   */
  http.post(`${API_BASE}/orders`, async () => {
    await delay(100); // Simulate processing time

    return HttpResponse.json(
      {
        id: 'order-002',
        status: 'pending',
        total: MOCK_CART.total,
        items: MOCK_CART.items,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  /** GET /orders/:id — returns a single order */
  http.get(`${API_BASE}/orders/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: 'confirmed',
      total: MOCK_CART.total,
      items: MOCK_CART.items,
      createdAt: '2026-02-15T10:00:00Z',
    });
  }),

  // =========================================================================
  // Compliance
  // =========================================================================

  /**
   * GET /compliance/purchase-limit
   * Returns the customer's remaining purchase limits for the current window.
   * New York defaults: 3oz flower, 24g concentrate per 24 hours.
   */
  http.get(`${API_BASE}/compliance/purchase-limit`, () => {
    return HttpResponse.json({
      state: 'NY',
      window: '24h',
      remaining: {
        flowerOz: 2.5,   // Already purchased 0.5oz today
        concentrateG: 24, // None purchased yet
      },
      limits: {
        flowerOz: 3,
        concentrateG: 24,
      },
    });
  }),

  // =========================================================================
  // Analytics (Admin portal)
  // =========================================================================

  /** GET /analytics/dashboard — returns KPI summary for the admin dashboard */
  http.get(`${API_BASE}/analytics/dashboard`, () => {
    return HttpResponse.json({
      revenue: { total: 125_000, change: 15.5, byDay: [] },
      orders: { total: 1456, change: 12.3 },
      customers: { total: 456, new: 45, returning: 411 },
      avgOrderValue: { value: 85.85, change: 3.1 },
      topProducts: [
        { productId: 'prod-001', name: 'Blue Dream', revenue: 12_500, quantity: 156 },
      ],
    });
  }),
];

// ---------------------------------------------------------------------------
// Error override handlers
// Imported in individual tests that need to simulate API failures:
//   server.use(errorHandlers.products)
// ---------------------------------------------------------------------------

export const errorHandlers = {
  /** Simulates a 500 error when fetching the product list */
  products: http.get(`${API_BASE}/products`, () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }),

  /** Simulates a 429 rate limit error when adding to cart */
  cartRateLimit: http.post(`${API_BASE}/cart/items`, () => {
    return HttpResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { status: 429 },
    );
  }),

  /** Simulates a purchase limit violation on checkout */
  purchaseLimitViolation: http.post(`${API_BASE}/orders`, () => {
    return HttpResponse.json(
      {
        error: {
          code: 'PURCHASE_LIMIT_EXCEEDED',
          message: 'Flower limit exceeded: 3.5oz of 3oz max',
        },
      },
      { status: 422 },
    );
  }),
};
