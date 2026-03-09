import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Brand } from '../../brands/entities/brand.entity';

@ObjectType()
@Entity('manufacturers')
export class Manufacturer {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') manufacturer_id!: string;

  @Field(() => ID, { nullable: true }) @Index() @Column({ type: 'uuid', nullable: true }) brand_id?: string;
  @ManyToOne(() => Brand) @JoinColumn({ name: 'brand_id' }) brand?: Brand;

  @Field() @Column({ length: 255 }) legal_name!: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) dba_name?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) license_number?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) license_type?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 2 }) license_state?: string;
  @Field(() => Date, { nullable: true }) @Column({ type: 'date', nullable: true }) license_expiry_date?: Date;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) address_line1?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 100 }) city?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 2 }) state?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 10 }) zip?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 255 }) contact_email?: string;
  @Field({ nullable: true }) @Column({ nullable: true, length: 20 }) contact_phone?: string;
  @Field() @Column({ default: true }) is_active!: boolean;

  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
  @Field(() => Date, { nullable: true }) @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deleted_at?: Date;
}
