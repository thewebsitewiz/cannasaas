import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extends `theme_configs` with the four columns the per-dispensary
 * theming feature needs beyond the existing 14 colors:
 *
 *   logo_url       — uploaded brand mark (square-ish), 2 MB cap
 *   masthead_url   — uploaded hero/banner image, 5 MB cap
 *   display_font   — Google Fonts family for headings / display text
 *   body_font      — Google Fonts family for body copy
 *
 * All nullable so existing rows survive untouched; the CSS generator
 * falls back to the chosen preset's font defaults when the columns
 * are null.
 */
export class AddThemeBrandingAndFonts1780200000000
  implements MigrationInterface
{
  name = 'AddThemeBrandingAndFonts1780200000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE theme_configs
         ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
         ADD COLUMN IF NOT EXISTS masthead_url VARCHAR(500),
         ADD COLUMN IF NOT EXISTS display_font VARCHAR(100),
         ADD COLUMN IF NOT EXISTS body_font VARCHAR(100)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE theme_configs
         DROP COLUMN IF EXISTS body_font,
         DROP COLUMN IF EXISTS display_font,
         DROP COLUMN IF EXISTS masthead_url,
         DROP COLUMN IF EXISTS logo_url`,
    );
  }
}
