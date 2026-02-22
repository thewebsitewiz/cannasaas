/**
 * @file Account.tsx
 * @app apps/storefront
 *
 * Account shell page — layout with sidebar nav + nested route outlet.
 *
 * URL: /account/*
 * Requires authentication (ProtectedRoute wrapper in App.tsx)
 *
 * Nested routes (rendered via <Outlet />):
 *   /account/profile      — ProfileForm
 *   /account/orders       — OrderHistoryList
 *   /account/orders/:id   — Order detail (TODO: Sprint 5)
 *   /account/addresses    — Saved addresses (TODO)
 *   /account/loyalty      — LoyaltyDashboard
 *   /account/preferences  — Notification preferences (TODO)
 *
 * Layout:
 *   Desktop (lg+): Left sidebar (AccountNav) + right main (Outlet)
 *   Mobile (<lg):  Horizontal tab strip (AccountNav) + content below
 *
 * Accessibility:
 *   - <h1> "My Account" as page heading (WCAG 2.4.6)
 *   - <nav> landmark in AccountNav (WCAG 1.3.1)
 *   - <main> equivalent is the route content area
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@cannasaas/stores';
import { AccountNav } from '../components/account/AccountNav';
import { ProfileForm } from '../components/account/ProfileForm';
import { OrderHistoryList } from '../components/account/OrderHistoryList';
import { LoyaltyDashboard } from '../components/account/LoyaltyDashboard';
import { ROUTES } from '../routes';

export function AccountPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">My Account</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Welcome back, {user?.firstName ?? 'friend'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar navigation */}
        <div className="w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-24">
          <AccountNav />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-stone-100 p-6">
          <Routes>
            {/* Default → profile */}
            <Route index element={<Navigate to="profile" replace />} />

            <Route
              path="profile"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Profile</h2>
                  <ProfileForm />
                </>
              }
            />

            <Route
              path="orders"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Order History</h2>
                  <OrderHistoryList />
                </>
              }
            />

            <Route
              path="orders/:id"
              element={
                <div className="text-center py-8">
                  <p className="text-stone-500 text-sm">Order detail page — Sprint 5</p>
                </div>
              }
            />

            <Route
              path="addresses"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Saved Addresses</h2>
                  <p className="text-stone-500 text-sm">Address management — Sprint 5</p>
                </>
              }
            />

            <Route
              path="loyalty"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Loyalty Points</h2>
                  <LoyaltyDashboard />
                </>
              }
            />

            <Route
              path="preferences"
              element={
                <>
                  <h2 className="text-lg font-bold text-stone-900 mb-6">Preferences</h2>
                  <p className="text-stone-500 text-sm">Notification preferences — Sprint 10</p>
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
