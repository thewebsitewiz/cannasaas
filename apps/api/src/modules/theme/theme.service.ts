import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ThemeService {
  private readonly logger = new Logger(ThemeService.name);
  constructor(@InjectDataSource() private ds: DataSource) {}

  async getThemes(): Promise<any[]> {
    return this.ds.query('SELECT * FROM lkp_themes WHERE is_active = true ORDER BY theme_id');
  }

  async getDispensaryTheme(dispensaryId: string): Promise<any> {
    const [result] = await this.ds.query('SELECT theme_code, custom_css, logo_url, brand_name, name FROM dispensaries WHERE entity_id = $1', [dispensaryId]);
    return result ?? { theme_code: 'default' };
  }

  async setDispensaryTheme(dispensaryId: string, themeCode: string, customCss?: string): Promise<any> {
    await this.ds.query('UPDATE dispensaries SET theme_code = $1, custom_css = COALESCE($2, custom_css), updated_at = NOW() WHERE entity_id = $3', [themeCode, customCss || null, dispensaryId]);
    return this.getDispensaryTheme(dispensaryId);
  }
}
