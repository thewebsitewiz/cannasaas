import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'legal_name', length: 255, nullable: true })
  legalName: string;

  @Column({ name: 'contact_email', length: 255 })
  contactEmail: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 30, default: 'starter' })
  plan: string;

  @Column({ name: 'subscription_status', length: 30, default: 'trialing' })
  subscriptionStatus: string;

  @Column({ name: 'stripe_customer_id', length: 100, nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', length: 100, nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_connected_account_id', length: 100, nullable: true })
  stripeConnectedAccountId: string;

  @Column({ name: 'onboarding_step', length: 30, nullable: true })
  onboardingStep: string;

  @Column({ name: 'completed_steps', type: 'simple-array', nullable: true })
  completedSteps: string[];

  @Column({ name: 'onboarding_complete', type: 'boolean', default: false })
  onboardingComplete: boolean;

  @Column({ type: 'jsonb', nullable: true })
  branding: Record<string, any>;

  @Column({ name: 'compliance_config', type: 'jsonb', nullable: true })
  complianceConfig: {
    ageVerificationRequired?: boolean;
    medicalOnly?: boolean;
    requireIdScan?: boolean;
    dailyPurchaseLimit?: number;
    minAge?: number;
  };

  @Column({ name: 'license_number', length: 50, nullable: true })
  licenseNumber: string;

  @Column({ name: 'license_type', length: 20, nullable: true })
  licenseType: string;

  @Column({ name: 'max_daily_purchase_grams', type: 'decimal', precision: 6, scale: 2, default: 28.5 })
  maxDailyPurchaseGrams: number;

  @Column({ name: 'age_verification_required', type: 'boolean', default: true })
  ageVerificationRequired: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
