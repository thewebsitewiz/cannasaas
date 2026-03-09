import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import type { LoginInput } from './dto/login.input';
import type { RegisterInput } from './dto/register.input';
import type { AuthToken } from './dto/auth-token.type';

const REFRESH_COOKIE = 'refresh_token';
const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  private readonly refreshSecret: string;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessTtl    = this.config.get<number>('jwt.accessTtl')  ?? 900;
    this.refreshTtl   = this.config.get<number>('jwt.refreshTtl') ?? 604800;
    this.refreshSecret = this.config.getOrThrow<string>('jwt.refreshSecret');
  }

  async register(input: RegisterInput): Promise<AuthToken> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.users.create(input.email, passwordHash);
    return this.buildTokens(user.id, user.email, user.role);
  }

  async login(input: LoginInput): Promise<AuthToken> {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    return this.buildTokens(user.id, user.email, user.role);
  }

  async refreshTokens(req: Request, res: Response): Promise<void> {
    const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
    if (!token) { res.status(401).json({ message: 'No refresh token' }); return; }
    try {
      const payload = this.jwt.verify<{ sub: string; email: string; role: string }>(
        token, { secret: this.refreshSecret },
      );
      const tokens = this.buildTokens(payload.sub, payload.email, payload.role);
      this.setRefreshCookie(res, tokens.refreshToken!);
      res.json({ accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
    } catch { res.status(401).json({ message: 'Invalid refresh token' }); }
  }

  private buildTokens(sub: string, email: string, role: string): AuthToken {
    const payload = { sub, email, role };
    const accessToken  = this.jwt.sign(payload, { expiresIn: this.accessTtl });
    const refreshToken = this.jwt.sign(payload, { secret: this.refreshSecret, expiresIn: this.refreshTtl });
    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.config.get('nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: this.refreshTtl * 1000,
      path: '/v1/auth/refresh',
    });
  }
}
