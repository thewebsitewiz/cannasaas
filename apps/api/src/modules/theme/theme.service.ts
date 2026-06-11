import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ThemeConfig } from './theme-config.entity';
import { SaveThemeConfigInput } from './dto';
import { CacheService } from '../../common/services/cache.service';

interface ThemableDispensaryRow {
  readonly entityId: string;
  readonly name: string;
  readonly slug: string;
  readonly preset: string | null;
  readonly logoUrl: string | null;
}

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(ThemeConfig)
    private readonly repo: Repository<ThemeConfig>,
    private readonly cache: CacheService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  /** Get theme config for a dispensary (returns defaults if none saved) */
  async getByDispensaryId(dispensaryId: string): Promise<ThemeConfig> {
    const cacheKey = `theme:${dispensaryId}`;
    const cached = await this.cache.get<ThemeConfig>(cacheKey);
    if (cached) return cached;

    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) {
      await this.cache.set(cacheKey, existing, 300);
      return existing;
    }

    // Return unsaved defaults so the frontend always gets a config
    // Return in-memory defaults (column defaults don't apply on .create())
    const defaults = this.repo.create({
      dispensaryId,
      preset: 'casual',
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
    });
    defaults.id = dispensaryId; // placeholder ID
    return defaults;
  }

  /** Upsert theme config — creates if missing, updates if exists */
  async save(input: SaveThemeConfigInput): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({
      where: { dispensaryId: input.dispensaryId },
    });

    let result: ThemeConfig;
    if (existing) {
      const merged = existing as unknown as Record<string, unknown>;
      const inputRecord = input as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(inputRecord)) {
        if (value !== undefined && value !== null) {
          merged[key] = value;
        }
      }
      result = await this.repo.save(existing);
    } else {
      const config = this.repo.create(input);
      result = await this.repo.save(config);
    }

    // Invalidate cache on save
    await this.cache.del(`theme:${input.dispensaryId}`);
    return result;
  }

  /**
   * Returns the dispensaries the caller is allowed to theme, projected
   * to the columns the admin picker actually needs (name + slug + the
   * existing preset / logoUrl so the UI can render a thumbnail).
   *
   * Scoping rules:
   *   super_admin       → all active dispensaries
   *   org_admin         → all active dispensaries in their organization
   *   dispensary_admin  → only their own dispensary
   */
  async listThemableForUser(
    role: string,
    dispensaryId: string | null | undefined,
    organizationId: string | null | undefined,
  ): Promise<ThemableDispensaryRow[]> {
    if (role === 'super_admin') {
      return this.ds.query(
        `SELECT d.entity_id AS "entityId", d.name, d.slug,
                tc.preset, tc.logo_url AS "logoUrl"
           FROM dispensaries d
           LEFT JOIN theme_configs tc ON tc.dispensary_id = d.entity_id
          WHERE d.is_active = TRUE
          ORDER BY d.name ASC`,
      );
    }
    if (role === 'org_admin') {
      if (!organizationId) return [];
      return this.ds.query(
        `SELECT d.entity_id AS "entityId", d.name, d.slug,
                tc.preset, tc.logo_url AS "logoUrl"
           FROM dispensaries d
           JOIN companies c ON c.company_id = d.company_id
           LEFT JOIN theme_configs tc ON tc.dispensary_id = d.entity_id
          WHERE d.is_active = TRUE AND c.organization_id = $1
          ORDER BY d.name ASC`,
        [organizationId],
      );
    }
    if (role === 'dispensary_admin') {
      if (!dispensaryId) return [];
      return this.ds.query(
        `SELECT d.entity_id AS "entityId", d.name, d.slug,
                tc.preset, tc.logo_url AS "logoUrl"
           FROM dispensaries d
           LEFT JOIN theme_configs tc ON tc.dispensary_id = d.entity_id
          WHERE d.entity_id = $1`,
        [dispensaryId],
      );
    }
    return [];
  }

  /** Reset to default casual theme */
  async resetToDefault(dispensaryId: string): Promise<ThemeConfig> {
    const existing = await this.repo.findOne({ where: { dispensaryId } });
    if (existing) {
      await this.repo.remove(existing);
    }
    // Invalidate cache on reset
    await this.cache.del(`theme:${dispensaryId}`);
    return this.repo.create({ dispensaryId });
  }
}
