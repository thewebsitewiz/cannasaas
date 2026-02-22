import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ProductReviewsResponse,
  CreateReviewRequest,
  Review,
} from '../types';

// ── Query Keys ──────────────────────────────────────────────────────────────
export const reviewKeys = {
  all: ['reviews'] as const,
  byProduct: (productId: string) =>
    [...reviewKeys.all, 'product', productId] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** Get reviews + summary for a product */
export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: reviewKeys.byProduct(productId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProductReviewsResponse>(
        endpoints.reviews.byProduct(productId),
      );
      return data;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────────

/** Submit a review for a product */
export function useCreateReview(
  productId: string,
  options?: UseMutationOptions<Review, Error, CreateReviewRequest>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Review>(
        endpoints.reviews.create(productId),
        payload,
      );
      return data;
    },
    onSuccess: (...args) => {
      // Refetch reviews to get updated summary (avg rating, count)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.byProduct(productId),
      });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
