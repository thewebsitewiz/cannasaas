import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('biotrack_credentials')
export class BiotrackCredential {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'credential_id' })
  credentialId!: string;

  @Field()
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'dispensary_id' })
  dispensaryId!: string;

  @Field()
  @Column({ type: 'varchar', name: 'api_key' })
  apiKey!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'api_secret' })
  apiSecret!: string;

  @Field()
  @Column({ type: 'varchar', length: 10 })
  state!: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true, name: 'license_number' })
  licenseNumber!: string;

  @Field()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true, name: 'last_validated_at' })
  lastValidatedAt!: Date;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, name: 'validation_error' })
  validationError!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
