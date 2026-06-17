// Barrel of every TypeORM entity in apps/api. Built to replace the
// runtime glob (`entities: [__dirname + '/../**/*.entity{.ts,.js}']`)
// in DatabaseModule + AppDataSource — the glob ran a CJS
// `require('./foo.entity.ts')` at startup, which works under ts-jest
// but trips Vitest's loader (`SyntaxError: Invalid or unexpected
// token`). Explicit imports go through the bundler's resolution
// graph and "just work" in both runners.
//
// AUTO-DERIVED on the tech-debt #11 close PR. If you add a new
// `.entity.ts` file, append its exports here. A naming-convention
// guard already catches drift between entity property names and
// snake_cased DB columns; an entities-completeness guard lives in
// `test/integration/entities-barrel.e2e-spec.ts` and fails CI if
// any `.entity.ts` file is missing from this barrel.

export { KioskDevice } from './modules/auth/entities/kiosk-device.entity';
export { RefreshToken } from './modules/auth/entities/refresh-token.entity';
export { BiotrackCredential } from './modules/biotrack/entities/biotrack-credential.entity';
export { Brand } from './modules/brands/entities/brand.entity';
export { Company } from './modules/companies/entities/company.entity';
export {
  MetrcManifest,
  MetrcManifestItem,
  WasteDestructionLog,
  AuditLog,
  ReconciliationReport,
  ReconciliationItem,
} from './modules/compliance/entities/compliance.entity';
export {
  CustomerProfile,
  CustomerAddress,
  AgeVerification,
} from './modules/customers/entities/customer.entity';
export { Dispensary } from './modules/dispensaries/entities/dispensary.entity';
export { DeliveryTimeSlot } from './modules/fulfillment/entities/delivery-time-slot.entity';
export { DeliveryZone } from './modules/fulfillment/entities/delivery-zone.entity';
export { OrderTracking } from './modules/fulfillment/entities/order-tracking.entity';
export { InventoryTransaction } from './modules/inventory/entities/inventory-transaction.entity';
export { Inventory } from './modules/inventory/entities/inventory.entity';
export {
  InventoryTransfer,
  InventoryTransferItem,
  InventoryCount,
  InventoryCountItem,
  InventoryAdjustment,
  LkpAdjustmentReason,
} from './modules/inventory-control/entities/inventory-control.entity';
export { Manufacturer } from './modules/manufacturers/entities/manufacturer.entity';
export { ComplianceLog } from './modules/metrc/entities/compliance-log.entity';
export { MetrcCredential } from './modules/metrc/entities/metrc-credential.entity';
export { MetrcSyncLog } from './modules/metrc/entities/metrc-sync-log.entity';
export { RegulatoryLibrary } from './modules/metrc/entities/regulatory-library.entity';
export {
  NotificationTemplate,
  NotificationLog,
} from './modules/notifications/entities/notification.entity';
export { OrderLineItem } from './modules/orders/entities/order-line-item.entity';
export { Order } from './modules/orders/entities/order.entity';
export { Organization } from './modules/organizations/entities/organization.entity';
export { DispensaryPaymentProcessor } from './modules/payments/entities/dispensary-payment-processor.entity';
export { Payment } from './modules/payments/entities/payment.entity';
export { PosIntegration } from './modules/pos/entities/pos-integration.entity';
export { PosProductMapping } from './modules/pos/entities/pos-product-mapping.entity';
export { PosSyncLog } from './modules/pos/entities/pos-sync-log.entity';
export { StrainData } from './modules/product-data/entities/strain-data.entity';
export {
  LabTest,
  LabTestResult,
} from './modules/products/entities/lab-test.entity';
export {
  LkpProductType,
  LkpProductCategory,
  LkpUnitOfMeasure,
  LkpPackagingType,
  LkpExtractionMethod,
  LkpEffect,
  LkpFlavor,
  LkpTerpene,
  LkpCannabinoid,
  LkpAllergen,
  LkpLabTestCategory,
  LkpTaxCategory,
  LkpMetrcItemCategory,
  LkpMetrcAdjustmentReason,
  LkpWarningStatement,
} from './modules/products/entities/lookups/lookups.entity';
export { ProductBatch } from './modules/products/entities/product-batch.entity';
export { ProductPricing } from './modules/products/entities/product-pricing.entity';
export { ProductVariant } from './modules/products/entities/product-variant.entity';
export { Product } from './modules/products/entities/product.entity';
export { PromotionCategory } from './modules/promotions/entities/promotion-category.entity';
export { PromotionProduct } from './modules/promotions/entities/promotion-product.entity';
export { Promotion } from './modules/promotions/entities/promotion.entity';
export { RegisterSession } from './modules/register-sessions/entities/register-session.entity';
export {
  ShiftTemplate,
  ScheduledShift,
  ShiftSwapRequest,
  TimeOffRequest,
  DriverProfile,
  DeliveryTrip,
} from './modules/scheduling/entities/scheduling.entity';
export { EmployeeCertification } from './modules/staffing/entities/employee-certification.entity';
export { EmployeeProfile } from './modules/staffing/entities/employee-profile.entity';
export { PerformanceReview } from './modules/staffing/entities/performance-review.entity';
export {
  LkpPosition,
  LkpCertificationType,
} from './modules/staffing/entities/staffing-lookups.entity';
export { ThemeConfig } from './modules/theme/theme-config.entity';
export { TimeEntry } from './modules/timeclock/entities/time-entry.entity';
export { User } from './modules/users/entities/user.entity';

