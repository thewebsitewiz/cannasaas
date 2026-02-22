#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase F: API Integration Layer (Part 1)
# File: scaffold-api-phase-f-part1.sh
#
# Supplements scaffold-api-client.sh with:
#
#   packages/api-client/src/
#   ├── lib/
#   │   └── queryClient.ts     Official Phase F QueryClient configuration
#   ├── axiosClient.ts         Upgraded Axios instance: refresh-token interceptor,
#   │                          tenant header injection, error normalisation
#   └── hooks/
#       ├── useUsers.ts        Staff user CRUD + invite + role management
#       ├── useCompliance.ts   Audit logs, purchase-limit check, daily reports
#       └── useDispensaries.ts Dispensary detail, update, nearby + branding
#
# Run AFTER scaffold-api-client.sh.
#
# Usage:
#   chmod +x scaffold-api-phase-f-part1.sh
#   ./scaffold-api-phase-f-part1.sh [MONOREPO_ROOT]
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
CLIENT_SRC="$ROOT/packages/api-client/src"
HOOKS_DIR="$CLIENT_SRC/hooks"
LIB_DIR="$CLIENT_SRC/lib"

echo ""
echo "========================================================"
echo "  Phase F — API Integration Layer (Part 1)"
echo "========================================================"
echo "  Target: $ROOT/packages/api-client/src"

mkdir -p "$HOOKS_DIR" "$LIB_DIR"

# =============================================================================
# packages/api-client/src/lib/queryClient.ts
# =============================================================================
cat > "$LIB_DIR/queryClient.ts" << 'TSEOF'
/**
 * @file queryClient.ts
 * @package @cannasaas/api-client
 *
 * Centralised TanStack Query (v5) QueryClient factory — Phase F specification.
 *
 * This module exports a singleton `queryClient` that is provided to all three
 * React applications (storefront, admin, staff) at their respective root
 * <QueryClientProvider> wrappers.
 *
 * ── Default Option Rationale ────────────────────────────────────────────────
 *
 * queries.staleTime: 5 min
 *   Most cannabis product listings and user-facing data do not change within a
 *   typical browsing session. 5 minutes balances freshness with reducing
 *   redundant network requests on tab switches or focus events.
 *
 * queries.gcTime: 30 min   (formerly "cacheTime" in v4)
 *   Unused cache entries are kept in memory for 30 minutes so that navigation
 *   between pages feels instant — a user browsing Products → Cart → Products
 *   gets the cached result without a spinner. 30 min is conservative enough
 *   not to exhaust browser memory.
 *
 * queries.retry: 1
 *   Retry once on network failure before surfacing an error. Cannabis
 *   dispensary staff (Order Queue, Inventory Search) need errors surfaced
 *   quickly — retrying more than once masks real problems and introduces lag.
 *
 * queries.refetchOnWindowFocus: false
 *   The staff portal is typically open on a tablet for an entire shift. Constant
 *   refetches on window-focus events would interfere with one-click order
 *   advancement and cause mid-action data refreshes. Pages that need live data
 *   use the WebSocket approach (useOrderQueue) rather than polling.
 *
 * mutations.retry: 0
 *   Mutations (create/update/delete) must never retry automatically — a failed
 *   PUT /orders/:id/status retrying silently could double-advance order state
 *   or cause duplicate Metrc compliance reports. All mutation error handling
 *   is done explicitly in the calling component.
 *
 * ── Override Pattern ────────────────────────────────────────────────────────
 *
 * Per-hook overrides are always passed as the second argument to useQuery():
 *
 *   useQuery({
 *     queryKey: cartKeys.cart(),
 *     queryFn:  fetchCart,
 *     staleTime: 30_000,           // override to 30s for cart
 *     refetchOnWindowFocus: true,  // always fresh for cart
 *   });
 *
 * ── Optimistic Updates Pattern ──────────────────────────────────────────────
 *
 * For mutations that should reflect instantly in the UI (cart, order status),
 * follow the four-step TanStack Query optimistic pattern:
 *
 *   onMutate: async (variables) => {
 *     // 1. Cancel in-flight queries so they don't overwrite our optimistic state
 *     await queryClient.cancelQueries({ queryKey: someKey });
 *
 *     // 2. Snapshot previous state for rollback
 *     const snapshot = queryClient.getQueryData(someKey);
 *
 *     // 3. Apply optimistic update directly to the cache
 *     queryClient.setQueryData(someKey, (old) => deriveOptimisticState(old, variables));
 *
 *     // 4. Return snapshot so onError can roll back
 *     return { snapshot };
 *   },
 *
 *   onError: (_err, _vars, context) => {
 *     // Roll back to the snapshot if the mutation fails
 *     queryClient.setQueryData(someKey, context?.snapshot);
 *   },
 *
 *   onSettled: () => {
 *     // Always refetch after mutation settles (success OR error)
 *     // so the cache reflects the true server state
 *     queryClient.invalidateQueries({ queryKey: someKey });
 *   },
 *
 * The `useAddToCart` hook in useCart.ts demonstrates this pattern in full.
 * The `useAdvanceOrderStatus` hook in useOrders.ts demonstrates it for
 * mutations where the optimistic state is a simple field change.
 *
 * ── DevTools ────────────────────────────────────────────────────────────────
 *
 * To enable React Query DevTools, add <ReactQueryDevtools /> inside
 * <QueryClientProvider> in development builds:
 *
 *   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
 *   // inside render:
 *   {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Data is considered fresh for 5 minutes.
       * Within this window, identical queryKey requests return the cached
       * result without a background refetch.
       */
      staleTime: 5 * 60 * 1000,       // 5 minutes

      /**
       * Unused cache entries are garbage-collected after 30 minutes.
       * An entry is "unused" when all subscribers have unmounted.
       */
      gcTime: 30 * 60 * 1000,         // 30 minutes

      /**
       * Retry once on transient network failure before surfacing an error.
       * Staff-facing pages need errors surfaced quickly; more retries mask them.
       */
      retry: 1,

      /**
       * Do not refetch automatically when the browser window regains focus.
       * Staff tablets stay open all day — focus-based refetches cause
       * mid-action data refreshes. Use explicit invalidation instead.
       */
      refetchOnWindowFocus: false,
    },
    mutations: {
      /**
       * Never auto-retry mutations. A double-advanced order or duplicate
       * Metrc compliance report would be a serious business problem.
       * Handle mutation errors explicitly in each mutation's onError callback.
       */
      retry: 0,
    },
  },
});
TSEOF
echo "  ✓ lib/queryClient.ts"

