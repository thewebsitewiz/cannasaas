/**
 * @file src/test/mocks/server.ts
 * @description MSW Node.js server used in Vitest (unit + integration) tests.
 *
 * The `setupServer` function creates an HTTP interception server backed by the
 * handlers defined in handlers.ts. It intercepts outbound fetch/XHR calls made
 * by components under test and returns mocked responses without touching a real
 * network.
 *
 * Lifecycle (managed in src/test/setup.ts):
 *   beforeAll  → server.listen()
 *   afterEach  → server.resetHandlers()   ← reverts any per-test overrides
 *   afterAll   → server.close()
 *
 * @see https://mswjs.io/docs/integrations/node
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * The MSW Node server instance. Export it so that:
 *   - setup.ts can start/stop it
 *   - Individual test files can call server.use() to override specific handlers
 *
 * @example
 * ```typescript
 * import { server } from '@/test/mocks/server';
 * import { errorHandlers } from '@/test/mocks/handlers';
 *
 * it('shows error state when API fails', async () => {
 *   // Override just the products endpoint for this test
 *   server.use(errorHandlers.products);
 *   // ... render and assert error UI
 * });
 * ```
 */
export const server = setupServer(...handlers);
