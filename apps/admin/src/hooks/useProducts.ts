import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';

const PRODUCTS_QUERY = `
  query AdminProducts($dispensaryId: ID, $search: String, $limit: Int, $offset: Int) {
    adminProducts(dispensaryId: $dispensaryId, search: $search, limit: $limit, offset: $offset) {
      id name strainName strainType metrcItemUid metrcItemCategoryId
      isActive isApproved thcPercent cbdPercent effects flavors
      createdAt updatedAt
    }
    productCount(dispensaryId: $dispensaryId)
  }
`;

export function useProducts(opts?: { search?: string; limit?: number; offset?: number }) {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);

  return useQuery({
    queryKey: ['products', dispensaryId, opts],
    queryFn: () => gqlRequest<{ adminProducts: any[]; productCount: number }>(PRODUCTS_QUERY, {
      dispensaryId, search: opts?.search, limit: opts?.limit ?? 20, offset: opts?.offset ?? 0,
    }),
    enabled: !!dispensaryId,
  });
}
