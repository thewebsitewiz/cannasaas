import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

// ---------------------------------------------------------------------------
// Token storage helpers — swap these out if you move to cookies / secure store
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'cannasaas_access_token';
const REFRESH_KEY = 'cannasaas_refresh_token';
const TENANT_KEY = 'cannasaas_tenant_id';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  setAccessToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  getTenantId: () => localStorage.getItem(TENANT_KEY),
  setTenantId: (id: string) => localStorage.setItem(TENANT_KEY, id),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TENANT_KEY);
  },
};

// ---------------------------------------------------------------------------
// Create Axios instance
// ---------------------------------------------------------------------------
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT + tenant header
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = tokenStore.getTenantId();
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }

  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — automatic 401 → refresh → retry
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tokenStore.getTenantId() ?? '',
          },
        },
      );

      const newAccessToken: string = data.accessToken;
      tokenStore.setAccessToken(newAccessToken);

      if (data.refreshToken) {
        tokenStore.setRefreshToken(data.refreshToken);
      }

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStore.clear();
      // Emit a custom event so your auth provider can redirect to login
      window.dispatchEvent(new CustomEvent('cannasaas:session-expired'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
