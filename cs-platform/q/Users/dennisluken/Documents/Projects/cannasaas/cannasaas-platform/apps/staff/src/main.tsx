/**
 * @file main.tsx
 * @app apps/staff
 *
 * Application entry point — Phase G complete wiring.
 *
 * ── Bootstrap sequence ───────────────────────────────────────────────────────
 *
 * 1. wireAuthToAxios()
 *    Called BEFORE ReactDOM.createRoot so the Axios interceptors have access
 *    to auth tokens from the very first request. Without this call the
 *    Authorization header would never be attached, and tenant headers would
 *    be missing, causing every API request to return 401/403.
 *
 *    Passes four callbacks that close over Zustand store state:
 *      getAuthState()   — reads accessToken + refreshToken from authStore
 *      setTokens()      — called by the refresh interceptor on token renewal
 *      clearAuth()      — called by the refresh interceptor on refresh failure
 *      getTenantCtx()   — reads organizationId + dispensaryId from orgStore
 *
 * 2. useAuthStore.getState().setLogoutCallback()
 *    Registers a navigation callback so the Axios interceptor (which lives
 *    outside React) can trigger a React Router redirect to /login when the
 *    refresh token is expired or invalid.
 *
 *    We use a module-level `navigate` reference updated by a <NavigateSetter>
 *    component. This is the standard pattern for navigating from outside React.
 *
 * 3. ReactDOM.createRoot() + providers
 *    - StrictMode: double-render detection in development
 *    - QueryClientProvider: TanStack Query global cache (imported queryClient)
 *    - BrowserRouter: React Router v6 client-side routing
 *
 * ── Development setup ────────────────────────────────────────────────────────
 *
 * This app runs on port 5175 in development.
 * Set VITE_DEV_SLUG=your-dispensary-slug in .env.local to resolve a tenant
 * from localhost without a subdomain.
 *
 * ── ReactQueryDevtools ───────────────────────────────────────────────────────
 *
 * React Query DevTools are included in development builds only (import.meta.env.DEV).
 * They render as a floating panel in the bottom-right corner showing all
 * active queries, their stale state, and cached data.
 */

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, wireAuthToAxios } from '@cannasaas/api-client';
import { useAuthStore }         from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';
import App from './App';
import './index.css';

// ── Wire Axios interceptors to Zustand stores ─────────────────────────────────
//
// This MUST happen before ReactDOM.createRoot() is called.
// The callbacks are evaluated lazily (at request time), so they always read
// the current store state rather than a stale closure.

wireAuthToAxios({
  getAuthState: () => ({
    accessToken:  useAuthStore.getState().accessToken,
    refreshToken: useAuthStore.getState().refreshToken,
  }),
  setTokens: (access, refresh) => {
    useAuthStore.getState().setTokens(access, refresh);
  },
  clearAuth: () => {
    useAuthStore.getState().logout();
  },
  getTenantCtx: () => ({
    organizationId: useOrganizationStore.getState().organization?.id ?? null,
    dispensaryId:   useOrganizationStore.getState().dispensary?.id  ?? null,
  }),
});

// ── NavigateSetter ────────────────────────────────────────────────────────────
//
// Bridges the gap between React Router (inside React tree) and the Zustand
// logout callback (outside React). The authStore.logout() action needs to
// trigger a navigate('/login') but it cannot call useNavigate() directly
// because it's not a component.
//
// Solution: A tiny component that captures the navigate function and registers
// it on the authStore. Renders nothing; lives inside BrowserRouter so it has
// access to the Router context.

function NavigateSetter() {
  const navigate    = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Register the navigation callback once
    useAuthStore.getState().setLogoutCallback(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  return null;
}

// ── Root render ───────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Wire logout → navigate before any route renders */}
        <NavigateSetter />
        <App />
        {/* React Query DevTools — development only */}
        {import.meta.env.DEV && (
          // Dynamically imported to keep it out of production bundles
          // @ts-ignore — types only available when installed
          <React.Suspense fallback={null}>
            {(() => {
              const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
              return <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />;
            })()}
          </React.Suspense>
        )}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
