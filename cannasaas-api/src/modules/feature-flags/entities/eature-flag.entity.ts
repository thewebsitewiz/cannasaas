import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Feature {
  MULTI_LOCATION = 'multi_location',
  SUBSCRIPTION_ORDERS = 'subscription_orders',
  LOYALTY_PROGRAM = 'loyalty_program',
  AI_RECOMMENDATIONS = 'ai_recommendations',
  AI_CHATBOT = 'ai_chatbot',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  CUSTOM_DOMAIN = 'custom_domain',
  API_ACCESS = 'api_access',
  GIFT_CARDS = 'gift_cards',
  DELIVERY_TRACKING = 'delivery_tracking',
  METRC_INTEGRATION = 'metrc_integration',
  WHITE_LABEL = 'white_label',
  BULK_IMPORT = 'bulk_import',
  MULTI_CURRENCY = 'multi_currency',
}

export enum Plan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  [Plan.STARTER]: [Feature.DELIVERY_TRACKING, Feature.GIFT_CARDS],
  [Plan.PROFESSIONAL]: [
    Feature.DELIVERY_TRACKING,
    Feature.GIFT_CARDS,
    Feature.MULTI_LOCATION,
    Feature.SUBSCRIPTION_ORDERS,
    Feature.LOYALTY_PROGRAM,
    Feature.AI_RECOMMENDATIONS,
    Feature.ADVANCED_ANALYTICS,
    Feature.BULK_IMPORT,
  ],
  [Plan.ENTERPRISE]: Object.values(Feature),
};

@Entity('feature_flags')
@Index(['organizationId'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  organizationId!: string;

  @Column({ type: 'enum', enum: Plan })
  plan!: Plan;

  @Column({ type: 'jsonb', default: {} })
  overrides!: Record<string, boolean>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
