/**
 * @file admin.types.ts
 * @path apps/admin/src/types/admin.types.ts
 *
 * TypeScript type definitions for the CannaSaas admin portal.
 * All domain models used across pages, stores, and API calls are defined here.
 *
 * NAMING CONVENTION:
 *   - Plain interfaces = data shapes returned from the API
 *   - *FormValues = react-hook-form field values for create/edit forms
 *   - *Filters = filter state shapes for DataTable components
 *   - *Row = flattened shapes optimised for table rendering
 */

// ─── Auth / Roles ─────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'driver';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  avatarUrl?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenueCents: number;
  revenueChangePct: number;
  ordersToday: number;
  ordersTodayChangePct: number;
  activeCustomers: number;
  activeCustomersChangePct: number;
  averageOrderValueCents: number;
  aovChangePct: number;
}

export interface RevenueDataPoint {
  date: string;       // ISO date string
  revenueCents: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  unitsSold: number;
  revenueCents: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalCents: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  createdAt: string;
}

export interface LowStockAlert {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  currentStock: number;
  reorderThreshold: number;
  thumbnailUrl: string | null;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'cbd' | 'unknown';
export type ProductCategory =
  | 'flower'
  | 'edibles'
  | 'concentrates'
  | 'vapes'
  | 'topicals'
  | 'tinctures'
  | 'accessories'
  | 'pre_rolls';

export interface ProductVariant {
  id: string;
  label: string;                 // e.g. "3.5g", "1oz"
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  costCents: number | null;
  msrpCents: number | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  category: ProductCategory;
  status: ProductStatus;
  strainType: StrainType;
  thcPct: number | null;
  cbdPct: number | null;
  terpenes: string[];
  effects: string[];
  flavors: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  primaryImageId: string | null;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  metrcId: string | null;
  batchNumber: string | null;
  harvestDate: string | null;
  expirationDate: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
}

export interface ProductRow {
  id: string;
  thumbnailUrl: string | null;
  name: string;
  category: ProductCategory;
  thcPct: number | null;
  priceCents: number;   // lowest variant price
  stock: number;        // total across variants
  status: ProductStatus;
}

export interface ProductFilters {
  search: string;
  category: ProductCategory | '';
  status: ProductStatus | '';
  strainType: StrainType | '';
}

export type ProductFormValues = Omit<Product,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'images'
> & {
  imageFiles: File[];
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FulfillmentMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'online' | 'loyalty';

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  actorName: string;
  note: string | null;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  metrcUid: string | null;
}

export interface OrderPayment {
  method: PaymentMethod;
  amountCents: number;
  tipCents: number;
  taxCents: number;
  discountCents: number;
  loyaltyPointsUsed: number;
  transactionId: string | null;
}

export interface OrderCustomer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  isMedical: boolean;
  medicalCardExpiry: string | null;
}

export interface OrderFulfillment {
  method: FulfillmentMethod;
  driverName: string | null;
  driverId: string | null;
  estimatedArrival: string | null;
  deliveryAddress: string | null;
  trackingUrl: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  payment: OrderPayment;
  fulfillment: OrderFulfillment;
  statusHistory: OrderStatusEvent[];
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  search: string;
  status: OrderStatus | '';
  fulfillmentMethod: FulfillmentMethod | '';
  dateFrom: string;
  dateTo: string;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface Customer {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  verificationStatus: VerificationStatus;
  isMedical: boolean;
  medicalCardUrl: string | null;
  medicalCardExpiry: string | null;
  governmentIdUrl: string | null;
  loyaltyPoints: number;
  lifetimeValueCents: number;
  totalOrders: number;
  lastOrderAt: string | null;
  joinedAt: string;
  organizationId: string;
}

export interface CustomerFilters {
  search: string;
  verificationStatus: VerificationStatus | '';
  isMedical: boolean | null;
  hasOrders: boolean | null;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AnalyticsFulfillmentBreakdown {
  pickup: number;
  delivery: number;
}

export interface ConversionFunnelStep {
  label: string;
  count: number;
  pct: number;
}

export interface CustomerAcquisitionPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface TaxConfig {
  id: string;
  label: string;
  ratePct: number;
  appliesToCategories: ProductCategory[];
  isActive: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  /** GeoJSON polygon coordinates */
  polygon: [number, number][];
  minimumOrderCents: number;
  deliveryFeeCents: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface OrgProfileFormValues {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  minimumAge: 18 | 21;
}

export interface BrandingFormValues {
  brandColor: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoFile: File | null;
}

