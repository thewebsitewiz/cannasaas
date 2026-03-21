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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
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
