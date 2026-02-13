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
exports.LoyaltyAccount = void 0;
const typeorm_1 = require("typeorm");
let LoyaltyAccount = class LoyaltyAccount {
};
exports.LoyaltyAccount = LoyaltyAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LoyaltyAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], LoyaltyAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], LoyaltyAccount.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LoyaltyAccount.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lifetime_points', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LoyaltyAccount.prototype, "lifetimePoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'bronze' }),
    __metadata("design:type", String)
], LoyaltyAccount.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoyaltyAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LoyaltyAccount.prototype, "updatedAt", void 0);
exports.LoyaltyAccount = LoyaltyAccount = __decorate([
    (0, typeorm_1.Entity)('loyalty_accounts'),
    (0, typeorm_1.Index)(['userId', 'organizationId'], { unique: true })
], LoyaltyAccount);
//# sourceMappingURL=loyalty-account.entity.js.map