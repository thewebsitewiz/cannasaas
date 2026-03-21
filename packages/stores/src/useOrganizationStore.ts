import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationState {
  orgId: string | null;
  orgName: string | null;
  dispensaryId: string | null;
  themePreset: string | null;

  setOrg: (orgId: string, orgName: string) => void;
  setDispensary: (dispensaryId: string) => void;
  setThemePreset: (preset: string) => void;
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      orgId: null,
      orgName: null,
      dispensaryId: null,
      themePreset: null,

      setOrg: (orgId, orgName) => set({ orgId, orgName }),
      setDispensary: (dispensaryId) => set({ dispensaryId }),
      setThemePreset: (preset) => set({ themePreset: preset }),
      reset: () =>
        set({ orgId: null, orgName: null, dispensaryId: null, themePreset: null }),
    }),
    { name: 'cannasaas-org' },
  ),
);
