#!/bin/bash
# =============================================================
# CannaSaas API Client Generation Script
# Run from the monorepo root: ./generate-api-client.sh
# Creates Axios client, service files, TanStack Query hooks,
# and barrel exports in packages/api-client/src/
# =============================================================

set -e

PKG_DIR="packages/api-client"
SRC_DIR="$PKG_DIR/src"
SERVICES_DIR="$SRC_DIR/services"
HOOKS_DIR="$SRC_DIR/hooks"

echo "========================================="
echo "  Generating packages/api-client"
echo "========================================="

# Create directories
mkdir -p "$SERVICES_DIR" "$HOOKS_DIR"

# ----- Install dependencies -----
echo "→ Setting up package..."
cat > "$PKG_DIR/package.json" << 'PACKAGE'
{
  "name": "@cannasaas/api-client",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "peerDependencies": {
    "@cannasaas/types": "workspace:*",
    "@cannasaas/stores": "workspace:*",
    "react": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "~5.9.0"
  }
}
PACKAGE

cat > "$PKG_DIR/tsconfig.json" << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
TSCONFIG

pnpm install

# =============================================================
# Layer 1: Axios Client (client.ts)
# =============================================================
echo "→ Creating client.ts (Axios + interceptors)..."
cat > "$SRC_DIR/client.ts" << 'EOF'
// =============================================================
// Axios Client — Layer 1
// Configured instance with auth interceptors + token refresh.
// All service files import apiClient from here.
// =============================================================

import axios from 'axios';
import { useAuthStore } from '@cannasaas/stores';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cannasaas.com/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// --- Request Interceptor: Attach auth token ---
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor: Handle 401 + token refresh ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;

        useAuthStore.getState().setTokens({
          accessToken: newAccessToken,
          refreshToken: data.refreshToken,
        });

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
EOF

# =============================================================
# Layer 2: Service Files
# =============================================================

# --- auth.ts ---
echo "→ Creating services/auth.ts..."
cat > "$SERVICES_DIR/auth.ts" << 'EOF'
// =============================================================
// Auth Service — Maps to /auth endpoints (Sprint 2)
// =============================================================

import { apiClient } from '../client';
import type {
  User,
  AuthTokens,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  SuccessResponse,
} from '@cannasaas/types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', registerData);
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
    return data;
  },

  logout: async (): Promise<SuccessResponse> => {
    const { data } = await apiClient.post<SuccessResponse>('/auth/logout');
    return data;
  },

  forgotPassword: async (email: string, organizationId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', {
      email,
      organizationId,
    });
    return data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
    return data;
  },
};
EOF

# --- products.ts ---
echo "→ Creating services/products.ts..."
cat > "$SERVICES_DIR/products.ts" << 'EOF'
// =============================================================
// Products Service — Maps to /products endpoints (Sprint 4)
// =============================================================

import { apiClient } from '../client';
import type {
  Product,
  ProductFilters,
  PaginatedResponse,
  ApiResponse,
  SuccessResponse,
} from '@cannasaas/types';

export interface ProductDetailResponse {
  data: Product;
  related: Product[];
  recommendations: Product[];
}

export const productsService = {
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    });
    return data;
  },

  getProduct: async (idOrSlug: string): Promise<ProductDetailResponse> => {
    const { data } = await apiClient.get<ProductDetailResponse>(`/products/${idOrSlug}`);
    return data;
  },

  createProduct: async (product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', product);
    return data;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, updates);
    return data;
  },

  deleteProduct: async (id: string): Promise<SuccessResponse> => {
    const { data } = await apiClient.delete<SuccessResponse>(`/products/${id}`);
    return data;
  },
};
EOF

# --- orders.ts ---
echo "→ Creating services/orders.ts..."
cat > "$SERVICES_DIR/orders.ts" << 'EOF'
// =============================================================
// Orders Service — Maps to /orders endpoints (Sprint 5)
// =============================================================

