import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KioskLayout } from './layouts/KioskLayout';
import { MenuPage } from './pages/MenuPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmPage } from './pages/OrderConfirmPage';
import { CheckInPage } from './pages/CheckInPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setThemePreset } from '@cannasaas/ui';

// Fetch and apply saved theme on startup
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DISPENSARY_ID = import.meta.env.VITE_DISPENSARY_ID || '45cd244d-7016-4db8-8e88-9c71725340c8';

fetch(`${API_URL}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ themeConfig(dispensaryId: "${DISPENSARY_ID}") { preset } }`,
  }),
})
  .then((r) => r.json())
  .then(({ data }) => {
    if (data?.themeConfig?.preset) setThemePreset(data.themeConfig.preset);
  })
  .catch(() => console.warn('[Theme] Using default'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/checkin" element={<CheckInPage />} />
            <Route element={<KioskLayout />}>
              <Route path="/" element={<MenuPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/confirm/:orderId" element={<OrderConfirmPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
