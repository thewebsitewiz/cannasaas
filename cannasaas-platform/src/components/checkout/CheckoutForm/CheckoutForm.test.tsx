/**
 * @file src/components/checkout/CheckoutForm/CheckoutForm.test.tsx
 * @description Component tests for the CheckoutForm.
 *
 * Coverage:
 *   ✅ Renders all required fields
 *   ✅ Shows validation errors for empty required fields
 *   ✅ Does not call onSubmit when form is invalid
 *   ✅ Calls onSubmit with correct data for a valid pickup order
 *   ✅ Shows address fields when "delivery" is selected
 *   ✅ Validates required address fields for delivery orders
 *   ✅ Calls onSubmit with address data for valid delivery order
 *   ✅ Displays server error above the form
 *   ✅ Shows loading state while submitting
 *   ✅ Error summary is rendered and accessible on validation failure
 *
 * @see src/components/checkout/CheckoutForm/CheckoutForm.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { CheckoutForm } from './CheckoutForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

/** Fills out the minimum valid pickup form */
async function fillPickupForm(user: ReturnType<typeof import('@testing-library/user-event').default.setup>) {
  await user.type(screen.getByLabelText(/first name/i), 'Jane');
  await user.type(screen.getByLabelText(/last name/i), 'Doe');
  await user.type(screen.getByLabelText(/phone number/i), '555-867-5309');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CheckoutForm — rendering', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
    render(<CheckoutForm onSubmit={mockOnSubmit} />);
  });

  it('should render the First Name field', () => {
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it('should render the Last Name field', () => {
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it('should render the Phone Number field', () => {
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('should render the Place Order button', () => {
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('should default to "pickup" order type', () => {
    const pickupRadio = screen.getByRole('radio', { name: /pickup/i });
    expect(pickupRadio).toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('CheckoutForm — validation', () => {
  it('should show error messages when submitting an empty form', async () => {
    const { user } = render(<CheckoutForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show a First Name error when the field is empty', async () => {
    const { user } = render(<CheckoutForm onSubmit={mockOnSubmit} />);

    // Only fill last name and phone
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '555-000-0000');
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/first name.*required/i),
      ).toBeInTheDocument();
    });
  });

  it('should not show address errors when order type is pickup', async () => {
    const { user } = render(<CheckoutForm onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(screen.queryByText(/street address/i)).not.toBeInTheDocument();
    });
  });

  it('should require address fields when delivery is selected', async () => {
    const { user } = render(<CheckoutForm onSubmit={mockOnSubmit} />);

    // Switch to delivery
    await user.click(screen.getByRole('radio', { name: /delivery/i }));
    // Fill customer details but not address
    await fillPickupForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      // Street address is required for delivery
      expect(
        screen.getByText(/street.*required/i),
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Valid submission
// ---------------------------------------------------------------------------

describe('CheckoutForm — valid submission', () => {
  it('should call onSubmit with correct data for a valid pickup order', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<CheckoutForm onSubmit={handleSubmit} />);

    await fillPickupForm(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          orderType: 'pickup',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '555-867-5309',
        }),
      );
    });
  });

  it('should call onSubmit with address data for a valid delivery order', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<CheckoutForm onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('radio', { name: /delivery/i }));
    await fillPickupForm(user);

    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Brooklyn');
    await user.selectOptions(screen.getByLabelText(/state/i), 'NY');
    await user.type(screen.getByLabelText(/zip code/i), '11201');

    await user.click(screen.getByRole('button', { name: /place order/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          orderType: 'delivery',
          address: expect.objectContaining({
            street: '123 Main St',
            city: 'Brooklyn',
            state: 'NY',
            zip: '11201',
          }),
        }),
      );
    });
  });
});

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

describe('CheckoutForm — states', () => {
  it('should show the Place Order button in loading state when isSubmitting', () => {
    render(<CheckoutForm onSubmit={mockOnSubmit} isSubmitting />);
    const btn = screen.getByRole('button', { name: /placing.*order/i });
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('should display a server error above the form', () => {
    render(
      <CheckoutForm
        onSubmit={mockOnSubmit}
        serverError="Flower limit exceeded: 3.5oz of 3oz max"
      />,
    );
    expect(
      screen.getByText(/flower limit exceeded/i),
    ).toBeInTheDocument();
  });

  it('should toggle address section visibility when order type changes', async () => {
    const { user } = render(<CheckoutForm onSubmit={mockOnSubmit} />);

    // Initially hidden (pickup selected)
    const addressSection = screen.getByRole('group', { name: /delivery address/i });
    // aria-hidden when not delivery
    expect(addressSection).toHaveAttribute('aria-hidden', 'true');

    // Switch to delivery
    await user.click(screen.getByRole('radio', { name: /delivery/i }));

    await waitFor(() => {
      expect(addressSection).toHaveAttribute('aria-hidden', 'false');
    });
  });
});
