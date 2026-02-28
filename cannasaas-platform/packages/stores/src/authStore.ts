import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -------------------------------------------------
// Types
// -------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  refreshToken: string | null;
  // NOTE: accessToken is intentionally NOT persisted
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

// ---------------------------------------------------
// Store
// ---------------------------------------------------

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      refreshToken: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'cannasaas-auth',
      // Only persist user and refreshToken — never the accessToken
      partialize: (state) =>
        ({
          user: state.user,
          refreshToken: state.refreshToken,
        }) as AuthState,
    },
  ),
);

// --------------------------------------------------------
// Selectors
// ----------------------------------------------------------

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) =>
  state.isAuthenticated;
export const selectUserRoles = (state: AuthState) => state.user?.roles ?? [];
export const selectHasRole = (role: string) => (state: AuthState) =>
  state.user?.roles.includes(role) ?? false;
