import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './layouts/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoleRoute } from './components/RoleRoute';
import { CompliancePage } from './pages/CompliancePage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryControlPage } from './pages/InventoryControlPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SchedulingPage } from './pages/SchedulingPage';
import { SettingsPage } from './pages/SettingsPage';
import { StaffingPage } from './pages/StaffingPage';
import ThemePage from './pages/settings/ThemePage';
import { PaymentProcessorsPage } from './pages/settings/PaymentProcessorsPage';
import { TimeClockPage } from './pages/TimeClockPage';
import { MenuBoardPage } from './pages/MenuBoardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TaxManagementPage } from './pages/TaxManagementPage';
import { MenuCategoriesPage } from './pages/MenuCategoriesPage';
import { useAuthStore } from './stores/auth.store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
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
          <Route path="settings/theme" element={<ThemePage />} />
          <Route path="settings/payments" element={<PaymentProcessorsPage />} />
          <Route path="staffing" element={<StaffingPage />} />
          <Route path="inventory-control" element={<InventoryControlPage />} />
          <Route path="timeclock" element={<TimeClockPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="menu-board" element={<MenuBoardPage />} />
          <Route path="menu-categories" element={<MenuCategoriesPage />} />
          <Route
            path="tax-management"
            element={
              <RoleRoute allowedRoles={['super_admin']}>
                <TaxManagementPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
