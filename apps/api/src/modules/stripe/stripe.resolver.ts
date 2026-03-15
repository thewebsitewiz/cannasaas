import { Resolver, Mutation, Query, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { StripeService } from './stripe.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class PaymentIntentResult {
  @Field() clientSecret!: string;
  @Field() paymentIntentId!: string;
}

@ObjectType() class PaymentStatus {
  @Field({ nullable: true }) paymentId?: string;
  @Field({ nullable: true }) method?: string;
  @Field(() => Float, { nullable: true }) amount?: number;
  @Field() status!: string;
  @Field({ nullable: true }) stripePaymentIntentId?: string;
}

@ObjectType() class RefundResult {
  @Field() refundId!: string;
  @Field() amount!: string;
  @Field() status!: string;
}

@ObjectType() class StripeStatus {
  @Field() enabled!: boolean;
}

@Resolver()
export class StripeResolver {
  constructor(private readonly stripe: StripeService) {}

  @Query(() => StripeStatus, { name: 'stripeEnabled' })
  @Roles('customer', 'budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin')
  async stripeEnabled(): Promise<StripeStatus> {
    return { enabled: this.stripe.isEnabled() };
  }

  @Mutation(() => PaymentIntentResult, { name: 'createPaymentIntent' })
  @Roles('customer', 'budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin')
  async createPaymentIntent(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('amountCents', { type: () => Int }) amountCents: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaymentIntentResult> {
    return this.stripe.createPaymentIntent(orderId, dispensaryId, amountCents, {
      customerEmail: user.email,
      userId: user.sub,
    });
  }

  @Mutation(() => PaymentStatus, { name: 'confirmPayment' })
  @Roles('customer', 'budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin')
  async confirmPayment(
    @Args('paymentIntentId') paymentIntentId: string,
  ): Promise<any> {
    return this.stripe.confirmPayment(paymentIntentId);
  }

  @Query(() => PaymentStatus, { name: 'paymentStatus' })
  @Roles('customer', 'budtender', 'shift_lead', 'dispensary_admin', 'org_admin', 'super_admin')
  async paymentStatus(
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<any> {
    return this.stripe.getPaymentStatus(orderId);
  }

  @Mutation(() => RefundResult, { name: 'refundPayment' })
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  async refund(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('amountCents', { type: () => Int, nullable: true }) amountCents: number,
    @Args('reason', { nullable: true, defaultValue: 'requested_by_customer' }) reason: string,
  ): Promise<RefundResult> {
    return this.stripe.refundPayment(orderId, amountCents, reason);
  }
}
