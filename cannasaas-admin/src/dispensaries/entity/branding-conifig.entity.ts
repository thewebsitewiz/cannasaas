import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dispensary } from './dispensary.entity';

@Entity('branding_configs')
export class BrandingConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispensary_id', type: 'uuid', unique: true })
  dispensaryId!: string;

  // Logo URLs
  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl!: string;

  @Column({ name: 'logo_dark_url', length: 500, nullable: true })
  logoDarkUrl!: string;

  @Column({ name: 'favicon_url', length: 500, nullable: true })
  faviconUrl!: string;

  // Colors
  @Column({ name: 'primary_color', length: 7, default: '#10b981' })
  primaryColor!: string;

  @Column({ name: 'secondary_color', length: 7, default: '#3b82f6' })
  secondaryColor!: string;

  @Column({ name: 'accent_color', length: 7, default: '#8b5cf6' })
  accentColor!: string;

  // Typography
  @Column({ name: 'font_family', length: 100, default: 'Inter' })
  fontFamily!: string;

  // Custom CSS
  @Column({ name: 'custom_css', type: 'text', nullable: true })
  customCss!: string;

  @OneToOne(() => Dispensary, (dispensary) => dispensary.branding)
  @JoinColumn({ name: 'dispensary_id' })
  dispensary!: Dispensary;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
