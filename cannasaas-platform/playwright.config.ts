/**
 * @file playwright.config.ts
 * @description Playwright end-to-end test configuration for CannaSaas.
 *
 * Playwright tests live in /e2e and exercise the fully rendered React apps
 * against either a local dev server (npm run dev) or a staging environment.
 *
 * Design decisions:
 *   - fullyParallel: true    — each spec file runs in its own worker for speed
 *   - retries: 2 in CI       — handles flaky timing issues in headless runners
 *   - baseURL                — reads from env so the same config works locally
 *                              and in GitHub Actions (set PLAYWRIGHT_BASE_URL)
 *   - webServer              — auto-starts the Vite storefront dev server when
 *                              running locally; CI should start its own server
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  /** Directory containing all *.spec.ts E2E test files */
  testDir: './e2e',

  /**
   * Run tests in parallel across workers. Each worker gets a fresh browser
   * context, so tests are fully isolated.
   */
  fullyParallel: true,

  /**
   * Fail the CI build if any test.only() was accidentally committed.
   * Prevents partial test runs slipping through code review.
   */
  forbidOnly: !!process.env.CI,

  /** Retry flaky tests up to 2 times in CI; no retries locally */
  retries: process.env.CI ? 2 : 0,

  /** Limit to 1 worker in CI to avoid resource contention; auto locally */
  workers: process.env.CI ? 1 : undefined,

  /**
   * Reporter configuration:
   *   - 'html'  — opens a visual report in the browser (great for debugging)
   *   - 'line'  — compact output for terminal
   *   - 'junit' — machine-readable for GitHub Actions / CI dashboards
   */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['line'],
    ...(process.env.CI ? [['junit', { outputFile: 'playwright-results.xml' }] as const] : []),
  ],

  use: {
    /**
     * Base URL — all page.goto('/products') calls resolve relative to this.
     * Override in CI via PLAYWRIGHT_BASE_URL env var.
     */
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',

    /**
     * Capture a screenshot + video only on failure to keep the artefact size
     * manageable while still giving enough context to debug failures.
     */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /**
     * Accessibility: run axe-core checks on every page navigation.
     * Individual tests can opt-out with { accessibility: false } in their
     * use block if the page legitimately cannot meet axe requirements yet.
     */
    // axe is configured per-test via @axe-core/playwright
  },

  /**
   * Projects define which browsers (and viewports) to run tests in.
   * Desktop Chrome + Firefox cover the primary user base; Mobile Safari
   * covers the growing mobile customer segment.
   */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Safari (iPhone 14)',
      use: { ...devices['iPhone 14'] },
    },
  ],

  /**
   * Auto-start the Vite storefront dev server when running locally.
   * In CI the server should be started externally before `playwright test`.
   */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm --filter storefront dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 60_000,
      },
});
