export declare abstract class BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare abstract class TenantBaseEntity extends BaseEntity {
    organizationId: string;
}
