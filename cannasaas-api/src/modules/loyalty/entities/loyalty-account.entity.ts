import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('loyalty_accounts')
@Index(['userId', 'organizationId'], { unique: true })
export class LoyaltyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ name: 'lifetime_points', type: 'int', default: 0 })
  lifetimePoints: number;

  @Column({ length: 20, default: 'bronze' })
  tier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
