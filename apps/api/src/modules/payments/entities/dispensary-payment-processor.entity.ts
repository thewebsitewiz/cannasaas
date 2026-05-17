import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum DispensaryProcessorName {
  AEROPAY = 'aeropay',
  CANPAY = 'canpay',
}

registerEnumType(DispensaryProcessorName, {
  name: 'DispensaryProcessorName',
  description: 'Operator-selectable payment processors per dispensary.',
});

export const SELECTABLE_DISPENSARY_PROCESSORS: readonly DispensaryProcessorName[] =
  [DispensaryProcessorName.AEROPAY, DispensaryProcessorName.CANPAY];

@ObjectType()
@Entity('dispensary_payment_processors')
@Unique('uniq_dpp_dispensary_processor', ['dispensaryId', 'processorName'])
@Index(['dispensaryId'])
export class DispensaryPaymentProcessor {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column('uuid')
  dispensaryId!: string;

  @Field(() => DispensaryProcessorName)
  @Column({ type: 'text' })
  processorName!: DispensaryProcessorName;

  @Field()
  @Column({ default: false })
  isEnabled!: boolean;

  @Field()
  @Column({ default: true })
  isSandbox!: boolean;

  /**
   * AES-encrypted JSON of processor credentials. Populated by the per-processor
   * onboarding flows (sc-214 Aeropay, sc-217 CanPay). Never exposed via GraphQL.
   */
  @Column({ type: 'text', nullable: true })
  credentialsEncrypted?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  merchantExternalId?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  provisionedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
