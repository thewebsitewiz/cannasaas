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
exports.FeatureFlagGuard = exports.RequireFeature = exports.FEATURE_KEY = void 0;
const common_1 = require("@nestjs/common");
const feature_flag_service_1 = require("./feature-flag.service");
const core_1 = require("@nestjs/core");
exports.FEATURE_KEY = 'required_feature';
const RequireFeature = (feature) => (0, common_1.SetMetadata)(exports.FEATURE_KEY, feature);
exports.RequireFeature = RequireFeature;
let FeatureFlagGuard = class FeatureFlagGuard {
    constructor(reflector, featureFlags) {
        this.reflector = reflector;
        this.featureFlags = featureFlags;
    }
    async canActivate(context) {
        const feature = this.reflector.getAllAndOverride(exports.FEATURE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!feature)
            return true;
        const request = context.switchToHttp().getRequest();
        const orgId = request.user?.organizationId;
        if (!orgId)
            throw new common_1.ForbiddenException('No organization context');
        const enabled = await this.featureFlags.isEnabled(orgId, feature);
        if (!enabled) {
            throw new common_1.ForbiddenException(`Feature "${feature}" not available on your plan. Upgrade to access.`);
        }
        return true;
    }
};
exports.FeatureFlagGuard = FeatureFlagGuard;
exports.FeatureFlagGuard = FeatureFlagGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        feature_flag_service_1.FeatureFlagService])
], FeatureFlagGuard);
//# sourceMappingURL=feature-flag.guard.js.map