import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as schema from '../../database/schema';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { Role } from './enums/role.enum';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DB,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterInput, meta?: { userAgent?: string; ipAddress?: string }) {
    const [existing] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email));
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email: dto.email,
        passwordHash,
        role: Role.CUSTOMER,
      })
      .returning();

    return this.generateTokens(user, meta);
  }

  async login(dto: LoginInput, meta?: { userAgent?: string; ipAddress?: string }) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, dto.email));
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    return this.generateTokens(user, meta);
  }

  async refresh(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const [stored] = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          eq(schema.refreshTokens.tokenHash, tokenHash),
          eq(schema.refreshTokens.isRevoked, false),
        ),
      );

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.db
      .update(schema.refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, stored.id));

    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateTokens(user);
  }

  async logout(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.db
      .update(schema.refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          eq(schema.refreshTokens.tokenHash, tokenHash),
        ),
      );
  }

  async logoutAll(userId: string) {
    await this.db
      .update(schema.refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          eq(schema.refreshTokens.isRevoked, false),
        ),
      );
  }

  private async generateTokens(user: any, meta?: { userAgent?: string; ipAddress?: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      dispensaryId: user.dispensaryId,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('jwt.secret'),
      expiresIn: this.config.get<number>('jwt.accessTtl', 900),
    });

    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
      dispensaryId: user.dispensaryId,
      organizationId: user.organizationId,
      ...(meta?.userAgent ? { userAgent: meta.userAgent } : {}),
      ...(meta?.ipAddress ? { ipAddress: meta.ipAddress } : {}),
    });

    const expiresIn = this.config.get<number>('jwt.accessTtl', 900);
    return { accessToken, refreshToken: rawRefresh, expiresIn };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
