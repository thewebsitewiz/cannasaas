/**
 * @file index.ts
 * @package @cannasaas/types
 *
 * Barrel export — all shared TypeScript types for CannaSaas.
 *
 * Import from this package in any app or shared package:
 *   import type { Order, User, CartItem } from '@cannasaas/types';
 *
 * All types mirror their NestJS backend entity counterparts.
 * The API response shapes in api-reference.md are the source of truth.
 */

// ── User & Auth ───────────────────────────────────────────────────────────────
export type {
  User,
  UserRole,
  Permission,
  JwtPayload,
  UserSummary,
  Address,
  SavedAddress,
} from './models/user';

// ── Organization Hierarchy ────────────────────────────────────────────────────
export type {
  Organization,
  Company,
  Dispensary,
  BrandingConfig,
  TenantContext,
  LicenseType,
  OperatingHours,
  DayHours,
} from './models/organization';

// ── Cart & Products ───────────────────────────────────────────────────────────
export type {
  CartItem,
  Cart,
  ProductVariant,
} from './models/cart-item';

// ── Coupons ───────────────────────────────────────────────────────────────────
export type {
  Coupon,
  AppliedCoupon,
  DiscountType,
  CouponScope,
} from './models/coupon';

// ── Orders ────────────────────────────────────────────────────────────────────
export type {
  Order,
  OrderLineItem,
  OrderStatus,
  OrderStatusEvent,
  FulfillmentMethod,
  PaymentMethod,
  PaymentStatus,
  CreateOrderRequest,
} from './models/order';

// ── Reviews ───────────────────────────────────────────────────────────────────
export type {
  Review,
  RatingSummary,
  EffectRatings,
  ReviewStatus,
} from './models/review';

// ── Delivery Zones ────────────────────────────────────────────────────────────
export type {
  DeliveryZone,
  DeliveryFeeConfig,
  AddressDeliveryCheck,
  GeoJsonPolygon,
  GeoJsonCoordinate,
} from './models/delivery-zone';

// ── Drivers ───────────────────────────────────────────────────────────────────
export type {
  Driver,
  DriverStatus,
  DriverLocation,
  DeliveryTrackingUpdate,
} from './models/driver';

// ── Compliance ────────────────────────────────────────────────────────────────
export type {
  ComplianceEvent,
  ComplianceEventType,
  MetrcContext,
  PurchaseLimitStatus,
} from './models/compliance-event';

// ── Analytics ─────────────────────────────────────────────────────────────────
export type {
  AnalyticsSummary,
  ProductAnalytics,
  TopProduct,
  MetricWithChange,
  TimeSeriesPoint,
} from './models/analytics-summary';