import { apiClient } from '../client';
import type {
  Order,
  OrderFilters,
  PaginatedResponse,
  ApiResponse,
} from '@cannasaas/types';

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  fulfillment: {
    method: 'delivery' | 'pickup' | 'curbside';
    addressId?: string;
    scheduledFor?: string;
    deliveryInstructions?: string;
  };
  payment: {
    method: 'card' | 'cash' | 'debit';
    paymentMethodId?: string;
  };
  couponCodes?: string[];
  loyaltyPoints?: number;
  notes?: { customer?: string };
}

export interface CreateOrderResponse {
  data: Order;
  paymentIntent?: {
    clientSecret: string;
  };
}

export interface OrderTrackingResponse {
  status: string;
  estimatedDelivery: string;
  currentLocation?: { lat: number; lng: number };
  driver?: {
    name: string;
    phone: string;
    photo?: string;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
  }>;
}

export interface CancelOrderRequest {
  reason: string;
  details?: string;
}

export const ordersService = {
  getOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: filters,
    });
    return data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return data;
  },

  createOrder: async (order: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const { data } = await apiClient.post<CreateOrderResponse>('/orders', order);
    return data;
  },

  trackOrder: async (id: string): Promise<ApiResponse<OrderTrackingResponse>> => {
    const { data } = await apiClient.get<ApiResponse<OrderTrackingResponse>>(`/orders/${id}/track`);
    return data;
  },

  cancelOrder: async (id: string, reason: CancelOrderRequest): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/cancel`, reason);
    return data;
  },

  // Admin: Update order status
  updateOrderStatus: async (
    id: string,
    status: string,
    note?: string
  ): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
      note,
    });
    return data;
  },

  // Admin: Assign driver
  assignDriver: async (orderId: string, driverId: string): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.put<ApiResponse<Order>>(`/orders/${orderId}/assign-driver`, {
      driverId,
    });
    return data;
  },
};
EOF

# --- cart.ts ---
echo "→ Creating services/cart.ts..."
cat > "$SERVICES_DIR/cart.ts" << 'EOF'
// =============================================================
// Cart Service — Maps to /cart endpoints (Sprint 5)
// =============================================================

import { apiClient } from '../client';
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  ApplyCouponRequest,
  ApiResponse,
} from '@cannasaas/types';

export interface CouponResponse {
  data: Cart;
  discount: {
    code: string;
    amount: number;
    type: string;
  };
}

export const cartService = {
  getCart: async (): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.get<ApiResponse<Cart>>('/cart');
    return data;
  },

  addItem: async (item: AddToCartRequest): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.post<ApiResponse<Cart>>('/cart/items', item);
    return data;
  },

  updateItem: async (itemId: string, update: UpdateCartItemRequest): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, update);
    return data;
  },

  removeItem: async (itemId: string): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return data;
  },

  applyCoupon: async (coupon: ApplyCouponRequest): Promise<CouponResponse> => {
    const { data } = await apiClient.post<CouponResponse>('/cart/coupon', coupon);
    return data;
  },

  removeCoupon: async (code: string): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>(`/cart/coupon/${code}`);
    return data;
  },

  clearCart: async (): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>('/cart');
    return data;
  },
};
EOF

# --- users.ts ---
echo "→ Creating services/users.ts..."
cat > "$SERVICES_DIR/users.ts" << 'EOF'
// =============================================================
// Users Service — Maps to /users endpoints (Sprint 2)
// =============================================================

import { apiClient } from '../client';
import type {
  User,
  Address,
  UserLoyalty,
  ApiResponse,
  PaginatedResponse,
} from '@cannasaas/types';

export interface LoyaltyDetailResponse extends UserLoyalty {
  nextTier?: string;
  pointsToNextTier?: number;
  rewardsHistory: Array<{
    type: string;
    points: number;
    date: string;
    description: string;
  }>;
}

export interface RedeemPointsResponse {
  couponCode: string;
  discountAmount: number;
  remainingPoints: number;
}

export const usersService = {
  // --- Current User ---
  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
    return data;
  },

  updateMe: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.put<ApiResponse<User>>('/users/me', updates);
    return data;
  },

  // --- Addresses ---
  getAddresses: async (): Promise<ApiResponse<Address[]>> => {
    const { data } = await apiClient.get<ApiResponse<Address[]>>('/users/me/addresses');
    return data;
  },

  addAddress: async (address: Omit<Address, '_id'>): Promise<ApiResponse<Address>> => {
    const { data } = await apiClient.post<ApiResponse<Address>>('/users/me/addresses', address);
    return data;
  },

  updateAddress: async (id: string, updates: Partial<Address>): Promise<ApiResponse<Address>> => {
    const { data } = await apiClient.put<ApiResponse<Address>>(`/users/me/addresses/${id}`, updates);
    return data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/me/addresses/${id}`);
  },

  // --- Loyalty ---
  getLoyalty: async (): Promise<ApiResponse<LoyaltyDetailResponse>> => {
    const { data } = await apiClient.get<ApiResponse<LoyaltyDetailResponse>>('/users/me/loyalty');
    return data;
  },

  redeemPoints: async (points: number): Promise<ApiResponse<RedeemPointsResponse>> => {
    const { data } = await apiClient.post<ApiResponse<RedeemPointsResponse>>(
      '/users/me/loyalty/redeem',
      { points }
    );
    return data;
  },

  // --- Admin: User Management ---
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return data;
  },

  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/admin/users/${id}`);
    return data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, updates);
    return data;
  },
};
EOF

# --- reviews.ts ---
echo "→ Creating services/reviews.ts..."
cat > "$SERVICES_DIR/reviews.ts" << 'EOF'
// =============================================================
// Reviews Service — Maps to /products/:id/reviews endpoints (Sprint 9)
// =============================================================

import { apiClient } from '../client';
import type {
  Review,
  ReviewSummary,
  CreateReviewRequest,
  ApiResponse,
} from '@cannasaas/types';

export interface ReviewsResponse {
  data: Review[];
  summary: ReviewSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  verified?: boolean;
  sort?: 'newest' | 'oldest' | 'highest_rated' | 'most_helpful';
}

export const reviewsService = {
  getProductReviews: async (
    productId: string,
    filters?: ReviewFilters
  ): Promise<ReviewsResponse> => {
    const { data } = await apiClient.get<ReviewsResponse>(`/products/${productId}/reviews`, {
      params: filters,
    });
    return data;
  },

  createReview: async (
    productId: string,
    review: CreateReviewRequest
  ): Promise<ApiResponse<Review>> => {
    const { data } = await apiClient.post<ApiResponse<Review>>(
      `/products/${productId}/reviews`,
      review
    );
    return data;
  },

  voteHelpful: async (reviewId: string, helpful: boolean): Promise<void> => {
    await apiClient.post(`/reviews/${reviewId}/vote`, { helpful });
  },

  // Admin: Moderate review
  moderateReview: async (
    reviewId: string,
    status: 'approved' | 'rejected'
  ): Promise<ApiResponse<Review>> => {
    const { data } = await apiClient.put<ApiResponse<Review>>(`/admin/reviews/${reviewId}`, {
      moderation: { status },
    });
    return data;
  },

  // Admin: Respond to review
  respondToReview: async (reviewId: string, responseText: string): Promise<ApiResponse<Review>> => {
    const { data } = await apiClient.post<ApiResponse<Review>>(
      `/admin/reviews/${reviewId}/respond`,
      { responseText }
    );
    return data;
  },
};
EOF

# --- analytics.ts ---
echo "→ Creating services/analytics.ts..."
cat > "$SERVICES_DIR/analytics.ts" << 'EOF'
// =============================================================
// Analytics Service — Maps to /admin/analytics endpoints (Sprint 12)
// =============================================================

import { apiClient } from '../client';
import type {
  AnalyticsOverview,
  AnalyticsFilters,
  ProductAnalyticsItem,
  ProductAnalyticsFilters,
  ApiResponse,
} from '@cannasaas/types';

export const analyticsService = {
  getOverview: async (filters: AnalyticsFilters): Promise<ApiResponse<AnalyticsOverview>> => {
    const { data } = await apiClient.get<ApiResponse<AnalyticsOverview>>(
      '/admin/analytics/overview',
      { params: filters }
    );
    return data;
  },

  getProductAnalytics: async (
    filters: ProductAnalyticsFilters
  ): Promise<ApiResponse<ProductAnalyticsItem[]>> => {
    const { data } = await apiClient.get<ApiResponse<ProductAnalyticsItem[]>>(
      '/admin/analytics/products',
      { params: filters }
    );
    return data;
  },

  getCustomerAnalytics: async (filters: AnalyticsFilters): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.get<ApiResponse<unknown>>(
      '/admin/analytics/customers',
      { params: filters }
    );
    return data;
  },

  getRevenueByCategory: async (filters: AnalyticsFilters): Promise<ApiResponse<unknown>> => {
    const { data } = await apiClient.get<ApiResponse<unknown>>(
      '/admin/analytics/revenue-by-category',
      { params: filters }
    );
    return data;
  },

  exportCsv: async (
    reportType: 'orders' | 'products' | 'customers' | 'revenue',
    filters: AnalyticsFilters
  ): Promise<Blob> => {
    const response = await apiClient.get(`/admin/analytics/export/${reportType}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
