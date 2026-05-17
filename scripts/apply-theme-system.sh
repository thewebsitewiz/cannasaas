#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# GreenStack Theme System — Full Integration Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# This script wires theme customization end-to-end:
#   1. Backend:  NestJS entity, service, resolver, module, migration, DTOs
#   2. Shared:   @cannasaas/ui theme presets, ThemeLoader, ThemePicker
#   3. Shared:   @cannasaas/stores organization + theme store
#   4. Admin:    ThemePage designer (save preferences, live preview)
#   5. CSS:      Base theme variables consumed by all portals
#
# Usage:
#   cd ~/Documents/Projects/cannasaas
#   chmod +x apply-theme-system.sh
#   ./apply-theme-system.sh
#
# ═══════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT="$(pwd)"

echo "╔═══════════════════════════════════════════════════╗"
echo "║   GreenStack Theme System — Integration Script    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "Project root: $PROJECT_ROOT"
echo ""

# ─── Safety check ───
if [ ! -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]; then
  echo "❌ Run this from the cannasaas monorepo root."
  exit 1
fi

# ─── Backup existing files ───
echo "📦 Backing up existing files..."
BACKUP_DIR="$PROJECT_ROOT/.theme-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

for f in \
  packages/ui/src/themes/index.ts \
  packages/ui/src/ThemeLoader.tsx \
  packages/ui/src/ThemePicker.tsx \
  packages/ui/src/index.ts \
  packages/stores/src/index.ts \
  packages/stores/src/useOrganizationStore.ts \
  apps/admin/src/pages/Settings/ThemePage.tsx \
; do
  if [ -f "$PROJECT_ROOT/$f" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp "$PROJECT_ROOT/$f" "$BACKUP_DIR/$f"
    echo "  ✓ backed up $f"
  fi
done

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: BACKEND — NestJS Theme Module
# ═══════════════════════════════════════════════════════════════════════════════
echo "🔧 [1/5] Creating NestJS theme module..."

THEME_MOD="$PROJECT_ROOT/apps/api/src/modules/theme"
mkdir -p "$THEME_MOD/dto"

# ─── 1a. ThemeConfig Entity ───
cat > "$THEME_MOD/theme-config.entity.ts" << 'ENTITY_EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Stores the full color palette + preset selection for a dispensary.
 * One row per dispensary — upserted on save from the admin theme designer.
 */
@Entity('theme_configs')
export class ThemeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dispensary_id', type: 'uuid', unique: true })
  dispensaryId: string;

  /* ── Preset identifier (or "custom") ── */
  @Column({ default: 'casual' })
  preset: string;

  /* ── Brand colors ── */
  @Column({ default: '#2d6a4f' })
  primary: string;

  @Column({ default: '#74956c' })
  secondary: string;

  @Column({ default: '#c47820' })
  accent: string;

  /* ── Surface colors ── */
  @Column({ name: 'bg_primary', default: '#faf6f0' })
  bgPrimary: string;

  @Column({ name: 'bg_secondary', default: '#f0ebe3' })
  bgSecondary: string;

  @Column({ name: 'bg_card', default: '#ffffff' })
  bgCard: string;

  @Column({ name: 'text_primary', default: '#2c2418' })
  textPrimary: string;

  @Column({ name: 'text_secondary', default: '#6b5e4f' })
  textSecondary: string;

  @Column({ name: 'sidebar_bg', default: '#1b3a2a' })
  sidebarBg: string;

  @Column({ name: 'sidebar_text', default: '#c8d8c4' })
  sidebarText: string;

  /* ── Semantic / functional ── */
  @Column({ name: 'color_success', default: '#27ae60' })
  success: string;

  @Column({ name: 'color_warning', default: '#d97706' })
  warning: string;

  @Column({ name: 'color_error', default: '#c0392b' })
  error: string;

  @Column({ name: 'color_info', default: '#2e86ab' })
  info: string;

  /* ── Dark mode flag ── */
  @Column({ name: 'is_dark', default: false })
  isDark: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENTITY_EOF

echo "  ✓ theme-config.entity.ts"

# ─── 1b. DTOs ───
cat > "$THEME_MOD/dto/theme-config.input.ts" << 'DTO_INPUT_EOF'
import { InputType, Field } from '@nestjs/graphql';
import { IsHexColor, IsOptional, IsString, IsBoolean } from 'class-validator';

@InputType()
export class SaveThemeConfigInput {
  @Field()
  @IsString()
  dispensaryId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preset?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  primary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  secondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  accent?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgPrimary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgSecondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  bgCard?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textPrimary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  textSecondary?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  sidebarBg?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  sidebarText?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  success?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  warning?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  error?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor()
  info?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isDark?: boolean;
}
DTO_INPUT_EOF

cat > "$THEME_MOD/dto/theme-config.type.ts" << 'DTO_TYPE_EOF'
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ThemeConfigType {
  @Field(() => ID)
  id: string;

  @Field()
  dispensaryId: string;

  @Field()
  preset: string;

  @Field()
  primary: string;

  @Field()
  secondary: string;

  @Field()
  accent: string;

  @Field()
  bgPrimary: string;

  @Field()
  bgSecondary: string;

  @Field()
  bgCard: string;

  @Field()
  textPrimary: string;

  @Field()
  textSecondary: string;

  @Field()
  sidebarBg: string;

  @Field()
  sidebarText: string;

  @Field()
  success: string;

  @Field()
  warning: string;

  @Field()
  error: string;

  @Field()
  info: string;

  @Field()
  isDark: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
DTO_TYPE_EOF

cat > "$THEME_MOD/dto/index.ts" << 'DTO_INDEX_EOF'
export { SaveThemeConfigInput } from './theme-config.input';
export { ThemeConfigType } from './theme-config.type';
DTO_INDEX_EOF

echo "  ✓ dto/theme-config.input.ts"
echo "  ✓ dto/theme-config.type.ts"

# ─── 1c. Theme Service ───
cat > "$THEME_MOD/theme.service.ts" << 'SERVICE_EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeConfig } from './theme-config.entity';
import { SaveThemeConfigInput } from './dto';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(ThemeConfig)
    private readonly repo: Repository<ThemeConfig>,
  ) {}

  /** Get theme config for a dispensary (returns defaults if none saved) */
  async getByDispensaryId(dispensaryId: string): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) return existing;

    // Return unsaved defaults so the frontend always gets a config
    const defaults = this.repo.create({ dispensaryId });
    return defaults;
  }

  /** Upsert theme config — creates if missing, updates if exists */
  async save(input: SaveThemeConfigInput): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({
      where: { dispensaryId: input.dispensaryId },
    });

    if (existing) {
      // Merge only provided fields
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          (existing as any)[key] = value;
        }
      });
      return this.repo.save(existing);
    }

    const config = this.repo.create(input);
    return this.repo.save(config);
  }

  /** Reset to default casual theme */
  async resetToDefault(dispensaryId: string): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) {
      await this.repo.remove(existing);
    }
    return this.repo.create({ dispensaryId });
  }
}
SERVICE_EOF

