import { create } from 'zustand';

interface OrganizationState {
  orgId: string | null;
  orgName: string | null;
  themeId: string | null;
  setOrg: (orgId: string, orgName: string) => void;
  setThemeId: (themeId: string) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  orgId: null,
  orgName: null,
  themeId: null,
  setOrg: (orgId, orgName) => set({ orgId, orgName }),
  setThemeId: (themeId) => set({ themeId }),
}));
