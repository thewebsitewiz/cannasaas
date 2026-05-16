import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { DispensaryPaymentProcessor } from '../entities/dispensary-payment-processor.entity';
import { AeropayOnboardingService } from './aeropay-onboarding.service';

@InputType()
class ProvisionAeropayInput {
  @Field(() => ID) dispensaryId!: string;
  @Field() merchantId!: string;
  @Field() apiKey!: string;
  @Field({ nullable: true }) isSandbox?: boolean;
}

@Resolver()
export class AeropayOnboardingResolver {
  constructor(private readonly onboarding: AeropayOnboardingService) {}

  private guard(user: JwtPayload, dispensaryId: string): void {
    if (
      user.role === 'dispensary_admin' &&
      user.dispensaryId !== dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryPaymentProcessor, {
    name: 'provisionAeropayForDispensary',
  })
  provision(
    @Args('input') input: ProvisionAeropayInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<DispensaryPaymentProcessor> {
    this.guard(user, input.dispensaryId);
    return this.onboarding.provision({
      dispensaryId: input.dispensaryId,
      merchantId: input.merchantId,
      apiKey: input.apiKey,
      isSandbox: input.isSandbox,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deprovisionAeropayForDispensary' })
  async deprovision(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    this.guard(user, dispensaryId);
    const result = await this.onboarding.deprovision(dispensaryId);
    return result !== null;
  }
}
