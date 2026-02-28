#!/usr/bin/env zsh
# =============================================================================
# CannaSaas — Part 4: Shared Packages Deep Implementation
# Scaffold Script  |  Version 3.0  |  February 2026
# =============================================================================
#
# COVERS SECTIONS 4.1 – 4.5
#   4.1  packages/types        — all TypeScript contracts (exact doc content)
#   4.2  packages/stores       — authStore, cartStore, organizationStore
#   4.3  packages/api-client   — Axios client + useProducts hook
#   4.4  packages/ui           — Button, ProductCard, PotencyBar, Badge,
#                                StrainTypeBadge, EffectsChips, FullPageLoader
#   4.5  packages/utils        — formatting.ts, validation.ts (exact doc content)
#
# RELATIONSHIP TO PART 3
#   Part 3 created skeleton/stub versions of most files below.
#   Part 4 writes the AUTHORITATIVE implementations from the design doc.
#   All Part 4 writes are forced (overwrite stubs); use the --skip-existing
#   flag if you have already started editing any of these files manually.
#
# USAGE
#   zsh scaffold-cannasaas-part4.zsh [ROOT_DIR] [--skip-existing]
#
#   ROOT_DIR        path containing cannasaas-platform/   (default: pwd)
#   --skip-existing skip files that already exist (same as Part 3 behaviour)
#
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
autoload -U colors && colors
info()    { print -P "%F{cyan}  ▸%f  $*" }
ok()      { print -P "%F{green}  ✔%f  $*" }
skip()    { print -P "%F{yellow}  ↷%f  $* (skipped — already exists)" }
warn()    { print -P "%F{yellow}  ⚠%f  $*" }
section() { print -P "\n%F{magenta}%B── $* ──%b%f" }
err()     { print -P "%F{red}  ✘%f  $*" >&2; exit 1 }

# ── Argument parsing ─────────────────────────────────────────────────────────
SKIP_EXISTING=false
BASE=""

for arg in "$@"; do
  case "$arg" in
    --skip-existing) SKIP_EXISTING=true ;;
    *)               BASE="$arg" ;;
  esac
done

BASE="${BASE:-$(pwd)}"
ROOT="${BASE}/cannasaas-platform"

[[ -d "${ROOT}" ]] || err "cannasaas-platform directory not found at ${ROOT}\nRun Part 3 scaffold first."

print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  CannaSaas · Part 4 — Shared Packages        ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f\n"
info "Target root: ${ROOT}"
[[ "${SKIP_EXISTING}" == "true" ]] && warn "Skip-existing mode ON — stub files will NOT be overwritten"

# ── File writer ───────────────────────────────────────────────────────────────
# By default (SKIP_EXISTING=false) always writes — replacing Part 3 stubs.
# With --skip-existing behaves like Part 3 (idempotent).
write_file() {
  local target="$1"
  if [[ "${SKIP_EXISTING}" == "true" && -f "$target" ]]; then
    skip "$target"
    cat > /dev/null   # drain stdin
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  cat > "$target"
  ok "Wrote $target"
}

mkd() {
  if [[ -d "$1" ]]; then
    : # silent — directory already exists
  else
    mkdir -p "$1"
    ok "(dir) $1"
  fi
}

# =============================================================================
# SECTION 4.1 — packages/types  (The Contract Layer)
# =============================================================================
section "4.1 · packages/types — Contract Layer"

# ── Product.ts ───────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/types/src/models/Product.ts" <<'HEREDOC'
/** Cannabis-specific strain classifications */
export type StrainType =
  | 'indica'
  | 'sativa'
  | 'hybrid'
  | 'indica_dominant_hybrid'
  | 'sativa_dominant_hybrid'
  | 'cbd_dominant';

/** Terpene profile entry */
export interface Terpene {
  name: string;       // e.g., "Myrcene"
  percentage: number; // 0-100
}

/** Cannabis-specific product metadata */
export interface CannabisInfo {
  strainType: StrainType;
  thcContent: number;  // percentage, e.g., 24.5
  cbdContent: number;
  terpenes: Terpene[];
  effects: string[];   // e.g., ["relaxing", "euphoric"]
  flavors: string[];
  growMethod?: 'indoor' | 'outdoor' | 'greenhouse';
  originState?: string;
}

/** A product variant (size/weight option with its own SKU and price) */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;            // e.g., "1/8 oz", "1g", "500mg"
  sku: string;
  weight?: number;
  weightUnit?: 'g' | 'oz' | 'mg' | 'ml';
  price: number;
  compareAtPrice?: number; // Original price for sale display
  quantity: number;        // Current stock level
  lowStockThreshold: number;
  isActive: boolean;
  metrcPackageId?: string; // Metrc seed-to-sale tracking ID
}

/** Product image with alt text for accessibility */
export interface ProductImage {
  id: string;
  url: string;
  altText: string; // Required — WCAG 1.1.1 non-text content
  isPrimary: boolean;
  sortOrder: number;
}