EOF

# --- compliance.ts ---
echo "→ Creating services/compliance.ts..."
cat > "$SERVICES_DIR/compliance.ts" << 'EOF'
// =============================================================
// Compliance Service — Maps to compliance endpoints (Sprint 6, 8)
// =============================================================

import { apiClient } from '../client';
import type {
  ComplianceEvent,
  ComplianceFilters,
  ComplianceReport,
  PaginatedResponse,
  ApiResponse,
} from '@cannasaas/types';

export const complianceService = {
  getEvents: async (filters?: ComplianceFilters): Promise<PaginatedResponse<ComplianceEvent>> => {
    const { data } = await apiClient.get<PaginatedResponse<ComplianceEvent>>(
      '/admin/compliance/events',
      { params: filters }
    );
    return data;
  },

  getEvent: async (id: string): Promise<ApiResponse<ComplianceEvent>> => {
    const { data } = await apiClient.get<ApiResponse<ComplianceEvent>>(
      `/admin/compliance/events/${id}`
    );
    return data;
  },

  resolveEvent: async (
    id: string,
    resolution: string
  ): Promise<ApiResponse<ComplianceEvent>> => {
    const { data } = await apiClient.put<ApiResponse<ComplianceEvent>>(
      `/admin/compliance/events/${id}/resolve`,
      { resolution }
    );
    return data;
  },

  getReport: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<ComplianceReport>> => {
    const { data } = await apiClient.get<ApiResponse<ComplianceReport>>(
      '/admin/compliance/report',
      { params: { startDate, endDate } }
    );
    return data;
  },

  // METRC Sync (Sprint 8)
  triggerMetrcSync: async (): Promise<ApiResponse<{ syncId: string; status: string }>> => {
    const { data } = await apiClient.post<ApiResponse<{ syncId: string; status: string }>>(
      '/admin/compliance/metrc/sync'
    );
    return data;
  },

  getMetrcSyncStatus: async (
    syncId: string
  ): Promise<ApiResponse<{ status: string; syncedCount: number; failedCount: number }>> => {
    const { data } = await apiClient.get<
      ApiResponse<{ status: string; syncedCount: number; failedCount: number }>
    >(`/admin/compliance/metrc/sync/${syncId}`);
    return data;
  },
};
EOF

