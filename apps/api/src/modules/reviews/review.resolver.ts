import { Resolver, Query, Mutation, Args, ID, Int, Float, ObjectType, Field } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
class ProductReview {
  @Field(() => ID) review_id!: string;
  @Field(() => ID) product_id!: string;
  @Field(() => ID) user_id!: string;
  @Field(() => ID) dispensary_id!: string;
  @Field(() => Int) rating!: number;
  @Field({ nullable: true }) title?: string;
  @Field({ nullable: true }) body?: string;
  @Field(() => GraphQLJSON, { nullable: true }) effects?: any;
  @Field(() => Int) helpful_count!: number;
  @Field() is_verified_purchase!: boolean;
  @Field() status!: string;
  @Field() created_at!: Date;
  @Field() updated_at!: Date;
  @Field({ nullable: true }) email?: string;
  @Field({ nullable: true }) firstName?: string;
  @Field({ nullable: true }) product_name?: string;
}

@ObjectType()
class AverageRating {
  @Field(() => Float) average!: number;
  @Field(() => Int) count!: number;
}

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviews: ReviewService) {}

  @Mutation(() => ProductReview, { name: 'createReview' })
  async createReview(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('rating', { type: () => Int }) rating: number,
    @Args('title', { nullable: true }) title: string,
    @Args('body', { nullable: true }) body: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.reviews.createReview({ productId, userId: user.sub, dispensaryId, rating, title, body });
  }

  @Public()
  @Query(() => [ProductReview], { name: 'productReviews' })
  async productReviews(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<any[]> {
    return this.reviews.getReviewsForProduct(productId, limit, offset);
  }

  @Public()
  @Query(() => AverageRating, { name: 'productAverageRating' })
  async averageRating(
    @Args('productId', { type: () => ID }) productId: string,
  ): Promise<any> {
    return this.reviews.getAverageRating(productId);
  }

  @Mutation(() => ProductReview, { name: 'markReviewHelpful' })
  async markHelpful(
    @Args('reviewId', { type: () => ID }) reviewId: string,
  ): Promise<any> {
    return this.reviews.markHelpful(reviewId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ProductReview, { name: 'moderateReview' })
  async moderateReview(
    @Args('reviewId', { type: () => ID }) reviewId: string,
    @Args('status') status: string,
  ): Promise<any> {
    return this.reviews.moderateReview(reviewId, status);
  }

  @Query(() => [ProductReview], { name: 'myReviews' })
  async myReviews(@CurrentUser() user: JwtPayload): Promise<any[]> {
    return this.reviews.getMyReviews(user.sub);
  }
}
