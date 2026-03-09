import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('compliance_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['dispensaryId', 'entityType', 'entityId'])
export class ComplianceLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'log_id' })
  logId!: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId!: string;

  @Field()
  @Column({ type: 'varchar', name: 'event_type' })
  eventType!: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'entity_type' })
  entityType!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'entity_id' })
  entityId!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'ip_address' })
  ipAddress!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'user_agent' })
  userAgent!: string;

  @Field()
  @Column({ type: 'boolean', default: false, name: 'metrc_synced' })
  metrcSynced!: boolean;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
