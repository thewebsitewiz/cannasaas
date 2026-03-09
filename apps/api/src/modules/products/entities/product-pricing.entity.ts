import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ProductVariant } from './product-variant.entity';

@ObjectType()
@Entity('product_pricing')
@Index(['variant_id', 'price_type', 'effective_from', 'effective_until'])
export class ProductPricing {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') pricing_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) variant_id!: string;
  @ManyToOne(() => ProductVariant) @JoinColumn({ name: 'variant_id' }) variant?: ProductVariant;

  @Field(() => ID) @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field() @Column({ length: 20, default: 'retail' }) price_type!: string;
  @Field(() => Float) @Column({ type: 'decimal', precision: 10, scale: 2 }) price!: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) compare_at_price?: number;
  @Field(() => Date) @Column({ type: 'timestamptz' }) effective_from!: Date;
  @Field(() => Date, { nullable: true }) @Column({ type: 'timestamptz', nullable: true }) effective_until?: Date;
  @Field(() => ID, { nullable: true }) @Column({ type: 'uuid', nullable: true }) set_by_user_id?: string;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
