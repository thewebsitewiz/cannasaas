/**
 * @file authStore.ts
 * @package @cannasaas/stores
 *
 * JWT authentication Zustand store — Phase G complete implementation.
 *
 * ── Architecture overview ────────────────────────────────────────────────────
 *
 * The auth system is split across three layers:
 *
 *   authStore (this file)     — Zustand client-state store
 *     Owns: user object, token references, hydration state
 *     Persists: user + refreshToken to localStorage
 *     Does NOT persist: accessToken (memory only, security)
 *
 *   axiosClient.ts            — Axios interceptors (see @cannasaas/api-client)
 *     Reads: authStore.getState().accessToken for Bearer injection
 *     Reads: organizationStore.getState() for tenant headers
 *     Calls: authStore.getState().setTokens() after a successful refresh
 *     Calls: authStore.getState().logout() after a failed refresh
 *
 *   ProtectedRoute.tsx        — React Router guard
 *     Reads: authStore.isAuthenticated, authStore.isHydrating
 *     Blocks: rendering until isHydrating === false
 *     Redirects: unauthenticated → /login, wrong role → ForbiddenPage
 *
 * ── Token lifecycle ──────────────────────────────────────────────────────────
 *
 *   Login:
 *     authStore.login(user, accessToken, refreshToken)
 *     → accessToken stored in-memory (store state, not localStorage)
 *     → refreshToken + user persisted to localStorage
 *     → isAuthenticated = true
 *
 *   Authenticated request:
 *     Axios interceptor reads accessToken from store
 *     → adds Authorization: Bearer <token> to request headers
 *
 *   Token expiry (401 response):
 *     Axios interceptor calls POST /auth/refresh with refreshToken
 *     → on success: authStore.setTokens(newAccess, newRefresh)
 *     → on failure: authStore.logout() → clears state → redirect to /login
 *
 *   Page refresh:
 *     Zustand persist re-hydrates user + refreshToken from localStorage
 *     → accessToken is GONE (not persisted) — first request will 401 → refresh
 *     → isHydrating goes false after rehydrate, unblocking ProtectedRoute
 *
 * ── isHydrating flag ─────────────────────────────────────────────────────────
 *
 * On initial page load, Zustand persist middleware rehydrates state from
 * localStorage asynchronously. Before rehydration completes, isAuthenticated
 * is false even for logged-in users. ProtectedRoute uses isHydrating to show
 * a loading spinner instead of immediately redirecting to /login.
 *
 * isHydrating starts as true, flips to false in the onRehydrateStorage callback.
 *
 * ── Security notes ───────────────────────────────────────────────────────────
 *
 * Access tokens are intentionally NOT persisted to localStorage:
 *   - They have a short TTL (15 minutes from backend)
 *   - XSS attacks cannot steal them if they only live in memory
 *   - After a page refresh, the first API request will 401 and transparently
 *     refresh using the persisted refreshToken
 *
 * Refresh tokens ARE persisted because without them the user would be logged
 * out every page refresh. They are stored in localStorage (not httpOnly cookie)
 * because the storefront is a SPA. For admin/staff apps this is acceptable
 * given the lower-risk profile; a future enhancement could use httpOnly cookies.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:             string;
  email:          string;
  firstName:      string;
  lastName:       string;
  roles:          string[];
  permissions:    string[];
  organizationId: string;
  dispensaryId?:  string;
  avatarUrl?:     string;
  /** Whether the user's ID has been verified by staff */
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  /** Medical card expiry date (ISO string), if applicable */
  medicalCardExpiry?: string;
  loyaltyPoints?: number;
}

interface AuthState {
  /** Resolved user from the last successful POST /auth/login or /auth/refresh */
  user:             AuthUser | null;
  /**
   * JWT access token — stored in memory only, never persisted.
   * Attached to every API request by the Axios interceptor.
   * After a page refresh this is null; the first 401 triggers a refresh.
   */
  accessToken:      string | null;
  /**
   * JWT refresh token — persisted to localStorage.
   * Used by the Axios interceptor to obtain a new access token on 401.
   */
  refreshToken:     string | null;

  /**
   * True while Zustand persist middleware is rehydrating state from localStorage.
   * ProtectedRoute renders a loading spinner until this is false.
   *
   * This prevents the "flash of login redirect" on page refresh for
   * authenticated users whose state hasn't been reloaded yet.
   */
  isHydrating:      boolean;

  // ── Derived ───────────────────────────────────────────────────────────────
  isAuthenticated:  boolean;

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Called after a successful POST /auth/login response.
   * Stores all three pieces of auth state and marks the user as authenticated.
   */
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;

  /**
   * Called after a successful POST /auth/refresh response.
   * Updates both tokens; user object stays the same.
   */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /**
   * Updates the cached user object (e.g. after PUT /auth/profile).
   */
  setUser: (user: AuthUser) => void;

  /**
   * Clears all auth state and triggers navigation to /login via the
   * `onLogout` callback (set by each app's main.tsx).
   * Called: by logout button clicks, by the Axios interceptor on refresh failure.
   */
  logout: () => void;

  /**
   * Internal — called by Zustand persist onRehydrateStorage to flip isHydrating.
   * Should not be called directly by application code.
   */
  _setHydrated: () => void;

  /**
   * Optional callback invoked by logout().
   * Set by each app's main.tsx to trigger React Router navigation to /login.
   * Decouples the store (non-React) from React Router.
   */
  _onLogout?: () => void;
  setLogoutCallback: (fn: () => void) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isHydrating:     true,    // Starts true — cleared by onRehydrateStorage
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({
          user:            null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
        });
        // Trigger navigation if a callback has been registered
        get()._onLogout?.();
      },

      _setHydrated: () => set({ isHydrating: false }),

      _onLogout: undefined,
      setLogoutCallback: (fn) => set({ _onLogout: fn }),
    }),
    {
      name: 'cannasaas-auth',
      storage: createJSONStorage(() => localStorage),

      /**
       * Only persist user + refreshToken.
       * accessToken is intentionally excluded (security — memory only).
       * isHydrating is excluded because it's purely transient.
       */
      partialize: (state) => ({
        user:         state.user,
        refreshToken: state.refreshToken,
      }),

      /**
       * Called once when Zustand has finished reading from localStorage.
       * Flips isHydrating to false, unblocking ProtectedRoute.
       *
       * The `store` param receives the full store — we call _setHydrated()
       * to update the isHydrating flag.
       */
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },

      /**
       * After rehydration, restore isAuthenticated based on whether we
       * have a persisted user. The accessToken will be null but the first
       * API request will transparently refresh it.
       */
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AuthState>),
        // Re-derive isAuthenticated from the rehydrated user
        isAuthenticated: !!(persisted as Partial<AuthState>)?.user,
        // accessToken is never persisted — always starts null
        accessToken:     null,
        // isHydrating is set false by onRehydrateStorage, not here
      }),
    },
  ),
);
