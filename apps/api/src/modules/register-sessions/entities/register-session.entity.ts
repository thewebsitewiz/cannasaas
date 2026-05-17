import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

export type RegisterSessionStatus = 'open' | 'closed';

@ObjectType()
@Entity('register_sessions')
@Index(['dispensaryId', 'status'])
@Index(['openedByUserId', 'status'])
export class RegisterSession {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column('uuid')
  dispensaryId!: string;

  @Field(() => ID)
  @Column('uuid')
  openedByUserId!: string;

  /** Cents — opening cash in the drawer at the start of the shift. */
  @Field()
  @Column({ type: 'integer' })
  openingCashCents!: number;

  /** Cents — counted at close. NULL while session is still open. */
  @Field({ nullable: true })
  @Column({ type: 'integer', nullable: true })
  closingCashCents?: number;

  @Field()
  @Column({ type: 'text', default: 'open' })
  status!: RegisterSessionStatus;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  openedAt!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
