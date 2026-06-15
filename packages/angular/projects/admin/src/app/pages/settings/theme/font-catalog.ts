/**
 * Admin-side projection of the curated Google Fonts catalog. The
 * source of truth lives in `@cannasaas/types` so this stays in
 * lockstep with the server-side allowlist in
 * `apps/api/src/modules/theme/fonts.ts`. The picker only needs
 * `family` + `kind`, so we re-export a stripped-down view here.
 */
import { GOOGLE_FONT_CATALOG, type GoogleFontKind } from '@cannasaas/types';

export type FontKind = GoogleFontKind;

export interface CatalogFont {
  readonly family: string;
  readonly kind: FontKind;
}

export const FONT_CATALOG: readonly CatalogFont[] = GOOGLE_FONT_CATALOG.map(
  (f) => ({ family: f.family, kind: f.kind }),
);

export const DISPLAY_FONTS = FONT_CATALOG.filter((f) => f.kind === 'display');
export const BODY_FONTS = FONT_CATALOG.filter((f) => f.kind === 'body');
