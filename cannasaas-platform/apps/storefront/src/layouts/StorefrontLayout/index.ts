/**
 * @file index.ts
 * @path apps/storefront/src/layouts/StorefrontLayout/
 *
 * Barrel export for the StorefrontLayout and its public sub-components.
 *
 * IMPORTANT: Only export what needs to be consumed outside this directory.
 * Internal sub-components (SearchBar, CartButton, etc.) are intentionally
 * NOT re-exported here — they are implementation details of the layout.
 * If another feature needs them, they should be promoted to packages/ui.
 */
export { StorefrontLayout } from './StorefrontLayout';
export type { StorefrontLayoutProps } from './StorefrontLayout';