# =============================================================================
# packages/api-client/src/axiosClient.ts
# =============================================================================
cat > "$CLIENT_SRC/axiosClient.ts" << 'TSEOF'
/**
 * @file axiosClient.ts
 * @package @cannasaas/api-client
 *
 * Upgraded Axios instance for the CannaSaas API — Phase F complete implementation.
 *
 * Replaces the simpler client.ts with:
 *   1. Token injection interceptor   — attaches Bearer JWT to every request
 *   2. Tenant context interceptor    — injects X-Organization-Id + X-Dispensary-Id
 *   3. Refresh-token interceptor     — transparent 401 recovery without logout
 *   4. Error normalisation           — converts Axios errors to typed ApiError objects
 *
 * ── Request Flow ────────────────────────────────────────────────────────────
 *
 *   Outgoing request
 *     → (req interceptor 1) attach Authorization: Bearer <accessToken>
 *     → (req interceptor 2) attach X-Organization-Id, X-Dispensary-Id
 *     → API server
 *     ← 200 → pass through
 *     ← 401 → (res interceptor) call POST /auth/refresh once, retry original request
 *     ← other error → normalise to ApiError and reject
 *
 * ── Refresh Token Strategy ──────────────────────────────────────────────────
 *
 * A single `isRefreshing` flag prevents multiple simultaneous refresh requests
 * (e.g. if 3 requests expire at the same time). Subsequent 401s while a refresh
 * is in flight are queued in `failedQueue` and resolved / rejected once the
 * new token arrives.
 *
 * If the refresh itself fails (token expired, network error, 401 from /auth/refresh),
 * all queued requests are rejected and the auth store clears state + redirects to /login.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   // Prefer importing via @cannasaas/api-client hooks, but if you need
 *   // the raw client:
 *   import { apiClient } from '@cannasaas/api-client';
 *   const { data } = await apiClient.get('/health');
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

// Stores contain auth tokens and org/dispensary context
// These are lazy-imported to avoid circular deps at module init time
let _getAuthState: (() => { accessToken: string | null; refreshToken: string | null }) | null = null;
let _setTokens:    ((access: string, refresh: string) => void) | null = null;
let _clearAuth:    (() => void) | null = null;
let _getTenantCtx: (() => { organizationId: string | null; dispensaryId: string | null }) | null = null;

/**
 * Wire the Axios client to the Zustand auth and org stores.
 * Call this once from each app's main.tsx BEFORE mounting the React tree.
 *
 * @example
 *   // in main.tsx
 *   import { wireAuthToAxios } from '@cannasaas/api-client';
 *   import { useAuthStore, useOrganizationStore } from '@cannasaas/stores';
 *
 *   wireAuthToAxios({
 *     getAuthState:  () => ({ accessToken: useAuthStore.getState().accessToken, refreshToken: useAuthStore.getState().refreshToken }),
 *     setTokens:     (a, r) => useAuthStore.getState().setTokens(a, r),
 *     clearAuth:     () => useAuthStore.getState().logout(),
 *     getTenantCtx:  () => ({ organizationId: useOrganizationStore.getState().organizationId, dispensaryId: useOrganizationStore.getState().dispensaryId }),
 *   });
 */
