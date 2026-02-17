import { z } from "zod";

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