echo "  ✓ theme.service.ts"

# ─── 1d. Theme Resolver ───
cat > "$THEME_MOD/theme.resolver.ts" << 'RESOLVER_EOF'
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ThemeService } from './theme.service';
import { ThemeConfigType, SaveThemeConfigInput } from './dto';

@Resolver(() => ThemeConfigType)
export class ThemeResolver {
  constructor(private readonly themeService: ThemeService) {}

  @Query(() => ThemeConfigType, { name: 'themeConfig' })
  async getThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<ThemeConfigType> {
    return this.themeService.getByDispensaryId(dispensaryId);
  }

  @Mutation(() => ThemeConfigType, { name: 'saveThemeConfig' })
  async saveThemeConfig(
    @Args('input') input: SaveThemeConfigInput,
  ): Promise<ThemeConfigType> {
    return this.themeService.save(input);
  }

  @Mutation(() => ThemeConfigType, { name: 'resetThemeConfig' })
  async resetThemeConfig(
    @Args('dispensaryId') dispensaryId: string,
  ): Promise<ThemeConfigType> {
    return this.themeService.resetToDefault(dispensaryId);
  }
}
RESOLVER_EOF

echo "  ✓ theme.resolver.ts"

# ─── 1e. Theme Module ───
cat > "$THEME_MOD/theme.module.ts" << 'MODULE_EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeConfig } from './theme-config.entity';
import { ThemeService } from './theme.service';
import { ThemeResolver } from './theme.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ThemeConfig])],
  providers: [ThemeService, ThemeResolver],
  exports: [ThemeService],
})
export class ThemeModule {}
MODULE_EOF

cat > "$THEME_MOD/index.ts" << 'MOD_INDEX_EOF'
export { ThemeModule } from './theme.module';
export { ThemeService } from './theme.service';
export { ThemeConfig } from './theme-config.entity';
MOD_INDEX_EOF

echo "  ✓ theme.module.ts"

# ─── 1f. Migration ───
MIGRATION_DIR="$PROJECT_ROOT/apps/api/src/migrations"
mkdir -p "$MIGRATION_DIR"

