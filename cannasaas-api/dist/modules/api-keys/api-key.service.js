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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_key_entity_1 = require("./entities/api-key.entity");
const crypto_1 = require("crypto");
let ApiKeyService = class ApiKeyService {
    constructor(keyRepo) {
        this.keyRepo = keyRepo;
    }
    async createKey(orgId, name, permissions) {
        const rawKey = `cs_${(0, crypto_1.randomBytes)(32).toString('hex')}`;
        const hashedKey = (0, crypto_1.createHash)('sha256').update(rawKey).digest('hex');
        const apiKey = this.keyRepo.create({
            organizationId: orgId, name, hashedKey, permissions,
            prefix: rawKey.slice(0, 10),
        });
        await this.keyRepo.save(apiKey);
        return { key: rawKey, id: apiKey.id, name, permissions };
    }
    async validateKey(rawKey) {
        const hashedKey = (0, crypto_1.createHash)('sha256').update(rawKey).digest('hex');
        const apiKey = await this.keyRepo.findOne({
            where: { hashedKey, active: true },
        });
        if (!apiKey)
            throw new common_1.UnauthorizedException('Invalid API key');
        if (apiKey.expiresAt && apiKey.expiresAt < new Date())
            throw new common_1.UnauthorizedException('API key expired');
        apiKey.lastUsedAt = new Date();
        apiKey.requestCount++;
        await this.keyRepo.save(apiKey);
        return apiKey;
    }
    async revokeKey(keyId, orgId) {
        await this.keyRepo.update({ id: keyId, organizationId: orgId }, { active: false, revokedAt: new Date() });
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_key_entity_1.ApiKey)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ApiKeyService);
//# sourceMappingURL=api-key.service.js.map