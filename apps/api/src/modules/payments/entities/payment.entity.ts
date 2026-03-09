import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('payments')
@Index(['orderId'])
@Index(['dispensaryId', 'createdAt'])
export class Payment {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') paymentId!: string;
  @Field() @Column('uuid') orderId!: string;
  @Field() @Column('uuid') dispensaryId!: string;
  @Field() @Column({ default: 'cash' }) method!: string;
  @Field() @Column('numeric', { precision: 10, scale: 2 }) amount!: number;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) stripePaymentIntentId?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) stripeChargeId?: string;
  @Field() @Column({ default: 'pending' }) status!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) terminalId?: string;
  @Field({ nullable: true }) @Column('numeric', { precision: 10, scale: 2, nullable: true }) cashTendered?: number;
  @Field({ nullable: true }) @Column('numeric', { precision: 10, scale: 2, nullable: true }) changeGiven?: number;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
