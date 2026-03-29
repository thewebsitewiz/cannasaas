import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StaffLayout } from './layouts/StaffLayout';
import { LoginPage } from './pages/LoginPage';
import { OrderQueuePage } from './pages/OrderQueuePage';
import { FulfillmentPage } from './pages/FulfillmentPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductLookupPage } from './pages/ProductLookupPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { useAuthStore } from './stores/auth.store';
import { NewOrderPage } from './pages/NewOrderPage';

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
        <Route path="/" element={<ProtectedRoute><StaffLayout /></ProtectedRoute>}>
          <Route index element={<OrderQueuePage />} />
          <Route path="new-order" element={<NewOrderPage />} />
          <Route path="fulfillment" element={<FulfillmentPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="products" element={<ProductLookupPage />} />
          <Route path="timesheets" element={<TimesheetsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
