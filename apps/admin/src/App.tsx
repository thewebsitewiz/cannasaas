import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { CompliancePage } from './pages/CompliancePage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffingPage } from './pages/StaffingPage';
import { InventoryControlPage } from './pages/InventoryControlPage';
import { TimeClockPage } from './pages/TimeClockPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { InventoryPage } from './pages/InventoryPage';
import { useAuthStore } from './stores/auth.store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="staffing" element={<StaffingPage />} />
        <Route path="inventory-control" element={<InventoryControlPage />} />
        <Route path="timeclock" element={<TimeClockPage />} />
        <Route path="scheduling" element={<SchedulingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
