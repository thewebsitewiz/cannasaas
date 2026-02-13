import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('marketing_logs')
export class MarketingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'campaign_type', length: 50 })
  campaignType: string;

  @Column({ length: 30, nullable: true })
  channel: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
