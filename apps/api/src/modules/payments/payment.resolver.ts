import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class CashDiscountConfig {
  @Field(() => Float) cashDiscountPercent!: number;
  @Field() isCashEnabled!: boolean;
  @Field() cashDeliveryEnabled!: boolean;
}

@ObjectType()
class CashDiscountPreview {
  @Field(() => Float) discountPercent!: number;
  @Field(() => Float) discountAmount!: number;
  @Field(() => Float) adjustedSubtotal!: number;
}

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly payments: PaymentService) {}

  private guard(user: JwtPayload, dispensaryId: string) {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
  }

  // ── Admin: Get/Set Cash Discount ──────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => CashDiscountConfig, { name: 'cashDiscountConfig' })
  async getConfig(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CashDiscountConfig> {
    this.guard(user, dispensaryId);
    return this.payments.getCashDiscount(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CashDiscountConfig, { name: 'setCashDiscount' })
  async setDiscount(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('percent', { type: () => Float }) percent: number,
    @Args('cashDeliveryEnabled', { nullable: true }) cashDeliveryEnabled: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<CashDiscountConfig> {
    this.guard(user, dispensaryId);
    return this.payments.setCashDiscount(dispensaryId, percent, cashDeliveryEnabled);
  }

  // ── Preview Cash Discount ─────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => CashDiscountPreview, { name: 'previewCashDiscount' })
  async preview(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('subtotal', { type: () => Float }) subtotal: number,
  ): Promise<CashDiscountPreview> {
    return this.payments.calculateCashDiscount(dispensaryId, subtotal);
  }

  // ── Process Cash Payment ──────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Payment, { name: 'processCashPayment' })
  async cashPayment(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('cashTendered', { type: () => Float }) cashTendered: number,
    @Args('applyDiscount', { nullable: true, defaultValue: true }) applyDiscount: boolean,
    @CurrentUser() user: JwtPayload,
  ): Promise<Payment> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.payments.processCashPayment({
      orderId, dispensaryId, cashTendered, staffUserId: user.sub, applyDiscount,
    });
  }

  // ── Process Card Payment ──────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Payment, { name: 'processCardPayment' })
  async cardPayment(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('stripePaymentIntentId') stripePaymentIntentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Payment> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.payments.processCardPayment({ orderId, dispensaryId, stripePaymentIntentId });
  }

  // ── Get Payment ───────────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => Payment, { name: 'orderPayment', nullable: true })
  async getPayment(
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<Payment | null> {
    return this.payments.getPaymentForOrder(orderId);
  }
}
