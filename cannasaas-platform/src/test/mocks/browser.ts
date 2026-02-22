/**
 * @file src/test/mocks/browser.ts
 * @description MSW Service Worker used in development and Storybook.
 *
 * This file is NOT used by Vitest — that uses server.ts (Node adapter).
 * It IS used when running the Vite dev server locally so that the real
 * browser makes intercepted requests and returns mock data, enabling
 * frontend development without a running backend.
 *
 * Setup:
 *   1. Run: npx msw init public/ --save
 *      This copies the mockServiceWorker.js file into public/
 *   2. In apps/storefront/src/main.tsx (dev only):
 *      ```typescript
 *      if (import.meta.env.DEV) {
 *        const { worker } = await import('./test/mocks/browser');
 *        await worker.start({ onUnhandledRequest: 'warn' });
 *      }
 *      ```
 *
 * @see https://mswjs.io/docs/integrations/browser
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * The MSW Service Worker instance for browser environments.
 * Export named so main.tsx can do a dynamic import without touching
 * the production bundle.
 */
export const worker = setupWorker(...handlers);
