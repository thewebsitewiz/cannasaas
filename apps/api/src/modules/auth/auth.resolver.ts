import { ForbiddenException } from '@nestjs/common';
import { Mutation, Resolver, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { KioskDevicesService } from './kiosk-devices.service';
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
  constructor(
    private readonly authService: AuthService,
    private readonly kioskDevices: KioskDevicesService,
  ) {}

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

  /**
   * Binds a non-extractable ECDSA P-256 public key (SPKI/PEM) to the
   * calling kiosk device. Called once per provisioning cycle from the
   * kiosk's /setup page after key generation. Subsequent requests from
   * the device must carry an `X-Device-Signature` header signed with
   * the matching private key — see `KioskAttestationGuard`.
   *
   * Re-provisioning the kiosk (via `provisionKiosk`) clears `publicKey`
   * back to null, forcing a fresh attestation on the next /setup.
   */
  @Roles('kiosk')
  @Mutation(() => Boolean, {
    description:
      'Binds an ECDSA P-256 public key (SPKI PEM) to the calling kiosk device.',
  })
  async attestKioskDevice(
    @Args('publicKey') publicKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    await this.kioskDevices.attestPublicKey(user.sub, publicKey);
    return true;
  }
}
