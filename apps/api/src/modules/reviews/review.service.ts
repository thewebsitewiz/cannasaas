import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReviewService implements OnModuleInit {
  private readonly logger = new Logger(ReviewService.name);
  constructor(@InjectDataSource() private ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL,
        user_id UUID NOT NULL,
        dispensary_id UUID NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        body TEXT,
        effects JSONB,
        helpful_count INT DEFAULT 0,
        is_verified_purchase BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'published',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(product_id, user_id)
      );
    `);
    this.logger.log('product_reviews table ensured');
  }

  async createReview(input: {
    productId: string; userId: string; dispensaryId: string;
    rating: number; title?: string; body?: string; effects?: any;
  }): Promise<any> {
    if (input.rating < 1 || input.rating > 5) throw new BadRequestException('Rating must be 1-5');

    // Check for verified purchase
    const purchases = await this.ds.query(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE o.customer_user_id = $1 AND oi.product_id = $2 AND o.status = 'completed' LIMIT 1`,
      [input.userId, input.productId],
    );

    const [review] = await this.ds.query(
      `INSERT INTO product_reviews (product_id, user_id, dispensary_id, rating, title, body, effects, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating = $4, title = $5, body = $6, effects = $7, updated_at = NOW()
       RETURNING *`,
      [input.productId, input.userId, input.dispensaryId, input.rating, input.title ?? null, input.body ?? null, input.effects ? JSON.stringify(input.effects) : null, purchases.length > 0],
    );
    return review;
  }

  async getReviewsForProduct(productId: string, limit = 20, offset = 0): Promise<any[]> {
    return this.ds.query(
      `SELECT r.*, u.email, u."firstName", u."lastName"
       FROM product_reviews r
       LEFT JOIN users u ON u.user_id = r.user_id
       WHERE r.product_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset],
    );
  }

  async getAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const [result] = await this.ds.query(
      `SELECT COALESCE(AVG(rating), 0) as average, COUNT(*) as count
       FROM product_reviews WHERE product_id = $1 AND status = 'published'`,
      [productId],
    );
    return { average: parseFloat(result.average), count: parseInt(result.count) };
  }

  async markHelpful(reviewId: string): Promise<any> {
    const [review] = await this.ds.query(
      `UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE review_id = $1 RETURNING *`,
      [reviewId],
    );
    return review;
  }

  async moderateReview(reviewId: string, status: string): Promise<any> {
    if (!['published', 'hidden', 'flagged'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    const [review] = await this.ds.query(
      `UPDATE product_reviews SET status = $1, updated_at = NOW() WHERE review_id = $2 RETURNING *`,
      [status, reviewId],
    );
    return review;
  }

  async getMyReviews(userId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT r.*, p.name as product_name
       FROM product_reviews r
       LEFT JOIN products p ON p.id = r.product_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId],
    );
  }
}
