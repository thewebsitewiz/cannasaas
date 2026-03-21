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
