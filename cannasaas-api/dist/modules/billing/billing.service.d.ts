import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Organization } from '../organizations/organization.entity';
export declare class BillingService {
    private orgRepo;
    private readonly stripe;
    constructor(orgRepo: Repository<Organization>);
    createSubscription(orgId: string, plan: string): Promise<{
        subscriptionId: string;
        clientSecret: string;
    }>;
    changePlan(orgId: string, newPlan: string): Promise<void>;
    createPortalSession(orgId: string, returnUrl: string): Promise<{
        url: string;
    }>;
    handleWebhook(event: Stripe.Event): Promise<void>;
}
