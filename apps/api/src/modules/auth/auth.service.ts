import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { ProvisionKioskInput } from './dto/provision-kiosk.input';
import { KioskProvisionResult } from './dto/kiosk-provision-result.type';
import { Role } from './enums/role.enum';

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokenRepo: Repository<RefreshToken>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(
    dto: RegisterInput,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      role: Role.CUSTOMER,
    });
    await this.userRepo.save(user);
    return this.generateTokens(user, meta);
  }

  async login(
    dto: LoginInput,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.generateTokens(user, meta);
  }

  async refresh(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.tokenRepo.findOne({
      where: { userId, tokenHash, isRevoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.tokenRepo.update(stored.id, {
      isRevoked: true,
      revokedAt: new Date(),
    });
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.generateTokens(user);
  }

  async logout(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.tokenRepo.update(
      { userId, tokenHash },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  async logoutAll(userId: string) {
    await this.tokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Issues a long-lived JWT for a kiosk-role user scoped to a dispensary.
   * One device row per (dispensary, label) pair. Idempotent — calling again
   * with the same label rotates the token without orphaning rows.
   *
   * The kiosk user is provisioned with an unusable password hash so it cannot
   * authenticate via login mutation; only the device token can be used.
   */
  async provisionKiosk(
    input: ProvisionKioskInput,
    issuedByUserId: string,
  ): Promise<KioskProvisionResult> {
    const trimmedLabel = input.label.trim();
    if (!trimmedLabel) throw new ConflictException('Label is required');

    const slug = trimmedLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const email = `kiosk-${slug}@${input.dispensaryId}.kiosk.local`;

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({
        email,
        // Random non-bcrypt sentinel so password login can never succeed.
        passwordHash: '!disabled-' + crypto.randomBytes(16).toString('hex'),
        role: Role.KIOSK,
        firstName: 'Kiosk',
        lastName: trimmedLabel.slice(0, 50),
        isActive: true,
        emailVerified: true,
        dispensaryId: input.dispensaryId,
      });
      await this.userRepo.save(user);
    } else {
      if (user.role !== Role.KIOSK) {
        throw new ConflictException(
          'Email already in use by a non-kiosk account',
        );
      }
      if (user.dispensaryId !== input.dispensaryId) {
        throw new ConflictException(
          'Kiosk label is bound to a different dispensary',
        );
      }
      if (!user.isActive) {
        await this.userRepo.update(user.id, { isActive: true });
        user.isActive = true;
      }
    }

    const ttlSeconds = this.config.get<number>(
      'jwt.kioskTtl',
      ONE_YEAR_SECONDS,
    );
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + ttlSeconds * 1000);

    const accessToken = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        dispensaryId: user.dispensaryId,
        organizationId: user.organizationId,
        deviceLabel: trimmedLabel,
        provisionedBy: issuedByUserId,
      },
      {
        secret: this.config.get('jwt.secret'),
        expiresIn: ttlSeconds,
      },
    );

    return {
      deviceToken: accessToken,
      deviceId: user.id,
      dispensaryId: user.dispensaryId ?? input.dispensaryId,
      label: trimmedLabel,
      issuedAt,
      expiresAt,
    };
  }

  private async generateTokens(
    user: User,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const expiresIn = 15 * 60; // 15 minutes in seconds
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

    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        dispensaryId: user.dispensaryId,
        organizationId: user.organizationId,
        ...meta,
      }),
    );

    return { accessToken, refreshToken: rawRefresh, expiresIn };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
