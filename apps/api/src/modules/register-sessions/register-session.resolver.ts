import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { RegisterSession } from './entities/register-session.entity';
import { RegisterSessionService } from './register-session.service';

@InputType()
class OpenRegisterSessionGqlInput {
  @Field(() => ID) dispensaryId!: string;
  @Field(() => Int) openingCashCents!: number;
}

@InputType()
class CloseRegisterSessionGqlInput {
  @Field(() => ID) sessionId!: string;
  @Field(() => Int) closingCashCents!: number;
}

@Resolver()
export class RegisterSessionResolver {
  constructor(private readonly service: RegisterSessionService) {}

  private guard(user: JwtPayload, dispensaryId: string): void {
    if (
      user.role === 'dispensary_admin' ||
      user.role === 'org_admin' ||
      user.role === 'super_admin'
    ) {
      return;
    }
    if (!user.dispensaryId || user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => RegisterSession, {
    name: 'myCurrentRegisterSession',
    nullable: true,
  })
  myCurrent(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<RegisterSession | null> {
    this.guard(user, dispensaryId);
    return this.service.myCurrent(dispensaryId, user.sub);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => RegisterSession, { name: 'openRegisterSession' })
  open(
    @Args('input') input: OpenRegisterSessionGqlInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<RegisterSession> {
    this.guard(user, input.dispensaryId);
    return this.service.open({
      dispensaryId: input.dispensaryId,
      userId: user.sub,
      openingCashCents: input.openingCashCents,
    });
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => RegisterSession, { name: 'closeRegisterSession' })
  close(
    @Args('input') input: CloseRegisterSessionGqlInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<RegisterSession> {
    return this.service.close({
      sessionId: input.sessionId,
      userId: user.sub,
      closingCashCents: input.closingCashCents,
    });
  }
}
