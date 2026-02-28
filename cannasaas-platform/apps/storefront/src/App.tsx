// apps/storefront/src/App.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TenantProvider } from './providers/TenantProvider';
import { ThemeBootstrap } from './providers/ThemeBootstrap';
import { AgeGate } from './components/AgeGate/AgeGate';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from '@cannasaas/ui';

const HomePage = lazy(() => import('./pages/Home/HomePage'));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/Products/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/Orders/OrderSuccessPage'));
const OrderTrackingPage = lazy(() => import('./pages/Orders/OrderTrackingPage'));
const AccountPage = lazy(() => import('./pages/Account/AccountPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <TenantProvider>
      <ThemeBootstrap>
        <AgeGate>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<StorefrontLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/orders/:id/success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                <Route path="/orders/:id/track" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AgeGate>
      </ThemeBootstrap>
    </TenantProvider>
  );
}