# --- delivery.ts ---
echo "→ Creating services/delivery.ts..."
cat > "$SERVICES_DIR/delivery.ts" << 'EOF'
// =============================================================
// Delivery Service — Maps to delivery endpoints (Sprint 10)
// =============================================================

import { apiClient } from '../client';
import type {
  Driver,
  DriverAssignRequest,
  DeliveryZone,
  DeliveryEstimate,
  DeliveryCheckRequest,
  ApiResponse,
  PaginatedResponse,
} from '@cannasaas/types';

export const deliveryService = {
  // --- Delivery Zones ---
  getZones: async (): Promise<ApiResponse<DeliveryZone[]>> => {
    const { data } = await apiClient.get<ApiResponse<DeliveryZone[]>>('/admin/delivery/zones');
    return data;
  },

  createZone: async (zone: Omit<DeliveryZone, '_id'>): Promise<ApiResponse<DeliveryZone>> => {
    const { data } = await apiClient.post<ApiResponse<DeliveryZone>>(
      '/admin/delivery/zones',
      zone
    );
    return data;
  },

  updateZone: async (
    id: string,
    updates: Partial<DeliveryZone>
  ): Promise<ApiResponse<DeliveryZone>> => {
    const { data } = await apiClient.put<ApiResponse<DeliveryZone>>(
      `/admin/delivery/zones/${id}`,
      updates
    );
    return data;
  },

  deleteZone: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/delivery/zones/${id}`);
  },

  checkDelivery: async (request: DeliveryCheckRequest): Promise<ApiResponse<DeliveryEstimate>> => {
    const { data } = await apiClient.post<ApiResponse<DeliveryEstimate>>(
      '/delivery/check',
      request
    );
    return data;
  },

  // --- Drivers ---
  getDrivers: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Driver>> => {
    const { data } = await apiClient.get<PaginatedResponse<Driver>>('/admin/drivers', { params });
    return data;
  },

  getDriver: async (id: string): Promise<ApiResponse<Driver>> => {
    const { data } = await apiClient.get<ApiResponse<Driver>>(`/admin/drivers/${id}`);
    return data;
  },

  createDriver: async (driver: Partial<Driver>): Promise<ApiResponse<Driver>> => {
    const { data } = await apiClient.post<ApiResponse<Driver>>('/admin/drivers', driver);
    return data;
  },

  updateDriver: async (id: string, updates: Partial<Driver>): Promise<ApiResponse<Driver>> => {
    const { data } = await apiClient.put<ApiResponse<Driver>>(`/admin/drivers/${id}`, updates);
    return data;
  },

  assignDriver: async (request: DriverAssignRequest): Promise<ApiResponse<Driver>> => {
    const { data } = await apiClient.post<ApiResponse<Driver>>('/admin/drivers/assign', request);
    return data;
  },

  // --- Active Deliveries ---
  getActiveDeliveries: async (): Promise<
    ApiResponse<
      Array<{
        orderId: string;
        driverId: string;
        driverName: string;
        status: string;
        currentLocation: { lat: number; lng: number };
        eta: string;
      }>
    >
  > => {
    const { data } = await apiClient.get('/admin/delivery/active');
    return data;
  },
};
EOF

# --- coupons.ts ---
echo "→ Creating services/coupons.ts..."
cat > "$SERVICES_DIR/coupons.ts" << 'EOF'
// =============================================================
// Coupons Service — Maps to coupon management endpoints (Sprint 6)
// =============================================================

import { apiClient } from '../client';
import type {
  Coupon,
  ApiResponse,
  PaginatedResponse,
} from '@cannasaas/types';

export const couponsService = {
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Coupon>> => {
    const { data } = await apiClient.get<PaginatedResponse<Coupon>>('/admin/coupons', { params });
    return data;
  },

  getCoupon: async (id: string): Promise<ApiResponse<Coupon>> => {
    const { data } = await apiClient.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
    return data;
  },

  createCoupon: async (coupon: Partial<Coupon>): Promise<ApiResponse<Coupon>> => {
    const { data } = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', coupon);
    return data;
  },

  updateCoupon: async (id: string, updates: Partial<Coupon>): Promise<ApiResponse<Coupon>> => {
    const { data } = await apiClient.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, updates);
    return data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/coupons/${id}`);
  },

  // Validate a coupon code (public, used during checkout)
  validateCoupon: async (code: string): Promise<ApiResponse<Coupon>> => {
    const { data } = await apiClient.get<ApiResponse<Coupon>>(`/coupons/validate/${code}`);
    return data;
  },
};
EOF

