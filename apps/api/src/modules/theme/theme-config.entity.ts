import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Stores the full color palette + preset selection for a dispensary.
 * One row per dispensary — upserted on save from the admin theme designer.
 */
@Entity('theme_configs')
export class ThemeConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dispensary_id', type: 'uuid', unique: true })
  dispensaryId!: string;

  /* ── Preset identifier (or "custom") ── */
  @Column({ default: 'casual' })
  preset!: string;

  /* ── Brand colors ── */
  @Column({ default: '#2d6a4f' })
  primary!: string;

  @Column({ default: '#74956c' })
  secondary!: string;

  @Column({ default: '#c47820' })
  accent!: string;

  /* ── Surface colors ── */
  @Column({ name: 'bg_primary', default: '#faf6f0' })
  bgPrimary!: string;

  @Column({ name: 'bg_secondary', default: '#f0ebe3' })
  bgSecondary!: string;

  @Column({ name: 'bg_card', default: '#ffffff' })
  bgCard!: string;

  @Column({ name: 'text_primary', default: '#2c2418' })
  textPrimary!: string;

  @Column({ name: 'text_secondary', default: '#6b5e4f' })
  textSecondary!: string;

  @Column({ name: 'sidebar_bg', default: '#1b3a2a' })
  sidebarBg!: string;

  @Column({ name: 'sidebar_text', default: '#c8d8c4' })
  sidebarText!: string;

  /* ── Semantic / functional ── */
  @Column({ name: 'color_success', default: '#27ae60' })
  success!: string;

  @Column({ name: 'color_warning', default: '#d97706' })
  warning!: string;

  @Column({ name: 'color_error', default: '#c0392b' })
  error!: string;

  @Column({ name: 'color_info', default: '#2e86ab' })
  info!: string;

  /* ── Dark mode flag ── */
  @Column({ name: 'is_dark', default: false })
  isDark!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
