/**
 * @file src/test/setup.ts
 * @description Global test environment setup — runs once before EACH test file.
 *
 * Responsibilities:
 *   1. Start / reset / stop the MSW request-interception server so each test
 *      file gets a predictable network environment.
 *   2. Extend Jest/Vitest's expect() with @testing-library/jest-dom matchers
 *      (toBeInTheDocument, toHaveAccessibleName, toBeVisible, etc.).
 *   3. Polyfill browser globals that jsdom doesn't provide (ResizeObserver,
 *      IntersectionObserver, matchMedia).
 *   4. Silence noisy console.error calls that are expected in error-boundary
 *      tests — replace with a controlled spy.
 *
 * @see https://testing-library.com/docs/react-testing-library/setup/
 * @see https://mswjs.io/docs/integrations/node
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

// ---------------------------------------------------------------------------
// MSW — Mock Service Worker (Node adapter)
// ---------------------------------------------------------------------------

/**
 * Start the MSW server before any tests in this file run.
 * `onUnhandledRequest: 'error'` causes an immediate test failure if a request
 * is made that has no matching handler — prevents silent data leaks and forces
 * developers to explicitly mock every API call their component makes.
 */
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'error',
  }),
);

/**
 * After each individual test, reset handlers to the baseline set defined in
 * handlers.ts. This lets individual tests call server.use() to override
 * specific handlers without affecting subsequent tests in the same file.
 */
afterEach(() => {
  server.resetHandlers();
  /**
   * RTL cleanup: unmounts all rendered components and clears the document.
   * Called automatically in most setups, but explicitly calling it here
   * ensures compatibility when using jsdom without the automatic cleanup
   * teardown listener.
   */
  cleanup();
});

/** Stop the MSW server after all tests in this file complete. */
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Browser API polyfills
// jsdom ships without some browser APIs that components and libraries use.
// ---------------------------------------------------------------------------

/**
 * ResizeObserver — used by Radix UI primitives (Popover, Select, Dialog) to
 * observe element size changes. jsdom doesn't implement it; we provide a no-op.
 */
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * IntersectionObserver — used by virtual-scroll libraries and lazy-loading
 * components. Replaced with a no-op that immediately fires the callback.
 */
globalThis.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  // Simulate an "in view" intersection for any observed element
  takeRecords: vi.fn().mockReturnValue([{ isIntersecting: true }]),
}));

/**
 * window.matchMedia — used by responsive hooks and media-query-driven
 * components. jsdom doesn't implement it; we return a sensible default
 * that reports a desktop viewport (min-width: 1024px matches).
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width') ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),    // deprecated but still used by some libraries
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * window.scrollTo — jsdom doesn't implement scrolling; this prevents
 * "Not implemented" errors in tests that exercise route navigation.
 */
window.scrollTo = vi.fn() as typeof window.scrollTo;

// ---------------------------------------------------------------------------
// console.error suppression for expected React error boundaries
// ---------------------------------------------------------------------------

/**
 * React logs errors to console.error even when they are intentionally caught
 * by an ErrorBoundary. In tests that deliberately trigger error states we
 * silence those logs to keep the test output clean.
 *
 * Tests that want to assert on error output can spy on console.error directly.
 */
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  // Suppress React's "The above error occurred in…" / act() warnings
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    (msg.includes('The above error occurred') ||
      msg.includes('act(') ||
      msg.includes('Warning: ReactDOM.render'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
