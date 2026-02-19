/**
 * @file adminAuthStore.ts
 * @path apps/admin/src/stores/adminAuthStore.ts
 *
 * Zustand store managing admin portal authentication state.
 *
 * SECURITY NOTE: JWT tokens are stored in httpOnly cookies by the NestJS
 * backend — NOT in localStorage. This store only holds the decoded user
 * profile and a `isAuthenticated` flag derived from a /api/admin/me call.
 * On app mount, `checkSession()` is called to hydrate from the cookie.
 *
 * ROLE HIERARCHY:
 *   super_admin > admin > manager > staff > driver
 * The `hasRole()` helper enforces minimum role checks throughout the app.
 */

import { create } from 'zustand';
import type { AdminUser, AdminRole } from '../types/admin.types';

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_RANK: Record<AdminRole, number> = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  staff: 2,
  driver: 1,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface AdminAuthActions {
  /**
   * Validates the existing session cookie with the backend.
   * Called once on app mount in AdminLayout.
   */
  checkSession: () => Promise<void>;

  /**
   * Sign in with email + password. The backend sets the httpOnly cookie.
   */
  signIn: (email: string, password: string) => Promise<void>;

  /**
   * Clears the session cookie via a backend call, then resets local state.
   */
  signOut: () => Promise<void>;

  /**
   * Returns true if the current user's role is >= the required role.
   * Used by ProtectedRoute and conditional UI rendering.
   */
  hasRole: (requiredRole: AdminRole) => boolean;

  /** Clears any auth error */
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialState: AdminAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAdminAuthStore = create<AdminAuthState & AdminAuthActions>()(
  (set, get) => ({
    ...initialState,

    checkSession: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        if (!res.ok) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }
        const user: AdminUser = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    },

    signIn: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const res = await fetch('/api/admin/auth/sign-in', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const { message } = await res.json();
          set({ error: message ?? 'Invalid credentials', isLoading: false });
          return;
        }
        const user: AdminUser = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ error: 'Network error, please try again', isLoading: false });
      }
    },

    signOut: async () => {
      await fetch('/api/admin/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
      set(initialState);
    },

    hasRole: (requiredRole) => {
      const { user } = get();
      if (!user) return false;
      return ROLE_RANK[user.role] >= ROLE_RANK[requiredRole];
    },

    clearError: () => set({ error: null }),
  }),
);

// ─── Convenience Selectors ────────────────────────────────────────────────────

export const useAdminUser = () => useAdminAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAdminAuthStore((s) => s.isAuthenticated);
export const useHasRole = (role: AdminRole) =>
  useAdminAuthStore((s) => s.hasRole(role));

