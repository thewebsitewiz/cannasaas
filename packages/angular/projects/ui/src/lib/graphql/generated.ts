// AUTO-GENERATED — do not edit by hand

import { gql } from 'apollo-angular';
import { Injectable } from '@angular/core';
import * as Apollo from 'apollo-angular';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown> };
};

export type ActiveClock = {
  __typename?: 'ActiveClock';
  clockIn: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  entryId: Scalars['ID']['output'];
  firstName: Scalars['String']['output'];
  hoursSoFar: Scalars['Float']['output'];
  lastName: Scalars['String']['output'];
  positionName?: Maybe<Scalars['String']['output']>;
  profileId: Scalars['ID']['output'];
};

export type ActiveProcessorResult = {
  __typename?: 'ActiveProcessorResult';
  activePaymentProcessor?: Maybe<DispensaryProcessorName>;
  dispensaryId: Scalars['ID']['output'];
};

export type AddAddressInput = {
  addressLine1: Scalars['String']['input'];
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city: Scalars['String']['input'];
  deliveryInstructions?: InputMaybe<Scalars['String']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  state: Scalars['String']['input'];
  zip: Scalars['String']['input'];
};

export type AddCertificationInput = {
  certTypeId: Scalars['Int']['input'];
  certificateNumber?: InputMaybe<Scalars['String']['input']>;
  documentUrl?: InputMaybe<Scalars['String']['input']>;
  expirationDate?: InputMaybe<Scalars['String']['input']>;
  issuedDate?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  profileId: Scalars['ID']['input'];
};

export type AdjustResult = {
  __typename?: 'AdjustResult';
  inventory: InventoryResult;
  transaction: InventoryTransactionResult;
};

export type AgeVerification = {
  __typename?: 'AgeVerification';
  calculatedAge?: Maybe<Scalars['Int']['output']>;
  created_at: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  dispensaryId?: Maybe<Scalars['ID']['output']>;
  failureReason?: Maybe<Scalars['String']['output']>;
  idType?: Maybe<Scalars['String']['output']>;
  method: Scalars['String']['output'];
  result: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  verificationId: Scalars['ID']['output'];
};

export type AgeVerifyResult = {
  __typename?: 'AgeVerifyResult';
  age: Scalars['Int']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  verified: Scalars['Boolean']['output'];
};

