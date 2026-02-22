/**
 * @file App.tsx
 * @app apps/admin
 *
 * Root React Router v6 shell for the Admin Portal.
 *
 * ── Route hierarchy ──────────────────────────────────────────────────────────
 *
 *   RootLayout           ← tenant resolution + theme injection
 *   ├── /login           → AdminLogin (public)
 *   └── AdminLayout      ← sidebar + topbar shell
 *       ├── /            → redirect to /dashboard
 *       ├── /dashboard   → DashboardPage        (manager+)
 *       ├── /products    → ProductsPage         (manager+)
 *       ├── /orders      → OrdersPage           (manager+)
 *       ├── /customers   → CustomersPage        (manager+)
 *       ├── /analytics   → AnalyticsPage        (manager+)
 *       └── /settings    → SettingsPage         (admin+)
 *           (sub-tabs: profile, branding, delivery, staff)
 *
 * ── Role requirements ────────────────────────────────────────────────────────
 *
 * Most admin pages require "manager" or above. The Settings page (which
 * includes staff management and branding) requires "admin" or above.
 * Super admin views (org management) are handled within pages via
 * conditional rendering rather than separate routes.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout }   from './components/layout/RootLayout';
import { AdminLayout }  from './components/AdminLayout';
import { ProtectedRoute } from '@cannasaas/ui';

const AdminLogin      = lazy(() => import('./pages/Login').then((m) => ({ default: m.AdminLogin })));
const DashboardPage   = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.DashboardPage })));
const ProductsPage    = lazy(() => import('./pages/Products').then((m) => ({ default: m.AdminProductsPage })));
const OrdersPage      = lazy(() => import('./pages/Orders').then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetail').then((m) => ({ default: m.OrderDetailPage })));
const CustomersPage   = lazy(() => import('./pages/Customers').then((m) => ({ default: m.CustomersPage })));
const CustomerDetail  = lazy(() => import('./pages/CustomerDetail').then((m) => ({ default: m.CustomerDetailPage })));
const AnalyticsPage   = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage    = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })));

function PageLoader() {
  return (
    <div role="status" aria-label="Loading page"
      className="flex items-center justify-center h-64">
      <div aria-hidden="true"
        className="w-8 h-8 border-4 border-[hsl(var(--primary,154_40%_30%))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>

          {/* Public */}
          <Route path="login" element={<AdminLogin />} />

          {/* All admin routes require manager+ */}
          <Route element={<ProtectedRoute requiredRole="manager" loginPath="/login" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"          element={<DashboardPage />} />
              <Route path="products"           element={<ProductsPage />} />
              <Route path="orders"             element={<OrdersPage />} />
              <Route path="orders/:id"         element={<OrderDetailPage />} />
              <Route path="customers"          element={<CustomersPage />} />
              <Route path="customers/:id"      element={<CustomerDetail />} />
              <Route path="analytics"          element={<AnalyticsPage />} />

              {/* Settings sub-tree requires admin+ */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

        </Route>
      </Routes>
    </Suspense>
  );
}
