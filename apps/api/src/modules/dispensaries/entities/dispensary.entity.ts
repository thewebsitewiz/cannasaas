import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Company } from '../../companies/entities/company.entity';

@ObjectType()
@Entity('dispensaries')
export class Dispensary {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  entity_id!: string;

  @Field(() => ID)
  @Index()
  @Column({ type: 'uuid' })
  company_id!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Field()
  @Column({ length: 50, default: 'dispensary' })
  type!: string;

  @Field()
  @Column({ length: 255 })
  name!: string;

  @Field()
  @Index()
  @Column({ length: 100 })
  slug!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  license_number?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  license_type?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  address_line1?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  city?: string;

  @Field()
  @Column({ length: 2 })
  state!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 10 })
  zip?: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  county?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  municipality?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  website?: string;

  @Field()
  @Column({ default: true })
  is_active!: boolean;

  @Field()
  @Column({ default: false })
  is_delivery_enabled!: boolean;

  @Field()
  @Column({ default: false })
  is_pickup_enabled!: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  metrc_license_number?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 50 })
  timezone?: string;

  @Field(() => Float, { name: 'cashDiscountPercent', nullable: true })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'cash_discount_percent' })
  cash_discount_percent?: number;

  @Field({ name: 'isCashEnabled' })
  @Column({ default: true, name: 'is_cash_enabled' })
  is_cash_enabled!: boolean;

  @Field({ name: 'cashDeliveryEnabled' })
  @Column({ default: true, name: 'cash_delivery_enabled' })
  cash_delivery_enabled!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Field(() => Date, { nullable: true })
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at?: Date;
}
