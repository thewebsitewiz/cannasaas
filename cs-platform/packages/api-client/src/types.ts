// ---------------------------------------------------------------------------
// Shared API types — keep in sync with your NestJS DTOs
// ---------------------------------------------------------------------------

// ── Pagination ──────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | 'super_admin'
  | 'org_admin'
  | 'company_admin'
  | 'dispensary_manager'
  | 'budtender'
  | 'customer';

// ── Organization ────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companies?: Company[];
}

// ── Company ─────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Dispensary ──────────────────────────────────────────────────────────────
export interface Dispensary {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  dispensaryId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category: ProductCategory;
  strainType?: 'indica' | 'sativa' | 'hybrid';
  thcContent?: number;
  cbdContent?: number;
  price: number;
  compareAtPrice?: number;
  sku: string;
  quantity: number;
  images: string[];
  isActive: boolean;
  tags?: string[];
  effects?: string[];
  flavors?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'flower'
  | 'pre_roll'
  | 'edible'
  | 'concentrate'
  | 'vape'
  | 'tincture'
  | 'topical'
  | 'accessory';

export interface ProductFilters extends PaginationParams {
  category?: ProductCategory;
  strainType?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  dispensaryId?: string;
  inStock?: boolean;
}

// ── Cart ────────────────────────────────────────────────────────────────────
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  promoCode?: string;
  discount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ── Order ───────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  userId: string;
  dispensaryId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  promoCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateOrderRequest {
  dispensaryId: string;
  notes?: string;
}

// ── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  review?: string;
  detailedRatings?: {
    quality: number;
    value: number;
    effects: number;
  };
  customerInfo: {
    displayName: string;
    verified: boolean;
  };
  engagement: {
    helpful: number;
    notHelpful: number;
  };
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  review?: string;
  detailedRatings?: {
    quality: number;
    value: number;
    effects: number;
  };
  feedback?: {
    effectsExperienced: string[];
    timeOfDayUsed: string;
  };
}

// ── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsOverview {
  revenue: {
    total: number;
    change: number;
    byDay: Array<{ date: string; amount: number }>;
  };
  orders: {
    total: number;
    change: number;
    byDay: Array<{ date: string; count: number }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    change: number;
  };
  avgOrderValue: {
    value: number;
    change: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantity: number;
  }>;
}

export interface ProductAnalytics {
  productId: string;
  name: string;
  category: string;
  views: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}
