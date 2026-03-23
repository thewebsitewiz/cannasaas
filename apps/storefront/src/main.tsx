/**
 * @file main.tsx
 * @app storefront
 *
 * Application entry point.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeLoader } from './components/ThemeLoader';
import App from './App';

const root = document.getElementById('root')!;

// TODO: Replace with actual dispensary ID from your tenant context
const DISPENSARY_ID = import.meta.env.VITE_DISPENSARY_ID || '';

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeLoader
      dispensaryId={DISPENSARY_ID}
      graphqlUrl={import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql'}
    />
    <App />
  </React.StrictMode>,
);
