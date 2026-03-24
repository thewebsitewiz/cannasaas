'use client';

import { useQuery } from '@tanstack/react-query';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';

const PRODUCTS_QUERY = `
  query Products($dispensaryId: ID!, $limit: Int, $offset: Int) {
    products(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
      id name strainName strainType description
      thcPercent cbdPercent effects flavors
      variants { variantId name retailPrice }
    }
  }
`;

export interface SearchFilters {
  search?: string;
  strainType?: string;
  effects?: string[];
  minThc?: number;
  maxThc?: number;
  sortBy?: string;
  limit?: number;
  offset?: number;
}

export function useProductSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['productSearch', filters],
    queryFn: () =>
      gql<{ products: any[] }>(PRODUCTS_QUERY, {
        dispensaryId: DEFAULT_DISPENSARY_ID,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      }),
    select: (data) => {
      let products = data.products || [];
      // Client-side filtering
      if (filters.strainType) {
        products = products.filter((p: any) => p.strainType === filters.strainType);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        products = products.filter((p: any) =>
          p.name?.toLowerCase().includes(q) || p.strainName?.toLowerCase().includes(q)
        );
      }
      return { products, total: products.length };
    },
  });
}

export function useAutocomplete(query: string) {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: () =>
      gql<{ products: any[] }>(PRODUCTS_QUERY, {
        dispensaryId: DEFAULT_DISPENSARY_ID,
        limit: 5,
      }),
    select: (data) => {
      const q = query.toLowerCase();
      return (data.products || []).filter((p: any) =>
        p.name?.toLowerCase().includes(q)
      );
    },
    enabled: query.length >= 2,
  });
}
