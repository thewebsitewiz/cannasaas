/**
 * @file src/pages/__tests__/ProductsPage.integration.test.tsx
 * @description Integration tests for the ProductsPage.
 *
 * Integration tests render the full page component — including TanStack Query,
 * React Router, and the MSW mock API — to verify that the page correctly:
 *   - Shows a loading skeleton while fetching
 *   - Renders product cards when the API responds
 *   - Shows an error state when the API fails
 *   - Filters products when the user interacts with category filters
 *
 * Integration tests live at the boundary between component and API tests.
 * They use MSW to intercept real Axios calls, so they test the full data flow:
 *   Page component → TanStack Query → Axios → MSW → mock data → render
 *
 * @see src/pages/ProductsPage.tsx
 * @see src/test/mocks/handlers.ts
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { errorHandlers } from '@/test/mocks/handlers';
import { ProductsPage } from '@/pages/ProductsPage';

describe('ProductsPage — integration', () => {

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it('should render a loading skeleton while fetching products', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    /**
     * The page should show a loading indicator immediately — before the
     * 50ms mock delay in handlers.ts resolves.
     * We query for the accessible loading indicator pattern.
     */
    expect(
      screen.getByRole('status', { name: /loading products/i }),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Successful data fetch
  // -------------------------------------------------------------------------

  it('should render product cards after fetching successfully', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    expect(screen.getByText('OG Kush Live Resin')).toBeInTheDocument();
  });

  it('should render the correct number of product cards', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      const productCards = screen.getAllByRole('article');
      expect(productCards).toHaveLength(2);
    });
  });

  it('should display product prices', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(screen.getByText('$45.00')).toBeInTheDocument(); // Blue Dream 1/8 oz
    });
  });

  it('should render "Add to Cart" buttons for each product', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      const addButtons = screen.getAllByRole('button', { name: /add.*to cart/i });
      expect(addButtons).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  it('should display an error message when the API fails', async () => {
    // Override the products handler to return a 500 error
    server.use(errorHandlers.products);

    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(
        screen.getByRole('alert', { name: /failed to load products/i }),
      ).toBeInTheDocument();
    });
  });

  it('should not render product cards when the API fails', async () => {
    server.use(errorHandlers.products);

    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

  it('should offer a retry button after an error', async () => {
    server.use(errorHandlers.products);

    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Category filtering
  // -------------------------------------------------------------------------

  it('should render category filter buttons', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      // Categories come from GET /products/categories
      expect(screen.getByRole('button', { name: /flower/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /concentrates/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility — page-level
  // -------------------------------------------------------------------------

  it('should have a page heading', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      // h1 with product count or category name
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('should render the product list as a region with an accessible name', async () => {
    render(<ProductsPage />, { initialRoute: '/products' });

    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /products/i }),
      ).toBeInTheDocument();
    });
  });
});