export function wireAuthToAxios(opts: {
  getAuthState:  () => { accessToken: string | null; refreshToken: string | null };
  setTokens:     (access: string, refresh: string) => void;
  clearAuth:     () => void;
  getTenantCtx:  () => { organizationId: string | null; dispensaryId: string | null };
}) {
  _getAuthState = opts.getAuthState;
  _setTokens    = opts.setTokens;
  _clearAuth    = opts.clearAuth;
  _getTenantCtx = opts.getTenantCtx;
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.cannasaas.com/v1',
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Refresh token queue ───────────────────────────────────────────────────────

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let isRefreshing = false;
let failedQueue:  QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token!)));
  failedQueue = [];
}

// ── Request interceptors ──────────────────────────────────────────────────────

/**
 * Interceptor 1 — Attach Authorization header with current access token.
 * Does nothing if the request already has an Authorization header (e.g.
 * the refresh request itself uses the refresh token directly).
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.headers['Authorization']) return config;
  const state = _getAuthState?.();
  if (state?.accessToken) {
    config.headers['Authorization'] = `Bearer ${state.accessToken}`;
  }
  return config;
});

/**
 * Interceptor 2 — Inject multi-tenancy context headers.
 * Every API endpoint scoped to a dispensary requires these.
 * They are read from the Zustand organisation store at request time so that
 * switching dispensaries in the admin portal is reflected immediately.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const ctx = _getTenantCtx?.();
  if (ctx?.organizationId) {
    config.headers['X-Organization-Id'] = ctx.organizationId;
  }
  if (ctx?.dispensaryId) {
    config.headers['X-Dispensary-Id'] = ctx.dispensaryId;
  }
  return config;
});

// ── Response interceptors ─────────────────────────────────────────────────────

/**
 * Interceptor — Transparent JWT refresh on 401.
 *
 * When any request returns 401:
 *   1. If a refresh is already in flight, queue this request and wait.
 *   2. Otherwise, start a refresh request with the stored refresh token.
 *   3. On refresh success: update stored tokens, retry all queued requests,
 *      then retry the original request with the new access token.
 *   4. On refresh failure: clear auth state (forces re-login) and reject all
 *      queued requests.
 *
 * The `_retry` flag on the original config prevents infinite retry loops —
 * if the retried request also returns 401 (e.g. because the new token is
 * immediately rejected), we clear auth and don't retry again.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normaliseError(error));
    }

    if (isRefreshing) {
      // Queue this request — it will be retried once the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing    = true;

    const { refreshToken } = _getAuthState?.() ?? { refreshToken: null };

    if (!refreshToken) {
      isRefreshing = false;
      _clearAuth?.();
      return Promise.reject(normaliseError(error));
    }

    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      _setTokens?.(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${data.accessToken}`,
      };
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      _clearAuth?.();
      return Promise.reject(normaliseError(refreshError as AxiosError));
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Error normalisation ───────────────────────────────────────────────────────

/**
 * Converts an Axios error into the typed ApiError shape defined in
 * @cannasaas/types so that all hooks receive consistent error objects.
 *
 * CannaSaas error body:
 *   { error: { code: string, message: string, details?: [...] } }
 */
