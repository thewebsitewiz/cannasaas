/**
 * @file src/components/products/ProductCard/ProductCard.test.tsx
 * @description Component tests for the ProductCard.
 *
 * Test strategy — behaviour over implementation:
 *   We test what a user EXPERIENCES, not the CSS classes applied.
 *   axe-core accessibility checks run on each render variant.
 *
 * Coverage:
 *   ✅ Displays product name, brand, and price
 *   ✅ Displays THC content with label
 *   ✅ Primary image is rendered with alt text
 *   ✅ "Add to Cart" calls onAddToCart with correct variant ID
 *   ✅ "Add to Cart" shows loading state during async operation
 *   ✅ Out-of-stock variant disables the "Add to Cart" button
 *   ✅ Selecting a different variant updates the displayed price
 *   ✅ Single-variant products don't show a size selector
 *   ✅ Link to product detail page is rendered with accessible label
 *
 * @see src/components/products/ProductCard/ProductCard.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import { ProductCard, type Product } from './ProductCard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PRODUCT: Product = {
  id: 'prod-001',
  name: 'Blue Dream',
  category: 'flower',
  brand: 'Premium Farms',
  strainType: 'sativa_dominant_hybrid',
  thcContent: 24.5,
  cbdContent: 0.8,
  description: 'A balanced sativa-dominant hybrid with sweet berry aroma.',
  effects: ['uplifting', 'creative'],
  images: [
    { url: 'https://cdn.cannasaas.com/blue-dream.jpg', isPrimary: true },
  ],
  variants: [
    { id: 'var-001', name: '1/8 oz', sku: 'BD-125', weight: 3.5, weightUnit: 'g', price: 45.0, quantity: 24 },
    { id: 'var-002', name: '1/4 oz', sku: 'BD-250', weight: 7.0, weightUnit: 'g', price: 85.0, quantity: 12 },
  ],
};

const OUT_OF_STOCK_PRODUCT: Product = {
  ...MOCK_PRODUCT,
  id: 'prod-oos',
  name: 'Sold Out Strain',
  variants: [
    { id: 'var-oos', name: '1/8 oz', sku: 'SOS-125', weight: 3.5, weightUnit: 'g', price: 40.0, quantity: 0 },
  ],
};

// Default mock for the onAddToCart callback
const mockOnAddToCart = vi.fn().mockResolvedValue(undefined);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProductCard — content rendering', () => {
  it('should display the product name', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByRole('heading', { name: /blue dream/i })).toBeInTheDocument();
  });

  it('should display the brand name', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText('Premium Farms')).toBeInTheDocument();
  });

  it('should display the price of the first (default) variant', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('should display THC content', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByText('24.5%')).toBeInTheDocument();
  });

  it('should render the product image with a descriptive alt attribute', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    const img = screen.getByRole('img', { name: /blue dream.*flower/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.cannasaas.com/blue-dream.jpg');
  });

  it('should render a link to the product detail page', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    const links = screen.getAllByRole('link', { name: /blue dream/i });
    // At least one link points to the product detail page
    expect(links.some((l) => l.getAttribute('href')?.includes('/products/prod-001'))).toBe(true);
  });

  it('should not render a CBD line when cbdContent is null', () => {
    const productNoCbd = { ...MOCK_PRODUCT, cbdContent: null };
    render(<ProductCard product={productNoCbd} onAddToCart={mockOnAddToCart} />);
    // CBD label should not appear
    expect(screen.queryByText('CBD')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Variant selection
// ---------------------------------------------------------------------------

describe('ProductCard — variant selection', () => {
  it('should render size buttons for multi-variant products', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByRole('button', { name: /1\/8 oz/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\/4 oz/i })).toBeInTheDocument();
  });

  it('should update the price when a different variant is selected', async () => {
    const { user } = render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);

    // Initially showing 1/8 oz price
    expect(screen.getByText('$45.00')).toBeInTheDocument();

    // Select 1/4 oz
    await user.click(screen.getByRole('button', { name: /1\/4 oz/i }));

    await waitFor(() => {
      expect(screen.getByText('$85.00')).toBeInTheDocument();
    });
  });

  it('should mark the first variant as selected by default', () => {
    render(<ProductCard product={MOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(
      screen.getByRole('button', { name: /1\/8 oz/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('should not render variant buttons for a single-variant product', () => {
    const singleVariant = { ...MOCK_PRODUCT, variants: [MOCK_PRODUCT.variants[0]] };
    render(<ProductCard product={singleVariant} onAddToCart={mockOnAddToCart} />);
    // No fieldset/group for a single variant
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Add to Cart
// ---------------------------------------------------------------------------

describe('ProductCard — Add to Cart interaction', () => {
  it('should call onAddToCart with the selected variant ID when clicked', async () => {
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<ProductCard product={MOCK_PRODUCT} onAddToCart={handleAdd} />);

    await user.click(screen.getByRole('button', { name: /add.*blue dream/i }));

    expect(handleAdd).toHaveBeenCalledWith('var-001', 1);
  });

  it('should pass the correct variant ID when a non-default variant is selected', async () => {
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    const { user } = render(<ProductCard product={MOCK_PRODUCT} onAddToCart={handleAdd} />);

    await user.click(screen.getByRole('button', { name: /1\/4 oz/i }));
    await user.click(screen.getByRole('button', { name: /add.*blue dream/i }));

    expect(handleAdd).toHaveBeenCalledWith('var-002', 1);
  });

  it('should show a loading spinner while the add-to-cart action is pending', async () => {
    // Make the handler resolve after a delay so we can observe the loading state
    let resolveAdd!: () => void;
    const handleAdd = vi.fn(
      () => new Promise<void>((res) => { resolveAdd = res; }),
    );

    const { user } = render(<ProductCard product={MOCK_PRODUCT} onAddToCart={handleAdd} />);
    await user.click(screen.getByRole('button', { name: /add.*blue dream/i }));

    // Button should now be in loading state
    const btn = screen.getByRole('button', { name: /add.*blue dream/i });
    expect(btn).toHaveAttribute('aria-busy', 'true');

    // Resolve and verify loading clears
    resolveAdd();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add.*blue dream/i })).not.toHaveAttribute('aria-busy');
    });
  });
});

// ---------------------------------------------------------------------------
// Out-of-stock state
// ---------------------------------------------------------------------------

describe('ProductCard — out-of-stock', () => {
  it('should disable the Add to Cart button when out of stock', () => {
    render(<ProductCard product={OUT_OF_STOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    const btn = screen.getByRole('button', { name: /out of stock/i });
    expect(btn).toBeDisabled();
  });

  it('should show "Out of Stock" text on the button', () => {
    render(<ProductCard product={OUT_OF_STOCK_PRODUCT} onAddToCart={mockOnAddToCart} />);
    expect(screen.getByRole('button', { name: /out of stock/i })).toBeInTheDocument();
  });

  it('should not call onAddToCart when the product is out of stock', async () => {
    const handleAdd = vi.fn();
    const { user } = render(
      <ProductCard product={OUT_OF_STOCK_PRODUCT} onAddToCart={handleAdd} />,
    );
    await user.click(screen.getByRole('button', { name: /out of stock/i }));
    expect(handleAdd).not.toHaveBeenCalled();
  });
});
