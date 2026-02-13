// cannasaas-api/src/modules/api-keys/entities/api-key.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('api_keys')
@Index(['organizationId'])
@Index(['hashedKey'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'hashed_key', length: 64, unique: true })
  hashedKey: string;

  @Column({ length: 10 })
  prefix: string;

  @Column({ type: 'simple-array' })
  permissions: string[];

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'request_count', type: 'int', default: 0 })
  requestCount: number;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
