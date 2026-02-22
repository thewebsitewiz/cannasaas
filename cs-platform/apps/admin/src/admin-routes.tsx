/**
 * ═══════════════════════════════════════════════════════════════════
 * routes.tsx — Admin Portal Route Configuration
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/routes.tsx
 *
 * Route tree:
 *
 *   /login                 → AuthLayout → Login
 *   /                      → ProtectedRoute (requiredRole="admin")
 *                            → AdminLayout (sidebar + topbar)
 *       index              → redirect to /dashboard
 *       /dashboard         → Dashboard
 *       /products          → ProductList
 *       /products/new      → ProductForm  (create mode)
 *       /products/:id/edit → ProductForm  (edit mode)
 *       /orders            → OrderList
 *       /orders/:id        → OrderDetail
 *       /customers         → CustomerList
 *       /customers/:id     → CustomerDetail
 *       /analytics         → Analytics
 *       /inventory         → InventoryList
 *       /inventory/:id/adjust → StockAdjust
 *       /compliance        → ComplianceLogs
 *       /compliance/reports → DailySalesReport
 *       /delivery          → DeliveryZones
 *       /delivery/drivers  → DriverManagement
 *       /delivery/active   → ActiveDeliveries
 *       /pos               → POSConnections
 *       /pos/sync          → SyncStatus
 *       /settings/*        → SettingsPage  (tabs managed internally)
 *       *                  → NotFound
 */

import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from 'react-router-dom';

// ── Layouts ───────────────────────────────────────────────────────────────────
import AdminLayout    from '@/layouts/AdminLayout';
import AuthLayout     from '@/layouts/AuthLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// ── Eagerly loaded (no spinner on first paint) ────────────────────────────────
import Login     from '@/pages/Auth/Login';
import Dashboard from '@/pages/Dashboard/Dashboard';
import NotFound  from '@/pages/NotFound';

// ── Phase D pages (lazily loaded) ─────────────────────────────────────────────
const ProductList    = lazy(() => import('@/pages/Products/ProductList'));
const ProductForm    = lazy(() => import('@/pages/Products/ProductForm'));
const OrderList      = lazy(() => import('@/pages/Orders/OrderList'));
const OrderDetail    = lazy(() => import('@/pages/Orders/OrderDetail'));
const CustomerList   = lazy(() => import('@/pages/Customers/CustomerList'));
const CustomerDetail = lazy(() => import('@/pages/Customers/CustomerDetail'));
const Analytics      = lazy(() => import('@/pages/Analytics/Analytics'));
const SettingsPage   = lazy(() => import('@/pages/Settings'));

// ── Existing scaffold stubs (lazily loaded) ───────────────────────────────────
const InventoryList    = lazy(() => import('@/pages/Inventory/InventoryList'));
const StockAdjust      = lazy(() => import('@/pages/Inventory/StockAdjust'));
const ComplianceLogs   = lazy(() => import('@/pages/Compliance/ComplianceLogs'));
const DailySalesReport = lazy(() => import('@/pages/Compliance/DailySalesReport'));
const DeliveryZones    = lazy(() => import('@/pages/Delivery/DeliveryZones'));
const DriverManagement = lazy(() => import('@/pages/Delivery/DriverManagement'));
const ActiveDeliveries = lazy(() => import('@/pages/Delivery/ActiveDeliveries'));
const POSConnections   = lazy(() => import('@/pages/POS/POSConnections'));
const SyncStatus       = lazy(() => import('@/pages/POS/SyncStatus'));

// ── Suspense wrapper ──────────────────────────────────────────────────────────
function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════

export const router = createBrowserRouter([

  // ── Auth (no sidebar, no guard) ──────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
    ],
  },

  // ── Admin app (sidebar + role guard) ─────────────────────────────
  {
    path: '/',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </ProtectedRoute>
    ),
    children: [

      // Default → /dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // ── Dashboard ──────────────────────────────────────────────
      { path: 'dashboard', element: <Dashboard /> },

      // ── Products ───────────────────────────────────────────────
      {
        path: 'products',
        children: [
          { index: true,      element: <Lazy><ProductList /></Lazy> },
          { path: 'new',      element: <Lazy><ProductForm /></Lazy> },
          // ProductForm detects edit mode via useParams() — id present = edit
          { path: ':id/edit', element: <Lazy><ProductForm /></Lazy> },
        ],
      },

      // ── Orders ─────────────────────────────────────────────────
      {
        path: 'orders',
        children: [
          { index: true, element: <Lazy><OrderList /></Lazy> },
          { path: ':id', element: <Lazy><OrderDetail /></Lazy> },
        ],
      },

      // ── Customers ──────────────────────────────────────────────
      {
        path: 'customers',
        children: [
          { index: true, element: <Lazy><CustomerList /></Lazy> },
          { path: ':id', element: <Lazy><CustomerDetail /></Lazy> },
        ],
      },

      // ── Analytics ──────────────────────────────────────────────
      { path: 'analytics', element: <Lazy><Analytics /></Lazy> },

      // ── Inventory ──────────────────────────────────────────────
      {
        path: 'inventory',
        children: [
          { index: true,        element: <Lazy><InventoryList /></Lazy> },
          { path: ':id/adjust', element: <Lazy><StockAdjust /></Lazy> },
        ],
      },

      // ── Compliance ─────────────────────────────────────────────
      {
        path: 'compliance',
        children: [
          { index: true,     element: <Lazy><ComplianceLogs /></Lazy> },
          { path: 'reports', element: <Lazy><DailySalesReport /></Lazy> },
        ],
      },

      // ── Delivery ───────────────────────────────────────────────
      {
        path: 'delivery',
        children: [
          { index: true,     element: <Lazy><DeliveryZones /></Lazy> },
          { path: 'drivers', element: <Lazy><DriverManagement /></Lazy> },
          { path: 'active',  element: <Lazy><ActiveDeliveries /></Lazy> },
        ],
      },

      // ── POS Integration ────────────────────────────────────────
      {
        path: 'pos',
        children: [
          { index: true,  element: <Lazy><POSConnections /></Lazy> },
          { path: 'sync', element: <Lazy><SyncStatus /></Lazy> },
        ],
      },

      // ── Settings (tabs managed internally) ─────────────────────
      { path: 'settings/*', element: <Lazy><SettingsPage /></Lazy> },

      // ── 404 ────────────────────────────────────────────────────
      { path: '*', element: <NotFound /> },
    ],
  },

  // ── Top-level catch-all ───────────────────────────────────────────
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

// ── App entry (used by admin/src/App.tsx) ─────────────────────────────────────
export default function AdminRoutes() {
  return <RouterProvider router={router} />;
}
