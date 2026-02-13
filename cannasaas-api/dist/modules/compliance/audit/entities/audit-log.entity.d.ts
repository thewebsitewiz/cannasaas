export declare class AuditLog {
    id: string;
    organizationId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    severity: string;
    details: Record<string, any>;
    previousState: Record<string, any>;
    newState: Record<string, any>;
    ipAddress: string;
    hash: string;
    timestamp: Date;
}
