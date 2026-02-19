/**
 * @file adminUiStore.ts
 * @path apps/admin/src/stores/adminUiStore.ts
 *
 * Zustand store for admin portal UI state: sidebar collapse, mobile menu,
 * toast notifications, and global loading overlay.
 *
 * PATTERN: UI state is kept separate from domain state (auth, data) so
 * that domain stores don't re-render the entire layout on every interaction.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Toast Types ──────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Duration in ms. 0 = persist until dismissed. Default: 4000 */
  duration: number;
}

// ─── State & Actions ──────────────────────────────────────────────────────────

interface AdminUiState {
  /** Whether the sidebar is in collapsed (icon-only) mode on desktop */
  isSidebarCollapsed: boolean;
  /** Whether the mobile sidebar drawer is open */
  isMobileNavOpen: boolean;
  /** Active toast notifications */
  toasts: Toast[];
  /** Full-screen loading overlay (e.g., during bulk operations) */
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
}

interface AdminUiActions {
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;

  /**
   * Adds a toast notification. Auto-dismisses after `duration` ms.
   * Returns the toast ID so callers can dismiss it programmatically.
   */
  addToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;

  /** Convenience wrappers for common toast variants */
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
  toastWarning: (message: string) => void;
  toastInfo: (message: string) => void;

  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAdminUiStore = create<AdminUiState & AdminUiActions>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isMobileNavOpen: false,
      toasts: [],
      isGlobalLoading: false,
      globalLoadingMessage: '',

      toggleSidebarCollapsed: () =>
        set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),
      openMobileNav: () => set({ isMobileNavOpen: true }),
      closeMobileNav: () => set({ isMobileNavOpen: false }),

      addToast: (toastData) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const duration = toastData.duration ?? 4000;
        const toast: Toast = { ...toastData, id, duration };
        set((s) => ({ toasts: [...s.toasts, toast] }));

        if (duration > 0) {
          setTimeout(() => get().dismissToast(id), duration);
        }
        return id;
      },

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      toastSuccess: (message) =>
        get().addToast({ message, variant: 'success', duration: 4000 }),
      toastError: (message) =>
        get().addToast({ message, variant: 'error', duration: 6000 }),
      toastWarning: (message) =>
        get().addToast({ message, variant: 'warning', duration: 5000 }),
      toastInfo: (message) =>
        get().addToast({ message, variant: 'info', duration: 4000 }),

      showGlobalLoading: (message = 'Processing…') =>
        set({ isGlobalLoading: true, globalLoadingMessage: message }),
      hideGlobalLoading: () =>
        set({ isGlobalLoading: false, globalLoadingMessage: '' }),
    }),
    {
      name: 'cannasaas-admin-ui',
      // Only persist the sidebar collapse preference
      partialize: (s) => ({ isSidebarCollapsed: s.isSidebarCollapsed }),
    },
  ),
);

// ─── Convenience Selectors ────────────────────────────────────────────────────

export const useToasts = () => useAdminUiStore((s) => s.toasts);
export const useSidebarCollapsed = () =>
  useAdminUiStore((s) => s.isSidebarCollapsed);

