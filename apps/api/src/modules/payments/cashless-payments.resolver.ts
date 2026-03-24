import { Resolver, Query, Mutation, Args, ID, Float, ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { CashlessPaymentsService } from './cashless-payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class PaymentMethodInfo {
  @Field() method!: string;
  @Field() enabled!: boolean;
}

@ObjectType()
class CashlessPaymentResult {
  @Field({ nullable: true }) redirectUrl?: string;
  @Field({ nullable: true }) paymentUrl?: string;
  @Field() referenceId!: string;
}

@Resolver()
export class CashlessPaymentsResolver {
  constructor(private readonly cashless: CashlessPaymentsService) {}

  private guard(user: JwtPayload, dispensaryId: string) {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [PaymentMethodInfo], { name: 'availablePaymentMethods' })
  async getAvailable(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaymentMethodInfo[]> {
    this.guard(user, dispensaryId);
    return this.cashless.getAvailablePaymentMethods(dispensaryId);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CashlessPaymentResult, { name: 'initiateCashlessPayment' })
  async initiate(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('amount', { type: () => Float }) amount: number,
    @Args('provider') provider: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CashlessPaymentResult> {
    this.guard(user, dispensaryId);

    if (provider === 'canpay') {
      const result = await this.cashless.initializeCanPayPayment(orderId, amount);
      return { redirectUrl: result.redirectUrl, referenceId: result.transactionId };
    } else if (provider === 'aeropay') {
      const result = await this.cashless.initializeAeroPayPayment(orderId, amount);
      return { paymentUrl: result.paymentUrl, referenceId: result.referenceId };
    }

    throw new ForbiddenException(`Unknown payment provider: ${provider}`);
  }
}
