// cannasaas-api/src/modules/compliance/audit/entities/audit-log.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['organizationId', 'timestamp'])
@Index(['organizationId', 'resource'])
@Index(['userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 30 })
  action: string;

  @Column({ length: 50 })
  resource: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ length: 20 })
  severity: string;

  @Column({ type: 'jsonb' })
  details: Record<string, any>;

  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState: Record<string, any>;

  @Column({ name: 'new_state', type: 'jsonb', nullable: true })
  newState: Record<string, any>;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ length: 64 })
  hash: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;
}