TIMESTAMP=$(date +%s)
cat > "$MIGRATION_DIR/${TIMESTAMP}-CreateThemeConfigs.ts" << 'MIGRATION_EOF'
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateThemeConfigs implements MigrationInterface {
  name = 'CreateThemeConfigs';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'theme_configs',
        columns: [
          { name: 'id',             type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'dispensary_id',  type: 'uuid', isUnique: true },
          { name: 'preset',         type: 'varchar', default: "'casual'" },
          { name: 'primary',        type: 'varchar', length: '7', default: "'#2d6a4f'" },
          { name: 'secondary',      type: 'varchar', length: '7', default: "'#74956c'" },
          { name: 'accent',         type: 'varchar', length: '7', default: "'#c47820'" },
          { name: 'bg_primary',     type: 'varchar', length: '7', default: "'#faf6f0'" },
          { name: 'bg_secondary',   type: 'varchar', length: '7', default: "'#f0ebe3'" },
          { name: 'bg_card',        type: 'varchar', length: '7', default: "'#ffffff'" },
          { name: 'text_primary',   type: 'varchar', length: '7', default: "'#2c2418'" },
          { name: 'text_secondary', type: 'varchar', length: '7', default: "'#6b5e4f'" },
          { name: 'sidebar_bg',     type: 'varchar', length: '7', default: "'#1b3a2a'" },
          { name: 'sidebar_text',   type: 'varchar', length: '7', default: "'#c8d8c4'" },
          { name: 'color_success',  type: 'varchar', length: '7', default: "'#27ae60'" },
          { name: 'color_warning',  type: 'varchar', length: '7', default: "'#d97706'" },
          { name: 'color_error',    type: 'varchar', length: '7', default: "'#c0392b'" },
          { name: 'color_info',     type: 'varchar', length: '7', default: "'#2e86ab'" },
          { name: 'is_dark',        type: 'boolean', default: false },
          { name: 'created_at',     type: 'timestamptz', default: 'NOW()' },
          { name: 'updated_at',     type: 'timestamptz', default: 'NOW()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'theme_configs',
      new TableIndex({ name: 'IDX_theme_configs_dispensary', columnNames: ['dispensary_id'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('theme_configs', true);
  }
}
MIGRATION_EOF

echo "  ✓ migration: ${TIMESTAMP}-CreateThemeConfigs.ts"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: SHARED — @cannasaas/ui Theme Presets + ThemeLoader + ThemePicker
# ═══════════════════════════════════════════════════════════════════════════════
echo "🎨 [2/5] Updating @cannasaas/ui theme system..."

THEMES_DIR="$PROJECT_ROOT/packages/ui/src/themes"
mkdir -p "$THEMES_DIR"

# ─── 2a. Theme Presets (single source of truth) ───
cat > "$THEMES_DIR/presets.ts" << 'PRESETS_EOF'
/**
 * @file themes/presets.ts
 * @package @cannasaas/ui
 *
 * Earthy casual design presets — the 5 built-in themes.
 * Each has 14 color tokens + dark flag.
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  sidebarBg: string;
  sidebarText: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  isDark: boolean;
}

export interface ThemePreset extends ThemeColors {
  id: string;
  label: string;
  description: string;
  /** [primary, accent, background] — quick swatch preview */
  swatches: [string, string, string];
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  casual: {
    id: 'casual',
    label: 'Casual Earthy',
    description: 'Warm organic greens & parchment — the classic dispensary feel',
    swatches: ['#2d6a4f', '#c47820', '#faf6f0'],
    primary: '#2d6a4f',
    secondary: '#74956c',
    accent: '#c47820',
    bgPrimary: '#faf6f0',
    bgSecondary: '#f0ebe3',
    bgCard: '#ffffff',
    textPrimary: '#2c2418',
    textSecondary: '#6b5e4f',
    sidebarBg: '#1b3a2a',
    sidebarText: '#c8d8c4',
    success: '#27ae60',
    warning: '#d97706',
    error: '#c0392b',
    info: '#2e86ab',
    isDark: false,
  },
  verdant: {
    id: 'verdant',
    label: 'Verdant Dusk',
    description: 'Deep forest tones with golden hour warmth',
    swatches: ['#1a5c38', '#d4a24e', '#f7f4ed'],
    primary: '#1a5c38',
    secondary: '#5e8b6a',
    accent: '#d4a24e',
    bgPrimary: '#f7f4ed',
    bgSecondary: '#ece6da',
    bgCard: '#fffef9',
    textPrimary: '#1a1a14',
    textSecondary: '#5c5647',
    sidebarBg: '#0f2b1e',
    sidebarText: '#a3c4a6',
    success: '#2d8a50',
    warning: '#e8a317',
    error: '#b83028',
    info: '#3a7ca5',
    isDark: false,
  },
  terracotta: {
    id: 'terracotta',
    label: 'Terracotta Sage',
    description: 'Warm clay & desert sage — southwestern apothecary',
    swatches: ['#8b5a3c', '#c2662d', '#fdf8f3'],
    primary: '#8b5a3c',
    secondary: '#7a8b6f',
    accent: '#c2662d',
    bgPrimary: '#fdf8f3',
    bgSecondary: '#f3ece2',
    bgCard: '#fffefa',
    textPrimary: '#3a2a1e',
    textSecondary: '#7a6b5c',
    sidebarBg: '#2a1e14',
    sidebarText: '#c4b49e',
    success: '#4a8c5c',
    warning: '#d4880c',
    error: '#a83232',
    info: '#4e7e8f',
    isDark: false,
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight Garden',
    description: 'Rich dark luxury — electric sage on deep earth',
    swatches: ['#4cbe72', '#d4a030', '#0e1512'],
    primary: '#4cbe72',
    secondary: '#6b8a7a',
    accent: '#d4a030',
    bgPrimary: '#0e1512',
    bgSecondary: '#162019',
    bgCard: '#1a2820',
    textPrimary: '#e8efe6',
    textSecondary: '#9aaa96',
    sidebarBg: '#080d0a',
    sidebarText: '#7aaa82',
    success: '#4cbe72',
    warning: '#e8a317',
    error: '#e05555',
    info: '#5eafc4',
    isDark: true,
  },
  apothecary: {
    id: 'apothecary',
    label: 'Apothecary',
    description: 'Muted botanical — old-world herbal elegance',
    swatches: ['#4a6741', '#a67c52', '#f5f2ec'],
    primary: '#4a6741',
    secondary: '#8a7e6b',
    accent: '#a67c52',
    bgPrimary: '#f5f2ec',
    bgSecondary: '#ebe6dc',
    bgCard: '#fdfcf8',
    textPrimary: '#2a2820',
    textSecondary: '#6a6458',
    sidebarBg: '#24261e',
    sidebarText: '#b4b0a2',
    success: '#4a7a50',
    warning: '#c48820',
    error: '#a84040',
    info: '#5a7e8a',
    isDark: false,
  },
};

export const PRESET_IDS = Object.keys(THEME_PRESETS);
export type PresetId = keyof typeof THEME_PRESETS;
export const DEFAULT_PRESET: PresetId = 'casual';
PRESETS_EOF

echo "  ✓ themes/presets.ts"

# ─── 2b. Updated themes/index.ts (backward compatible) ───
cat > "$THEMES_DIR/index.ts" << 'THEMES_INDEX_EOF'
/**
 * @file themes/index.ts
 * @package @cannasaas/ui
 *
 * Re-exports everything from presets + backward-compatible aliases.
 */

export {
  THEME_PRESETS,
  PRESET_IDS,
  DEFAULT_PRESET,
  type PresetId,
  type ThemePreset,
  type ThemeColors,
} from './presets';

// ─── Backward-compatible aliases ───
// (ThemePicker previously imported AVAILABLE_THEMES / THEMES / DEFAULT_THEME / ThemeId)

import { THEME_PRESETS, PRESET_IDS, DEFAULT_PRESET } from './presets';
import type { ThemePreset } from './presets';

/** @deprecated use THEME_PRESETS */
export const THEMES: ThemeMeta[] = Object.values(THEME_PRESETS).map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  swatches: p.swatches,
  dark: p.isDark,
}));

