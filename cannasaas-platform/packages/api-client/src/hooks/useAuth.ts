// packages/api-client/src/hooks/useAuth.ts
// Consumed by Part 5: LoginPage imports useLogin from '@cannasaas/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useAuthStore } from '@cannasaas/stores';
import type { User, LoginFormValues } from '@cannasaas/types';

// ── Login ─────────────────────────────────────────────────────────────────────
interface LoginResponse {
  accessToken: string;
  user: User;
}

/**
 * useLogin — Mutation that exchanges credentials for an access token.
 *
 * On success:
 *  - Populates authStore (user + accessToken)
 *  - The httpOnly refresh token cookie is set automatically by the API
 *
 * On failure:
 *  - Throws so LoginPage.onSubmit can catch and display a root form error
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials,
      );
      return data;
    },
    onSuccess: ({ user, accessToken }) => {
      useAuthStore.getState().setAuth(user, accessToken);
    },
  });
}

// ── Register ──────────────────────────────────────────────────────────────────
interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/register',
        payload,
      );
      return data;
    },
    onSuccess: ({ user, accessToken }) => {
      useAuthStore.getState().setAuth(user, accessToken);
    },
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Tell the API to invalidate the httpOnly refresh token cookie
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      // Always clear local state regardless of API response
      useAuthStore.getState().clearAuth();
      // Wipe all cached server data — prevents data leakage between sessions
      queryClient.clear();
    },
  });
}

// ── Current User (server-side re-validation) ──────────────────────────────────
export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: User }>('/auth/me');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    // On success keep the store in sync if profile data changed server-side
    select: (user) => {
      useAuthStore.getState().updateUser(user);
      return user;
    },
  });
}