# --- organizations.ts ---
echo "→ Creating services/organizations.ts..."
cat > "$SERVICES_DIR/organizations.ts" << 'EOF'
// =============================================================
// Organizations Service — Maps to /organizations endpoints (Sprint 3)
// Used by tenant resolution and admin settings.
// =============================================================

import { apiClient } from '../client';
import type {
  Organization,
  OrganizationBranding,
  ApiResponse,
} from '@cannasaas/types';

export const organizationsService = {
  // Tenant resolution (called on app load)
  getBySlug: async (slug: string): Promise<ApiResponse<Organization>> => {
    const { data } = await apiClient.get<ApiResponse<Organization>>(
      `/organizations/by-slug/${slug}`
    );
    return data;
  },

  // Admin: Get current org details
  getCurrent: async (): Promise<ApiResponse<Organization>> => {
    const { data } = await apiClient.get<ApiResponse<Organization>>('/organizations/me');
    return data;
  },

  // Admin: Update org settings
  update: async (updates: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const { data } = await apiClient.put<ApiResponse<Organization>>(
      '/organizations/me',
      updates
    );
    return data;
  },

  // Admin: Update branding
  updateBranding: async (
    branding: Partial<OrganizationBranding>
  ): Promise<ApiResponse<Organization>> => {
    const { data } = await apiClient.put<ApiResponse<Organization>>(
      '/organizations/me/branding',
      branding
    );
    return data;
  },

  // Admin: Upload logo
  uploadLogo: async (file: File, variant: 'light' | 'dark' | 'favicon'): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('variant', variant);
    const { data } = await apiClient.post<{ url: string }>(
      '/organizations/me/logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
EOF

# =============================================================
# Layer 3: TanStack Query Hooks
# =============================================================

# --- useAuth.ts ---
echo "→ Creating hooks/useAuth.ts..."
cat > "$HOOKS_DIR/useAuth.ts" << 'EOF'
// =============================================================
// Auth Hooks — TanStack Query mutations for auth actions
// =============================================================

import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@cannasaas/stores';
import { authService } from '../services/auth';
import type { LoginCredentials, RegisterData } from '@cannasaas/types';

export function useLogin() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      login(data.user, data.tokens);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (registerData: RegisterData) => authService.register(registerData),
    onSuccess: (data) => {
      login(data.user, data.tokens);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
    },
    onError: () => {
      // Force logout even if server call fails
      logout();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email, organizationId }: { email: string; organizationId: string }) =>
      authService.forgotPassword(email, organizationId),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  });
}
EOF

