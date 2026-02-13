export declare class ApiKey {
    id: string;
    organizationId: string;
    name: string;
    hashedKey: string;
    prefix: string;
    permissions: string[];
    active: boolean;
    expiresAt: Date;
    lastUsedAt: Date;
    requestCount: number;
    revokedAt: Date;
    createdAt: Date;
}
