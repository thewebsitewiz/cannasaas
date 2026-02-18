import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TenantProvider } from '@/context/TenantContext';
import { Toaster } from 'react-hot-toast';
import { routes } from '@/routes';

/* ── React Query Client ─────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── Router ──────────────────────────────────────────────── */
const router = createBrowserRouter(routes);

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '8px',
                  background: '#1a1a2e',
                  color: '#fff',
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </TenantProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
