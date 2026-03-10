# CannaSaas — Auth System & RBAC Implementation Plan

## Overview

This guide covers the full implementation of JWT-based authentication with refresh tokens, subdomain-based multi-tenant resolution, and role-based access control across the NestJS API.

---

## 1. Recommended Auth Approach: JWT Access + Refresh Tokens

For a multi-tenant SaaS platform, this is the correct architecture:

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | Memory (client) | API authorization |
| Refresh Token | 7 days | HttpOnly cookie OR DB | Obtain new access tokens |

Refresh tokens are stored in the database (`refresh_tokens` table) so they can be revoked on logout, password change, or suspicious activity.

---

## 2. Database Changes Required

### 2a. Update `users` table entity

The existing `user.entity.ts` needs these additional fields:

```typescript
@Column({ nullable: true }) passwordHash?: string;           // already exists
@Column({ default: 'customer' }) role!: string;              // already exists — keep
@Column({ type: 'uuid', nullable: true }) organizationId?: string;
@Column({ type: 'uuid', nullable: true }) dispensaryId?: string;
@Column({ nullable: true }) firstName?: string;
@Column({ nullable: true }) lastName?: string;
@Column({ default: false }) emailVerified!: boolean;
@Column({ nullable: true }) lastLoginAt?: Date;
@Column({ nullable: true }) passwordChangedAt?: Date;
```

### 2b. New `refresh_tokens` table

Create `src/modules/auth/entities/refresh-token.entity.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' }) userId!: string;

  @Index()
  @Column({ unique: true }) tokenHash!: string;   // store SHA-256 hash, not raw token

  @Column({ type: 'uuid', nullable: true }) dispensaryId?: string;
  @Column({ type: 'uuid', nullable: true }) organizationId?: string;

  @Column() expiresAt!: Date;
  @Column({ default: false }) isRevoked!: boolean;
  @Column({ nullable: true }) revokedAt?: Date;
  @Column({ nullable: true }) userAgent?: string;
  @Column({ nullable: true }) ipAddress?: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
```

After adding entities, regenerate and run migration:

```bash
cd apps/api
pnpm migration:generate
pnpm migration:run
```

---

## 3. Role Definitions

Define roles as an enum in `src/modules/auth/enums/role.enum.ts`:

```typescript
export enum Role {
  SUPER_ADMIN     = 'super_admin',      // Platform-level — all tenants
  ORG_ADMIN       = 'org_admin',        // Organization — multiple dispensaries
  DISPENSARY_ADMIN = 'dispensary_admin', // Single dispensary
  BUDTENDER       = 'budtender',        // Staff — POS/order ops
  CUSTOMER        = 'customer',         // Storefront only
}
```

### Role Hierarchy & Permissions

```
super_admin
  └── org_admin
        └── dispensary_admin
              └── budtender
                    └── customer
```

