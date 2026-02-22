/**
 * @file packages/api-client/src/index.js
 * @description Main barrel export for @cannasaas/api-client.
 * Apps import from this entry point.
 *
 * @example
 *   import { useProducts, QueryProvider, AuthProvider } from "@cannasaas/api-client";
 */

// Providers
export { QueryProvider }                 from "./providers/QueryProvider";
export { AuthProvider, useAuth }         from "./providers/AuthProvider";

// React Query client + key factory
export { queryClient, queryKeys, invalidateQueries, prefetchQuery } from "./lib/queryClient";

// Axios API client
export { apiClient, setAuthContext, clearAuthContext, isAuthenticated, hasRole, STORAGE_KEYS } from "./lib/apiClient";

// All hooks
export * from "./hooks/index";

// Boundary + feedback components
export { QueryBoundary }                 from "./components/boundaries/QueryBoundary";
export { ErrorFallback }                 from "./components/boundaries/ErrorFallback";
export { LoadingFallback }               from "./components/boundaries/LoadingFallback";
export { MutationStatusToaster }         from "./components/feedback/MutationStatus";
export { OptimisticIndicator, OptimisticOverlay } from "./components/feedback/OptimisticIndicator";

