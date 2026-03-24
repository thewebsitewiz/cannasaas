import { GraphQLClient } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql';

// Public client — no auth needed for storefront queries
const publicClient = new GraphQLClient(GRAPHQL_URL);

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  return publicClient.request<T>(query, variables);
}

// Authenticated client — reads token from zustand persisted store
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

// Hardcoded for dev — in production, this comes from the subdomain/slug
export const DEFAULT_DISPENSARY_ID = '45cd244d-7016-4db8-8e88-9c71725340c8';
