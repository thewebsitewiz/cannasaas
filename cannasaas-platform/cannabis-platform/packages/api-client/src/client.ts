import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: (import.meta as Record<string, Record<string, string>>).env?.VITE_API_URL
      ?? 'http://localhost:3000/v1',
    timeout: 15_000,
    withCredentials: true, // Sends httpOnly cookie for refresh token
  });

  // Request interceptor — attach auth + tenant headers
  client.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    const { tenant }      = useOrganizationStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenant?.organizationId) {
      config.headers['X-Organization-Id'] = tenant.organizationId;
    }
    if (tenant?.dispensaryId) {
      config.headers['X-Dispensary-Id'] = tenant.dispensaryId;
    }

    return config;
  });

  // Response interceptor — transparent token refresh with request queuing
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(client(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await client.post<{ accessToken: string }>(
            '/auth/refresh',
          );
          const { accessToken } = data;
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            accessToken,
          );
          processQueue(null, accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          window.location.href = '/auth/login?session=expired';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
