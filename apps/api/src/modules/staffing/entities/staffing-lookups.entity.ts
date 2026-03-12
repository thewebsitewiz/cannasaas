import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('lkp_positions')
export class LkpPosition {
  @Field(() => Int) @PrimaryGeneratedColumn({ name: 'position_id' }) positionId!: number;
  @Field() @Column({ length: 50, unique: true }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ length: 50, default: 'operations' }) department!: string;
  @Field({ name: 'isManagement' }) @Column({ default: false, name: 'is_management' }) is_management!: boolean;
  @Field({ name: 'isActive' }) @Column({ default: true, name: 'is_active' }) is_active!: boolean;
  @Field(() => Int, { name: 'sortOrder' }) @Column({ default: 0, name: 'sort_order' }) sort_order!: number;
}

@ObjectType()
@Entity('lkp_certification_types')
export class LkpCertificationType {
  @Field(() => Int) @PrimaryGeneratedColumn({ name: 'cert_type_id' }) certTypeId!: number;
  @Field() @Column({ length: 50, unique: true }) code!: string;
  @Field() @Column({ length: 150 }) name!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;
  @Field({ name: 'issuingAuthority', nullable: true }) @Column({ length: 200, nullable: true, name: 'issuing_authority' }) issuing_authority?: string;
  @Field(() => Int, { name: 'validityMonths', nullable: true }) @Column({ nullable: true, name: 'validity_months' }) validity_months?: number;
  @Field({ name: 'isStateRequired' }) @Column({ default: false, name: 'is_state_required' }) is_state_required!: boolean;
  @Field({ name: 'isActive' }) @Column({ default: true, name: 'is_active' }) is_active!: boolean;
}
