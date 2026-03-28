import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../stores/auth.store';

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql';

export function getGraphQLClient(): GraphQLClient {
  const token = useAuthStore.getState().token;
  return new GraphQLClient(GRAPHQL_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  return getGraphQLClient().request<T>(query, variables);
}