/** Full product model */
export interface Product {
  id: string;
  dispensaryId: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: ProductCategory;
  cannabisInfo: CannabisInfo;
  variants: ProductVariant[];
  images: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  purchaseLimit?: number; // Per-order limit
  ageRestricted: boolean; // Always true for cannabis
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'flower'
  | 'pre_roll'
  | 'vape'
  | 'concentrate'
  | 'edible'
  | 'tincture'
  | 'topical'
  | 'capsule'
  | 'accessory';
HEREDOC

# ── Order.ts ─────────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/types/src/models/Order.ts" <<'HEREDOC'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  weightUnit: string;
  batchNumber?: string;
  thcContent?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable: CS-2026-001234
  dispensaryId: string;
  customerId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  deliveryAddress?: Address;
  pickupReadyAt?: string;
  estimatedDeliveryAt?: string;
  driverId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}
HEREDOC

# ── User.ts ──────────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/types/src/models/User.ts" <<'HEREDOC'
export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'budtender'
  | 'driver'
  | 'customer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  dispensaryIds: string[]; // Dispensaries this user can access
  isAgeVerified: boolean;
  ageVerifiedAt?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  iat: number;
  exp: number;
}
HEREDOC

# ── Compliance.ts ─────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/types/src/models/Compliance.ts" <<'HEREDOC'
export type ComplianceEventType =
  | 'sale'
  | 'return'
  | 'inventory_adjustment'
  | 'inventory_received'
  | 'inventory_destroyed'
  | 'id_verification'
  | 'purchase_limit_check';

export interface PurchaseLimitResult {
  allowed: boolean;
  violations: string[];
  remaining: {
    flowerOz: number;
    concentrateG: number;
    edibleMg: number;
  };
  windowHours: number;
  state: 'NY' | 'NJ' | 'CT';
}

export interface ComplianceLog {
  id: string;
  dispensaryId: string;
  eventType: ComplianceEventType;
  details: Record<string, unknown>;
  performedBy?: string;
  createdAt: string;
}
HEREDOC

# ── api.ts ────────────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/types/src/api.ts" <<'HEREDOC'
/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Structured error from the API */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

/** Tenant context resolved from subdomain or login */
export interface TenantContext {
  organizationId: string;
  organizationName: string;
  companyId?: string;
  dispensaryId?: string;
  dispensaryName?: string;
  brandingConfig?: BrandingConfig;
  subdomain: string;
}

export interface BrandingConfig {
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headingFont?: string;
  bodyFont?: string;
  customDomain?: string;
}
HEREDOC

# ── types/src/index.ts  (barrel — update to include Address re-export) ────────
write_file "${ROOT}/packages/types/src/index.ts" <<'HEREDOC'
// ── Shared TypeScript contracts ───────────────────────────────────────────────
// Re-export all types from this barrel file.
// Apps and packages import from '@cannasaas/types', never from deep paths.

export * from './models/Product';
export * from './models/Order';
export * from './models/User';
export * from './models/Compliance';
export * from './models/Cart';
export * from './models/Analytics';
export * from './models/Delivery';
export * from './api';
HEREDOC

# Ensure Cart, Analytics, Delivery placeholders exist if Part 3 didn't create them
for model in Cart Analytics Delivery; do
  target="${ROOT}/packages/types/src/models/${model}.ts"
  if [[ ! -f "$target" ]]; then
    write_file "$target" <<EOF
// ${model} types — to be completed in subsequent parts
export {};
EOF
  fi
done

# =============================================================================
# SECTION 4.2 — packages/stores  (Zustand State Architecture)
# =============================================================================
section "4.2 · packages/stores — Zustand State Architecture"

