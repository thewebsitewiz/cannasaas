/**
 * Curated Google Fonts catalog used by the per-dispensary theming
 * feature (sc-637). One source of truth — consumed by:
 *
 * - `apps/api/src/modules/theme/fonts.ts` — server allowlist + the
 *   `@import url(...)` URLs emitted by `ThemeCssService`
 * - `packages/angular/projects/admin/src/app/pages/settings/theme/font-catalog.ts`
 *   — display + body dropdown options on the theme designer
 *
 * Updating: add an entry here, rebuild the server (`pnpm --filter
 * @cannasaas/api build`) + rebuild the ui library (`pnpm build:ui`)
 * so the new family shows up in both surfaces. The server uses the
 * `url` to inject `@import`; the admin UI uses `family` + `kind` to
 * populate the dropdowns.
 */
export type GoogleFontKind = 'display' | 'body';

export interface GoogleFontEntry {
  readonly family: string;
  readonly url: string;
  readonly kind: GoogleFontKind;
}

export const GOOGLE_FONT_CATALOG: readonly GoogleFontEntry[] = [
  // ── Display fonts (headings, mastheads, brand voice) ──
  {
    family: 'Playfair Display',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&display=swap',
    kind: 'display',
  },
  {
    family: 'Lora',
    url: 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap',
    kind: 'display',
  },
  {
    family: 'Cormorant Garamond',
    url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap',
    kind: 'display',
  },
  {
    family: 'Bebas Neue',
    url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    kind: 'display',
  },
  {
    family: 'Oswald',
    url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap',
    kind: 'display',
  },
  {
    family: 'Archivo Black',
    url: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
    kind: 'display',
  },
  {
    family: 'Space Grotesk',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap',
    kind: 'display',
  },
  {
    family: 'Plus Jakarta Sans',
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
    kind: 'display',
  },
  {
    family: 'DM Serif Display',
    url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
    kind: 'display',
  },
  {
    family: 'Fraunces',
    url: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&display=swap',
    kind: 'display',
  },

  // ── Body fonts (paragraphs, UI copy) ──
  {
    family: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
    kind: 'body',
  },
  {
    family: 'IBM Plex Sans',
    url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap',
    kind: 'body',
  },
  {
    family: 'Source Sans 3',
    url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap',
    kind: 'body',
  },
  {
    family: 'Nunito Sans',
    url: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600&display=swap',
    kind: 'body',
  },
  {
    family: 'Work Sans',
    url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap',
    kind: 'body',
  },
  {
    family: 'Manrope',
    url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap',
    kind: 'body',
  },
];
