import { create } from 'zustand';

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
  },
  logout: () => {
    sessionStorage.removeItem('cs_token');
    sessionStorage.removeItem('cs_user');
    set({ token: null, user: null });
  },
}));
