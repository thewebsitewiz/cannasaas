/**
 * @file main.tsx
 * @app storefront
 *
 * Application entry point.
 * Generated stub by scaffold-themes.sh
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@cannasaas/ui/src/casual.css'; // [THEME-SCAFFOLD] css-import
import { ThemeLoader } from '@cannasaas/ui'; // [THEME-SCAFFOLD] ThemeLoader
import App from './App';
import '@cannasaas/ui/src/greenstack-design-system.css'; // [THEME-SCAFFOLD] css-import
import { ThemeLoader } from '@cannasaas/ui'; // [THEME-SCAFFOLD] ThemeLoader

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeLoader />
    <ThemeLoader /> // [THEME-SCAFFOLD] ThemeLoader
    <ThemeLoader /> // [THEME-SCAFFOLD] ThemeLoader
    <App />
  </React.StrictMode>,
);
