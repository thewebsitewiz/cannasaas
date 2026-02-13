export declare class StripeService {
    private readonly logger;
    createConnectedAccount(data: {
        email: string;
        businessName: string;
        country?: string;
    }): Promise<{
        id: string;
    }>;
    createAccountLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<{
        url: string;
    }>;
}
