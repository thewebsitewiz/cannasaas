/**
 * ═══════════════════════════════════════════════════════════════════
 * App.tsx — Storefront Entry Point
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/App.tsx
 *
 * Responsibilities:
 *   1. Instantiate the TanStack Query client (via QueryProvider)
 *   2. Instantiate the router (via RouterProvider)
 *
 * Provider hierarchy:
 *
 *   <QueryProvider>          ← TanStack Query (server state)
 *     <RouterProvider>       ← React Router v6
 *       <RootLayout>         ← AuthProvider lives HERE (needs useNavigate)
 *         <StorefrontLayout> ← Header / <main> / Footer
 *           <Page />         ← matched route
 *
 * Why AuthProvider is NOT here:
 *   AuthProvider calls useNavigate() on session expiry. useNavigate()
 *   must be called inside a component rendered by RouterProvider.
 *   Putting AuthProvider in App.tsx (outside the router) throws:
 *     "useNavigate() may be used only in the context of a <Router>"
 *   Solution: AuthProvider lives in RootLayout which is the first
 *   component rendered INSIDE the router. See RootLayout.tsx.
 *
 * What was removed vs the original broken App.tsx:
 *   - TenantProvider    — context file doesn't exist; tenant state
 *                         lives in @cannasaas/stores (useOrganizationStore)
 *   - CartProvider      — context file doesn't exist; cart state
 *                         lives in @cannasaas/stores (useCartStore)
 *   - AuthProvider      — moved to RootLayout (see above)
 *   - Inline QueryClient — duplicate of QueryProvider; removed
 *   - react-hot-toast   — not in package.json; see note below
 *
 * NOTE — Toasts:
 *   Two options to get toast notifications working:
 *   a) Add the package:  pnpm add react-hot-toast --filter storefront
 *      Then render <Toaster /> inside StorefrontLayout.tsx
 *   b) Use the already-installed @radix-ui/react-toast — build a thin
 *      <ToastProvider> wrapper and render it in StorefrontLayout.tsx
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { routes } from '@/routes';

// ── Router instance (created once outside the component) ──────────────────────
const router = createBrowserRouter(routes);

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryProvider>
      {/*
       * RouterProvider renders the matched route tree.
       * RootLayout (path "/") is the first route and wraps
       * AuthProvider + all child layouts/pages.
       */}
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
