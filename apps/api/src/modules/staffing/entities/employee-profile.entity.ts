import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('employee_profiles')
export class EmployeeProfile {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'profile_id' }) profileId!: string;
  @Field(() => ID, { name: 'userId' }) @Index({ unique: true }) @Column({ type: 'uuid', name: 'user_id' }) user_id!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => Int, { name: 'positionId', nullable: true }) @Column({ nullable: true, name: 'position_id' }) position_id?: number;
  @Field({ name: 'employeeNumber', nullable: true }) @Column({ length: 20, nullable: true, name: 'employee_number' }) employee_number?: string;
  @Field({ nullable: true }) @Column({ length: 50, nullable: true }) department?: string;
  @Field({ name: 'employmentType' }) @Column({ length: 20, default: 'full_time', name: 'employment_type' }) employment_type!: string;
  @Field({ name: 'employmentStatus' }) @Index() @Column({ length: 20, default: 'active', name: 'employment_status' }) employment_status!: string;
  @Field({ name: 'hireDate' }) @Column({ type: 'date', name: 'hire_date' }) hire_date!: string;
  @Field({ name: 'terminationDate', nullable: true }) @Column({ type: 'date', nullable: true, name: 'termination_date' }) termination_date?: string;
  @Field({ name: 'terminationReason', nullable: true }) @Column({ type: 'text', nullable: true, name: 'termination_reason' }) termination_reason?: string;
  @Field(() => Float, { name: 'hourlyRate', nullable: true }) @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true, name: 'hourly_rate' }) hourly_rate?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) salary?: number;
  @Field({ name: 'payType' }) @Column({ length: 10, default: 'hourly', name: 'pay_type' }) pay_type!: string;
  @Field({ name: 'overtimeEligible' }) @Column({ default: true, name: 'overtime_eligible' }) overtime_eligible!: boolean;
  @Field({ nullable: true }) @Column({ length: 20, nullable: true }) phone?: string;
  @Field({ name: 'emergencyContactName', nullable: true }) @Column({ length: 100, nullable: true, name: 'emergency_contact_name' }) emergency_contact_name?: string;
  @Field({ name: 'emergencyContactPhone', nullable: true }) @Column({ length: 20, nullable: true, name: 'emergency_contact_phone' }) emergency_contact_phone?: string;
  @Field({ name: 'emergencyContactRelationship', nullable: true }) @Column({ length: 50, nullable: true, name: 'emergency_contact_relationship' }) emergency_contact_relationship?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
