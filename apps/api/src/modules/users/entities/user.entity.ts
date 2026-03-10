import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Index({ unique: true })
  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Field()
  @Column({ default: 'customer' })
  role!: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Field({ nullable: true })
  @Column({ type: 'uuid', nullable: true })
  dispensaryId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastName?: string;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field()
  @Column({ default: false })
  emailVerified!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
