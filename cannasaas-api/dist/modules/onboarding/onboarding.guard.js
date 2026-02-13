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
exports.OnboardingService = exports.OnboardingStep = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const organization_entity_1 = require("../organizations/organization.entity");
const stripe_service_1 = require("../payments/stripe.service");
const mail_service_1 = require("../mail/mail.service");
var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["BUSINESS_INFO"] = "business_info";
    OnboardingStep["BRANDING"] = "branding";
    OnboardingStep["LOCATIONS"] = "locations";
    OnboardingStep["PAYMENT_PROCESSING"] = "payment_processing";
    OnboardingStep["FIRST_PRODUCTS"] = "first_products";
    OnboardingStep["STAFF_INVITE"] = "staff_invite";
    OnboardingStep["COMPLIANCE"] = "compliance";
    OnboardingStep["REVIEW_LAUNCH"] = "review_launch";
})(OnboardingStep || (exports.OnboardingStep = OnboardingStep = {}));
const STEP_ORDER = Object.values(OnboardingStep);
let OnboardingService = class OnboardingService {
    constructor(orgRepo, stripe, mail) {
        this.orgRepo = orgRepo;
        this.stripe = stripe;
        this.mail = mail;
    }
    async getStatus(orgId) {
        const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
        return {
            currentStep: org.onboardingStep || OnboardingStep.BUSINESS_INFO,
            completedSteps: org.completedSteps || [],
            progress: ((org.completedSteps?.length || 0) / STEP_ORDER.length) * 100,
        };
    }
    async processStep(orgId, step, data) {
        const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
        switch (step) {
            case OnboardingStep.BUSINESS_INFO:
                org.name = data.businessName;
                org.legalName = data.legalName;
                org.licenseNumber = data.licenseNumber;
                org.licenseType = data.licenseType;
                org.contactEmail = data.email;
                org.contactPhone = data.phone;
                org.slug = this.generateSlug(data.businessName);
                break;
            case OnboardingStep.BRANDING:
                org.branding = {
                    primaryColor: data.primaryColor,
                    secondaryColor: data.secondaryColor,
                    logoUrl: data.logoUrl,
                    faviconUrl: data.faviconUrl,
                };
                break;
            case OnboardingStep.PAYMENT_PROCESSING:
                const account = await this.stripe.createConnectedAccount({
                    email: org.contactEmail,
                    businessName: org.legalName,
                    country: 'US',
                });
                org.stripeConnectedAccountId = account.id;
                break;
            case OnboardingStep.STAFF_INVITE:
                for (const email of (data.emails || [])) {
                    await this.mail.sendStaffInvitation({
                        to: email, orgName: org.name, orgId: org.id,
                    });
                }
                break;
            case OnboardingStep.COMPLIANCE:
                org.complianceConfig = {
                    ageVerificationRequired: data.ageVerification ?? true,
                    medicalOnly: data.medicalOnly ?? false,
                    dailyPurchaseLimit: data.dailyLimit,
                    requireIdScan: data.requireIdScan ?? false,
                };
                break;
        }
        ``;
        if (!org.completedSteps)
            org.completedSteps = [];
        if (!org.completedSteps.includes(step))
            org.completedSteps.push(step);
        const idx = STEP_ORDER.indexOf(step);
        org.onboardingStep = idx < STEP_ORDER.length - 1
            ? STEP_ORDER[idx + 1] : OnboardingStep.REVIEW_LAUNCH;
        if (idx === STEP_ORDER.length - 1)
            org.onboardingComplete = true;
        await this.orgRepo.save(org);
        return this.getStatus(orgId);
    }
    generateSlug(name) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        stripe_service_1.StripeService,
        mail_service_1.MailService])
], OnboardingService);
//# sourceMappingURL=onboarding.guard.js.map