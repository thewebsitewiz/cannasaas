import { GraphQLClient, ClientError } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

const publicClient = new GraphQLClient(GRAPHQL_URL);

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  return publicClient.request<T>(query, variables);
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(localStorage.getItem('cannasaas-auth') || '{}');
    return stored?.state?.token ?? null;
  } catch {
    return null;
  }
}

function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  // Clear the persisted auth state
  try {
    const stored = JSON.parse(localStorage.getItem('cannasaas-auth') || '{}');
    if (stored.state) {
      stored.state.token = null;
      stored.state.refreshToken = null;
      stored.state.user = null;
      localStorage.setItem('cannasaas-auth', JSON.stringify(stored));
    }
  } catch {}

  // Redirect to login with return path
  const returnPath = window.location.pathname + window.location.search;
  window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}&expired=true`;
}

function isUnauthorizedError(err: unknown): boolean {
  if (err instanceof ClientError) {
    const errors = err.response?.errors;
    if (errors?.some((e: any) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      e.extensions?.status === 401 ||
      e.message === 'Unauthorized'
    )) return true;
  }
  return false;
}

export async function gqlAuth<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getStoredToken();

  if (!token) {
    clearAuthAndRedirect();
    throw new Error('Not authenticated');
  }

  const client = new GraphQLClient(GRAPHQL_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  try {
    return await client.request<T>(query, variables);
  } catch (err) {
    if (isUnauthorizedError(err)) {
      clearAuthAndRedirect();
      throw new Error('Session expired. Please log in again.');
    }
    throw err;
  }
}

export const DEFAULT_DISPENSARY_ID = 'c0000000-0000-0000-0000-000000000001';
