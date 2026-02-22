/**
 * @file main.tsx
 * @app apps/storefront
 *
 * Application entry point. Responsibilities in order:
 *   1. Initialise the system theme listener (prevents FOCT — flash of
 *      conflicting theme before React hydrates)
 *   2. Mount React with all required context providers
 *   3. Trigger session restoration (non-blocking background fetch)
 *   4. Trigger tenant resolution from subdomain (non-blocking)
 *
 * Provider order is important:
 *   QueryClientProvider  — must wrap everything that uses TanStack Query
 *   └─ BrowserRouter     — must wrap everything that uses React Router hooks
 *      └─ App            — reads router context, renders routes
 *
 * Session + tenant restoration happen in RootLayout (App.tsx) after mount,
 * not here, to avoid blocking the initial paint.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

// Prevent FOCT: apply saved theme class to <html> before React renders.
// initSystemThemeListener() also wires the OS preference change handler.
import { initSystemThemeListener } from '@cannasaas/stores';
initSystemThemeListener();

// Global stylesheet — includes Tailwind base, components, utilities
// and the CSS custom property definitions for theme colours.
import './index.css';

/**
 * TanStack Query client configuration.
 *
 * retry: 1  — Retry failed requests once before showing an error.
 *             Two failed attempts is a strong signal the server is down.
 * staleTime: 0  — Individual hooks set their own staleTime.
 *                 0 here means "always stale unless overridden" (sensible default).
 * refetchOnWindowFocus: true  — Refetch when the user returns to the tab.
 *                                Keeps session-sensitive data (cart, orders) fresh.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
