// apps/storefront/src/providers/ThemeBootstrap.tsx
// Glue layer: connects organizationStore branding to ThemeProvider (packages/ui)
import React, { type ReactNode } from 'react';
import { ThemeProvider } from '@cannasaas/ui';
import { useTenantBranding } from '@cannasaas/stores';

interface ThemeBootstrapProps { children: ReactNode; }

export function ThemeBootstrap({ children }: ThemeBootstrapProps) {
  const branding = useTenantBranding();
  return (
    <ThemeProvider branding={branding ?? undefined} defaultColorScheme="system">
      {children}
    </ThemeProvider>
  );
}