/** @deprecated use THEME_PRESETS */
export const AVAILABLE_THEMES = THEMES;

export const THEME_IDS = PRESET_IDS;
export type ThemeId = typeof THEME_IDS[number];
export const DEFAULT_THEME = DEFAULT_PRESET;

export interface ThemeMeta {
  id: string;
  label: string;
  description: string;
  swatches: [string, string, string];
  dark: boolean;
}
THEMES_INDEX_EOF

echo "  ✓ themes/index.ts (backward compatible)"

# ─── 2c. CSS Variable Injector Utility ───
cat > "$PROJECT_ROOT/packages/ui/src/themes/inject.ts" << 'INJECT_EOF'
/**
 * @file themes/inject.ts
 * @package @cannasaas/ui
 *
 * Injects a ThemeColors object as CSS custom properties on :root.
 * Called by ThemeLoader when theme config is fetched from the API.
 */

import type { ThemeColors } from './presets';

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Inject all theme CSS custom properties onto the document root.
 * Also sets `data-theme-dark` attribute for dark-mode-aware styles.
 */
export function injectThemeVars(colors: ThemeColors): void {
  const root = document.documentElement;

  // Core color tokens
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);

  // Surfaces
  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-card', colors.bgCard);

  // Typography
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);

  // Sidebar / chrome
  root.style.setProperty('--sidebar-bg', colors.sidebarBg);
  root.style.setProperty('--sidebar-text', colors.sidebarText);

  // Semantic
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-info', colors.info);

  // RGB variants (for opacity utilities: rgba(var(--color-primary-rgb), 0.1))
  root.style.setProperty('--color-primary-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--color-accent-rgb', hexToRgb(colors.accent));
  root.style.setProperty('--color-success-rgb', hexToRgb(colors.success));
  root.style.setProperty('--color-warning-rgb', hexToRgb(colors.warning));
  root.style.setProperty('--color-error-rgb', hexToRgb(colors.error));
  root.style.setProperty('--color-info-rgb', hexToRgb(colors.info));

  // Dark mode attribute
  if (colors.isDark) {
    root.setAttribute('data-theme-dark', '');
  } else {
    root.removeAttribute('data-theme-dark');
  }
}
INJECT_EOF

echo "  ✓ themes/inject.ts"

# ─── 2d. ThemeLoader Component (replaces existing) ───
cat > "$PROJECT_ROOT/packages/ui/src/ThemeLoader.tsx" << 'THEMELOADER_EOF'
/**
 * @file ThemeLoader.tsx
 * @package @cannasaas/ui
 *
 * Invisible component that fetches the dispensary's theme config
 * from the GraphQL API and injects CSS custom properties.
 *
 * Drop into any portal's root layout:
 *   <ThemeLoader dispensaryId={orgId} apiUrl="/graphql" />
 *
 * If no dispensaryId is provided, it falls back to the "casual" preset.
 */

import { useEffect, useState } from 'react';
import { THEME_PRESETS, DEFAULT_PRESET } from './themes/presets';
import { injectThemeVars } from './themes/inject';
import type { ThemeColors } from './themes/presets';

interface ThemeLoaderProps {
  /** UUID of the current dispensary. If omitted, uses default preset. */
  dispensaryId?: string | null;
  /** GraphQL endpoint. Defaults to '/graphql'. */
  apiUrl?: string;
}

const THEME_CONFIG_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary
      sidebarBg sidebarText
      success warning error info
      isDark
    }
  }
