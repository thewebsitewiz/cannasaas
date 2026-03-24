import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  integer,
  smallint,
  timestamp,
  date,
  time,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ══════════════════════════════════════════════════════════════════════
// Core
// ══════════════════════════════════════════════════════════════════════

export const organizations = pgTable('organizations', {
  organizationId: uuid('organization_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  billingEmail: varchar('billing_email', { length: 255 }),
  billingAddress: varchar('billing_address', { length: 500 }),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('starter').notNull(),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const companies = pgTable('companies', {
  companyId: uuid('company_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  dbaName: varchar('dba_name', { length: 255 }),
  ein: varchar('ein', { length: 20 }),
  stateOfIncorporation: varchar('state_of_incorporation', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseType: varchar('license_type', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpiryDate: date('license_expiry_date'),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zip: varchar('zip', { length: 10 }),
  metrcFacilityLicense: varchar('metrc_facility_license', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_companies_organization').on(table.organizationId),
]);

export const dispensaries = pgTable('dispensaries', {
  entityId: uuid('entity_id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  type: varchar('type', { length: 50 }).default('dispensary').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseType: varchar('license_type', { length: 100 }),
  addressLine1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }).notNull(),
  zip: varchar('zip', { length: 10 }),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  county: varchar('county', { length: 100 }),
  municipality: varchar('municipality', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  isDeliveryEnabled: boolean('is_delivery_enabled').default(false).notNull(),
  isPickupEnabled: boolean('is_pickup_enabled').default(false).notNull(),
  metrcLicenseNumber: varchar('metrc_license_number', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }),
  cashDiscountPercent: numeric('cash_discount_percent', { precision: 5, scale: 2 }).default('0'),
  isCashEnabled: boolean('is_cash_enabled').default(true).notNull(),
  cashDeliveryEnabled: boolean('cash_delivery_enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_dispensaries_company').on(table.companyId),
  index('idx_dispensaries_slug').on(table.slug),
]);

// ══════════════════════════════════════════════════════════════════════
// Users & Auth
// ══════════════════════════════════════════════════════════════════════

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 255 }).default('customer').notNull(),
  organizationId: uuid('organization_id'),
  dispensaryId: uuid('dispensary_id'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  dispensaryId: uuid('dispensary_id'),
  organizationId: uuid('organization_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userAgent: varchar('user_agent', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_refresh_tokens_user').on(table.userId),
]);

// ══════════════════════════════════════════════════════════════════════
// Brands & Manufacturers
// ══════════════════════════════════════════════════════════════════════

export const brands = pgTable('brands', {
  brandId: uuid('brand_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_brands_organization').on(table.organizationId),
]);

export const manufacturers = pgTable('manufacturers', {
  manufacturerId: uuid('manufacturer_id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id'),
  legalName: varchar('legal_name', { length: 255 }).notNull(),
  dbaName: varchar('dba_name', { length: 255 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseType: varchar('license_type', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpiryDate: date('license_expiry_date'),
  addressLine1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zip: varchar('zip', { length: 10 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_manufacturers_brand').on(table.brandId),
]);

// ══════════════════════════════════════════════════════════════════════
// Products
// ══════════════════════════════════════════════════════════════════════

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  brandId: uuid('brand_id'),
  manufacturerId: uuid('manufacturer_id'),
  strainId: uuid('strain_id'),
  productTypeId: integer('product_type_id'),
  primaryCategoryId: integer('primary_category_id'),
  taxCategoryId: integer('tax_category_id'),
  packagingTypeId: integer('packaging_type_id'),
  extractionMethodId: integer('extraction_method_id'),
  uomId: integer('uom_id'),
  metrcItemCategoryId: integer('metrc_item_category_id'),
  strainName: varchar('strain_name', { length: 255 }),
  strainType: varchar('strain_type', { length: 20 }),
  effects: jsonb('effects').default([]).notNull(),
  flavors: jsonb('flavors').default([]).notNull(),
  terpenes: jsonb('terpenes').default([]).notNull(),
  lineage: jsonb('lineage').default({}).notNull(),
  otreebaOcpc: varchar('otreeba_ocpc', { length: 50 }),
  enrichedAt: timestamp('enriched_at', { withTimezone: true }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  sku: varchar('sku', { length: 100 }).unique(),
  metrcItemUid: varchar('metrc_item_uid', { length: 50 }),
  netWeightG: numeric('net_weight_g', { precision: 10, scale: 4 }),
  netVolumeMl: numeric('net_volume_ml', { precision: 10, scale: 4 }),
  thcPercent: numeric('thc_percent', { precision: 6, scale: 3 }),
  cbdPercent: numeric('cbd_percent', { precision: 6, scale: 3 }),
  totalThcMgPerContainer: numeric('total_thc_mg_per_container', { precision: 10, scale: 4 }),
  isHempDerived: boolean('is_hemp_derived').default(false).notNull(),
  isChildResistantPackaged: boolean('is_child_resistant_packaged').default(false).notNull(),
  isTamperEvident: boolean('is_tamper_evident').default(false).notNull(),
  isResealable: boolean('is_resealable').default(false).notNull(),
  hasNoMinorAppeals: boolean('has_no_minor_appeals').default(true).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  approvedByUserId: uuid('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_products_dispensary').on(table.dispensaryId),
  index('idx_products_dispensary_active_type').on(table.dispensaryId, table.isActive, table.productTypeId),
  index('idx_products_dispensary_category_active').on(table.dispensaryId, table.primaryCategoryId, table.isActive),
  index('idx_products_metrc_item_uid').on(table.metrcItemUid),
]);

export const productVariants = pgTable('product_variants', {
  variantId: uuid('variant_id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  uomId: integer('uom_id'),
  name: varchar('name', { length: 100 }).notNull(),
  quantityPerUnit: numeric('quantity_per_unit', { precision: 10, scale: 4 }),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  metrcPackageLabel: varchar('metrc_package_label', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('idx_variants_product').on(table.productId),
  index('idx_variants_dispensary').on(table.dispensaryId),
  index('idx_variants_product_active').on(table.productId, table.isActive),
  index('idx_variants_sku').on(table.sku),
  index('idx_variants_barcode').on(table.barcode),
  index('idx_variants_metrc_label').on(table.metrcPackageLabel),
]);

export const productPricing = pgTable('product_pricing', {
  pricingId: uuid('pricing_id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  priceType: varchar('price_type', { length: 20 }).default('retail').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  setByUserId: uuid('set_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_pricing_variant').on(table.variantId),
  index('idx_pricing_variant_type_dates').on(table.variantId, table.priceType, table.effectiveFrom, table.effectiveUntil),
]);

export const productBatches = pgTable('product_batches', {
  batchId: uuid('batch_id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  manufacturerId: uuid('manufacturer_id'),
  uomId: integer('uom_id'),
  lotNumber: varchar('lot_number', { length: 100 }),
  metrcPackageLabel: varchar('metrc_package_label', { length: 100 }),
  quantityReceived: numeric('quantity_received', { precision: 10, scale: 4 }).default('0').notNull(),
  quantityRemaining: numeric('quantity_remaining', { precision: 10, scale: 4 }).default('0').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  manufactureDate: date('manufacture_date'),
  expiryDate: date('expiry_date'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  receivedByUserId: uuid('received_by_user_id'),
  recallId: uuid('recall_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_batches_variant').on(table.variantId),
  index('idx_batches_dispensary').on(table.dispensaryId),
  index('idx_batches_dispensary_status_expiry').on(table.dispensaryId, table.status, table.expiryDate),
  index('idx_batches_lot_number').on(table.lotNumber),
  index('idx_batches_metrc_label').on(table.metrcPackageLabel),
]);

export const labTests = pgTable('lab_tests', {
  labTestId: uuid('lab_test_id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  labName: varchar('lab_name', { length: 255 }),
  labLicenseNumber: varchar('lab_license_number', { length: 100 }),
  coaNumber: varchar('coa_number', { length: 100 }),
  coaDocumentUrl: varchar('coa_document_url', { length: 500 }),
  coaQrCodeUrl: varchar('coa_qr_code_url', { length: 500 }),
  overallResult: varchar('overall_result', { length: 20 }).default('pending').notNull(),
  testedAt: date('tested_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_lab_tests_batch').on(table.batchId),
  index('idx_lab_tests_batch_result').on(table.batchId, table.overallResult),
]);

export const labTestResults = pgTable('lab_test_results', {
  resultId: uuid('result_id').primaryKey().defaultRandom(),
  labTestId: uuid('lab_test_id').notNull(),
  testCategoryId: integer('test_category_id').notNull(),
  analyteName: varchar('analyte_name', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 20 }),
  value: numeric('value', { precision: 10, scale: 6 }),
  actionLimit: numeric('action_limit', { precision: 10, scale: 6 }),
  result: varchar('result', { length: 20 }).default('pass').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_lab_test_results_test').on(table.labTestId),
]);

// ══════════════════════════════════════════════════════════════════════
// Orders & Payments
// ══════════════════════════════════════════════════════════════════════

export const orders = pgTable('orders', {
  orderId: uuid('order_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  customerUserId: uuid('customer_user_id'),
  staffUserId: uuid('staff_user_id'),
  orderType: varchar('order_type', { length: 255 }).default('pickup').notNull(),
  orderStatus: varchar('order_status', { length: 255 }).default('draft').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).default('0').notNull(),
  discountTotal: numeric('discount_total', { precision: 10, scale: 2 }).default('0').notNull(),
  taxTotal: numeric('tax_total', { precision: 10, scale: 2 }).default('0').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).default('0').notNull(),
  taxBreakdown: jsonb('tax_breakdown'),
  appliedPromotions: jsonb('applied_promotions'),
  metrcReceiptId: varchar('metrc_receipt_id', { length: 100 }),
  metrcReportedAt: timestamp('metrc_reported_at', { withTimezone: true }),
  metrcSyncStatus: varchar('metrc_sync_status', { length: 255 }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 255 }).default('cash'),
  cashDiscountApplied: numeric('cash_discount_applied', { precision: 10, scale: 2 }).default('0').notNull(),
  fulfillmentAddress: jsonb('fulfillment_address'),
  scheduledPickupAt: timestamp('scheduled_pickup_at', { withTimezone: true }),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_orders_dispensary').on(table.dispensaryId),
  index('idx_orders_customer').on(table.customerUserId),
  index('idx_orders_dispensary_created').on(table.dispensaryId, table.createdAt),
  index('idx_orders_customer_created').on(table.customerUserId, table.createdAt),
]);

export const orderLineItems = pgTable('order_line_items', {
  lineItemId: uuid('line_item_id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id'),
  batchId: uuid('batch_id'),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discountApplied: numeric('discount_applied', { precision: 10, scale: 2 }).default('0').notNull(),
  taxApplied: numeric('tax_applied', { precision: 10, scale: 2 }).default('0').notNull(),
  metrcPackageLabel: varchar('metrc_package_label', { length: 100 }),
  metrcItemUid: varchar('metrc_item_uid', { length: 100 }),
  thcMgPerUnit: numeric('thc_mg_per_unit', { precision: 10, scale: 4 }),
  cbdMgPerUnit: numeric('cbd_mg_per_unit', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_line_items_order').on(table.orderId),
]);

export const payments = pgTable('payments', {
  paymentId: uuid('payment_id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  method: varchar('method', { length: 255 }).default('cash').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 100 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 100 }),
  status: varchar('status', { length: 255 }).default('pending').notNull(),
  terminalId: varchar('terminal_id', { length: 100 }),
  cashTendered: numeric('cash_tendered', { precision: 10, scale: 2 }),
  changeGiven: numeric('change_given', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_payments_order').on(table.orderId),
  index('idx_payments_dispensary_created').on(table.dispensaryId, table.createdAt),
]);

// ══════════════════════════════════════════════════════════════════════
// Inventory
// ══════════════════════════════════════════════════════════════════════

export const inventory = pgTable('inventory', {
  inventoryId: uuid('inventory_id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  quantityOnHand: numeric('quantity_on_hand', { precision: 12, scale: 4 }).default('0').notNull(),
  quantityReserved: numeric('quantity_reserved', { precision: 12, scale: 4 }).default('0').notNull(),
  quantityAvailable: numeric('quantity_available', { precision: 12, scale: 4 }).default('0').notNull(),
  reorderThreshold: numeric('reorder_threshold', { precision: 12, scale: 4 }),
  reorderQuantity: numeric('reorder_quantity', { precision: 12, scale: 4 }),
  locationInStore: varchar('location_in_store', { length: 200 }),
  lastMetrcSyncAt: timestamp('last_metrc_sync_at', { withTimezone: true }),
  lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true }),
  lastCountAt: timestamp('last_count_at', { withTimezone: true }),
  lastCountByUserId: uuid('last_count_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_inventory_dispensary_variant').on(table.dispensaryId, table.variantId),
  index('idx_inventory_dispensary').on(table.dispensaryId),
  index('idx_inventory_variant').on(table.variantId),
]);

export const inventoryTransactions = pgTable('inventory_transactions', {
  transactionId: uuid('transaction_id').primaryKey().defaultRandom(),
  inventoryId: uuid('inventory_id').notNull(),
  batchId: uuid('batch_id'),
  dispensaryId: uuid('dispensary_id').notNull(),
  transactionType: varchar('transaction_type', { length: 255 }).notNull(),
  adjustmentReasonId: smallint('adjustment_reason_id'),
  quantityDelta: numeric('quantity_delta', { precision: 12, scale: 4 }).notNull(),
  quantityBefore: numeric('quantity_before', { precision: 12, scale: 4 }).notNull(),
  quantityAfter: numeric('quantity_after', { precision: 12, scale: 4 }).notNull(),
  referenceOrderId: uuid('reference_order_id'),
  referenceTransferManifestId: varchar('reference_transfer_manifest_id', { length: 100 }),
  performedByUserId: uuid('performed_by_user_id'),
  metrcSynced: boolean('metrc_synced').default(false).notNull(),
  metrcSyncedAt: timestamp('metrc_synced_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_inv_txn_inventory').on(table.inventoryId),
  index('idx_inv_txn_dispensary_created').on(table.dispensaryId, table.createdAt),
  index('idx_inv_txn_inventory_created').on(table.inventoryId, table.createdAt),
]);

// ══════════════════════════════════════════════════════════════════════
// Inventory Control (transfers, counts, adjustments)
// ══════════════════════════════════════════════════════════════════════

export const inventoryTransfers = pgTable('inventory_transfers', {
  transferId: uuid('transfer_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fromDispensaryId: uuid('from_dispensary_id').notNull(),
  toDispensaryId: uuid('to_dispensary_id').notNull(),
  status: varchar('status', { length: 20 }).default('requested').notNull(),
  requestedByUserId: uuid('requested_by_user_id').notNull(),
  approvedByUserId: uuid('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  metrcManifestId: varchar('metrc_manifest_id', { length: 100 }),
  notes: text('notes'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_transfers_from').on(table.fromDispensaryId),
  index('idx_transfers_to').on(table.toDispensaryId),
]);

export const inventoryTransferItems = pgTable('inventory_transfer_items', {
  itemId: uuid('item_id').primaryKey().defaultRandom(),
  transferId: uuid('transfer_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 100 }),
  quantityRequested: integer('quantity_requested').notNull(),
  quantityShipped: integer('quantity_shipped'),
  quantityReceived: integer('quantity_received'),
  metrcPackageTag: varchar('metrc_package_tag', { length: 100 }),
  notes: text('notes'),
}, (table) => [
  index('idx_transfer_items_transfer').on(table.transferId),
]);

export const inventoryCounts = pgTable('inventory_counts', {
  countId: uuid('count_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  countType: varchar('count_type', { length: 20 }).default('cycle').notNull(),
  status: varchar('status', { length: 20 }).default('in_progress').notNull(),
  startedByUserId: uuid('started_by_user_id').notNull(),
  completedByUserId: uuid('completed_by_user_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  totalItems: integer('total_items').default(0).notNull(),
  itemsCounted: integer('items_counted').default(0).notNull(),
  varianceCount: integer('variance_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_counts_dispensary').on(table.dispensaryId),
]);

export const inventoryCountItems = pgTable('inventory_count_items', {
  countItemId: uuid('count_item_id').primaryKey().defaultRandom(),
  countId: uuid('count_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 100 }),
  expectedQuantity: integer('expected_quantity').default(0).notNull(),
  countedQuantity: integer('counted_quantity'),
  variance: integer('variance'),
  countedByUserId: uuid('counted_by_user_id'),
  countedAt: timestamp('counted_at', { withTimezone: true }),
  notes: text('notes'),
}, (table) => [
  index('idx_count_items_count').on(table.countId),
]);

export const inventoryAdjustments = pgTable('inventory_adjustments', {
  adjustmentId: uuid('adjustment_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  reasonId: integer('reason_id').notNull(),
  quantityChange: integer('quantity_change').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  submittedByUserId: uuid('submitted_by_user_id').notNull(),
  approvedByUserId: uuid('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_adjustments_dispensary').on(table.dispensaryId),
]);

export const lkpAdjustmentReasons = pgTable('lkp_adjustment_reasons', {
  reasonId: serial('reason_id').primaryKey(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  direction: varchar('direction', { length: 10 }).default('decrease').notNull(),
  requiresApproval: boolean('requires_approval').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// ══════════════════════════════════════════════════════════════════════
// Customers
// ══════════════════════════════════════════════════════════════════════

export const customerProfiles = pgTable('customer_profiles', {
  profileId: uuid('profile_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  ageVerified: boolean('age_verified').default(false).notNull(),
  ageVerifiedAt: timestamp('age_verified_at', { withTimezone: true }),
  ageVerificationMethod: varchar('age_verification_method', { length: 30 }),
  idDocumentType: varchar('id_document_type', { length: 30 }),
  isMedicalPatient: boolean('is_medical_patient').default(false).notNull(),
  medicalCardNumber: varchar('medical_card_number', { length: 50 }),
  preferredDispensaryId: uuid('preferred_dispensary_id'),
  marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),
  smsOptIn: boolean('sms_opt_in').default(false).notNull(),
  loyaltyPoints: integer('loyalty_points').default(0).notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).default('0').notNull(),
  lastOrderAt: timestamp('last_order_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const customerAddresses = pgTable('customer_addresses', {
  addressId: uuid('address_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  label: varchar('label', { length: 50 }).default('Home').notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 5 }).notNull(),
  zip: varchar('zip', { length: 10 }).notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  isDefault: boolean('is_default').default(false).notNull(),
  deliveryInstructions: text('delivery_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_customer_addresses_user').on(table.userId),
]);

export const ageVerifications = pgTable('age_verifications', {
  verificationId: uuid('verification_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  dispensaryId: uuid('dispensary_id'),
  method: varchar('method', { length: 30 }).notNull(),
  idType: varchar('id_type', { length: 30 }),
  dateOfBirth: date('date_of_birth'),
  calculatedAge: integer('calculated_age'),
  result: varchar('result', { length: 20 }).notNull(),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════════
// Compliance
// ══════════════════════════════════════════════════════════════════════

export const metrcManifests = pgTable('metrc_manifests', {
  manifestId: uuid('manifest_id').primaryKey().defaultRandom(),
  transferId: uuid('transfer_id'),
  dispensaryId: uuid('dispensary_id').notNull(),
  manifestNumber: varchar('manifest_number', { length: 50 }).notNull(),
  manifestType: varchar('manifest_type', { length: 30 }).default('transfer').notNull(),
  fromLicense: varchar('from_license', { length: 50 }).notNull(),
  toLicense: varchar('to_license', { length: 50 }).notNull(),
  fromFacilityName: varchar('from_facility_name', { length: 200 }),
  toFacilityName: varchar('to_facility_name', { length: 200 }),
  driverName: varchar('driver_name', { length: 100 }),
  vehicleLicensePlate: varchar('vehicle_license_plate', { length: 20 }),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  metrcTransferId: varchar('metrc_transfer_id', { length: 100 }),
  totalPackages: integer('total_packages').default(0).notNull(),
  totalQuantity: numeric('total_quantity', { precision: 10, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_manifests_dispensary').on(table.dispensaryId),
]);

export const metrcManifestItems = pgTable('metrc_manifest_items', {
  itemId: uuid('item_id').primaryKey().defaultRandom(),
  manifestId: uuid('manifest_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  metrcPackageTag: varchar('metrc_package_tag', { length: 100 }),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }).default('each').notNull(),
  notes: text('notes'),
}, (table) => [
  index('idx_manifest_items_manifest').on(table.manifestId),
]);

export const wasteDestructionLogs = pgTable('waste_destruction_logs', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  variantId: uuid('variant_id'),
  productName: varchar('product_name', { length: 255 }).notNull(),
  metrcPackageTag: varchar('metrc_package_tag', { length: 100 }),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }).default('grams').notNull(),
  wasteType: varchar('waste_type', { length: 30 }).default('plant_waste').notNull(),
  destructionMethod: varchar('destruction_method', { length: 50 }),
  reason: text('reason').notNull(),
  witness1Name: varchar('witness1_name', { length: 100 }).notNull(),
  witness1Title: varchar('witness1_title', { length: 50 }),
  witness2Name: varchar('witness2_name', { length: 100 }),
  witness2Title: varchar('witness2_title', { length: 50 }),
  destroyedAt: timestamp('destroyed_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  submittedByUserId: uuid('submitted_by_user_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_waste_logs_dispensary').on(table.dispensaryId),
]);

export const auditLog = pgTable('audit_log', {
  auditId: uuid('audit_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id'),
  userId: uuid('user_id'),
  userEmail: varchar('user_email', { length: 255 }),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  changes: jsonb('changes'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_log_user').on(table.userId),
]);

export const reconciliationReports = pgTable('reconciliation_reports', {
  reportId: uuid('report_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  reportDate: date('report_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  totalLocalItems: integer('total_local_items').default(0).notNull(),
  totalMetrcItems: integer('total_metrc_items').default(0).notNull(),
  matchedItems: integer('matched_items').default(0).notNull(),
  discrepancyCount: integer('discrepancy_count').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reconciliationItems = pgTable('reconciliation_items', {
  itemId: uuid('item_id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull(),
  productName: varchar('product_name', { length: 255 }),
  metrcPackageTag: varchar('metrc_package_tag', { length: 100 }),
  localQuantity: integer('local_quantity'),
  metrcQuantity: integer('metrc_quantity'),
  variance: integer('variance'),
  status: varchar('status', { length: 20 }).default('matched').notNull(),
}, (table) => [
  index('idx_recon_items_report').on(table.reportId),
]);

export const complianceLogs = pgTable('compliance_logs', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  userId: uuid('user_id'),
  entityType: varchar('entity_type', { length: 255 }),
  entityId: varchar('entity_id', { length: 255 }),
  action: varchar('action', { length: 255 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: varchar('user_agent', { length: 255 }),
  metrcSynced: boolean('metrc_synced').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_compliance_dispensary_created').on(table.dispensaryId, table.createdAt),
  index('idx_compliance_dispensary_entity').on(table.dispensaryId, table.entityType, table.entityId),
]);

// ══════════════════════════════════════════════════════════════════════
// Metrc
// ══════════════════════════════════════════════════════════════════════

export const metrcCredentials = pgTable('metrc_credentials', {
  credentialId: uuid('credential_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull().unique(),
  userApiKey: varchar('user_api_key', { length: 255 }).notNull(),
  integratorApiKey: varchar('integrator_api_key', { length: 255 }),
  state: varchar('state', { length: 10 }).notNull(),
  metrcUsername: varchar('metrc_username', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
  validationError: text('validation_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const metrcSyncLogs = pgTable('metrc_sync_logs', {
  syncId: uuid('sync_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  credentialId: uuid('credential_id').notNull(),
  syncType: varchar('sync_type', { length: 255 }).notNull(),
  referenceEntityType: varchar('reference_entity_type', { length: 255 }),
  referenceEntityId: varchar('reference_entity_id', { length: 255 }),
  status: varchar('status', { length: 255 }).default('pending').notNull(),
  metrcResponse: jsonb('metrc_response'),
  errorMessage: text('error_message'),
  attemptCount: integer('attempt_count').default(0).notNull(),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_metrc_sync_credential').on(table.credentialId),
  index('idx_metrc_sync_dispensary_created').on(table.dispensaryId, table.createdAt),
  index('idx_metrc_sync_dispensary_status').on(table.dispensaryId, table.status),
]);

export const regulatoryLibrary = pgTable('regulatory_library', {
  regId: uuid('reg_id').primaryKey().defaultRandom(),
  jurisdictionLevel: varchar('jurisdiction_level', { length: 255 }),
  jurisdictionName: varchar('jurisdiction_name', { length: 255 }),
  state: varchar('state', { length: 10 }),
  statuteNumber: varchar('statute_number', { length: 255 }),
  title: varchar('title', { length: 255 }),
  summary: text('summary'),
  fullText: text('full_text'),
  effectiveDate: date('effective_date'),
  expiryDate: date('expiry_date'),
  status: varchar('status', { length: 255 }).default('active').notNull(),
  tags: jsonb('tags'),
  sourceUrl: varchar('source_url', { length: 255 }),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_regulatory_state_status').on(table.state, table.status),
]);

// ══════════════════════════════════════════════════════════════════════
// Biotrack
// ══════════════════════════════════════════════════════════════════════

export const biotrackCredentials = pgTable('biotrack_credentials', {
  credentialId: uuid('credential_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull().unique(),
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  apiSecret: varchar('api_secret', { length: 255 }),
  state: varchar('state', { length: 10 }).notNull(),
  licenseNumber: varchar('license_number', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
  validationError: text('validation_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════════
// Notifications
// ══════════════════════════════════════════════════════════════════════

export const notificationTemplates = pgTable('notification_templates', {
  templateId: serial('template_id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 10 }).default('email').notNull(),
  subject: varchar('subject', { length: 255 }),
  bodyTemplate: text('body_template').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const notificationLog = pgTable('notification_log', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  dispensaryId: uuid('dispensary_id'),
  channel: varchar('channel', { length: 10 }).notNull(),
  templateCode: varchar('template_code', { length: 50 }),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  body: text('body'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  errorMessage: text('error_message'),
  externalId: varchar('external_id', { length: 255 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_notification_log_user').on(table.userId),
]);

// ══════════════════════════════════════════════════════════════════════
// Fulfillment
// ══════════════════════════════════════════════════════════════════════

export const deliveryTimeSlots = pgTable('delivery_time_slots', {
  slotId: uuid('slot_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  slotType: varchar('slot_type', { length: 20 }).default('delivery').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxOrders: integer('max_orders').default(10),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_time_slots_dispensary').on(table.dispensaryId),
]);

export const deliveryZones = pgTable('delivery_zones', {
  zoneId: uuid('zone_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  radiusMiles: numeric('radius_miles', { precision: 6, scale: 2 }).default('5.0').notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('0').notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }),
  freeDeliveryThreshold: numeric('free_delivery_threshold', { precision: 10, scale: 2 }),
  estimatedMinutesMin: integer('estimated_minutes_min').default(30),
  estimatedMinutesMax: integer('estimated_minutes_max').default(60),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_delivery_zones_dispensary').on(table.dispensaryId),
]);

export const orderTracking = pgTable('order_tracking', {
  trackingId: uuid('tracking_id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  notes: text('notes'),
  updatedByUserId: uuid('updated_by_user_id'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_order_tracking_order').on(table.orderId),
]);

// ══════════════════════════════════════════════════════════════════════
// POS
// ══════════════════════════════════════════════════════════════════════

export const posIntegrations = pgTable('pos_integrations', {
  integrationId: uuid('integration_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull().unique(),
  provider: varchar('provider', { length: 50 }).notNull(),
  credentials: jsonb('credentials').default({}).notNull(),
  dispensaryExternalId: varchar('dispensary_external_id', { length: 255 }),
  isActive: boolean('is_active').default(false).notNull(),
  isSyncEnabled: boolean('is_sync_enabled').default(false).notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastSyncStatus: varchar('last_sync_status', { length: 50 }),
  lastSyncError: text('last_sync_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const posProductMappings = pgTable('pos_product_mappings', {
  mappingId: uuid('mapping_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  internalProductId: uuid('internal_product_id').notNull(),
  internalVariantId: uuid('internal_variant_id'),
  externalProductId: varchar('external_product_id', { length: 255 }).notNull(),
  externalVariantId: varchar('external_variant_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).notNull(),
  matchMethod: varchar('match_method', { length: 50 }),
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_pos_mappings_unique').on(table.dispensaryId, table.externalProductId, table.provider),
]);

export const posSyncLogs = pgTable('pos_sync_logs', {
  syncLogId: uuid('sync_log_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  syncType: varchar('sync_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  itemsProcessed: integer('items_processed').default(0).notNull(),
  itemsCreated: integer('items_created').default(0).notNull(),
  itemsUpdated: integer('items_updated').default(0).notNull(),
  itemsFailed: integer('items_failed').default(0).notNull(),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_pos_sync_dispensary_created').on(table.dispensaryId, table.createdAt),
]);

// ══════════════════════════════════════════════════════════════════════
// Product Data (strain enrichment)
// ══════════════════════════════════════════════════════════════════════

export const strainData = pgTable('strain_data', {
  strainDataId: uuid('strain_data_id').primaryKey().defaultRandom(),
  ocpc: varchar('ocpc', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }),
  description: text('description'),
  effects: jsonb('effects').default([]).notNull(),
  flavors: jsonb('flavors').default([]).notNull(),
  terpenes: jsonb('terpenes').default([]).notNull(),
  lineage: jsonb('lineage').default({}).notNull(),
  genetics: varchar('genetics', { length: 500 }),
  thcAvg: numeric('thc_avg', { precision: 6, scale: 3 }),
  cbdAvg: numeric('cbd_avg', { precision: 6, scale: 3 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  source: varchar('source', { length: 50 }).default('otreeba'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_strain_data_name').on(table.name),
  index('idx_strain_data_type').on(table.type),
]);

// ══════════════════════════════════════════════════════════════════════
// Promotions
// ══════════════════════════════════════════════════════════════════════

export const promotions = pgTable('promotions', {
  promoId: uuid('promo_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  code: varchar('code', { length: 50 }),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0').notNull(),
  minimumOrderTotal: numeric('minimum_order_total', { precision: 10, scale: 2 }),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').default(0).notNull(),
  maxUsesPerCustomer: integer('max_uses_per_customer'),
  appliesTo: varchar('applies_to', { length: 50 }),
  appliesToProductTypeId: integer('applies_to_product_type_id'),
  appliesToBrandId: uuid('applies_to_brand_id'),
  appliesToTaxCategoryId: integer('applies_to_tax_category_id'),
  stackableWithOthers: boolean('stackable_with_others').default(false).notNull(),
  isStaffDiscount: boolean('is_staff_discount').default(false).notNull(),
  isMedicalDiscount: boolean('is_medical_discount').default(false).notNull(),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_promotions_dispensary').on(table.dispensaryId),
  index('idx_promotions_dispensary_active').on(table.dispensaryId, table.isActive),
]);

export const promotionCategories = pgTable('promotion_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  promoId: uuid('promo_id').notNull(),
  categoryId: integer('category_id').notNull(),
  isEligible: boolean('is_eligible').default(true).notNull(),
}, (table) => [
  index('idx_promo_categories_promo').on(table.promoId),
]);

export const promotionProducts = pgTable('promotion_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  promoId: uuid('promo_id').notNull(),
  productId: uuid('product_id'),
  variantId: uuid('variant_id'),
  isEligible: boolean('is_eligible').default(true).notNull(),
}, (table) => [
  index('idx_promo_products_promo').on(table.promoId),
]);

// ══════════════════════════════════════════════════════════════════════
// Scheduling
// ══════════════════════════════════════════════════════════════════════

export const shiftTemplates = pgTable('shift_templates', {
  templateId: uuid('template_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  positionId: integer('position_id'),
  minStaff: integer('min_staff').default(1).notNull(),
  maxStaff: integer('max_staff').default(3).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => [
  index('idx_shift_templates_dispensary').on(table.dispensaryId),
]);

export const scheduledShifts = pgTable('scheduled_shifts', {
  shiftId: uuid('shift_id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull(),
  profileId: uuid('profile_id').notNull(),
  templateId: uuid('template_id'),
  shiftDate: date('shift_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  status: varchar('status', { length: 20 }).default('scheduled').notNull(),
  notes: text('notes'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_scheduled_shifts_dispensary').on(table.dispensaryId),
  index('idx_scheduled_shifts_profile').on(table.profileId),
]);

export const shiftSwapRequests = pgTable('shift_swap_requests', {
  swapId: uuid('swap_id').primaryKey().defaultRandom(),
  originalShiftId: uuid('original_shift_id').notNull(),
  requestingProfileId: uuid('requesting_profile_id').notNull(),
  coveringProfileId: uuid('covering_profile_id'),
  status: varchar('status', { length: 20 }).default('open').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const timeOffRequests = pgTable('time_off_requests', {
  requestId: uuid('request_id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  requestType: varchar('request_type', { length: 20 }).default('pto').notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const driverProfiles = pgTable('driver_profiles', {
  driverId: uuid('driver_id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().unique(),
  dispensaryId: uuid('dispensary_id').notNull(),
  vehicleMake: varchar('vehicle_make', { length: 50 }),
  vehicleModel: varchar('vehicle_model', { length: 50 }),
  vehicleYear: integer('vehicle_year'),
  vehicleColor: varchar('vehicle_color', { length: 30 }),
  licensePlate: varchar('license_plate', { length: 15 }),
  insuranceProvider: varchar('insurance_provider', { length: 100 }),
  insuranceExpiry: date('insurance_expiry'),
  maxDeliveriesPerHour: integer('max_deliveries_per_hour').default(3).notNull(),
  status: varchar('status', { length: 20 }).default('available').notNull(),
  currentLatitude: numeric('current_latitude', { precision: 10, scale: 7 }),
  currentLongitude: numeric('current_longitude', { precision: 10, scale: 7 }),
  lastLocationUpdate: timestamp('last_location_update', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_driver_profiles_dispensary').on(table.dispensaryId),
]);

export const deliveryTrips = pgTable('delivery_trips', {
  tripId: uuid('trip_id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  orderId: uuid('order_id'),
  status: varchar('status', { length: 20 }).default('assigned').notNull(),
  departedAt: timestamp('departed_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  deliveryAddress: text('delivery_address'),
  distanceMiles: numeric('distance_miles', { precision: 6, scale: 2 }),
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),
  customerRating: integer('customer_rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_delivery_trips_driver').on(table.driverId),
]);

// ══════════════════════════════════════════════════════════════════════
// Staffing
// ══════════════════════════════════════════════════════════════════════

export const employeeProfiles = pgTable('employee_profiles', {
  profileId: uuid('profile_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  dispensaryId: uuid('dispensary_id').notNull(),
  positionId: integer('position_id'),
  employeeNumber: varchar('employee_number', { length: 20 }),
  department: varchar('department', { length: 50 }),
  employmentType: varchar('employment_type', { length: 20 }).default('full_time').notNull(),
  employmentStatus: varchar('employment_status', { length: 20 }).default('active').notNull(),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  terminationReason: text('termination_reason'),
  hourlyRate: numeric('hourly_rate', { precision: 8, scale: 2 }),
  salary: numeric('salary', { precision: 10, scale: 2 }),
  payType: varchar('pay_type', { length: 10 }).default('hourly').notNull(),
  overtimeEligible: boolean('overtime_eligible').default(true).notNull(),
  phone: varchar('phone', { length: 20 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),
  isExempt: boolean('is_exempt').default(false).notNull(),
  exemptReason: varchar('exempt_reason', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_employee_profiles_dispensary').on(table.dispensaryId),
  index('idx_employee_profiles_status').on(table.employmentStatus),
]);

export const employeeCertifications = pgTable('employee_certifications', {
  certificationId: uuid('certification_id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  certTypeId: integer('cert_type_id').notNull(),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  issuedDate: date('issued_date'),
  expirationDate: date('expiration_date'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  verifiedByUserId: uuid('verified_by_user_id'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  documentUrl: varchar('document_url', { length: 500 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_employee_certs_profile').on(table.profileId),
]);

export const performanceReviews = pgTable('performance_reviews', {
  reviewId: uuid('review_id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  reviewerUserId: uuid('reviewer_user_id').notNull(),
  reviewPeriodStart: date('review_period_start').notNull(),
  reviewPeriodEnd: date('review_period_end').notNull(),
  overallRating: integer('overall_rating'),
  salesRating: integer('sales_rating'),
  complianceRating: integer('compliance_rating'),
  teamworkRating: integer('teamwork_rating'),
  reliabilityRating: integer('reliability_rating'),
  strengths: text('strengths'),
  areasForImprovement: text('areas_for_improvement'),
  goals: text('goals'),
  managerComments: text('manager_comments'),
  employeeComments: text('employee_comments'),
  status: varchar('status', { length: 20 }).default('draft').notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_performance_reviews_profile').on(table.profileId),
]);

// ══════════════════════════════════════════════════════════════════════
// Timeclock
// ══════════════════════════════════════════════════════════════════════

export const timeEntries = pgTable('time_entries', {
  entryId: uuid('entry_id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull(),
  dispensaryId: uuid('dispensary_id').notNull(),
  clockIn: timestamp('clock_in', { withTimezone: true }).notNull(),
  clockOut: timestamp('clock_out', { withTimezone: true }),
  breakMinutes: integer('break_minutes').default(0).notNull(),
  totalHours: numeric('total_hours', { precision: 6, scale: 2 }),
  overtimeHours: numeric('overtime_hours', { precision: 6, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).default('clocked_in').notNull(),
  notes: text('notes'),
  approvedByUserId: uuid('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_time_entries_profile').on(table.profileId),
  index('idx_time_entries_dispensary').on(table.dispensaryId),
]);

// ══════════════════════════════════════════════════════════════════════
// Theme
// ══════════════════════════════════════════════════════════════════════

export const themeConfigs = pgTable('theme_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dispensaryId: uuid('dispensary_id').notNull().unique(),
  preset: varchar('preset', { length: 255 }).default('casual').notNull(),
  primary: varchar('primary', { length: 255 }).default('#2d6a4f').notNull(),
  secondary: varchar('secondary', { length: 255 }).default('#74956c').notNull(),
  accent: varchar('accent', { length: 255 }).default('#c47820').notNull(),
  bgPrimary: varchar('bg_primary', { length: 255 }).default('#faf6f0').notNull(),
  bgSecondary: varchar('bg_secondary', { length: 255 }).default('#f0ebe3').notNull(),
  bgCard: varchar('bg_card', { length: 255 }).default('#ffffff').notNull(),
  textPrimary: varchar('text_primary', { length: 255 }).default('#2c2418').notNull(),
  textSecondary: varchar('text_secondary', { length: 255 }).default('#6b5e4f').notNull(),
  sidebarBg: varchar('sidebar_bg', { length: 255 }).default('#1b3a2a').notNull(),
  sidebarText: varchar('sidebar_text', { length: 255 }).default('#c8d8c4').notNull(),
  success: varchar('color_success', { length: 255 }).default('#27ae60').notNull(),
  warning: varchar('color_warning', { length: 255 }).default('#d97706').notNull(),
  error: varchar('color_error', { length: 255 }).default('#c0392b').notNull(),
  info: varchar('color_info', { length: 255 }).default('#2e86ab').notNull(),
  isDark: boolean('is_dark').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ══════════════════════════════════════════════════════════════════════
// Staffing Lookups
// ══════════════════════════════════════════════════════════════════════

export const lkpPositions = pgTable('lkp_positions', {
  positionId: serial('position_id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  department: varchar('department', { length: 50 }).default('operations').notNull(),
  isManagement: boolean('is_management').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpCertificationTypes = pgTable('lkp_certification_types', {
  certTypeId: serial('cert_type_id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  issuingAuthority: varchar('issuing_authority', { length: 200 }),
  validityMonths: integer('validity_months'),
  isStateRequired: boolean('is_state_required').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// ══════════════════════════════════════════════════════════════════════
// Product Lookups
// ══════════════════════════════════════════════════════════════════════

export const lkpProductTypes = pgTable('lkp_product_types', {
  productTypeId: serial('product_type_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  requiresLabTest: boolean('requires_lab_test').default(false).notNull(),
  requiresServingInfo: boolean('requires_serving_info').default(false).notNull(),
  requiresIngredientList: boolean('requires_ingredient_list').default(false).notNull(),
  requiresExtractionMethod: boolean('requires_extraction_method').default(false).notNull(),
  isInhalable: boolean('is_inhalable').default(false).notNull(),
  isIngestible: boolean('is_ingestible').default(false).notNull(),
  metrcDefaultCategoryCode: varchar('metrc_default_category_code', { length: 100 }),
  hempEligible: boolean('hemp_eligible').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpProductCategories = pgTable('lkp_product_categories', {
  categoryId: serial('category_id').primaryKey(),
  parentCategoryId: integer('parent_category_id'),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  depth: integer('depth').default(0).notNull(),
  metrcCategoryCode: varchar('metrc_category_code', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpUnitOfMeasure = pgTable('lkp_unit_of_measure', {
  uomId: serial('uom_id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  uomType: varchar('uom_type', { length: 20 }).notNull(),
  isMetrcSupported: boolean('is_metrc_supported').default(false).notNull(),
  metrcCode: varchar('metrc_code', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpPackagingTypes = pgTable('lkp_packaging_types', {
  packagingTypeId: serial('packaging_type_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isChildResistant: boolean('is_child_resistant').default(false).notNull(),
  isTamperEvident: boolean('is_tamper_evident').default(false).notNull(),
  isResealable: boolean('is_resealable').default(false).notNull(),
  isOpaque: boolean('is_opaque').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpExtractionMethods = pgTable('lkp_extraction_methods', {
  extractionMethodId: serial('extraction_method_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  usesSolvent: boolean('uses_solvent').default(false).notNull(),
  solventType: varchar('solvent_type', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpEffects = pgTable('lkp_effects', {
  effectId: serial('effect_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  effectCategory: varchar('effect_category', { length: 50 }),
  isMedicalClaim: boolean('is_medical_claim').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpFlavors = pgTable('lkp_flavors', {
  flavorId: serial('flavor_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  flavorFamily: varchar('flavor_family', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpTerpenes = pgTable('lkp_terpenes', {
  terpeneId: serial('terpene_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  aroma: text('aroma'),
  potentialEffects: text('potential_effects'),
  boilingPointCelsius: numeric('boiling_point_celsius', { precision: 5, scale: 1 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const lkpCannabinoids = pgTable('lkp_cannabinoids', {
  cannabinoidId: serial('cannabinoid_id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 20 }),
  isPsychoactive: boolean('is_psychoactive').default(false).notNull(),
  isHempRestricted: boolean('is_hemp_restricted').default(false).notNull(),
  isScheduled: boolean('is_scheduled').default(false).notNull(),
  schedule: varchar('schedule', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpAllergens = pgTable('lkp_allergens', {
  allergenId: serial('allergen_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isFdaMajor: boolean('is_fda_major').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpLabTestCategories = pgTable('lkp_lab_test_categories', {
  testCategoryId: serial('test_category_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  appliesToProductTypes: text('applies_to_product_types'),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpTaxCategories = pgTable('lkp_tax_categories', {
  taxCategoryId: serial('tax_category_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  state: varchar('state', { length: 10 }),
  name: varchar('name', { length: 100 }).notNull(),
  taxBasis: varchar('tax_basis', { length: 20 }).notNull(),
  rate: numeric('rate', { precision: 6, scale: 4 }).default('0').notNull(),
  effectiveDate: date('effective_date'),
  statutoryReference: varchar('statutory_reference', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpMetrcItemCategories = pgTable('lkp_metrc_item_categories', {
  metrcCategoryId: serial('metrc_category_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  state: varchar('state', { length: 10 }),
  name: varchar('name', { length: 100 }).notNull(),
  productTypeCode: varchar('product_type_code', { length: 100 }),
  requiresUnitWeight: boolean('requires_unit_weight').default(false).notNull(),
  effectiveDate: date('effective_date'),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpMetrcAdjustmentReasons = pgTable('lkp_metrc_adjustment_reasons', {
  adjustmentReasonId: serial('adjustment_reason_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  state: varchar('state', { length: 10 }),
  name: varchar('name', { length: 255 }).notNull(),
  reasonCategory: varchar('reason_category', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const lkpWarningStatements = pgTable('lkp_warning_statements', {
  warningId: serial('warning_id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  jurisdiction: varchar('jurisdiction', { length: 5 }).notNull(),
  statementText: text('statement_text').notNull(),
  appliesToProductTypes: text('applies_to_product_types'),
  appliesToLicenseType: varchar('applies_to_license_type', { length: 50 }),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  effectiveDate: date('effective_date'),
  statutoryReference: varchar('statutory_reference', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
});
