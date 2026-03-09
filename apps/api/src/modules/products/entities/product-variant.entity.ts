import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Product } from './product.entity';

@ObjectType()
@Entity('product_variants')
@Index(['product_id', 'is_active'])
export class ProductVariant {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') variant_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) product_id!: string;
  @ManyToOne(() => Product) @JoinColumn({ name: 'product_id' }) product?: Product;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) uom_id?: number;

  @Field() @Column({ length: 100 }) name!: string;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true }) quantity_per_unit?: number;
  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 100 }) sku?: string;
  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 100 }) barcode?: string;
  @Field({ nullable: true }) @Index() @Column({ nullable: true, length: 100 }) metrc_package_label?: string;
  @Field() @Column({ default: true }) is_active!: boolean;
  @Field(() => Int, { nullable: true }) @Column({ nullable: true }) sort_order?: number;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
  @Field(() => Date, { nullable: true }) @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deleted_at?: Date;
}