`;

export function ThemeLoader({ dispensaryId, apiUrl = '/graphql' }: ThemeLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dispensaryId) {
      // No dispensary context yet — apply default preset
      injectThemeVars(THEME_PRESETS[DEFAULT_PRESET]);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function fetchTheme() {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: THEME_CONFIG_QUERY,
            variables: { dispensaryId },
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { data } = await res.json();

        if (!cancelled && data?.themeConfig) {
          const config = data.themeConfig as ThemeColors;
          injectThemeVars(config);
        }
      } catch (err) {
        console.warn('[ThemeLoader] Failed to fetch theme, using default:', err);
        if (!cancelled) {
          injectThemeVars(THEME_PRESETS[DEFAULT_PRESET]);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchTheme();
    return () => { cancelled = true; };
  }, [dispensaryId, apiUrl]);

  return null; // Invisible — side-effect only
}

/**
 * Apply a theme locally (without API call).
 * Useful for live preview in the theme designer.
 */
export function applyThemeLocally(colors: ThemeColors): void {
  injectThemeVars(colors);
}
THEMELOADER_EOF

echo "  ✓ ThemeLoader.tsx"

# ─── 2e. ThemePicker Component ───
cat > "$PROJECT_ROOT/packages/ui/src/ThemePicker.tsx" << 'THEMEPICKER_EOF'
/**
 * @file ThemePicker.tsx
 * @package @cannasaas/ui
 *
 * Compact preset selector for quick theme switching.
 * For the full designer, see apps/admin/src/pages/Settings/ThemePage.tsx
 */

import { THEME_PRESETS, DEFAULT_PRESET, type PresetId } from './themes/presets';

interface ThemePickerProps {
  activePreset: string;
  onSelect: (presetId: PresetId) => void;
}

export function ThemePicker({ activePreset, onSelect }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {Object.values(THEME_PRESETS).map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id as PresetId)}
            className={`rounded-xl border-2 overflow-hidden transition-all ${
              isActive
                ? 'border-brand-600 ring-2 ring-brand-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className="aspect-[4/3] p-2"
              style={{ background: preset.bgPrimary }}
            >
              <div
                className="h-1.5 rounded-full mb-1"
                style={{ background: preset.primary, width: '40%' }}
              />
              <div
                className="h-1 rounded-full"
                style={{ background: preset.primary, opacity: 0.15, width: '80%' }}
              />
            </div>
            <div className="px-2 py-1.5 text-center bg-white border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-900">{preset.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
THEMEPICKER_EOF

echo "  ✓ ThemePicker.tsx"

# ─── 2f. Update @cannasaas/ui barrel export ───
cat > "$PROJECT_ROOT/packages/ui/src/index.ts" << 'UI_INDEX_EOF'
// Components
export { ThemeLoader, applyThemeLocally } from './ThemeLoader';
export { ThemePicker } from './ThemePicker';

// Theme data
export {
  THEME_PRESETS,
  PRESET_IDS,
  DEFAULT_PRESET,
  type PresetId,
  type ThemePreset,
  type ThemeColors,
} from './themes/presets';

// Backward-compatible re-exports
export {
  THEMES,
  AVAILABLE_THEMES,
  THEME_IDS,
  DEFAULT_THEME,
  type ThemeId,
  type ThemeMeta,
} from './themes/index';

// CSS injector (for advanced use)
export { injectThemeVars } from './themes/inject';
UI_INDEX_EOF

echo "  ✓ packages/ui/src/index.ts"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: SHARED — @cannasaas/stores
# ═══════════════════════════════════════════════════════════════════════════════
echo "🏪 [3/5] Updating @cannasaas/stores..."

STORES_DIR="$PROJECT_ROOT/packages/stores/src"
mkdir -p "$STORES_DIR"

cat > "$STORES_DIR/useOrganizationStore.ts" << 'ORG_STORE_EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationState {
  orgId: string | null;
  orgName: string | null;
  dispensaryId: string | null;
  themePreset: string | null;

  setOrg: (orgId: string, orgName: string) => void;
  setDispensary: (dispensaryId: string) => void;
  setThemePreset: (preset: string) => void;
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      orgId: null,
      orgName: null,
      dispensaryId: null,
      themePreset: null,

      setOrg: (orgId, orgName) => set({ orgId, orgName }),
      setDispensary: (dispensaryId) => set({ dispensaryId }),
      setThemePreset: (preset) => set({ themePreset: preset }),
      reset: () =>
        set({ orgId: null, orgName: null, dispensaryId: null, themePreset: null }),
    }),
    { name: 'cannasaas-org' },
  ),
);
ORG_STORE_EOF

cat > "$STORES_DIR/useThemeStore.ts" << 'THEME_STORE_EOF'
import { create } from 'zustand';
import type { ThemeColors } from '@cannasaas/ui';
import { THEME_PRESETS, DEFAULT_PRESET } from '@cannasaas/ui';

interface ThemeState {
  /** Currently active colors (may be custom or from preset) */
  colors: ThemeColors;
  /** Active preset id or "custom" */
  activePreset: string;
  /** Has unsaved changes */
  dirty: boolean;

  setPreset: (presetId: string) => void;
  setColor: (key: keyof ThemeColors, value: string | boolean) => void;
  setColors: (colors: ThemeColors) => void;
  markClean: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colors: { ...THEME_PRESETS[DEFAULT_PRESET] },
  activePreset: DEFAULT_PRESET,
  dirty: false,

  setPreset: (presetId) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      set({ colors: { ...preset }, activePreset: presetId, dirty: true });
    }
  },

  setColor: (key, value) =>
    set((state) => ({
      colors: { ...state.colors, [key]: value },
      activePreset: 'custom',
      dirty: true,
    })),

  setColors: (colors) =>
    set({ colors, dirty: false }),

  markClean: () => set({ dirty: false }),
}));
THEME_STORE_EOF

cat > "$STORES_DIR/index.ts" << 'STORES_INDEX_EOF'
export { useOrganizationStore } from './useOrganizationStore';
export { useThemeStore } from './useThemeStore';
STORES_INDEX_EOF

