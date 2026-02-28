// apps/storefront/src/providers/TenantProvider.tsx
import React, { useEffect, type ReactNode } from 'react';
import { apiClient } from '@cannasaas/api-client';
import { useOrganizationStore, useCurrentTenant } from '@cannasaas/stores';
import type { TenantContext } from '@cannasaas/types';
import { FullPageLoader } from '@cannasaas/ui';

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * TenantProvider resolves the current dispensary from the domain/subdomain
 * and populates the organization store before rendering children.
 *
 * Flow:
 * 1. Read hostname (e.g., shop.greenleafbrooklyn.com)
 * 2. Call GET /tenants/resolve?domain=shop.greenleafbrooklyn.com
 * 3. Receive { organizationId, dispensaryId, brandingConfig, ... }
 * 4. Store in organizationStore
 * 5. Render children — all API calls now have tenant context
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const { setTenant, setResolving, isResolving } = useOrganizationStore();
  const tenant = useCurrentTenant();

  useEffect(() => {
    async function resolveTenant() {
      const hostname = window.location.hostname;

      try {
        const { data } = await apiClient.get<{ data: TenantContext }>(
          '/tenants/resolve',
          { params: { domain: hostname } },
        );
        setTenant(data.data);
      } catch (error) {
        // Dev fallback: use env-configured default dispensary
        const fallbackDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID;
        if (fallbackDispensaryId) {
          setTenant({
            organizationId: import.meta.env.VITE_DEFAULT_ORG_ID,
            organizationName: 'Development',
            dispensaryId: fallbackDispensaryId,
            dispensaryName: 'Dev Dispensary',
            subdomain: 'localhost',
          });
        } else {
          console.error('Tenant resolution failed and no fallback configured');
        }
      } finally {
        setResolving(false);
      }
    }

    resolveTenant();
  }, [setTenant, setResolving]);

  if (isResolving) {
    return <FullPageLoader message="Loading dispensary..." />;
  }

  if (!tenant) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <p className="text-[var(--color-error)]">
          Unable to locate this dispensary. Please check the URL.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
