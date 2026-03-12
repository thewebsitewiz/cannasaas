import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('time_entries')
export class TimeEntry {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'entry_id' }) entryId!: string;
  @Field(() => ID, { name: 'profileId' }) @Index() @Column({ type: 'uuid', name: 'profile_id' }) profile_id!: string;
  @Field(() => ID, { name: 'dispensaryId' }) @Index() @Column({ type: 'uuid', name: 'dispensary_id' }) dispensary_id!: string;
  @Field(() => Date, { name: 'clockIn' }) @Column({ type: 'timestamptz', name: 'clock_in' }) clock_in!: Date;
  @Field(() => Date, { name: 'clockOut', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'clock_out' }) clock_out?: Date;
  @Field(() => Int, { name: 'breakMinutes' }) @Column({ default: 0, name: 'break_minutes' }) break_minutes!: number;
  @Field(() => Float, { name: 'totalHours', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'total_hours' }) total_hours?: number;
  @Field(() => Float, { name: 'overtimeHours', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 2, default: 0, name: 'overtime_hours' }) overtime_hours?: number;
  @Field() @Column({ length: 20, default: 'clocked_in' }) status!: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) notes?: string;
  @Field(() => ID, { name: 'approvedByUserId', nullable: true }) @Column({ type: 'uuid', nullable: true, name: 'approved_by_user_id' }) approved_by_user_id?: string;
  @Field(() => Date, { name: 'approvedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' }) approved_at?: Date;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