echo "  ✓ useOrganizationStore.ts (with persist)"
echo "  ✓ useThemeStore.ts"
echo "  ✓ stores/index.ts"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: ADMIN — Theme Designer Page
# ═══════════════════════════════════════════════════════════════════════════════
echo "🖼️  [4/5] Creating admin ThemePage designer..."

THEME_PAGE_DIR="$PROJECT_ROOT/apps/admin/src/pages/Settings"
mkdir -p "$THEME_PAGE_DIR"

cat > "$THEME_PAGE_DIR/ThemePage.tsx" << 'THEMEPAGE_EOF'
import { useState, useCallback, useEffect } from 'react';
import {
  THEME_PRESETS,
  type ThemeColors,
  type PresetId,
  applyThemeLocally,
} from '@cannasaas/ui';
import { useThemeStore } from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';
import { Palette, Check, RotateCcw, Download, Eye } from 'lucide-react';

// ─── Color field definitions ───
const COLOR_FIELDS: { key: keyof ThemeColors; label: string; group: string }[] = [
  { key: 'primary', label: 'Primary', group: 'brand' },
  { key: 'secondary', label: 'Secondary', group: 'brand' },
  { key: 'accent', label: 'Accent', group: 'brand' },
  { key: 'bgPrimary', label: 'Background', group: 'surface' },
  { key: 'bgSecondary', label: 'Bg Secondary', group: 'surface' },
  { key: 'bgCard', label: 'Card', group: 'surface' },
  { key: 'textPrimary', label: 'Text Primary', group: 'surface' },
  { key: 'textSecondary', label: 'Text Secondary', group: 'surface' },
  { key: 'sidebarBg', label: 'Sidebar Bg', group: 'surface' },
  { key: 'sidebarText', label: 'Sidebar Text', group: 'surface' },
  { key: 'success', label: 'Success', group: 'semantic' },
  { key: 'warning', label: 'Warning', group: 'semantic' },
  { key: 'error', label: 'Error / Alert', group: 'semantic' },
  { key: 'info', label: 'Info', group: 'semantic' },
];

// ─── SAVE_MUTATION ───
const SAVE_MUTATION = `
  mutation SaveThemeConfig($input: SaveThemeConfigInput!) {
    saveThemeConfig(input: $input) {
      id preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary sidebarBg sidebarText
      success warning error info isDark
    }
  }
`;

const THEME_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary sidebarBg sidebarText
      success warning error info isDark
    }
  }
`;

// ─── Color Input Component ───
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-7 h-7 rounded-md overflow-hidden border border-gray-200 shrink-0 cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-[-4px] w-9 h-9 border-none cursor-pointer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-gray-600">{label}</div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className="text-[10px] font-mono text-gray-500 bg-transparent border-none outline-none p-0 w-full"
        />
      </div>
    </div>
  );
}

// ─── Main ThemePage ───
export default function ThemePage() {
  const dispensaryId = useOrganizationStore((s) => s.dispensaryId);
  const { colors, activePreset, dirty, setPreset, setColor, setColors, markClean } =
    useThemeStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // ─── Fetch existing config on mount ───
  useEffect(() => {
    if (!dispensaryId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: THEME_QUERY,
            variables: { dispensaryId },
          }),
        });
        const { data } = await res.json();
        if (data?.themeConfig) {
          const cfg = data.themeConfig;
          setColors(cfg as ThemeColors);
        }
      } catch (err) {
        console.warn('[ThemePage] Could not load theme config:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dispensaryId, setColors]);

  // ─── Live preview: inject CSS vars as colors change ───
  useEffect(() => {
    applyThemeLocally(colors);
  }, [colors]);

  // ─── Save to backend ───
  const handleSave = useCallback(async () => {
    if (!dispensaryId) {
      alert('No dispensary selected. Theme saved locally only.');
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaving(true);
    try {
      const input = {
        dispensaryId,
        preset: activePreset,
        ...colors,
      };

      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SAVE_MUTATION,
          variables: { input },
        }),
      });

      const { data, errors } = await res.json();
      if (errors?.length) throw new Error(errors[0].message);

      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[ThemePage] Save failed:', err);
      alert('Failed to save theme. Check console for details.');
    } finally {
      setSaving(false);
    }
  }, [dispensaryId, activePreset, colors, markClean]);

  // ─── Export helpers ───
  const generateCSS = () => {
    const c = colors;
    return `/* GreenStack Theme: ${activePreset} */
