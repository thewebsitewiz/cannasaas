import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('promotion_products')
@Index(['promoId'])
export class PromotionProduct {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id!: string;
  @Field() @Column('uuid') promoId!: string;
  @Field({ nullable: true }) @Column('uuid', { nullable: true }) productId?: string;
  @Field({ nullable: true }) @Column('uuid', { nullable: true }) variantId?: string;
  @Field() @Column({ default: true }) isEligible!: boolean;
}
