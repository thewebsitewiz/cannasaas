import * as bcrypt from 'bcrypt';

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { Order } from '../../orders/entities/order.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { TenantBaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  BUDTENDER = 'budtender',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
}

@Entity('users')
@Index(['email', 'organizationId'], { unique: true })
export class User extends TenantBaseEntity {
  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'refresh_token', length: 500, nullable: true })
  @Exclude()
  refreshToken?: string;

  @Column({ name: 'email_verification_token', nullable: true })
  @Exclude()
  emailVerificationToken!: string | null;

  @Column({ name: 'last_login_ip', nullable: true, length: 45 })
  @Exclude()
  lastLoginIp!: string | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  @Exclude()
  failedLoginAttempts!: number;

  @Column({ name: 'two_factor_enabled', default: false })
  @Exclude()
  twoFactorEnabled!: boolean;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  // Profile
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'display_name', length: 200, nullable: true })
  displayName?: string;

  @Column({ length: 500, nullable: true })
  avatar?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  // Sprint 7+ — compliance ID verification
  @Column({ name: 'id_verified_at', type: 'timestamptz', nullable: true })
  idVerifiedAt?: Date;

  // Medical card
  @Column({ type: 'jsonb', name: 'medical_card', nullable: true })
  medicalCard?: {
    hasCard: boolean;
    number?: string;
    state?: string;
    expirationDate?: string;
    verified?: boolean;
    verifiedAt?: string;
  };

  // Role & permissions
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions?: string[];

  // Addresses
  @Column({ type: 'jsonb', default: [] })
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
    coordinates?: { lat: number; lng: number };
  }>;

  // Preferences
  @Column({ type: 'jsonb', default: {} })
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

  // Loyalty
  @Column({ type: 'jsonb', default: {} })
  loyalty: {
    enrolled?: boolean;
    points?: number;
    pointsLifetime?: number;
    tier?: string;
    tierSince?: string;
    lifetimeSpent?: number;
    referralCode?: string;
  };

  // Security
  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'age_verified', default: false })
  ageVerified: boolean;

  // Relations
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
