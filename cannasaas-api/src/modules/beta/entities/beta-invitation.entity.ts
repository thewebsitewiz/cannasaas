// cannasaas-api/src/modules/beta/entities/beta-invitation.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('beta_invitations')
@Index(['code'], { unique: true })
@Index(['email'])
export class BetaInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
