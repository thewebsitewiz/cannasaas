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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stripe_1 = __importDefault(require("stripe"));
const organization_entity_1 = require("../organizations/organization.entity");
const PLAN_PRICE_IDS = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    professional: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};
let BillingService = class BillingService {
    constructor(orgRepo) {
        this.orgRepo = orgRepo;
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2026-01-28.clover',
        });
    }
    async createSubscription(orgId, plan) {
        const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
        if (!org.stripeCustomerId) {
            const customer = await this.stripe.customers.create({
                email: org.contactEmail, name: org.legalName,
                metadata: { organizationId: orgId },
            });
            org.stripeCustomerId = customer.id;
            await this.orgRepo.save(org);
        }
        const priceId = PLAN_PRICE_IDS[plan];
        if (!priceId)
            throw new common_1.BadRequestException(`Invalid plan: ${plan}`);
        const subscription = await this.stripe.subscriptions.create({
            customer: org.stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
            metadata: { organizationId: orgId, plan },
            trial_period_days: plan === 'starter' ? 14 : undefined,
        });
        org.stripeSubscriptionId = subscription.id;
        org.plan = plan;
        await this.orgRepo.save(org);
        const invoice = subscription.latest_invoice;
        const pi = invoice.payment_intent;
        return { subscriptionId: subscription.id, clientSecret: pi?.client_secret };
    }
    async changePlan(orgId, newPlan) {
        const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
        if (!org.stripeSubscriptionId)
            throw new common_1.BadRequestException('No active subscription');
        const subscription = await this.stripe.subscriptions.retrieve(org.stripeSubscriptionId);
        await this.stripe.subscriptions.update(org.stripeSubscriptionId, {
            items: [{ id: subscription.items.data[0].id, price: PLAN_PRICE_IDS[newPlan] }],
            proration_behavior: 'always_invoice',
        });
        org.plan = newPlan;
        await this.orgRepo.save(org);
    }
    async createPortalSession(orgId, returnUrl) {
        const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });
        const session = await this.stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId, return_url: returnUrl,
        });
        return { url: session.url };
    }
    async handleWebhook(event) {
        switch (event.type) {
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                await this.orgRepo.update({ id: sub.metadata.organizationId }, { subscriptionStatus: sub.status, plan: sub.metadata.plan });
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await this.orgRepo.update({ id: sub.metadata.organizationId }, { subscriptionStatus: 'canceled', plan: 'starter' });
                break;
            }
            case 'invoice.payment_failed': {
                break;
            }
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BillingService);
//# sourceMappingURL=billing.service.js.map