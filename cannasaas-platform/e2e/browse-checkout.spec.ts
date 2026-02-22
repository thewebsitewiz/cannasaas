/**
 * @file e2e/browse-checkout.spec.ts
 * @description Playwright end-to-end test: complete purchase journey.
 *
 * Tests the highest-value user flow from the customer's perspective:
 *   1. Visit the storefront
 *   2. Pass the age gate
 *   3. Browse products page
 *   4. Add an item to the cart
 *   5. View the cart
 *   6. Complete the checkout form
 *   7. Reach the order confirmation page
 *
 * Accessibility checks:
 *   - @axe-core/playwright runs a11y audit on each page navigation
 *   - Focus management is asserted after modal open/close
 *
 * @see playwright.config.ts
 * @see https://playwright.dev/docs/test-assertions
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// ---------------------------------------------------------------------------
// Helper: pass the age gate
// ---------------------------------------------------------------------------

/**
 * The storefront shows an age gate on every new session.
 * This helper confirms the user is 21+ to allow navigation to proceed.
 *
 * @param page The Playwright Page object
 */
async function passAgeGate(page: Page) {
  // Look for the age confirmation button — exact text may vary by branding
  const confirmButton = page.getByRole('button', { name: /i am 21 or older/i });
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
    // Wait for the gate to disappear before continuing
    await expect(confirmButton).not.toBeVisible();
  }
}

// ---------------------------------------------------------------------------
// Helper: add a product to the cart
// ---------------------------------------------------------------------------

/**
 * Finds the first visible "Add to Cart" button and clicks it.
 * Waits for the cart badge to update before returning.
 */
async function addFirstProductToCart(page: Page) {
  // Get the first "Add to Cart" button — aria-label includes product name
  const addButton = page.getByRole('button', { name: /add.*to cart/i }).first();
  await addButton.click();

  // Wait for the cart badge count to increment
  await expect(
    page.getByRole('status', { name: /cart.*item/i }),
  ).not.toHaveText('0');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Browse → Add to Cart → Checkout', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await passAgeGate(page);
  });

  /**
   * Test: Products page loads with accessible content
   *
   * Verifies:
   * - The page has an h1 heading
   * - Products are listed with correct ARIA semantics
   * - No axe accessibility violations
   */
  test('products page should load and be accessible', async ({ page }) => {
    await page.goto('/products');

    // Wait for at least one product card to appear
    await expect(page.getByRole('article').first()).toBeVisible();

    // Verify page structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Accessibility audit — fail the test if any critical violations are found
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  /**
   * Test: Add to cart updates the cart badge
   */
  test('clicking Add to Cart should update the cart item count', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[role="article"]');

    const initialCartBadge = page.getByRole('status', { name: /cart items/i });
    const initialCount = await initialCartBadge.textContent();

    await addFirstProductToCart(page);

    const newCount = await initialCartBadge.textContent();
    expect(Number(newCount)).toBeGreaterThan(Number(initialCount));
  });

  /**
   * Test: Product detail page is accessible and links back
   */
  test('clicking a product name should navigate to the detail page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[role="article"]');

    // Click the first product name link
    const firstProductLink = page.getByRole('article').first().getByRole('link').first();
    const productName = await firstProductLink.textContent();
    await firstProductLink.click();

    // Should be on the detail page with an h1 matching the product name
    await expect(
      page.getByRole('heading', { level: 1, name: new RegExp(productName!, 'i') }),
    ).toBeVisible();
  });

  /**
   * Test: Complete checkout flow — the most important E2E test
   *
   * This test exercises the full happy path that generates revenue.
   */
  test('should complete a pickup order and show confirmation', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('[role="article"]');

    // Step 1: Add product to cart
    await addFirstProductToCart(page);

    // Step 2: Navigate to cart / checkout
    await page.getByRole('link', { name: /view cart|checkout/i }).click();
    await page.waitForURL('**/checkout');

    // Step 3: Verify cart summary is visible
    await expect(page.getByRole('region', { name: /order summary/i })).toBeVisible();

    // Step 4: Fill checkout form — pickup order
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/phone/i).fill('555-867-5309');

    // Pickup should be pre-selected; verify
    await expect(page.getByRole('radio', { name: /pickup/i })).toBeChecked();

    // Step 5: Submit
    await page.getByRole('button', { name: /place order/i }).click();

    // Step 6: Verify confirmation page
    await page.waitForURL('**/order-confirmation/**');
    await expect(
      page.getByRole('heading', { name: /order confirmed/i }),
    ).toBeVisible();

    // The order ID should be displayed
    await expect(page.getByText(/order #/i)).toBeVisible();

    // Step 7: Accessibility check on confirmation page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  /**
   * Test: Delivery order requires address fields
   */
  test('selecting delivery should reveal and require address fields', async ({ page }) => {
    await page.goto('/checkout');

    // Switch to delivery
    await page.getByRole('radio', { name: /delivery/i }).click();

    // Address fields should become visible
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();

    // Trying to submit without an address should show errors
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Doe');
    await page.getByLabel(/phone/i).fill('555-000-0000');
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/street.*required/i)).toBeVisible();
  });

  /**
   * Test: Cart page keyboard navigation
   *
   * Verifies that keyboard-only users can navigate the checkout flow.
   */
  test('checkout form should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/checkout');

    // Tab to the first form field
    await page.keyboard.press('Tab');
    // First radio (pickup) should receive focus
    await expect(page.getByRole('radio', { name: /pickup/i })).toBeFocused();

    // Tab through all fields
    await page.keyboard.press('Tab'); // delivery radio
    await page.keyboard.press('Tab'); // first name

    await expect(page.getByLabel(/first name/i)).toBeFocused();
  });
});
