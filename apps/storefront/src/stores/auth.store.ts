import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  ageVerified: boolean;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  ageVerified?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,

      isAuthenticated: () => !!get().token,

      login: async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(err.message || 'Invalid email or password');
        }
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken?: string;
        };
        const payload = JSON.parse(
          atob(data.accessToken.split('.')[1] ?? ''),
        ) as JwtPayload;
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
            ageVerified: payload.ageVerified ?? false,
          },
        });
      },

      register: async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query:
              'mutation($input: RegisterInput!) { register(input: $input) { accessToken } }',
            variables: { input: { email, password } },
          }),
        });
        const json = (await res.json()) as {
          data?: { register?: { accessToken: string } };
          errors?: Array<{ message?: string }>;
        };
        if (json.errors) {
          throw new Error(json.errors[0]?.message || 'Registration failed');
        }
        const token = json.data?.register?.accessToken;
        if (!token) throw new Error('Registration failed');
        const payload = JSON.parse(
          atob(token.split('.')[1] ?? ''),
        ) as JwtPayload;
        set({
          token,
          refreshToken: null,
          user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role ?? 'customer',
            firstName: payload.firstName,
            lastName: payload.lastName,
            ageVerified: false,
          },
        });
      },

      logout: () => set({ token: null, refreshToken: null, user: null }),

      setUser: (user: User) => set({ user }),
    }),
    { name: 'cannasaas-auth' },
  ),
);
