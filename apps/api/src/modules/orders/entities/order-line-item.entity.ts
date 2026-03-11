import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('order_line_items')
export class OrderLineItem {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') lineItemId!: string;
  @Field() @Index() @Column('uuid') orderId!: string;
  @Field() @Column('uuid') productId!: string;
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  variantId?: string;
  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  batchId?: string;
  @Field() @Column('numeric', { precision: 12, scale: 4 }) quantity!: number;
  @Field() @Column('numeric', { precision: 10, scale: 2 }) unitPrice!: number;
  @Field()
  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  discountApplied!: number;
  @Field()
  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  taxApplied!: number;
  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  metrcPackageLabel?: string;
  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  metrcItemUid?: string;
  @Field({ nullable: true })
  @Column('numeric', { precision: 10, scale: 4, nullable: true })
  thcMgPerUnit?: number;
  @Field({ nullable: true })
  @Column('numeric', { precision: 10, scale: 4, nullable: true })
  cbdMgPerUnit?: number;
  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
