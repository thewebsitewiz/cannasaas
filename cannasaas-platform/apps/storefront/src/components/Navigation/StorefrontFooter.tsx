// apps/storefront/src/components/Navigation/StorefrontFooter.tsx
// STUB — implement in Part 7 follow-up
import React from 'react';
import { useCurrentTenant } from '@cannasaas/stores';

export function StorefrontFooter() {
  const tenant = useCurrentTenant();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} {tenant?.dispensaryName ?? 'CannaSaas'}. For adults 21+ only.
        </p>
      </div>
    </footer>
  );
}
