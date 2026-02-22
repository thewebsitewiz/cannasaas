/**
 * @file organizationStore.ts
 * @path apps/storefront/src/stores/organizationStore.ts
 *
 * Zustand store for the active dispensary tenant's public configuration.
 *
 * WHY ZUSTAND: Zustand is already used across the CannaSaas storefront
 * for lightweight, boilerplate-free global state. This store is initialized
 * once on app boot (via the root loader or an API call) and read from
 * anywhere in the component tree without prop-drilling.
 *
 * MULTI-TENANCY: The `organizationId` is resolved server-side from the
 * request hostname (e.g., "greenpeak.cannasaas.io" → orgId lookup) and
 * injected into the SPA via a `__INITIAL_STATE__` window variable or a
 * dedicated `/api/org/me` endpoint.
 *
 * Usage:
 *   const { organization } = useOrganizationStore();
 *   const logoUrl = useOrganizationStore(s => s.organization?.logoUrl);
 */

import { create } from 'zustand';
import type { Organization } from '@cannasaas/types';

// ─── State Shape ─────────────────────────────────────────────────────────────

interface OrganizationState {
  /** The active tenant's organization record, null until loaded */
  organization: Organization | null;

  /** True while the initial API fetch is in-flight */
  isLoading: boolean;

  /** Non-null when the fetch failed (e.g., network error, 404) */
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface OrganizationActions {
  /**
   * Fetch and hydrate the organization from the API.
   * Idempotent — safe to call multiple times; skips if already loaded.
   *
   * @param organizationId - UUID of the tenant to load
   */
  fetchOrganization: (organizationId: string) => Promise<void>;

  /**
   * Directly set the organization record (useful for SSR hydration
   * from window.__INITIAL_STATE__ without a round-trip fetch).
   */
  setOrganization: (org: Organization) => void;

  /** Reset store to initial state (e.g., on logout or tenant switch) */
  reset: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: OrganizationState = {
  organization: null,
  isLoading: false,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOrganizationStore = create<OrganizationState & OrganizationActions>()(
  (set, get) => ({
    ...initialState,

    fetchOrganization: async (organizationId: string) => {
      // Guard: skip if already loaded with the same org
      if (get().organization?.id === organizationId) return;

      set({ isLoading: true, error: null });

      try {
        const response = await fetch(`/api/organizations/${organizationId}/public`);

        if (!response.ok) {
          throw new Error(`Failed to load organization: ${response.status}`);
        }

        const org: Organization = await response.json();
        set({ organization: org, isLoading: false });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        });
      }
    },

    setOrganization: (org: Organization) => {
      set({ organization: org, isLoading: false, error: null });
    },

    reset: () => set(initialState),
  }),
);

// ─── Selectors (memoized convenience hooks) ───────────────────────────────────

/** Returns only the logo URL and alt text to avoid over-rendering */
export const useOrganizationLogo = () =>
  useOrganizationStore((s) => ({
    logoUrl: s.organization?.logoUrl ?? null,
    logoAlt: s.organization?.logoAlt ?? (s.organization ? `${s.organization.name} logo` : 'Store logo'),
    name: s.organization?.name ?? 'CannaSaas',
  }));

/** Returns store contact details for the footer */
export const useOrganizationContact = () =>
  useOrganizationStore((s) => ({
    name: s.organization?.name ?? '',
    addressLine1: s.organization?.addressLine1 ?? '',
    addressLine2: s.organization?.addressLine2 ?? null,
    city: s.organization?.city ?? '',
    state: s.organization?.state ?? '',
    zip: s.organization?.zip ?? '',
    phone: s.organization?.phone ?? null,
    email: s.organization?.email ?? null,
    hours: s.organization?.hours ?? {},
    social: s.organization?.social ?? {},
    minimumAge: s.organization?.minimumAge ?? 21,
  }));

