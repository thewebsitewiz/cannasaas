/**
 * ═══════════════════════════════════════════════════════════════════
 * App.tsx — Admin Portal Entry Point
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/App.tsx
 *
 * Provider hierarchy:
 *
 *   <QueryProvider>          ← TanStack Query (server state)
 *     <RouterProvider>       ← React Router v6
 *       <ProtectedRoute>     ← auth guard (inside AdminLayout)
 *         <AdminLayout>      ← sidebar + topbar shell
 *           <Page />         ← matched route
 *
 * AuthProvider is NOT needed here because the admin app uses
 * useAuthStore (Zustand) directly for auth state, and ProtectedRoute
 * handles redirecting unauthenticated users to /login.
 *
 * If you add an AuthProvider that calls useNavigate(), it must live
 * inside the router — add it to AdminLayout, not here.
 */

import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { router } from '@/routes';

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
