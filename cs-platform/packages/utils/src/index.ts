// ─────────────────────────────────────────────────────────────────────────────
// @cannasaas/utils — Shared utility functions
// ─────────────────────────────────────────────────────────────────────────────

// Tailwind class merging
export { cn } from "./cn";

// Formatting helpers
export {
  formatCurrency,
  formatCents,
  formatDate,
  formatDateTime,
  formatWeight,
  formatPercentage,
  formatCannabinoid,
  truncate,
  slugify,
  pluralize,
} from "./formatting";

// Zod validation schemas
export {
  // Auth
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  // Products
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  productCategories,
  strainTypes,
  // Cart
  addToCartSchema,
  updateCartItemSchema,
  applyPromoSchema,
  // Orders
  createOrderSchema,
  updateOrderStatusSchema,
  orderFilterSchema,
  orderStatuses,
  // Reviews
  createReviewSchema,
  // Org / Dispensary
  createOrganizationSchema,
  createDispensarySchema,
  // Analytics
  analyticsDateRangeSchema,
} from "./validation";

// Re-export types from validation
export type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
  ProductCategory,
  StrainType,
  AddToCartInput,
  UpdateCartItemInput,
  ApplyPromoInput,
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderFilterInput,
  OrderStatus,
  CreateReviewInput,
  CreateOrganizationInput,
  CreateDispensaryInput,
  AnalyticsDateRangeInput,
} from "./validation";

// Date utilities
export {
  toDate,
  toDateStrict,
  formatDateFns,
  formatDateTimeFns,
  timeAgo,
  toISODate,
  getDateRangePresets,
  // Re-exported date-fns functions
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "./date";

export type { DateRange } from "./date";

// Currency & tax helpers
export {
  calculateTax,
  applyTax,
  discountPercent,
  lineTotal,
  sumAmounts,
  STATE_TAX_RATES,
  SUPPORTED_STATES,
} from "./currency";

export type { TaxRate, TaxBreakdown } from "./currency";
