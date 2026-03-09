import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('promotion_categories')
@Index(['promoId'])
export class PromotionCategory {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id!: string;
  @Field() @Column('uuid') promoId!: string;
  @Field() @Column() categoryId!: number;
  @Field() @Column({ default: true }) isEligible!: boolean;
}
