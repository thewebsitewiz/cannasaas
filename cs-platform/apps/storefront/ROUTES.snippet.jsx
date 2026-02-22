/**
 * PASTE THESE ROUTES into apps/storefront/src/App.jsx
 *
 * Uses React.lazy for code splitting — each page is a separate chunk.
 * The QueryBoundary around each lazy route handles:
 *   - Suspense loading state (skeleton UI)
 *   - Error boundary (retry button)
 */
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryBoundary, LoadingFallback } from "@cannasaas/api-client";

const LoginPage         = lazy(() => import("./pages/LoginPage"));
const ProductsPage      = lazy(() => import("./pages/storefront/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/storefront/ProductDetailPage"));
// const CartPage       = lazy(() => import("./pages/storefront/CartPage"));
// const CheckoutPage   = lazy(() => import("./pages/storefront/CheckoutPage"));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <QueryBoundary loadingFallback={<LoadingFallback label="Loading login page" />}>
          <LoginPage />
        </QueryBoundary>
      } />
      <Route path="/products" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="card" label="Loading products" />}>
          <ProductsPage />
        </QueryBoundary>
      } />
      <Route path="/products/:slug" element={
        <QueryBoundary loadingFallback={<LoadingFallback label="Loading product details" />}>
          <ProductDetailPage />
        </QueryBoundary>
      } />
      <Route path="/" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}

