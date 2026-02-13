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
exports.FeatureFlagService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const feature_flag_entity_1 = require("./entities/feature-flag.entity");
let FeatureFlagService = class FeatureFlagService {
    constructor(flagRepo, cache) {
        this.flagRepo = flagRepo;
        this.cache = cache;
        this.TTL = 300;
    }
    async isEnabled(orgId, feature) {
        const cacheKey = `ff:${orgId}:${feature}`;
        const cached = await this.cache.get(cacheKey);
        if (cached !== undefined && cached !== null)
            return cached;
        const flag = await this.flagRepo.findOne({
            where: { organizationId: orgId },
        });
        if (!flag)
            return false;
        if (flag.overrides[feature] !== undefined) {
            await this.cache.set(cacheKey, flag.overrides[feature], this.TTL);
            return flag.overrides[feature];
        }
        const enabled = feature_flag_entity_1.PLAN_FEATURES[flag.plan]?.includes(feature) ?? false;
        await this.cache.set(cacheKey, enabled, this.TTL);
        return enabled;
    }
    async getAllFlags(orgId) {
        const flag = await this.flagRepo.findOne({
            where: { organizationId: orgId },
        });
        const result = {};
        for (const f of Object.values(feature_flag_entity_1.Feature)) {
            if (flag?.overrides[f] !== undefined) {
                result[f] = flag.overrides[f];
            }
            else {
                result[f] = feature_flag_entity_1.PLAN_FEATURES[flag?.plan]?.includes(f) ?? false;
            }
        }
        return result;
    }
    async setOverride(orgId, feature, enabled) {
        const flag = await this.flagRepo.findOneOrFail({
            where: { organizationId: orgId },
        });
        flag.overrides = { ...flag.overrides, [feature]: enabled };
        await this.flagRepo.save(flag);
        await this.cache.del(`ff:${orgId}:${feature}`);
    }
    async invalidateCache(orgId) {
        for (const f of Object.values(feature_flag_entity_1.Feature)) {
            await this.cache.del(`ff:${orgId}:${f}`);
        }
    }
};
exports.FeatureFlagService = FeatureFlagService;
exports.FeatureFlagService = FeatureFlagService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(feature_flag_entity_1.FeatureFlag)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], FeatureFlagService);
//# sourceMappingURL=feature-flag.service.js.map