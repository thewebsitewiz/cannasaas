import { relations } from 'drizzle-orm';
import {
  organizations,
  companies,
  dispensaries,
  users,
  refreshTokens,
  brands,
  manufacturers,
  products,
  productVariants,
  productPricing,
  productBatches,
  labTests,
  labTestResults,
  orders,
  orderLineItems,
  payments,
  inventory,
  inventoryTransactions,
  inventoryTransfers,
  inventoryTransferItems,
  inventoryCounts,
  inventoryCountItems,
  inventoryAdjustments,
  metrcManifests,
  metrcManifestItems,
  metrcCredentials,
  metrcSyncLogs,
  complianceLogs,
  reconciliationReports,
  reconciliationItems,
  customerProfiles,
  customerAddresses,
  promotions,
  promotionCategories,
  promotionProducts,
  employeeProfiles,
  employeeCertifications,
  performanceReviews,
  timeEntries,
  scheduledShifts,
  shiftTemplates,
  shiftSwapRequests,
  timeOffRequests,
  driverProfiles,
  deliveryTrips,
  deliveryTimeSlots,
  deliveryZones,
  orderTracking,
  posIntegrations,
  posProductMappings,
  posSyncLogs,
  notificationLog,
  themeConfigs,
  biotrackCredentials,
} from './schema';

// ── Organizations ───────────────────────────────────────────────────
export const organizationsRelations = relations(organizations, ({ many }) => ({
  companies: many(companies),
}));

// ── Companies ───────────────────────────────────────────────────────
export const companiesRelations = relations(companies, ({ one, many }) => ({
  organization: one(organizations, { fields: [companies.organizationId], references: [organizations.organizationId] }),
  dispensaries: many(dispensaries),
}));

// ── Dispensaries ────────────────────────────────────────────────────
export const dispensariesRelations = relations(dispensaries, ({ one, many }) => ({
  company: one(companies, { fields: [dispensaries.companyId], references: [companies.companyId] }),
  products: many(products),
  orders: many(orders),
  inventory: many(inventory),
  employeeProfiles: many(employeeProfiles),
  metrcCredential: one(metrcCredentials, { fields: [dispensaries.entityId], references: [metrcCredentials.dispensaryId] }),
  biotrackCredential: one(biotrackCredentials, { fields: [dispensaries.entityId], references: [biotrackCredentials.dispensaryId] }),
  posIntegration: one(posIntegrations, { fields: [dispensaries.entityId], references: [posIntegrations.dispensaryId] }),
  themeConfig: one(themeConfigs, { fields: [dispensaries.entityId], references: [themeConfigs.dispensaryId] }),
  deliveryTimeSlots: many(deliveryTimeSlots),
  deliveryZones: many(deliveryZones),
  complianceLogs: many(complianceLogs),
  metrcSyncLogs: many(metrcSyncLogs),
}));

// ── Users ───────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  refreshTokens: many(refreshTokens),
  customerProfile: one(customerProfiles, { fields: [users.id], references: [customerProfiles.userId] }),
  employeeProfile: one(employeeProfiles, { fields: [users.id], references: [employeeProfiles.userId] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ── Brands & Manufacturers ─────────────────────────────────────────
export const brandsRelations = relations(brands, ({ one, many }) => ({
  organization: one(organizations, { fields: [brands.organizationId], references: [organizations.organizationId] }),
  manufacturers: many(manufacturers),
}));

export const manufacturersRelations = relations(manufacturers, ({ one }) => ({
  brand: one(brands, { fields: [manufacturers.brandId], references: [brands.brandId] }),
}));

// ── Products ────────────────────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
  dispensary: one(dispensaries, { fields: [products.dispensaryId], references: [dispensaries.entityId] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.brandId] }),
  manufacturer: one(manufacturers, { fields: [products.manufacturerId], references: [manufacturers.manufacturerId] }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  pricing: many(productPricing),
  batches: many(productBatches),
  inventoryRecords: many(inventory),
}));