// Re-import every name as a local reference so we can build the
// `ALL_ENTITIES` array statically. Tried the `Object.values(require(
// './entities.index'))` self-reflection trick first — it works under
// Node/tsc but Vitest's resolver can't satisfy the `.ts` extension
// inside a `require()` call. Explicit list is more verbose but works
// in every runner without ceremony.
import { KioskDevice } from './modules/auth/entities/kiosk-device.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { BiotrackCredential } from './modules/biotrack/entities/biotrack-credential.entity';
import { Brand } from './modules/brands/entities/brand.entity';
import { Company } from './modules/companies/entities/company.entity';
import {
  MetrcManifest,
  MetrcManifestItem,
  WasteDestructionLog,
  AuditLog,
  ReconciliationReport,
  ReconciliationItem,
} from './modules/compliance/entities/compliance.entity';
import {
  CustomerProfile,
  CustomerAddress,
  AgeVerification,
} from './modules/customers/entities/customer.entity';
import { Dispensary } from './modules/dispensaries/entities/dispensary.entity';
import { DeliveryTimeSlot } from './modules/fulfillment/entities/delivery-time-slot.entity';
import { DeliveryZone } from './modules/fulfillment/entities/delivery-zone.entity';
import { OrderTracking } from './modules/fulfillment/entities/order-tracking.entity';
import { InventoryTransaction } from './modules/inventory/entities/inventory-transaction.entity';
import { Inventory } from './modules/inventory/entities/inventory.entity';
import {
  InventoryTransfer,
  InventoryTransferItem,
  InventoryCount,
  InventoryCountItem,
  InventoryAdjustment,
  LkpAdjustmentReason,
} from './modules/inventory-control/entities/inventory-control.entity';
import { Manufacturer } from './modules/manufacturers/entities/manufacturer.entity';
import { ComplianceLog } from './modules/metrc/entities/compliance-log.entity';
import { MetrcCredential } from './modules/metrc/entities/metrc-credential.entity';
import { MetrcSyncLog } from './modules/metrc/entities/metrc-sync-log.entity';
import { RegulatoryLibrary } from './modules/metrc/entities/regulatory-library.entity';
import {
  NotificationTemplate,
  NotificationLog,
} from './modules/notifications/entities/notification.entity';
import { OrderLineItem } from './modules/orders/entities/order-line-item.entity';
import { Order } from './modules/orders/entities/order.entity';
import { Organization } from './modules/organizations/entities/organization.entity';
import { DispensaryPaymentProcessor } from './modules/payments/entities/dispensary-payment-processor.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { PosIntegration } from './modules/pos/entities/pos-integration.entity';
import { PosProductMapping } from './modules/pos/entities/pos-product-mapping.entity';
import { PosSyncLog } from './modules/pos/entities/pos-sync-log.entity';
import { StrainData } from './modules/product-data/entities/strain-data.entity';
import {
  LabTest,
  LabTestResult,
} from './modules/products/entities/lab-test.entity';
import {
  LkpProductType,
  LkpProductCategory,
  LkpUnitOfMeasure,
  LkpPackagingType,
  LkpExtractionMethod,
  LkpEffect,
  LkpFlavor,
  LkpTerpene,
  LkpCannabinoid,
  LkpAllergen,
  LkpLabTestCategory,
  LkpTaxCategory,
  LkpMetrcItemCategory,
  LkpMetrcAdjustmentReason,
  LkpWarningStatement,
} from './modules/products/entities/lookups/lookups.entity';
import { ProductBatch } from './modules/products/entities/product-batch.entity';
import { ProductPricing } from './modules/products/entities/product-pricing.entity';
import { ProductVariant } from './modules/products/entities/product-variant.entity';
import { Product } from './modules/products/entities/product.entity';
import { PromotionCategory } from './modules/promotions/entities/promotion-category.entity';
import { PromotionProduct } from './modules/promotions/entities/promotion-product.entity';
import { Promotion } from './modules/promotions/entities/promotion.entity';
import { RegisterSession } from './modules/register-sessions/entities/register-session.entity';
import {
  ShiftTemplate,
  ScheduledShift,
  ShiftSwapRequest,
  TimeOffRequest,
  DriverProfile,
  DeliveryTrip,
} from './modules/scheduling/entities/scheduling.entity';
import { EmployeeCertification } from './modules/staffing/entities/employee-certification.entity';
import { EmployeeProfile } from './modules/staffing/entities/employee-profile.entity';
import { PerformanceReview } from './modules/staffing/entities/performance-review.entity';
import {
  LkpPosition,
  LkpCertificationType,
} from './modules/staffing/entities/staffing-lookups.entity';
import { ThemeConfig } from './modules/theme/theme-config.entity';
import { TimeEntry } from './modules/timeclock/entities/time-entry.entity';
import { User } from './modules/users/entities/user.entity';

