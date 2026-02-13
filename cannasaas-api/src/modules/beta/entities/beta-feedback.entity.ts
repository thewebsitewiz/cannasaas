// cannasaas-api/src/modules/beta/entities/beta-feedback.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('beta_feedback')
@Index(['organizationId'])
@Index(['type', 'severity'])
export class BetaFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 30 })
  type: 'bug' | 'feature_request' | 'usability' | 'general';

  @Column({ length: 20 })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
