/**
 * PASTE THESE ROUTES into apps/admin/src/App.jsx
 */
import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryBoundary, LoadingFallback } from "@cannasaas/api-client";

const LoginPage           = lazy(() => import("./pages/LoginPage"));
const AdminDashboardPage  = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage   = lazy(() => import("./pages/admin/AdminProductsPage"));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<QueryBoundary><LoginPage /></QueryBoundary>} />
      <Route path="/admin" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="table" label="Loading dashboard" />}>
          <AdminDashboardPage />
        </QueryBoundary>
      } />
      <Route path="/admin/products" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="table" label="Loading products" />}>
          <AdminProductsPage />
        </QueryBoundary>
      } />
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

