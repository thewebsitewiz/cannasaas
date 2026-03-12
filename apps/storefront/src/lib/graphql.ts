import { GraphQLClient } from 'graphql-request';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql';

// Public client — no auth needed for storefront queries
const client = new GraphQLClient(GRAPHQL_URL);

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  return client.request<T>(query, variables);
}

// Hardcoded for dev — in production, this comes from the subdomain/slug
export const DEFAULT_DISPENSARY_ID = 'b406186e-4d6a-425b-b7af-851cde868c5c';