# --- useProducts.ts ---
echo "→ Creating hooks/useProducts.ts..."
cat > "$HOOKS_DIR/useProducts.ts" << 'EOF'
// =============================================================
// Products Hooks — TanStack Query for product data
// =============================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { productsService } from '../services/products';
import type { Product, ProductFilters } from '@cannasaas/types';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
  });
}

export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      productsService.getProducts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useProduct(idOrSlug: string) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: () => productsService.getProduct(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: Partial<Product>) => productsService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productsService.updateProduct(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
EOF

# --- useOrders.ts ---
echo "→ Creating hooks/useOrders.ts..."
cat > "$HOOKS_DIR/useOrders.ts" << 'EOF'
// =============================================================
// Orders Hooks — TanStack Query for order data
// =============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService, type CreateOrderRequest, type CancelOrderRequest } from '../services/orders';
import type { OrderFilters } from '@cannasaas/types';

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersService.getOrders(filters),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersService.getOrder(id),
    enabled: !!id,
  });
}

export function useOrderTracking(id: string) {
  return useQuery({
    queryKey: ['order', id, 'tracking'],
    queryFn: () => ordersService.trackOrder(id),
    enabled: !!id,
    refetchInterval: 30000, // Poll every 30s for live tracking
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: CreateOrderRequest) => ordersService.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: CancelOrderRequest }) =>
      ordersService.cancelOrder(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      ordersService.updateOrderStatus(id, status, note),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      ordersService.assignDriver(orderId, driverId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
EOF

# --- useCart.ts ---
echo "→ Creating hooks/useCart.ts..."
cat > "$HOOKS_DIR/useCart.ts" << 'EOF'
// =============================================================
// Cart Hooks — TanStack Query with optimistic updates
// =============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart';
import type { AddToCartRequest, UpdateCartItemRequest } from '@cannasaas/types';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: AddToCartRequest) => cartService.addItem(item),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      return { previousCart };
    },
    onError: (_err, _item, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, update }: { itemId: string; update: UpdateCartItemRequest }) =>
      cartService.updateItem(itemId, update),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => cartService.applyCoupon({ code }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clearCart(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
EOF

# --- useUsers.ts ---
echo "→ Creating hooks/useUsers.ts..."
cat > "$HOOKS_DIR/useUsers.ts" << 'EOF'
// =============================================================
// Users Hooks — TanStack Query for user data
// =============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users';
import type { User, Address } from '@cannasaas/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersService.getMe(),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<User>) => usersService.updateMe(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['user', 'addresses'],
    queryFn: () => usersService.getAddresses(),
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: Omit<Address, '_id'>) => usersService.addAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Address> }) =>
      usersService.updateAddress(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'addresses'] });
    },
  });
}

