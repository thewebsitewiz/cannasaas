import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('customer_profiles')
export class CustomerProfile {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'profile_id' }) profileId!: string;
  @Field(() => ID, { name: 'userId' }) @Index({ unique: true }) @Column('uuid', { name: 'user_id' }) user_id!: string;
  @Field({ nullable: true }) @Column({ length: 20, nullable: true }) phone?: string;
  @Field({ name: 'dateOfBirth', nullable: true }) @Column({ type: 'date', nullable: true, name: 'date_of_birth' }) date_of_birth?: string;
  @Field({ name: 'ageVerified' }) @Column({ default: false, name: 'age_verified' }) age_verified!: boolean;
  @Field(() => Date, { name: 'ageVerifiedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'age_verified_at' }) age_verified_at?: Date;
  @Field({ name: 'ageVerificationMethod', nullable: true }) @Column({ length: 30, nullable: true, name: 'age_verification_method' }) age_verification_method?: string;
  @Field({ name: 'idDocumentType', nullable: true }) @Column({ length: 30, nullable: true, name: 'id_document_type' }) id_document_type?: string;
  @Field({ name: 'isMedicalPatient' }) @Column({ default: false, name: 'is_medical_patient' }) is_medical_patient!: boolean;
  @Field({ name: 'medicalCardNumber', nullable: true }) @Column({ length: 50, nullable: true, name: 'medical_card_number' }) medical_card_number?: string;
  @Field(() => ID, { name: 'preferredDispensaryId', nullable: true }) @Column('uuid', { nullable: true, name: 'preferred_dispensary_id' }) preferred_dispensary_id?: string;
  @Field({ name: 'marketingOptIn' }) @Column({ default: false, name: 'marketing_opt_in' }) marketing_opt_in!: boolean;
  @Field({ name: 'smsOptIn' }) @Column({ default: false, name: 'sms_opt_in' }) sms_opt_in!: boolean;
  @Field(() => Int, { name: 'loyaltyPoints' }) @Column({ default: 0, name: 'loyalty_points' }) loyalty_points!: number;
  @Field(() => Int, { name: 'totalOrders' }) @Column({ default: 0, name: 'total_orders' }) total_orders!: number;
  @Field(() => Float, { name: 'totalSpent' }) @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_spent' }) total_spent!: number;
  @Field(() => Date, { name: 'lastOrderAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'last_order_at' }) last_order_at?: Date;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}

@ObjectType()
@Entity('customer_addresses')
export class CustomerAddress {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'address_id' }) addressId!: string;
  @Field(() => ID, { name: 'userId' }) @Index() @Column('uuid', { name: 'user_id' }) user_id!: string;
  @Field() @Column({ length: 50, default: 'Home' }) label!: string;
  @Field({ name: 'addressLine1' }) @Column({ length: 255, name: 'address_line1' }) address_line1!: string;
  @Field({ name: 'addressLine2', nullable: true }) @Column({ length: 255, nullable: true, name: 'address_line2' }) address_line2?: string;
  @Field() @Column({ length: 100 }) city!: string;
  @Field() @Column({ length: 5 }) state!: string;
  @Field() @Column({ length: 10 }) zip!: string;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) latitude?: number;
  @Field(() => Float, { nullable: true }) @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) longitude?: number;
  @Field({ name: 'isDefault' }) @Column({ default: false, name: 'is_default' }) is_default!: boolean;
  @Field({ name: 'deliveryInstructions', nullable: true }) @Column({ type: 'text', nullable: true, name: 'delivery_instructions' }) delivery_instructions?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}

@ObjectType()
@Entity('age_verifications')
export class AgeVerification {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'verification_id' }) verificationId!: string;
  @Field(() => ID, { name: 'userId' }) @Column('uuid', { name: 'user_id' }) user_id!: string;
  @Field(() => ID, { name: 'dispensaryId', nullable: true }) @Column('uuid', { nullable: true, name: 'dispensary_id' }) dispensary_id?: string;
  @Field() @Column({ length: 30 }) method!: string;
  @Field({ name: 'idType', nullable: true }) @Column({ length: 30, nullable: true, name: 'id_type' }) id_type?: string;
  @Field({ name: 'dateOfBirth', nullable: true }) @Column({ type: 'date', nullable: true, name: 'date_of_birth' }) date_of_birth?: string;
  @Field(() => Int, { name: 'calculatedAge', nullable: true }) @Column({ nullable: true, name: 'calculated_age' }) calculated_age?: number;
  @Field() @Column({ length: 20 }) result!: string;
  @Field({ name: 'failureReason', nullable: true }) @Column({ type: 'text', nullable: true, name: 'failure_reason' }) failure_reason?: string;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