export interface NormalisedApiError {
  code:     string;
  message:  string;
  status:   number;
  details?: { field: string; message: string }[];
}

function normaliseError(error: AxiosError | unknown): NormalisedApiError {
  if (!axios.isAxiosError(error)) {
    return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.', status: 0 };
  }

  const status = error.response?.status ?? 0;
  const body   = (error.response?.data as any)?.error;

  return {
    code:    body?.code    ?? 'API_ERROR',
    message: body?.message ?? error.message ?? 'Request failed',
    status,
    details: body?.details,
  };
}
TSEOF
echo "  ✓ axiosClient.ts"

# =============================================================================
# packages/api-client/src/hooks/useUsers.ts
# =============================================================================
cat > "$HOOKS_DIR/useUsers.ts" << 'TSEOF'
/**
 * @file useUsers.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for user and staff management (Admin API).
 *
 * All hooks require Admin+ or Manager+ authorization.
 *
 * Hooks:
 *   useUsers(filters)       — GET /users?role=...&isActive=...
 *   useStaffUsers()         — GET /users?role[]=admin,manager,budtender,driver
 *   useUser(id)             — GET /users/:id
 *   useInviteUser()         — POST /users  { email, roles }
 *   useUpdateUser()         — PUT  ive /users/:id  (general update)
 *   useUpdateUserRole()     — PUT  /users/:id/roles  { role }
 *   useToggleUserActive()   — PUT  /users/:id  { isActive }
 *   useDeactivateUser()     — DELETE /users/:id  (soft delete / deactivate)
 *
 * Query Keys (stable factory pattern):
 *   userKeys.all                 → ['users']
 *   userKeys.lists()             → ['users', 'list']
 *   userKeys.list(filters)       → ['users', 'list', { ...filters }]
 *   userKeys.detail(id)          → ['users', 'detail', id]
 *
 * Invalidation strategy:
 *   Mutations that change user state (invite, role change, toggle active)
 *   invalidate `userKeys.lists()` so the staff table re-fetches.
 *   They do NOT invalidate detail queries to avoid unnecessary re-fetches on
 *   list views where detail panels are not open.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type { User, ApiResponse, ApiListResponse, ApiError } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const userKeys = {
  all:          ['users']                        as const,
  lists:        () => [...userKeys.all, 'list']  as const,
  list:  (f: object) => [...userKeys.lists(), f] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

// ── Filter type for user list queries ────────────────────────────────────────

export interface UserListFilters {
  /** Filter by one or more role names */
  role?:     string | string[];
  /** Filter by active/inactive status */
  isActive?: boolean;
  /** Cursor-based pagination */
  page?:     number;
  limit?:    number;
  /** Free-text search (name or email) */
  search?:   string;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /users — paginated user list with optional role + active filters.
 *
 * @example
 *   const { data } = useUsers({ role: 'customer', isActive: true, limit: 20 });
 */
export function useUsers(filters: UserListFilters = {}) {
  return useQuery<ApiListResponse<User>, ApiError>({
    queryKey: userKeys.list(filters),
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.search)   params.set('search',   filters.search);
      if (filters.isActive != null) params.set('isActive', String(filters.isActive));
      if (filters.page)     params.set('page',   String(filters.page));
      if (filters.limit)    params.set('limit',  String(filters.limit));
      // role may be a single string or array
      if (filters.role) {
        const roles = Array.isArray(filters.role) ? filters.role : [filters.role];
        roles.forEach((r) => params.append('role', r));
      }
      const { data } = await apiClient.get<ApiListResponse<User>>(`${ENDPOINTS.users.list}?${params}`);
      return data;
    },
    staleTime: 60_000, // 1 minute — staff list changes infrequently
  });
}