# ── authStore.ts ──────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/stores/src/authStore.ts" <<'HEREDOC'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@cannasaas/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken) => {
        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      },

      updateUser: (updates) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        });
      },

      clearAuth: () => {
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },
    })),
    {
      name: 'cannasaas-auth',
      // sessionStorage clears on browser close — appropriate for shared POS devices
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Convenience selector hooks — prevents re-renders when unrelated state changes
export const useCurrentUser     = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAccessToken     = () => useAuthStore((s) => s.accessToken);
HEREDOC

# ── cartStore.ts ──────────────────────────────────────────────────────────────
write_file "${ROOT}/packages/stores/src/cartStore.ts" <<'HEREDOC'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, ProductVariant } from '@cannasaas/types';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  isSyncing: boolean;

  // Derived values (computed)
  itemCount: () => number;
  subtotal: () => number;

  // Actions
  addItem: (product: Product, variant: ProductVariant, qty: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  clearCart: () => void;
  setSyncing: (syncing: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      isSyncing: false,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.variant.price * item.quantity,
          0,
        ),

      addItem: (product, variant, qty) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variant.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            state.items.push({
              id: `local-${Date.now()}`,
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              variantName: variant.name,
              quantity: qty,
              unitPrice: variant.price,
              totalPrice: variant.price * qty,
              weight: variant.weight ?? 0,
              weightUnit: variant.weightUnit ?? 'g',
              product,
              variant,
            });
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          state.items = state.items.filter((i) => i.id !== itemId);
        });
      },

      updateQuantity: (itemId, qty) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (item) {
            if (qty <= 0) {
              state.items = state.items.filter((i) => i.id !== itemId);
            } else {
              item.quantity = qty;
              item.totalPrice = item.unitPrice * qty;
            }
          }
        });
      },

      applyPromo: (code, discount) => {
        set((state) => {
          state.promoCode = code;
          state.promoDiscount = discount;
        });
      },

      removePromo: () => {
        set((state) => {
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      clearCart: () => {
        set((state) => {
          state.items = [];
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      setSyncing: (syncing) => {
        set((state) => {
          state.isSyncing = syncing;
        });
      },
    })),
    {
      name: 'cannasaas-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
HEREDOC

# ── organizationStore.ts ──────────────────────────────────────────────────────
write_file "${ROOT}/packages/stores/src/organizationStore.ts" <<'HEREDOC'
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TenantContext, BrandingConfig } from '@cannasaas/types';

interface OrganizationState {
  tenant: TenantContext | null;
  isResolving: boolean;
  setTenant: (tenant: TenantContext) => void;
  updateBranding: (branding: BrandingConfig) => void;
  clearTenant: () => void;
  setResolving: (resolving: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  immer((set) => ({
    tenant: null,
    isResolving: true,

    setTenant: (tenant) => {
      set((state) => {
        state.tenant = tenant;
      });
    },

    updateBranding: (branding) => {
      set((state) => {
        if (state.tenant) {
          state.tenant.brandingConfig = branding;
        }
      });
    },

    clearTenant: () => {
      set((state) => {
        state.tenant = null;
      });
    },

    setResolving: (resolving) => {
      set((state) => {
        state.isResolving = resolving;
      });
    },
  })),
);

export const useCurrentTenant  = () => useOrganizationStore((s) => s.tenant);
export const useTenantBranding = () =>
  useOrganizationStore((s) => s.tenant?.brandingConfig);
HEREDOC

# =============================================================================
# SECTION 4.3 — packages/api-client  (Axios + TanStack Query)
# =============================================================================
section "4.3 · packages/api-client — Axios + TanStack Query"

# ── client.ts — Axios instance with auth interceptor ─────────────────────────
write_file "${ROOT}/packages/api-client/src/client.ts" <<'HEREDOC'
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1',
    timeout: 15000,
    withCredentials: true, // Sends httpOnly cookie for refresh token
  });

  // Request interceptor — attach auth + tenant headers
  client.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    const { tenant } = useOrganizationStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenant?.organizationId) {
      config.headers['X-Organization-Id'] = tenant.organizationId;
    }
    if (tenant?.dispensaryId) {
      config.headers['X-Dispensary-Id'] = tenant.dispensaryId;
    }

    return config;
  });

  // Response interceptor — transparent token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue this request until the refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(client(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Refresh token is in httpOnly cookie; send empty body
          const { data } = await client.post<{ accessToken: string }>(
            '/auth/refresh',
          );
          const { accessToken } = data;
          useAuthStore
            .getState()
            .setAuth(useAuthStore.getState().user!, accessToken);
          processQueue(null, accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          // Redirect to login
          window.location.href = '/auth/login?session=expired';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
HEREDOC

# ── hooks/useProducts.ts — full TanStack Query implementation ─────────────────
mkd "${ROOT}/packages/api-client/src/hooks"
write_file "${ROOT}/packages/api-client/src/hooks/useProducts.ts" <<'HEREDOC'
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Product, PaginatedResponse } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────
// Centralized key management prevents stale data and makes
// invalidation surgical and predictable.
export const productKeys = {
  all:      ['products'] as const,
  lists:    () => [...productKeys.all,    'list']          as const,
  list:     (filters: ProductFilters) =>
              [...productKeys.lists(),    filters]         as const,
  details:  () => [...productKeys.all,    'detail']        as const,
  detail:   (id: string) =>
              [...productKeys.details(),  id]              as const,
  featured: () => [...productKeys.all,    'featured']      as const,
  lowStock: () => [...productKeys.all,    'low-stock']     as const,
};

export interface ProductFilters {
  category?:    string;
  strainType?:  string;
  minThc?:      number;
  maxThc?:      number;
  minPrice?:    number;
  maxPrice?:    number;
  sort?:        'price_asc' | 'price_desc' | 'thc_desc' | 'newest';
  page?:        number;
  limit?:       number;
  search?:      string;
  dispensaryId?: string;
}

// ── List Products ─────────────────────────────────────────────────────────────
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: filters },
      );
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes — aligns with Redis TTL
    placeholderData: (previousData) => previousData, // Keeps previous results while refetching
  });
}

