import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { ProductVariant } from './product-variant.entity';

@ObjectType()
@Entity('product_batches')
@Index(['dispensary_id', 'status', 'expiry_date'])
export class ProductBatch {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') batch_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) variant_id!: string;
  @ManyToOne(() => ProductVariant) @JoinColumn({ name: 'variant_id' }) variant?: ProductVariant;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) manufacturer_id?: string;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) uom_id?: number;

  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 100 }) lot_number?: string;
  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 100 }) metrc_package_label?: string;

  @Field(() => Float) @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 }) quantity_received!: number;
  @Field(() => Float) @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 }) quantity_remaining!: number;
  @Field() @Column({ length: 20, default: 'active' }) status!: string;

  @Field(() => Date, { nullable: true }) @Column({ type: 'date', nullable: true }) manufacture_date?: Date;
  @Field(() => Date, { nullable: true }) @Column({ type: 'date', nullable: true }) expiry_date?: Date;
  @Field(() => Date, { nullable: true }) @Column({ type: 'timestamptz', nullable: true }) received_at?: Date;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) received_by_user_id?: string;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) recall_id?: string;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