export const productPricingRelations = relations(productPricing, ({ one }) => ({
  variant: one(productVariants, { fields: [productPricing.variantId], references: [productVariants.variantId] }),
}));

export const productBatchesRelations = relations(productBatches, ({ one, many }) => ({
  variant: one(productVariants, { fields: [productBatches.variantId], references: [productVariants.variantId] }),
  labTests: many(labTests),
}));

export const labTestsRelations = relations(labTests, ({ one, many }) => ({
  batch: one(productBatches, { fields: [labTests.batchId], references: [productBatches.batchId] }),
  results: many(labTestResults),
}));

export const labTestResultsRelations = relations(labTestResults, ({ one }) => ({
  labTest: one(labTests, { fields: [labTestResults.labTestId], references: [labTests.labTestId] }),
}));

// ── Orders ──────────────────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  dispensary: one(dispensaries, { fields: [orders.dispensaryId], references: [dispensaries.entityId] }),
  customer: one(users, { fields: [orders.customerUserId], references: [users.id] }),
  lineItems: many(orderLineItems),
  payments: many(payments),
  tracking: many(orderTracking),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one }) => ({
  order: one(orders, { fields: [orderLineItems.orderId], references: [orders.orderId] }),
  product: one(products, { fields: [orderLineItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [orderLineItems.variantId], references: [productVariants.variantId] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.orderId] }),
}));

// ── Inventory ───────────────────────────────────────────────────────
export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  variant: one(productVariants, { fields: [inventory.variantId], references: [productVariants.variantId] }),
  dispensary: one(dispensaries, { fields: [inventory.dispensaryId], references: [dispensaries.entityId] }),
  transactions: many(inventoryTransactions),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventory: one(inventory, { fields: [inventoryTransactions.inventoryId], references: [inventory.inventoryId] }),
}));

// ── Inventory Control ───────────────────────────────────────────────
export const inventoryTransfersRelations = relations(inventoryTransfers, ({ many }) => ({
  items: many(inventoryTransferItems),
}));

export const inventoryTransferItemsRelations = relations(inventoryTransferItems, ({ one }) => ({
  transfer: one(inventoryTransfers, { fields: [inventoryTransferItems.transferId], references: [inventoryTransfers.transferId] }),
}));

export const inventoryCountsRelations = relations(inventoryCounts, ({ many }) => ({
  items: many(inventoryCountItems),
}));

export const inventoryCountItemsRelations = relations(inventoryCountItems, ({ one }) => ({
  count: one(inventoryCounts, { fields: [inventoryCountItems.countId], references: [inventoryCounts.countId] }),
}));

// ── Customers ───────────────────────────────────────────────────────
export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  user: one(users, { fields: [customerProfiles.userId], references: [users.id] }),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  user: one(users, { fields: [customerAddresses.userId], references: [users.id] }),
}));

// ── Compliance / Metrc ──────────────────────────────────────────────
export const metrcManifestsRelations = relations(metrcManifests, ({ many }) => ({
  items: many(metrcManifestItems),
}));

export const metrcManifestItemsRelations = relations(metrcManifestItems, ({ one }) => ({
  manifest: one(metrcManifests, { fields: [metrcManifestItems.manifestId], references: [metrcManifests.manifestId] }),
}));

export const reconciliationReportsRelations = relations(reconciliationReports, ({ many }) => ({
  items: many(reconciliationItems),
}));

export const reconciliationItemsRelations = relations(reconciliationItems, ({ one }) => ({
  report: one(reconciliationReports, { fields: [reconciliationItems.reportId], references: [reconciliationReports.reportId] }),
}));

export const metrcSyncLogsRelations = relations(metrcSyncLogs, ({ one }) => ({
  credential: one(metrcCredentials, { fields: [metrcSyncLogs.credentialId], references: [metrcCredentials.credentialId] }),
  dispensary: one(dispensaries, { fields: [metrcSyncLogs.dispensaryId], references: [dispensaries.entityId] }),
}));

export const complianceLogsRelations = relations(complianceLogs, ({ one }) => ({
  dispensary: one(dispensaries, { fields: [complianceLogs.dispensaryId], references: [dispensaries.entityId] }),
}));