export function useLoyalty() {
  return useQuery({
    queryKey: ['user', 'loyalty'],
    queryFn: () => usersService.getLoyalty(),
  });
}

export function useRedeemPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (points: number) => usersService.redeemPoints(points),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'loyalty'] });
    },
  });
}

// Admin hooks
export function useUsers(params?: { page?: number; limit?: number; role?: string; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => usersService.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => usersService.getUser(id),
    enabled: !!id,
  });
}
EOF

# --- useReviews.ts ---
echo "→ Creating hooks/useReviews.ts..."
cat > "$HOOKS_DIR/useReviews.ts" << 'EOF'
// =============================================================
// Reviews Hooks — TanStack Query for review data
// =============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService, type ReviewFilters } from '../services/reviews';
import type { CreateReviewRequest } from '@cannasaas/types';

export function useProductReviews(productId: string, filters?: ReviewFilters) {
  return useQuery({
    queryKey: ['reviews', productId, filters],
    queryFn: () => reviewsService.getProductReviews(productId, filters),
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, review }: { productId: string; review: CreateReviewRequest }) =>
      reviewsService.createReview(productId, review),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
    },
  });
}

export function useVoteReview() {
  return useMutation({
    mutationFn: ({ reviewId, helpful }: { reviewId: string; helpful: boolean }) =>
      reviewsService.voteHelpful(reviewId, helpful),
  });
}
EOF

# --- useAnalytics.ts ---
echo "→ Creating hooks/useAnalytics.ts..."
cat > "$HOOKS_DIR/useAnalytics.ts" << 'EOF'
// =============================================================
// Analytics Hooks — TanStack Query for dashboard data
// =============================================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics';
import type { AnalyticsFilters, ProductAnalyticsFilters } from '@cannasaas/types';

