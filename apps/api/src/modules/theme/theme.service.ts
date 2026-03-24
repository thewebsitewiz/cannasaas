import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ThemeConfig } from './theme-config.entity';
import { SaveThemeConfigInput } from './dto';
import { CacheService } from '../../common/services/cache.service';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class ThemeService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly cache: CacheService,
  ) {}

  /** Get theme config for a dispensary (returns defaults if none saved) */
  async getByDispensaryId(dispensaryId: string): Promise<ThemeConfig> {
    const cacheKey = `theme:${dispensaryId}`;
    const cached = await this.cache.get<ThemeConfig>(cacheKey);
    if (cached) return cached;

    const rows = await this._q(
      `SELECT * FROM theme_configs WHERE "dispensaryId" = $1 LIMIT 1`,
      [dispensaryId],
    );
    const existing = rows[0] as ThemeConfig | undefined;
    if (existing) {
      await this.cache.set(cacheKey, existing, 300);
      return existing;
    }

    // Return in-memory defaults
    const defaults: any = {
      id: dispensaryId,
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
    };
    return defaults as ThemeConfig;
  }

  /** Upsert theme config — creates if missing, updates if exists */
  async save(input: SaveThemeConfigInput): Promise<ThemeConfig> {
    const rows = await this._q(
      `SELECT * FROM theme_configs WHERE "dispensaryId" = $1 LIMIT 1`,
      [input.dispensaryId],
    );
    const existing = rows[0];

    let result: ThemeConfig;
    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null && key !== 'dispensaryId') {
          fields.push(`"${key}" = $${idx}`);
          values.push(value);
          idx++;
        }
      }
      if (fields.length > 0) {
        values.push(input.dispensaryId);
        await this._q(
          `UPDATE theme_configs SET ${fields.join(', ')}, "updatedAt" = NOW() WHERE "dispensaryId" = $${idx}`,
          values,
        );
      }
      const [updated] = await this._q(
        `SELECT * FROM theme_configs WHERE "dispensaryId" = $1`,
        [input.dispensaryId],
      );
      result = updated as ThemeConfig;
    } else {
      const keys = Object.keys(input).filter(k => (input as any)[k] !== undefined);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const vals = keys.map(k => (input as any)[k]);
      const [inserted] = await this._q(
        `INSERT INTO theme_configs (${cols}) VALUES (${placeholders}) RETURNING *`,
        vals,
      );
      result = inserted as ThemeConfig;
    }

    await this.cache.del(`theme:${input.dispensaryId}`);
    return result;
  }

  /** Reset to default casual theme */
  async resetToDefault(dispensaryId: string): Promise<ThemeConfig> {
    await this._q(
      `DELETE FROM theme_configs WHERE "dispensaryId" = $1`,
      [dispensaryId],
    );
    await this.cache.del(`theme:${dispensaryId}`);
    return { dispensaryId } as ThemeConfig;
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