// ── Infinite Scroll Variant ───────────────────────────────────────────────────
export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: { ...filters, page: pageParam, limit: 20 } },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Single Product ────────────────────────────────────────────────────────────
export function useProduct(
  id: string,
  options?: Partial<UseQueryOptions<Product>>,
) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product }>(
        `/products/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// ── Create Product Mutation ───────────────────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await apiClient.post<{ data: Product }>(
        '/products',
        payload,
      );
      return data.data;
    },
    onSuccess: (newProduct) => {
      // Invalidate all product lists so they refetch with the new item
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Pre-populate the detail cache to avoid a network request on navigation
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
  });
}

// ── Update Product Mutation with Optimistic Update ────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Product> & { id: string }) => {
      const { data } = await apiClient.put<{ data: Product }>(
        `/products/${id}`,
        payload,
      );
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel any outgoing refetches for this product
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot the current value for rollback
      const previous = queryClient.getQueryData<Product>(
        productKeys.detail(id),
      );

      // Optimistically update the cache
      queryClient.setQueryData<Product>(productKeys.detail(id), (old) =>
        old ? { ...old, ...updates } : old,
      );

      return { previous, id };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous && context.id) {
        queryClient.setQueryData(
          productKeys.detail(context.id),
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

// ── Low Stock Alert ───────────────────────────────────────────────────────────
export function useLowStockProducts() {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product[] }>(
        '/products/low-stock',
      );
      return data.data;
    },
    staleTime: 1000 * 60 * 2,      // 2 minutes — stock changes frequently
    refetchInterval: 1000 * 60 * 5, // Poll every 5 minutes
  });
}
HEREDOC

# ── Ensure other hook stubs exist for imports (written in Part 5+) ────────────
for hook in useAuth useOrders useCart useAnalytics useCompliance useSearch useWebSocketEvent; do
  target="${ROOT}/packages/api-client/src/hooks/${hook}.ts"
  if [[ ! -f "$target" ]]; then
    write_file "$target" <<EOF
// ${hook} — full implementation in subsequent parts
// Referenced by packages/api-client/src/index.ts
export {};
EOF
  fi
done

# ── Update api-client index.ts to export the real hooks ──────────────────────
write_file "${ROOT}/packages/api-client/src/index.ts" <<'HEREDOC'
// ── API Client — Public Surface ───────────────────────────────────────────────
// All apps import from '@cannasaas/api-client'.
// Never import from deep paths inside this package.

export { apiClient, createApiClient } from './client';

// ── Product hooks (Part 4) ────────────────────────────────────────────────────
export {
  productKeys,
  useProducts,
  useInfiniteProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useLowStockProducts,
  type ProductFilters,
} from './hooks/useProducts';

// ── Remaining hooks (Parts 5–7, stubs below until implemented) ────────────────
// export { useLogin, useRegister, useLogout } from './hooks/useAuth';
// export { useOrders, useOrder, useUpdateOrderStatus } from './hooks/useOrders';
// export { useCart, useAddToCart } from './hooks/useCart';
// export { useAnalyticsDashboard } from './hooks/useAnalytics';
// export { useComplianceLogs, usePurchaseLimitCheck } from './hooks/useCompliance';
// export { useSearchSuggestions, useSearchProducts } from './hooks/useSearch';
// export { useWebSocketEvent } from './hooks/useWebSocketEvent';

// ── WebSocket manager ─────────────────────────────────────────────────────────
export { wsManager } from './services/WebSocketManager';
HEREDOC

# =============================================================================
# SECTION 4.4 — packages/ui  (WCAG-First Component Library)
# =============================================================================
section "4.4 · packages/ui — WCAG-First Component Library"

mkd "${ROOT}/packages/ui/src/components/Button"
mkd "${ROOT}/packages/ui/src/components/ProductCard"
mkd "${ROOT}/packages/ui/src/components/Badge"
mkd "${ROOT}/packages/ui/src/components/FullPageLoader"

# ── Button/Button.tsx ─────────────────────────────────────────────────────────
write_file "${ROOT}/packages/ui/src/components/Button/Button.tsx" <<'HEREDOC'
// packages/ui/src/components/Button/Button.tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@cannasaas/utils';
import { Loader2 } from 'lucide-react';

// CVA variant definition — all style decisions live here
const buttonVariants = cva(
  // Base styles applied to every variant
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold leading-none tracking-wide',
    'rounded-[var(--p-radius-md)]',
    'transition-all duration-[var(--p-dur-fast)] ease-[var(--p-ease)]',
    'focus-visible:outline-none focus-visible:ring-3',
    'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none whitespace-nowrap',
    // WCAG 2.4.3 Focus Order — ensure tab order is visible
    '[&:focus-visible]:outline [&:focus-visible]:outline-3',
    '[&:focus-visible]:outline-offset-2',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
          'hover:bg-[var(--color-brand-hover)]',
          'active:scale-[0.98]',
          // Minimum 4.5:1 contrast ratio enforced via brand token system
        ],
        secondary: [
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text)]',
          'border border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]',
        ],
        outline: [
          'border-2 border-[var(--color-brand)] text-[var(--color-brand)]',
          'bg-transparent',
          'hover:bg-[var(--color-brand-subtle)]',
        ],
        ghost: [
          'bg-transparent text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]',
        ],
        destructive: [
          'bg-[var(--color-error)] text-white',
          'hover:opacity-90 active:opacity-100',
        ],
        link: [
          'bg-transparent text-[var(--color-brand)]',
          'underline-offset-4 hover:underline',
          'h-auto p-0',
        ],
      },
      size: {
        sm:    'h-8  px-3 text-[var(--p-text-sm)]',
        md:    'h-10 px-4 text-[var(--p-text-base)]',
        lg:    'h-12 px-6 text-[var(--p-text-lg)]',
        // WCAG 2.5.5 Target Size: minimum 44×44 px on touch devices
        touch: 'min-h-[44px] min-w-[44px] px-4 text-[var(--p-text-base)]',
        icon:  'h-10 w-10 p-0',
      },
      fullWidth: {
        true:  'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant:   'primary',
      size:      'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?:   boolean;
  loadingText?: string; // Announced to screen readers during loading
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
}

/**
 * Button — Primary action component
 *
 * WCAG compliance:
 * - 2.1.1  Keyboard: focusable, activatable via Space/Enter
 * - 2.4.7  Focus Visible: high-contrast focus ring
 * - 4.1.2  Name, Role, Value: uses native <button> semantics
 * - 1.4.3  Contrast: brand token enforces 4.5:1 minimum
 * - 2.5.5  Target Size: `size="touch"` provides 44px minimum
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        // WCAG 4.1.2: communicate loading state to assistive technology
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            {/* Screen reader hears the loading text, sighted users see the spinner */}
            <span aria-live="polite">{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
HEREDOC

# ── Badge/Badge.tsx ───────────────────────────────────────────────────────────
# Referenced by ProductCard but not fully defined in Part 4 of the doc.
# Providing a complete implementation consistent with the design system.
write_file "${ROOT}/packages/ui/src/components/Badge/Badge.tsx" <<'HEREDOC'
// packages/ui/src/components/Badge/Badge.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@cannasaas/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-semibold leading-none',
    'rounded-[var(--p-radius-full)]',
    'border',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
          'border-[var(--color-border)]',
        ],
        brand: [
          'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
          'border-transparent',
        ],
        success: [
          'bg-[var(--color-success-bg,#dcfce7)] text-[var(--color-success-text,#14532d)]',
          'border-transparent',
        ],
        warning: [
          'bg-[var(--color-warning-bg,#fef9c3)] text-[var(--color-warning-text,#78350f)]',
          'border-transparent',
        ],
        destructive: [
          'bg-[var(--color-error-bg,#fee2e2)] text-[var(--color-error-text,#7f1d1d)]',
          'border-transparent',
        ],
        outline: [
          'bg-transparent text-[var(--color-text)]',
          'border-[var(--color-border-strong)]',
        ],
      },
      size: {
        sm: 'px-2   py-0.5 text-[0.625rem]', // 10px
        md: 'px-2.5 py-1   text-[var(--p-text-xs)]',
        lg: 'px-3   py-1.5 text-[var(--p-text-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';
HEREDOC

# ── ProductCard/StrainTypeBadge.tsx ───────────────────────────────────────────
write_file "${ROOT}/packages/ui/src/components/ProductCard/StrainTypeBadge.tsx" <<'HEREDOC'
// packages/ui/src/components/ProductCard/StrainTypeBadge.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
import type { StrainType } from '@cannasaas/types';

// WCAG 1.4.1 — color is not the only visual means of conveying information.
// Each strain type uses both a distinct colour AND a text label.
const STRAIN_CONFIG: Record<
  StrainType,
  { label: string; className: string }
> = {
  indica: {
    label: 'Indica',
    className: 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300',
  },
  sativa: {
    label: 'Sativa',
    className: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-300',
  },
  hybrid: {
    label: 'Hybrid',
    className: 'bg-green-100 text-green-900 dark:bg-green-950/50 dark:text-green-300',
  },
  indica_dominant_hybrid: {
    label: 'Indica Dom.',
    className: 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
  },
  sativa_dominant_hybrid: {
    label: 'Sativa Dom.',
    className: 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300',
  },
  cbd_dominant: {
    label: 'CBD',
    className: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300',
  },
};

interface StrainTypeBadgeProps {
  strainType: StrainType;
  size?: 'sm' | 'md';
  className?: string;
}

export const StrainTypeBadge: React.FC<StrainTypeBadgeProps> = ({
  strainType,
  size = 'md',
  className,
}) => {
  const config = STRAIN_CONFIG[strainType];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-[var(--p-radius-full)]',
        size === 'sm' ? 'px-2 py-0.5 text-[0.625rem]' : 'px-2.5 py-1 text-[var(--p-text-xs)]',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
};
HEREDOC

# ── ProductCard/EffectsChips.tsx ──────────────────────────────────────────────
write_file "${ROOT}/packages/ui/src/components/ProductCard/EffectsChips.tsx" <<'HEREDOC'
// packages/ui/src/components/ProductCard/EffectsChips.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';

interface EffectsChipsProps {
  effects: string[];
  maxVisible?: number;
  className?: string;
}

export const EffectsChips: React.FC<EffectsChipsProps> = ({
  effects,
  maxVisible = 3,
  className,
}) => {
  const visible = effects.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap gap-1', className)}
      aria-label={`Effects: ${visible.join(', ')}`}
    >
      {visible.map((effect) => (
        <span
          key={effect}
          className={[
            'inline-flex items-center px-2 py-0.5',
            'rounded-[var(--p-radius-full)]',
            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
            'text-[0.625rem] font-medium capitalize',
            'border border-[var(--color-border)]',
          ].join(' ')}
          aria-hidden="true" // Parent div has the full aria-label
        >
          {effect}
        </span>
      ))}
    </div>
  );
};
HEREDOC

# ── ProductCard/PotencyBar.tsx ────────────────────────────────────────────────
write_file "${ROOT}/packages/ui/src/components/ProductCard/PotencyBar.tsx" <<'HEREDOC'
// packages/ui/src/components/ProductCard/PotencyBar.tsx
// Renders a visual THC/CBD potency bar with accessible text fallback
import React from 'react';
import { cn } from '@cannasaas/utils';
import { formatThc } from '@cannasaas/utils';

interface PotencyBarProps {
  thc: number;  // 0–35+
  cbd: number;
  className?: string;
}

export const PotencyBar: React.FC<PotencyBarProps> = ({
  thc,
  cbd,
  className,
}) => {
  // Normalize percentage display against a 35% ceiling
  const thcPct = Math.min((thc / 35) * 100, 100);
  const cbdPct = Math.min((cbd / 35) * 100, 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* THC bar */}
      <div className="flex items-center gap-2">
        <span
          className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
          aria-hidden="true"
        >
          THC
        </span>
        <div
          className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
          role="meter"
          aria-valuenow={thc}
          aria-valuemin={0}
          aria-valuemax={35}
          aria-label={`THC content: ${formatThc(thc)}`}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-500"
            style={{ width: `${thcPct}%` }}
          />
        </div>
        <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
          {formatThc(thc)}
        </span>
      </div>

      {/* CBD bar — only shown when CBD > 0 */}
      {cbd > 0 && (
        <div className="flex items-center gap-2">
          <span
            className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
            aria-hidden="true"
          >
            CBD
          </span>
          <div
            className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
            role="meter"
            aria-valuenow={cbd}
            aria-valuemin={0}
            aria-valuemax={35}
            aria-label={`CBD content: ${formatThc(cbd)}`}
          >
            <div
              className="h-full rounded-full bg-[var(--color-info,#2563eb)] transition-all duration-500"
              style={{ width: `${cbdPct}%` }}
            />
          </div>
          <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
            {formatThc(cbd)}
          </span>
        </div>
      )}
    </div>
  );
};
HEREDOC

# ── ProductCard/ProductCard.tsx — the main card ───────────────────────────────
write_file "${ROOT}/packages/ui/src/components/ProductCard/ProductCard.tsx" <<'HEREDOC'
// packages/ui/src/components/ProductCard/ProductCard.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Leaf } from 'lucide-react';
import { cn } from '@cannasaas/utils';
import { formatCurrency, formatThc } from '@cannasaas/utils';
import type { Product, ProductVariant } from '@cannasaas/types';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { StrainTypeBadge } from './StrainTypeBadge';
import { EffectsChips } from './EffectsChips';
import { PotencyBar } from './PotencyBar';

// ── Sub-component: Product Image with lazy loading ────────────────────────────
interface ProductImageProps {
  product: Product;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ product, className }) => {
  const [imgError, setImgError] = useState(false);
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  if (!primaryImage || imgError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-secondary)]',
          className,
        )}
        // WCAG 1.1.1: when no image, the div itself communicates the absence
        aria-label={`No image available for ${product.name}`}
        role="img"
      >
        <Leaf className="w-12 h-12 opacity-30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={primaryImage.url}
      // WCAG 1.1.1: meaningful alt text from the product data
      alt={primaryImage.altText || `${product.name} product image`}
      className={cn('object-cover w-full h-full', className)}
      loading="lazy"   // Native lazy loading for performance
      decoding="async"
      onError={() => setImgError(true)}
    />
  );
};

// ── Sub-component: Pricing with sale state ────────────────────────────────────
interface ProductPricingProps {
  variant: ProductVariant;
  className?: string;
}

const ProductPricing: React.FC<ProductPricingProps> = ({
  variant,
  className,
}) => {
  const isOnSale =
    variant.compareAtPrice !== undefined &&
    variant.compareAtPrice > variant.price;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className="text-[var(--p-text-xl)] font-bold text-[var(--color-text)]"
        // WCAG 1.3.3: use semantic text, not just color, for sale indication
        aria-label={
          isOnSale
            ? `Sale price: ${formatCurrency(variant.price)}, was ${formatCurrency(variant.compareAtPrice!)}`
            : formatCurrency(variant.price)
        }
      >
        {formatCurrency(variant.price)}
      </span>
      {isOnSale && (
        <span
          className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] line-through"
          aria-hidden="true" // Hidden from AT; aria-label on parent covers it
        >
          {formatCurrency(variant.compareAtPrice!)}
        </span>
      )}
    </div>
  );
};

// ── Sub-component: Stock indicator ───────────────────────────────────────────
const StockIndicator: React.FC<{ variant: ProductVariant }> = ({ variant }) => {
  if (variant.quantity === 0) {
    return (
      <Badge variant="destructive" size="sm" aria-label="Out of stock">
        Out of Stock
      </Badge>
    );
  }
  if (variant.quantity <= variant.lowStockThreshold) {
    return (
      <Badge
        variant="warning"
        size="sm"
        aria-label={`Low stock: ${variant.quantity} remaining`}
      >
        Only {variant.quantity} left
      </Badge>
    );
  }
  return null;
};

// ── Main: ProductCard ─────────────────────────────────────────────────────────
export interface ProductCardProps {
  product: Product;
  /** Show compact version without effects/potency bar */
  compact?: boolean;
  /** External handler for add-to-cart (triggers optimistic update + API call) */
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
  className?: string;
}

/**
 * ProductCard — Cannabis product display card
 *
 * WCAG:
 * - 1.1.1  Alt text on all images
 * - 1.3.1  Information not conveyed by color alone
 * - 1.4.3  Color contrast via token system
 * - 2.1.1  Fully keyboard navigable
 * - 2.4.4  Link purpose is clear from context
 * - 4.1.2  Proper button semantics for add-to-cart
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  onAddToCart,
  className,
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const selectedVariant = product.variants[selectedVariantIndex];
  const isOutOfStock = selectedVariant?.quantity === 0;

  const handleAddToCart = () => {
    if (selectedVariant && onAddToCart) {
      onAddToCart(product, selectedVariant);
    }
  };

  // WCAG 4.1.2: card is not itself a link; the product name and
  // "View Details" are the interactive elements. This avoids nested
  // interactive elements inside a link, which violates the HTML spec.
  return (
    <article
      className={cn(
        'relative flex flex-col',
        'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[var(--p-shadow-sm)]',
        'overflow-hidden',
        'transition-all duration-[var(--p-dur-normal)]',
        'hover:shadow-[var(--p-shadow-md)] hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]',
        className,
      )}
      aria-label={`${product.name}, ${formatCurrency(selectedVariant?.price ?? 0)}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-bg-tertiary)]">
        <ProductImage
          product={product}
          className="transition-transform duration-300 hover:scale-105"
        />

        {/* Strain type badge — overlaid on image */}
        <div className="absolute top-2 left-2">
          <StrainTypeBadge strainType={product.cannabisInfo.strainType} />
        </div>

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="brand" size="sm">
              Featured
            </Badge>
          </div>
        )}

        {/* Quick view button — visible on hover/focus */}
        <Link
          to={`/products/${product.slug}`}
          className={[
            'absolute inset-0 flex items-end justify-center pb-4',
            'opacity-0 focus:opacity-100',
            'group-hover:opacity-100',
            'transition-opacity duration-[var(--p-dur-fast)]',
          ].join(' ')}
          aria-label={`View details for ${product.name}`}
        >
          <span
            className={[
              'flex items-center gap-2 px-4 py-2',
              'bg-[var(--color-bg)]/90 backdrop-blur-sm',
              'rounded-full text-[var(--p-text-sm)] font-semibold',
              'shadow-[var(--p-shadow-md)]',
            ].join(' ')}
          >
            <Eye size={14} aria-hidden="true" />
            View Details
          </span>
        </Link>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Brand + name */}
        {product.brand && (
          <span className="text-[var(--p-text-xs)] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
            {product.brand}
          </span>
        )}

        <h3 className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] leading-snug line-clamp-2">
          <Link
            to={`/products/${product.slug}`}
            className="hover:text-[var(--color-brand)] focus:text-[var(--color-brand)] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* THC/CBD potency bar */}
        {!compact && (
          <PotencyBar
            thc={product.cannabisInfo.thcContent}
            cbd={product.cannabisInfo.cbdContent}
          />
        )}

        {/* Effects chips */}
        {!compact && product.cannabisInfo.effects.length > 0 && (
          <EffectsChips effects={product.cannabisInfo.effects.slice(0, 3)} />
        )}

        {/* Variant selector (if multiple variants exist) */}
        {product.variants.length > 1 && (
          <div
            role="group"
            aria-label="Select size"
            className="flex flex-wrap gap-1.5"
          >
            {product.variants.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantIndex(i)}
                aria-pressed={i === selectedVariantIndex}
                aria-label={`${variant.name} — ${formatCurrency(variant.price)}`}
                className={cn(
                  'px-2.5 py-1 rounded-[var(--p-radius-sm)]',
                  'text-[var(--p-text-xs)] font-semibold border',
                  'transition-all duration-[var(--p-dur-fast)]',
                  i === selectedVariantIndex
                    ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)] border-[var(--color-brand)]'
                    : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price + stock */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {selectedVariant && <ProductPricing variant={selectedVariant} />}
          {selectedVariant && <StockIndicator variant={selectedVariant} />}
        </div>

        {/* Add to cart */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleAddToCart}
          disabled={isOutOfStock || !onAddToCart}
          leftIcon={<ShoppingCart size={16} aria-hidden="true" />}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
};
HEREDOC

# ── FullPageLoader/FullPageLoader.tsx ─────────────────────────────────────────
# Referenced in Section 5 (TenantProvider, ProtectedRoute) — needed now.
write_file "${ROOT}/packages/ui/src/components/FullPageLoader/FullPageLoader.tsx" <<'HEREDOC'
// packages/ui/src/components/FullPageLoader/FullPageLoader.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
}

