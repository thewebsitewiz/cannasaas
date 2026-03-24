import { Resolver, Query, Mutation, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { BackInStockService } from './back-in-stock.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class BackInStockSubscription {
  @Field(() => ID) subscription_id!: string;
  @Field(() => ID) user_id!: string;
  @Field(() => ID) product_id!: string;
  @Field(() => ID, { nullable: true }) variant_id?: string;
  @Field(() => ID) dispensary_id!: string;
  @Field() notification_method!: string;
  @Field() notified!: boolean;
  @Field() created_at!: Date;
  @Field({ nullable: true }) product_name?: string;
}

@Resolver()
export class BackInStockResolver {
  constructor(private readonly backInStock: BackInStockService) {}

  @Mutation(() => BackInStockSubscription, { name: 'subscribeBackInStock' })
  async subscribe(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('variantId', { type: () => ID, nullable: true }) variantId: string | null,
    @Args('method', { nullable: true, defaultValue: 'email' }) method: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.backInStock.subscribe(user.sub, productId, variantId, dispensaryId, method);
  }

  @Mutation(() => Boolean, { name: 'unsubscribeBackInStock' })
  async unsubscribe(
    @Args('subscriptionId', { type: () => ID }) subscriptionId: string,
  ): Promise<boolean> {
    return this.backInStock.unsubscribe(subscriptionId);
  }

  @Query(() => [BackInStockSubscription], { name: 'myBackInStockSubscriptions' })
  async mySubscriptions(@CurrentUser() user: JwtPayload): Promise<any[]> {
    return this.backInStock.getSubscriptions(user.sub);
  }
}