:root {
  --color-primary: ${c.primary};
  --color-secondary: ${c.secondary};
  --color-accent: ${c.accent};
  --bg-primary: ${c.bgPrimary};
  --bg-secondary: ${c.bgSecondary};
  --bg-card: ${c.bgCard};
  --text-primary: ${c.textPrimary};
  --text-secondary: ${c.textSecondary};
  --sidebar-bg: ${c.sidebarBg};
  --sidebar-text: ${c.sidebarText};
  --color-success: ${c.success};
  --color-warning: ${c.warning};
  --color-error: ${c.error};
  --color-info: ${c.info};
}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading theme...
      </div>
    );
  }

  const brandFields = COLOR_FIELDS.filter((f) => f.group === 'brand');
  const surfaceFields = COLOR_FIELDS.filter((f) => f.group === 'surface');
  const semanticFields = COLOR_FIELDS.filter((f) => f.group === 'semantic');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette size={24} />
            Theme Designer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize colors for all portals — storefront, admin, staff & kiosk
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download size={14} />
            {showExport ? 'Back' : 'Export CSS'}
          </button>
          <button
            onClick={() => {
              setPreset('casual');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {saved ? <Check size={14} /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Theme'}
          </button>
        </div>
      </div>

      {showExport ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">CSS Custom Properties</h2>
          <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs font-mono overflow-auto leading-relaxed">
            {generateCSS()}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Presets + Colors */}
          <div className="col-span-4 space-y-4">
            {/* Presets */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Design Presets
              </h2>
              <div className="space-y-1.5">
                {Object.values(THEME_PRESETS).map((p) => {
                  const isActive = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-gray-100 ring-1 ring-gray-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {p.swatches.map((c: string, i: number) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{
                              background: c,
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{p.label}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Brand Colors
              </h2>
              <div className="space-y-3">
                {brandFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
            </div>

            {/* Surface Colors */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Surfaces & Type
              </h2>
              <div className="space-y-3">
                {surfaceFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Semantic / Functional
              </h2>
              <div className="space-y-3">
                {semanticFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {semanticFields.map((f) => (
                  <span
                    key={f.key}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${colors[f.key] as string}1a`,
                      color: colors[f.key] as string,
                    }}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Live Preview */}
          <div className="col-span-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-gray-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Live Preview
                </h2>
                {dirty && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                    Unsaved changes
                  </span>
                )}
              </div>

              {/* Admin Preview */}
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-gray-400">admin.greenleaf.com</span>
                </div>
                <div className="flex" style={{ minHeight: 240 }}>
                  <aside
                    className="w-32 p-2 flex flex-col gap-0.5 shrink-0"
                    style={{ background: colors.sidebarBg, color: colors.sidebarText }}
                  >
                    <div
                      className="text-[10px] font-bold px-2 py-1 mb-1"
                      style={{ color: colors.primary }}
                    >
                      Admin Portal
                    </div>
                    {['Dashboard', 'Products', 'Orders', 'Inventory', 'Settings'].map(
                      (item, i) => (
                        <div
                          key={item}
                          className="text-[9px] px-2 py-1 rounded"
                          style={{
                            background: i === 0 ? `${colors.sidebarText}15` : 'transparent',
                            color: i === 0 ? '#fff' : colors.sidebarText,
                            fontWeight: i === 0 ? 600 : 400,
                          }}
                        >
                          {item}
                        </div>
                      ),
                    )}
                  </aside>
                  <main className="flex-1 p-3" style={{ background: colors.bgPrimary, color: colors.textPrimary }}>
                    <div className="text-sm font-bold mb-3">Dashboard</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: 'Revenue', val: '$12,450', c: colors.primary },
                        { label: 'Orders', val: '187', c: colors.textPrimary },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-md p-2"
                          style={{
                            background: colors.bgCard,
                            border: `1px solid ${colors.textSecondary}14`,
                          }}
                        >
                          <div className="text-[8px]" style={{ color: colors.textSecondary }}>
                            {s.label}
                          </div>
                          <div className="text-sm font-bold" style={{ color: s.c }}>
                            {s.val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{ background: `${colors.warning}1a`, color: colors.warning }}
                      >
                        ⚠ Low stock: Purple Haze
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{ background: `${colors.success}1a`, color: colors.success }}
                      >
                        ✓ Metrc sync complete
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{ background: `${colors.error}1a`, color: colors.error }}
                      >
                        ✕ License expiring soon
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{ background: `${colors.info}1a`, color: colors.info }}
                      >
                        ℹ 3 new orders pending
                      </div>
                    </div>
                  </main>
                </div>
              </div>

              {/* Storefront Preview */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-gray-400">greenleaf.com</span>
                </div>
                <div style={{ background: colors.bgPrimary, color: colors.textPrimary }}>
                  <header
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      background: colors.bgCard,
                      borderBottom: `1px solid ${colors.textSecondary}14`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded" style={{ background: colors.primary }} />
                      <span className="text-xs font-bold">GreenLeaf</span>
                    </div>
                    <span
                      className="text-[9px] px-2 py-1 rounded font-semibold"
                      style={{ background: colors.primary, color: '#fff' }}
                    >
                      Sign In
                    </span>
                  </header>
                  <div className="p-3">
                    <div className="flex gap-1 mb-3">
                      {['All', 'Flower', 'Edible'].map((c, i) => (
                        <span
                          key={c}
                          className="text-[9px] px-2 py-1 rounded font-semibold"
                          style={{
                            background: i === 0 ? colors.primary : colors.bgCard,
                            color: i === 0 ? '#fff' : colors.textSecondary,
                            border: i === 0 ? 'none' : `1px solid ${colors.textSecondary}20`,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Blue Dream', 'OG Kush', 'GSC'].map((name) => (
                        <div
                          key={name}
                          className="rounded-md overflow-hidden"
                          style={{
                            background: colors.bgCard,
                            border: `1px solid ${colors.textSecondary}10`,
                          }}
                        >
                          <div
                            className="aspect-[4/3]"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}0d, ${colors.secondary}08)`,
                            }}
                          />
                          <div className="p-2">
                            <div className="text-[10px] font-bold">{name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] font-bold" style={{ color: colors.primary }}>
                                $35
                              </span>
                              <span
                                className="text-[7px] px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: colors.primary, color: '#fff' }}
                              >
                                Add
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active palette row */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Active Palette
                </span>
                <div className="flex gap-1">
                  {[
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    colors.bgPrimary,
                    colors.bgCard,
                    colors.success,
                    colors.warning,
                    colors.error,
                    colors.info,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ background: c as string }}
                      title={c as string}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
THEMEPAGE_EOF

echo "  ✓ ThemePage.tsx (full designer)"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: BASE CSS — Theme Variables Consumed by All Portals
# ═══════════════════════════════════════════════════════════════════════════════
echo "🎭 [5/5] Creating base theme CSS..."

cat > "$PROJECT_ROOT/packages/ui/src/theme-vars.css" << 'CSS_EOF'
/*
 * theme-vars.css
 * @package @cannasaas/ui
 *
 * Default CSS custom properties — "Casual Earthy" preset.
 * ThemeLoader overrides these at runtime via JS.
 *
 * Usage in Tailwind: use arbitrary properties like bg-[var(--bg-primary)]
 * or add to your tailwind.config under theme.extend.colors.
 */

:root {
  /* Brand */
  --color-primary: #2d6a4f;
  --color-secondary: #74956c;
  --color-accent: #c47820;

  /* Surfaces */
  --bg-primary: #faf6f0;
  --bg-secondary: #f0ebe3;
  --bg-card: #ffffff;

  /* Typography */
  --text-primary: #2c2418;
  --text-secondary: #6b5e4f;

  /* Sidebar / Chrome */
  --sidebar-bg: #1b3a2a;
  --sidebar-text: #c8d8c4;

  /* Semantic */
  --color-success: #27ae60;
  --color-warning: #d97706;
  --color-error: #c0392b;
  --color-info: #2e86ab;

  /* RGB variants for opacity utilities */
  --color-primary-rgb: 45, 106, 79;
  --color-accent-rgb: 196, 120, 32;
  --color-success-rgb: 39, 174, 96;
  --color-warning-rgb: 217, 119, 6;
  --color-error-rgb: 192, 57, 43;
  --color-info-rgb: 46, 134, 171;
}

/* ─── Utility classes consuming the vars ─── */

.bg-theme-primary { background-color: var(--bg-primary); }
.bg-theme-secondary { background-color: var(--bg-secondary); }
.bg-theme-card { background-color: var(--bg-card); }
.bg-theme-sidebar { background-color: var(--sidebar-bg); }

.text-theme-primary { color: var(--text-primary); }
.text-theme-secondary { color: var(--text-secondary); }
.text-theme-sidebar { color: var(--sidebar-text); }

.text-brand-primary { color: var(--color-primary); }
.text-brand-secondary { color: var(--color-secondary); }
.text-brand-accent { color: var(--color-accent); }

.bg-brand-primary { background-color: var(--color-primary); }
.bg-brand-accent { background-color: var(--color-accent); }

.text-semantic-success { color: var(--color-success); }
.text-semantic-warning { color: var(--color-warning); }
.text-semantic-error { color: var(--color-error); }
.text-semantic-info { color: var(--color-info); }

.bg-semantic-success { background-color: rgba(var(--color-success-rgb), 0.1); }
.bg-semantic-warning { background-color: rgba(var(--color-warning-rgb), 0.1); }
.bg-semantic-error { background-color: rgba(var(--color-error-rgb), 0.1); }
.bg-semantic-info { background-color: rgba(var(--color-info-rgb), 0.1); }

.border-brand { border-color: var(--color-primary); }
CSS_EOF

echo "  ✓ theme-vars.css"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# POST-INSTALL INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════╗"
echo "║              ✅ All files created!                ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "📋 Manual steps remaining:"
echo ""
echo "  1. Register the ThemeModule in your NestJS AppModule:"
echo "     ─────────────────────────────────────────────"
echo "     // apps/api/src/app.module.ts"
echo "     import { ThemeModule } from './modules/theme';"
echo "     @Module({"
echo "       imports: [..., ThemeModule],"
echo "     })"
echo "     ─────────────────────────────────────────────"
echo ""
echo "  2. Add ThemeConfig to TypeORM entities array:"
echo "     ─────────────────────────────────────────────"
echo "     import { ThemeConfig } from './modules/theme';"
echo "     entities: [..., ThemeConfig],"
echo "     ─────────────────────────────────────────────"
echo ""
echo "  3. Run the migration:"
echo "     pnpm --filter @cannasaas/api typeorm migration:run"
echo ""
echo "  4. Add @cannasaas/ui dep to @cannasaas/stores:"
echo "     pnpm --filter @cannasaas/stores add @cannasaas/ui@workspace:*"
echo ""
echo "  5. Install class-validator if not already in the API:"
echo "     pnpm --filter @cannasaas/api add class-validator class-transformer"
echo ""
echo "  6. Update admin main.tsx to import theme-vars.css:"
echo "     ─────────────────────────────────────────────"
echo "     import '@cannasaas/ui/src/theme-vars.css';"
echo "     // (instead of or in addition to casual.css)"
echo "     ─────────────────────────────────────────────"
echo ""
echo "  7. Run pnpm install from the monorepo root:"
echo "     pnpm install"
echo ""
echo "📁 Backup saved to: $BACKUP_DIR"
echo ""
echo "Done! Start the admin app and navigate to /settings/theme"
