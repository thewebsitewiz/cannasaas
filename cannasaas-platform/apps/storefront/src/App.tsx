/**
 * App.tsx
 *
 * Thin entry-point. Responsibilities:
 *   1. Instantiate the TanStack Query client (via QueryProvider)
 *   2. Instantiate the router (via RouterProvider)
 *
 * What was removed vs the original:
 *   - TenantProvider    — no matching context file exists; tenant state
 *                         lives in @cannasaas/stores (useOrganizationStore)
 *   - CartProvider      — no matching context file exists; cart state
 *                         lives in @cannasaas/stores (useCartStore)
 *   - AuthProvider      — moved into RootLayout so it runs inside the
 *                         router context where useNavigate is available.
 *                         (Calling useNavigate outside a router throws.)
 *   - Inline QueryClient — duplicate of QueryProvider; removed to keep
 *                         a single source of truth for query config.
 *   - react-hot-toast   — not listed in package.json. Toaster is now
 *                         omitted here; add `react-hot-toast` to the
 *                         storefront package.json and import in
 *                         StorefrontLayout if you want toast support,
 *                         OR use the @radix-ui/react-toast already
 *                         installed. See note below.
 *
 * NOTE — Toaster:
 *   The original imported Toaster from 'react-hot-toast' which is NOT
 *   in package.json. Two options:
 *     a) Add react-hot-toast:  pnpm add react-hot-toast --filter storefront
 *        Then add <Toaster /> inside StorefrontLayout.tsx.
 *     b) Build a toast component around @radix-ui/react-toast (already
 *        installed) and render it in StorefrontLayout.tsx.
 */

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { routes } from '@/routes';

/* ── Router instance ─────────────────────────────────────────── */
const router = createBrowserRouter(routes);

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  return (
    /**
     * QueryProvider wraps everything so TanStack Query is available
     * to every component in the tree, including the router itself
     * (loaders, deferred data, etc.).
     *
     * AuthProvider lives inside RootLayout (rendered by RouterProvider)
     * because it calls useNavigate — which requires being inside a
     * router context.
     */
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
