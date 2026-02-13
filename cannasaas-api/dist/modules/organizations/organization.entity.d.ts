export declare class Organization {
    id: string;
    name: string;
    legalName: string;
    contactEmail: string;
    contactPhone: string;
    slug: string;
    plan: string;
    subscriptionStatus: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeConnectedAccountId: string;
    onboardingStep: string;
    completedSteps: string[];
    onboardingComplete: boolean;
    branding: Record<string, any>;
    complianceConfig: {
        ageVerificationRequired?: boolean;
        medicalOnly?: boolean;
        requireIdScan?: boolean;
        dailyPurchaseLimit?: number;
        minAge?: number;
    };
    licenseNumber: string;
    licenseType: string;
    maxDailyPurchaseGrams: number;
    ageVerificationRequired: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
