import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('organizations')
export class Organization {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  organization_id!: string;

  @Field()
  @Column({ length: 255 })
  name!: string;

  @Field()
  @Index({ unique: true })
  @Column({ length: 100, unique: true })
  slug!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  billing_email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 500 })
  billing_address?: string;

  @Field()
  @Column({ default: 'starter', length: 50 })
  subscription_tier!: string;

  @Field()
  @Column({ default: 'active', length: 50 })
  subscription_status!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  stripe_customer_id?: string;

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
