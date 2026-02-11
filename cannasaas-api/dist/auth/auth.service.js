"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
const tenant_service_1 = require("../common/tenant/tenant.service");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, tenantService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.tenantService = tenantService;
    }
    async register(registerDto) {
        const tenantId = this.tenantService.getTenantId();
        const existingUser = await this.userRepository.findOne({
            where: {
                email: registerDto.email,
                tenantId,
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        const user = this.userRepository.create({
            ...registerDto,
            passwordHash,
            tenantId,
            emailVerificationToken: this.generateToken(),
        });
        await this.userRepository.save(user);
        const accessToken = this.generateAccessToken(user);
        return { user, accessToken };
    }
    async login(loginDto) {
        const tenantId = this.tenantService.getTenantId();
        const user = await this.userRepository.findOne({
            where: {
                email: loginDto.email,
                tenantId,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { user, accessToken, refreshToken };
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };
        return this.jwtService.sign(payload, {
            expiresIn: '1h',
        });
    }
    generateRefreshToken(user) {
        const payload = {
            sub: user.id,
            tenantId: user.tenantId,
        };
        return this.jwtService.sign(payload, {
            expiresIn: '7d',
        });
    }
    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, tenant_service_1.TenantService])
], AuthService);
//# sourceMappingURL=auth.service.js.map