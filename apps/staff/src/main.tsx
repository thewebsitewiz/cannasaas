import '@cannasaas/ui/src/casual.css';
import '@cannasaas/ui/src/themes/theme.casual.css';
import '@cannasaas/ui/src/themes/theme.dark.css';
import '@cannasaas/ui/src/themes/theme.regal.css';
import '@cannasaas/ui/src/themes/theme.modern.css';
import '@cannasaas/ui/src/themes/theme.minimal.css';
import '@cannasaas/ui/src/themes/theme.apothecary.css';
import '@cannasaas/ui/src/themes/theme.citrus.css';
import '@cannasaas/ui/src/themes/theme.earthy.css';
import '@cannasaas/ui/src/themes/theme.midnight.css';
import '@cannasaas/ui/src/themes/theme.neon.css';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { setThemePreset } from '@cannasaas/ui';

// Fetch and apply saved theme on startup
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DISPENSARY_ID = import.meta.env.VITE_DISPENSARY_ID || 'c0000000-0000-0000-0000-000000000001';

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
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: true },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
