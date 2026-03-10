import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Index()
  @Column({ type: 'uuid' }) userId!: string;

  @Index()
  @Column({ unique: true }) tokenHash!: string;

  @Column({ type: 'uuid', nullable: true }) dispensaryId?: string;
  @Column({ type: 'uuid', nullable: true }) organizationId?: string;

  @Column({ type: 'timestamptz' }) expiresAt!: Date;
  @Column({ default: false }) isRevoked!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt?: Date;
  @Column({ nullable: true }) userAgent?: string;
  @Column({ nullable: true }) ipAddress?: string;

  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
