/**
 * Curated list of Google Fonts an admin can pick from when customizing
 * a dispensary's theme (sc-637 follow-on). Keeping this in one place
 * means the CSS generator, the GraphQL "available fonts" query, and the
 * admin UI all share one source of truth.
 *
 * `family` is the human-readable name (must match the Google Fonts CSS
 * API exactly). `url` is the pre-built `fonts.googleapis.com/css2` import
 * URL with sensible weights baked in. `kind` distinguishes display (large
 * headings) from body (long-form copy) — the picker shows two dropdowns
 * scoped to each kind.
 */
export type FontKind = 'display' | 'body';

export interface GoogleFont {
  readonly family: string;
  readonly url: string;
  readonly kind: FontKind;
}

export const GOOGLE_FONTS: readonly GoogleFont[] = [
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
