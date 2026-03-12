import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('employee_certifications')
export class EmployeeCertification {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'certification_id' }) certificationId!: string;
  @Field(() => ID, { name: 'profileId' }) @Index() @Column({ type: 'uuid', name: 'profile_id' }) profile_id!: string;
  @Field(() => Int, { name: 'certTypeId' }) @Column({ name: 'cert_type_id' }) cert_type_id!: number;
  @Field({ name: 'certificateNumber', nullable: true }) @Column({ length: 100, nullable: true, name: 'certificate_number' }) certificate_number?: string;
  @Field({ name: 'issuedDate', nullable: true }) @Column({ type: 'date', nullable: true, name: 'issued_date' }) issued_date?: string;
  @Field({ name: 'expirationDate', nullable: true }) @Column({ type: 'date', nullable: true, name: 'expiration_date' }) expiration_date?: string;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field(() => ID, { name: 'verifiedByUserId', nullable: true }) @Column({ type: 'uuid', nullable: true, name: 'verified_by_user_id' }) verified_by_user_id?: string;
  @Field(() => Date, { name: 'verifiedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'verified_at' }) verified_at?: Date;
  @Field({ name: 'documentUrl', nullable: true }) @Column({ length: 500, nullable: true, name: 'document_url' }) document_url?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
