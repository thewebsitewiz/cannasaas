import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  DISPENSARY_MANAGER = 'dispensary_manager',
  BUDTENDER = 'budtender',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude() // Exclude from serialization
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  @Exclude()
  emailVerificationToken!: string;

  @Column({ name: 'password_reset_token', nullable: true })
  @Exclude()
  passwordResetToken!: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  @Exclude()
  passwordResetExpires!: Date;

  @ManyToOne(() => Tenant, { eager: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant!                                                                                 : Tenant;
}