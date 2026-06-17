import { defineConfig } from 'vitest/config';

/**
 * Unit-test config. Mirrors the old `jest.config.js`:
 *  - testRegex `.*\.spec\.ts$`
 *  - moduleNameMapper `^src/(.*)$` → `<rootDir>/src/$1` (Vite 7+
 *    resolves these natively via `resolve.tsconfigPaths: true`).
 *  - `testEnvironment: 'node'`.
 *
 * The legacy specs reference `jest.fn()` / `jest.Mock` at compile time.
 * `test/vitest-setup.ts` aliases `globalThis.jest = vi` at runtime so
 * we don't have to codemod ~50 files; `@types/jest` stays in
 * `devDependencies` for the type-side `jest.Mock` references.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e-spec.ts'],
    setupFiles: ['./test/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.module.ts',
        'src/**/*.entity.ts',
        'src/**/*.input.ts',
        'src/**/*.type.ts',
        'src/main.ts',
      ],
    },
  },
});
