import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One row per provisioned kiosk device.
 *
 * `currentTokenId` is the single valid `tokenId` claim that the kiosk's JWT
 * must carry. Re-running `provisionKiosk` for the same (dispensary, label)
 * rotates this value, which silently invalidates every prior-issued token
 * for that kiosk — see the matching check in `JwtStrategy.validate()`.
 *
 * The relationship to the kiosk operator user is 1:1 because the user is
 * itself derived from `(dispensary, label)` via a synthetic email
 * (`kiosk-{slug}@{dispensaryId}.kiosk.local`) with a unique constraint.
 */
@Entity('kiosk_devices')
export class KioskDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  dispensaryId!: string;

  @Column({ type: 'varchar' })
  label!: string;

  @Column({ type: 'uuid' })
  currentTokenId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
