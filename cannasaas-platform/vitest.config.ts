/**
 * @file vitest.config.ts
 * @description Root Vitest configuration for CannaSaas monorepo.
 *
 * Key choices:
 *   - environment: 'jsdom'  — renders React components in a browser-like DOM
 *   - globals: true         — exposes describe/it/expect without explicit imports,
 *                             matching Jest ergonomics and the project guide examples
 *   - setupFiles            — runs once per test file BEFORE the test suite;
 *                             sets up MSW, custom matchers, and jsdom extensions
 *   - coverage              — Istanbul via v8; excludes infra/config files
 *   - alias '@'             — mirrors the tsconfig path alias so imports resolve
 *
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(), // Transforms JSX and handles React Fast Refresh in tests
  ],

  test: {
    /**
     * Expose Vitest globals (describe, it, expect, vi, beforeEach …) without
     * an explicit import in each file. Requires "types": ["vitest/globals"]
     * in tsconfig.json so TypeScript resolves the types.
     */
    globals: true,

    /**
     * jsdom simulates a browser environment — window, document, localStorage,
     * fetch etc. Required for React Testing Library.
     */
    environment: 'jsdom',

    /**
     * Runs before each test FILE (not each test case). Order matters:
     *   1. setup.ts — configures MSW, extends expect(), polyfills
     */
    setupFiles: ['./src/test/setup.ts'],

    /**
     * Coverage configuration. Run with: pnpm test:coverage
     * Thresholds are intentionally set to 80% to encourage good coverage
     * without blocking development in the early MVP sprints.
     */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',   // re-export barrels don't need direct tests
        'e2e/',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
      },
    },

    /**
     * Limit concurrent test workers to avoid race conditions with shared
     * MSW handler state during integration tests.
     */
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: false },
    },
  },

  resolve: {
    alias: {
      /** Mirrors tsconfig.json "paths": { "@/*": ["./src/*"] } */
      '@': path.resolve(__dirname, './src'),
    },
  },
});
