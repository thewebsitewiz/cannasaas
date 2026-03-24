import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeConfig } from './theme-config.entity';
import { SaveThemeConfigInput } from './dto';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(ThemeConfig)
    private readonly repo: Repository<ThemeConfig>,
    private readonly cache: CacheService,
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
      // Merge only provided fields
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          (existing as any)[key] = value;
        }
      });
      result = await this.repo.save(existing);
    } else {
      const config = this.repo.create(input);
      result = await this.repo.save(config);
    }

    // Invalidate cache on save
    await this.cache.del(`theme:${input.dispensaryId}`);
    return result;
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
