export declare class MailService {
    private readonly logger;
    sendBetaInvitation(data: {
        to: string;
        name: string;
        code: string;
    }): Promise<void>;
    sendStaffInvitation(data: {
        to: string;
        orgName: string;
        orgId: string;
        role?: string;
    }): Promise<void>;
    sendAbandonedCartEmail(data: {
        to: string;
        firstName?: string;
        name?: string;
        cartItems: any[];
        cartTotal?: number;
        resumeUrl?: string;
        recoveryUrl?: string;
        couponCode?: string;
    }): Promise<void>;
    sendTemplateEmail(data: {
        to: string;
        subject: string;
        template: string;
        variables?: Record<string, any>;
        data?: Record<string, any>;
    }): Promise<void>;
    sendWinBackEmail(data: {
        to: string;
        name?: string;
        firstName?: string;
        lastOrderDate?: Date;
        offerCode?: string;
        couponCode?: string;
        discountPercent?: number;
    }): Promise<void>;
    sendEmail(data: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
}
