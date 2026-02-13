export declare class AnalyticsEvent {
    id: string;
    organizationId: string;
    eventType: string;
    userId: string;
    sessionId: string;
    data: Record<string, any>;
    timestamp: Date;
}