export type AuditLog = {
  __typename?: 'AuditLog';
  action: Scalars['String']['output'];
  auditId: Scalars['ID']['output'];
  changes?: Maybe<Scalars['JSON']['output']>;
  created_at: Scalars['DateTime']['output'];
  dispensaryId?: Maybe<Scalars['ID']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType: Scalars['String']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  newValues?: Maybe<Scalars['JSON']['output']>;
  oldValues?: Maybe<Scalars['JSON']['output']>;
  userEmail?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type AuthToken = {
  __typename?: 'AuthToken';
  accessToken: Scalars['String']['output'];
  expiresIn: Scalars['Int']['output'];
};

export type AutocompleteResult = {
  __typename?: 'AutocompleteResult';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  productType?: Maybe<Scalars['String']['output']>;
  similarity?: Maybe<Scalars['Float']['output']>;
  strainType?: Maybe<Scalars['String']['output']>;
};

export type AvailableSlotResult = {
  __typename?: 'AvailableSlotResult';
  endTime: Scalars['String']['output'];
  slotId: Scalars['String']['output'];
  spotsRemaining: Scalars['Int']['output'];
  startTime: Scalars['String']['output'];
};

export type BillingInvoice = {
  __typename?: 'BillingInvoice';
  amount: Scalars['Float']['output'];
  created_at: Scalars['DateTime']['output'];
  invoice_id: Scalars['ID']['output'];
  org_name?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type BiotrackCredential = {
  __typename?: 'BiotrackCredential';
  apiKey: Scalars['String']['output'];
  apiSecret?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  credentialId: Scalars['ID']['output'];
  dispensaryId: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  lastValidatedAt?: Maybe<Scalars['DateTime']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  state: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  validationError?: Maybe<Scalars['String']['output']>;
};

export type BiotrackSyncResult = {
  __typename?: 'BiotrackSyncResult';
  itemCount?: Maybe<Scalars['Int']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type BiotrackValidationResult = {
  __typename?: 'BiotrackValidationResult';
  message: Scalars['String']['output'];
  valid: Scalars['Boolean']['output'];
};

export type BirthdayCheck = {
  __typename?: 'BirthdayCheck';
  bonusPoints?: Maybe<Scalars['Int']['output']>;
  discountPercent?: Maybe<Scalars['Float']['output']>;
  eligible: Scalars['Boolean']['output'];
  reason?: Maybe<Scalars['String']['output']>;
};

export type BrandListItem = {
  __typename?: 'BrandListItem';
  brandId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  isActive: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  slug?: Maybe<Scalars['String']['output']>;
};

export type BrandResult = {
  __typename?: 'BrandResult';
  brandId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  slug?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  websiteUrl?: Maybe<Scalars['String']['output']>;
};

export type BulkEnrichResultType = {
  __typename?: 'BulkEnrichResultType';
  enriched: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type BulkImportResultType = {
  __typename?: 'BulkImportResultType';
  imported: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type BulkTagResult = {
  __typename?: 'BulkTagResult';
  failed: Scalars['Int']['output'];
  results: Array<BulkTagResultItem>;
  succeeded: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type BulkTagResultItem = {
  __typename?: 'BulkTagResultItem';
  error?: Maybe<Scalars['String']['output']>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type BulkTagUidInput = {
  dispensaryId: Scalars['ID']['input'];
  pairs: Array<ProductUidPair>;
};

export type CampaignStats = {
  __typename?: 'CampaignStats';
  campaignId: Scalars['ID']['output'];
  clickRate: Scalars['Float']['output'];
  openRate: Scalars['Float']['output'];
  sentCount: Scalars['Int']['output'];
};

export type CashDiscountConfig = {
  __typename?: 'CashDiscountConfig';
  cashDeliveryEnabled: Scalars['Boolean']['output'];
  cashDiscountPercent: Scalars['Float']['output'];
  isCashEnabled: Scalars['Boolean']['output'];
};

export type CashDiscountPreview = {
  __typename?: 'CashDiscountPreview';
  adjustedSubtotal: Scalars['Float']['output'];
  discountAmount: Scalars['Float']['output'];
  discountPercent: Scalars['Float']['output'];
};

export type CashlessPaymentResult = {
  __typename?: 'CashlessPaymentResult';
  paymentUrl?: Maybe<Scalars['String']['output']>;
  redirectUrl?: Maybe<Scalars['String']['output']>;
  referenceId: Scalars['String']['output'];
};

export type CategoryBreakdown = {
  __typename?: 'CategoryBreakdown';
  category: Scalars['String']['output'];
  productCount: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
  unitsSold: Scalars['Int']['output'];
};

export type ClockStatus = {
  __typename?: 'ClockStatus';
  currentEntry?: Maybe<TimeEntry>;
  isClockedIn: Scalars['Boolean']['output'];
  isExempt: Scalars['Boolean']['output'];
  todayHours: Scalars['Float']['output'];
};

export type CloseRegisterSessionGqlInput = {
  closingCashCents: Scalars['Int']['input'];
  sessionId: Scalars['ID']['input'];
};

export type CompanyListItem = {
  __typename?: 'CompanyListItem';
  city?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['ID']['output'];
  contactEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dbaName?: Maybe<Scalars['String']['output']>;
  legalName: Scalars['String']['output'];
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseState?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  state?: Maybe<Scalars['String']['output']>;
};

export type CompanyResult = {
  __typename?: 'CompanyResult';
  addressLine1?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['ID']['output'];
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dbaName?: Maybe<Scalars['String']['output']>;
  ein?: Maybe<Scalars['String']['output']>;
  legalName: Scalars['String']['output'];
  licenseExpiryDate?: Maybe<Scalars['DateTime']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseState?: Maybe<Scalars['String']['output']>;
  licenseType?: Maybe<Scalars['String']['output']>;
  metrcFacilityLicense?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  state?: Maybe<Scalars['String']['output']>;
  stateOfIncorporation?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  zip?: Maybe<Scalars['String']['output']>;
};

export type CompleteOrderInput = {
  dispensaryId: Scalars['ID']['input'];
  metrcReceiptId?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  orderId: Scalars['ID']['input'];
};

export type ComplianceAlert = {
  __typename?: 'ComplianceAlert';
  alertType: Scalars['String']['output'];
  daysRemaining?: Maybe<Scalars['Int']['output']>;
  entityId?: Maybe<Scalars['ID']['output']>;
  entityName?: Maybe<Scalars['String']['output']>;
  entityType?: Maybe<Scalars['String']['output']>;
  expirationDate?: Maybe<Scalars['String']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  localQuantity?: Maybe<Scalars['Float']['output']>;
  message: Scalars['String']['output'];
  metrcQuantity?: Maybe<Scalars['Float']['output']>;
  severity: Scalars['String']['output'];
  variancePercent?: Maybe<Scalars['Float']['output']>;
};

export type ComplianceAlertsResult = {
  __typename?: 'ComplianceAlertsResult';
  alerts: Array<ComplianceAlert>;
  criticalCount: Scalars['Int']['output'];
  infoCount: Scalars['Int']['output'];
  totalAlerts: Scalars['Int']['output'];
  warningCount: Scalars['Int']['output'];
};

export type ComplianceIssue = {
  __typename?: 'ComplianceIssue';
  issues: Array<Scalars['String']['output']>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
};

export type ComplianceOverview = {
  __typename?: 'ComplianceOverview';
  activeCerts: Scalars['Int']['output'];
  activeEmployees: Scalars['Int']['output'];
  expiredCerts: Scalars['Int']['output'];
  expiringSoon: Scalars['Int']['output'];
  pendingCerts: Scalars['Int']['output'];
  totalCerts: Scalars['Int']['output'];
  totalEmployees: Scalars['Int']['output'];
};

export type ComplianceReport = {
  __typename?: 'ComplianceReport';
  compliancePercent: Scalars['Int']['output'];
  compliantProducts: Scalars['Float']['output'];
  dispensaryId: Scalars['ID']['output'];
  generatedAt: Scalars['DateTime']['output'];
  issues: Array<ComplianceIssue>;
  nonCompliantProducts: Scalars['Float']['output'];
  totalProducts: Scalars['Float']['output'];
};

export type ComplianceSummary = {
  __typename?: 'ComplianceSummary';
  compliancePercent: Scalars['Float']['output'];
  compliantProducts: Scalars['Int']['output'];
  missingCategory: Scalars['Int']['output'];
  missingPackageLabel: Scalars['Int']['output'];
  missingUid: Scalars['Int']['output'];
  totalProducts: Scalars['Int']['output'];
};

export type CreateBrandInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
};

export type CreateCompanyInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  dbaName?: InputMaybe<Scalars['String']['input']>;
  ein?: InputMaybe<Scalars['String']['input']>;
  legalName: Scalars['String']['input'];
  licenseExpiryDate?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseState?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  state?: InputMaybe<Scalars['String']['input']>;
  stateOfIncorporation?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDispensaryInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['ID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  state: Scalars['String']['input'];
  timezone?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type CreateManufacturerInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['ID']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  dbaName?: InputMaybe<Scalars['String']['input']>;
  legalName: Scalars['String']['input'];
  licenseExpiryDate?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseState?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOrderInput = {
  customerUserId?: InputMaybe<Scalars['ID']['input']>;
  deliveryAddress?: InputMaybe<DeliveryAddressInput>;
  dispensaryId: Scalars['ID']['input'];
  lineItems: Array<OrderLineItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  orderType?: InputMaybe<Scalars['String']['input']>;
  scheduledFor?: InputMaybe<Scalars['String']['input']>;
};

export type CreateOrganizationInput = {
  billingAddress?: InputMaybe<Scalars['String']['input']>;
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  subscriptionTier?: InputMaybe<Scalars['String']['input']>;
};

export type CreateProductInput = {
  cbdPercent?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  retailPrice?: InputMaybe<Scalars['Float']['input']>;
  strainName?: InputMaybe<Scalars['String']['input']>;
  strainType?: InputMaybe<Scalars['String']['input']>;
  thcPercent?: InputMaybe<Scalars['Float']['input']>;
  variantName?: InputMaybe<Scalars['String']['input']>;
  variantQuantityG?: InputMaybe<Scalars['Float']['input']>;
};

export type CreatePromotionInput = {
  appliesTo?: InputMaybe<Scalars['String']['input']>;
  appliesToBrandId?: InputMaybe<Scalars['ID']['input']>;
  appliesToProductTypeId?: InputMaybe<Scalars['Float']['input']>;
  appliesToTaxCategoryId?: InputMaybe<Scalars['Float']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  discountValue: Scalars['Float']['input'];
  endAt?: InputMaybe<Scalars['String']['input']>;
  isMedicalDiscount?: InputMaybe<Scalars['Boolean']['input']>;
  isStaffDiscount?: InputMaybe<Scalars['Boolean']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  maxUsesPerCustomer?: InputMaybe<Scalars['Int']['input']>;
  minimumOrderTotal?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  stackableWithOthers?: InputMaybe<Scalars['Boolean']['input']>;
  startAt?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type CreateReviewInput = {
  areasForImprovement?: InputMaybe<Scalars['String']['input']>;
  complianceRating?: InputMaybe<Scalars['Int']['input']>;
  goals?: InputMaybe<Scalars['String']['input']>;
  managerComments?: InputMaybe<Scalars['String']['input']>;
  overallRating?: InputMaybe<Scalars['Int']['input']>;
  periodEnd: Scalars['String']['input'];
  periodStart: Scalars['String']['input'];
  profileId: Scalars['ID']['input'];
  reliabilityRating?: InputMaybe<Scalars['Int']['input']>;
  salesRating?: InputMaybe<Scalars['Int']['input']>;
  strengths?: InputMaybe<Scalars['String']['input']>;
  teamworkRating?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateWalkInCustomerInput = {
  dispensaryId: Scalars['ID']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type CredentialValidationResult = {
  __typename?: 'CredentialValidationResult';
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseType?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  metrcFacilityName?: Maybe<Scalars['String']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type CustomerAddress = {
  __typename?: 'CustomerAddress';
  addressId: Scalars['ID']['output'];
  addressLine1: Scalars['String']['output'];
  addressLine2?: Maybe<Scalars['String']['output']>;
  city: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  deliveryInstructions?: Maybe<Scalars['String']['output']>;
  isDefault: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  state: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
  zip: Scalars['String']['output'];
};

export type CustomerFavorite = {
  __typename?: 'CustomerFavorite';
  orderCount: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
  productId: Scalars['ID']['output'];
  productName?: Maybe<Scalars['String']['output']>;
  variantId?: Maybe<Scalars['ID']['output']>;
  variantName?: Maybe<Scalars['String']['output']>;
};

export type CustomerOrder = {
  __typename?: 'CustomerOrder';
  createdAt: Scalars['DateTime']['output'];
  lineItems: Array<CustomerOrderLineItem>;
  orderId: Scalars['ID']['output'];
  orderStatus: Scalars['String']['output'];
  orderType: Scalars['String']['output'];
  paymentMethod?: Maybe<Scalars['String']['output']>;
  subtotal: Scalars['Float']['output'];
  taxTotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type CustomerOrderLineItem = {
  __typename?: 'CustomerOrderLineItem';
  price: Scalars['Float']['output'];
  productId: Scalars['ID']['output'];
  productName?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Float']['output'];
  variantId?: Maybe<Scalars['ID']['output']>;
  variantName?: Maybe<Scalars['String']['output']>;
};

export type CustomerOrderSummary = {
  __typename?: 'CustomerOrderSummary';
  createdAt: Scalars['DateTime']['output'];
  dispensaryName?: Maybe<Scalars['String']['output']>;
  itemCount?: Maybe<Scalars['Int']['output']>;
  orderId: Scalars['ID']['output'];
  orderStatus: Scalars['String']['output'];
  orderType: Scalars['String']['output'];
  subtotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type CustomerProfile = {
  __typename?: 'CustomerProfile';
  ageVerificationMethod?: Maybe<Scalars['String']['output']>;
  ageVerified: Scalars['Boolean']['output'];
  ageVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  created_at: Scalars['DateTime']['output'];
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  idDocumentType?: Maybe<Scalars['String']['output']>;
  isMedicalPatient: Scalars['Boolean']['output'];
  lastOrderAt?: Maybe<Scalars['DateTime']['output']>;
  loyaltyPoints: Scalars['Int']['output'];
  marketingOptIn: Scalars['Boolean']['output'];
  medicalCardNumber?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  preferredDispensaryId?: Maybe<Scalars['ID']['output']>;
  profileId: Scalars['ID']['output'];
  smsOptIn: Scalars['Boolean']['output'];
  totalOrders: Scalars['Int']['output'];
  totalSpent: Scalars['Float']['output'];
  updated_at: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type CustomerSearchResult = {
  __typename?: 'CustomerSearchResult';
  ageVerified: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  totalOrders: Scalars['Int']['output'];
  userId: Scalars['ID']['output'];
};

export type DailySales = {
  __typename?: 'DailySales';
  date: Scalars['String']['output'];
  discounts: Scalars['Float']['output'];
  gross: Scalars['Float']['output'];
  net: Scalars['Float']['output'];
  orders: Scalars['Int']['output'];
  tax: Scalars['Float']['output'];
};

export type DashboardData = {
  __typename?: 'DashboardData';
  categoryBreakdown: Array<CategoryBreakdown>;
  compliance: ComplianceSummary;
  inventory: InventoryOverview;
  lowStockItems: Array<LowStockItem>;
  metrcSync: MetrcSyncOverview;
  sales: SalesOverview;
  salesTrend: Array<SalesTrend>;
  topProducts: Array<TopProduct>;
};

export type DeliveryAddressInput = {
  city: Scalars['String']['input'];
  deliveryFee?: InputMaybe<Scalars['Float']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  line1: Scalars['String']['input'];
  line2?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  postalCode: Scalars['String']['input'];
  state: Scalars['String']['input'];
  zoneId?: InputMaybe<Scalars['ID']['input']>;
};

export type DeliveryEligibilityResult = {
  __typename?: 'DeliveryEligibilityResult';
  distance?: Maybe<Scalars['Float']['output']>;
  eligible: Scalars['Boolean']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  zone?: Maybe<DeliveryZoneMatch>;
};

export type DeliveryTrip = {
  __typename?: 'DeliveryTrip';
  actualMinutes?: Maybe<Scalars['Int']['output']>;
  created_at: Scalars['DateTime']['output'];
  customerRating?: Maybe<Scalars['Int']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  deliveryAddress?: Maybe<Scalars['String']['output']>;
  departedAt?: Maybe<Scalars['DateTime']['output']>;
  dispensaryId: Scalars['ID']['output'];
  distanceMiles?: Maybe<Scalars['Float']['output']>;
  driverId: Scalars['ID']['output'];
  estimatedMinutes?: Maybe<Scalars['Int']['output']>;
  orderId?: Maybe<Scalars['ID']['output']>;
  status: Scalars['String']['output'];
  tripId: Scalars['ID']['output'];
};

export type DeliveryZone = {
  __typename?: 'DeliveryZone';
  createdAt: Scalars['DateTime']['output'];
  deliveryFee: Scalars['Float']['output'];
  dispensaryId: Scalars['ID']['output'];
  estimatedMinutesMax?: Maybe<Scalars['Int']['output']>;
  estimatedMinutesMin?: Maybe<Scalars['Int']['output']>;
  freeDeliveryThreshold?: Maybe<Scalars['Float']['output']>;
  isActive: Scalars['Boolean']['output'];
  minOrderAmount?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  radiusMiles: Scalars['Float']['output'];
  sortOrder?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  zoneId: Scalars['ID']['output'];
};

export type DeliveryZoneMatch = {
  __typename?: 'DeliveryZoneMatch';
  deliveryFee: Scalars['Float']['output'];
  estimatedMinutesMax: Scalars['Int']['output'];
  estimatedMinutesMin: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  zoneId: Scalars['String']['output'];
};

export type DesignSystemConfig = {
  __typename?: 'DesignSystemConfig';
  designSystem: Scalars['String']['output'];
  designSystemFile: Scalars['String']['output'];
};

export type DiscountResult = {
  __typename?: 'DiscountResult';
  discountAmount: Scalars['Float']['output'];
  newTotal: Scalars['Float']['output'];
  promoId: Scalars['ID']['output'];
  promoName: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type DispStats = {
  __typename?: 'DispStats';
  active: Scalars['Int']['output'];
  states: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type DispensaryListItem = {
  __typename?: 'DispensaryListItem';
  city?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  entityId: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isDeliveryEnabled: Scalars['Boolean']['output'];
  isPickupEnabled: Scalars['Boolean']['output'];
  licenseNumber?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  zip?: Maybe<Scalars['String']['output']>;
};

export type DispensaryPaymentProcessor = {
  __typename?: 'DispensaryPaymentProcessor';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  isEnabled: Scalars['Boolean']['output'];
  isSandbox: Scalars['Boolean']['output'];
  merchantExternalId?: Maybe<Scalars['String']['output']>;
  processorName: DispensaryProcessorName;
  provisionedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

/** Operator-selectable payment processors per dispensary. */
export enum DispensaryProcessorName {
  AEROPAY = 'AEROPAY',
  CANPAY = 'CANPAY',
}

export type DispensaryProductType = {
  __typename?: 'DispensaryProductType';
  code: Scalars['String']['output'];
  isEnabled: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  productTypeId: Scalars['Int']['output'];
  sortOrder: Scalars['Int']['output'];
};

export type DispensaryProductTypeInput = {
  isEnabled: Scalars['Boolean']['input'];
  productTypeId: Scalars['Int']['input'];
  sortOrder: Scalars['Int']['input'];
};

export type DispensaryPublic = {
  __typename?: 'DispensaryPublic';
  city?: Maybe<Scalars['String']['output']>;
  entityId: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isDeliveryEnabled: Scalars['Boolean']['output'];
  isPickupEnabled: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  state?: Maybe<Scalars['String']['output']>;
};

export type DispensaryResult = {
  __typename?: 'DispensaryResult';
  addressLine1?: Maybe<Scalars['String']['output']>;
  cashDeliveryEnabled?: Maybe<Scalars['Boolean']['output']>;
  cashDiscountPercent?: Maybe<Scalars['Float']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  companyId: Scalars['ID']['output'];
  county?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  entityId: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isCashEnabled?: Maybe<Scalars['Boolean']['output']>;
  isDeliveryEnabled: Scalars['Boolean']['output'];
  isPickupEnabled: Scalars['Boolean']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseType?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  metrcLicenseNumber?: Maybe<Scalars['String']['output']>;
  municipality?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  state: Scalars['String']['output'];
  timezone?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  website?: Maybe<Scalars['String']['output']>;
  zip?: Maybe<Scalars['String']['output']>;
};

export type DriverProfile = {
  __typename?: 'DriverProfile';
  created_at: Scalars['DateTime']['output'];
  currentLatitude?: Maybe<Scalars['Float']['output']>;
  currentLongitude?: Maybe<Scalars['Float']['output']>;
  dispensaryId: Scalars['ID']['output'];
  driverId: Scalars['ID']['output'];
  insuranceExpiry?: Maybe<Scalars['String']['output']>;
  insuranceProvider?: Maybe<Scalars['String']['output']>;
  lastLocationUpdate?: Maybe<Scalars['DateTime']['output']>;
  licensePlate?: Maybe<Scalars['String']['output']>;
  maxDeliveriesPerHour: Scalars['Int']['output'];
  profileId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  updated_at: Scalars['DateTime']['output'];
  vehicleColor?: Maybe<Scalars['String']['output']>;
  vehicleMake?: Maybe<Scalars['String']['output']>;
  vehicleModel?: Maybe<Scalars['String']['output']>;
  vehicleYear?: Maybe<Scalars['Int']['output']>;
};

export type DriverStats = {
  __typename?: 'DriverStats';
  avgDeliveryMinutes: Scalars['Float']['output'];
  avgDistance: Scalars['Float']['output'];
  avgRating: Scalars['Float']['output'];
  completed: Scalars['Int']['output'];
  positiveRatings: Scalars['Int']['output'];
  totalMiles: Scalars['Float']['output'];
  totalTrips: Scalars['Int']['output'];
};

export type EligibilityResult = {
  __typename?: 'EligibilityResult';
  eligible: Scalars['Boolean']['output'];
  promotion?: Maybe<PromotionResult>;
  reason?: Maybe<Scalars['String']['output']>;
};

export type EmployeeCertification = {
  __typename?: 'EmployeeCertification';
  certTypeId: Scalars['Int']['output'];
  certificateNumber?: Maybe<Scalars['String']['output']>;
  certificationId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentUrl?: Maybe<Scalars['String']['output']>;
  expirationDate?: Maybe<Scalars['String']['output']>;
  issuedDate?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  profileId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  verifiedAt?: Maybe<Scalars['DateTime']['output']>;
  verifiedByUserId?: Maybe<Scalars['ID']['output']>;
};

export type EmployeeListItem = {
  __typename?: 'EmployeeListItem';
  activeCerts: Scalars['Int']['output'];
  department?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  employeeNumber?: Maybe<Scalars['String']['output']>;
  employmentStatus: Scalars['String']['output'];
  employmentType: Scalars['String']['output'];
  expiringCerts: Scalars['Int']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  hireDate: Scalars['String']['output'];
  hourlyRate?: Maybe<Scalars['Float']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  payType: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  positionCode?: Maybe<Scalars['String']['output']>;
  positionName?: Maybe<Scalars['String']['output']>;
  profileId: Scalars['ID']['output'];
  role: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type EmployeeProfile = {
  __typename?: 'EmployeeProfile';
  createdAt: Scalars['DateTime']['output'];
  department?: Maybe<Scalars['String']['output']>;
  dispensaryId: Scalars['ID']['output'];
  emergencyContactName?: Maybe<Scalars['String']['output']>;
  emergencyContactPhone?: Maybe<Scalars['String']['output']>;
  emergencyContactRelationship?: Maybe<Scalars['String']['output']>;
  employeeNumber?: Maybe<Scalars['String']['output']>;
  employmentStatus: Scalars['String']['output'];
  employmentType: Scalars['String']['output'];
  exemptReason?: Maybe<Scalars['String']['output']>;
  hireDate: Scalars['String']['output'];
  hourlyRate?: Maybe<Scalars['Float']['output']>;
  isExempt: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  overtimeEligible: Scalars['Boolean']['output'];
  payType: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  positionId?: Maybe<Scalars['Int']['output']>;
  profileId: Scalars['ID']['output'];
  salary?: Maybe<Scalars['Float']['output']>;
  terminationDate?: Maybe<Scalars['String']['output']>;
  terminationReason?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type EncryptionResult = {
  __typename?: 'EncryptionResult';
  credentialsEncrypted: Scalars['Int']['output'];
};

export type EnrichmentResultType = {
  __typename?: 'EnrichmentResultType';
  fieldsUpdated: Array<Scalars['String']['output']>;
  productId: Scalars['String']['output'];
  strainMatched: Scalars['Boolean']['output'];
  strainName?: Maybe<Scalars['String']['output']>;
};

export type FacetCount = {
  __typename?: 'FacetCount';
  count: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type FailedSyncDashboard = {
  __typename?: 'FailedSyncDashboard';
  dispensaryId: Scalars['String']['output'];
  items: Array<FailedSyncItem>;
  oldestFailedAt: Scalars['String']['output'];
  totalFailed: Scalars['Float']['output'];
};

export type FailedSyncItem = {
  __typename?: 'FailedSyncItem';
  attemptCount: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  lastSyncAttempt?: Maybe<Scalars['String']['output']>;
  lastSyncError?: Maybe<Scalars['String']['output']>;
  metrcReportedAt?: Maybe<Scalars['String']['output']>;
  metrcSyncStatus: Scalars['String']['output'];
  orderId: Scalars['ID']['output'];
  orderStatus: Scalars['String']['output'];
  subtotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type HourlySales = {
  __typename?: 'HourlySales';
  hour: Scalars['Int']['output'];
  orders: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
};

export type IdVerificationResult = {
  __typename?: 'IdVerificationResult';
  age?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customerId?: Maybe<Scalars['String']['output']>;
  dateOfBirth?: Maybe<Scalars['String']['output']>;
  dispensaryId: Scalars['String']['output'];
  expiryDate?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  idNumber?: Maybe<Scalars['String']['output']>;
  idState?: Maybe<Scalars['String']['output']>;
  is21Plus?: Maybe<Scalars['Boolean']['output']>;
  verificationId: Scalars['ID']['output'];
  verificationStatus: Scalars['String']['output'];
  verifiedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type InventoryAdjustment = {
  __typename?: 'InventoryAdjustment';
  adjustmentId: Scalars['ID']['output'];
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId?: Maybe<Scalars['ID']['output']>;
  created_at: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  quantityAfter: Scalars['Int']['output'];
  quantityBefore: Scalars['Int']['output'];
  quantityChange: Scalars['Int']['output'];
  reasonId: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  submittedByUserId: Scalars['ID']['output'];
  updated_at: Scalars['DateTime']['output'];
  variantId: Scalars['ID']['output'];
};

export type InventoryCount = {
  __typename?: 'InventoryCount';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  completedByUserId?: Maybe<Scalars['ID']['output']>;
  countId: Scalars['ID']['output'];
  countType: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  itemsCounted: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  startedAt: Scalars['DateTime']['output'];
  startedByUserId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  totalItems: Scalars['Int']['output'];
  updated_at: Scalars['DateTime']['output'];
  varianceCount: Scalars['Int']['output'];
};

export type InventoryCountItem = {
  __typename?: 'InventoryCountItem';
  countId: Scalars['ID']['output'];
  countItemId: Scalars['ID']['output'];
  countedAt?: Maybe<Scalars['DateTime']['output']>;
  countedByUserId?: Maybe<Scalars['ID']['output']>;
  countedQuantity?: Maybe<Scalars['Int']['output']>;
  expectedQuantity: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  variance?: Maybe<Scalars['Int']['output']>;
  variantId: Scalars['ID']['output'];
  variantName?: Maybe<Scalars['String']['output']>;
};

export type InventoryHealth = {
  __typename?: 'InventoryHealth';
  deadStock: Scalars['Int']['output'];
  expired: Scalars['Int']['output'];
  expiring30d: Scalars['Int']['output'];
  lowStock: Scalars['Int']['output'];
  outOfStock: Scalars['Int']['output'];
  pendingAdjustments: Scalars['Int']['output'];
  pendingTransfers: Scalars['Int']['output'];
  totalSkus: Scalars['Int']['output'];
  totalUnits: Scalars['Int']['output'];
};

export type InventoryListItem = {
  __typename?: 'InventoryListItem';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  inventoryId: Scalars['ID']['output'];
  locationInStore?: Maybe<Scalars['String']['output']>;
  quantityAvailable: Scalars['Float']['output'];
  quantityOnHand: Scalars['Float']['output'];
  quantityReserved: Scalars['Float']['output'];
  reorderThreshold?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variantId: Scalars['ID']['output'];
};

export type InventoryLowStockItem = {
  __typename?: 'InventoryLowStockItem';
  inventoryId: Scalars['ID']['output'];
  locationInStore?: Maybe<Scalars['String']['output']>;
  quantityAvailable: Scalars['Float']['output'];
  quantityOnHand: Scalars['Float']['output'];
  reorderQuantity?: Maybe<Scalars['Float']['output']>;
  reorderThreshold?: Maybe<Scalars['Float']['output']>;
  variantId: Scalars['ID']['output'];
};

export type InventoryOverview = {
  __typename?: 'InventoryOverview';
  estimatedInventoryValue: Scalars['Float']['output'];
  lowStockCount: Scalars['Int']['output'];
  outOfStockCount: Scalars['Int']['output'];
  totalUnitsAvailable: Scalars['Float']['output'];
  totalUnitsOnHand: Scalars['Float']['output'];
  totalUnitsReserved: Scalars['Float']['output'];
  totalVariants: Scalars['Int']['output'];
};

export type InventoryResult = {
  __typename?: 'InventoryResult';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  inventoryId: Scalars['ID']['output'];
  lastCountAt?: Maybe<Scalars['DateTime']['output']>;
  lastCountByUserId?: Maybe<Scalars['ID']['output']>;
  lastMetrcSyncAt?: Maybe<Scalars['DateTime']['output']>;
  lastReconciledAt?: Maybe<Scalars['DateTime']['output']>;
  locationInStore?: Maybe<Scalars['String']['output']>;
  quantityAvailable: Scalars['Float']['output'];
  quantityOnHand: Scalars['Float']['output'];
  quantityReserved: Scalars['Float']['output'];
  reorderQuantity?: Maybe<Scalars['Float']['output']>;
  reorderThreshold?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variantId: Scalars['ID']['output'];
};

export type InventoryTransactionResult = {
  __typename?: 'InventoryTransactionResult';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  inventoryId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  performedByUserId?: Maybe<Scalars['ID']['output']>;
  quantityAfter: Scalars['Float']['output'];
  quantityBefore: Scalars['Float']['output'];
  quantityDelta: Scalars['Float']['output'];
  referenceOrderId?: Maybe<Scalars['ID']['output']>;
  transactionId: Scalars['ID']['output'];
  transactionType: Scalars['String']['output'];
};

export type InventoryTransfer = {
  __typename?: 'InventoryTransfer';
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId?: Maybe<Scalars['ID']['output']>;
  created_at: Scalars['DateTime']['output'];
  fromDispensaryId: Scalars['ID']['output'];
  metrcManifestId?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['ID']['output'];
  receivedAt?: Maybe<Scalars['DateTime']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  requestedByUserId: Scalars['ID']['output'];
  shippedAt?: Maybe<Scalars['DateTime']['output']>;
  status: Scalars['String']['output'];
  toDispensaryId: Scalars['ID']['output'];
  transferId: Scalars['ID']['output'];
  updated_at: Scalars['DateTime']['output'];
};

export type InventoryTransferItem = {
  __typename?: 'InventoryTransferItem';
  itemId: Scalars['ID']['output'];
  metrcPackageTag?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  quantityReceived?: Maybe<Scalars['Int']['output']>;
  quantityRequested: Scalars['Int']['output'];
  quantityShipped?: Maybe<Scalars['Int']['output']>;
  transferId: Scalars['ID']['output'];
  variantId: Scalars['ID']['output'];
  variantName?: Maybe<Scalars['String']['output']>;
};

export type InventoryValueResult = {
  __typename?: 'InventoryValueResult';
  totalAvailable: Scalars['Float']['output'];
  totalItems: Scalars['Int']['output'];
  totalOnHand: Scalars['Float']['output'];
  totalReserved: Scalars['Float']['output'];
};

export type KioskCustomerLookup = {
  __typename?: 'KioskCustomerLookup';
  customerId: Scalars['ID']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  loyaltyPoints: Scalars['Int']['output'];
};

export type KioskProvisionResult = {
  __typename?: 'KioskProvisionResult';
  deviceId: Scalars['ID']['output'];
  deviceToken: Scalars['String']['output'];
  dispensaryId: Scalars['ID']['output'];
  expiresAt: Scalars['DateTime']['output'];
  issuedAt: Scalars['DateTime']['output'];
  label: Scalars['String']['output'];
};

export type KnowledgeProduct = {
  __typename?: 'KnowledgeProduct';
  categoryName?: Maybe<Scalars['String']['output']>;
  cbdContent?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  effects?: Maybe<Array<Scalars['String']['output']>>;
  matchedCondition?: Maybe<Scalars['String']['output']>;
  matchedEffects?: Maybe<Array<Scalars['String']['output']>>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  terpenes?: Maybe<Array<Scalars['String']['output']>>;
  thcContent?: Maybe<Scalars['Float']['output']>;
};

export type LaborCostSummary = {
  __typename?: 'LaborCostSummary';
  employeeCount: Scalars['Int']['output'];
  laborCostPercent: Scalars['Float']['output'];
  totalHours: Scalars['Float']['output'];
  totalLaborCost: Scalars['Float']['output'];
  totalRevenue: Scalars['Float']['output'];
};

export type LkpAdjustmentReason = {
  __typename?: 'LkpAdjustmentReason';
  code: Scalars['String']['output'];
  direction: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  reasonId: Scalars['Int']['output'];
  requiresApproval: Scalars['Boolean']['output'];
};

export type LkpCertificationType = {
  __typename?: 'LkpCertificationType';
  certTypeId: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  isStateRequired: Scalars['Boolean']['output'];
  issuingAuthority?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  validityMonths?: Maybe<Scalars['Int']['output']>;
};

export type LkpPosition = {
  __typename?: 'LkpPosition';
  code: Scalars['String']['output'];
  department: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  isManagement: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  positionId: Scalars['Int']['output'];
  sortOrder: Scalars['Int']['output'];
};

export type LkpProductCategory = {
  __typename?: 'LkpProductCategory';
  category_id: Scalars['Int']['output'];
  code: Scalars['String']['output'];
  depth: Scalars['Int']['output'];
  is_active: Scalars['Boolean']['output'];
  metrc_category_code?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  parent_category_id?: Maybe<Scalars['Int']['output']>;
  sort_order: Scalars['Int']['output'];
};

export type LkpProductType = {
  __typename?: 'LkpProductType';
  code: Scalars['String']['output'];
  hemp_eligible: Scalars['Boolean']['output'];
  is_active: Scalars['Boolean']['output'];
  is_ingestible: Scalars['Boolean']['output'];
  is_inhalable: Scalars['Boolean']['output'];
  metrc_default_category_code?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  product_type_id: Scalars['Int']['output'];
  requires_extraction_method: Scalars['Boolean']['output'];
  requires_ingredient_list: Scalars['Boolean']['output'];
  requires_lab_test: Scalars['Boolean']['output'];
  requires_serving_info: Scalars['Boolean']['output'];
  sort_order: Scalars['Int']['output'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LowStockItem = {
  __typename?: 'LowStockItem';
  productName: Scalars['String']['output'];
  quantityAvailable: Scalars['Float']['output'];
  quantityOnHand: Scalars['Float']['output'];
  reorderThreshold?: Maybe<Scalars['Float']['output']>;
  variantId: Scalars['String']['output'];
  variantName: Scalars['String']['output'];
};

export type LoyaltyReward = {
  __typename?: 'LoyaltyReward';
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  pointsCost: Scalars['Int']['output'];
  rewardId: Scalars['ID']['output'];
  rewardType: Scalars['String']['output'];
  rewardValue: Scalars['Float']['output'];
};

export type LoyaltyStats = {
  __typename?: 'LoyaltyStats';
  activeMembers: Scalars['Int']['output'];
  birthdayClaims: Scalars['Int']['output'];
  redemptionCount: Scalars['Int']['output'];
  tierBreakdown: Array<TierCount>;
  totalEarned: Scalars['Int']['output'];
  totalRedeemed: Scalars['Int']['output'];
};

export type LoyaltyTierInfo = {
  __typename?: 'LoyaltyTierInfo';
  code: Scalars['String']['output'];
  color?: Maybe<Scalars['String']['output']>;
  minPoints: Scalars['Int']['output'];
  multiplier: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  perks?: Maybe<Scalars['String']['output']>;
};

export type ManufacturerListItem = {
  __typename?: 'ManufacturerListItem';
  brandId?: Maybe<Scalars['ID']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dbaName?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  legalName: Scalars['String']['output'];
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseState?: Maybe<Scalars['String']['output']>;
  manufacturerId: Scalars['ID']['output'];
  state?: Maybe<Scalars['String']['output']>;
};

export type ManufacturerResult = {
  __typename?: 'ManufacturerResult';
  addressLine1?: Maybe<Scalars['String']['output']>;
  brandId?: Maybe<Scalars['ID']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dbaName?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  legalName: Scalars['String']['output'];
  licenseExpiryDate?: Maybe<Scalars['DateTime']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  licenseState?: Maybe<Scalars['String']['output']>;
  licenseType?: Maybe<Scalars['String']['output']>;
  manufacturerId: Scalars['ID']['output'];
  state?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  zip?: Maybe<Scalars['String']['output']>;
};

export type MarketingAutomation = {
  __typename?: 'MarketingAutomation';
  automationId: Scalars['ID']['output'];
  channel: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  delayMinutes: Scalars['Int']['output'];
  dispensaryId: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  templateId?: Maybe<Scalars['String']['output']>;
  triggerEvent: Scalars['String']['output'];
};

export type MarketingCampaign = {
  __typename?: 'MarketingCampaign';
  audienceFilter?: Maybe<Scalars['JSON']['output']>;
  body?: Maybe<Scalars['String']['output']>;
  campaignId: Scalars['ID']['output'];
  campaignType: Scalars['String']['output'];
  channel: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  sentCount: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  subject?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type MetrcCredential = {
  __typename?: 'MetrcCredential';
  createdAt: Scalars['DateTime']['output'];
  credentialId: Scalars['ID']['output'];
  dispensaryId: Scalars['String']['output'];
  integratorApiKey?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  lastValidatedAt?: Maybe<Scalars['DateTime']['output']>;
  metrcUsername?: Maybe<Scalars['String']['output']>;
  state: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userApiKey: Scalars['String']['output'];
  validationError?: Maybe<Scalars['String']['output']>;
};

export type MetrcManifest = {
  __typename?: 'MetrcManifest';
  created_at: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  driverName?: Maybe<Scalars['String']['output']>;
  fromFacilityName?: Maybe<Scalars['String']['output']>;
  fromLicense: Scalars['String']['output'];
  manifestId: Scalars['ID']['output'];
  manifestNumber: Scalars['String']['output'];
  manifestType: Scalars['String']['output'];
  metrcTransferId?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  toFacilityName?: Maybe<Scalars['String']['output']>;
  toLicense: Scalars['String']['output'];
  totalPackages: Scalars['Int']['output'];
  totalQuantity: Scalars['Float']['output'];
  transferId?: Maybe<Scalars['ID']['output']>;
  updated_at: Scalars['DateTime']['output'];
  vehicleLicensePlate?: Maybe<Scalars['String']['output']>;
};

export type MetrcManifestItem = {
  __typename?: 'MetrcManifestItem';
  itemId: Scalars['ID']['output'];
  manifestId: Scalars['ID']['output'];
  metrcPackageTag?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  quantity: Scalars['Float']['output'];
  unitOfMeasure: Scalars['String']['output'];
  variantId: Scalars['ID']['output'];
};

export type MetrcSaleResult = {
  __typename?: 'MetrcSaleResult';
  message?: Maybe<Scalars['String']['output']>;
  metrcReceiptId?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  syncLogId?: Maybe<Scalars['String']['output']>;
};

export type MetrcSyncOverview = {
  __typename?: 'MetrcSyncOverview';
  failedCount: Scalars['Int']['output'];
  lastSyncAt?: Maybe<Scalars['String']['output']>;
  ordersAwaitingSync: Scalars['Int']['output'];
  pendingCount: Scalars['Int']['output'];
  successCount: Scalars['Int']['output'];
  successRate: Scalars['Float']['output'];
  totalSyncs: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  activatePromotion: PromotionResult;
  addAddress: CustomerAddress;
  addCertification: EmployeeCertification;
  addTaxRule: TaxRule;
  adjustInventory: AdjustResult;
  applyPromoDiscount: DiscountResult;
  approveAdjustment: InventoryAdjustment;
  approveProduct: Scalars['Boolean']['output'];
  approveShiftSwap: ShiftSwapRequest;
  approveTimeEntry: TimeEntry;
  approveTransfer: InventoryTransfer;
  approveWaste: WasteDestructionLog;
  assignDelivery: DeliveryTrip;
  /** Binds an ECDSA P-256 public key (SPKI PEM) to the calling kiosk device. */
  attestKioskDevice: Scalars['Boolean']['output'];
  autoGenerateSchedule: Scalars['Int']['output'];
  bulkTagProductUids: BulkTagResult;
  cancelOrder: Scalars['Boolean']['output'];
  claimBirthdayBonus: PointTransaction;
  claimShiftSwap: ShiftSwapRequest;
  clockIn: TimeEntry;
  clockOut: TimeEntry;
  closeRegisterSession: RegisterSession;
  completeDeliveryTrip: DeliveryTrip;
  completeInventoryCount: InventoryCount;
  completeOrder: Scalars['Boolean']['output'];
  confirmOrder: Scalars['Boolean']['output'];
  createAdjustment: InventoryAdjustment;
  createBrand: BrandResult;
  createCompany: CompanyResult;
  createCustomerProfile: CustomerProfile;
  createDispensary: DispensaryResult;
  createManufacturer: ManufacturerResult;
  createMarketingAutomation: MarketingAutomation;
  createMarketingCampaign: MarketingCampaign;
  createOrder: OrderSummary;
  createOrganization: OrganizationResult;
  createPerformanceReview: PerformanceReview;
  createProduct: Product;
  createPromotion: PromotionResult;
  createPurchaseOrder: Scalars['JSON']['output'];
  createReward: Scalars['JSON']['output'];
  createShift: ScheduledShift;
  createTenant: PlatformTenant;
  createTransfer: InventoryTransfer;
  createVendor: Vendor;
  createWalkInCustomer: CustomerSearchResult;
  deactivateMetrcCredential: Scalars['Boolean']['output'];
  deactivatePromotion: PromotionResult;
  deactivateUser: Scalars['Boolean']['output'];
  deleteAddress: Scalars['Boolean']['output'];
  deleteBrand: Scalars['Boolean']['output'];
  deleteCompany: Scalars['Boolean']['output'];
  deleteDispensary: Scalars['Boolean']['output'];
  deleteManufacturer: Scalars['Boolean']['output'];
  deleteOrganization: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteShift: Scalars['Boolean']['output'];
  deprovisionAeropayForDispensary: Scalars['Boolean']['output'];
  deprovisionCanPayForDispensary: Scalars['Boolean']['output'];
  encryptAllCredentials: EncryptionResult;
  enrichDispensaryProducts: BulkEnrichResultType;
  enrichProduct: EnrichmentResultType;
  generateManifest: MetrcManifest;
  givePoints: Scalars['JSON']['output'];
  importOtreebaStrains: BulkImportResultType;
  indexProducts: Scalars['Int']['output'];
  initiateCashlessPayment: CashlessPaymentResult;
  logWaste: WasteDestructionLog;
  login: AuthToken;
  markOrderReady: Scalars['Boolean']['output'];
  notifyCustomer: Array<NotificationLog>;
  openRegisterSession: RegisterSession;
  processCashPayment: Payment;
  provisionAeropayForDispensary: DispensaryPaymentProcessor;
  provisionCanPayForDispensary: DispensaryPaymentProcessor;
  /** Issues a long-lived device token for a kiosk terminal. Admin-only; one device per (dispensary, label). */
  provisionKiosk: KioskProvisionResult;
  publishWeekSchedule: Scalars['Int']['output'];
  pushOrderToPos: PosOrderPushResult;
  receiveTransfer: InventoryTransfer;
  recordCountItem: InventoryCountItem;
  redeemReward: RedeemResult;
  register: AuthToken;
  rejectTransfer: InventoryTransfer;
  releaseReserve: AdjustResult;
  reportSaleToBiotrack: BiotrackSyncResult;
  requestShiftSwap: ShiftSwapRequest;
  requestTimeOff: TimeOffRequest;
  reserveStock: AdjustResult;
  resetThemeConfig: ThemeConfigType;
  retryFailedMetrcSyncs: Scalars['Int']['output'];
  reviewTimeOff: TimeOffRequest;
  revokeCertification: EmployeeCertification;
  runReconciliation: ReconciliationReport;
  saveDispensaryProductTypes: Array<DispensaryProductType>;
  saveThemeConfig: ThemeConfigType;
  sendMarketingCampaign: MarketingCampaign;
  sendTestEmail: NotificationLog;
  setActiveDispensaryProcessor: ActiveProcessorResult;
  setCashDiscount: CashDiscountConfig;
  setDesignSystem: DesignSystemConfig;
  setDispensaryProcessorEnabled: DispensaryPaymentProcessor;
  setProductMetrcCategory: Product;
  setUserRole: User;
  shipTransfer: InventoryTransfer;
  startInventoryCount: InventoryCount;
  startPreparingOrder: Scalars['Boolean']['output'];
  suspendTenant: PlatformTenant;
  syncBiotrackInventory: BiotrackSyncResult;
  syncOrderToMetrc: MetrcSaleResult;
  syncPosInventory: PosSyncLog;
  syncPosProducts: PosSyncLog;
  tagProductMetrcUid: Product;
  tagVariantPackageLabel: ProductVariant;
  testPosConnection: PosConnectionResult;
  togglePosSync: PosIntegration;
  updateAddress: CustomerAddress;
  updateBrand: BrandResult;
  updateCompany: CompanyResult;
  updateCustomerProfile: CustomerProfile;
  updateDeliverySettings: DispensaryResult;
  updateDispensary: DispensaryResult;
  updateDriverStatus: DriverProfile;
  updateEmployee: EmployeeProfile;
  updateFulfillmentStatus: OrderTracking;
  updateManifestStatus: MetrcManifest;
  updateManufacturer: ManufacturerResult;
  updateOperatingHours: DispensaryResult;
  updateOrganization: OrganizationResult;
  updatePOStatus: Scalars['JSON']['output'];
  updateProduct: Product;
  updatePromotion: PromotionResult;
  updateSubscription: OrganizationResult;
  updateTaxRule: TaxRule;
  updateTenant: PlatformTenant;
  updateVariantPrice: Scalars['Boolean']['output'];
  updateVendor: Scalars['JSON']['output'];
  upsertBiotrackCredential: BiotrackCredential;
  upsertMetrcCredential: MetrcCredential;
  upsertPosIntegration: PosIntegration;
  validateBiotrackCredential: BiotrackValidationResult;
  validateMetrcCredential: CredentialValidationResult;
  verifyAge: AgeVerifyResult;
  verifyCertification: EmployeeCertification;
  verifyIdentification: IdVerificationResult;
};

export type MutationActivatePromotionArgs = {
  promoId: Scalars['ID']['input'];
};

export type MutationAddAddressArgs = {
  input: AddAddressInput;
};

export type MutationAddCertificationArgs = {
  input: AddCertificationInput;
};

export type MutationAddTaxRuleArgs = {
  code: Scalars['String']['input'];
  name: Scalars['String']['input'];
  rate: Scalars['Float']['input'];
  state: Scalars['String']['input'];
  statutoryReference?: InputMaybe<Scalars['String']['input']>;
  taxBasis: Scalars['String']['input'];
};

export type MutationAdjustInventoryArgs = {
  delta: Scalars['Float']['input'];
  inventoryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  referenceOrderId?: InputMaybe<Scalars['ID']['input']>;
  transactionType: Scalars['String']['input'];
};

export type MutationApplyPromoDiscountArgs = {
  orderTotal: Scalars['Float']['input'];
  promoId: Scalars['ID']['input'];
};

export type MutationApproveAdjustmentArgs = {
  adjustmentId: Scalars['ID']['input'];
};

export type MutationApproveProductArgs = {
  dispensaryId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
};

export type MutationApproveShiftSwapArgs = {
  swapId: Scalars['ID']['input'];
};

export type MutationApproveTimeEntryArgs = {
  entryId: Scalars['ID']['input'];
};

export type MutationApproveTransferArgs = {
  transferId: Scalars['ID']['input'];
};

export type MutationApproveWasteArgs = {
  logId: Scalars['ID']['input'];
};

export type MutationAssignDeliveryArgs = {
  deliveryAddress: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  distanceMiles?: InputMaybe<Scalars['Float']['input']>;
  driverId: Scalars['ID']['input'];
  estimatedMinutes?: InputMaybe<Scalars['Int']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
};

export type MutationAttestKioskDeviceArgs = {
  publicKey: Scalars['String']['input'];
};

export type MutationAutoGenerateScheduleArgs = {
  dispensaryId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};

export type MutationBulkTagProductUidsArgs = {
  input: BulkTagUidInput;
};

export type MutationCancelOrderArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  orderId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

export type MutationClaimBirthdayBonusArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationClaimShiftSwapArgs = {
  swapId: Scalars['ID']['input'];
};

export type MutationClockInArgs = {
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type MutationClockOutArgs = {
  breakMinutes?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type MutationCloseRegisterSessionArgs = {
  input: CloseRegisterSessionGqlInput;
};

export type MutationCompleteDeliveryTripArgs = {
  customerRating?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};

export type MutationCompleteInventoryCountArgs = {
  autoAdjust?: Scalars['Boolean']['input'];
  countId: Scalars['ID']['input'];
};

export type MutationCompleteOrderArgs = {
  input: CompleteOrderInput;
};

export type MutationConfirmOrderArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  orderId: Scalars['ID']['input'];
};

export type MutationCreateAdjustmentArgs = {
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantityChange: Scalars['Int']['input'];
  reasonCode: Scalars['String']['input'];
  variantId: Scalars['ID']['input'];
};

export type MutationCreateBrandArgs = {
  input: CreateBrandInput;
};

export type MutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};

export type MutationCreateCustomerProfileArgs = {
  dateOfBirth?: InputMaybe<Scalars['String']['input']>;
  marketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredDispensaryId?: InputMaybe<Scalars['ID']['input']>;
  smsOptIn?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationCreateDispensaryArgs = {
  input: CreateDispensaryInput;
};

export type MutationCreateManufacturerArgs = {
  input: CreateManufacturerInput;
};

export type MutationCreateMarketingAutomationArgs = {
  channel?: Scalars['String']['input'];
  delayMinutes?: Scalars['Int']['input'];
  dispensaryId: Scalars['ID']['input'];
  templateId?: InputMaybe<Scalars['String']['input']>;
  triggerEvent: Scalars['String']['input'];
};

export type MutationCreateMarketingCampaignArgs = {
  audienceFilter?: InputMaybe<Scalars['String']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  campaignType?: Scalars['String']['input'];
  channel?: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  scheduledAt?: InputMaybe<Scalars['String']['input']>;
  subject?: InputMaybe<Scalars['String']['input']>;
};

export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};

export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};

export type MutationCreatePerformanceReviewArgs = {
  input: CreateReviewInput;
};

export type MutationCreateProductArgs = {
  input: CreateProductInput;
};

export type MutationCreatePromotionArgs = {
  dispensaryId: Scalars['ID']['input'];
  input: CreatePromotionInput;
};

export type MutationCreatePurchaseOrderArgs = {
  dispensaryId: Scalars['ID']['input'];
  items: Array<PoLineItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  vendorId: Scalars['ID']['input'];
};

export type MutationCreateRewardArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  pointsCost: Scalars['Int']['input'];
  rewardType: Scalars['String']['input'];
  rewardValue: Scalars['Float']['input'];
};

export type MutationCreateShiftArgs = {
  dispensaryId: Scalars['ID']['input'];
  endTime: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  profileId: Scalars['ID']['input'];
  shiftDate: Scalars['String']['input'];
  startTime: Scalars['String']['input'];
};

export type MutationCreateTenantArgs = {
  billingEmail: Scalars['String']['input'];
  name: Scalars['String']['input'];
  state?: Scalars['String']['input'];
  subscriptionTier?: Scalars['String']['input'];
};

export type MutationCreateTransferArgs = {
  fromDispensaryId: Scalars['ID']['input'];
  items: Array<TransferItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  toDispensaryId: Scalars['ID']['input'];
};

export type MutationCreateVendorArgs = {
  city?: InputMaybe<Scalars['String']['input']>;
  contactName?: InputMaybe<Scalars['String']['input']>;
  contactTitle?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseState?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  paymentTerms?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  vendorType?: Scalars['String']['input'];
};

export type MutationCreateWalkInCustomerArgs = {
  input: CreateWalkInCustomerInput;
};

export type MutationDeactivateMetrcCredentialArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationDeactivatePromotionArgs = {
  promoId: Scalars['ID']['input'];
};

export type MutationDeactivateUserArgs = {
  userId: Scalars['ID']['input'];
};

export type MutationDeleteAddressArgs = {
  addressId: Scalars['ID']['input'];
};

export type MutationDeleteBrandArgs = {
  brandId: Scalars['ID']['input'];
};

export type MutationDeleteCompanyArgs = {
  companyId: Scalars['ID']['input'];
};

export type MutationDeleteDispensaryArgs = {
  entityId: Scalars['ID']['input'];
};

export type MutationDeleteManufacturerArgs = {
  manufacturerId: Scalars['ID']['input'];
};

export type MutationDeleteOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};

export type MutationDeleteProductArgs = {
  dispensaryId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
};

export type MutationDeleteShiftArgs = {
  shiftId: Scalars['ID']['input'];
};

export type MutationDeprovisionAeropayForDispensaryArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationDeprovisionCanPayForDispensaryArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationEnrichDispensaryProductsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationEnrichProductArgs = {
  dispensaryId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
};

export type MutationGenerateManifestArgs = {
  transferId: Scalars['ID']['input'];
};

export type MutationGivePointsArgs = {
  dispensaryId: Scalars['ID']['input'];
  points: Scalars['Int']['input'];
  reason: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationImportOtreebaStrainsArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type MutationIndexProductsArgs = {
  dispensaryId: Scalars['String']['input'];
};

export type MutationInitiateCashlessPaymentArgs = {
  amount: Scalars['Float']['input'];
  dispensaryId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
};

export type MutationLogWasteArgs = {
  destructionMethod?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  productName: Scalars['String']['input'];
  quantity: Scalars['Float']['input'];
  reason: Scalars['String']['input'];
  unitOfMeasure?: Scalars['String']['input'];
  variantId?: InputMaybe<Scalars['ID']['input']>;
  wasteType: Scalars['String']['input'];
  witness1Name: Scalars['String']['input'];
  witness1Title?: InputMaybe<Scalars['String']['input']>;
  witness2Name?: InputMaybe<Scalars['String']['input']>;
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationMarkOrderReadyArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  orderId: Scalars['ID']['input'];
};

export type MutationNotifyCustomerArgs = {
  dispensaryId: Scalars['ID']['input'];
  templateCode: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationOpenRegisterSessionArgs = {
  input: OpenRegisterSessionGqlInput;
};

export type MutationProcessCashPaymentArgs = {
  applyDiscount?: InputMaybe<Scalars['Boolean']['input']>;
  cashTendered: Scalars['Float']['input'];
  dispensaryId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
};

export type MutationProvisionAeropayForDispensaryArgs = {
  input: ProvisionAeropayInput;
};

export type MutationProvisionCanPayForDispensaryArgs = {
  input: ProvisionCanPayInput;
};

export type MutationProvisionKioskArgs = {
  input: ProvisionKioskInput;
};

export type MutationPublishWeekScheduleArgs = {
  dispensaryId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};

export type MutationPushOrderToPosArgs = {
  dispensaryId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
};

export type MutationReceiveTransferArgs = {
  items: Array<ReceiveItemInput>;
  transferId: Scalars['ID']['input'];
};

export type MutationRecordCountItemArgs = {
  countItemId: Scalars['ID']['input'];
  countedQuantity: Scalars['Int']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type MutationRedeemRewardArgs = {
  dispensaryId: Scalars['ID']['input'];
  orderId?: InputMaybe<Scalars['ID']['input']>;
  rewardId: Scalars['ID']['input'];
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRejectTransferArgs = {
  reason: Scalars['String']['input'];
  transferId: Scalars['ID']['input'];
};

export type MutationReleaseReserveArgs = {
  inventoryId: Scalars['ID']['input'];
  quantity: Scalars['Float']['input'];
  referenceOrderId?: InputMaybe<Scalars['ID']['input']>;
};

export type MutationReportSaleToBiotrackArgs = {
  dispensaryId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
};

export type MutationRequestShiftSwapArgs = {
  reason?: InputMaybe<Scalars['String']['input']>;
  shiftId: Scalars['ID']['input'];
};

export type MutationRequestTimeOffArgs = {
  endDate: Scalars['String']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  requestType?: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type MutationReserveStockArgs = {
  inventoryId: Scalars['ID']['input'];
  quantity: Scalars['Float']['input'];
  referenceOrderId?: InputMaybe<Scalars['ID']['input']>;
};

export type MutationResetThemeConfigArgs = {
  dispensaryId: Scalars['String']['input'];
};

export type MutationRetryFailedMetrcSyncsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationReviewTimeOffArgs = {
  approved: Scalars['Boolean']['input'];
  requestId: Scalars['ID']['input'];
};

export type MutationRevokeCertificationArgs = {
  certificationId: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type MutationRunReconciliationArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationSaveDispensaryProductTypesArgs = {
  dispensaryId: Scalars['ID']['input'];
  types: Array<DispensaryProductTypeInput>;
};

export type MutationSaveThemeConfigArgs = {
  input: SaveThemeConfigInput;
};

export type MutationSendMarketingCampaignArgs = {
  campaignId: Scalars['ID']['input'];
  dispensaryId: Scalars['ID']['input'];
};

export type MutationSendTestEmailArgs = {
  body: Scalars['String']['input'];
  subject: Scalars['String']['input'];
  to: Scalars['String']['input'];
};

export type MutationSetActiveDispensaryProcessorArgs = {
  input: SetActiveDispensaryProcessorInput;
};

export type MutationSetCashDiscountArgs = {
  cashDeliveryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  dispensaryId: Scalars['ID']['input'];
  percent: Scalars['Float']['input'];
};

export type MutationSetDesignSystemArgs = {
  designSystem: Scalars['String']['input'];
  designSystemFile: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
};

export type MutationSetDispensaryProcessorEnabledArgs = {
  input: SetDispensaryProcessorEnabledInput;
};

export type MutationSetProductMetrcCategoryArgs = {
  input: SetMetrcCategoryInput;
};

export type MutationSetUserRoleArgs = {
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type MutationShipTransferArgs = {
  transferId: Scalars['ID']['input'];
};

export type MutationStartInventoryCountArgs = {
  countType?: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type MutationStartPreparingOrderArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  orderId: Scalars['ID']['input'];
};

export type MutationSuspendTenantArgs = {
  orgId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

export type MutationSyncBiotrackInventoryArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationSyncOrderToMetrcArgs = {
  dispensaryId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
};

export type MutationSyncPosInventoryArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationSyncPosProductsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationTagProductMetrcUidArgs = {
  input: TagProductUidInput;
};

export type MutationTagVariantPackageLabelArgs = {
  input: TagPackageLabelInput;
};

export type MutationTestPosConnectionArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationTogglePosSyncArgs = {
  dispensaryId: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
};

export type MutationUpdateAddressArgs = {
  addressId: Scalars['ID']['input'];
  input: AddAddressInput;
};

export type MutationUpdateBrandArgs = {
  brandId: Scalars['ID']['input'];
  input: UpdateBrandInput;
};

export type MutationUpdateCompanyArgs = {
  companyId: Scalars['ID']['input'];
  input: UpdateCompanyInput;
};

export type MutationUpdateCustomerProfileArgs = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  marketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredDispensaryId?: InputMaybe<Scalars['ID']['input']>;
  smsOptIn?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationUpdateDeliverySettingsArgs = {
  cashDeliveryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  cashDiscountPercent?: InputMaybe<Scalars['Float']['input']>;
  entityId: Scalars['ID']['input'];
  isDeliveryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationUpdateDispensaryArgs = {
  entityId: Scalars['ID']['input'];
  input: UpdateDispensaryInput;
};

export type MutationUpdateDriverStatusArgs = {
  driverId: Scalars['ID']['input'];
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  status: Scalars['String']['input'];
};

export type MutationUpdateEmployeeArgs = {
  input: UpdateEmployeeInput;
  profileId: Scalars['ID']['input'];
};

export type MutationUpdateFulfillmentStatusArgs = {
  dispensaryId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  orderId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};

export type MutationUpdateManifestStatusArgs = {
  manifestId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};

export type MutationUpdateManufacturerArgs = {
  input: UpdateManufacturerInput;
  manufacturerId: Scalars['ID']['input'];
};

export type MutationUpdateOperatingHoursArgs = {
  entityId: Scalars['ID']['input'];
  hours: Scalars['JSON']['input'];
};

export type MutationUpdateOrganizationArgs = {
  input: UpdateOrganizationInput;
  organizationId: Scalars['ID']['input'];
};

export type MutationUpdatePoStatusArgs = {
  poId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};

export type MutationUpdateProductArgs = {
  input: UpdateProductInput;
};

export type MutationUpdatePromotionArgs = {
  input: UpdatePromotionInput;
  promoId: Scalars['ID']['input'];
};

export type MutationUpdateSubscriptionArgs = {
  input: UpdateSubscriptionInput;
  organizationId: Scalars['ID']['input'];
};

export type MutationUpdateTaxRuleArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rate?: InputMaybe<Scalars['Float']['input']>;
  taxCategoryId: Scalars['Int']['input'];
};

export type MutationUpdateTenantArgs = {
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  billingStatus?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  orgId: Scalars['ID']['input'];
  subscriptionTier?: InputMaybe<Scalars['String']['input']>;
};

export type MutationUpdateVariantPriceArgs = {
  input: UpdateVariantPriceInput;
};

export type MutationUpdateVendorArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  paymentTerms?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  vendorId: Scalars['ID']['input'];
};

export type MutationUpsertBiotrackCredentialArgs = {
  apiKey: Scalars['String']['input'];
  apiSecret?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  state: Scalars['String']['input'];
};

export type MutationUpsertMetrcCredentialArgs = {
  input: UpsertCredentialInput;
};

export type MutationUpsertPosIntegrationArgs = {
  credentials: Scalars['JSON']['input'];
  dispensaryExternalId?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  provider: Scalars['String']['input'];
};

export type MutationValidateBiotrackCredentialArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationValidateMetrcCredentialArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type MutationVerifyAgeArgs = {
  dateOfBirth: Scalars['String']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  idExpiration?: InputMaybe<Scalars['String']['input']>;
  idNumberLast4?: InputMaybe<Scalars['String']['input']>;
  idState?: InputMaybe<Scalars['String']['input']>;
  idType: Scalars['String']['input'];
  method?: InputMaybe<Scalars['String']['input']>;
};

export type MutationVerifyCertificationArgs = {
  certificationId: Scalars['ID']['input'];
};

export type MutationVerifyIdentificationArgs = {
  customerId?: InputMaybe<Scalars['ID']['input']>;
  dispensaryId: Scalars['ID']['input'];
  image: Scalars['String']['input'];
};

export type MyLoyalty = {
  __typename?: 'MyLoyalty';
  allTiers: Array<LoyaltyTierInfo>;
  lifetimePoints: Scalars['Int']['output'];
  multiplier: Scalars['Float']['output'];
  nextTier?: Maybe<NextTierInfo>;
  pointValue: Scalars['Float']['output'];
  points: Scalars['Int']['output'];
  tier: Scalars['String']['output'];
  tierColor?: Maybe<Scalars['String']['output']>;
  tierName: Scalars['String']['output'];
  tierPerks?: Maybe<Scalars['String']['output']>;
};

export type NextTierInfo = {
  __typename?: 'NextTierInfo';
  name: Scalars['String']['output'];
  pointsNeeded: Scalars['Int']['output'];
};

export type NotificationLog = {
  __typename?: 'NotificationLog';
  body?: Maybe<Scalars['String']['output']>;
  channel: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  dispensaryId?: Maybe<Scalars['ID']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  logId: Scalars['ID']['output'];
  recipient: Scalars['String']['output'];
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status: Scalars['String']['output'];
  subject?: Maybe<Scalars['String']['output']>;
  templateCode?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type NotificationStats = {
  __typename?: 'NotificationStats';
  emails: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  sent: Scalars['Int']['output'];
  skipped: Scalars['Int']['output'];
  sms: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type NotificationTemplate = {
  __typename?: 'NotificationTemplate';
  bodyTemplate: Scalars['String']['output'];
  channel: Scalars['String']['output'];
  code: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  subject?: Maybe<Scalars['String']['output']>;
  templateId: Scalars['Int']['output'];
};

export type OpenRegisterSessionGqlInput = {
  dispensaryId: Scalars['ID']['input'];
  openingCashCents: Scalars['Int']['input'];
};

export type Order = {
  __typename?: 'Order';
  cancellationReason?: Maybe<Scalars['String']['output']>;
  cancelledAt?: Maybe<Scalars['DateTime']['output']>;
  cashDiscountApplied: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  customerUserId?: Maybe<Scalars['String']['output']>;
  discountTotal: Scalars['Float']['output'];
  dispensaryId: Scalars['String']['output'];
  fulfillmentAddress?: Maybe<Scalars['JSON']['output']>;
  metrcReceiptId?: Maybe<Scalars['String']['output']>;
  metrcReportedAt?: Maybe<Scalars['DateTime']['output']>;
  metrcSyncStatus?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  orderId: Scalars['ID']['output'];
  orderStatus: Scalars['String']['output'];
  orderType: Scalars['String']['output'];
  paymentMethod?: Maybe<Scalars['String']['output']>;
  scheduledPickupAt?: Maybe<Scalars['DateTime']['output']>;
  staffUserId?: Maybe<Scalars['String']['output']>;
  subtotal: Scalars['Float']['output'];
  taxTotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type OrderHistoryResult = {
  __typename?: 'OrderHistoryResult';
  orders: Array<CustomerOrderSummary>;
  total: Scalars['Int']['output'];
};

export type OrderLineItemInput = {
  productId: Scalars['ID']['input'];
  quantity: Scalars['Float']['input'];
  variantId?: InputMaybe<Scalars['ID']['input']>;
};

export type OrderStats = {
  __typename?: 'OrderStats';
  gmv30d: Scalars['Float']['output'];
  gmvTotal: Scalars['Float']['output'];
  last30d: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type OrderSummary = {
  __typename?: 'OrderSummary';
  createdAt: Scalars['DateTime']['output'];
  discountTotal: Scalars['Float']['output'];
  dispensaryId: Scalars['ID']['output'];
  lineItemCount: Scalars['Int']['output'];
  orderId: Scalars['ID']['output'];
  orderStatus: Scalars['String']['output'];
  orderType: Scalars['String']['output'];
  subtotal: Scalars['Float']['output'];
  taxBreakdown: Array<TaxLineItem>;
  taxTotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
};

export type OrderTracking = {
  __typename?: 'OrderTracking';
  createdAt: Scalars['DateTime']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  orderId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  trackingId: Scalars['ID']['output'];
  updatedByUserId?: Maybe<Scalars['ID']['output']>;
};

export type OrganizationListItem = {
  __typename?: 'OrganizationListItem';
  billingEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
  subscriptionStatus: Scalars['String']['output'];
  subscriptionTier: Scalars['String']['output'];
};

export type OrganizationResult = {
  __typename?: 'OrganizationResult';
  billingAddress?: Maybe<Scalars['String']['output']>;
  billingEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
  subscriptionStatus: Scalars['String']['output'];
  subscriptionTier: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PoLineItemInput = {
  productName: Scalars['String']['input'];
  quantityOrdered: Scalars['Int']['input'];
  sku?: InputMaybe<Scalars['String']['input']>;
  unitCost: Scalars['Float']['input'];
  variantId?: InputMaybe<Scalars['String']['input']>;
};

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  cashTendered?: Maybe<Scalars['Float']['output']>;
  changeGiven?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['String']['output'];
  failureReason?: Maybe<Scalars['String']['output']>;
  method: Scalars['String']['output'];
  orderId: Scalars['String']['output'];
  paymentId: Scalars['ID']['output'];
  processorName?: Maybe<Scalars['String']['output']>;
  processorTransactionId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  terminalId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PaymentMethodInfo = {
  __typename?: 'PaymentMethodInfo';
  enabled: Scalars['Boolean']['output'];
  method: Scalars['String']['output'];
};

export type PayrollRow = {
  __typename?: 'PayrollRow';
  email: Scalars['String']['output'];
  employeeNumber?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  grossPayWithOt?: Maybe<Scalars['Float']['output']>;
  hourlyRate?: Maybe<Scalars['Float']['output']>;
  isExempt: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  overtimeEligible: Scalars['Boolean']['output'];
  overtimeHours: Scalars['Float']['output'];
  payType: Scalars['String']['output'];
  positionName?: Maybe<Scalars['String']['output']>;
  regularPay?: Maybe<Scalars['Float']['output']>;
  salary?: Maybe<Scalars['Float']['output']>;
  shiftsWorked: Scalars['Int']['output'];
  totalBreakMinutes: Scalars['Int']['output'];
  totalHours: Scalars['Float']['output'];
};

export type PerformanceReview = {
  __typename?: 'PerformanceReview';
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  areasForImprovement?: Maybe<Scalars['String']['output']>;
  complianceRating?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['DateTime']['output'];
  employeeComments?: Maybe<Scalars['String']['output']>;
  goals?: Maybe<Scalars['String']['output']>;
  managerComments?: Maybe<Scalars['String']['output']>;
  overallRating?: Maybe<Scalars['Int']['output']>;
  profileId: Scalars['ID']['output'];
  reliabilityRating?: Maybe<Scalars['Int']['output']>;
  reviewId: Scalars['ID']['output'];
  reviewPeriodEnd: Scalars['String']['output'];
  reviewPeriodStart: Scalars['String']['output'];
  reviewerUserId: Scalars['ID']['output'];
  salesRating?: Maybe<Scalars['Int']['output']>;
  status: Scalars['String']['output'];
  strengths?: Maybe<Scalars['String']['output']>;
  teamworkRating?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PlatformActivity = {
  __typename?: 'PlatformActivity';
  activity_id: Scalars['ID']['output'];
  activity_type: Scalars['String']['output'];
  created_at: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  org_name?: Maybe<Scalars['String']['output']>;
};

export type PlatformDashboard = {
  __typename?: 'PlatformDashboard';
  dispensaries: DispStats;
  orders: OrderStats;
  revenue: RevenueStats;
  tenants: TenantStats;
  tierBreakdown: Array<TierBreakdown>;
  totalLocations: Scalars['Int']['output'];
  users: UserStats;
};

export type PlatformReport = {
  __typename?: 'PlatformReport';
  churnRate: Scalars['Float']['output'];
  churned: Scalars['Int']['output'];
  tenantHealth: Scalars['JSON']['output'];
  totalTenants: Scalars['Int']['output'];
};

export type PlatformTenant = {
  __typename?: 'PlatformTenant';
  billingEmail?: Maybe<Scalars['String']['output']>;
  billingStatus?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dispensaryCount?: Maybe<Scalars['Int']['output']>;
  monthlyRevenue?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  onboardedAt?: Maybe<Scalars['DateTime']['output']>;
  orders30d?: Maybe<Scalars['Int']['output']>;
  orgId: Scalars['ID']['output'];
  revenue30d?: Maybe<Scalars['Float']['output']>;
  subscriptionTier?: Maybe<Scalars['String']['output']>;
  totalLocations?: Maybe<Scalars['Int']['output']>;
  trialEndsAt?: Maybe<Scalars['DateTime']['output']>;
  userCount?: Maybe<Scalars['Int']['output']>;
};

export type PointTransaction = {
  __typename?: 'PointTransaction';
  balanceAfter: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  points: Scalars['Int']['output'];
  transactionId: Scalars['ID']['output'];
  type: Scalars['String']['output'];
};

export type PosConnectionResult = {
  __typename?: 'PosConnectionResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type PosIntegration = {
  __typename?: 'PosIntegration';
  createdAt: Scalars['DateTime']['output'];
  dispensaryExternalId?: Maybe<Scalars['String']['output']>;
  dispensaryId: Scalars['ID']['output'];
  integrationId: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isSyncEnabled: Scalars['Boolean']['output'];
  lastSyncAt?: Maybe<Scalars['DateTime']['output']>;
  lastSyncError?: Maybe<Scalars['String']['output']>;
  lastSyncStatus?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PosOrderPushResult = {
  __typename?: 'PosOrderPushResult';
  error?: Maybe<Scalars['String']['output']>;
  externalOrderId?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type PosProductMapping = {
  __typename?: 'PosProductMapping';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  externalProductId: Scalars['String']['output'];
  externalVariantId?: Maybe<Scalars['String']['output']>;
  internalProductId: Scalars['ID']['output'];
  internalVariantId?: Maybe<Scalars['ID']['output']>;
  isConfirmed: Scalars['Boolean']['output'];
  lastSyncedAt?: Maybe<Scalars['DateTime']['output']>;
  mappingId: Scalars['ID']['output'];
  matchMethod?: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PosSyncLog = {
  __typename?: 'PosSyncLog';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  durationMs?: Maybe<Scalars['Int']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  itemsCreated: Scalars['Int']['output'];
  itemsFailed: Scalars['Int']['output'];
  itemsProcessed: Scalars['Int']['output'];
  itemsUpdated: Scalars['Int']['output'];
  provider: Scalars['String']['output'];
  status: Scalars['String']['output'];
  syncLogId: Scalars['ID']['output'];
  syncType: Scalars['String']['output'];
};

export type Product = {
  __typename?: 'Product';
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId?: Maybe<Scalars['ID']['output']>;
  brandId?: Maybe<Scalars['ID']['output']>;
  cbdPercent?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  dispensaryId: Scalars['ID']['output'];
  effects?: Maybe<Scalars['JSON']['output']>;
  enrichedAt?: Maybe<Scalars['DateTime']['output']>;
  extractionMethodId?: Maybe<Scalars['Int']['output']>;
  flavors?: Maybe<Scalars['JSON']['output']>;
  hasNoMinorAppeals: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isApproved: Scalars['Boolean']['output'];
  isChildResistantPackaged: Scalars['Boolean']['output'];
  isHempDerived: Scalars['Boolean']['output'];
  isResealable: Scalars['Boolean']['output'];
  isTamperEvident: Scalars['Boolean']['output'];
  lineage?: Maybe<Scalars['JSON']['output']>;
  manufacturerId?: Maybe<Scalars['ID']['output']>;
  metrcItemCategoryId?: Maybe<Scalars['Int']['output']>;
  metrcItemUid?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  netVolumeMl?: Maybe<Scalars['Float']['output']>;
  netWeightG?: Maybe<Scalars['Float']['output']>;
  otreebaOcpc?: Maybe<Scalars['String']['output']>;
  packagingTypeId?: Maybe<Scalars['Int']['output']>;
  primaryCategoryId?: Maybe<Scalars['Int']['output']>;
  productTypeId?: Maybe<Scalars['Int']['output']>;
  shortDescription?: Maybe<Scalars['String']['output']>;
  sku?: Maybe<Scalars['String']['output']>;
  strainId?: Maybe<Scalars['ID']['output']>;
  strainName?: Maybe<Scalars['String']['output']>;
  strainType?: Maybe<Scalars['String']['output']>;
  taxCategoryId?: Maybe<Scalars['Int']['output']>;
  terpenes?: Maybe<Scalars['JSON']['output']>;
  thcPercent?: Maybe<Scalars['Float']['output']>;
  totalThcMgPerContainer?: Maybe<Scalars['Float']['output']>;
  uomId?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variants: Array<ProductVariant>;
};

export type ProductSales = {
  __typename?: 'ProductSales';
  orders: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  unitsSold: Scalars['Int']['output'];
  variantName?: Maybe<Scalars['String']['output']>;
};

export type ProductSearchResult = {
  __typename?: 'ProductSearchResult';
  facets: SearchFacets;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  products: Array<Product>;
  total: Scalars['Int']['output'];
};

export type ProductUidPair = {
  metrcItemUid: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};

export type ProductVariant = {
  __typename?: 'ProductVariant';
  barcode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  dispensaryId: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  metrcPackageLabel?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  quantityPerUnit?: Maybe<Scalars['Float']['output']>;
  retailPrice?: Maybe<Scalars['Float']['output']>;
  sku?: Maybe<Scalars['String']['output']>;
  sortOrder?: Maybe<Scalars['Int']['output']>;
  stockQuantity?: Maybe<Scalars['Float']['output']>;
  stockStatus?: Maybe<Scalars['String']['output']>;
  uomId?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  variantId: Scalars['ID']['output'];
};

export type PromotionCategoryResult = {
  __typename?: 'PromotionCategoryResult';
  categoryId: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isEligible: Scalars['Boolean']['output'];
  promoId: Scalars['ID']['output'];
};

export type PromotionListItem = {
  __typename?: 'PromotionListItem';
  code?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  discountValue: Scalars['Float']['output'];
  dispensaryId: Scalars['ID']['output'];
  endAt?: Maybe<Scalars['DateTime']['output']>;
  isActive: Scalars['Boolean']['output'];
  maxUses?: Maybe<Scalars['Int']['output']>;
  minimumOrderTotal?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  promoId: Scalars['ID']['output'];
  startAt?: Maybe<Scalars['DateTime']['output']>;
  type: Scalars['String']['output'];
  usesCount: Scalars['Int']['output'];
};

export type PromotionProductResult = {
  __typename?: 'PromotionProductResult';
  id: Scalars['ID']['output'];
  isEligible: Scalars['Boolean']['output'];
  productId?: Maybe<Scalars['ID']['output']>;
  promoId: Scalars['ID']['output'];
  variantId?: Maybe<Scalars['ID']['output']>;
};

export type PromotionResult = {
  __typename?: 'PromotionResult';
  appliesTo?: Maybe<Scalars['String']['output']>;
  appliesToBrandId?: Maybe<Scalars['ID']['output']>;
  appliesToProductTypeId?: Maybe<Scalars['Float']['output']>;
  appliesToTaxCategoryId?: Maybe<Scalars['Float']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  discountValue: Scalars['Float']['output'];
  dispensaryId: Scalars['ID']['output'];
  endAt?: Maybe<Scalars['DateTime']['output']>;
  isActive: Scalars['Boolean']['output'];
  isMedicalDiscount: Scalars['Boolean']['output'];
  isStaffDiscount: Scalars['Boolean']['output'];
  maxUses?: Maybe<Scalars['Int']['output']>;
  maxUsesPerCustomer?: Maybe<Scalars['Int']['output']>;
  minimumOrderTotal?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  promoId: Scalars['ID']['output'];
  stackableWithOthers: Scalars['Boolean']['output'];
  startAt?: Maybe<Scalars['DateTime']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  usesCount: Scalars['Int']['output'];
};

export type ProvisionAeropayInput = {
  apiKey: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  isSandbox?: InputMaybe<Scalars['Boolean']['input']>;
  merchantId: Scalars['String']['input'];
};

export type ProvisionCanPayInput = {
  apiKey: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  isSandbox?: InputMaybe<Scalars['Boolean']['input']>;
  merchantId: Scalars['String']['input'];
};

export type ProvisionKioskInput = {
  dispensaryId: Scalars['ID']['input'];
  label: Scalars['String']['input'];
};

export type PurchaseLimitResult = {
  __typename?: 'PurchaseLimitResult';
  allowed: Scalars['Boolean']['output'];
  limit?: Maybe<Scalars['Float']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  remaining?: Maybe<Scalars['Float']['output']>;
};

export type PurchaseOrder = {
  __typename?: 'PurchaseOrder';
  expected_delivery?: Maybe<Scalars['String']['output']>;
  items?: Maybe<Scalars['JSON']['output']>;
  line_items?: Maybe<Scalars['Int']['output']>;
  order_date?: Maybe<Scalars['String']['output']>;
  payment_status?: Maybe<Scalars['String']['output']>;
  po_id: Scalars['ID']['output'];
  po_number: Scalars['String']['output'];
  status: Scalars['String']['output'];
  subtotal: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  total_units?: Maybe<Scalars['Int']['output']>;
  vendor_name?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  activeClocks: Array<ActiveClock>;
  activeDispensaryProcessor: ActiveProcessorResult;
  activePromotions: Array<PromotionListItem>;
  adjustmentReasons: Array<LkpAdjustmentReason>;
  adminProducts: Array<Product>;
  allMetrcCredentials: Array<MetrcCredential>;
  audienceCount: Scalars['Int']['output'];
  auditLog: Array<AuditLog>;
  autocompleteProducts: Array<AutocompleteResult>;
  availablePaymentMethods: Array<PaymentMethodInfo>;
  availableRewards: Array<LoyaltyReward>;
  availableTimeSlots: Array<AvailableSlotResult>;
  biotrackCredential?: Maybe<BiotrackCredential>;
  birthdayBonusCheck: BirthdayCheck;
  brand?: Maybe<BrandResult>;
  brands: Array<BrandListItem>;
  brandsByOrganization: Array<BrandListItem>;
  cachedStrains: Array<StrainData>;
  campaignStats: CampaignStats;
  cashDiscountConfig: CashDiscountConfig;
  certificationTypes: Array<LkpCertificationType>;
  checkDeliveryEligibility: DeliveryEligibilityResult;
  checkPromoEligibility: EligibilityResult;
  checkPurchaseLimit: PurchaseLimitResult;
  clockStatus: ClockStatus;
  companies: Array<CompanyListItem>;
  companiesByOrganization: Array<CompanyListItem>;
  company?: Maybe<CompanyResult>;
  compareProducts: Array<KnowledgeProduct>;
  complianceAlerts: ComplianceAlertsResult;
  complianceSummary: ComplianceSummary;
  complianceSystem: Scalars['String']['output'];
  countItems: Array<InventoryCountItem>;
  coverageGaps: Array<ScheduledShift>;
  customerByPhone?: Maybe<KioskCustomerLookup>;
  customers: Array<CustomerProfile>;
  dashboard: DashboardData;
  deadStock: Array<InventoryAdjustment>;
  deliveryZones: Array<DeliveryZone>;
  designSystemConfig: DesignSystemConfig;
  dispensaries: Array<DispensaryListItem>;
  dispensariesByCompany: Array<DispensaryListItem>;
  dispensary?: Maybe<DispensaryResult>;
  dispensaryBySlug?: Maybe<DispensaryPublic>;
  dispensaryPaymentProcessors: Array<DispensaryPaymentProcessor>;
  dispensaryProductTypes: Array<DispensaryProductType>;
  driverStats: DriverStats;
  driverTrips: Array<DeliveryTrip>;
  drivers: Array<DriverProfile>;
  employee: EmployeeListItem;
  employeeCertifications: Array<EmployeeCertification>;
  employees: Array<EmployeeListItem>;
  entityAuditTrail: Array<AuditLog>;
  expiringCertifications: Array<EmployeeCertification>;
  expiringInventory?: Maybe<Array<InventoryAdjustment>>;
  failedMetrcSyncs: FailedSyncDashboard;
  inventoryAdjustments: Array<InventoryAdjustment>;
  inventoryByDispensary: Array<InventoryListItem>;
  inventoryByVariant?: Maybe<InventoryResult>;
  inventoryHealth: InventoryHealth;
  inventoryItem?: Maybe<InventoryResult>;
  inventoryOverview: InventoryOverview;
  inventoryTransactions: Array<InventoryTransactionResult>;
  inventoryTransfers: Array<InventoryTransfer>;
  inventoryValue: InventoryValueResult;
  laborCostReport: LaborCostSummary;
  lowStockItems: Array<LowStockItem>;
  loyaltyStats: LoyaltyStats;
  manifestItems: Array<MetrcManifestItem>;
  manifests: Array<MetrcManifest>;
  manufacturer?: Maybe<ManufacturerResult>;
  manufacturers: Array<ManufacturerListItem>;
  manufacturersByBrand: Array<ManufacturerListItem>;
  marketingAutomations: Array<MarketingAutomation>;
  marketingCampaigns: Array<MarketingCampaign>;
  me: User;
  metrcComplianceReport: ComplianceReport;
  metrcCredential?: Maybe<MetrcCredential>;
  metrcSyncOverview: MetrcSyncOverview;
  myAddresses: Array<CustomerAddress>;
  myCurrentRegisterSession?: Maybe<RegisterSession>;
  myFavorites: Array<CustomerFavorite>;
  myLastOrder?: Maybe<CustomerOrder>;
  myLoyalty?: Maybe<MyLoyalty>;
  myNotifications: Array<NotificationLog>;
  myOrders: OrderHistoryResult;
  myOrganization?: Maybe<OrganizationResult>;
  myPointHistory: Array<PointTransaction>;
  myProfile?: Maybe<CustomerProfile>;
  myShifts: Array<ScheduledShift>;
  myTimeEntries: Array<TimeEntry>;
  notificationStats: NotificationStats;
  notificationTemplates: Array<NotificationTemplate>;
  order?: Maybe<Order>;
  orderPayment?: Maybe<Payment>;
  orderTracking: Array<OrderTracking>;
  orders: Array<Order>;
  organization?: Maybe<OrganizationResult>;
  organizations: Array<OrganizationListItem>;
  payrollReport: Array<PayrollRow>;
  performanceReviews: Array<PerformanceReview>;
  personalizedForMe: Array<RecommendedProduct>;
  platformActivity: Array<PlatformActivity>;
  platformDashboard: PlatformDashboard;
  platformInvoices: Array<BillingInvoice>;
  platformReport: PlatformReport;
  platformTaxRules: Array<TaxRule>;
  platformTenant: PlatformTenant;
  platformTenants: Array<PlatformTenant>;
  popularInCategory: Array<RecommendedProduct>;
  posIntegration?: Maybe<PosIntegration>;
  posProductMappings: Array<PosProductMapping>;
  posSyncLogs: Array<PosSyncLog>;
  positions: Array<LkpPosition>;
  previewCashDiscount: CashDiscountPreview;
  product?: Maybe<Product>;
  productCategories: Array<LkpProductCategory>;
  productCount: Scalars['Int']['output'];
  productTypes: Array<LkpProductType>;
  products: Array<Product>;
  productsByCondition: Array<KnowledgeProduct>;
  productsByEffect: Array<KnowledgeProduct>;
  promotion?: Maybe<PromotionResult>;
  promotionCategories: Array<PromotionCategoryResult>;
  promotionProducts: Array<PromotionProductResult>;
  promotionsByDispensary: Array<PromotionListItem>;
  purchaseLimitAlerts: Array<ComplianceAlert>;
  purchaseOrder: Scalars['JSON']['output'];
  purchaseOrders: Array<PurchaseOrder>;
  recommendations: Array<RecommendedProduct>;
  reconciliationItems: Array<ReconciliationItem>;
  reconciliationReports: Array<ReconciliationReport>;
  reorderAlerts: Array<InventoryAdjustment>;
  reorderSuggestions: Array<ReorderSuggestion>;
  salesByDay: Array<DailySales>;
  salesByHour: Array<HourlySales>;
  salesByProduct: Array<ProductSales>;
  salesOverview: SalesOverview;
  salesReport: SalesSummary;
  salesTrend: Array<SalesTrend>;
  searchCustomers: Array<CustomerSearchResult>;
  searchProducts: Array<SearchResultType>;
  searchStrains: Array<StrainData>;
  shrinkageReport: ShrinkageReport;
  staffComplianceOverview: ComplianceOverview;
  subscriptionTiers: Array<Scalars['JSON']['output']>;
  taxReport: TaxReport;
  themeConfig: ThemeConfigType;
  timeEntries: Array<TimeEntry>;
  timeOffRequests: Array<TimeOffRequest>;
  topProducts: Array<TopProduct>;
  transferItems: Array<InventoryTransferItem>;
  trending: Array<RecommendedProduct>;
  user?: Maybe<User>;
  usersByDispensary: Array<User>;
  varianceReport: Array<InventoryCountItem>;
  vendor: Scalars['JSON']['output'];
  vendorStats: VendorStats;
  vendors: Array<Vendor>;
  verificationHistory: Array<IdVerificationResult>;
  vibeSearch: Array<SearchResultType>;
  wasteLogs: Array<WasteDestructionLog>;
  weekSchedule: Array<ScheduledShift>;
};

export type QueryActiveClocksArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryActiveDispensaryProcessorArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryActivePromotionsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryAdminProductsArgs = {
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  productTypeId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAudienceCountArgs = {
  dispensaryId: Scalars['ID']['input'];
  filter?: Scalars['String']['input'];
};

export type QueryAuditLogArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  entityType?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryAutocompleteProductsArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QueryAvailablePaymentMethodsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryAvailableRewardsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryAvailableTimeSlotsArgs = {
  date: Scalars['String']['input'];
  dispensaryId: Scalars['ID']['input'];
  slotType: Scalars['String']['input'];
};

export type QueryBiotrackCredentialArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryBirthdayBonusCheckArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryBrandArgs = {
  brandId: Scalars['ID']['input'];
};

export type QueryBrandsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryBrandsByOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};

export type QueryCachedStrainsArgs = {
  type?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCampaignStatsArgs = {
  campaignId: Scalars['ID']['input'];
};

export type QueryCashDiscountConfigArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryCheckDeliveryEligibilityArgs = {
  dispensaryId: Scalars['ID']['input'];
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  orderSubtotal?: InputMaybe<Scalars['Float']['input']>;
};

export type QueryCheckPromoEligibilityArgs = {
  customerId?: InputMaybe<Scalars['ID']['input']>;
  orderTotal: Scalars['Float']['input'];
  promoId: Scalars['ID']['input'];
};

export type QueryCheckPurchaseLimitArgs = {
  dispensaryId: Scalars['ID']['input'];
  productCategory: Scalars['String']['input'];
  quantityGrams: Scalars['Float']['input'];
};

export type QueryClockStatusArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryCompaniesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryCompaniesByOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};

export type QueryCompanyArgs = {
  companyId: Scalars['ID']['input'];
};

export type QueryCompareProductsArgs = {
  productIds: Array<Scalars['ID']['input']>;
};

export type QueryComplianceAlertsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryComplianceSummaryArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryComplianceSystemArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryCountItemsArgs = {
  countId: Scalars['ID']['input'];
};

export type QueryCoverageGapsArgs = {
  dispensaryId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};

export type QueryCustomerByPhoneArgs = {
  dispensaryId: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
};

export type QueryCustomersArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDashboardArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryDeadStockArgs = {
  daysSinceMovement?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDeliveryZonesArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDesignSystemConfigArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDispensariesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDispensariesByCompanyArgs = {
  companyId: Scalars['ID']['input'];
};

export type QueryDispensaryArgs = {
  entityId: Scalars['ID']['input'];
};

export type QueryDispensaryBySlugArgs = {
  slug: Scalars['String']['input'];
};

export type QueryDispensaryPaymentProcessorsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDispensaryProductTypesArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDriverStatsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryDriverTripsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  driverId: Scalars['ID']['input'];
};

export type QueryDriversArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryEmployeeArgs = {
  profileId: Scalars['ID']['input'];
};

export type QueryEmployeeCertificationsArgs = {
  profileId: Scalars['ID']['input'];
};

export type QueryEmployeesArgs = {
  dispensaryId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryEntityAuditTrailArgs = {
  entityId: Scalars['String']['input'];
  entityType: Scalars['String']['input'];
};

export type QueryExpiringCertificationsArgs = {
  daysAhead?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryExpiringInventoryArgs = {
  daysAhead?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryFailedMetrcSyncsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryInventoryAdjustmentsArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryInventoryByDispensaryArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryInventoryByVariantArgs = {
  dispensaryId: Scalars['ID']['input'];
  variantId: Scalars['ID']['input'];
};

export type QueryInventoryHealthArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryInventoryItemArgs = {
  inventoryId: Scalars['ID']['input'];
};

export type QueryInventoryOverviewArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryInventoryTransactionsArgs = {
  inventoryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryInventoryTransfersArgs = {
  direction?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryInventoryValueArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryLaborCostReportArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryLowStockItemsArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryLoyaltyStatsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryManifestItemsArgs = {
  manifestId: Scalars['ID']['input'];
};

export type QueryManifestsArgs = {
  dispensaryId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryManufacturerArgs = {
  manufacturerId: Scalars['ID']['input'];
};

export type QueryManufacturersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryManufacturersByBrandArgs = {
  brandId: Scalars['ID']['input'];
};

export type QueryMarketingAutomationsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryMarketingCampaignsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryMetrcComplianceReportArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryMetrcCredentialArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryMetrcSyncOverviewArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryMyCurrentRegisterSessionArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryMyFavoritesArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyLastOrderArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryMyLoyaltyArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryMyNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyOrdersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyPointHistoryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryMyShiftsArgs = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryMyTimeEntriesArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryNotificationStatsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
};

export type QueryOrderArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  orderId: Scalars['ID']['input'];
};

export type QueryOrderPaymentArgs = {
  orderId: Scalars['ID']['input'];
};

export type QueryOrderTrackingArgs = {
  orderId: Scalars['ID']['input'];
};

export type QueryOrdersArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};

export type QueryOrganizationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPayrollReportArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryPerformanceReviewsArgs = {
  profileId: Scalars['ID']['input'];
};

export type QueryPersonalizedForMeArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPlatformActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPlatformInvoicesArgs = {
  orgId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryPlatformTenantArgs = {
  orgId: Scalars['ID']['input'];
};

export type QueryPopularInCategoryArgs = {
  categoryId: Scalars['ID']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPosIntegrationArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryPosProductMappingsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryPosSyncLogsArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPreviewCashDiscountArgs = {
  dispensaryId: Scalars['ID']['input'];
  subtotal: Scalars['Float']['input'];
};

export type QueryProductArgs = {
  dispensaryId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};

export type QueryProductCountArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryProductsArgs = {
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  productTypeId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryProductsByConditionArgs = {
  condition: Scalars['String']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryProductsByEffectArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  effect: Scalars['String']['input'];
};

export type QueryPromotionArgs = {
  promoId: Scalars['ID']['input'];
};

export type QueryPromotionCategoriesArgs = {
  promoId: Scalars['ID']['input'];
};

export type QueryPromotionProductsArgs = {
  promoId: Scalars['ID']['input'];
};

export type QueryPromotionsByDispensaryArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryPurchaseLimitAlertsArgs = {
  customerId: Scalars['ID']['input'];
  dispensaryId: Scalars['ID']['input'];
};

export type QueryPurchaseOrderArgs = {
  poId: Scalars['ID']['input'];
};

export type QueryPurchaseOrdersArgs = {
  dispensaryId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryRecommendationsArgs = {
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  productId: Scalars['ID']['input'];
};

export type QueryReconciliationItemsArgs = {
  reportId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryReconciliationReportsArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryReorderAlertsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryReorderSuggestionsArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QuerySalesByDayArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QuerySalesByHourArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QuerySalesByProductArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QuerySalesOverviewArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QuerySalesReportArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QuerySalesTrendArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
};

export type QuerySearchCustomersArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySearchProductsArgs = {
  dispensaryId: Scalars['String']['input'];
  filters?: InputMaybe<SearchFiltersInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};

export type QuerySearchStrainsArgs = {
  name: Scalars['String']['input'];
};

export type QueryShrinkageReportArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryStaffComplianceOverviewArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryTaxReportArgs = {
  dispensaryId: Scalars['ID']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryThemeConfigArgs = {
  dispensaryId: Scalars['String']['input'];
};

export type QueryTimeEntriesArgs = {
  endDate: Scalars['String']['input'];
  profileId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
};

export type QueryTimeOffRequestsArgs = {
  dispensaryId: Scalars['ID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryTopProductsArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryTransferItemsArgs = {
  transferId: Scalars['ID']['input'];
};

export type QueryTrendingArgs = {
  days?: InputMaybe<Scalars['Int']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type QueryUsersByDispensaryArgs = {
  dispensaryId: Scalars['ID']['input'];
};

export type QueryVarianceReportArgs = {
  countId: Scalars['ID']['input'];
};

export type QueryVendorArgs = {
  vendorId: Scalars['ID']['input'];
};

export type QueryVerificationHistoryArgs = {
  customerId: Scalars['ID']['input'];
};

export type QueryVibeSearchArgs = {
  dispensaryId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  vibe: Scalars['String']['input'];
};

export type QueryWasteLogsArgs = {
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryWeekScheduleArgs = {
  dispensaryId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};

export type ReceiveItemInput = {
  itemId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantityReceived: Scalars['Int']['input'];
};

export type RecommendedProduct = {
  __typename?: 'RecommendedProduct';
  coCount?: Maybe<Scalars['Int']['output']>;
  effects?: Maybe<Array<Scalars['String']['output']>>;
  matchScore?: Maybe<Scalars['Int']['output']>;
  orderCount?: Maybe<Scalars['Int']['output']>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  unitsSold?: Maybe<Scalars['Int']['output']>;
};

export type ReconciliationItem = {
  __typename?: 'ReconciliationItem';
  itemId: Scalars['ID']['output'];
  localQuantity?: Maybe<Scalars['Int']['output']>;
  metrcPackageTag?: Maybe<Scalars['String']['output']>;
  metrcQuantity?: Maybe<Scalars['Int']['output']>;
  productName?: Maybe<Scalars['String']['output']>;
  reportId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  variance?: Maybe<Scalars['Int']['output']>;
};

export type ReconciliationReport = {
  __typename?: 'ReconciliationReport';
  created_at: Scalars['DateTime']['output'];
  discrepancyCount: Scalars['Int']['output'];
  dispensaryId: Scalars['ID']['output'];
  matchedItems: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  reportDate: Scalars['String']['output'];
  reportId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  totalLocalItems: Scalars['Int']['output'];
  totalMetrcItems: Scalars['Int']['output'];
};

export type RedeemResult = {
  __typename?: 'RedeemResult';
  newBalance: Scalars['Int']['output'];
  rewardName: Scalars['String']['output'];
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RegisterSession = {
  __typename?: 'RegisterSession';
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  closingCashCents?: Maybe<Scalars['Float']['output']>;
  dispensaryId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  openedAt: Scalars['DateTime']['output'];
  openedByUserId: Scalars['ID']['output'];
  openingCashCents: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ReorderSuggestion = {
  __typename?: 'ReorderSuggestion';
  avgDailySales: Scalars['Float']['output'];
  daysOfStockRemaining: Scalars['Float']['output'];
  inventoryId: Scalars['ID']['output'];
  leadTimeDays: Scalars['Float']['output'];
  productName: Scalars['String']['output'];
  quantityAvailable: Scalars['Float']['output'];
  suggestedQuantity: Scalars['Int']['output'];
  suggestedReorderDate?: Maybe<Scalars['String']['output']>;
  variantId: Scalars['ID']['output'];
  variantName?: Maybe<Scalars['String']['output']>;
};

export type RevenueStats = {
  __typename?: 'RevenueStats';
  arr: Scalars['Float']['output'];
  mrr: Scalars['Float']['output'];
};

export type SalesOverview = {
  __typename?: 'SalesOverview';
  averageOrderValue: Scalars['Float']['output'];
  cancelledOrders: Scalars['Int']['output'];
  completedOrders: Scalars['Int']['output'];
  pendingOrders: Scalars['Int']['output'];
  totalDiscount: Scalars['Float']['output'];
  totalOrders: Scalars['Int']['output'];
  totalRevenue: Scalars['Float']['output'];
  totalTax: Scalars['Float']['output'];
};

export type SalesSummary = {
  __typename?: 'SalesSummary';
  avgOrderValue: Scalars['Float']['output'];
  cancelledOrders: Scalars['Int']['output'];
  cardOrders: Scalars['Int']['output'];
  cashOrders: Scalars['Int']['output'];
  completedOrders: Scalars['Int']['output'];
  deliveryOrders: Scalars['Int']['output'];
  grossSales: Scalars['Float']['output'];
  netRevenue: Scalars['Float']['output'];
  pickupOrders: Scalars['Int']['output'];
  totalCashDiscounts: Scalars['Float']['output'];
  totalDiscounts: Scalars['Float']['output'];
  totalOrders: Scalars['Int']['output'];
  totalTax: Scalars['Float']['output'];
};

export type SalesTrend = {
  __typename?: 'SalesTrend';
  averageOrderValue: Scalars['Float']['output'];
  orders: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
};

export type SaveThemeConfigInput = {
  accent?: InputMaybe<Scalars['String']['input']>;
  bgCard?: InputMaybe<Scalars['String']['input']>;
  bgPrimary?: InputMaybe<Scalars['String']['input']>;
  bgSecondary?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['String']['input'];
  error?: InputMaybe<Scalars['String']['input']>;
  info?: InputMaybe<Scalars['String']['input']>;
  isDark?: InputMaybe<Scalars['Boolean']['input']>;
  preset?: InputMaybe<Scalars['String']['input']>;
  primary?: InputMaybe<Scalars['String']['input']>;
  secondary?: InputMaybe<Scalars['String']['input']>;
  sidebarBg?: InputMaybe<Scalars['String']['input']>;
  sidebarText?: InputMaybe<Scalars['String']['input']>;
  success?: InputMaybe<Scalars['String']['input']>;
  textPrimary?: InputMaybe<Scalars['String']['input']>;
  textSecondary?: InputMaybe<Scalars['String']['input']>;
  warning?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduledShift = {
  __typename?: 'ScheduledShift';
  created_at: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  endTime: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  profileId: Scalars['ID']['output'];
  published: Scalars['Boolean']['output'];
  shiftDate: Scalars['String']['output'];
  shiftId: Scalars['ID']['output'];
  startTime: Scalars['String']['output'];
  status: Scalars['String']['output'];
  templateId?: Maybe<Scalars['ID']['output']>;
  updated_at: Scalars['DateTime']['output'];
};

export type SearchFacets = {
  __typename?: 'SearchFacets';
  effects: Array<FacetCount>;
  flavors: Array<FacetCount>;
  maxPrice: Scalars['Float']['output'];
  maxThc: Scalars['Float']['output'];
  minPrice: Scalars['Float']['output'];
  minThc: Scalars['Float']['output'];
  productTypes: Array<FacetCount>;
  strainTypes: Array<FacetCount>;
};

export type SearchFiltersInput = {
  effects?: InputMaybe<Array<Scalars['String']['input']>>;
  maxThc?: InputMaybe<Scalars['Float']['input']>;
  minThc?: InputMaybe<Scalars['Float']['input']>;
  strainType?: InputMaybe<Scalars['String']['input']>;
};

export type SearchResultType = {
  __typename?: 'SearchResultType';
  cbdPercent?: Maybe<Scalars['Float']['output']>;
  effects?: Maybe<Array<Scalars['String']['output']>>;
  flavors?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  productId: Scalars['String']['output'];
  score: Scalars['Float']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  terpenes?: Maybe<Array<Scalars['String']['output']>>;
  thcPercent?: Maybe<Scalars['Float']['output']>;
};

export type SetActiveDispensaryProcessorInput = {
  dispensaryId: Scalars['ID']['input'];
  processorName?: InputMaybe<DispensaryProcessorName>;
};

export type SetDispensaryProcessorEnabledInput = {
  dispensaryId: Scalars['ID']['input'];
  isEnabled: Scalars['Boolean']['input'];
  isSandbox?: InputMaybe<Scalars['Boolean']['input']>;
  processorName: DispensaryProcessorName;
};

export type SetMetrcCategoryInput = {
  dispensaryId: Scalars['ID']['input'];
  metrcItemCategoryId: Scalars['Int']['input'];
  productId: Scalars['ID']['input'];
};

export type ShiftSwapRequest = {
  __typename?: 'ShiftSwapRequest';
  coveringProfileId?: Maybe<Scalars['ID']['output']>;
  created_at: Scalars['DateTime']['output'];
  originalShiftId: Scalars['ID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  requestingProfileId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  swapId: Scalars['ID']['output'];
};

export type ShrinkageByReason = {
  __typename?: 'ShrinkageByReason';
  count: Scalars['Int']['output'];
  estimatedValue: Scalars['Float']['output'];
  reason: Scalars['String']['output'];
  reasonCode: Scalars['String']['output'];
  units: Scalars['Int']['output'];
};

export type ShrinkageReport = {
  __typename?: 'ShrinkageReport';
  byReason: Array<ShrinkageByReason>;
  estimatedValueLost: Scalars['Float']['output'];
  totalAdjustments: Scalars['Int']['output'];
  totalUnitsLost: Scalars['Int']['output'];
};

export type StrainData = {
  __typename?: 'StrainData';
  cbdAvg?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  effects?: Maybe<Scalars['JSON']['output']>;
  flavors?: Maybe<Scalars['JSON']['output']>;
  genetics?: Maybe<Scalars['String']['output']>;
  lastSyncedAt?: Maybe<Scalars['DateTime']['output']>;
  lineage?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
  ocpc?: Maybe<Scalars['String']['output']>;
  photoUrl?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  strainDataId: Scalars['ID']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  terpenes?: Maybe<Scalars['JSON']['output']>;
  thcAvg?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type TagPackageLabelInput = {
  dispensaryId: Scalars['ID']['input'];
  metrcPackageLabel: Scalars['String']['input'];
  variantId: Scalars['ID']['input'];
};

export type TagProductUidInput = {
  dispensaryId: Scalars['ID']['input'];
  metrcItemUid: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};

export type TaxBreakdownItem = {
  __typename?: 'TaxBreakdownItem';
  estimatedTax: Scalars['Float']['output'];
  rate: Scalars['Float']['output'];
  statutoryReference?: Maybe<Scalars['String']['output']>;
  taxBasis: Scalars['String']['output'];
  taxCode: Scalars['String']['output'];
  taxName: Scalars['String']['output'];
};

export type TaxLineItem = {
  __typename?: 'TaxLineItem';
  amount: Scalars['Float']['output'];
  label: Scalars['String']['output'];
  ratePercent: Scalars['Float']['output'];
};

export type TaxReport = {
  __typename?: 'TaxReport';
  dispensaryName?: Maybe<Scalars['String']['output']>;
  licenseNumber?: Maybe<Scalars['String']['output']>;
  netTaxable: Scalars['Float']['output'];
  state?: Maybe<Scalars['String']['output']>;
  taxBreakdown: Array<TaxBreakdownItem>;
  taxableSales: Scalars['Float']['output'];
  totalDiscounts: Scalars['Float']['output'];
  totalTaxCollected: Scalars['Float']['output'];
  transactionCount: Scalars['Int']['output'];
};

export type TaxRule = {
  __typename?: 'TaxRule';
  code: Scalars['String']['output'];
  is_active: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  rate: Scalars['Float']['output'];
  state: Scalars['String']['output'];
  statutory_reference?: Maybe<Scalars['String']['output']>;
  tax_basis: Scalars['String']['output'];
  tax_category_id: Scalars['Int']['output'];
};

export type TenantStats = {
  __typename?: 'TenantStats';
  active: Scalars['Int']['output'];
  suspended: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  trial: Scalars['Int']['output'];
};

export type ThemeConfigType = {
  __typename?: 'ThemeConfigType';
  accent: Scalars['String']['output'];
  bgCard: Scalars['String']['output'];
  bgPrimary: Scalars['String']['output'];
  bgSecondary: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['String']['output'];
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  info: Scalars['String']['output'];
  isDark: Scalars['Boolean']['output'];
  preset: Scalars['String']['output'];
  primary: Scalars['String']['output'];
  secondary: Scalars['String']['output'];
  sidebarBg: Scalars['String']['output'];
  sidebarText: Scalars['String']['output'];
  success: Scalars['String']['output'];
  textPrimary: Scalars['String']['output'];
  textSecondary: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  warning: Scalars['String']['output'];
};

export type TierBreakdown = {
  __typename?: 'TierBreakdown';
  count: Scalars['Int']['output'];
  revenue: Scalars['Float']['output'];
  tier: Scalars['String']['output'];
};

export type TierCount = {
  __typename?: 'TierCount';
  count: Scalars['Int']['output'];
  tier: Scalars['String']['output'];
};

export type TimeEntry = {
  __typename?: 'TimeEntry';
  approvedAt?: Maybe<Scalars['DateTime']['output']>;
  approvedByUserId?: Maybe<Scalars['ID']['output']>;
  breakMinutes: Scalars['Int']['output'];
  clockIn: Scalars['DateTime']['output'];
  clockOut?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  entryId: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  overtimeHours?: Maybe<Scalars['Float']['output']>;
  profileId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
  totalHours?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type TimeOffRequest = {
  __typename?: 'TimeOffRequest';
  created_at: Scalars['DateTime']['output'];
  dispensaryId: Scalars['ID']['output'];
  endDate: Scalars['String']['output'];
  profileId: Scalars['ID']['output'];
  reason?: Maybe<Scalars['String']['output']>;
  requestId: Scalars['ID']['output'];
  requestType: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type TopProduct = {
  __typename?: 'TopProduct';
  productId: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  revenue: Scalars['Float']['output'];
  strainType?: Maybe<Scalars['String']['output']>;
  unitsSold: Scalars['Int']['output'];
};

export type TransferItemInput = {
  quantity: Scalars['Int']['input'];
  variantId: Scalars['ID']['input'];
};

export type UpdateBrandInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  websiteUrl?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCompanyInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  dbaName?: InputMaybe<Scalars['String']['input']>;
  ein?: InputMaybe<Scalars['String']['input']>;
  legalName?: InputMaybe<Scalars['String']['input']>;
  licenseExpiryDate?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseState?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  metrcFacilityLicense?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  stateOfIncorporation?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDispensaryInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  county?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isDeliveryEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  isPickupEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  metrcLicenseNumber?: InputMaybe<Scalars['String']['input']>;
  municipality?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeInput = {
  department?: InputMaybe<Scalars['String']['input']>;
  emergencyContactName?: InputMaybe<Scalars['String']['input']>;
  emergencyContactPhone?: InputMaybe<Scalars['String']['input']>;
  employmentStatus?: InputMaybe<Scalars['String']['input']>;
  employmentType?: InputMaybe<Scalars['String']['input']>;
  hourlyRate?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  overtimeEligible?: InputMaybe<Scalars['Boolean']['input']>;
  payType?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  positionId?: InputMaybe<Scalars['Int']['input']>;
  salary?: InputMaybe<Scalars['Float']['input']>;
  terminationReason?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateManufacturerInput = {
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  brandId?: InputMaybe<Scalars['ID']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  contactEmail?: InputMaybe<Scalars['String']['input']>;
  contactPhone?: InputMaybe<Scalars['String']['input']>;
  dbaName?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  legalName?: InputMaybe<Scalars['String']['input']>;
  licenseExpiryDate?: InputMaybe<Scalars['String']['input']>;
  licenseNumber?: InputMaybe<Scalars['String']['input']>;
  licenseState?: InputMaybe<Scalars['String']['input']>;
  licenseType?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationInput = {
  billingAddress?: InputMaybe<Scalars['String']['input']>;
  billingEmail?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProductInput = {
  cbdPercent?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dispensaryId: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isApproved?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['ID']['input'];
  strainName?: InputMaybe<Scalars['String']['input']>;
  strainType?: InputMaybe<Scalars['String']['input']>;
  thcPercent?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdatePromotionInput = {
  appliesTo?: InputMaybe<Scalars['String']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  discountValue?: InputMaybe<Scalars['Float']['input']>;
  endAt?: InputMaybe<Scalars['String']['input']>;
  maxUses?: InputMaybe<Scalars['Int']['input']>;
  maxUsesPerCustomer?: InputMaybe<Scalars['Int']['input']>;
  minimumOrderTotal?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  stackableWithOthers?: InputMaybe<Scalars['Boolean']['input']>;
  startAt?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSubscriptionInput = {
  subscriptionStatus?: InputMaybe<Scalars['String']['input']>;
  subscriptionTier?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateVariantPriceInput = {
  dispensaryId: Scalars['ID']['input'];
  price: Scalars['Float']['input'];
  variantId: Scalars['ID']['input'];
};

export type UpsertCredentialInput = {
  dispensaryId: Scalars['String']['input'];
  integratorApiKey?: InputMaybe<Scalars['String']['input']>;
  metrcUsername?: InputMaybe<Scalars['String']['input']>;
  state: Scalars['String']['input'];
  userApiKey: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  dispensaryId?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  organizationId?: Maybe<Scalars['String']['output']>;
  passwordChangedAt?: Maybe<Scalars['DateTime']['output']>;
  role: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type UserStats = {
  __typename?: 'UserStats';
  active7d: Scalars['Int']['output'];
  active24h: Scalars['Int']['output'];
  customers: Scalars['Int']['output'];
  staff: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Vendor = {
  __typename?: 'Vendor';
  city?: Maybe<Scalars['String']['output']>;
  contacts?: Maybe<Scalars['JSON']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  is_active: Scalars['Boolean']['output'];
  license_number?: Maybe<Scalars['String']['output']>;
  license_state?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  payment_terms?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  rating?: Maybe<Scalars['Float']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  total_pos?: Maybe<Scalars['Int']['output']>;
  total_spend?: Maybe<Scalars['Float']['output']>;
  vendor_id: Scalars['ID']['output'];
  vendor_type: Scalars['String']['output'];
};

export type VendorStats = {
  __typename?: 'VendorStats';
  activeVendors: Scalars['Int']['output'];
  openPOs: Scalars['Int']['output'];
  outstanding: Scalars['Float']['output'];
  totalPOs: Scalars['Int']['output'];
  totalSpend: Scalars['Float']['output'];
};

export type WasteDestructionLog = {
  __typename?: 'WasteDestructionLog';
  created_at: Scalars['DateTime']['output'];
  destroyedAt: Scalars['DateTime']['output'];
  destructionMethod?: Maybe<Scalars['String']['output']>;
  dispensaryId: Scalars['ID']['output'];
  logId: Scalars['ID']['output'];
  metrcPackageTag?: Maybe<Scalars['String']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  quantity: Scalars['Float']['output'];
  reason: Scalars['String']['output'];
  status: Scalars['String']['output'];
  submittedByUserId: Scalars['ID']['output'];
  unitOfMeasure: Scalars['String']['output'];
  variantId?: Maybe<Scalars['ID']['output']>;
  wasteType: Scalars['String']['output'];
  witness1Name: Scalars['String']['output'];
  witness1Title?: Maybe<Scalars['String']['output']>;
  witness2Name?: Maybe<Scalars['String']['output']>;
  witness2Title?: Maybe<Scalars['String']['output']>;
};

export type AttestKioskDeviceMutationVariables = Exact<{
  publicKey: Scalars['String']['input'];
}>;

export type AttestKioskDeviceMutation = { __typename?: 'Mutation'; attestKioskDevice: boolean };

export type AutocompleteProductsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type AutocompleteProductsQuery = {
  __typename?: 'Query';
  autocompleteProducts: Array<{
    __typename?: 'AutocompleteResult';
    id: string;
    name: string;
    productType?: string | null;
    strainType?: string | null;
  }>;
};

export type AvailablePaymentMethodsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type AvailablePaymentMethodsQuery = {
  __typename?: 'Query';
  availablePaymentMethods: Array<{
    __typename?: 'PaymentMethodInfo';
    method: string;
    enabled: boolean;
  }>;
};

export type AvailableRewardsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type AvailableRewardsQuery = {
  __typename?: 'Query';
  availableRewards: Array<{
    __typename?: 'LoyaltyReward';
    rewardId: string;
    name: string;
    description?: string | null;
    pointsCost: number;
    rewardType: string;
    rewardValue: number;
  }>;
};

export type AvailableTimeSlotsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  slotType: Scalars['String']['input'];
  date: Scalars['String']['input'];
}>;

export type AvailableTimeSlotsQuery = {
  __typename?: 'Query';
  availableTimeSlots: Array<{
    __typename?: 'AvailableSlotResult';
    slotId: string;
    startTime: string;
    endTime: string;
    spotsRemaining: number;
  }>;
};

export type CancelOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type CancelOrderMutation = { __typename?: 'Mutation'; cancelOrder: boolean };

export type CloseRegisterSessionMutationVariables = Exact<{
  input: CloseRegisterSessionGqlInput;
}>;

export type CloseRegisterSessionMutation = {
  __typename?: 'Mutation';
  closeRegisterSession: {
    __typename?: 'RegisterSession';
    id: string;
    openingCashCents: number;
    closingCashCents?: number | null;
    status: string;
    openedAt: string;
    closedAt?: string | null;
  };
};

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;

export type CreateOrderMutation = {
  __typename?: 'Mutation';
  createOrder: {
    __typename?: 'OrderSummary';
    orderId: string;
    dispensaryId: string;
    orderStatus: string;
    orderType: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    total: number;
    lineItemCount: number;
    createdAt: string;
  };
};

export type CreateWalkInCustomerMutationVariables = Exact<{
  input: CreateWalkInCustomerInput;
}>;

export type CreateWalkInCustomerMutation = {
  __typename?: 'Mutation';
  createWalkInCustomer: {
    __typename?: 'CustomerSearchResult';
    userId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    ageVerified: boolean;
    totalOrders: number;
  };
};

export type CustomerByPhoneQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  phone: Scalars['String']['input'];
}>;

export type CustomerByPhoneQuery = {
  __typename?: 'Query';
  customerByPhone?: {
    __typename?: 'KioskCustomerLookup';
    customerId: string;
    firstName?: string | null;
    lastName?: string | null;
    loyaltyPoints: number;
  } | null;
};

export type DashboardQueryVariables = Exact<{
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  days?: InputMaybe<Scalars['Int']['input']>;
}>;

export type DashboardQuery = {
  __typename?: 'Query';
  dashboard: {
    __typename?: 'DashboardData';
    sales: {
      __typename?: 'SalesOverview';
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      totalTax: number;
      completedOrders: number;
      pendingOrders: number;
      cancelledOrders: number;
    };
    salesTrend: Array<{
      __typename?: 'SalesTrend';
      period: string;
      revenue: number;
      orders: number;
      averageOrderValue: number;
    }>;
    topProducts: Array<{
      __typename?: 'TopProduct';
      productId: string;
      productName: string;
      strainType?: string | null;
      unitsSold: number;
      revenue: number;
    }>;
    categoryBreakdown: Array<{
      __typename?: 'CategoryBreakdown';
      category: string;
      productCount: number;
      unitsSold: number;
      revenue: number;
    }>;
    inventory: {
      __typename?: 'InventoryOverview';
      totalVariants: number;
      totalUnitsOnHand: number;
      totalUnitsAvailable: number;
      estimatedInventoryValue: number;
      lowStockCount: number;
      outOfStockCount: number;
    };
    lowStockItems: Array<{
      __typename?: 'LowStockItem';
      variantId: string;
      productName: string;
      variantName: string;
      quantityOnHand: number;
      quantityAvailable: number;
    }>;
    metrcSync: {
      __typename?: 'MetrcSyncOverview';
      totalSyncs: number;
      successCount: number;
      failedCount: number;
      pendingCount: number;
      successRate: number;
      ordersAwaitingSync: number;
      lastSyncAt?: string | null;
    };
    compliance: {
      __typename?: 'ComplianceSummary';
      totalProducts: number;
      compliantProducts: number;
      missingUid: number;
      missingCategory: number;
      missingPackageLabel: number;
      compliancePercent: number;
    };
  };
};

export type DeliveryZonesForFulfillmentQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type DeliveryZonesForFulfillmentQuery = {
  __typename?: 'Query';
  deliveryZones: Array<{
    __typename?: 'DeliveryZone';
    zoneId: string;
    name: string;
    radiusMiles: number;
    deliveryFee: number;
    minOrderAmount?: number | null;
    freeDeliveryThreshold?: number | null;
  }>;
};

export type CheckDeliveryEligibilityQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  orderSubtotal?: InputMaybe<Scalars['Float']['input']>;
}>;

export type CheckDeliveryEligibilityQuery = {
  __typename?: 'Query';
  checkDeliveryEligibility: {
    __typename?: 'DeliveryEligibilityResult';
    eligible: boolean;
    distance?: number | null;
    reason?: string | null;
    zone?: {
      __typename?: 'DeliveryZoneMatch';
      zoneId: string;
      name: string;
      deliveryFee: number;
      estimatedMinutesMin: number;
      estimatedMinutesMax: number;
    } | null;
  };
};

export type DeliveryZonesQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type DeliveryZonesQuery = {
  __typename?: 'Query';
  deliveryZones: Array<{
    __typename?: 'DeliveryZone';
    zoneId: string;
    name: string;
    radiusMiles: number;
    deliveryFee: number;
    minOrderAmount?: number | null;
    freeDeliveryThreshold?: number | null;
    estimatedMinutesMin?: number | null;
    estimatedMinutesMax?: number | null;
  }>;
};

export type DispensaryBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;

export type DispensaryBySlugQuery = {
  __typename?: 'Query';
  dispensaryBySlug?: {
    __typename?: 'DispensaryPublic';
    entityId: string;
    slug: string;
    name: string;
    city?: string | null;
    state?: string | null;
    isActive: boolean;
    isPickupEnabled: boolean;
    isDeliveryEnabled: boolean;
  } | null;
};

export type DispensaryQueryVariables = Exact<{
  entityId: Scalars['ID']['input'];
}>;

export type DispensaryQuery = {
  __typename?: 'Query';
  dispensary?: {
    __typename?: 'DispensaryResult';
    entityId: string;
    name: string;
    addressLine1?: string | null;
    city?: string | null;
    county?: string | null;
    municipality?: string | null;
    isActive: boolean;
    isPickupEnabled: boolean;
    isDeliveryEnabled: boolean;
    isCashEnabled?: boolean | null;
    cashDiscountPercent?: number | null;
    licenseNumber?: string | null;
    licenseType?: string | null;
    metrcLicenseNumber?: string | null;
    email?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

export type InitiateCashlessPaymentMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId: Scalars['ID']['input'];
  amount: Scalars['Float']['input'];
  provider: Scalars['String']['input'];
}>;

export type InitiateCashlessPaymentMutation = {
  __typename?: 'Mutation';
  initiateCashlessPayment: {
    __typename?: 'CashlessPaymentResult';
    referenceId: string;
    redirectUrl?: string | null;
    paymentUrl?: string | null;
  };
};

export type InventoryAdjustmentsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type InventoryAdjustmentsQuery = {
  __typename?: 'Query';
  inventoryAdjustments: Array<{
    __typename?: 'InventoryAdjustment';
    adjustmentId: string;
    productName: string;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    status: string;
    notes?: string | null;
    created_at: string;
    approvedAt?: string | null;
    approvedByUserId?: string | null;
    reasonId: number;
  }>;
};

export type ApproveAdjustmentMutationVariables = Exact<{
  adjustmentId: Scalars['ID']['input'];
}>;

export type ApproveAdjustmentMutation = {
  __typename?: 'Mutation';
  approveAdjustment: {
    __typename?: 'InventoryAdjustment';
    adjustmentId: string;
    status: string;
    approvedAt?: string | null;
  };
};

export type InventoryTransfersQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  direction?: InputMaybe<Scalars['String']['input']>;
}>;

export type InventoryTransfersQuery = {
  __typename?: 'Query';
  inventoryTransfers: Array<{
    __typename?: 'InventoryTransfer';
    transferId: string;
    fromDispensaryId: string;
    toDispensaryId: string;
    status: string;
    notes?: string | null;
    metrcManifestId?: string | null;
    requestedByUserId: string;
    approvedByUserId?: string | null;
    approvedAt?: string | null;
    shippedAt?: string | null;
    receivedAt?: string | null;
    rejectionReason?: string | null;
    created_at: string;
  }>;
};

export type TransferItemsQueryVariables = Exact<{
  transferId: Scalars['ID']['input'];
}>;

export type TransferItemsQuery = {
  __typename?: 'Query';
  transferItems: Array<{
    __typename?: 'InventoryTransferItem';
    itemId: string;
    variantId: string;
    productName: string;
    variantName?: string | null;
    quantityRequested: number;
    quantityShipped?: number | null;
    quantityReceived?: number | null;
  }>;
};

export type ApproveTransferMutationVariables = Exact<{
  transferId: Scalars['ID']['input'];
}>;

export type ApproveTransferMutation = {
  __typename?: 'Mutation';
  approveTransfer: {
    __typename?: 'InventoryTransfer';
    transferId: string;
    status: string;
    approvedAt?: string | null;
  };
};

export type ShipTransferMutationVariables = Exact<{
  transferId: Scalars['ID']['input'];
}>;

export type ShipTransferMutation = {
  __typename?: 'Mutation';
  shipTransfer: {
    __typename?: 'InventoryTransfer';
    transferId: string;
    status: string;
    shippedAt?: string | null;
  };
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: { __typename?: 'AuthToken'; accessToken: string; expiresIn: number };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me: {
    __typename?: 'User';
    id: string;
    email: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    isActive: boolean;
    emailVerified: boolean;
    dispensaryId?: string | null;
    organizationId?: string | null;
  };
};

export type MyCurrentRegisterSessionQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type MyCurrentRegisterSessionQuery = {
  __typename?: 'Query';
  myCurrentRegisterSession?: {
    __typename?: 'RegisterSession';
    id: string;
    dispensaryId: string;
    openedByUserId: string;
    openingCashCents: number;
    closingCashCents?: number | null;
    status: string;
    openedAt: string;
    closedAt?: string | null;
  } | null;
};

export type MyFavoritesQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type MyFavoritesQuery = {
  __typename?: 'Query';
  myFavorites: Array<{
    __typename?: 'CustomerFavorite';
    productId: string;
    variantId?: string | null;
    productName?: string | null;
    variantName?: string | null;
    price: number;
    orderCount: number;
  }>;
};

export type MyLastOrderQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type MyLastOrderQuery = {
  __typename?: 'Query';
  myLastOrder?: {
    __typename?: 'CustomerOrder';
    orderId: string;
    orderType: string;
    orderStatus: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    paymentMethod?: string | null;
    createdAt: string;
    lineItems: Array<{
      __typename?: 'CustomerOrderLineItem';
      productId: string;
      variantId?: string | null;
      productName?: string | null;
      variantName?: string | null;
      quantity: number;
      price: number;
    }>;
  } | null;
};

export type MyLoyaltyQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
}>;

export type MyLoyaltyQuery = {
  __typename?: 'Query';
  myLoyalty?: {
    __typename?: 'MyLoyalty';
    points: number;
    lifetimePoints: number;
    tier: string;
    tierName: string;
    tierColor?: string | null;
    multiplier: number;
    pointValue: number;
    nextTier?: { __typename?: 'NextTierInfo'; name: string; pointsNeeded: number } | null;
    allTiers: Array<{
      __typename?: 'LoyaltyTierInfo';
      code: string;
      name: string;
      minPoints: number;
      color?: string | null;
    }>;
  } | null;
};

export type MyOrdersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type MyOrdersQuery = {
  __typename?: 'Query';
  myOrders: {
    __typename?: 'OrderHistoryResult';
    total: number;
    orders: Array<{
      __typename?: 'CustomerOrderSummary';
      orderId: string;
      orderStatus: string;
      orderType: string;
      subtotal: number;
      total: number;
      itemCount?: number | null;
      dispensaryName?: string | null;
      createdAt: string;
    }>;
  };
};

export type MyTimeEntriesQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
}>;

export type MyTimeEntriesQuery = {
  __typename?: 'Query';
  myTimeEntries: Array<{
    __typename?: 'TimeEntry';
    entryId: string;
    clockIn: string;
    clockOut?: string | null;
    breakMinutes: number;
    totalHours?: number | null;
    overtimeHours?: number | null;
    status: string;
    notes?: string | null;
    approvedAt?: string | null;
  }>;
};

export type OpenRegisterSessionMutationVariables = Exact<{
  input: OpenRegisterSessionGqlInput;
}>;

export type OpenRegisterSessionMutation = {
  __typename?: 'Mutation';
  openRegisterSession: {
    __typename?: 'RegisterSession';
    id: string;
    dispensaryId: string;
    openedByUserId: string;
    openingCashCents: number;
    status: string;
    openedAt: string;
  };
};

export type ConfirmOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type ConfirmOrderMutation = { __typename?: 'Mutation'; confirmOrder: boolean };

export type StartPreparingOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type StartPreparingOrderMutation = { __typename?: 'Mutation'; startPreparingOrder: boolean };

export type MarkOrderReadyMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type MarkOrderReadyMutation = { __typename?: 'Mutation'; markOrderReady: boolean };

export type CompleteOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId: Scalars['ID']['input'];
}>;

export type CompleteOrderMutation = { __typename?: 'Mutation'; completeOrder: boolean };

export type OrderQueryVariables = Exact<{
  orderId: Scalars['ID']['input'];
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
}>;

export type OrderQuery = {
  __typename?: 'Query';
  order?: {
    __typename?: 'Order';
    orderId: string;
    dispensaryId: string;
    customerUserId?: string | null;
    orderType: string;
    orderStatus: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    total: number;
    paymentMethod?: string | null;
    metrcReceiptId?: string | null;
    metrcSyncStatus?: string | null;
    notes?: string | null;
    cancellationReason?: string | null;
    cancelledAt?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OrdersQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type OrdersQuery = {
  __typename?: 'Query';
  orders: Array<{
    __typename?: 'Order';
    orderId: string;
    dispensaryId: string;
    customerUserId?: string | null;
    orderType: string;
    orderStatus: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type ProductQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
}>;

export type ProductQuery = {
  __typename?: 'Query';
  product?: {
    __typename?: 'Product';
    id: string;
    name: string;
    sku?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    strainName?: string | null;
    strainType?: string | null;
    thcPercent?: number | null;
    cbdPercent?: number | null;
    effects?: Record<string, unknown> | null;
    flavors?: Record<string, unknown> | null;
    primaryCategoryId?: number | null;
    productTypeId?: number | null;
    brandId?: string | null;
    isActive: boolean;
    isApproved: boolean;
    variants: Array<{
      __typename?: 'ProductVariant';
      variantId: string;
      name: string;
      sku?: string | null;
      quantityPerUnit?: number | null;
      retailPrice?: number | null;
      stockQuantity?: number | null;
      stockStatus?: string | null;
      sortOrder?: number | null;
      isActive: boolean;
    }>;
  } | null;
};

export type ProductsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  productTypeId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;

export type ProductsQuery = {
  __typename?: 'Query';
  products: Array<{
    __typename?: 'Product';
    id: string;
    name: string;
    sku?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    strainName?: string | null;
    strainType?: string | null;
    thcPercent?: number | null;
    cbdPercent?: number | null;
    effects?: Record<string, unknown> | null;
    flavors?: Record<string, unknown> | null;
    primaryCategoryId?: number | null;
    productTypeId?: number | null;
    brandId?: string | null;
    isActive: boolean;
    isApproved: boolean;
    variants: Array<{
      __typename?: 'ProductVariant';
      variantId: string;
      name: string;
      sku?: string | null;
      retailPrice?: number | null;
      stockQuantity?: number | null;
      stockStatus?: string | null;
      sortOrder?: number | null;
      isActive: boolean;
    }>;
  }>;
};

export type ReceiveTransferMutationVariables = Exact<{
  transferId: Scalars['ID']['input'];
  items: Array<ReceiveItemInput> | ReceiveItemInput;
}>;

export type ReceiveTransferMutation = {
  __typename?: 'Mutation';
  receiveTransfer: {
    __typename?: 'InventoryTransfer';
    transferId: string;
    status: string;
    receivedAt?: string | null;
  };
};

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;

export type RegisterMutation = {
  __typename?: 'Mutation';
  register: { __typename?: 'AuthToken'; accessToken: string; expiresIn: number };
};

export type SearchCustomersQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchCustomersQuery = {
  __typename?: 'Query';
  searchCustomers: Array<{
    __typename?: 'CustomerSearchResult';
    userId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    ageVerified: boolean;
    totalOrders: number;
  }>;
};

export type SearchProductsLookupQueryVariables = Exact<{
  dispensaryId: Scalars['String']['input'];
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchProductsLookupQuery = {
  __typename?: 'Query';
  searchProducts: Array<{
    __typename?: 'SearchResultType';
    productId: string;
    name: string;
    strainType?: string | null;
    thcPercent?: number | null;
    cbdPercent?: number | null;
    effects?: Array<string> | null;
    flavors?: Array<string> | null;
  }>;
};

export type StaffInventoryProductsQueryVariables = Exact<{
  dispensaryId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;

export type StaffInventoryProductsQuery = {
  __typename?: 'Query';
  products: Array<{
    __typename?: 'Product';
    id: string;
    name: string;
    sku?: string | null;
    strainName?: string | null;
    strainType?: string | null;
    thcPercent?: number | null;
    cbdPercent?: number | null;
    isActive: boolean;
    variants: Array<{
      __typename?: 'ProductVariant';
      variantId: string;
      name: string;
      sku?: string | null;
      barcode?: string | null;
      retailPrice?: number | null;
      stockQuantity?: number | null;
      stockStatus?: string | null;
      isActive: boolean;
    }>;
  }>;
};

export type ThemeConfigQueryVariables = Exact<{
  dispensaryId: Scalars['String']['input'];
}>;

export type ThemeConfigQuery = {
  __typename?: 'Query';
  themeConfig: { __typename?: 'ThemeConfigType'; preset: string; isDark: boolean };
};

export type VerifyAgeMutationVariables = Exact<{
  dateOfBirth: Scalars['String']['input'];
  idType: Scalars['String']['input'];
  idState?: InputMaybe<Scalars['String']['input']>;
  dispensaryId?: InputMaybe<Scalars['ID']['input']>;
  method?: InputMaybe<Scalars['String']['input']>;
}>;

export type VerifyAgeMutation = {
  __typename?: 'Mutation';
  verifyAge: {
    __typename?: 'AgeVerifyResult';
    verified: boolean;
    age: number;
    reason?: string | null;
  };
};

export const AttestKioskDeviceDocument = gql`
  mutation AttestKioskDevice($publicKey: String!) {
    attestKioskDevice(publicKey: $publicKey)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AttestKioskDeviceGQL extends Apollo.Mutation<
  AttestKioskDeviceMutation,
  AttestKioskDeviceMutationVariables
> {
  override document = AttestKioskDeviceDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const AutocompleteProductsDocument = gql`
  query AutocompleteProducts($dispensaryId: ID!, $query: String!, $limit: Int) {
    autocompleteProducts(dispensaryId: $dispensaryId, query: $query, limit: $limit) {
      id
      name
      productType
      strainType
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AutocompleteProductsGQL extends Apollo.Query<
  AutocompleteProductsQuery,
  AutocompleteProductsQueryVariables
> {
  override document = AutocompleteProductsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const AvailablePaymentMethodsDocument = gql`
  query AvailablePaymentMethods($dispensaryId: ID!) {
    availablePaymentMethods(dispensaryId: $dispensaryId) {
      method
      enabled
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AvailablePaymentMethodsGQL extends Apollo.Query<
  AvailablePaymentMethodsQuery,
  AvailablePaymentMethodsQueryVariables
> {
  override document = AvailablePaymentMethodsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const AvailableRewardsDocument = gql`
  query AvailableRewards($dispensaryId: ID!) {
    availableRewards(dispensaryId: $dispensaryId) {
      rewardId
      name
      description
      pointsCost
      rewardType
      rewardValue
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AvailableRewardsGQL extends Apollo.Query<
  AvailableRewardsQuery,
  AvailableRewardsQueryVariables
> {
  override document = AvailableRewardsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const AvailableTimeSlotsDocument = gql`
  query AvailableTimeSlots($dispensaryId: ID!, $slotType: String!, $date: String!) {
    availableTimeSlots(dispensaryId: $dispensaryId, slotType: $slotType, date: $date) {
      slotId
      startTime
      endTime
      spotsRemaining
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class AvailableTimeSlotsGQL extends Apollo.Query<
  AvailableTimeSlotsQuery,
  AvailableTimeSlotsQueryVariables
> {
  override document = AvailableTimeSlotsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CancelOrderDocument = gql`
  mutation CancelOrder($orderId: ID!, $reason: String!, $dispensaryId: ID) {
    cancelOrder(orderId: $orderId, reason: $reason, dispensaryId: $dispensaryId)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CancelOrderGQL extends Apollo.Mutation<
  CancelOrderMutation,
  CancelOrderMutationVariables
> {
  override document = CancelOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CloseRegisterSessionDocument = gql`
  mutation CloseRegisterSession($input: CloseRegisterSessionGqlInput!) {
    closeRegisterSession(input: $input) {
      id
      openingCashCents
      closingCashCents
      status
      openedAt
      closedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CloseRegisterSessionGQL extends Apollo.Mutation<
  CloseRegisterSessionMutation,
  CloseRegisterSessionMutationVariables
> {
  override document = CloseRegisterSessionDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CreateOrderDocument = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      orderId
      dispensaryId
      orderStatus
      orderType
      subtotal
      taxTotal
      discountTotal
      total
      lineItemCount
      createdAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CreateOrderGQL extends Apollo.Mutation<
  CreateOrderMutation,
  CreateOrderMutationVariables
> {
  override document = CreateOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CreateWalkInCustomerDocument = gql`
  mutation CreateWalkInCustomer($input: CreateWalkInCustomerInput!) {
    createWalkInCustomer(input: $input) {
      userId
      email
      firstName
      lastName
      phone
      ageVerified
      totalOrders
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CreateWalkInCustomerGQL extends Apollo.Mutation<
  CreateWalkInCustomerMutation,
  CreateWalkInCustomerMutationVariables
> {
  override document = CreateWalkInCustomerDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CustomerByPhoneDocument = gql`
  query CustomerByPhone($dispensaryId: ID!, $phone: String!) {
    customerByPhone(dispensaryId: $dispensaryId, phone: $phone) {
      customerId
      firstName
      lastName
      loyaltyPoints
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CustomerByPhoneGQL extends Apollo.Query<
  CustomerByPhoneQuery,
  CustomerByPhoneQueryVariables
> {
  override document = CustomerByPhoneDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const DashboardDocument = gql`
  query Dashboard($dispensaryId: ID, $days: Int) {
    dashboard(dispensaryId: $dispensaryId, days: $days) {
      sales {
        totalRevenue
        totalOrders
        averageOrderValue
        totalTax
        completedOrders
        pendingOrders
        cancelledOrders
      }
      salesTrend {
        period
        revenue
        orders
        averageOrderValue
      }
      topProducts {
        productId
        productName
        strainType
        unitsSold
        revenue
      }
      categoryBreakdown {
        category
        productCount
        unitsSold
        revenue
      }
      inventory {
        totalVariants
        totalUnitsOnHand
        totalUnitsAvailable
        estimatedInventoryValue
        lowStockCount
        outOfStockCount
      }
      lowStockItems {
        variantId
        productName
        variantName
        quantityOnHand
        quantityAvailable
      }
      metrcSync {
        totalSyncs
        successCount
        failedCount
        pendingCount
        successRate
        ordersAwaitingSync
        lastSyncAt
      }
      compliance {
        totalProducts
        compliantProducts
        missingUid
        missingCategory
        missingPackageLabel
        compliancePercent
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DashboardGQL extends Apollo.Query<DashboardQuery, DashboardQueryVariables> {
  override document = DashboardDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const DeliveryZonesForFulfillmentDocument = gql`
  query DeliveryZonesForFulfillment($dispensaryId: ID!) {
    deliveryZones(dispensaryId: $dispensaryId) {
      zoneId
      name
      radiusMiles
      deliveryFee
      minOrderAmount
      freeDeliveryThreshold
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DeliveryZonesForFulfillmentGQL extends Apollo.Query<
  DeliveryZonesForFulfillmentQuery,
  DeliveryZonesForFulfillmentQueryVariables
> {
  override document = DeliveryZonesForFulfillmentDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CheckDeliveryEligibilityDocument = gql`
  query CheckDeliveryEligibility(
    $dispensaryId: ID!
    $latitude: Float!
    $longitude: Float!
    $orderSubtotal: Float
  ) {
    checkDeliveryEligibility(
      dispensaryId: $dispensaryId
      latitude: $latitude
      longitude: $longitude
      orderSubtotal: $orderSubtotal
    ) {
      eligible
      distance
      reason
      zone {
        zoneId
        name
        deliveryFee
        estimatedMinutesMin
        estimatedMinutesMax
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CheckDeliveryEligibilityGQL extends Apollo.Query<
  CheckDeliveryEligibilityQuery,
  CheckDeliveryEligibilityQueryVariables
> {
  override document = CheckDeliveryEligibilityDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const DeliveryZonesDocument = gql`
  query DeliveryZones($dispensaryId: ID!) {
    deliveryZones(dispensaryId: $dispensaryId) {
      zoneId
      name
      radiusMiles
      deliveryFee
      minOrderAmount
      freeDeliveryThreshold
      estimatedMinutesMin
      estimatedMinutesMax
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DeliveryZonesGQL extends Apollo.Query<
  DeliveryZonesQuery,
  DeliveryZonesQueryVariables
> {
  override document = DeliveryZonesDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const DispensaryBySlugDocument = gql`
  query DispensaryBySlug($slug: String!) {
    dispensaryBySlug(slug: $slug) {
      entityId
      slug
      name
      city
      state
      isActive
      isPickupEnabled
      isDeliveryEnabled
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DispensaryBySlugGQL extends Apollo.Query<
  DispensaryBySlugQuery,
  DispensaryBySlugQueryVariables
> {
  override document = DispensaryBySlugDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const DispensaryDocument = gql`
  query Dispensary($entityId: ID!) {
    dispensary(entityId: $entityId) {
      entityId
      name
      addressLine1
      city
      county
      municipality
      isActive
      isPickupEnabled
      isDeliveryEnabled
      isCashEnabled
      cashDiscountPercent
      licenseNumber
      licenseType
      metrcLicenseNumber
      email
      latitude
      longitude
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class DispensaryGQL extends Apollo.Query<DispensaryQuery, DispensaryQueryVariables> {
  override document = DispensaryDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const InitiateCashlessPaymentDocument = gql`
  mutation InitiateCashlessPayment(
    $orderId: ID!
    $dispensaryId: ID!
    $amount: Float!
    $provider: String!
  ) {
    initiateCashlessPayment(
      orderId: $orderId
      dispensaryId: $dispensaryId
      amount: $amount
      provider: $provider
    ) {
      referenceId
      redirectUrl
      paymentUrl
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class InitiateCashlessPaymentGQL extends Apollo.Mutation<
  InitiateCashlessPaymentMutation,
  InitiateCashlessPaymentMutationVariables
> {
  override document = InitiateCashlessPaymentDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const InventoryAdjustmentsDocument = gql`
  query InventoryAdjustments($dispensaryId: ID!, $limit: Int = 50) {
    inventoryAdjustments(dispensaryId: $dispensaryId, limit: $limit) {
      adjustmentId
      productName
      quantityChange
      quantityBefore
      quantityAfter
      status
      notes
      created_at
      approvedAt
      approvedByUserId
      reasonId
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class InventoryAdjustmentsGQL extends Apollo.Query<
  InventoryAdjustmentsQuery,
  InventoryAdjustmentsQueryVariables
> {
  override document = InventoryAdjustmentsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ApproveAdjustmentDocument = gql`
  mutation ApproveAdjustment($adjustmentId: ID!) {
    approveAdjustment(adjustmentId: $adjustmentId) {
      adjustmentId
      status
      approvedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ApproveAdjustmentGQL extends Apollo.Mutation<
  ApproveAdjustmentMutation,
  ApproveAdjustmentMutationVariables
> {
  override document = ApproveAdjustmentDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const InventoryTransfersDocument = gql`
  query InventoryTransfers($dispensaryId: ID!, $direction: String) {
    inventoryTransfers(dispensaryId: $dispensaryId, direction: $direction) {
      transferId
      fromDispensaryId
      toDispensaryId
      status
      notes
      metrcManifestId
      requestedByUserId
      approvedByUserId
      approvedAt
      shippedAt
      receivedAt
      rejectionReason
      created_at
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class InventoryTransfersGQL extends Apollo.Query<
  InventoryTransfersQuery,
  InventoryTransfersQueryVariables
> {
  override document = InventoryTransfersDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const TransferItemsDocument = gql`
  query TransferItems($transferId: ID!) {
    transferItems(transferId: $transferId) {
      itemId
      variantId
      productName
      variantName
      quantityRequested
      quantityShipped
      quantityReceived
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class TransferItemsGQL extends Apollo.Query<
  TransferItemsQuery,
  TransferItemsQueryVariables
> {
  override document = TransferItemsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ApproveTransferDocument = gql`
  mutation ApproveTransfer($transferId: ID!) {
    approveTransfer(transferId: $transferId) {
      transferId
      status
      approvedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ApproveTransferGQL extends Apollo.Mutation<
  ApproveTransferMutation,
  ApproveTransferMutationVariables
> {
  override document = ApproveTransferDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ShipTransferDocument = gql`
  mutation ShipTransfer($transferId: ID!) {
    shipTransfer(transferId: $transferId) {
      transferId
      status
      shippedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ShipTransferGQL extends Apollo.Mutation<
  ShipTransferMutation,
  ShipTransferMutationVariables
> {
  override document = ShipTransferDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const LoginDocument = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      expiresIn
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class LoginGQL extends Apollo.Mutation<LoginMutation, LoginMutationVariables> {
  override document = LoginDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MeDocument = gql`
  query Me {
    me {
      id
      email
      role
      firstName
      lastName
      isActive
      emailVerified
      dispensaryId
      organizationId
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MeGQL extends Apollo.Query<MeQuery, MeQueryVariables> {
  override document = MeDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyCurrentRegisterSessionDocument = gql`
  query MyCurrentRegisterSession($dispensaryId: ID!) {
    myCurrentRegisterSession(dispensaryId: $dispensaryId) {
      id
      dispensaryId
      openedByUserId
      openingCashCents
      closingCashCents
      status
      openedAt
      closedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyCurrentRegisterSessionGQL extends Apollo.Query<
  MyCurrentRegisterSessionQuery,
  MyCurrentRegisterSessionQueryVariables
> {
  override document = MyCurrentRegisterSessionDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyFavoritesDocument = gql`
  query MyFavorites($dispensaryId: ID!, $limit: Int) {
    myFavorites(dispensaryId: $dispensaryId, limit: $limit) {
      productId
      variantId
      productName
      variantName
      price
      orderCount
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyFavoritesGQL extends Apollo.Query<MyFavoritesQuery, MyFavoritesQueryVariables> {
  override document = MyFavoritesDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyLastOrderDocument = gql`
  query MyLastOrder($dispensaryId: ID!) {
    myLastOrder(dispensaryId: $dispensaryId) {
      orderId
      orderType
      orderStatus
      subtotal
      taxTotal
      total
      paymentMethod
      createdAt
      lineItems {
        productId
        variantId
        productName
        variantName
        quantity
        price
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyLastOrderGQL extends Apollo.Query<MyLastOrderQuery, MyLastOrderQueryVariables> {
  override document = MyLastOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyLoyaltyDocument = gql`
  query MyLoyalty($dispensaryId: ID!) {
    myLoyalty(dispensaryId: $dispensaryId) {
      points
      lifetimePoints
      tier
      tierName
      tierColor
      multiplier
      pointValue
      nextTier {
        name
        pointsNeeded
      }
      allTiers {
        code
        name
        minPoints
        color
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyLoyaltyGQL extends Apollo.Query<MyLoyaltyQuery, MyLoyaltyQueryVariables> {
  override document = MyLoyaltyDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyOrdersDocument = gql`
  query MyOrders($limit: Int, $offset: Int) {
    myOrders(limit: $limit, offset: $offset) {
      total
      orders {
        orderId
        orderStatus
        orderType
        subtotal
        total
        itemCount
        dispensaryName
        createdAt
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyOrdersGQL extends Apollo.Query<MyOrdersQuery, MyOrdersQueryVariables> {
  override document = MyOrdersDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MyTimeEntriesDocument = gql`
  query MyTimeEntries($dispensaryId: ID!, $startDate: String!, $endDate: String!) {
    myTimeEntries(dispensaryId: $dispensaryId, startDate: $startDate, endDate: $endDate) {
      entryId
      clockIn
      clockOut
      breakMinutes
      totalHours
      overtimeHours
      status
      notes
      approvedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MyTimeEntriesGQL extends Apollo.Query<
  MyTimeEntriesQuery,
  MyTimeEntriesQueryVariables
> {
  override document = MyTimeEntriesDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const OpenRegisterSessionDocument = gql`
  mutation OpenRegisterSession($input: OpenRegisterSessionGqlInput!) {
    openRegisterSession(input: $input) {
      id
      dispensaryId
      openedByUserId
      openingCashCents
      status
      openedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class OpenRegisterSessionGQL extends Apollo.Mutation<
  OpenRegisterSessionMutation,
  OpenRegisterSessionMutationVariables
> {
  override document = OpenRegisterSessionDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ConfirmOrderDocument = gql`
  mutation ConfirmOrder($orderId: ID!, $dispensaryId: ID) {
    confirmOrder(orderId: $orderId, dispensaryId: $dispensaryId)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ConfirmOrderGQL extends Apollo.Mutation<
  ConfirmOrderMutation,
  ConfirmOrderMutationVariables
> {
  override document = ConfirmOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const StartPreparingOrderDocument = gql`
  mutation StartPreparingOrder($orderId: ID!, $dispensaryId: ID) {
    startPreparingOrder(orderId: $orderId, dispensaryId: $dispensaryId)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class StartPreparingOrderGQL extends Apollo.Mutation<
  StartPreparingOrderMutation,
  StartPreparingOrderMutationVariables
> {
  override document = StartPreparingOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const MarkOrderReadyDocument = gql`
  mutation MarkOrderReady($orderId: ID!, $dispensaryId: ID) {
    markOrderReady(orderId: $orderId, dispensaryId: $dispensaryId)
  }
`;

@Injectable({
  providedIn: 'root',
})
export class MarkOrderReadyGQL extends Apollo.Mutation<
  MarkOrderReadyMutation,
  MarkOrderReadyMutationVariables
> {
  override document = MarkOrderReadyDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const CompleteOrderDocument = gql`
  mutation CompleteOrder($orderId: ID!, $dispensaryId: ID!) {
    completeOrder(input: { orderId: $orderId, dispensaryId: $dispensaryId })
  }
`;

@Injectable({
  providedIn: 'root',
})
export class CompleteOrderGQL extends Apollo.Mutation<
  CompleteOrderMutation,
  CompleteOrderMutationVariables
> {
  override document = CompleteOrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const OrderDocument = gql`
  query Order($orderId: ID!, $dispensaryId: ID) {
    order(orderId: $orderId, dispensaryId: $dispensaryId) {
      orderId
      dispensaryId
      customerUserId
      orderType
      orderStatus
      subtotal
      discountTotal
      taxTotal
      total
      paymentMethod
      metrcReceiptId
      metrcSyncStatus
      notes
      cancellationReason
      cancelledAt
      createdAt
      updatedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class OrderGQL extends Apollo.Query<OrderQuery, OrderQueryVariables> {
  override document = OrderDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const OrdersDocument = gql`
  query Orders($dispensaryId: ID!, $limit: Int, $offset: Int) {
    orders(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
      orderId
      dispensaryId
      customerUserId
      orderType
      orderStatus
      subtotal
      taxTotal
      total
      createdAt
      updatedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class OrdersGQL extends Apollo.Query<OrdersQuery, OrdersQueryVariables> {
  override document = OrdersDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ProductDocument = gql`
  query Product($dispensaryId: ID!, $id: ID!) {
    product(dispensaryId: $dispensaryId, id: $id) {
      id
      name
      sku
      description
      shortDescription
      strainName
      strainType
      thcPercent
      cbdPercent
      effects
      flavors
      primaryCategoryId
      productTypeId
      brandId
      isActive
      isApproved
      variants {
        variantId
        name
        sku
        quantityPerUnit
        retailPrice
        stockQuantity
        stockStatus
        sortOrder
        isActive
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ProductGQL extends Apollo.Query<ProductQuery, ProductQueryVariables> {
  override document = ProductDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ProductsDocument = gql`
  query Products(
    $dispensaryId: ID!
    $categoryId: Int
    $productTypeId: Int
    $search: String
    $limit: Int = 50
    $offset: Int
  ) {
    products(
      dispensaryId: $dispensaryId
      categoryId: $categoryId
      productTypeId: $productTypeId
      search: $search
      limit: $limit
      offset: $offset
    ) {
      id
      name
      sku
      description
      shortDescription
      strainName
      strainType
      thcPercent
      cbdPercent
      effects
      flavors
      primaryCategoryId
      productTypeId
      brandId
      isActive
      isApproved
      variants {
        variantId
        name
        sku
        retailPrice
        stockQuantity
        stockStatus
        sortOrder
        isActive
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ProductsGQL extends Apollo.Query<ProductsQuery, ProductsQueryVariables> {
  override document = ProductsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ReceiveTransferDocument = gql`
  mutation ReceiveTransfer($transferId: ID!, $items: [ReceiveItemInput!]!) {
    receiveTransfer(transferId: $transferId, items: $items) {
      transferId
      status
      receivedAt
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ReceiveTransferGQL extends Apollo.Mutation<
  ReceiveTransferMutation,
  ReceiveTransferMutationVariables
> {
  override document = ReceiveTransferDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const RegisterDocument = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      expiresIn
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class RegisterGQL extends Apollo.Mutation<RegisterMutation, RegisterMutationVariables> {
  override document = RegisterDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const SearchCustomersDocument = gql`
  query SearchCustomers($dispensaryId: ID!, $query: String!, $limit: Int) {
    searchCustomers(dispensaryId: $dispensaryId, query: $query, limit: $limit) {
      userId
      email
      firstName
      lastName
      phone
      ageVerified
      totalOrders
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class SearchCustomersGQL extends Apollo.Query<
  SearchCustomersQuery,
  SearchCustomersQueryVariables
> {
  override document = SearchCustomersDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const SearchProductsLookupDocument = gql`
  query SearchProductsLookup($dispensaryId: String!, $query: String!, $limit: Int = 20) {
    searchProducts(dispensaryId: $dispensaryId, query: $query, limit: $limit) {
      productId
      name
      strainType
      thcPercent
      cbdPercent
      effects
      flavors
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class SearchProductsLookupGQL extends Apollo.Query<
  SearchProductsLookupQuery,
  SearchProductsLookupQueryVariables
> {
  override document = SearchProductsLookupDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const StaffInventoryProductsDocument = gql`
  query StaffInventoryProducts(
    $dispensaryId: ID!
    $limit: Int = 200
    $offset: Int
    $search: String
  ) {
    products(dispensaryId: $dispensaryId, limit: $limit, offset: $offset, search: $search) {
      id
      name
      sku
      strainName
      strainType
      thcPercent
      cbdPercent
      isActive
      variants {
        variantId
        name
        sku
        barcode
        retailPrice
        stockQuantity
        stockStatus
        isActive
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class StaffInventoryProductsGQL extends Apollo.Query<
  StaffInventoryProductsQuery,
  StaffInventoryProductsQueryVariables
> {
  override document = StaffInventoryProductsDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const ThemeConfigDocument = gql`
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset
      isDark
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class ThemeConfigGQL extends Apollo.Query<ThemeConfigQuery, ThemeConfigQueryVariables> {
  override document = ThemeConfigDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
export const VerifyAgeDocument = gql`
  mutation VerifyAge(
    $dateOfBirth: String!
    $idType: String!
    $idState: String
    $dispensaryId: ID
    $method: String
  ) {
    verifyAge(
      dateOfBirth: $dateOfBirth
      idType: $idType
      idState: $idState
      dispensaryId: $dispensaryId
      method: $method
    ) {
      verified
      age
      reason
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class VerifyAgeGQL extends Apollo.Mutation<VerifyAgeMutation, VerifyAgeMutationVariables> {
  override document = VerifyAgeDocument;

  constructor(apollo: Apollo.Apollo) {
    super(apollo);
  }
}
