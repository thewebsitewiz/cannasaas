/**
 * @file e2e/admin-product.spec.ts
 * @description Playwright E2E tests for admin product management.
 *
 * Tests the admin flow:
 *   1. Admin logs in
 *   2. Navigates to the Products management page
 *   3. Creates a new product via the form
 *   4. Verifies the product appears in the admin product list
 *   5. Verifies the product appears in the customer storefront
 *
 * Also tests:
 *   - Role-based access: a "customer" user cannot access /admin
 *   - Product edit and delete flows
 *
 * @see playwright.config.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Admin portal base URL — different app from the storefront */
const ADMIN_BASE = process.env.PLAYWRIGHT_ADMIN_URL ?? 'http://localhost:5174';

/** Seed credentials matching the MSW mock handler */
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
};

const CUSTOMER_CREDENTIALS = {
  email: 'test@example.com',
  password: 'Password123!',
};

// ---------------------------------------------------------------------------
// Helper: log in as admin
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page) {
  await page.goto(`${ADMIN_BASE}/login`);

  await page.getByLabel(/email/i).fill(ADMIN_CREDENTIALS.email);
  await page.getByLabel(/password/i).fill(ADMIN_CREDENTIALS.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL(`${ADMIN_BASE}/dashboard`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Admin — Product Management', () => {

  /**
   * Test: Admin can create a new product
   *
   * Full form completion + submission + verification in the product list.
   */
  test('admin should be able to create a new product', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to Products
    await page.getByRole('link', { name: /products/i }).click();
    await page.waitForURL(`${ADMIN_BASE}/products`);

    // Click "Add Product"
    await page.getByRole('button', { name: /add product/i }).click();

    // Fill the product form
    await page.getByLabel(/product name/i).fill('Test Strain E2E');
    await page.getByLabel(/brand/i).fill('E2E Test Farm');
    await page.getByLabel(/category/i).selectOption('flower');
    await page.getByLabel(/strain type/i).selectOption('sativa');
    await page.getByLabel(/thc content/i).fill('22.5');
    await page.getByLabel(/description/i).fill('Created by Playwright E2E test.');

    // Add a variant
    await page.getByRole('button', { name: /add variant/i }).click();
    await page.getByLabel(/variant name/i).fill('1/8 oz');
    await page.getByLabel(/price/i).fill('42.00');
    await page.getByLabel(/stock quantity/i).fill('50');

    // Submit
    await page.getByRole('button', { name: /save product/i }).click();

    // Should return to the product list with a success toast
    await expect(
      page.getByRole('status', { name: /product created/i }),
    ).toBeVisible();

    // New product should appear in the list
    await expect(page.getByText('Test Strain E2E')).toBeVisible();
  });

  /**
   * Test: New product appears in the customer storefront
   *
   * End-to-end data consistency: what the admin creates, customers can buy.
   * This test opens a second browser context (customer view) to verify.
   */
  test('product created by admin should appear in storefront', async ({ page, context }) => {
    await loginAsAdmin(page);

    // Create the product (abbreviated — full creation tested above)
    await page.goto(`${ADMIN_BASE}/products/new`);
    await page.getByLabel(/product name/i).fill('Storefront Test Bud');
    await page.getByLabel(/brand/i).fill('Verified Farm');
    await page.getByLabel(/category/i).selectOption('flower');
    await page.getByLabel(/thc content/i).fill('20.0');
    await page.getByRole('button', { name: /add variant/i }).click();
    await page.getByLabel(/variant name/i).fill('1g');
    await page.getByLabel(/price/i).fill('15.00');
    await page.getByLabel(/stock quantity/i).fill('100');
    await page.getByRole('button', { name: /save product/i }).click();

    await expect(page.getByRole('status', { name: /product created/i })).toBeVisible();

    // Open storefront in a new tab
    const storefrontPage = await context.newPage();
    await storefrontPage.goto('http://localhost:5173/products');

    // Confirm the age gate
    const confirmBtn = storefrontPage.getByRole('button', { name: /i am 21/i });
    if (await confirmBtn.isVisible()) await confirmBtn.click();

    // The new product should appear
    await expect(storefrontPage.getByText('Storefront Test Bud')).toBeVisible();

    await storefrontPage.close();
  });

  /**
   * Test: Admin can edit an existing product
   */
  test('admin should be able to edit a product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_BASE}/products`);

    // Click the first product's edit button
    await page.getByRole('button', { name: /edit/i }).first().click();

    // Change the description
    const descriptionField = page.getByLabel(/description/i);
    await descriptionField.clear();
    await descriptionField.fill('Updated description by Playwright.');

    await page.getByRole('button', { name: /save/i }).click();

    await expect(
      page.getByRole('status', { name: /product updated/i }),
    ).toBeVisible();
  });

  /**
   * Test: Admin can archive (soft-delete) a product
   * Products are archived, not hard-deleted, to preserve compliance records.
   */
  test('admin should be able to archive a product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${ADMIN_BASE}/products`);

    // Get the count before archiving
    const initialCount = await page.getByRole('article').count();

    // Archive the first product
    await page.getByRole('button', { name: /archive/i }).first().click();

    // Confirm the dialog
    await page.getByRole('button', { name: /confirm archive/i }).click();

    await expect(
      page.getByRole('status', { name: /product archived/i }),
    ).toBeVisible();

    // List should have one fewer item
    await expect(page.getByRole('article')).toHaveCount(initialCount - 1);
  });
});

// ---------------------------------------------------------------------------
// Role-based access control
// ---------------------------------------------------------------------------

test.describe('Admin — RBAC', () => {

  /**
   * Test: Customer users are redirected away from the admin portal
   */
  test('customer user should be redirected from admin dashboard', async ({ page }) => {
    // Log in as a customer (not admin)
    await page.goto(`${ADMIN_BASE}/login`);
    await page.getByLabel(/email/i).fill(CUSTOMER_CREDENTIALS.email);
    await page.getByLabel(/password/i).fill(CUSTOMER_CREDENTIALS.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should be redirected to an access-denied or storefront page
    await expect(page).not.toHaveURL(`${ADMIN_BASE}/dashboard`);

    // An error or "access denied" message should be visible
    await expect(
      page.getByRole('alert', { name: /access denied|not authorized/i }),
    ).toBeVisible();
  });

  /**
   * Test: Unauthenticated requests to admin routes redirect to login
   */
  test('unauthenticated user should be redirected to login', async ({ page }) => {
    // Directly navigate to admin products without logging in
    await page.goto(`${ADMIN_BASE}/products`);

    await page.waitForURL(`${ADMIN_BASE}/login**`);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
