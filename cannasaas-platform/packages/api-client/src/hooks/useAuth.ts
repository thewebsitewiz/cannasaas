import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, tokenStore } from '../client';
import { endpoints } from '../endpoints';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Fetch the currently-authenticated user's profile */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const { data } = await apiClient.get<User>(endpoints.auth.profile);
      return data;
    },
    // Only run if we have a token stored
    enabled: !!tokenStore.getAccessToken(),
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false, // don't retry 401s endlessly
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

/** Log in — stores tokens and invalidates user query */
export function useLogin(
  options?: UseMutationOptions<AuthResponse, Error, LoginRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await apiClient.post<AuthResponse>(
        endpoints.auth.login,
        credentials,
      );
      return data;
    },
    onSuccess: (data, ...rest) => {
      tokenStore.setAccessToken(data.accessToken);
      tokenStore.setRefreshToken(data.refreshToken);
      // Cache the user so useCurrentUser() returns immediately
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      options?.onSuccess?.(data, ...rest);
    },
    ...options,
  });
}

/** Register a new account — stores tokens on success */
export function useRegister(
  options?: UseMutationOptions<AuthResponse, Error, RegisterRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      const { data } = await apiClient.post<AuthResponse>(
        endpoints.auth.register,
        payload,
      );
      return data;
    },
    onSuccess: (data, ...rest) => {
      tokenStore.setAccessToken(data.accessToken);
      tokenStore.setRefreshToken(data.refreshToken);
      queryClient.setQueryData(authKeys.currentUser(), data.user);
      options?.onSuccess?.(data, ...rest);
    },
    ...options,
  });
}

/** Log out — clears tokens and all cached queries */
export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(endpoints.auth.logout);
      } catch {
        // Server-side logout is best-effort — we always clear locally
      }
    },
    onSettled: (...rest) => {
      tokenStore.clear();
      queryClient.clear();
      options?.onSettled?.(...rest);
    },
    ...options,
  });
}

/** Request a password-reset email */
export function useForgotPassword(
  options?: UseMutationOptions<void, Error, { email: string }>,
) {
  return useMutation({
    mutationFn: async (payload) => {
      await apiClient.post(endpoints.auth.forgotPassword, payload);
    },
    ...options,
  });
}

/** Reset password with token */
export function useResetPassword(
  options?: UseMutationOptions<
    void,
    Error,
    { token: string; password: string }
  >,
) {
  return useMutation({
    mutationFn: async (payload) => {
      await apiClient.post(endpoints.auth.resetPassword, payload);
    },
    ...options,
  });
}

/** Restore session on app load */
export async function restoreSession(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await apiClient.post<{ accessToken: string }>(
      endpoints.auth.refresh,
    );
    tokenStore.setAccessToken(data.accessToken);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
}
