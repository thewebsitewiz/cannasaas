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
exports.FeatureFlag = exports.PLAN_FEATURES = exports.Plan = exports.Feature = void 0;
const typeorm_1 = require("typeorm");
var Feature;
(function (Feature) {
    Feature["MULTI_LOCATION"] = "multi_location";
    Feature["SUBSCRIPTION_ORDERS"] = "subscription_orders";
    Feature["LOYALTY_PROGRAM"] = "loyalty_program";
    Feature["AI_RECOMMENDATIONS"] = "ai_recommendations";
    Feature["AI_CHATBOT"] = "ai_chatbot";
    Feature["ADVANCED_ANALYTICS"] = "advanced_analytics";
    Feature["CUSTOM_DOMAIN"] = "custom_domain";
    Feature["API_ACCESS"] = "api_access";
    Feature["GIFT_CARDS"] = "gift_cards";
    Feature["DELIVERY_TRACKING"] = "delivery_tracking";
    Feature["METRC_INTEGRATION"] = "metrc_integration";
    Feature["WHITE_LABEL"] = "white_label";
    Feature["BULK_IMPORT"] = "bulk_import";
    Feature["MULTI_CURRENCY"] = "multi_currency";
})(Feature || (exports.Feature = Feature = {}));
var Plan;
(function (Plan) {
    Plan["STARTER"] = "starter";
    Plan["PROFESSIONAL"] = "professional";
    Plan["ENTERPRISE"] = "enterprise";
})(Plan || (exports.Plan = Plan = {}));
exports.PLAN_FEATURES = {
    [Plan.STARTER]: [Feature.DELIVERY_TRACKING, Feature.GIFT_CARDS],
    [Plan.PROFESSIONAL]: [
        Feature.DELIVERY_TRACKING, Feature.GIFT_CARDS,
        Feature.MULTI_LOCATION, Feature.SUBSCRIPTION_ORDERS,
        Feature.LOYALTY_PROGRAM, Feature.AI_RECOMMENDATIONS,
        Feature.ADVANCED_ANALYTICS, Feature.BULK_IMPORT,
    ],
    [Plan.ENTERPRISE]: Object.values(Feature),
};
let FeatureFlag = class FeatureFlag {
};
exports.FeatureFlag = FeatureFlag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeatureFlag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], FeatureFlag.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: Plan }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], FeatureFlag.prototype, "overrides", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FeatureFlag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], FeatureFlag.prototype, "updatedAt", void 0);
exports.FeatureFlag = FeatureFlag = __decorate([
    (0, typeorm_1.Entity)('feature_flags'),
    (0, typeorm_1.Index)(['organizationId'])
], FeatureFlag);
//# sourceMappingURL=feature-flag.entity.js.map