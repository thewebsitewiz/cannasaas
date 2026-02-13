import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { OrdersService } from '../../orders/orders.service';
export declare class ReviewService {
    private reviewRepo;
    private orderService;
    constructor(reviewRepo: Repository<Review>, orderService: OrdersService);
    create(userId: string, dto: {
        productId: string;
        rating: number;
        title: string;
        body: string;
        images?: string[];
    }): Promise<Review>;
    getProductReviews(productId: string, page?: number, limit?: number): Promise<{
        reviews: Review[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getAggregateRating(productId: string): Promise<{
        average: number;
        count: number;
        distribution: {
            5: number;
            4: number;
            3: number;
            2: number;
            1: number;
        };
    }>;
    voteHelpful(reviewId: string, userId: string): Promise<void>;
    moderate(reviewId: string, status: ReviewStatus): Promise<void>;
}
