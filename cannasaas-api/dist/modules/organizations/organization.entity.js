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
exports.Organization = void 0;
const typeorm_1 = require("typeorm");
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'legal_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "legalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_email', length: 255 }),
    __metadata("design:type", String)
], Organization.prototype, "contactEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contact_phone', length: 20, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "contactPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'starter' }),
    __metadata("design:type", String)
], Organization.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subscription_status', length: 30, default: 'trialing' }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_customer_id', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "stripeCustomerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_subscription_id', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "stripeSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stripe_connected_account_id', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "stripeConnectedAccountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'onboarding_step', length: 30, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "onboardingStep", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_steps', type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Organization.prototype, "completedSteps", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'onboarding_complete', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Organization.prototype, "onboardingComplete", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Organization.prototype, "branding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'compliance_config', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Organization.prototype, "complianceConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_number', length: 50, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_type', length: 20, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "licenseType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_daily_purchase_grams', type: 'decimal', precision: 6, scale: 2, default: 28.5 }),
    __metadata("design:type", Number)
], Organization.prototype, "maxDailyPurchaseGrams", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'age_verification_required', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Organization.prototype, "ageVerificationRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Organization.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)('organizations')
], Organization);
//# sourceMappingURL=organization.entity.js.map