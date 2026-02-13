import { Repository } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { StripeService } from '../payments/stripe.service';
import { MailService } from '../mail/mail.service';
export declare enum OnboardingStep {
    BUSINESS_INFO = "business_info",
    BRANDING = "branding",
    LOCATIONS = "locations",
    PAYMENT_PROCESSING = "payment_processing",
    FIRST_PRODUCTS = "first_products",
    STAFF_INVITE = "staff_invite",
    COMPLIANCE = "compliance",
    REVIEW_LAUNCH = "review_launch"
}
export declare class OnboardingService {
    private orgRepo;
    private stripe;
    private mail;
    constructor(orgRepo: Repository<Organization>, stripe: StripeService, mail: MailService);
    getStatus(orgId: string): Promise<{
        currentStep: string;
        completedSteps: string[];
        progress: number;
    }>;
    processStep(orgId: string, step: OnboardingStep, data: any): Promise<{
        currentStep: string;
        completedSteps: string[];
        progress: number;
    }>;
    private generateSlug;
}
