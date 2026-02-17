#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# scaffold-utils-package.sh
# Creates packages/utils — shared utility functions
#
# Usage:
#   cd ~/Documents/Projects/cannasaas/cannasaas-platform
#   bash scaffold-utils-package.sh
#
# ⚠️  SAFE: Only writes files that DON'T already exist (skips existing files).
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(pwd)"
PKG="$ROOT/packages/utils"

write_if_new() {
  local filepath="$1"
  local content="$2"
  mkdir -p "$(dirname "$filepath")"
  if [[ -f "$filepath" ]]; then
    echo "  ⏭️  SKIP (exists): $filepath"
  else
    printf '%s' "$content" > "$filepath"
    echo "  ✅ Created: $filepath"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CannaSaas — Scaffold packages/utils"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Root: $ROOT"
echo "Target: $PKG"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Package config
# ─────────────────────────────────────────────────────────────────────────────
echo "📦 [1/7] Package config..."

write_if_new "$PKG/package.json" '{
  "name": "@cannasaas/utils",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.1.0"
  }
}'

write_if_new "$PKG/tsconfig.json" '{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}'

# ─────────────────────────────────────────────────────────────────────────────
# 2. cn.ts — clsx + tailwind-merge
# ─────────────────────────────────────────────────────────────────────────────
echo "🔧 [2/7] cn.ts..."

write_if_new "$PKG/src/cn.ts" 'import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-green-600", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
'

# ─────────────────────────────────────────────────────────────────────────────
# 3. formatting.ts — formatCurrency, formatDate, formatWeight
# ─────────────────────────────────────────────────────────────────────────────
echo "💰 [3/7] formatting.ts..."

write_if_new "$PKG/src/formatting.ts" '/**
 * Format a dollar amount (in dollars, not cents) for display.
 *
 * @param amount  Dollar amount (e.g. 29.99)
 * @param locale  BCP 47 locale string (default: "en-US")
 * @param currency ISO 4217 currency code (default: "USD")
 * @returns Formatted string, e.g. "$29.99"
 *
 * @example
 * formatCurrency(29.99)            // "$29.99"
 * formatCurrency(1500)             // "$1,500.00"
 * formatCurrency(29.99, "en-CA", "CAD") // "CA$29.99"
 */
export function formatCurrency(
  amount: number,
  locale = "en-US",
  currency = "USD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cents (integer) to a currency display string.
 *
 * @param cents  Amount in cents (e.g. 2999 = $29.99)
 * @param locale BCP 47 locale
 * @param currency ISO 4217 code
 * @returns Formatted string
 *
 * @example
 * formatCents(2999)  // "$29.99"
 * formatCents(100)   // "$1.00"
 */
export function formatCents(
  cents: number,
  locale = "en-US",
  currency = "USD",
): string {
  return formatCurrency(cents / 100, locale, currency);
}

/**
 * Format a date for display.
 *
 * @param date   Date string, Date object, or timestamp
 * @param style  Intl.DateTimeFormat style preset
 * @param locale BCP 47 locale (default: "en-US")
 *
 * @example
 * formatDate("2026-02-15")                    // "Feb 15, 2026"
 * formatDate("2026-02-15T10:30:00Z", "long")  // "February 15, 2026"
 * formatDate("2026-02-15T10:30:00Z", "full")  // "Sunday, February 15, 2026"
 */
export function formatDate(
  date: string | Date | number,
  style: "short" | "medium" | "long" | "full" = "medium",
  locale = "en-US",
): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(d);
}

/**
 * Format a date with time.
 *
 * @example
 * formatDateTime("2026-02-15T10:30:00Z") // "Feb 15, 2026, 10:30 AM"
 */