/**
 * FullPageLoader — Full-viewport loading state
 *
 * WCAG:
 * - 4.1.3  Status message announced via role="status" (live region)
 * - 1.4.3  Sufficient contrast on background
 */
export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Loading...',
}) => (
  <div
    className={[
      'fixed inset-0 flex flex-col items-center justify-center gap-4',
      'bg-[var(--color-bg)] z-50',
    ].join(' ')}
    // WCAG 4.1.3: announce status to screen readers without moving focus
    role="status"
    aria-live="polite"
    aria-label={message}
  >
    <Loader2
      className="animate-spin text-[var(--color-brand)]"
      size={40}
      aria-hidden="true"
    />
    <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] font-medium">
      {message}
    </p>
  </div>
);
HEREDOC

# ── Update packages/ui/src/index.ts to export all Part 4 components ───────────
write_file "${ROOT}/packages/ui/src/index.ts" <<'HEREDOC'
// ── CannaSaas UI — Public Component Surface ───────────────────────────────────
// All apps import UI components from '@cannasaas/ui'.
// Never import from deep paths inside this package.

// ── Part 4 implementations ────────────────────────────────────────────────────
export { Button,       type ButtonProps }      from './components/Button/Button';
export { Badge,        type BadgeProps }        from './components/Badge/Badge';
export { ProductCard,  type ProductCardProps }  from './components/ProductCard/ProductCard';
export { PotencyBar }                          from './components/ProductCard/PotencyBar';
export { StrainTypeBadge }                     from './components/ProductCard/StrainTypeBadge';
export { EffectsChips }                        from './components/ProductCard/EffectsChips';
export { FullPageLoader }                      from './components/FullPageLoader/FullPageLoader';

