/**
 * @file review.ts
 * @package @cannasaas/types
 *
 * Product review and rating types.
 * Reviews are gated behind verified purchase (orderId must reference
 * a completed order containing the reviewed product).
 *
 * Planned endpoints (Sprint 10):
 *   GET  /products/:id/reviews
 *   POST /products/:id/reviews
 *   PUT  /reviews/:id
 *   DELETE /reviews/:id   (Admin+)
 *   POST /reviews/:id/flag
 */

import type { UserSummary } from './user';

// ── Effect Rating ─────────────────────────────────────────────────────────────

/**
 * Structured effect ratings allow the AI recommendation engine
 * (POST /ai/recommendations) to use real customer feedback.
 */
export interface EffectRatings {
  /** 1–5 rating for each common cannabis effect */
  relaxation?: number;
  euphoria?: number;
  creativity?: number;
  focus?: number;
  energy?: number;
  sleepiness?: number;
  /** 1–5 rating for how well it relieved specific symptoms */
  painRelief?: number;
  anxietyRelief?: number;
}

// ── Review ────────────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface Review {
  id: string;
  productId: string;
  variantId?: string | null;

  /** The order that contains this product — enforces verified-purchase gate */
  orderId: string;

  author: UserSummary;
  organizationId: string;
  dispensaryId: string;

  /** Overall star rating 1–5 */
  rating: number;

  /** Optional headline, e.g. "Best Blue Dream I've had" */
  title?: string | null;

  /** Full review body text */
  body?: string | null;

  /** Structured per-effect ratings for AI training */
  effectRatings?: EffectRatings | null;

  /**
   * Moderation status — only 'approved' reviews are shown on the storefront.
   * 'pending' reviews are shown to the author only.
   */
  status: ReviewStatus;

  /** Number of "helpful" upvotes from other customers */
  helpfulCount: number;

  /** Whether the current user has voted this review as helpful */
  currentUserVotedHelpful?: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregated rating summary displayed on the Product Detail page.
 * Returned in the product detail response alongside the product data.
 */
export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  /** Count of reviews per star rating, e.g. { 5: 42, 4: 18, 3: 7, 2: 2, 1: 1 } */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
