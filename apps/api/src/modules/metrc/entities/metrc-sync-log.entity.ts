import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('metrc_sync_logs')
@Index(['dispensaryId', 'createdAt'])
@Index(['dispensaryId', 'status'])
export class MetrcSyncLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'sync_id' })
  syncId!: string;

  @Field()
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId!: string;

  @Field()
  @Index()
  @Column({ type: 'uuid', name: 'credential_id' })
  credentialId!: string;

  @Field()
  @Column({ type: 'varchar', name: 'sync_type' })
  syncType!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'reference_entity_type' })
  referenceEntityType!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'reference_entity_id' })
  referenceEntityId!: string;

  @Field()
  @Column({ type: 'varchar', default: 'pending' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true, name: 'metrc_response' })
  metrcResponse!: Record<string, any>;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage!: string;

  @Field()
  @Column({ type: 'integer', default: 0, name: 'attempt_count' })
  attemptCount!: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'next_retry_at' })
  nextRetryAt!: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
