import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './jwt.strategy';

interface RefreshCookies {
  refresh_token?: string;
}

interface RefreshBody {
  refreshToken?: string;
}

export interface JwtRefreshPayload extends JwtPayload {
  rawToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('jwt.refreshSecret');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies as RefreshCookies | undefined)?.refresh_token ?? null,
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtRefreshPayload {
    const cookies = req.cookies as RefreshCookies | undefined;
    const body = req.body as RefreshBody | undefined;
    const rawToken = cookies?.refresh_token ?? body?.refreshToken ?? '';
    return { ...payload, rawToken };
  }
}
