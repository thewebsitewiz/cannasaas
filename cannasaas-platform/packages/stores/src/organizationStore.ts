import { create } from 'zustand';

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Company {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  licenseNumber?: string;
}

export interface Dispensary {
  id: string;
  companyId: string;
  organizationId: string;
  name: string;
  slug: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  licenseType?: 'medical' | 'recreational' | 'medical_recreational';
  operatingHours?: Record<string, { open: string; close: string }>;
}

export interface BrandingConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
}

interface OrganizationState {
  // Current tenant context
  organization: Organization | null;
  company: Company | null;
  dispensary: Dispensary | null;
  branding: BrandingConfig | null;

  // Loading state
  isResolved: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTenantContext: (
    org: Organization,
    company: Company | null,
    dispensary: Dispensary | null,
  ) => void;
  setBranding: (branding: BrandingConfig) => void;
  setDispensary: (dispensary: Dispensary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Helpers — return headers for API calls
  getTenantHeaders: () => Record<string, string>;
}

const initialState = {
  organization: null,
  company: null,
  dispensary: null,
  branding: null,
  isResolved: false,
  isLoading: false,
  error: null,
};

export const useOrganizationStore = create<OrganizationState>()((set, get) => ({
  ...initialState,

  setTenantContext: (org, company, dispensary) =>
    set({
      organization: org,
      company,
      dispensary,
      isResolved: true,
      isLoading: false,
      error: null,
    }),

  setBranding: (branding) => set({ branding }),

  setDispensary: (dispensary) => set({ dispensary }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),

  getTenantHeaders: () => {
    const { organization, company, dispensary } = get();
    const headers: Record<string, string> = {};

    if (organization) headers['X-Organization-Id'] = organization.id;
    if (company) headers['X-Company-Id'] = company.id;
    if (dispensary) headers['X-Dispensary-Id'] = dispensary.id;

    return headers;
  },
}));
