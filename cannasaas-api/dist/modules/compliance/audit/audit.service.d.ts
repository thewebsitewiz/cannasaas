import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    LOGIN = "login",
    LOGOUT = "logout",
    ACCESS = "access",
    EXPORT = "export",
    COMPLIANCE_CHECK = "compliance_check",
    INVENTORY_ADJUST = "inventory_adjust",
    METRC_SYNC = "metrc_sync",
    REFUND = "refund",
    VOID = "void"
}
export declare enum AuditSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class AuditService {
    private auditRepo;
    constructor(auditRepo: Repository<AuditLog>);
    log(entry: {
        organizationId: string;
        userId: string;
        action: AuditAction;
        resource: string;
        resourceId?: string;
        severity: AuditSeverity;
        details: Record<string, any>;
        previousState?: Record<string, any>;
        newState?: Record<string, any>;
        ipAddress?: string;
    }): Promise<AuditLog>;
    getAuditTrail(orgId: string, filters: {
        resource?: string;
        userId?: string;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    exportForRegulator(orgId: string, startDate: Date, endDate: Date): Promise<string>;
}
