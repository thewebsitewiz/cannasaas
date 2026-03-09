import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Organization } from '../../organizations/entities/organization.entity';

@ObjectType()
@Entity('companies')
export class Company {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  company_id!: string;

  @Field(() => ID)
  @Index()
  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field()
  @Column({ length: 255 })
  legal_name!: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  dba_name?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 20 })
  ein?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 50 })
  state_of_incorporation?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  license_number?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  license_type?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 2 })
  license_state?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'date', nullable: true })
  license_expiry_date?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  contact_email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 20 })
  contact_phone?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 255 })
  address_line1?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 2 })
  state?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 10 })
  zip?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  metrc_facility_license?: string;

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
