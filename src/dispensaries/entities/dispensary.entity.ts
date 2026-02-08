import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Point,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { BrandingConfig } from './branding-config.entity';

export interface OperatingHours {
  monday: { open: string; close: string; closed?: boolean };
  tuesday: { open: string; close: string; closed?: boolean };
  wednesday: { open: string; close: string; closed?: boolean };
  thursday: { open: string; close: string; closed?: boolean };
  friday: { open: string; close: string; closed?: boolean };
  saturday: { open: string; close: string; closed?: boolean };
  sunday: { open: string; close: string; closed?: boolean };
}

@Entity('dispensaries')
export class Dispensary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Address fields
  @Column({ name: 'street_address', length: 255 })
  streetAddress!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 2 })
  state!: string;

  @Column({ name: 'zip_code', length: 10 })
  zipCode!: string;

  // Geospatial location
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location!: Point;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number;

  // Contact
  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber!: string;

  @Column({ length: 255, nullable: true })
  email!: string;

  @Column({ length: 255, nullable: true })
  website!: string;

  // Operating hours
  @Column({ name: 'operating_hours', type: 'jsonb', nullable: true })
  operatingHours!: OperatingHours;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => Company, (company) => company.dispensaries)
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @OneToOne(() => BrandingConfig, (branding) => branding.dispensary, {
    cascade: true,
  })
  branding!: BrandingConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}