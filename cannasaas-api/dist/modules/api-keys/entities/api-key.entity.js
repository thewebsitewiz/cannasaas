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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const typeorm_1 = require("typeorm");
let ApiKey = class ApiKey {
};
exports.ApiKey = ApiKey;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApiKey.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], ApiKey.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ApiKey.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hashed_key', length: 64, unique: true }),
    __metadata("design:type", String)
], ApiKey.prototype, "hashedKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], ApiKey.prototype, "prefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array' }),
    __metadata("design:type", Array)
], ApiKey.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ApiKey.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], ApiKey.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_used_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], ApiKey.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ApiKey.prototype, "requestCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revoked_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], ApiKey.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApiKey.prototype, "createdAt", void 0);
exports.ApiKey = ApiKey = __decorate([
    (0, typeorm_1.Entity)('api_keys'),
    (0, typeorm_1.Index)(['organizationId']),
    (0, typeorm_1.Index)(['hashedKey'])
], ApiKey);
//# sourceMappingURL=api-key.entity.js.map