// ── Parts 5+ (stubs — uncomment as implemented) ───────────────────────────────
// export { Input }       from './components/Input/Input';
// export { Select }      from './components/Select/Select';
// export { Modal }       from './components/Modal/Modal';
// export { Toast }       from './components/Toast/Toast';
// export { DataTable }   from './components/DataTable/DataTable';
// export { ThemeProvider } from './providers/ThemeProvider';
HEREDOC

# =============================================================================
# SECTION 4.5 — packages/utils  (Formatters, Validators, Helpers)
# =============================================================================
section "4.5 · packages/utils — Formatters, Validators, Helpers"

# ── formatting.ts — exact content from the document ──────────────────────────
write_file "${ROOT}/packages/utils/src/formatting.ts" <<'HEREDOC'
// packages/utils/src/formatting.ts

/** Format a number as USD currency */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/** Format THC/CBD percentage */
export function formatThc(value: number): string {
  if (value === 0) return '0%';
  if (value < 1) return `${(value * 100).toFixed(0)}mg/g`;
  return `${value.toFixed(1)}%`;
}

/** Format cannabis weight */
export function formatWeight(grams: number): string {
  if (grams < 1)    return `${(grams * 1000).toFixed(0)}mg`;
  if (grams === 1)  return '1g';
  if (grams === 3.5) return '1/8 oz';
  if (grams === 7)  return '1/4 oz';
  if (grams === 14) return '1/2 oz';
  if (grams === 28) return '1 oz';
  return `${grams}g`;
}

