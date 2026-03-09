import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('promotions')
@Index(['dispensaryId', 'isActive'])
export class Promotion {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') promoId!: string;
  @Field() @Index() @Column('uuid') dispensaryId!: string;
  @Field() @Column({ length: 255 }) name!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;
  @Field() @Column({ length: 50 }) type!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) code?: string;
  @Field() @Column('numeric', { precision: 10, scale: 2, default: 0 }) discountValue!: number;
  @Field({ nullable: true }) @Column('numeric', { precision: 10, scale: 2, nullable: true }) minimumOrderTotal?: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) maxUses?: number;
  @Field(() => Int) @Column({ default: 0 }) usesCount!: number;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) maxUsesPerCustomer?: number;
  @Field({ nullable: true }) @Column({ nullable: true, length: 50 }) appliesTo?: string;
  @Field({ nullable: true }) @Column({ nullable: true }) appliesToProductTypeId?: number;
  @Field({ nullable: true }) @Column('uuid', { nullable: true }) appliesToBrandId?: string;
  @Field({ nullable: true }) @Column({ nullable: true }) appliesToTaxCategoryId?: number;
  @Field() @Column({ default: false }) stackableWithOthers!: boolean;
  @Field() @Column({ default: false }) isStaffDiscount!: boolean;
  @Field() @Column({ default: false }) isMedicalDiscount!: boolean;
  @Field({ nullable: true }) @Column({ type: 'timestamptz', nullable: true }) startAt?: Date;
  @Field({ nullable: true }) @Column({ type: 'timestamptz', nullable: true }) endAt?: Date;
  @Field() @Column({ default: true }) isActive!: boolean;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
