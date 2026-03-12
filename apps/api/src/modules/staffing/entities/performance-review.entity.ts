import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('performance_reviews')
export class PerformanceReview {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'review_id' }) reviewId!: string;
  @Field(() => ID, { name: 'profileId' }) @Index() @Column({ type: 'uuid', name: 'profile_id' }) profile_id!: string;
  @Field(() => ID, { name: 'reviewerUserId' }) @Column({ type: 'uuid', name: 'reviewer_user_id' }) reviewer_user_id!: string;
  @Field({ name: 'reviewPeriodStart' }) @Column({ type: 'date', name: 'review_period_start' }) review_period_start!: string;
  @Field({ name: 'reviewPeriodEnd' }) @Column({ type: 'date', name: 'review_period_end' }) review_period_end!: string;
  @Field(() => Int, { name: 'overallRating', nullable: true }) @Column({ nullable: true, name: 'overall_rating' }) overall_rating?: number;
  @Field(() => Int, { name: 'salesRating', nullable: true }) @Column({ nullable: true, name: 'sales_rating' }) sales_rating?: number;
  @Field(() => Int, { name: 'complianceRating', nullable: true }) @Column({ nullable: true, name: 'compliance_rating' }) compliance_rating?: number;
  @Field(() => Int, { name: 'teamworkRating', nullable: true }) @Column({ nullable: true, name: 'teamwork_rating' }) teamwork_rating?: number;
  @Field(() => Int, { name: 'reliabilityRating', nullable: true }) @Column({ nullable: true, name: 'reliability_rating' }) reliability_rating?: number;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) strengths?: string;
  @Field({ name: 'areasForImprovement', nullable: true }) @Column({ type: 'text', nullable: true, name: 'areas_for_improvement' }) areas_for_improvement?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) goals?: string;
  @Field({ name: 'managerComments', nullable: true }) @Column({ type: 'text', nullable: true, name: 'manager_comments' }) manager_comments?: string;
  @Field({ name: 'employeeComments', nullable: true }) @Column({ type: 'text', nullable: true, name: 'employee_comments' }) employee_comments?: string;
  @Field() @Column({ length: 20, default: 'draft' }) status!: string;
  @Field(() => Date, { name: 'acknowledgedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'acknowledged_at' }) acknowledged_at?: Date;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
