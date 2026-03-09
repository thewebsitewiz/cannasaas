import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id!: string;
  @Field() @Index({ unique: true }) @Column({ unique: true }) email!: string;
  @Column() passwordHash!: string;
  @Field() @Column({ default: 'customer' }) role!: string;
  @Field({ nullable: true }) @Column({ nullable: true }) organizationId?: string;
  @Field({ nullable: true }) @Column({ nullable: true }) dispensaryId?: string;
  @Field() @Column({ default: true }) isActive!: boolean;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
