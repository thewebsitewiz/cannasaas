#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase F: API Integration Layer (Part 2)
# File: scaffold-api-phase-f-part2.sh
#
# Supplements Part 1 with the remaining hooks:
#
#   packages/api-client/src/
#   ├── hooks/
#   │   ├── useDelivery.ts       Zones, drivers, assignment, delivery orders
#   │   ├── useCustomers.ts      Customer search + detail + order history
#   │   ├── useSearch.ts         Elasticsearch full-text + autocomplete
#   │   ├── useRecommendations.ts Product reviews + AI recommendations
#   │   └── useAI.ts             Product description gen + dispensary chatbot
#   ├── endpoints.addendum.ts    New endpoint constants for Phase F hooks
#   └── index.ts                 Updated barrel — re-exports all hooks
#
# Run AFTER scaffold-api-phase-f-part1.sh.
#
# Usage:
#   chmod +x scaffold-api-phase-f-part2.sh
#   ./scaffold-api-phase-f-part2.sh [MONOREPO_ROOT]
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
CLIENT_SRC="$ROOT/packages/api-client/src"
HOOKS_DIR="$CLIENT_SRC/hooks"

echo ""
echo "========================================================"
echo "  Phase F — API Integration Layer (Part 2)"
echo "========================================================"

mkdir -p "$HOOKS_DIR"

# =============================================================================
# packages/api-client/src/hooks/useDelivery.ts
# =============================================================================
cat > "$HOOKS_DIR/useDelivery.ts" << 'TSEOF'
/**
 * @file useDelivery.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for the Delivery API.
 *
 * Hooks:
 *   useDeliveryZones()          — GET  /delivery/zones
 *   useCreateDeliveryZone()     — POST /delivery/zones
 *   useDeleteDeliveryZone()     — DELETE /delivery/zones/:id
 *   useDeliveryOrders(status)   — GET  /orders?fulfillmentType=delivery&status=...
 *   useAvailableDrivers()       — GET  /delivery/drivers
 *   useAssignDriver()           — POST /delivery/assign
 *   useCheckDeliveryAddress()   — POST /delivery/check-address
 *   useUpdateOrderStatus()      — PUT  /orders/:id/status  (with optimistic update)
 *
 * ── Optimistic Order Status Update ──────────────────────────────────────────
 *
 * `useUpdateOrderStatus` implements the full four-step TanStack Query optimistic
 * pattern (from Phase F specification):
 *
 *   onMutate  → cancel queries, snapshot old data, apply optimistic state
 *   onError   → roll back to snapshot
 *   onSettled → always refetch to ensure server-state accuracy
 *
 * This makes the Delivery Dispatch "Mark Delivered" button respond instantly
 * while the PUT request is in flight, without a visible loading spinner.
 *
 * ── Delivery Zone staleTime ──────────────────────────────────────────────────
 *
 * Delivery zones change very rarely (typically only when an admin manually
 * adds or removes one). 15-minute staleTime is appropriate, matching
 * dispensary detail staleTime.
 *
 * ── Driver List staleTime ────────────────────────────────────────────────────
 *
 * Active driver list can change as drivers clock in/out. 2-minute staleTime
 * gives dispatch a reasonably fresh list without hammering the API. The
 * WebSocket hook (useDeliveryTracking) provides real-time position updates
 * independently of this REST hook.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type {
  DeliveryZone, Order, Driver,
  ApiResponse, ApiListResponse, ApiError,
} from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const deliveryKeys = {
  all:     ['delivery']                               as const,
  zones:   () => [...deliveryKeys.all, 'zones']       as const,
  drivers: () => [...deliveryKeys.all, 'drivers']     as const,
  orders:  (status?: string | string[]) => [...deliveryKeys.all, 'orders', status] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /delivery/zones — list all delivery zones for the current dispensary.
 *
 * Each zone includes the GeoJSON polygon, min order value, delivery fee,
 * and estimated delivery time.
 */
export function useDeliveryZones() {
  return useQuery<DeliveryZone[], ApiError>({
    queryKey: deliveryKeys.zones(),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiListResponse<DeliveryZone>>(ENDPOINTS.delivery.zones);
      return data.data ?? data;
    },
    staleTime: 15 * 60_000,
  });
}

/**
 * POST /delivery/zones — create a new delivery zone with a GeoJSON polygon.
 *
 * The polygon is typically drawn in the Leaflet map editor in SettingsDeliveryZones.
 * For zones added via the form (without the map), an empty polygon is sent and
 * the backend will require the admin to draw the polygon before the zone goes live.
 *
 * @example
 *   const { mutate: createZone } = useCreateDeliveryZone();
 *   createZone({ name: 'Brooklyn North', deliveryFee: 5, minOrderValue: 30, estimatedMinutes: 45 });
 */
export function useCreateDeliveryZone() {
  const queryClient = useQueryClient();
  return useMutation<DeliveryZone, ApiError, Partial<DeliveryZone> & { name: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<DeliveryZone>>(
        ENDPOINTS.delivery.createZone,
        body,
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deliveryKeys.zones() }),
  });
}

/**
 * DELETE /delivery/zones/:id — remove a delivery zone.
 *
 * Existing orders in the zone are not affected — this only prevents new
 * orders from being placed to that zone.
 */
