import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TenantContext, BrandingConfig } from '@cannasaas/types';

interface OrganizationState {
  tenant: TenantContext | null;
  isResolving: boolean;
  setTenant: (tenant: TenantContext) => void;
  updateBranding: (branding: BrandingConfig) => void;
  clearTenant: () => void;
  setResolving: (resolving: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  immer((set) => ({
    tenant: null,
    isResolving: true,

    setTenant: (tenant) => {
      set((state) => {
        state.tenant = tenant;
      });
    },

    updateBranding: (branding) => {
      set((state) => {
        if (state.tenant) {
          state.tenant.brandingConfig = branding;
        }
      });
    },

    clearTenant: () => {
      set((state) => {
        state.tenant = null;
      });
    },

    setResolving: (resolving) => {
      set((state) => {
        state.isResolving = resolving;
      });
    },
  })),
);

export const useCurrentTenant  = () => useOrganizationStore((s) => s.tenant);
export const useTenantBranding = () =>
  useOrganizationStore((s) => s.tenant?.brandingConfig);
