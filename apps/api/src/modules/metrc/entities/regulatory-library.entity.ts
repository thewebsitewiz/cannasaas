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
@Entity('regulatory_library')
@Index(['state', 'status'])
export class RegulatoryLibrary {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'reg_id' })
  regId!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'jurisdiction_level' })
  jurisdictionLevel!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'jurisdiction_name' })
  jurisdictionName!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 10, nullable: true })
  state!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'statute_number' })
  statuteNumber!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  title!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  summary!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'full_text' })
  fullText!: string;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'effective_date' })
  effectiveDate!: Date;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate!: Date;

  @Field()
  @Column({ type: 'varchar', default: 'active' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  tags!: string[];

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'source_url' })
  sourceUrl!: string;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_verified_at' })
  lastVerifiedAt!: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
