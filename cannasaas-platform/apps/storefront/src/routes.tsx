/**
 * @file routes.tsx
 * @app apps/storefront
 *
 * Centralised route path constants.
 *
 * Using constants prevents typos in <Link to="..."> and navigate() calls.
 * Route params are functions for type-safe URL construction.
 *
 * @example
 *   import { ROUTES } from './routes';
 *   <Link to={ROUTES.product('blue-dream-uuid')}>View Product</Link>
 *   navigate(ROUTES.orderConfirmation('order-uuid'));
 */

export const ROUTES = {
  // ── Public ──────────────────────────────────────────────────────────────────
  home:          '/',
  products:      '/products',
  productDetail: (id: string) => `/products/${id}`,
  cart:          '/cart',

  // ── Auth ────────────────────────────────────────────────────────────────────
  login:         '/login',
  register:      '/register',
  forgotPassword:'/forgot-password',
  resetPassword: '/reset-password',

  // ── Protected ───────────────────────────────────────────────────────────────
  checkout:      '/checkout',
  orderConfirmation: (id: string) => `/orders/${id}/confirmation`,

  // ── Account (nested) ────────────────────────────────────────────────────────
  account:        '/account',
  accountProfile: '/account/profile',
  accountOrders:  '/account/orders',
  accountOrderDetail: (id: string) => `/account/orders/${id}`,
  accountAddresses: '/account/addresses',
  accountLoyalty:   '/account/loyalty',
  accountPreferences: '/account/preferences',
} as const;
