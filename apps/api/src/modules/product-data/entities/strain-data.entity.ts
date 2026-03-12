import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('strain_data')
export class StrainData {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid', { name: 'strain_data_id' }) strainDataId!: string;

  @Field({ name: 'ocpc', nullable: true }) @Index({ unique: true }) @Column({ length: 50, nullable: true }) ocpc?: string;
  @Field({ name: 'name' }) @Index() @Column({ length: 255 }) name!: string;
  @Field({ name: 'strainType', nullable: true }) @Index() @Column({ length: 20, nullable: true }) type?: string;
  @Field({ nullable: true }) @Column({ type: 'text', nullable: true }) description?: string;

  @Field(() => GraphQLJSON, { name: 'effects', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) effects!: any;
  @Field(() => GraphQLJSON, { name: 'flavors', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) flavors!: any;
  @Field(() => GraphQLJSON, { name: 'terpenes', nullable: true }) @Column({ type: 'jsonb', default: '[]' }) terpenes!: any;
  @Field(() => GraphQLJSON, { name: 'lineage', nullable: true }) @Column({ type: 'jsonb', default: '{}' }) lineage!: any;
  @Field({ nullable: true }) @Column({ length: 500, nullable: true }) genetics?: string;

  @Field(() => Float, { name: 'thcAvg', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) thc_avg?: number;
  @Field(() => Float, { name: 'cbdAvg', nullable: true }) @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true }) cbd_avg?: number;
  @Field({ name: 'photoUrl', nullable: true }) @Column({ length: 500, nullable: true }) photo_url?: string;

  @Field({ nullable: true }) @Column({ length: 50, default: 'otreeba' }) source?: string;
  @Field(() => Date, { name: 'lastSyncedAt', nullable: true }) @Column({ type: 'timestamptz', nullable: true }) last_synced_at?: Date;
  @Field(() => Date, { name: 'createdAt' }) @CreateDateColumn({ type: 'timestamptz' }) created_at!: Date;
  @Field(() => Date, { name: 'updatedAt' }) @UpdateDateColumn({ type: 'timestamptz' }) updated_at!: Date;
}
