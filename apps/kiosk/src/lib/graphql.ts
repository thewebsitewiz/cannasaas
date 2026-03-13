const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const DISPENSARY_ID = import.meta.env.VITE_DISPENSARY_ID || 'b406186e-4d6a-425b-b7af-851cde868c5c';

export async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
  return json.data;
}