/** Pluralize a word based on count */
export function pluralize(
  count: number,
  word: string,
  plural?: string,
): string {
  return count === 1 ? word : (plural ?? `${word}s`);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
HEREDOC

# ── validation.ts — exact content from the document ──────────────────────────
write_file "${ROOT}/packages/utils/src/validation.ts" <<'HEREDOC'
// packages/utils/src/validation.ts
import { z } from 'zod';

/** Password must be 8+ chars, with upper, lower, number, and special char */
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters required')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/\d/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address');

export const usPhoneSchema = z
  .string()
  .regex(
    /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    'Please enter a valid US phone number',
  );

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName:       z.string().min(1, 'First name is required'),
    lastName:        z.string().min(1, 'Last name is required'),
    email:           emailSchema,
    password:        passwordSchema,
    confirmPassword: z.string(),
    acceptTerms:     z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues    = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
HEREDOC

# ── Update utils/src/index.ts to match Part 4 exports ────────────────────────
write_file "${ROOT}/packages/utils/src/index.ts" <<'HEREDOC'
// ── CannaSaas Utils — Public Surface ─────────────────────────────────────────
export { cn } from './cn';

// ── Part 4 implementations ────────────────────────────────────────────────────
export {
  formatCurrency,
  formatThc,
  formatWeight,
  pluralize,
  truncate,
} from './formatting';

