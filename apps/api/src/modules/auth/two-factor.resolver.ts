import { Resolver, Query, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { TwoFactorService } from './two-factor.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@ObjectType()
class TwoFactorSetup {
  @Field() secret!: string;
  @Field() otpauthUrl!: string;
  @Field() qrCodeUrl!: string;
}

@Resolver()
export class TwoFactorResolver {
  constructor(private readonly twoFactor: TwoFactorService) {}

  @Mutation(() => TwoFactorSetup, { name: 'setup2FA' })
  async setup(@CurrentUser() user: JwtPayload): Promise<TwoFactorSetup> {
    return this.twoFactor.generateSecret(user.sub);
  }

  @Mutation(() => Boolean, { name: 'verify2FA' })
  async verify(
    @Args('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.twoFactor.verifyAndEnable(user.sub, code);
  }

  @Mutation(() => Boolean, { name: 'disable2FA' })
  async disable(
    @Args('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.twoFactor.disable(user.sub, code);
  }

  @Query(() => Boolean, { name: 'is2FAEnabled' })
  async isEnabled(@CurrentUser() user: JwtPayload): Promise<boolean> {
    return this.twoFactor.isEnabled(user.sub);
  }
}