export function formatDateTime(
  date: string | Date | number,
  locale = "en-US",
): string {
  const d = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Format weight in grams to a human-readable string.
 * Automatically selects grams or ounces based on common cannabis conventions.
 *
 * @param grams  Weight in grams
 * @param unit   Display unit: "g" (grams) or "oz" (ounces)
 *
 * @example
 * formatWeight(3.5)       // "3.5g"
 * formatWeight(28)        // "28g"
 * formatWeight(3.5, "oz") // "0.12oz"
 * formatWeight(0.5)       // "0.5g"
 */
export function formatWeight(grams: number, unit: "g" | "oz" = "g"): string {
  if (unit === "oz") {
    const oz = grams / 28.3495;
    return `${oz.toFixed(2)}oz`;
  }
  // Remove trailing zeros: 3.50 → 3.5, 28.00 → 28
  const formatted = Number(grams.toFixed(2));
  return `${formatted}g`;
}

/**
 * Format a percentage for display.
 *
 * @example
 * formatPercentage(24.5)  // "24.5%"
 * formatPercentage(0.8)   // "0.8%"
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format THC/CBD content for product display.
 *
 * @example
 * formatCannabinoid("THC", 24.5)  // "THC: 24.5%"
 * formatCannabinoid("CBD", 0.8)   // "CBD: 0.8%"
 * formatCannabinoid("THC", null)  // null
 */
export function formatCannabinoid(
  label: string,
  value: number | null | undefined,
): string | null {
  if (value == null) return null;
  return `${label}: ${formatPercentage(value)}`;
}

/**
 * Truncate a string to a max length with ellipsis.
 *
 * @example
 * truncate("Blue Dream Premium Flower", 20) // "Blue Dream Premium…"
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1).trimEnd() + "\u2026";
}

/**
 * Slugify a string for URL-safe usage.
 *
 * @example
 * slugify("Blue Dream 3.5g")  // "blue-dream-3-5g"
 * slugify("OG Kush (Indoor)") // "og-kush-indoor"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pluralize a word based on count.
 *
 * @example
 * pluralize(1, "item")    // "1 item"
 * pluralize(5, "item")    // "5 items"
 * pluralize(0, "item")    // "0 items"
 * pluralize(2, "category", "categories") // "2 categories"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}
'

# ─────────────────────────────────────────────────────────────────────────────
# 4. validation.ts — Zod schemas matching backend DTOs
# ─────────────────────────────────────────────────────────────────────────────
echo "✅ [4/7] validation.ts..."

write_if_new "$PKG/src/validation.ts" 'import { z } from "zod";

// ── Shared field schemas ────────────────────────────────────────────────────

const email = z.string().email("Please enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

const uuid = z.string().uuid();

// ── Auth schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ── Product schemas ─────────────────────────────────────────────────────────

export const productCategories = [
  "flower",
  "pre_roll",
  "edible",
  "concentrate",
  "vape",
  "tincture",
  "topical",
  "accessory",
] as const;
export type ProductCategory = (typeof productCategories)[number];

export const strainTypes = ["indica", "sativa", "hybrid"] as const;
export type StrainType = (typeof strainTypes)[number];

export const createProductSchema = z.object({
  dispensaryId: uuid,
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name is too long"),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
    .optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  category: z.enum(productCategories, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  strainType: z.enum(strainTypes).optional(),
  thcContent: z.number().min(0).max(100).optional(),
  cbdContent: z.number().min(0).max(100).optional(),
  price: z.number().min(0.01, "Price must be greater than $0"),
  compareAtPrice: z.number().min(0).optional(),
  sku: z.string().min(1, "SKU is required").max(100),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  images: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  effects: z.array(z.string()).optional().default([]),
  flavors: z.array(z.string()).optional().default([]),
  brand: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  licenseNumber: z.string().max(100).optional(),
  batchNumber: z.string().max(100).optional(),
  labTested: z.boolean().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().omit({
  dispensaryId: true,
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
  category: z.enum(productCategories).optional(),
  strainType: z.enum(strainTypes).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
  dispensaryId: uuid.optional(),
  inStock: z.coerce.boolean().optional(),
});
export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ── Cart schemas ────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: uuid,
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const applyPromoSchema = z.object({
  code: z
    .string()
    .min(1, "Promo code is required")
    .max(50)
    .transform((s) => s.toUpperCase().trim()),
});
export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;

// ── Order schemas ───────────────────────────────────────────────────────────

export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const createOrderSchema = z.object({
  dispensaryId: uuid,
  notes: z.string().max(500).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses, {
    errorMap: () => ({ message: "Invalid order status" }),
  }),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(orderStatuses).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;

// ── Review schemas ──────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating is required").max(5),
  title: z.string().max(200).optional(),
  review: z.string().max(2000).optional(),
  detailedRatings: z
    .object({
      quality: z.number().int().min(1).max(5),
      value: z.number().int().min(1).max(5),
      effects: z.number().int().min(1).max(5),
    })
    .optional(),
  feedback: z
    .object({
      effectsExperienced: z.array(z.string()),
      timeOfDayUsed: z.string(),
    })
    .optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ── Organization / Dispensary schemas ───────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain must be lowercase alphanumeric with optional hyphens",
    ),
  description: z.string().max(1000).optional(),
});
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const createDispensarySchema = z.object({
  companyId: uuid,
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
  address: z.string().min(5).max(500),
  city: z.string().min(1).max(200),
  state: z.string().length(2, "State must be a 2-letter code"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{10,}$/, "Invalid phone number")
    .optional(),
  email: z.string().email().optional(),
  licenseNumber: z.string().min(1, "License number is required"),
});
export type CreateDispensaryInput = z.infer<typeof createDispensarySchema>;

// ── Analytics schemas ───────────────────────────────────────────────────────

export const analyticsDateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    { message: "Start date must be before end date", path: ["startDate"] },
  );
export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>;
'

# ─────────────────────────────────────────────────────────────────────────────
# 5. date.ts — date-fns wrappers for consistent date handling
# ─────────────────────────────────────────────────────────────────────────────
echo "📅 [5/7] date.ts..."

write_if_new "$PKG/src/date.ts" 'import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

// ── Parsing ─────────────────────────────────────────────────────────────────

/**
 * Safely parse a date string, Date, or timestamp into a Date object.
 * Returns null if invalid.
 */
export function toDate(value: string | Date | number | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value === "number") {
    const d = new Date(value);
    return isValid(d) ? d : null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

/**
 * Parse and assert a date value. Throws if invalid.
 */
export function toDateStrict(value: string | Date | number): Date {
  const d = toDate(value);
  if (!d) throw new Error(`Invalid date: ${String(value)}`);
  return d;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format a date with a date-fns format string.
 * @example formatDateFns("2026-02-15", "MMM d, yyyy") // "Feb 15, 2026"
 */
export function formatDateFns(
  value: string | Date | number,
  pattern = "MMM d, yyyy",
): string {
  return format(toDateStrict(value), pattern);
}

/**
 * Format a date with time.
 * @example formatDateTimeFns("2026-02-15T10:30:00Z") // "Feb 15, 2026 10:30 AM"
 */
export function formatDateTimeFns(
  value: string | Date | number,
  pattern = "MMM d, yyyy h:mm a",
): string {
  return format(toDateStrict(value), pattern);
}

/**
 * "2 hours ago", "3 days ago", "in 5 minutes"
 */
export function timeAgo(value: string | Date | number): string {
  return formatDistanceToNow(toDateStrict(value), { addSuffix: true });
}

/**
 * Format as ISO date string (YYYY-MM-DD) for API params.
 */
export function toISODate(value: string | Date | number): string {
  return format(toDateStrict(value), "yyyy-MM-dd");
}

// ── Date range presets (for analytics filters) ──────────────────────────────

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export function getDateRangePresets(): DateRange[] {
  const today = new Date();
  return [
    {
      label: "Today",
      startDate: toISODate(startOfDay(today)),
      endDate: toISODate(endOfDay(today)),
    },
    {
      label: "Yesterday",
      startDate: toISODate(startOfDay(subDays(today, 1))),
      endDate: toISODate(endOfDay(subDays(today, 1))),
    },
    {
      label: "Last 7 days",
      startDate: toISODate(subDays(today, 6)),
      endDate: toISODate(today),
    },
    {
      label: "Last 30 days",
      startDate: toISODate(subDays(today, 29)),
      endDate: toISODate(today),
    },
    {
      label: "This week",
      startDate: toISODate(startOfWeek(today, { weekStartsOn: 1 })),
      endDate: toISODate(endOfWeek(today, { weekStartsOn: 1 })),
    },
    {
      label: "This month",
      startDate: toISODate(startOfMonth(today)),
      endDate: toISODate(endOfMonth(today)),
    },
    {
      label: "Last month",
      startDate: toISODate(startOfMonth(subMonths(today, 1))),
      endDate: toISODate(endOfMonth(subMonths(today, 1))),
    },
    {
      label: "Last 90 days",
      startDate: toISODate(subDays(today, 89)),
      endDate: toISODate(today),
    },
  ];
}

// ── Comparisons ─────────────────────────────────────────────────────────────

export {
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
};
'

# ─────────────────────────────────────────────────────────────────────────────
# 6. currency.ts — Tax calculation + price helpers
# ─────────────────────────────────────────────────────────────────────────────
echo "💵 [6/7] currency.ts..."

write_if_new "$PKG/src/currency.ts" '// ── Cannabis tax rates by state ──────────────────────────────────────────────
// Source: State excise + sales tax rates as of 2025
// These are approximate combined rates; actual rates may vary by locality.

export interface TaxRate {
  /** State abbreviation */
  state: string;
  /** State excise tax on cannabis (percentage, e.g. 13 = 13%) */
  exciseTax: number;
  /** State sales tax (percentage) */
  salesTax: number;
  /** Average local tax addon (percentage) */
  localTax: number;
  /** Whether the excise tax is applied to retail price (true) or wholesale (false) */
  exciseOnRetail: boolean;
}

export const STATE_TAX_RATES: Record<string, TaxRate> = {
  NY: {
    state: "NY",
    exciseTax: 9,      // NY adult-use cannabis tax
    salesTax: 4,
    localTax: 4,       // county + city
    exciseOnRetail: true,
  },
  NJ: {
    state: "NJ",
    exciseTax: 6.625,  // NJ social equity excise tax
    salesTax: 6.625,
    localTax: 2,       // municipality transfer tax
    exciseOnRetail: true,
  },
  CT: {
    state: "CT",
    exciseTax: 6.35,   // CT cannabis tax
    salesTax: 6.35,
    localTax: 3,       // municipal
    exciseOnRetail: true,
  },
};

/**
 * Supported states for CannaSaas (NY, NJ, CT).
 */
export const SUPPORTED_STATES = Object.keys(STATE_TAX_RATES);

// ── Tax calculation ─────────────────────────────────────────────────────────

export interface TaxBreakdown {
  /** Original price before tax */
  subtotal: number;
  /** Excise tax amount */
  exciseTax: number;
  /** Sales tax amount */
  salesTax: number;
  /** Local tax amount */
  localTax: number;
  /** Total tax */
  totalTax: number;
  /** Final price including all taxes */
  total: number;
  /** Effective tax rate as a percentage */
  effectiveRate: number;
}

/**
 * Calculate full tax breakdown for a cannabis purchase.
 *
 * @param subtotal   Pre-tax dollar amount
 * @param stateCode  Two-letter state code (NY, NJ, CT)
 * @returns Tax breakdown with all components
 *
 * @example
 * calculateTax(100, "NY")
 * // { subtotal: 100, exciseTax: 9, salesTax: 4, localTax: 4,
 * //   totalTax: 17, total: 117, effectiveRate: 17 }
 */
export function calculateTax(subtotal: number, stateCode: string): TaxBreakdown {
  const rates = STATE_TAX_RATES[stateCode.toUpperCase()];

  if (!rates) {
    // No tax info for unsupported states — return zero tax
    return {
      subtotal,
      exciseTax: 0,
      salesTax: 0,
      localTax: 0,
      totalTax: 0,
      total: subtotal,
      effectiveRate: 0,
    };
  }

  const exciseTax = round2(subtotal * (rates.exciseTax / 100));
  const salesTax = round2(subtotal * (rates.salesTax / 100));
  const localTax = round2(subtotal * (rates.localTax / 100));
  const totalTax = round2(exciseTax + salesTax + localTax);
  const total = round2(subtotal + totalTax);
  const effectiveRate = subtotal > 0 ? round2((totalTax / subtotal) * 100) : 0;

  return {
    subtotal,
    exciseTax,
    salesTax,
    localTax,
    totalTax,
    total,
    effectiveRate,
  };
}

/**
 * Quick total-with-tax calculation.
 *
 * @example
 * applyTax(50, "NJ") // 57.63 (approx)
 */
export function applyTax(subtotal: number, stateCode: string): number {
  return calculateTax(subtotal, stateCode).total;
}

// ── Price helpers ───────────────────────────────────────────────────────────

/**
 * Calculate discount percentage between original and sale price.
 *
 * @example
 * discountPercent(50, 35) // 30  (30% off)
 */
export function discountPercent(
  originalPrice: number,
  salePrice: number,
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculate line item total (price × quantity).
 * Rounds to 2 decimal places.
 */
export function lineTotal(unitPrice: number, quantity: number): number {
  return round2(unitPrice * quantity);
}

/**
 * Sum an array of line item amounts.
 */
export function sumAmounts(amounts: number[]): number {
  return round2(amounts.reduce((sum, a) => sum + a, 0));
}

/**
 * Format a price with locale-aware currency formatting.
 * Re-exported from formatting for convenience.
 */
export { formatCurrency, formatCents } from "./formatting";

// ── Internal ────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
'

# ─────────────────────────────────────────────────────────────────────────────
# 7. Barrel export
# ─────────────────────────────────────────────────────────────────────────────
echo "📤 [7/7] Barrel export..."

write_if_new "$PKG/src/index.ts" '// ─────────────────────────────────────────────────────────────────────────────
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
'

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Done! packages/utils scaffolded."
echo ""
echo "  Files created:"
echo "    • cn.ts          — clsx + tailwind-merge"
echo "    • formatting.ts  — formatCurrency, formatDate, formatWeight,"
echo "                       formatPercentage, formatCannabinoid,"
echo "                       truncate, slugify, pluralize"
echo "    • validation.ts  — Zod schemas: login, register, product,"
echo "                       cart, order, review, dispensary, analytics"
echo "    • date.ts        — date-fns wrappers, timeAgo, date range"
echo "                       presets for analytics filters"
echo "    • currency.ts    — NY/NJ/CT tax rates, calculateTax,"
echo "                       discountPercent, lineTotal, sumAmounts"
echo ""
echo "  Next steps:"
echo "    1. cd $ROOT && pnpm install"
echo '    2. Add to each app'\''s package.json:'
echo '       "@cannasaas/utils": "workspace:*"'
echo '    3. Import in your apps:'
echo '       import { formatCurrency, loginSchema, calculateTax } from '\''@cannasaas/utils'\'';'
echo "═══════════════════════════════════════════════════════════════"