/**
 * GET /users — filtered to staff roles only (admin, manager, budtender, driver).
 *
 * Convenience wrapper used by SettingsStaff.tsx to avoid passing roles every time.
 */
export function useStaffUsers() {
  return useUsers({ role: ['admin', 'manager', 'budtender', 'driver'] });
}

/**
 * GET /users/:id — single user detail.
 *
 * Enabled only when `id` is a non-empty string. Caller can pass '' and the
 * query stays disabled until an id is selected.
 */
export function useUser(id: string) {
  return useQuery<User, ApiError>({
    queryKey: userKeys.detail(id),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.detail(id));
      return data.data;
    },
    enabled: !!id,
  });
}

/**
 * POST /users — invite a new staff member.
 *
 * The API sends an invitation email to the provided address.
 * On success, the user is created in the database with a pending status.
 *
 * @example
 *   const { mutate: inviteUser } = useInviteUser();
 *   inviteUser({ email: 'budtender@example.com', roles: ['budtender'] });
 */
export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { email: string; roles: string[]; firstName?: string; lastName?: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<User>>(ENDPOINTS.users.create, body);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate the staff list so the new invitation appears
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * PUT /users/:id — general user profile update.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { userId: string } & Partial<User>>({
    mutationFn: async ({ userId, ...body }) => {
      const { data } = await apiClient.put<ApiResponse<User>>(ENDPOINTS.users.update(userId), body);
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * PUT /users/:id/roles — change a staff member's role.
 *
 * Roles are sent as an array because a user can theoretically hold multiple.
 * For the staff settings UI, role changes replace the existing roles entirely.
 *
 * @example
 *   const { mutate: updateRole } = useUpdateUserRole();
 *   updateRole({ userId: 'abc', role: 'manager' });
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { userId: string; role: string }>({
    mutationFn: async ({ userId, role }) => {
      const { data } = await apiClient.post<ApiResponse<User>>(
        ENDPOINTS.users.assignRoles(userId),
        { roles: [role] },
      );
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * PUT /users/:id { isActive } — activate or deactivate a staff account.
 *
 * Deactivated accounts cannot log in but their history is preserved.
 *
 * @example
 *   const { mutate: toggleActive } = useToggleUserActive();
 *   toggleActive({ userId: 'abc', isActive: false });
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { userId: string; isActive: boolean }>({
    mutationFn: async ({ userId, isActive }) => {
      const { data } = await apiClient.put<ApiResponse<User>>(
        ENDPOINTS.users.update(userId),
        { isActive },
      );
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * DELETE /users/:id — soft-delete (deactivate) a user account.
 *
 * This is a hard deactivation; data is retained for compliance.
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (userId) => {
      await apiClient.delete(ENDPOINTS.users.delete(userId));
    },
    onSuccess: (_v, userId) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
TSEOF
echo "  ✓ hooks/useUsers.ts"

# =============================================================================
# packages/api-client/src/hooks/useCompliance.ts
# =============================================================================
cat > "$HOOKS_DIR/useCompliance.ts" << 'TSEOF'
/**
 * @file useCompliance.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for the Compliance API.
 *
 * Compliance is a critical domain — every hook here has conservative staleTime
 * settings to ensure staff always see accurate data (no stale limits served
 * to a budtender who just processed a large purchase).
 *
 * Hooks:
 *   useComplianceLogs(filters)         — GET /compliance/logs
 *   useCustomerPurchaseLimit(customerId) — GET /compliance/purchase-limit?customerId=
 *   useGenerateDailyReport()           — POST /compliance/reports/daily
 *   useComplianceSalesAnalytics(range) — GET /compliance/analytics/sales
 *   useComplianceTopProducts(range)    — GET /compliance/analytics/top-products
 *   useComplianceRevenue(range)        — GET /compliance/analytics/revenue
 *
 * ── Purchase Limit staleTime ────────────────────────────────────────────────
 *
 * The purchase limit endpoint is called on CustomerLookup and QuickActions
 * pages. It must reflect the customer's most recent purchase, so staleTime
 * is set to 0 — i.e., always re-fetch when the component mounts or when
 * the customerId changes.
 *
 * In practice this is a lightweight query (single row from the DB) so the
 * performance impact is negligible compared to the regulatory risk of
 * serving a cached limit.
 *
 * ── Log staleTime ────────────────────────────────────────────────────────────
 *
 * Audit logs are append-only. A 2-minute staleTime is appropriate — the logs
 * view is for managers reviewing past events, not real-time monitoring.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type {
  ComplianceLog, DailySalesReport, PurchaseLimitResult,
  ApiResponse, ApiListResponse, ApiError,
} from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const complianceKeys = {
  all:   ['compliance']                                      as const,
  logs:  (f?: object) => [...complianceKeys.all, 'logs',  f] as const,
  limit: (id: string) => [...complianceKeys.all, 'limit', id] as const,
  sales: (range: string) => [...complianceKeys.all, 'sales', range] as const,
  topProducts: (range: string) => [...complianceKeys.all, 'top-products', range] as const,
  revenue:     (range: string) => [...complianceKeys.all, 'revenue', range] as const,
};

// ── Filter type ───────────────────────────────────────────────────────────────

export interface ComplianceLogFilters {
  eventType?: string;
  dateFrom?:  string;
  dateTo?:    string;
  page?:      number;
  limit?:     number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /compliance/logs — paginated audit log entries.
 *
 * Supports filtering by event type (sale, id_verification, inventory_adjustment)
 * and date range. Required: Manager+ role.
 *
 * @example
 *   const { data } = useComplianceLogs({ eventType: 'sale', limit: 50 });
 */
export function useComplianceLogs(filters: ComplianceLogFilters = {}) {
  return useQuery<ApiListResponse<ComplianceLog>, ApiError>({
    queryKey: complianceKeys.logs(filters),
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.eventType) params.set('eventType', filters.eventType);
      if (filters.dateFrom)  params.set('dateFrom',  filters.dateFrom);
      if (filters.dateTo)    params.set('dateTo',    filters.dateTo);
      if (filters.page)      params.set('page',  String(filters.page));
      if (filters.limit)     params.set('limit', String(filters.limit));
      const { data } = await apiClient.get<ApiListResponse<ComplianceLog>>(
        `${ENDPOINTS.compliance.logs}?${params}`,
      );
      return data;
    },
    staleTime: 2 * 60_000, // 2 minutes — append-only, doesn't need to be fresh
  });
}

/**
 * GET /compliance/purchase-limit?customerId=:id
 *
 * Returns the customer's remaining daily purchase limit for the current
 * dispensary and state. This is the most compliance-critical query in the
 * system — it must never serve stale data.
 *
 * staleTime: 0 — always re-fetch on mount.
 *
 * @example
 *   const { data: limits } = useCustomerPurchaseLimit(customer.id);
 *   // data.remaining.flowerOz, data.remaining.concentrateG
 */
export function useCustomerPurchaseLimit(customerId: string, opts?: { enabled?: boolean }) {
  return useQuery<PurchaseLimitResult, ApiError>({
    queryKey: complianceKeys.limit(customerId),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiResponse<PurchaseLimitResult>>(
        `${ENDPOINTS.compliance.purchaseLimit}?customerId=${customerId}`,
      );
      return data.data;
    },
    enabled:   (opts?.enabled ?? true) && !!customerId,
    staleTime: 0,          // Always fresh — no caching for purchase limits
    gcTime:    30_000,     // Remove from cache after 30s of non-use
  });
}

/**
 * POST /compliance/reports/daily — trigger on-demand daily sales report.
 *
 * Generates or regenerates the report for a specific date. The server
 * aggregates sales data and returns the report object.
 */
export function useGenerateDailyReport() {
  const queryClient = useQueryClient();
  return useMutation<DailySalesReport, ApiError, { date: string; dispensaryId?: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<DailySalesReport>>(
        ENDPOINTS.compliance.dailyReport,
        body,
      );
      return data.data;
    },
    onSuccess: () => {
      // Invalidate log queries so the new report's events appear
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
  });
}

/**
 * GET /compliance/analytics/sales?range=:range — sales analytics for compliance view.
 *
 * Distinct from the general /analytics/dashboard — this returns compliance-
 * specific metrics like limit violation counts and verification rates.
 */
export function useComplianceSalesAnalytics(range = '30d') {
  return useQuery({
    queryKey: complianceKeys.sales(range),
    queryFn:  async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.compliance.salesAnalytics}?range=${range}`);
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * GET /compliance/analytics/top-products?range=:range
 */
export function useComplianceTopProducts(range = '30d') {
  return useQuery({
    queryKey: complianceKeys.topProducts(range),
    queryFn:  async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.compliance.topProducts}?range=${range}`);
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * GET /compliance/analytics/revenue?range=:range
 */
export function useComplianceRevenue(range = '30d') {
  return useQuery({
    queryKey: complianceKeys.revenue(range),
    queryFn:  async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.compliance.revenue}?range=${range}`);
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
TSEOF
echo "  ✓ hooks/useCompliance.ts"

# =============================================================================
# packages/api-client/src/hooks/useDispensaries.ts
# =============================================================================
cat > "$HOOKS_DIR/useDispensaries.ts" << 'TSEOF'
/**
 * @file useDispensaries.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for the Dispensaries API.
 *
 * Hooks:
 *   useDispensaries(filters)   — GET /dispensaries  (list, filtered by org)
 *   useDispensary(id)          — GET /dispensaries/:id
 *   useNearbyDispensaries(geo) — GET /dispensaries/nearby?lat=...&lng=...&radius=
 *   useCreateDispensary()      — POST /dispensaries
 *   useUpdateDispensary(id)    — PUT  /dispensaries/:id
 *   useDeleteDispensary()      — DELETE /dispensaries/:id
 *
 * Branding:
 *   useUpdateBranding(id)      — PUT  /dispensaries/:id/branding
 *   (logo upload is handled separately via a direct POST with FormData
 *    because TanStack Query mutation is not optimal for multipart uploads —
 *    see SettingsBranding.tsx which calls the API directly)
 *
 * Query Keys:
 *   dispensaryKeys.all                  → ['dispensaries']
 *   dispensaryKeys.lists()              → ['dispensaries', 'list']
 *   dispensaryKeys.list(filters)        → ['dispensaries', 'list', { ...filters }]
 *   dispensaryKeys.detail(id)           → ['dispensaries', 'detail', id]
 *   dispensaryKeys.nearby(lat, lng, r)  → ['dispensaries', 'nearby', lat, lng, r]
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type { Dispensary, ApiResponse, ApiListResponse, ApiError } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const dispensaryKeys = {
  all:    ['dispensaries'] as const,
  lists:  () => [...dispensaryKeys.all, 'list'] as const,
  list:   (f?: object) => [...dispensaryKeys.lists(), f] as const,
  detail: (id: string)  => [...dispensaryKeys.all, 'detail', id] as const,
  nearby: (lat: number, lng: number, r: number) => [...dispensaryKeys.all, 'nearby', lat, lng, r] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /dispensaries — list dispensaries filtered by the current organisation context.
 * The tenant context headers (X-Organization-Id) handle filtering on the server.
 */
export function useDispensaries(filters?: { companyId?: string; isActive?: boolean }) {
  return useQuery<ApiListResponse<Dispensary>, ApiError>({
    queryKey: dispensaryKeys.list(filters),
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters?.companyId) params.set('companyId', filters.companyId);
      if (filters?.isActive != null) params.set('isActive', String(filters.isActive));
      const { data } = await apiClient.get<ApiListResponse<Dispensary>>(
        `${ENDPOINTS.dispensaries.list}?${params}`,
      );
      return data;
    },
    staleTime: 15 * 60_000, // Dispensary details change rarely — 15 min
  });
}

/**
 * GET /dispensaries/:id — single dispensary with all configuration.
 *
 * Used in the Settings page to load branding, hours, and license info.
 * Enabled only when `id` is non-empty.
 */
export function useDispensary(id: string) {
  return useQuery<Dispensary, ApiError>({
    queryKey: dispensaryKeys.detail(id),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiResponse<Dispensary>>(
        ENDPOINTS.dispensaries.detail(id),
      );
      return data.data;
    },
    enabled:   !!id,
    staleTime: 15 * 60_000,
  });
}

/**
 * GET /dispensaries/nearby — PostGIS-powered nearby dispensary search.
 *
 * Used in the public-facing storefront to show dispensaries within radius km.
 * Enabled only when valid coordinates are provided.
 *
 * @example
 *   const { data } = useNearbyDispensaries({ lat: 40.68, lng: -73.94, radius: 25 });
 */
export function useNearbyDispensaries(geo?: { lat: number; lng: number; radius: number }) {
  return useQuery({
    queryKey: geo ? dispensaryKeys.nearby(geo.lat, geo.lng, geo.radius) : ['dispensaries', 'nearby', null],
    queryFn:  async () => {
      const { data } = await apiClient.get(
        `${ENDPOINTS.dispensaries.nearby}?latitude=${geo!.lat}&longitude=${geo!.lng}&radius=${geo!.radius}`,
      );
      return data;
    },
    enabled:   !!geo,
    staleTime: 10 * 60_000,
  });
}

/**
 * POST /dispensaries — create a new dispensary under the current company.
 * Requires Company Admin role.
 */
export function useCreateDispensary() {
  const queryClient = useQueryClient();
  return useMutation<Dispensary, ApiError, Partial<Dispensary>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<Dispensary>>(
        ENDPOINTS.dispensaries.create,
        body,
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dispensaryKeys.lists() }),
  });
}

/**
 * PUT /dispensaries/:id — update dispensary profile, hours, settings.
 *
 * The Settings page form uses this. It receives the full dispensary object
 * including branding colours, font, and operating hours.
 *
 * On success: the detail cache is updated immediately with the returned value,
 * and the list query is invalidated to keep the sidebar/nav in sync.
 *
 * @example
 *   const { mutate: update } = useUpdateDispensary(dispensary.id);
 *   update({ name: 'Green Leaf Brooklyn Updated', primaryColor: '#2d7a4f' });
 */
export function useUpdateDispensary(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Dispensary, ApiError, Partial<Dispensary>>({
    mutationFn: async (body) => {
      const { data } = await apiClient.put<ApiResponse<Dispensary>>(
        ENDPOINTS.dispensaries.update(id),
        body,
      );
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(dispensaryKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: dispensaryKeys.lists() });
    },
  });
}

/**
 * PUT /dispensaries/:id/branding — update branding config (colours, font, etc).
 *
 * Separate from the full dispensary update so that branding changes can be
 * previewed and saved independently without touching hours or license fields.
 */
export function useUpdateBranding(dispensaryId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Dispensary,
    ApiError,
    { primaryColor?: string; secondaryColor?: string; accentColor?: string; fontFamily?: string; logoUrl?: string }
  >({
    mutationFn: async (body) => {
      const { data } = await apiClient.put<ApiResponse<Dispensary>>(
        ENDPOINTS.dispensaries.updateBranding(dispensaryId),
        body,
      );
      return data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(dispensaryKeys.detail(dispensaryId), updated);
    },
  });
}

/**
 * DELETE /dispensaries/:id — soft-delete a dispensary.
 * Requires Company Admin role.
 */
export function useDeleteDispensary() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      await apiClient.delete(ENDPOINTS.dispensaries.delete(id));
    },
    onSuccess: (_v, id) => {
      queryClient.removeQueries({ queryKey: dispensaryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dispensaryKeys.lists() });
    },
  });
}
TSEOF
echo "  ✓ hooks/useDispensaries.ts"

echo ""
echo "  ✅ Phase F Part 1 complete"
find "$LIB_DIR" "$CLIENT_SRC/axiosClient.ts" "$HOOKS_DIR/useUsers.ts" \
     "$HOOKS_DIR/useCompliance.ts" "$HOOKS_DIR/useDispensaries.ts" \
  -type f 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
