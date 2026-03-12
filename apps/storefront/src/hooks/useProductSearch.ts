'use client';

import { useQuery } from '@tanstack/react-query';
import { gql, DEFAULT_DISPENSARY_ID } from '@/lib/graphql';

const SEARCH_QUERY = `
  query SearchProducts($input: ProductSearchInput!) {
    searchProducts(input: $input) {
      total limit offset
      products {
        id name strainName strainType description effects flavors
        thcPercent cbdPercent isActive
      }
      facets {
        strainTypes { label value count }
        productTypes { label value count }
        effects { label value count }
        flavors { label value count }
        minPrice maxPrice minThc maxThc
      }
    }
  }
`;

const AUTOCOMPLETE_QUERY = `
  query Autocomplete($dispensaryId: ID!, $query: String!) {
    autocompleteProducts(dispensaryId: $dispensaryId, query: $query) {
      id name strainType similarity
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
      gql<{ searchProducts: any }>(SEARCH_QUERY, {
        input: { dispensaryId: DEFAULT_DISPENSARY_ID, ...filters },
      }),
    select: (data) => data.searchProducts,
  });
}

export function useAutocomplete(query: string) {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: () =>
      gql<{ autocompleteProducts: any[] }>(AUTOCOMPLETE_QUERY, {
        dispensaryId: DEFAULT_DISPENSARY_ID,
        query,
      }),
    select: (data) => data.autocompleteProducts,
    enabled: query.length >= 2,
  });
}
