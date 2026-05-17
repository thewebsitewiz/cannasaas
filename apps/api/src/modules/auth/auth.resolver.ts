import { ForbiddenException } from '@nestjs/common';
import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { ProvisionKioskInput } from './dto/provision-kiosk.input';
import { AuthToken } from './dto/auth-token.type';
import { KioskProvisionResult } from './dto/kiosk-provision-result.type';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthToken)
  register(@Args('input') input: RegisterInput): Promise<AuthToken> {
    return this.authService.register(input);
  }

  @Public()
  @Mutation(() => AuthToken)
  login(@Args('input') input: LoginInput): Promise<AuthToken> {
    return this.authService.login(input);
  }

  @Roles('super_admin', 'org_admin', 'dispensary_admin')
  @Mutation(() => KioskProvisionResult, {
    description:
      'Issues a long-lived device token for a kiosk terminal. Admin-only; one device per (dispensary, label).',
  })
  provisionKiosk(
    @Args('input') input: ProvisionKioskInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<KioskProvisionResult> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    ) {
      throw new ForbiddenException(
        'dispensary_admin can only provision kiosks for their own dispensary',
      );
    }
    return this.authService.provisionKiosk(input, user.sub);
  }
}