export {
  passwordSchema,
  emailSchema,
  usPhoneSchema,
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './validation';

// ── Parts from Part 3 (keep as-is if written, else stubs follow) ──────────────
export { useDebounce }                 from './useDebounce';
export { formatDate, formatRelativeTime } from './date';
export { calculateTax, NY_CANNABIS_TAX_RATE } from './currency';
HEREDOC

# Ensure cn.ts, useDebounce.ts, date.ts, currency.ts exist (written in Part 3)
# If Part 3 wasn't run first, create minimal stubs so the index doesn't break.
for util_file in cn useDebounce date currency; do
  target="${ROOT}/packages/utils/src/${util_file}.ts"
  if [[ ! -f "$target" ]]; then
    write_file "$target" <<EOF
// ${util_file} — created as stub; see Part 3 script for full implementation
export {};
EOF
  fi
done

# =============================================================================
# SUMMARY
# =============================================================================
print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  Part 4 complete!                             ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f"
print ""
print -P "  %F{cyan}Files written (or updated from Part 3 stubs):%f"
print ""
print -P "  %F{white}packages/types%f"
print -P "    src/models/Product.ts   Order.ts   User.ts   Compliance.ts"
print -P "    src/api.ts   src/index.ts"
print ""
print -P "  %F{white}packages/stores%f"
print -P "    src/authStore.ts   cartStore.ts   organizationStore.ts"
print ""
print -P "  %F{white}packages/api-client%f"
print -P "    src/client.ts"
print -P "    src/hooks/useProducts.ts  (full impl with optimistic updates)"
print -P "    src/index.ts  (updated exports)"
print ""
print -P "  %F{white}packages/ui%f"
print -P "    src/components/Button/Button.tsx"
print -P "    src/components/Badge/Badge.tsx"
print -P "    src/components/ProductCard/ProductCard.tsx"
print -P "    src/components/ProductCard/PotencyBar.tsx"
print -P "    src/components/ProductCard/StrainTypeBadge.tsx"
print -P "    src/components/ProductCard/EffectsChips.tsx"
print -P "    src/components/FullPageLoader/FullPageLoader.tsx"
print -P "    src/index.ts  (updated exports)"
print ""
print -P "  %F{white}packages/utils%f"
print -P "    src/formatting.ts   src/validation.ts   src/index.ts"
print ""
print -P "  %F{yellow}Next step:%f  run Part 5 scaffold → Authentication & Multi-Tenant Wiring"
print ""
