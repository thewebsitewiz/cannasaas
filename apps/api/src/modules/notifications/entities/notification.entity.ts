import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('notification_templates')
export class NotificationTemplate {
  @Field(() => Int) @PrimaryGeneratedColumn({ name: 'template_id' }) templateId!: number;
  @Field() @Column({ length: 50, unique: true }) code!: string;
  @Field() @Column({ length: 100 }) name!: string;
  @Field() @Column({ length: 10, default: 'email' }) channel!: string;
  @Field({ nullable: true }) @Column({ length: 255, nullable: true }) subject?: string;
  @Field({ name: 'bodyTemplate' }) @Column({ type: 'text', name: 'body_template' }) body_template!: string;
  @Field({ name: 'isActive' }) @Column({ default: true, name: 'is_active' }) is_active!: boolean;
}

@ObjectType()
@Entity('notification_log')
export class NotificationLog {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'log_id' }) logId!: string;
  @Field(() => ID, { name: 'userId', nullable: true }) @Index() @Column('uuid', { nullable: true, name: 'user_id' }) user_id?: string;
  @Field(() => ID, { name: 'dispensaryId', nullable: true }) @Column('uuid', { nullable: true, name: 'dispensary_id' }) dispensary_id?: string;
  @Field() @Column({ length: 10 }) channel!: string;
  @Field({ name: 'templateCode', nullable: true }) @Column({ length: 50, nullable: true, name: 'template_code' }) template_code?: string;
  @Field() @Column({ length: 255 }) recipient!: string;
  @Field({ nullable: true }) @Column({ length: 255, nullable: true }) subject?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) body?: string;
  @Field() @Column({ length: 20, default: 'pending' }) status!: string;
  @Field({ name: 'errorMessage', nullable: true }) @Column({ type: 'text', nullable: true, name: 'error_message' }) error_message?: string;
  @Field({ name: 'externalId', nullable: true }) @Column({ length: 255, nullable: true, name: 'external_id' }) external_id?: string;
  @Field(() => Date, { name: 'sentAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true, name: 'sent_at' }) sent_at?: Date;
  @Field(() => Date) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
}
