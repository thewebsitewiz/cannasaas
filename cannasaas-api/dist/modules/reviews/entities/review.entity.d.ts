import { Product } from '../../../products/entities/product.entity';
import { User } from '../../../users/entities/user.entity';
export declare enum ReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Review {
    id: string;
    productId: string;
    product: Product;
    userId: string;
    user: User;
    rating: number;
    title: string;
    body: string;
    verifiedPurchase: boolean;
    status: ReviewStatus;
    helpfulVotes: number;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}
