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
exports.ComplianceGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const organization_entity_1 = require("../../organizations/organization.entity");
const order_entity_1 = require("../../orders/entities/order.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let ComplianceGuard = class ComplianceGuard {
    constructor(orgRepo, orderRepo, userRepo) {
        this.orgRepo = orgRepo;
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const orgId = request.user?.organizationId;
        const [org, user] = await Promise.all([
            this.orgRepo.findOneOrFail({ where: { id: orgId } }),
            this.userRepo.findOneOrFail({ where: { id: userId } }),
        ]);
        if (org.complianceConfig?.ageVerificationRequired) {
            if (!user.dateOfBirth)
                throw new common_1.ForbiddenException('Date of birth required');
            const age = this.calculateAge(user.dateOfBirth);
            const minAge = org.complianceConfig.medicalOnly ? 18 : 21;
            if (age < minAge)
                throw new common_1.ForbiddenException(`Must be ${minAge}+ to purchase`);
            if (org.complianceConfig.requireIdScan && user.idVerifiedAt) {
                const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
                if (user.idVerifiedAt < ninetyDaysAgo)
                    throw new common_1.ForbiddenException('ID verification expired');
            }
        }
        if (org.complianceConfig?.dailyPurchaseLimit) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todaysOrders = await this.orderRepo.find({
                where: { customerId: userId, organizationId: orgId,
                    createdAt: (0, typeorm_2.MoreThan)(today), status: 'completed' },
            });
            const todaysTotal = todaysOrders.reduce((s, o) => s + Number(o.totalWeight || 0), 0);
            if (todaysTotal >= org.complianceConfig.dailyPurchaseLimit)
                throw new common_1.ForbiddenException(`Daily limit (${org.complianceConfig.dailyPurchaseLimit}g) reached`);
        }
        return true;
    }
    calculateAge(dob) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate()))
            age--;
        return age;
    }
};
exports.ComplianceGuard = ComplianceGuard;
exports.ComplianceGuard = ComplianceGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ComplianceGuard);
//# sourceMappingURL=compliance.guard.js.map