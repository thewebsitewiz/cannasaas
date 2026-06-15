/**
 * Server-side helpers around the curated Google Fonts allowlist.
 * The catalog itself lives in `@cannasaas/types` so it stays in
 * lockstep with the admin UI's font picker
 * (`packages/angular/projects/admin/src/app/pages/settings/theme/font-catalog.ts`).
 *
 * `findGoogleFont` is what `ThemeCssService` calls to validate the
 * persisted `display_font` / `body_font` columns before emitting an
 * `@import` line.
 */
import {
  GOOGLE_FONT_CATALOG,
  type GoogleFontEntry,
  type GoogleFontKind,
} from '@cannasaas/types';

export type FontKind = GoogleFontKind;
export type GoogleFont = GoogleFontEntry;

export const GOOGLE_FONTS: readonly GoogleFont[] = GOOGLE_FONT_CATALOG;

const BY_FAMILY = new Map<string, GoogleFont>(
  GOOGLE_FONTS.map((f) => [f.family, f]),
);

/** Returns the font entry if `family` is in the curated allowlist. */
export function findGoogleFont(
  family: string | null | undefined,
): GoogleFont | undefined {
  if (!family) return undefined;
  return BY_FAMILY.get(family);
}

/** Stack appended to every font family in the generated CSS so the page
 *  still renders if Google Fonts fails. Display fonts assume serif-ish
 *  fallbacks; body assumes sans-serif. */
export function fontStackFor(family: string, kind: FontKind): string {
  const fallback =
    kind === 'display'
      ? 'Georgia, "Times New Roman", serif'
      : 'system-ui, sans-serif';
  return `"${family}", ${fallback}`;
}