| Action | super_admin | org_admin | dispensary_admin | budtender | customer |
|--------|:-----------:|:---------:|:----------------:|:---------:|:--------:|
| Manage platform | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage org | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage dispensary | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage products | ✅ | ✅ | ✅ | ❌ | ❌ |
| Process orders | ✅ | ✅ | ✅ | ✅ | ❌ |
| View own orders | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Module Structure

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts        ← REST endpoints (/auth/*)
├── auth.resolver.ts          ← GraphQL mutations
├── auth.service.ts           ← Core business logic
├── strategies/
│   ├── jwt.strategy.ts       ← Validates access tokens
│   └── jwt-refresh.strategy.ts ← Validates refresh tokens
├── guards/
│   ├── jwt-auth.guard.ts     ← Requires valid access token
│   └── roles.guard.ts        ← Checks role(s) on route
├── decorators/
│   ├── roles.decorator.ts    ← @Roles(Role.ADMIN, ...)
│   ├── current-user.decorator.ts  ← @CurrentUser()
│   └── public.decorator.ts   ← @Public() skips JWT guard
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── auth-response.dto.ts
├── entities/
│   └── refresh-token.entity.ts
└── enums/
    └── role.enum.ts
```

```
src/modules/tenant/
├── tenant.module.ts
├── tenant.middleware.ts      ← Extracts tenant from subdomain
├── tenant.service.ts         ← Resolves dispensary from host
└── tenant.context.ts         ← AsyncLocalStorage context
```

---

## 5. Environment Variables

Add to `apps/api/.env`:

```bash
# JWT
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
APP_DOMAIN=cannasaas.com           # Used for subdomain parsing
```

---

## 6. Implementation Files

### 6a. `auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),   // config per-strategy via options
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### 6b. `strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;           // userId
  email: string;
  role: string;
  dispensaryId?: string;
  organizationId?: string;
  tenantId?: string;     // resolved from subdomain
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return payload;   // attached to request.user
  }
}
```

### 6c. `strategies/jwt-refresh.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const rawToken = req.cookies?.refresh_token ?? req.body?.refreshToken;
    return { ...payload, rawToken };
  }
}
```

### 6d. `guards/jwt-auth.guard.ts`

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 6e. `guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]:      50,
  [Role.ORG_ADMIN]:        40,
  [Role.DISPENSARY_ADMIN]: 30,
  [Role.BUDTENDER]:        20,
  [Role.CUSTOMER]:         10,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user in context');

    const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const requiredLevel = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY[r] ?? 999));

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`Requires role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
```

### 6f. Decorators

```typescript
// decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
);
```

### 6g. `auth.service.ts`

```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokenRepo: Repository<RefreshToken>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      role: Role.CUSTOMER,
    });
    await this.userRepo.save(user);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

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

    // Rotate: revoke old, issue new
    await this.tokenRepo.update(stored.id, { isRevoked: true, revokedAt: new Date() });

    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.generateTokens(user);
  }

  async logout(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.tokenRepo.update({ userId, tokenHash }, { isRevoked: true, revokedAt: new Date() });
  }

  async logoutAll(userId: string) {
    await this.tokenRepo.update({ userId, isRevoked: false }, { isRevoked: true, revokedAt: new Date() });
  }

  private async generateTokens(user: User, meta?: { userAgent?: string; ipAddress?: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      dispensaryId: user.dispensaryId,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
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
      })
    );

    return { accessToken, refreshToken: rawRefresh, user: payload };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
```

### 6h. `auth.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(200)
  async refresh(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(user.sub, user.rawToken);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.refresh_token;
    if (rawToken) await this.auth.logout(user.sub, rawToken);
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.sub);
    res.clearCookie('refresh_token');
    return { message: 'All sessions revoked' };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
      path: '/auth/refresh',
    });
  }
}
```

---

## 7. Multi-Tenant Wiring (Subdomain Resolution)

### 7a. `tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private tenants: TenantService,
    private config: ConfigService,
  ) {}

  async use(req: Request & { tenantId?: string; dispensaryId?: string }, _res: Response, next: NextFunction) {
    const host = req.hostname;                           // e.g. "green-leaf.cannasaas.com"
    const domain = this.config.get('APP_DOMAIN', 'cannasaas.com');
    const subdomain = host.replace(`.${domain}`, '');   // "green-leaf"

    if (subdomain && subdomain !== host) {
      const dispensary = await this.tenants.resolveBySlug(subdomain);
      if (!dispensary) throw new NotFoundException(`Tenant not found: ${subdomain}`);
      req.tenantId = dispensary.organizationId;
      req.dispensaryId = dispensary.id;
    }

    next();
  }
}
```

### 7b. `tenant.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispensary } from '../dispensaries/entities/dispensary.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Dispensary) private dispensaries: Repository<Dispensary>,
  ) {}

  async resolveBySlug(slug: string) {
    return this.dispensaries.findOne({ where: { slug, isActive: true } });
  }
}
```

### 7c. Register middleware in `app.module.ts`

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';

@Module({ /* ... */ })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

### 7d. `@CurrentTenant()` decorator

```typescript
// src/modules/tenant/current-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return { tenantId: req.tenantId, dispensaryId: req.dispensaryId };
  }
);
```

---

## 8. Register Guards Globally

In `main.ts` or `app.module.ts`, apply `JwtAuthGuard` and `RolesGuard` globally so every route is protected by default, and only `@Public()` routes opt out:

```typescript
// main.ts
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector),
  );
  // ...
}
```

---

## 9. Usage Examples

### Protecting a controller

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../tenant/current-tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('products')
export class ProductsController {

  // Public — no auth needed
  @Public()
  @Get()
  findAll(@CurrentTenant() tenant: any) {
    return this.products.findByDispensary(tenant.dispensaryId);
  }

  // Any authenticated user
  @Get(':id')
  findOne(@CurrentUser() user: any) { /* ... */ }

  // Only dispensary_admin and above (hierarchy guard handles this)
  @Post()
  @Roles(Role.DISPENSARY_ADMIN)
  create(@Body() dto: any, @CurrentUser() user: any) { /* ... */ }

  // Only super_admin
  @Post('bulk-import')
  @Roles(Role.SUPER_ADMIN)
  bulkImport() { /* ... */ }
}
```

---

## 10. Required Packages

```bash
cd apps/api
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt cookie-parser
pnpm add -D @types/passport-jwt @types/bcrypt @types/cookie-parser
```

Enable cookie parsing in `main.ts`:

```typescript
import * as cookieParser from 'cookie-parser';
app.use(cookieParser());
```

---

## 11. Implementation Order

1. Install packages
2. Create `Role` enum
3. Create `RefreshToken` entity → generate + run migration
4. Update `User` entity fields → generate + run migration
5. Build `AuthModule` (service, strategies, guards, decorators, controller)
6. Build `TenantModule` (middleware, service, decorator)
7. Register guards globally in `main.ts`
8. Register `TenantMiddleware` in `app.module.ts`
9. Add env vars
10. Test with Swagger at `localhost:3000/docs`

---

## 12. GraphQL Support

For GraphQL resolvers, the guards work the same way but context extraction needs a GQL adapter. Add this to each guard's `canActivate`:

```typescript
// In jwt-auth.guard.ts and roles.guard.ts, replace getRequest() with:
import { GqlExecutionContext } from '@nestjs/graphql';

const ctx = GqlExecutionContext.create(context);
const request = ctx.getContext().req;
```

Or create separate GQL-aware guard variants that extend the HTTP ones.
