import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { sub: string; email: string; role: string; dispensaryId: string; organizationId: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem('cs_staff_token'),
  user: (() => { try { return JSON.parse(sessionStorage.getItem('cs_staff_user') ?? 'null'); } catch { return null; } })(),
  setAuth: (token, user) => {
    sessionStorage.setItem('cs_staff_token', token);
    sessionStorage.setItem('cs_staff_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    sessionStorage.removeItem('cs_staff_token');
    sessionStorage.removeItem('cs_staff_user');
    set({ token: null, user: null });
  },
}));
