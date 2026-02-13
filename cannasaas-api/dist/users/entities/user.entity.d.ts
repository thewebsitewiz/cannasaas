import { TenantBaseEntity } from '../../common/entities/base.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Order } from '../../orders/entities/order.entity';
export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    OWNER = "owner",
    ADMIN = "admin",
    MANAGER = "manager",
    BUDTENDER = "budtender",
    DRIVER = "driver",
    CUSTOMER = "customer"
}
export declare class User extends TenantBaseEntity {
    email: string;
    emailVerified: boolean;
    phone?: string;
    phoneVerified: boolean;
    passwordHash: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
    dateOfBirth?: Date;
    idVerifiedAt?: Date;
    medicalCard?: {
        hasCard: boolean;
        number?: string;
        state?: string;
        expirationDate?: string;
        verified?: boolean;
        verifiedAt?: string;
    };
    role: UserRole;
    permissions?: string[];
    addresses: Array<{
        id: string;
        type: string;
        label: string;
        street: string;
        unit?: string;
        city: string;
        state: string;
        zip: string;
        isDefault: boolean;
        deliveryInstructions?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    }>;
    preferences: {
        communicationChannels?: {
            email?: boolean;
            sms?: boolean;
            push?: boolean;
        };
        notifications?: {
            orderUpdates?: boolean;
            promotions?: boolean;
            restockAlerts?: boolean;
        };
        favoriteProducts?: string[];
        preferredCategories?: string[];
    };
    loyalty: {
        enrolled?: boolean;
        points?: number;
        pointsLifetime?: number;
        tier?: string;
        tierSince?: string;
        lifetimeSpent?: number;
        referralCode?: string;
    };
    lastLogin?: Date;
    lastLoginIp?: string;
    failedLoginAttempts: number;
    twoFactorEnabled: boolean;
    ageVerified: boolean;
    refreshToken?: string;
    organization: Organization;
    orders: Order[];
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
    get fullName(): string;
    tenantId: string;
    isActive: boolean;
    emailVerificationToken: string;
}
