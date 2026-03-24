import { GraphQLClient } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

const publicClient = new GraphQLClient(GRAPHQL_URL);

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  return publicClient.request<T>(query, variables);
}

export async function gqlAuth<T>(query: string, variables?: Record<string, any>): Promise<T> {
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(localStorage.getItem('cannasaas-auth') || '{}');
      token = stored?.state?.token;
    } catch {}
  }

  const client = new GraphQLClient(GRAPHQL_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return client.request<T>(query, variables);
}

export const DEFAULT_DISPENSARY_ID = 'c0000000-0000-0000-0000-000000000001';
