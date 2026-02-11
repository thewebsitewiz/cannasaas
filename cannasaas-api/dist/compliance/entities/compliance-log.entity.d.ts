import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
export declare enum ComplianceEventType {
    SALE = "sale",
    RETURN = "return",
    INVENTORY_ADJUSTMENT = "inventory_adjustment",
    INVENTORY_RECEIVED = "inventory_received",
    INVENTORY_DESTROYED = "inventory_destroyed",
    PRODUCT_RECALL = "product_recall",
    ID_VERIFICATION = "id_verification",
    PURCHASE_LIMIT_CHECK = "purchase_limit_check"
}
export declare class ComplianceLog {
    id: string;
    dispensaryId: string;
    eventType: ComplianceEventType;
    details: Record<string, any>;
    performedBy: string;
    orderId: string;
    dispensary: Dispensary;
    createdAt: Date;
}