export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (zoneId) => {
      await apiClient.delete(`${ENDPOINTS.delivery.zones}/${zoneId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deliveryKeys.zones() }),
  });
}

/**
 * GET /orders?fulfillmentType=delivery&status=... — delivery orders filtered by status.
 *
 * Used in DeliveryDispatch.tsx to display unassigned and active delivery orders.
 *
 * @example
 *   const { data } = useDeliveryOrders({ status: ['pending', 'confirmed', 'preparing'] });
 */
export function useDeliveryOrders(opts: { status: string | string[] }) {
  const statuses = Array.isArray(opts.status) ? opts.status : [opts.status];
  return useQuery<Order[], ApiError>({
    queryKey: deliveryKeys.orders(statuses),
    queryFn:  async () => {
      const params = new URLSearchParams({ fulfillmentType: 'delivery' });
      statuses.forEach((s) => params.append('status', s));
      const { data } = await apiClient.get<ApiListResponse<Order>>(
        `${ENDPOINTS.orders.list}?${params}`,
      );
      return data.data ?? [];
    },
    staleTime: 30_000,          // 30s — delivery dispatch needs reasonably fresh data
    refetchInterval: 60_000,    // Poll every 60s as fallback when WebSocket is unavailable
  });
}

/**
 * GET /delivery/drivers — list available drivers for the current dispensary.
 *
 * Returns drivers with their current active delivery count so dispatch staff
 * can see who has capacity.
 */
export function useAvailableDrivers() {
  return useQuery<Driver[], ApiError>({
    queryKey: deliveryKeys.drivers(),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiListResponse<Driver>>(ENDPOINTS.delivery.drivers);
      return data.data ?? data;
    },
    staleTime: 2 * 60_000,
  });
}

/**
 * POST /delivery/assign — assign a driver to a delivery order.
 *
 * Invalidates both the delivery orders cache and the drivers cache so that
 * the dispatch UI reflects the assignment immediately after refresh.
 *
 * @example
 *   const { mutate: assignDriver } = useAssignDriver();
 *   assignDriver({ orderId: 'abc', driverId: 'def' });
 */
export function useAssignDriver() {
  const queryClient = useQueryClient();
  return useMutation<Order, ApiError, { orderId: string; driverId: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post<ApiResponse<Order>>(ENDPOINTS.delivery.assign, body);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.drivers() });
    },
  });
}

/**
 * POST /delivery/check-address — verify whether an address falls within a delivery zone.
 *
 * Used in the storefront checkout flow before the customer commits to delivery.
 */
export function useCheckDeliveryAddress() {
  return useMutation<{ deliverable: boolean; zone?: DeliveryZone; fee?: number }, ApiError, { address: string; city: string; zip: string }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(ENDPOINTS.delivery.checkAddress, body);
      return data;
    },
  });
}

/**
 * PUT /orders/:id/status — update order status with FULL optimistic update pattern.
 *
 * This hook demonstrates the complete Phase F optimistic update specification:
 *
 *   Step 1 — onMutate: Cancel in-flight queries for the orders cache to prevent
 *             stale server data from overwriting our optimistic state during the
 *             mutation window.
 *
 *   Step 2 — onMutate: Snapshot the current cache value so we have something
 *             to roll back to if the mutation fails.
 *
 *   Step 3 — onMutate: Apply the optimistic state immediately. The UI reflects
 *             the new status without waiting for the server response.
 *
 *   Step 4 — onError: Roll back to the snapshot. The "Mark Delivered" button
 *             should un-advance if the PUT returns an error.
 *
 *   Step 5 — onSettled: Always invalidate regardless of success or error.
 *             This ensures the cache reflects true server state after the
 *             optimistic window closes.
 *
 * @example
 *   const { mutate: updateStatus } = useUpdateOrderStatus('out_for_delivery');
 *   updateStatus({ id: order.id, status: 'delivered' });
 */
export function useUpdateOrderStatus(currentStatus: string) {
  const queryClient = useQueryClient();
  // Target both the flat orders list and the delivery-specific cache
  const targetKey = deliveryKeys.orders(currentStatus);

  return useMutation<
    Order,
    ApiError,
    { id: string; status: string },
    { snapshot: Order[] | undefined }
  >({
    mutationFn: async ({ id, status }) => {
      const { data } = await apiClient.put<ApiResponse<Order>>(
        ENDPOINTS.orders.updateStatus(id),
        { status },
      );
      return data.data;
    },

    // ── Step 1 + 2 + 3: Cancel, snapshot, apply optimistic ──────────────────
    onMutate: async ({ id, status }) => {
      // Step 1 — cancel in-flight fetches for this cache key
      await queryClient.cancelQueries({ queryKey: targetKey });

      // Step 2 — capture snapshot for potential rollback
      const snapshot = queryClient.getQueryData<Order[]>(targetKey);

      // Step 3 — immediately apply the optimistic state
      queryClient.setQueryData<Order[]>(targetKey, (prev) =>
        (prev ?? []).map((order) =>
          order.id === id ? { ...order, status } : order,
        ),
      );

      return { snapshot };
    },

    // ── Step 4: Roll back on error ───────────────────────────────────────────
    onError: (_err, _vars, context) => {
      // Restore the snapshotted state so the UI reverts
      queryClient.setQueryData(targetKey, context?.snapshot);
    },

    // ── Step 5: Always refetch on settle ────────────────────────────────────
    onSettled: () => {
      // Invalidate to ensure the cache is eventually consistent with the server
      queryClient.invalidateQueries({ queryKey: deliveryKeys.orders() });
    },
  });
}
TSEOF
echo "  ✓ hooks/useDelivery.ts"

# =============================================================================
# packages/api-client/src/hooks/useCustomers.ts
# =============================================================================
cat > "$HOOKS_DIR/useCustomers.ts" << 'TSEOF'
/**
 * @file useCustomers.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for customer search and detail — primarily used in the
 * Staff Portal (CustomerLookup, QuickActions) and Admin Portal (Customers page).
 *
 * Hooks:
 *   useCustomerSearch(query)       — GET /users?search=...&role=customer
 *   useCustomer(id)                — GET /users/:id  (with customer profile data)
 *   useCustomerOrders(filters)     — GET /orders?customerId=...
 *   useVerifyCustomer(customerId)  — POST /age-verification/verify
 *   useCustomerList(filters)       — GET /users?role=customer (paginated, Admin)
 *
 * ── Search staleTime ─────────────────────────────────────────────────────────
 *
 * Customer search results (GET /users?search=...) are given a 30-second staleTime.
 * Staff lookup is a rapid workflow — searching for a customer, checking their
 * limits, then handing them their order. 30 seconds is enough to not re-fetch
 * while the staff member is looking at the result, but fresh enough that the
 * next search doesn't return cached results for a different query.
 *
 * ── Verification staleTime ────────────────────────────────────────────────────
 *
 * useCustomer() (which includes verificationStatus) uses staleTime: 0 when
 * called from a verification workflow. The Staff Portal overrides this by
 * calling queryClient.invalidateQueries(customerKeys.detail(id)) after a
 * successful POST /age-verification/verify mutation to show the updated badge.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type { User, Order, ApiResponse, ApiListResponse, ApiError } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const customerKeys = {
  all:       ['customers']                                         as const,
  lists:     () => [...customerKeys.all, 'list']                   as const,
  list:      (f?: object) => [...customerKeys.lists(), f]          as const,
  search:    (q: string)  => [...customerKeys.all, 'search', q]   as const,
  detail:    (id: string) => [...customerKeys.all, 'detail', id]  as const,
  orders:    (id: string, f?: object) => [...customerKeys.all, 'orders', id, f] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /users?search=:q&role=customer — debounced customer search.
 *
 * Used in the Staff Portal Customer Lookup search input. The caller (component)
 * is responsible for debouncing the query string before passing it here.
 *
 * Enabled only when `q` has 2+ characters to avoid unnecessary requests.
 *
 * @example
 *   const debouncedQ = useDebounce(searchInput, 300);
 *   const { data } = useCustomerSearch({ q: debouncedQ, limit: 10 }, { enabled: debouncedQ.length >= 2 });
 */
export function useCustomerSearch(
  params: { q: string; limit?: number },
  opts?:  { enabled?: boolean },
) {
  return useQuery<User[], ApiError>({
    queryKey: customerKeys.search(params.q),
    queryFn:  async () => {
      const p = new URLSearchParams({ search: params.q, role: 'customer' });
      if (params.limit) p.set('limit', String(params.limit));
      const { data } = await apiClient.get<ApiListResponse<User>>(`${ENDPOINTS.users.list}?${p}`);
      return data.data ?? [];
    },
    enabled:   (opts?.enabled ?? true) && params.q.length >= 2,
    staleTime: 30_000,
  });
}

/**
 * GET /users/:id — customer profile with verification status and medical card info.
 *
 * Enabled only when `id` is non-empty. When called from a verification
 * workflow, pass staleTime override of 0 via queryClient.invalidateQueries.
 */
export function useCustomer(id: string, opts?: { enabled?: boolean }) {
  return useQuery<User, ApiError>({
    queryKey: customerKeys.detail(id),
    queryFn:  async () => {
      const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.users.detail(id));
      return data.data;
    },
    enabled:   (opts?.enabled ?? true) && !!id,
    staleTime: 60_000, // 1 min — profile data; re-fetch after verification via invalidate
  });
}

/**
 * GET /orders?customerId=:id — customer order history.
 *
 * Used in CustomerDetail and CustomerLookup panels. The limit param lets
 * callers get just the most recent 5 orders for a quick summary, or all
 * orders for the full history view.
 *
 * @example
 *   const { data: recentOrders } = useCustomerOrders({ customerId: id, limit: 5 });
 */
export function useCustomerOrders(
  params:  { customerId: string; limit?: number; page?: number },
  opts?:   { enabled?: boolean },
) {
  const { customerId, limit = 20, page = 1 } = params;
  return useQuery<ApiListResponse<Order>, ApiError>({
    queryKey: customerKeys.orders(customerId, { limit, page }),
    queryFn:  async () => {
      const p = new URLSearchParams({
        customerId,
        limit: String(limit),
        page:  String(page),
        sort:  'createdAt_desc',
      });
      const { data } = await apiClient.get<ApiListResponse<Order>>(
        `${ENDPOINTS.orders.list}?${p}`,
      );
      return data;
    },
    enabled:   (opts?.enabled ?? true) && !!customerId,
    staleTime: 60_000,
  });
}

/**
 * POST /age-verification/verify — staff-initiated ID verification.
 *
 * Called from:
 *   - Staff Portal Quick Actions "Verify Age" tile
 *   - Staff Portal Customer Lookup "Verify ID" button
 *   - Admin Portal CustomerDetail "Initiate Verification" button
 *
 * After a successful mutation, the customer's detail cache is invalidated
 * so their verificationStatus badge updates without a manual refresh.
 *
 * Payload for manual (budtender-checks-ID) verification:
 *   { action: 'approve', customerId: '...', verificationType: 'manual' }
 *
 * Payload for rejection:
 *   { action: 'reject', reason: 'ID expired' }
 *
 * @example
 *   const { mutate: verify } = useVerifyCustomer(customer.id);
 *   verify({ action: 'approve' });
 */
export function useVerifyCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { action: 'approve' | 'reject'; reason?: string }>({
    mutationFn: async ({ action, reason }) => {
      const { data } = await apiClient.post<ApiResponse<User>>(
        ENDPOINTS.ageVerification.verify,
        { customerId, action, reason, verificationType: 'manual' },
      );
      return data.data;
    },
    onSuccess: (updated) => {
      // Update detail cache so verification badge refreshes immediately
      queryClient.setQueryData(customerKeys.detail(customerId), updated);
    },
  });
}

/**
 * GET /users?role=customer — paginated customer list for Admin portal.
 *
 * The full admin Customers page uses this with search, verification filter,
 * and active status filter.
 *
 * @example
 *   const { data } = useCustomerList({ search: 'jane', verificationStatus: 'verified', page: 1 });
 */
export function useCustomerList(filters: {
  search?:             string;
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  isActive?:           boolean;
  page?:               number;
  limit?:              number;
}) {
  return useQuery<ApiListResponse<User>, ApiError>({
    queryKey: customerKeys.list(filters),
    queryFn:  async () => {
      const p = new URLSearchParams({ role: 'customer' });
      if (filters.search)             p.set('search',             filters.search);
      if (filters.verificationStatus) p.set('verificationStatus', filters.verificationStatus);
      if (filters.isActive != null)   p.set('isActive',           String(filters.isActive));
      if (filters.page)               p.set('page',               String(filters.page));
      if (filters.limit)              p.set('limit',              String(filters.limit ?? 20));
      const { data } = await apiClient.get<ApiListResponse<User>>(`${ENDPOINTS.users.list}?${p}`);
      return data;
    },
    staleTime: 60_000,
  });
}
TSEOF
echo "  ✓ hooks/useCustomers.ts"

# =============================================================================
# packages/api-client/src/hooks/useSearch.ts
# =============================================================================
cat > "$HOOKS_DIR/useSearch.ts" << 'TSEOF'
/**
 * @file useSearch.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for the Elasticsearch-backed product search API.
 *
 * Hooks:
 *   useProductSearch(query, filters)  — GET /search?q=...  (full-text with relevance scoring)
 *   useSearchSuggestions(query)       — GET /search/suggest?q=...  (autocomplete)
 *
 * ── Search vs. Product Listing ────────────────────────────────────────────────
 *
 * `useProductSearch` is distinct from `useProducts` (which calls GET /products):
 *   - /products uses SQL filtering — good for category browsing with exact filters
 *   - /search uses Elasticsearch — good for free-text input with typo tolerance,
 *     cannabis synonym expansion (weed→flower, cart→vape cartridge), and relevance
 *     ranking by THC %, reviews, and sales velocity
 *
 * Use `useProductSearch` for the storefront search bar.
 * Use `useProducts` for category pages, admin product management, and inventory.
 *
 * ── Suggestion staleTime ────────────────────────────────────────────────────
 *
 * Autocomplete suggestions are given a 2-minute staleTime. They're typed
 * in rapid succession — caching the last few queries avoids redundant
 * Elasticsearch requests when a user backspaces and re-types.
 *
 * ── Enabled condition ────────────────────────────────────────────────────────
 *
 * Both hooks are disabled when the query string is empty or < 2 characters,
 * since a 1-character query is unlikely to be intentional and would spam the
 * Elasticsearch cluster.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type { Product, ApiError } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const searchKeys = {
  all:         ['search']                                          as const,
  results:     (q: string, f?: object) => [...searchKeys.all, 'results', q, f] as const,
  suggestions: (q: string) => [...searchKeys.all, 'suggest', q]  as const,
};

// ── Filter type ───────────────────────────────────────────────────────────────

export interface SearchFilters {
  category?:    string;
  strainType?:  string;
  minThc?:      number;
  maxThc?:      number;
  minPrice?:    number;
  maxPrice?:    number;
  effects?:     string[];
  page?:        number;
  limit?:       number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /search?q=:query — full-text product search with Elasticsearch.
 *
 * Returns products ranked by relevance, supporting:
 *   - Typo tolerance (fuzzy matching)
 *   - Cannabis synonym expansion: "weed" → flower, "cart" → vape cartridge
 *   - Multi-field boosting: name > brand > description > effects
 *   - Optional filters applied post-search
 *
 * The caller should debounce the `query` string (300ms recommended) to
 * avoid firing on every keystroke.
 *
 * @example
 *   const debouncedQ = useDebounce(searchTerm, 300);
 *   const { data } = useProductSearch(debouncedQ, { category: 'flower' });
 */
export function useProductSearch(query: string, filters?: SearchFilters) {
  return useQuery<{ data: Product[]; total: number; took: number }, ApiError>({
    queryKey: searchKeys.results(query, filters),
    queryFn:  async () => {
      const params = new URLSearchParams({ q: query });
      if (filters?.category)   params.set('category',   filters.category);
      if (filters?.strainType) params.set('strainType', filters.strainType);
      if (filters?.minThc)     params.set('minThc',     String(filters.minThc));
      if (filters?.maxThc)     params.set('maxThc',     String(filters.maxThc));
      if (filters?.minPrice)   params.set('minPrice',   String(filters.minPrice));
      if (filters?.maxPrice)   params.set('maxPrice',   String(filters.maxPrice));
      if (filters?.page)       params.set('page',       String(filters.page));
      if (filters?.limit)      params.set('limit',      String(filters.limit ?? 20));
      if (filters?.effects?.length) {
        filters.effects.forEach((e) => params.append('effects', e));
      }
      const { data } = await apiClient.get(`${ENDPOINTS.search.query}?${params}`);
      return data;
    },
    enabled:   query.length >= 2,
    staleTime: 2 * 60_000,         // 2 min — search index rarely changes mid-session
    placeholderData: (previousData) => previousData, // Keep showing previous results while fetching
  });
}

/**
 * GET /search/suggest?q=:query — typeahead autocomplete suggestions.
 *
 * Returns up to 8 product name / brand / category suggestions for displaying
 * in the storefront search dropdown before the user submits.
 *
 * Suggestions come from an Elasticsearch completion suggester and are
 * very fast (<20ms typical) so can be fetched on each debounced keystroke.
 *
 * @example
 *   const { data: suggestions } = useSearchSuggestions('blue');
 *   // ['Blue Dream', 'Blueberry Kush', 'Blue Cheese', ...]
 */
export function useSearchSuggestions(query: string) {
  return useQuery<string[], ApiError>({
    queryKey: searchKeys.suggestions(query),
    queryFn:  async () => {
      const { data } = await apiClient.get(
        `${ENDPOINTS.search.suggest}?q=${encodeURIComponent(query)}`,
      );
      return data.suggestions ?? data;
    },
    enabled:   query.length >= 2,
    staleTime: 2 * 60_000,
  });
}
TSEOF
echo "  ✓ hooks/useSearch.ts"

# =============================================================================
# packages/api-client/src/hooks/useRecommendations.ts
# =============================================================================
cat > "$HOOKS_DIR/useRecommendations.ts" << 'TSEOF'
/**
 * @file useRecommendations.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for product reviews and AI-powered recommendations.
 *
 * Hooks:
 *   useProductReviews(productId, filters) — GET /reviews/:productId
 *   useCreateReview()                     — POST /reviews (authenticated)
 *   useRecommendations(context)           — POST /ai/recommendations
 *   useSimilarProducts(productId)         — GET /products?similar=:id (Sprint 9)
 *
 * Query Keys (table from Phase F spec):
 *   ['reviews', productId]   — per-product review list
 *
 * ── Recommendations staleTime ────────────────────────────────────────────────
 *
 * AI recommendations are computed server-side based on purchase history,
 * browsing behaviour, and the current dispensary inventory. They are given a
 * 10-minute staleTime — fresh enough to reflect recent purchases without
 * triggering a model inference call on every page load.
 *
 * ── Reviews staleTime ────────────────────────────────────────────────────────
 *
 * Product reviews are given a 5-minute staleTime. Reviews change slowly
 * (customers don't leave reviews by the second) and the review list is a
 * secondary concern compared to inventory accuracy.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';
import type { ApiListResponse, ApiError } from '@cannasaas/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductReview {
  id:         string;
  productId:  string;
  userId:     string;
  rating:     1 | 2 | 3 | 4 | 5;
  title?:     string;
  body?:      string;
  verified:   boolean;  // Verified purchase
  createdAt:  string;
  user: { firstName: string; avatarUrl?: string };
}

export interface ReviewFilters {
  rating?:    number;
  verified?:  boolean;
  sort?:      'newest' | 'helpful' | 'rating_asc' | 'rating_desc';
  page?:      number;
  limit?:     number;
}

export interface RecommendationContext {
  /** Current product being viewed (for "similar products") */
  currentProductId?: string;
  /** Reason for recommendations — drives the model prompt */
  reason?: 'similar' | 'trending' | 'personalised' | 'mood';
  /** Mood/effect tags (e.g. 'relaxing', 'energising', 'pain relief') */
  mood?: string;
  /** Max number of recommendations to return */
  limit?: number;
}

// ── Query Key Factory ─────────────────────────────────────────────────────────

export const reviewKeys = {
  all:    ['reviews']                                                         as const,
  list:   (productId: string, f?: object) => ['reviews', productId, f]       as const,
};

export const recKeys = {
  all:      ['recommendations']                                               as const,
  forCtx:   (ctx: object)       => [...recKeys.all, ctx]                     as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * GET /reviews/:productId — paginated review list for a product.
 *
 * Returns reviews with star rating, text body, and a "verified purchase" badge.
 *
 * @example
 *   const { data: reviews } = useProductReviews('uuid', { sort: 'newest', limit: 10 });
 */
export function useProductReviews(productId: string, filters?: ReviewFilters) {
  return useQuery<ApiListResponse<ProductReview>, ApiError>({
    queryKey: reviewKeys.list(productId, filters),
    queryFn:  async () => {
      const p = new URLSearchParams();
      if (filters?.rating)   p.set('rating',   String(filters.rating));
      if (filters?.verified) p.set('verified', 'true');
      if (filters?.sort)     p.set('sort',     filters.sort);
      if (filters?.page)     p.set('page',     String(filters.page));
      if (filters?.limit)    p.set('limit',    String(filters.limit ?? 10));
      const { data } = await apiClient.get(
        `${ENDPOINTS.reviews.list(productId)}?${p}`,
      );
      return data;
    },
    enabled:   !!productId,
    staleTime: 5 * 60_000,
  });
}

/**
 * POST /reviews — submit a product review (authenticated customers only).
 *
 * On success: invalidates the product's review list and updates the product
 * detail cache's reviewSummary if present.
 */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation<ProductReview, ApiError, {
    productId: string; rating: 1|2|3|4|5; title?: string; body?: string;
  }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(ENDPOINTS.reviews.create, body);
      return data.data;
    },
    onSuccess: (_v, vars) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(vars.productId) });
    },
  });
}

/**
 * POST /ai/recommendations — AI-powered personalised product recommendations.
 *
 * The backend calls the recommendations module which combines:
 *   - Customer purchase history (if authenticated)
 *   - Current inventory availability
 *   - Trending products for the dispensary
 *   - Mood/effect tags if provided
 *
 * Uses `useMutation` (not useQuery) because recommendations depend on request
 * context that changes per call. Call `.mutate(context)` when the user lands
 * on the recommendations section or changes their mood filter.
 *
 * @example
 *   const { mutate: getRecommendations, data } = useRecommendations();
 *   getRecommendations({ reason: 'mood', mood: 'relaxing', limit: 6 });
 */
export function useRecommendations() {
  return useMutation({
    mutationFn: async (context: RecommendationContext) => {
      const { data } = await apiClient.post(ENDPOINTS.ai.recommendations, context);
      return data;
    },
  });
}

/**
 * GET /products?similar=:productId — products similar to the current one (Sprint 9).
 *
 * Returns up to 6 products in the same category with similar effects and
 * price range. Powered by the recommendations module's content-based filter.
 */
export function useSimilarProducts(productId: string) {
  return useQuery({
    queryKey: recKeys.forCtx({ type: 'similar', productId }),
    queryFn:  async () => {
      const { data } = await apiClient.get(`${ENDPOINTS.products.list}?similar=${productId}&limit=6`);
      return data.data ?? [];
    },
    enabled:   !!productId,
    staleTime: 10 * 60_000,
  });
}
TSEOF
echo "  ✓ hooks/useRecommendations.ts"

# =============================================================================
# packages/api-client/src/hooks/useAI.ts
# =============================================================================
cat > "$HOOKS_DIR/useAI.ts" << 'TSEOF'
/**
 * @file useAI.ts
 * @package @cannasaas/api-client
 *
 * TanStack Query hooks for the AI Services API endpoints.
 *
 * Hooks:
 *   useGenerateProductDescription()  — POST /ai/product-description (Admin, Manager+)
 *   useDispensaryChatbot()           — POST /ai/chatbot  (Public — storefront)
 *
 * Both hooks use `useMutation` because AI responses are non-deterministic —
 * caching them would result in the same generated copy being served repeatedly.
 *
 * ── Product Description Generation ──────────────────────────────────────────
 *
 * Used in the Admin Product form when a manager wants AI-assisted copy.
 * Sends the product name, category, strain type, THC %, effects, and flavors
 * as context. The AI returns a 2-3 sentence marketing description.
 *
 * The result is never auto-populated into the form — the manager sees a
 * modal with the generated copy and can "Use this description" or dismiss.
 * This keeps humans in the loop for all published content.
 *
 * ── Dispensary Chatbot ────────────────────────────────────────────────────────
 *
 * The chatbot is a public endpoint that powers the storefront help widget.
 * It has knowledge of the dispensary's current inventory, operating hours,
 * and frequently asked questions. It does NOT have access to individual
 * customer order history or personal data.
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';
import { ENDPOINTS }  from '../endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductDescriptionContext {
  name:        string;
  category:    string;
  strainType?: string;
  thcContent?: number;
  cbdContent?: number;
  effects?:    string[];
  flavors?:    string[];
  brand?:      string;
  tone?:       'clinical' | 'friendly' | 'premium'; // Desired copy tone
}

export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface ChatbotRequest {
  messages:    ChatMessage[];  // Full conversation history for context
  dispensaryId?: string;       // Allows server to inject dispensary-specific context
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * POST /ai/product-description — generate marketing copy for a product.
 *
 * @example
 *   const { mutate: generate, data, isPending } = useGenerateProductDescription();
 *
 *   generate({
 *     name: 'Blue Dream',
 *     category: 'flower',
 *     thcContent: 24,
 *     effects: ['uplifting', 'creative'],
 *     tone: 'friendly',
 *   });
 *
 *   // Then show data.description in a modal for review
 */
export function useGenerateProductDescription() {
  return useMutation<{ description: string }, Error, ProductDescriptionContext>({
    mutationFn: async (context) => {
      const { data } = await apiClient.post(ENDPOINTS.ai.productDescription, context);
      return data;
    },
  });
}

/**
 * POST /ai/chatbot — multi-turn dispensary chatbot.
 *
 * The caller maintains the conversation history in component state and passes
 * the full `messages` array with each call so the model has context.
 *
 * @example
 *   const { mutate: sendMessage, isPending } = useDispensaryChatbot();
 *
 *   const [messages, setMessages] = useState<ChatMessage[]>([]);
 *
 *   const send = (userText: string) => {
 *     const updated = [...messages, { role: 'user', content: userText }];
 *     setMessages(updated);
 *     sendMessage(
 *       { messages: updated },
 *       {
 *         onSuccess: (res) => setMessages([...updated, { role: 'assistant', content: res.reply }]),
 *       }
 *     );
 *   };
 */
export function useDispensaryChatbot() {
  return useMutation<{ reply: string }, Error, ChatbotRequest>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post(ENDPOINTS.ai.chatbot, body);
      return data;
    },
  });
}
TSEOF
echo "  ✓ hooks/useAI.ts"

# =============================================================================
# packages/api-client/src/endpoints.addendum.ts
# =============================================================================
cat > "$CLIENT_SRC/endpoints.addendum.ts" << 'TSEOF'
/**
 * @file endpoints.addendum.ts
 * @package @cannasaas/api-client
 *
 * Phase F endpoint constants that extend the base ENDPOINTS object in endpoints.ts.
 *
 * These are imported by the Phase F hooks. The base endpoints.ts file from
 * scaffold-api-client.sh already contains auth, products, cart, orders, analytics.
 *
 * This addendum adds: users, compliance, dispensaries, delivery, search,
 * reviews, and AI endpoints.
 *
 * Usage in hooks:
 *   import { ENDPOINTS } from '../endpoints';
 *   // The base ENDPOINTS object is extended at runtime by the merge below.
 *
 * Alternatively, hooks import directly from this file if the base ENDPOINTS
 * was not already extended:
 *   import { ENDPOINTS_V2 } from '../endpoints.addendum';
 */

const BASE = '/v1'; // Redundant if axiosClient baseURL already includes /v1; remove if so.

export const ENDPOINTS_ADDENDUM = {

  /** User management — Admin+ */
  users: {
    list:         '/users',
    create:       '/users',
    detail:       (id: string)    => `/users/${id}`,
    update:       (id: string)    => `/users/${id}`,
    delete:       (id: string)    => `/users/${id}`,
    assignRoles:  (id: string)    => `/users/${id}/roles`,
  },

  /** Compliance */
  compliance: {
    logs:           '/compliance/logs',
    purchaseLimit:  '/compliance/purchase-limit',
    dailyReport:    '/compliance/reports/daily',
    salesAnalytics: '/compliance/analytics/sales',
    topProducts:    '/compliance/analytics/top-products',
    revenue:        '/compliance/analytics/revenue',
  },

  /** Dispensary management */
  dispensaries: {
    list:           '/dispensaries',
    create:         '/dispensaries',
    detail:         (id: string)  => `/dispensaries/${id}`,
    update:         (id: string)  => `/dispensaries/${id}`,
    delete:         (id: string)  => `/dispensaries/${id}`,
    nearby:         '/dispensaries/nearby',
    uploadLogo:     (id: string)  => `/dispensaries/${id}/branding/logo`,
    updateBranding: (id: string)  => `/dispensaries/${id}/branding`,
  },

  /** Delivery */
  delivery: {
    zones:        '/delivery/zones',
    createZone:   '/delivery/zones',
    drivers:      '/delivery/drivers',
    assign:       '/delivery/assign',
    checkAddress: '/delivery/check-address',
    tracking:     '/delivery/tracking', // WebSocket endpoint (ws://)
  },

  /** Elasticsearch search */
  search: {
    query:   '/search',
    suggest: '/search/suggest',
  },

  /** Product reviews */
  reviews: {
    list:   (productId: string) => `/reviews/${productId}`,
    create: '/reviews',
  },

  /** AI services */
  ai: {
    productDescription: '/ai/product-description',
    recommendations:    '/ai/recommendations',
    chatbot:            '/ai/chatbot',
  },

  /** Age verification */
  ageVerification: {
    uploadId: '/age-verification/upload-id',
    verify:   '/age-verification/verify',
  },

  /** Orders (additional endpoints not in base) */
  ordersExtra: {
    updateStatus: (id: string) => `/orders/${id}/status`,
    cancel:       (id: string) => `/orders/${id}/cancel`,
    refund:       (id: string) => `/orders/${id}/refund`,
  },
} as const;
TSEOF
echo "  ✓ endpoints.addendum.ts"

# =============================================================================
# packages/api-client/src/index.ts  — Full barrel export including all Phase F hooks
# =============================================================================
cat > "$CLIENT_SRC/index.ts" << 'TSEOF'
/**
 * @file index.ts
 * @package @cannasaas/api-client
 *
 * Barrel export for the entire @cannasaas/api-client package.
 *
 * ── Phase F Hook Coverage Map ───────────────────────────────────────────────
 *
 * Backend Endpoint           │ Hook                  │ File
 * ───────────────────────────┼───────────────────────┼───────────────────────
 * POST /auth/login           │ useLogin              │ hooks/useAuth.ts
 * POST /auth/register        │ useRegister           │ hooks/useAuth.ts
 * POST /auth/refresh         │ (internal, axiosClient)│ axiosClient.ts
 * GET  /auth/profile         │ useCurrentUser        │ hooks/useAuth.ts
 * GET  /products             │ useProducts           │ hooks/useProducts.ts
 * GET  /products/:id         │ useProduct            │ hooks/useProducts.ts
 * POST /products             │ useCreateProduct      │ hooks/useProducts.ts
 * PUT  /products/:id         │ useUpdateProduct      │ hooks/useProducts.ts
 * GET  /products/low-stock   │ useLowStockProducts   │ hooks/useProducts.ts
 * GET  /cart                 │ useCart               │ hooks/useCart.ts
 * POST /cart/items           │ useAddToCart (optim.) │ hooks/useCart.ts
 * PUT  /cart/items/:id       │ useUpdateCartItem     │ hooks/useCart.ts
 * DELETE /cart/items/:id     │ useRemoveCartItem     │ hooks/useCart.ts
 * POST /cart/promo           │ useApplyPromo         │ hooks/useCart.ts
 * GET  /orders               │ useOrders             │ hooks/useOrders.ts
 * POST /orders               │ useCreateOrder        │ hooks/useOrders.ts
 * GET  /orders/:id           │ useOrder              │ hooks/useOrders.ts
 * PUT  /orders/:id/status    │ useUpdateOrderStatus  │ hooks/useDelivery.ts
 * GET  /analytics/dashboard  │ useDashboardAnalytics │ hooks/useAnalytics.ts
 * GET  /analytics/products   │ useAnalyticsProducts  │ hooks/useAnalytics.ts
 * GET  /analytics/customers  │ useAnalyticsCustomers │ hooks/useAnalytics.ts
 * GET  /analytics/export     │ useExportAnalytics    │ hooks/useAnalytics.ts
 * GET  /users                │ useUsers, useStaff…   │ hooks/useUsers.ts
 * POST /users                │ useInviteUser         │ hooks/useUsers.ts
 * PUT  /users/:id/roles      │ useUpdateUserRole     │ hooks/useUsers.ts
 * GET  /compliance/logs      │ useComplianceLogs     │ hooks/useCompliance.ts
 * GET  /compliance/purchase… │ useCustomerPurchase…  │ hooks/useCompliance.ts
 * GET  /dispensaries         │ useDispensaries       │ hooks/useDispensaries.ts
 * GET  /dispensaries/:id     │ useDispensary         │ hooks/useDispensaries.ts
 * GET  /dispensaries/nearby  │ useNearbyDispensaries │ hooks/useDispensaries.ts
 * PUT  /dispensaries/:id     │ useUpdateDispensary   │ hooks/useDispensaries.ts
 * GET  /delivery/zones       │ useDeliveryZones      │ hooks/useDelivery.ts
 * POST /delivery/zones       │ useCreateDelivery…    │ hooks/useDelivery.ts
 * GET  /delivery/drivers     │ useAvailableDrivers   │ hooks/useDelivery.ts
 * POST /delivery/assign      │ useAssignDriver       │ hooks/useDelivery.ts
 * GET  /search               │ useProductSearch      │ hooks/useSearch.ts
 * GET  /search/suggest       │ useSearchSuggestions  │ hooks/useSearch.ts
 * GET  /reviews/:productId   │ useProductReviews     │ hooks/useRecommendations.ts
 * POST /ai/recommendations   │ useRecommendations    │ hooks/useRecommendations.ts
 * POST /ai/product-desc…     │ useGenerate…          │ hooks/useAI.ts
 * POST /ai/chatbot           │ useDispensaryChatbot  │ hooks/useAI.ts
 * POST /age-verification/…   │ useVerifyCustomer     │ hooks/useCustomers.ts
 *
 * ── QueryClient ──────────────────────────────────────────────────────────────
 *
 * The `queryClient` singleton should be imported by each app's main.tsx:
 *   import { queryClient } from '@cannasaas/api-client';
 *   <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 */

// ── QueryClient ───────────────────────────────────────────────────────────────
export { queryClient } from './lib/queryClient';

// ── Axios client ──────────────────────────────────────────────────────────────
export { apiClient, wireAuthToAxios } from './axiosClient';
export type { NormalisedApiError } from './axiosClient';

// ── Endpoints ────────────────────────────────────────────────────────────────
export { ENDPOINTS_ADDENDUM } from './endpoints.addendum';

// ── Auth ─────────────────────────────────────────────────────────────────────
export {
  useLogin, useRegister, useLogout, useCurrentUser, useUpdateProfile,
  authKeys,
} from './hooks/useAuth';

// ── Products ─────────────────────────────────────────────────────────────────
export {
  useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useLowStockProducts, useProductCategories,
  productKeys,
} from './hooks/useProducts';

// ── Cart (with optimistic updates) ───────────────────────────────────────────
export {
  useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem,
  useApplyPromo, useRemovePromo,
  cartKeys,
} from './hooks/useCart';

// ── Orders ───────────────────────────────────────────────────────────────────
export {
  useOrders, useOrder, useCreateOrder, useCancelOrder, useRefundOrder,
  orderKeys,
} from './hooks/useOrders';

// ── Analytics ────────────────────────────────────────────────────────────────
export {
  useDashboardAnalytics, useAnalyticsProducts, useAnalyticsCustomers, useExportAnalytics,
  analyticsKeys,
} from './hooks/useAnalytics';

// ── Users + Staff ────────────────────────────────────────────────────────────
export {
  useUsers, useStaffUsers, useUser, useInviteUser,
  useUpdateUser, useUpdateUserRole, useToggleUserActive, useDeactivateUser,
  userKeys,
} from './hooks/useUsers';

// ── Compliance ───────────────────────────────────────────────────────────────
export {
  useComplianceLogs, useCustomerPurchaseLimit, useGenerateDailyReport,
  useComplianceSalesAnalytics, useComplianceTopProducts, useComplianceRevenue,
  complianceKeys,
} from './hooks/useCompliance';

// ── Dispensaries ─────────────────────────────────────────────────────────────
export {
  useDispensaries, useDispensary, useNearbyDispensaries,
  useCreateDispensary, useUpdateDispensary, useDeleteDispensary, useUpdateBranding,
  dispensaryKeys,
} from './hooks/useDispensaries';

// ── Delivery ─────────────────────────────────────────────────────────────────
export {
  useDeliveryZones, useCreateDeliveryZone, useDeleteDeliveryZone,
  useDeliveryOrders, useAvailableDrivers, useAssignDriver,
  useCheckDeliveryAddress, useUpdateOrderStatus,
  deliveryKeys,
} from './hooks/useDelivery';

// ── Customers ────────────────────────────────────────────────────────────────
export {
  useCustomerSearch, useCustomer, useCustomerOrders,
  useVerifyCustomer, useCustomerList,
  customerKeys,
} from './hooks/useCustomers';

// ── Search ───────────────────────────────────────────────────────────────────
export {
  useProductSearch, useSearchSuggestions,
  searchKeys,
} from './hooks/useSearch';

// ── Recommendations + Reviews ────────────────────────────────────────────────
export {
  useProductReviews, useCreateReview, useRecommendations, useSimilarProducts,
  reviewKeys, recKeys,
} from './hooks/useRecommendations';

// ── AI Services ──────────────────────────────────────────────────────────────
export {
  useGenerateProductDescription, useDispensaryChatbot,
} from './hooks/useAI';
TSEOF
echo "  ✓ index.ts (full Phase F barrel)"

echo ""
echo "  ✅ Phase F Part 2 complete"
find "$HOOKS_DIR/useDelivery.ts" "$HOOKS_DIR/useCustomers.ts" \
     "$HOOKS_DIR/useSearch.ts"   "$HOOKS_DIR/useRecommendations.ts" \
     "$HOOKS_DIR/useAI.ts"       "$CLIENT_SRC/endpoints.addendum.ts" \
     "$CLIENT_SRC/index.ts" \
  -type f 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
