#!/usr/bin/env zsh
# ================================================================
# CannaSaas — Section 13: Testing Strategy
#
# Writes unit and E2E test files into your monorepo.
# Safe to re-run — existing files are overwritten.
#
# Files written (2):
#   packages/ui/src/components/ProductCard/ProductCard.test.tsx
#   apps/storefront/e2e/purchase-flow.spec.ts
#
# Usage:
#   chmod +x setup-section13-tests.zsh
#   ./setup-section13-tests.zsh                   # ~/cannasaas-platform
#   ./setup-section13-tests.zsh /path/to/repo     # custom root
# ================================================================

set -euo pipefail

PLATFORM_ROOT="${1:-$HOME/cannasaas-platform}"

print -P "%F{green}▶  CannaSaas — Section 13: Testing Strategy%f"
print -P "%F{cyan}   Target root: ${PLATFORM_ROOT}%f"
echo ""

# ── 1. Directories ────────────────────────────────────────────────
mkdir -p "${PLATFORM_ROOT}/apps/storefront/e2e"
mkdir -p "${PLATFORM_ROOT}/packages/ui/src/components/ProductCard"

print -P "%F{green}✓  Directories ready%f"
echo ""

# ── 2. Source files ───────────────────────────────────────────────

# [01/2] packages/ui/src/components/ProductCard/ProductCard.test.tsx
print -P "%F{cyan}  [01/2] components/ProductCard/ProductCard.test.tsx%f"
cat > "${PLATFORM_ROOT}/packages/ui/src/components/ProductCard/ProductCard.test.tsx" << 'FILE_EOF'
// packages/ui/src/components/ProductCard/ProductCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '@cannasaas/types';

const mockProduct: Product = {
  id: 'prod-123',
  dispensaryId: 'disp-456',
  name: 'Blue Dream',
  slug: 'blue-dream',
  description: 'A classic sativa-dominant hybrid',
  brand: 'Premium Farms',
  category: 'flower',
  cannabisInfo: {
    strainType: 'sativa_dominant_hybrid',
    thcContent: 24.5,
    cbdContent: 0.8,
    terpenes: [],
    effects: ['uplifting', 'creative'],
    flavors: ['berry', 'sweet'],
  },
  variants: [
    {
      id: 'var-1',
      productId: 'prod-123',
      name: '1/8 oz',
      sku: 'BD-125',
      weight: 3.5,
      weightUnit: 'g',
      price: 45.00,
      quantity: 24,
      lowStockThreshold: 5,
      isActive: true,
    },
    {
      id: 'var-2',
      productId: 'prod-123',
      name: '1/4 oz',
      sku: 'BD-250',
      weight: 7,
      weightUnit: 'g',
      price: 85.00,
      quantity: 12,
      lowStockThreshold: 3,
      isActive: true,
    },
  ],
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/blue-dream.jpg',
      altText: 'Blue Dream flower close-up showing dense trichomes',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  isActive: true,
  isFeatured: false,
  ageRestricted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderProductCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ProductCard product={mockProduct} {...props} />
    </MemoryRouter>,
  );

