import { create } from 'zustand';
import { useOrganizationStore } from '@cannasaas/stores';

interface AuthState {
  token: string | null;
  user: { sub: string; email: string; role: string; dispensaryId: string; organizationId: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem('cs_token'),
  user: (() => {
    try { return JSON.parse(sessionStorage.getItem('cs_user') ?? 'null'); } catch { return null; }
  })(),
  setAuth: (token, user) => {
    sessionStorage.setItem('cs_token', token);
    sessionStorage.setItem('cs_user', JSON.stringify(user));
    set({ token, user });

    // Hydrate organization store from JWT claims
    if (user?.organizationId) {
      useOrganizationStore.getState().setOrg(user.organizationId, '');
    }
    if (user?.dispensaryId) {
      useOrganizationStore.getState().setDispensary(user.dispensaryId);
    }
  },
  logout: () => {
    sessionStorage.removeItem('cs_token');
    sessionStorage.removeItem('cs_user');
    set({ token: null, user: null });
    useOrganizationStore.getState().reset();
  },
}));

// Hydrate org store on cold start if user already logged in
const _user = useAuthStore.getState().user;
if (_user?.organizationId) {
  useOrganizationStore.getState().setOrg(_user.organizationId, '');
}
if (_user?.dispensaryId) {
  useOrganizationStore.getState().setDispensary(_user.dispensaryId);
}