// ── Promotions ──────────────────────────────────────────────────────
export const promotionsRelations = relations(promotions, ({ many }) => ({
  categories: many(promotionCategories),
  products: many(promotionProducts),
}));

export const promotionCategoriesRelations = relations(promotionCategories, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionCategories.promoId], references: [promotions.promoId] }),
}));

export const promotionProductsRelations = relations(promotionProducts, ({ one }) => ({
  promotion: one(promotions, { fields: [promotionProducts.promoId], references: [promotions.promoId] }),
}));

// ── Staffing ────────────────────────────────────────────────────────
export const employeeProfilesRelations = relations(employeeProfiles, ({ one, many }) => ({
  user: one(users, { fields: [employeeProfiles.userId], references: [users.id] }),
  dispensary: one(dispensaries, { fields: [employeeProfiles.dispensaryId], references: [dispensaries.entityId] }),
  certifications: many(employeeCertifications),
  performanceReviews: many(performanceReviews),
  timeEntries: many(timeEntries),
  scheduledShifts: many(scheduledShifts),
}));

export const employeeCertificationsRelations = relations(employeeCertifications, ({ one }) => ({
  profile: one(employeeProfiles, { fields: [employeeCertifications.profileId], references: [employeeProfiles.profileId] }),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one }) => ({
  profile: one(employeeProfiles, { fields: [performanceReviews.profileId], references: [employeeProfiles.profileId] }),
}));

// ── Timeclock ───────────────────────────────────────────────────────
export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  profile: one(employeeProfiles, { fields: [timeEntries.profileId], references: [employeeProfiles.profileId] }),
}));

// ── Scheduling ──────────────────────────────────────────────────────
export const scheduledShiftsRelations = relations(scheduledShifts, ({ one }) => ({
  profile: one(employeeProfiles, { fields: [scheduledShifts.profileId], references: [employeeProfiles.profileId] }),
  template: one(shiftTemplates, { fields: [scheduledShifts.templateId], references: [shiftTemplates.templateId] }),
  dispensary: one(dispensaries, { fields: [scheduledShifts.dispensaryId], references: [dispensaries.entityId] }),
}));

export const shiftSwapRequestsRelations = relations(shiftSwapRequests, ({ one }) => ({
  originalShift: one(scheduledShifts, { fields: [shiftSwapRequests.originalShiftId], references: [scheduledShifts.shiftId] }),
}));

// ── Fulfillment ─────────────────────────────────────────────────────
export const orderTrackingRelations = relations(orderTracking, ({ one }) => ({
  order: one(orders, { fields: [orderTracking.orderId], references: [orders.orderId] }),
}));

export const deliveryTimeSlotsRelations = relations(deliveryTimeSlots, ({ one }) => ({
  dispensary: one(dispensaries, { fields: [deliveryTimeSlots.dispensaryId], references: [dispensaries.entityId] }),
}));

export const deliveryZonesRelations = relations(deliveryZones, ({ one }) => ({
  dispensary: one(dispensaries, { fields: [deliveryZones.dispensaryId], references: [dispensaries.entityId] }),
}));

export const driverProfilesRelations = relations(driverProfiles, ({ one }) => ({
  profile: one(employeeProfiles, { fields: [driverProfiles.profileId], references: [employeeProfiles.profileId] }),
}));

export const deliveryTripsRelations = relations(deliveryTrips, ({ one }) => ({
  driver: one(driverProfiles, { fields: [deliveryTrips.driverId], references: [driverProfiles.driverId] }),
  order: one(orders, { fields: [deliveryTrips.orderId], references: [orders.orderId] }),
}));

// ── POS ─────────────────────────────────────────────────────────────
export const posProductMappingsRelations = relations(posProductMappings, ({ one }) => ({
  product: one(products, { fields: [posProductMappings.internalProductId], references: [products.id] }),
  variant: one(productVariants, { fields: [posProductMappings.internalVariantId], references: [productVariants.variantId] }),
}));
