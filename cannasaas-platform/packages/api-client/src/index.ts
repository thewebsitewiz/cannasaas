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
export { useLogin, useRegister, useLogout, useCurrentUserQuery } from './hooks/useAuth';
// export { useOrders, useOrder, useUpdateOrderStatus } from './hooks/useOrders';
// export { useCart, useAddToCart } from './hooks/useCart';
// export { useAnalyticsDashboard } from './hooks/useAnalytics';
// export { useComplianceLogs, usePurchaseLimitCheck } from './hooks/useCompliance';
// export { useSearchSuggestions, useSearchProducts } from './hooks/useSearch';
// export { useWebSocketEvent } from './hooks/useWebSocketEvent';

// ── WebSocket manager ─────────────────────────────────────────────────────────
export { wsManager } from './services/WebSocketManager';
