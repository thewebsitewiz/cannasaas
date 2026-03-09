import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('brands')
export class Brand {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') brand_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) organization_id!: string;

  @Field() @Column({ length: 255 }) name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) slug?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 500 }) logo_url?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 500 }) website_url?: string;
  @Field() @Column({ default: true }) is_active!: boolean;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
  @Field(() => Date, { nullable: true }) @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deleted_at?: Date;
}