describe('ProductCard', () => {
  it('renders product name with link to product detail', () => {
    renderProductCard();

    const link = screen.getByRole('link', { name: /blue dream/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/products/blue-dream');
  });

  it('renders primary product image with descriptive alt text', () => {
    renderProductCard();

    const img = screen.getByAltText('Blue Dream flower close-up showing dense trichomes');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders variant selector when multiple variants exist', () => {
    renderProductCard();

    const group = screen.getByRole('group', { name: /select size/i });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('1/8 oz');
    expect(buttons[1]).toHaveTextContent('1/4 oz');
  });

  it('updates price display when variant is selected', () => {
    renderProductCard();

    // Initially shows first variant price ($45.00)
    expect(screen.getByText('$45.00')).toBeInTheDocument();

    // Click the 1/4 oz variant
    fireEvent.click(screen.getByRole('button', { name: /1\/4 oz/i }));

    // Price should update to $85.00
    expect(screen.getByText('$85.00')).toBeInTheDocument();
  });

  it('calls onAddToCart with correct product and variant', () => {
    const onAddToCart = vi.fn();
    renderProductCard({ onAddToCart });

    const addButton = screen.getByRole('button', { name: /add blue dream to cart/i });
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalledOnce();
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct, mockProduct.variants[0]);
  });

  it('disables add to cart button when product is out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      variants: [{ ...mockProduct.variants[0], quantity: 0 }],
    };

    render(
      <MemoryRouter>
        <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  // WCAG compliance tests
  it('has no accessibility violations', async () => {
    const { container } = renderProductCard();
    const { axe } = await import('@axe-core/react');
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('article has descriptive aria-label', () => {
    renderProductCard();

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Blue Dream'),
    );
  });
});
FILE_EOF

# [02/2] apps/storefront/e2e/purchase-flow.spec.ts
print -P "%F{cyan}  [02/2] e2e/purchase-flow.spec.ts%f"
cat > "${PLATFORM_ROOT}/apps/storefront/e2e/purchase-flow.spec.ts" << 'FILE_EOF'
// apps/storefront/e2e/purchase-flow.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.describe('Purchase Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Bypass age gate for E2E tests
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('cannasaas-age-verified', 'true');
    });
  });

  test('age gate is shown on first visit', async ({ browser }) => {
    const freshPage = await browser.newPage();
    await freshPage.goto('/');

    // Age gate dialog should be visible
    await expect(
      freshPage.getByRole('dialog', { name: /age verification/i }),
    ).toBeVisible();

    // Both confirm and deny buttons should exist
    await expect(
      freshPage.getByRole('button', { name: /i am 21 or older/i }),
    ).toBeVisible();
    await expect(
      freshPage.getByRole('button', { name: /i am under 21/i }),
    ).toBeVisible();

    await freshPage.close();
  });

  test('can navigate product categories', async () => {
    await page.goto('/');

    await page.getByRole('link', { name: /flower/i }).click();

    await expect(page).toHaveURL(/category=flower/);
    await expect(page.getByRole('heading', { name: /flower/i })).toBeVisible();
  });

  test('can add product to cart and proceed to checkout', async () => {
    await page.goto('/products?category=flower');

    // Wait for products to load
    await page.waitForSelector('[role="list"][aria-label="Products"]');

    // Add first available product to cart
    const addButtons = page.getByRole('button', { name: /add .* to cart/i });
    await addButtons.first().click();

    // Cart count badge should update
    const cartLink = page.getByRole('link', { name: /cart with \d+ item/i });
    await expect(cartLink).toBeVisible();

    // Go to cart
    await cartLink.click();
    await expect(
      page.getByRole('heading', { name: /your cart/i }),
    ).toBeVisible();

    // Proceed to checkout (requires login)
    await page.getByRole('button', { name: /proceed to checkout/i }).click();

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('keyboard navigation through product grid works correctly', async () => {
    await page.goto('/products');
    await page.waitForSelector('[role="list"][aria-label="Products"]');

    // Tab to first product's add-to-cart button
    await page.keyboard.press('Tab');
    // Continue tabbing until we reach an add-to-cart button
    let attempts = 0;
    while (attempts < 20) {
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      );
      if (focused?.includes('Add') && focused?.includes('to cart')) break;
      await page.keyboard.press('Tab');
      attempts++;
    }

    // Activate it with Enter
    await page.keyboard.press('Enter');

    // Cart count should increase
    await expect(
      page.getByRole('link', { name: /cart with 1 item/i }),
    ).toBeVisible();
  });

  test('accessibility: page has no critical violations', async () => {
    await page.goto('/products');

    // Use axe-playwright for automated accessibility scanning
    const { checkA11y } = await import('axe-playwright');
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});
FILE_EOF

# ── 3. Summary ────────────────────────────────────────────────────
echo ""
print -P "%F{green}✓  Done — 2 files written%f"
echo ""
print -P "%F{cyan}Files written:%f"
echo "  ${PLATFORM_ROOT}/packages/ui/src/components/ProductCard/ProductCard.test.tsx"
echo "  ${PLATFORM_ROOT}/apps/storefront/e2e/purchase-flow.spec.ts"

print -P "%F{yellow}Tip: run 'pnpm test' from the monorepo root to execute unit tests%f"
print -P "%F{yellow}     run 'pnpm exec playwright test' to run E2E tests%f"

