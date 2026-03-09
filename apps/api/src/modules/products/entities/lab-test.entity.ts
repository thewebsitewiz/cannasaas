import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { ProductBatch } from './product-batch.entity';

@ObjectType()
@Entity('lab_tests')
@Index(['batch_id', 'overall_result'])
export class LabTest {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') lab_test_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) batch_id!: string;
  @ManyToOne(() => ProductBatch) @JoinColumn({ name: 'batch_id' }) batch?: ProductBatch;

  @Field(() => ID) @Column({ type: 'uuid' }) dispensary_id!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) lab_name?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) lab_license_number?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) coa_number?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 500 }) coa_document_url?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 500 }) coa_qr_code_url?: string;
  @Field() @Column({ length: 20, default: 'pending' }) overall_result!: string;
  @Field(() => Date, { nullable: true }) @Column({ type: 'date', nullable: true }) tested_at?: Date;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('lab_test_results')
export class LabTestResult {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') result_id!: string;

  @Field(() => ID) @Index() @Column({ type: 'uuid' }) lab_test_id!: string;
  @ManyToOne(() => LabTest) @JoinColumn({ name: 'lab_test_id' }) lab_test?: LabTest;

  @Field(() => Int) @Column() test_category_id!: number;
  @Field() @Column({ length: 100 }) analyte_name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 20 }) unit?: string;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true }) value?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true }) action_limit?: number;
  @Field() @Column({ length: 20, default: 'pass' }) result!: string;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
