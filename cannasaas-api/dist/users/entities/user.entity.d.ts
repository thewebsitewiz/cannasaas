import { BaseEntity } from '../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ORG_ADMIN = "org_admin",
    DISPENSARY_MANAGER = "dispensary_manager",
    BUDTENDER = "budtender",
    CUSTOMER = "customer"
}
export declare class User extends BaseEntity {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    emailVerificationToken: string;
    passwordResetToken: string;
    passwordResetExpires: Date;
    tenant: Tenant;
}
