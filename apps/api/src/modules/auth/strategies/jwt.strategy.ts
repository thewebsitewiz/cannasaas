import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { KioskDevicesService } from '../kiosk-devices.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  dispensaryId?: string;
  organizationId?: string;
  /** Present only on tokens issued by `provisionKiosk` post-sc-192. */
  tokenId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly kioskDevices: KioskDevicesService,
  ) {
    const secret = config.get<string>('jwt.secret');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.role === 'kiosk') {
      const device = await this.kioskDevices.findByUser(payload.sub);
      // Legacy kiosks (seeded service account, no kiosk_devices row) bypass
      // the check. Once a kiosk has been provisioned via the new flow,
      // every subsequent token for that user must match currentTokenId —
      // re-provisioning rotates it and silently revokes prior tokens.
      if (device && device.currentTokenId !== payload.tokenId) {
        throw new UnauthorizedException('Kiosk token revoked');
      }
    }
    return payload;
  }
}
