/**
 * Curated Google Fonts the admin can pick from when customizing a
 * dispensary's theme. MUST stay in lockstep with the server-side
 * catalog in `apps/api/src/modules/theme/fonts.ts` — the server
 * validates `displayFont` / `bodyFont` against its allowlist and
 * silently drops fonts that aren't in both lists.
 */
export type FontKind = 'display' | 'body';

export interface CatalogFont {
  readonly family: string;
  readonly kind: FontKind;
}

export const FONT_CATALOG: readonly CatalogFont[] = [
  // Display
  { family: 'Playfair Display', kind: 'display' },
  { family: 'Lora', kind: 'display' },
  { family: 'Cormorant Garamond', kind: 'display' },
  { family: 'Bebas Neue', kind: 'display' },
  { family: 'Oswald', kind: 'display' },
  { family: 'Archivo Black', kind: 'display' },
  { family: 'Space Grotesk', kind: 'display' },
  { family: 'Plus Jakarta Sans', kind: 'display' },
  { family: 'DM Serif Display', kind: 'display' },
  { family: 'Fraunces', kind: 'display' },
  // Body
  { family: 'Inter', kind: 'body' },
  { family: 'IBM Plex Sans', kind: 'body' },
  { family: 'Source Sans 3', kind: 'body' },
  { family: 'Nunito Sans', kind: 'body' },
  { family: 'Work Sans', kind: 'body' },
  { family: 'Manrope', kind: 'body' },
];

export const DISPLAY_FONTS = FONT_CATALOG.filter((f) => f.kind === 'display');
export const BODY_FONTS = FONT_CATALOG.filter((f) => f.kind === 'body');
