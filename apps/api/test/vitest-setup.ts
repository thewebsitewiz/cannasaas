import { vi } from 'vitest';

/**
 * Jest → Vitest runtime shim. The ~57 spec files inherited from the
 * pre-tech-debt-#11 codebase call `jest.fn()` / `jest.spyOn()` /
 * `jest.restoreAllMocks()` everywhere. Rather than codemod each call
 * site, alias `globalThis.jest` to Vitest's `vi`. Their API surfaces
 * overlap enough that the cases used in this repo (mock factories,
 * call inspection, restore) just work.
 *
 * Note: `jest.mock('module', factory)` cannot be aliased because
 * Vitest only hoists calls to the literal identifier `vi.mock(...)`.
 * Those 4 sites were codemodded by hand; this shim covers the rest.
 *
 * Type-side: `@types/jest` stays in `devDependencies` so the
 * compile-time `jest.Mock`, `jest.SpyInstance`, etc. references in
 * specs continue to resolve.
 */
(globalThis as unknown as { jest: typeof vi }).jest = vi;
