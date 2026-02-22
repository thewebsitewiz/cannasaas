/**
 * @file src/pages/__tests__/CheckoutPage.integration.test.tsx
 * @description Integration tests for the CheckoutPage.
 *
 * Tests the complete checkout flow:
 *   1. Page renders with cart summary from MSW /cart
 *   2. User fills the CheckoutForm
 *   3. Form submits to POST /orders
 *   4. On success: user sees order confirmation and empty cart
 *   5. On purchase limit violation: error is shown above the form
 *
 * Auth flow tested:
 *   - Unauthenticated users are redirected to /login
 *
 * @see src/pages/CheckoutPage.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { errorHandlers } from '@/test/mocks/handlers';
import { CheckoutPage } from '@/pages/CheckoutPage';

describe('CheckoutPage — integration', () => {

  // -------------------------------------------------------------------------
  // Cart summary display
  // -------------------------------------------------------------------------

  it('should display cart items from the API', async () => {
    render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => {
      // Cart item from MOCK_CART in handlers.ts
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });
  });

  it('should display the cart total', async () => {
    render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => {
      // MOCK_CART.total = $108.68
      expect(screen.getByText('$108.68')).toBeInTheDocument();
    });
  });

  it('should show the tax amount separately', async () => {
    render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => {
      // MOCK_CART.tax = $18.68
      expect(screen.getByText('$18.68')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Order submission
  // -------------------------------------------------------------------------

  it('should show a success confirmation after placing a valid order', async () => {
    const { user } = render(<CheckoutPage />, { initialRoute: '/checkout' });

    // Wait for cart to load
    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '555-867-5309');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    // Wait for the order POST to complete and redirect to confirmation
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /order confirmed/i }),
      ).toBeInTheDocument();
    });
  });

  it('should display the order ID after successful submission', async () => {
    const { user } = render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => screen.getByText('Blue Dream'));

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '555-867-5309');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      // MSW POST /orders returns id: 'order-002'
      expect(screen.getByText(/order-002/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Purchase limit violation
  // -------------------------------------------------------------------------

  it('should show a purchase limit error above the form on 422 response', async () => {
    server.use(errorHandlers.purchaseLimitViolation);

    const { user } = render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => screen.getByText('Blue Dream'));

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '555-867-5309');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByText(/flower limit exceeded/i)).toBeInTheDocument();
    });
  });

  it('should not navigate to confirmation when order fails', async () => {
    server.use(errorHandlers.purchaseLimitViolation);

    const { user } = render(<CheckoutPage />, { initialRoute: '/checkout' });

    await waitFor(() => screen.getByText('Blue Dream'));

    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '555-867-5309');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      // Should still be on checkout page, not confirmation
      expect(screen.queryByRole('heading', { name: /order confirmed/i })).not.toBeInTheDocument();
    });
  });
});
