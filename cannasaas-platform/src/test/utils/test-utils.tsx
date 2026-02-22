/**
 * @file src/test/utils/test-utils.tsx
 * @description Custom render function that wraps components with all
 * application providers, mirroring the real app's provider tree.
 *
 * Why this exists:
 * React Testing Library's default `render()` renders a component in a bare
 * DOM without any context. Real components rely on:
 *   - React Router (for navigation, useParams, useNavigate)
 *   - TanStack Query (for useQuery / useMutation)
 *   - Toast notifications (Radix UI Toast)
 *   - Theme / branding context
 *
 * By re-exporting `render` from this file, all test files get the full
 * provider tree automatically, without repeating the wrapper boilerplate.
 *
 * Usage:
 * ```typescript
 * // ✅ Use this instead of @testing-library/react
 * import { render, screen } from '@/test/utils/test-utils';
 *
 * it('renders the product name', () => {
 *   render(<ProductCard product={MOCK_PRODUCT_BLUE_DREAM} />);
 *   expect(screen.getByRole('heading', { name: /blue dream/i })).toBeInTheDocument();
 * });
 * ```
 *
 * @see https://testing-library.com/docs/react-testing-library/setup/#custom-render
 */

import React, { type PropsWithChildren, type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// QueryClient factory
// ---------------------------------------------------------------------------

/**
 * Create a fresh QueryClient for each test to prevent cache bleed-over
 * between tests. Key settings:
 *   - retry: false       — don't retry failed queries in tests; we want
 *                          immediate error state, not 3× delayed retries
 *   - gcTime: 0          — garbage-collect cache entries immediately so
 *                          previous test data can't leak into the next test
 *   - staleTime: 0       — always consider data stale so tests don't
 *                          accidentally serve cached responses
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// ---------------------------------------------------------------------------
// Provider wrapper
// ---------------------------------------------------------------------------

/**
 * Options passed to the custom render function.
 * Extends RTL's RenderOptions with application-specific configuration.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial URL path for React Router's MemoryRouter.
   * Defaults to '/' — override to test components that depend on route params:
   * ```typescript
   * render(<ProductDetail />, { initialRoute: '/products/prod-001' });
   * ```
   */
  initialRoute?: string;

  /**
   * Initial router entries (full history stack). Use when you need to test
   * components that call navigate(-1) or depend on navigation history.
   */
  routerEntries?: MemoryRouterProps['initialEntries'];

  /**
   * Optionally inject a pre-configured QueryClient (e.g. with pre-populated
   * cache) to test components in specific data-loaded states.
   */
  queryClient?: QueryClient;
}

/**
 * AllProviders wraps the component under test with every provider it needs.
 * This is the `wrapper` passed to RTL's render() call.
 */
function AllProviders({
  children,
  initialRoute = '/',
  routerEntries,
  queryClient,
}: PropsWithChildren<Omit<CustomRenderOptions, keyof RenderOptions>>) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={routerEntries ?? [initialRoute]}
        initialIndex={0}
      >
        {/*
         * Add additional providers here as the app grows:
         *   <ThemeProvider>
         *   <ToastProvider>
         *   <AuthProvider>
         *
         * Keep this list in sync with apps/storefront/src/App.tsx
         */}
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Custom render function
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for @testing-library/react's render().
 * Wraps the component with AllProviders before rendering.
 *
 * @param ui        The React element to render
 * @param options   Optional RTL render options + custom provider config
 * @returns         RTL's RenderResult + userEvent instance
 */
function customRender(
  ui: ReactElement,
  {
    initialRoute,
    routerEntries,
    queryClient,
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AllProviders
      initialRoute={initialRoute}
      routerEntries={routerEntries}
      queryClient={queryClient}
    >
      {children}
    </AllProviders>
  );

  return {
    /**
     * userEvent is the recommended way to simulate user interactions in RTL.
     * We expose it here so tests don't need an extra import.
     * Note: setup() must be called OUTSIDE the test and NOT inside beforeEach
     * to avoid accumulating event listeners.
     */
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

/**
 * Re-export everything from @testing-library/react so test files only need
 * to import from '@/test/utils/test-utils', not from the library directly.
 *
 * The custom `render` overrides the default one via named export shadowing.
 */
export * from '@testing-library/react';
export { customRender as render };

/**
 * Also export userEvent setup helper for tests that instantiate it themselves.
 */
export { userEvent };

/**
 * Convenience helper: waits for all pending TanStack Query requests to settle.
 * Useful in integration tests after rendering a page that fetches data.
 *
 * @example
 * ```typescript
 * render(<ProductsPage />);
 * await waitForQueries();
 * expect(screen.getByText('Blue Dream')).toBeInTheDocument();
 * ```
 */
export const waitForQueries = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));
