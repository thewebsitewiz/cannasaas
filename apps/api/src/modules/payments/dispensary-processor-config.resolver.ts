import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from './entities/dispensary-payment-processor.entity';
import { DispensaryProcessorConfigService } from './dispensary-processor-config.service';
import { PaymentProcessorTesterService } from './payment-processor-tester.service';

@InputType()
class SetDispensaryProcessorEnabledInput {
  @Field(() => ID) dispensaryId!: string;
  @Field(() => DispensaryProcessorName) processorName!: DispensaryProcessorName;
  @Field() isEnabled!: boolean;
  @Field({ nullable: true }) isSandbox?: boolean;
}

@InputType()
class SetActiveDispensaryProcessorInput {
  @Field(() => ID) dispensaryId!: string;
  @Field(() => DispensaryProcessorName, { nullable: true })
  processorName?: DispensaryProcessorName;
}

@ObjectType()
class ActiveProcessorResult {
  @Field(() => ID) dispensaryId!: string;
  @Field(() => DispensaryProcessorName, { nullable: true })
  activePaymentProcessor?: DispensaryProcessorName;
}

@ObjectType()
class TestProcessorResult {
  @Field() ok!: boolean;
  @Field(() => Int, { nullable: true }) latencyMs?: number;
  @Field({ nullable: true }) errorMessage?: string;
}

@Resolver()
export class DispensaryProcessorConfigResolver {
  constructor(
    private readonly service: DispensaryProcessorConfigService,
    private readonly tester: PaymentProcessorTesterService,
  ) {}

  private guard(user: JwtPayload, dispensaryId: string): void {
    if (
      user.role === 'dispensary_admin' &&
      user.dispensaryId !== dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [DispensaryPaymentProcessor], {
    name: 'dispensaryPaymentProcessors',
  })
  list(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DispensaryPaymentProcessor[]> {
    this.guard(user, dispensaryId);
    return this.service.list(dispensaryId);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ActiveProcessorResult, { name: 'activeDispensaryProcessor' })
  async getActive(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ActiveProcessorResult> {
    this.guard(user, dispensaryId);
    const active = await this.service.getActiveProcessor(dispensaryId);
    return {
      dispensaryId,
      activePaymentProcessor: active ?? undefined,
    };
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => DispensaryPaymentProcessor, {
    name: 'setDispensaryProcessorEnabled',
  })
  setEnabled(
    @Args('input') input: SetDispensaryProcessorEnabledInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<DispensaryPaymentProcessor> {
    this.guard(user, input.dispensaryId);
    return this.service.setEnabled({
      dispensaryId: input.dispensaryId,
      processorName: input.processorName,
      isEnabled: input.isEnabled,
      isSandbox: input.isSandbox,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ActiveProcessorResult, {
    name: 'setActiveDispensaryProcessor',
  })
  async setActive(
    @Args('input') input: SetActiveDispensaryProcessorInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ActiveProcessorResult> {
    this.guard(user, input.dispensaryId);
    const active = await this.service.setActiveProcessor({
      dispensaryId: input.dispensaryId,
      processorName: input.processorName ?? null,
    });
    return {
      dispensaryId: input.dispensaryId,
      activePaymentProcessor: active ?? undefined,
    };
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => TestProcessorResult, { name: 'testDispensaryProcessor' })
  testProcessor(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('processorName', { type: () => DispensaryProcessorName })
    processorName: DispensaryProcessorName,
    @CurrentUser() user: JwtPayload,
  ): Promise<TestProcessorResult> {
    this.guard(user, dispensaryId);
    return this.tester.test(dispensaryId, processorName);
  }
}
