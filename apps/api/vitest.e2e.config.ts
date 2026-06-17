import { defineConfig } from 'vitest/config';

/**
 * E2E-test config. Mirrors the old `jest-e2e.config.js`:
 *  - testRegex `.*\.e2e-spec\.ts$`
 *  - 30s timeout (matches the spec-level `beforeAll(..., 30000)` calls)
 *  - single-fork pool so the AppModule + DB + BullMQ are bootstrapped
 *    once per file, never concurrently against the same DB
 *
 * The runtime `require('./*.entity.ts')` issue that originally
 * kept e2e on Jest was fixed by dropping the entity glob in
 * `DatabaseModule` + `AppDataSource` and consuming the explicit
 * `ALL_ENTITIES` barrel — see `src/entities.index.ts`.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./test/vitest-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    isolate: false,
  },
});
