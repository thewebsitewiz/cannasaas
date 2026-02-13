// cannasaas-api/src/modules/reviews/review.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { OrderService } from '../../orders/orders.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    private orderService: OrderService,
  ) {}

  async create(userId: string, dto: {
    productId: string; rating: number; title: string;
    body: string; images?: string[];
  }) {
    const existing = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) throw new BadRequestException('You already reviewed this product');

    const hasPurchased = await this.orderService.hasUserPurchasedProduct(
      userId, dto.productId);

    const review = this.reviewRepo.create({
      ...dto, userId, verifiedPurchase: hasPurchased,
      status: ReviewStatus.PENDING,
    });
    return this.reviewRepo.save(review);
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { productId, status: ReviewStatus.APPROVED },
      relations: ['user'],
      order: { helpfulVotes: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAggregateRating(productId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'average')
      .addSelect('COUNT(r.id)', 'count')
      .addSelect('SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END)', 'five')
      .addSelect('SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END)', 'four')
      .addSelect('SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END)', 'three')
      .addSelect('SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END)', 'two')
      .addSelect('SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END)', 'one')
      .where('r.productId = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
      distribution: {
        5: parseInt(result.five) || 0, 4: parseInt(result.four) || 0,
        3: parseInt(result.three) || 0, 2: parseInt(result.two) || 0,
        1: parseInt(result.one) || 0,
      },
    };
  }

  async voteHelpful(reviewId: string, userId: string) {
    await this.reviewRepo.increment({ id: reviewId }, 'helpfulVotes', 1);
  }

  async moderate(reviewId: string, status: ReviewStatus) {
    await this.reviewRepo.update(reviewId, { status });
  }
}
