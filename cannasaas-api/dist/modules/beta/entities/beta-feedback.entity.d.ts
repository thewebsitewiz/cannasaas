export declare class BetaFeedback {
    id: string;
    organizationId: string;
    userId: string;
    type: 'bug' | 'feature_request' | 'usability' | 'general';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
