// cannasaas-api/src/modules/analytics/entities/analytics-event.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('analytics_events')
@Index(['organizationId', 'timestamp'])
@Index(['organizationId', 'eventType'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'event_type', length: 50 })
  eventType: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'session_id', length: 100 })
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;
}