/**
 * Every TypeORM entity class in the API, suitable for direct use as
 * the `entities:` array in a DataSource / TypeOrmModule config.
 */
export const ALL_ENTITIES = [
  KioskDevice,
  RefreshToken,
  BiotrackCredential,
  Brand,
  Company,
  MetrcManifest,
  MetrcManifestItem,
  WasteDestructionLog,
  AuditLog,
  ReconciliationReport,
  ReconciliationItem,
  CustomerProfile,
  CustomerAddress,
  AgeVerification,
  Dispensary,
  DeliveryTimeSlot,
  DeliveryZone,
  OrderTracking,
  InventoryTransaction,
  Inventory,
  InventoryTransfer,
  InventoryTransferItem,
  InventoryCount,
  InventoryCountItem,
  InventoryAdjustment,
  LkpAdjustmentReason,
  Manufacturer,
  ComplianceLog,
  MetrcCredential,
  MetrcSyncLog,
  RegulatoryLibrary,
  NotificationTemplate,
  NotificationLog,
  OrderLineItem,
  Order,
  Organization,
  DispensaryPaymentProcessor,
  Payment,
  PosIntegration,
  PosProductMapping,
  PosSyncLog,
  StrainData,
  LabTest,
  LabTestResult,
  LkpProductType,
  LkpProductCategory,
  LkpUnitOfMeasure,
  LkpPackagingType,
  LkpExtractionMethod,
  LkpEffect,
  LkpFlavor,
  LkpTerpene,
  LkpCannabinoid,
  LkpAllergen,
  LkpLabTestCategory,
  LkpTaxCategory,
  LkpMetrcItemCategory,
  LkpMetrcAdjustmentReason,
  LkpWarningStatement,
  ProductBatch,
  ProductPricing,
  ProductVariant,
  Product,
  PromotionCategory,
  PromotionProduct,
  Promotion,
  RegisterSession,
  ShiftTemplate,
  ScheduledShift,
  ShiftSwapRequest,
  TimeOffRequest,
  DriverProfile,
  DeliveryTrip,
  EmployeeCertification,
  EmployeeProfile,
  PerformanceReview,
  LkpPosition,
  LkpCertificationType,
  ThemeConfig,
  TimeEntry,
  User,
];