export function useAnalyticsOverview(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'overview', filters],
    queryFn: () => analyticsService.getOverview(filters),
  });
}

export function useProductAnalytics(filters: ProductAnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'products', filters],
    queryFn: () => analyticsService.getProductAnalytics(filters),
  });
}

export function useCustomerAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'customers', filters],
    queryFn: () => analyticsService.getCustomerAnalytics(filters),
  });
}

export function useExportCsv() {
  return useMutation({
    mutationFn: ({
      reportType,
      filters,
    }: {
      reportType: 'orders' | 'products' | 'customers' | 'revenue';
      filters: AnalyticsFilters;
    }) => analyticsService.exportCsv(reportType, filters),
    onSuccess: (blob, variables) => {
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${variables.reportType}-report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
EOF

# =============================================================
# Barrel Export (index.ts)
# =============================================================
echo "→ Creating index.ts barrel export..."
cat > "$SRC_DIR/index.ts" << 'EOF'
// =============================================================
// @cannasaas/api-client — Barrel Export
// =============================================================

// Layer 1: Axios Client
export { apiClient } from './client';

// Layer 2: Services
export { authService } from './services/auth';
export { productsService } from './services/products';
export { ordersService } from './services/orders';
export { cartService } from './services/cart';
export { usersService } from './services/users';
export { reviewsService } from './services/reviews';
export { analyticsService } from './services/analytics';
export { complianceService } from './services/compliance';
export { deliveryService } from './services/delivery';
export { couponsService } from './services/coupons';
export { organizationsService } from './services/organizations';

// Layer 2: Service types
export type { ProductDetailResponse } from './services/products';
export type { CreateOrderRequest, CreateOrderResponse, OrderTrackingResponse, CancelOrderRequest } from './services/orders';
export type { CouponResponse } from './services/cart';
export type { LoyaltyDetailResponse, RedeemPointsResponse } from './services/users';
export type { ReviewsResponse, ReviewFilters } from './services/reviews';

// Layer 3: Auth Hooks
export { useLogin, useRegister, useLogout, useForgotPassword, useResetPassword } from './hooks/useAuth';

// Layer 3: Data Hooks
export { useProducts, useInfiniteProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from './hooks/useProducts';
export { useOrders, useOrder, useOrderTracking, useCreateOrder, useCancelOrder, useUpdateOrderStatus, useAssignDriver } from './hooks/useOrders';
export { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useApplyCoupon, useClearCart } from './hooks/useCart';
export { useCurrentUser, useUpdateUser, useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress, useLoyalty, useRedeemPoints, useUsers, useUser } from './hooks/useUsers';
export { useProductReviews, useCreateReview, useVoteReview } from './hooks/useReviews';
export { useAnalyticsOverview, useProductAnalytics, useCustomerAnalytics, useExportCsv } from './hooks/useAnalytics';
EOF

# =============================================================
# Done
# =============================================================
echo ""
echo "========================================="
echo "  ✅ API Client package generated!"
echo "========================================="
echo ""
echo "  Files created:"
find "$SRC_DIR" -name '*.ts' | sort | sed 's/^/    /'
echo ""
SERVICES_COUNT=$(find "$SERVICES_DIR" -name '*.ts' | wc -l | tr -d ' ')
HOOKS_COUNT=$(find "$HOOKS_DIR" -name '*.ts' | wc -l | tr -d ' ')
echo "  Summary:"
echo "    1 Axios client (with auth interceptors + token refresh queue)"
echo "    $SERVICES_COUNT service files (Layer 2 — async functions)"
echo "    $HOOKS_COUNT hook files (Layer 3 — TanStack Query)"
echo "    1 barrel export (index.ts)"
echo ""
echo "  Verify: cd packages/api-client && pnpm exec tsc --noEmit -p ./tsconfig.json"
