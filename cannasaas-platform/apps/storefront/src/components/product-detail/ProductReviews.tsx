/**
 * @file ProductReviews.tsx
 * @app apps/storefront
 *
 * Product review section — star rating summary + paginated review list.
 *
 * Structure:
 *   ─ Rating summary (average + histogram of 1–5 star distribution)
 *   ─ Review list (author, date, stars, review text, helpful votes)
 *   ─ Pagination (uses useProductReviews hook)
 *
 * Accessibility:
 *   - Stars: aria-label "4.5 out of 5 stars" — not colour/icon only (WCAG 1.1.1)
 *   - Star visual is aria-hidden, text is sr-only with the value
 *   - Review list: <ul> landmark with proper heading hierarchy
 *   - Loading state: aria-busy, skeleton placeholders (WCAG 4.1.3)
 *   - Date: <time dateTime="..."> (WCAG 1.3.1)
 */

import { useState } from 'react';
import { useProductReviews } from '@cannasaas/api-client';

interface ProductReviewsProps {
  productId: string;
  rating?: { average: number; count: number };
}

function StarDisplay({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'lg';
}) {
  const filled = Math.floor(rating);
  const hasHalf = rating - filled >= 0.5;
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          className={[sizeClass, i < filled ? 'text-amber-400' : i === filled && hasHalf ? 'text-amber-300' : 'text-stone-200'].join(' ')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductReviews({ productId, rating }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductReviews(productId, page);
  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;

  if (!rating && !total && !isLoading) return null;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2 id="reviews-heading" className="text-lg font-bold text-stone-900">
        Customer Reviews
      </h2>

      {/* ── Rating summary ─────────────────────────────────────────────────── */}
      {rating && (
        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-stone-900 leading-none">
              {rating.average.toFixed(1)}
            </p>
            <span className="sr-only">out of 5 stars</span>
            <div className="mt-1">
              <StarDisplay rating={rating.average} size="lg" />
            </div>
            <p className="text-xs text-stone-500 mt-1">{rating.count} reviews</p>
          </div>
        </div>
      )}

      {/* ── Review list ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div aria-busy="true" className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 animate-pulse motion-reduce:animate-none">
              <div className="h-4 w-32 bg-stone-100 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-4/5 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul role="list" className="space-y-5 divide-y divide-stone-100">
          {reviews.map((review: any) => (
            <li key={review.id} className="pt-5 first:pt-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{review.authorName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span aria-label={`${review.rating} out of 5 stars`}>
                      <StarDisplay rating={review.rating} />
                    </span>
                    {review.isVerified && (
                      <span className="text-[10px] text-green-600 font-medium border border-green-200 bg-green-50 px-1.5 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
                <time
                  dateTime={review.createdAt}
                  className="text-xs text-stone-400 flex-shrink-0"
                >
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </time>
              </div>
              {review.title && (
                <p className="text-sm font-semibold text-stone-800 mb-1">{review.title}</p>
              )}
              <p className="text-sm text-stone-600 leading-relaxed">{review.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">No reviews yet. Be the first!</p>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex gap-2 justify-center mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg disabled:opacity-40 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
