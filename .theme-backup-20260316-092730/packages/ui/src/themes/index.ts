/**
 * @file themes/index.ts
 * @package @cannasaas/ui
 *
 * Single source of truth for all available themes.
 * Consumed by ThemePicker (admin UI) and the API validation layer.
 */

export interface ThemeMeta {
  id: string;
  label: string;
  description: string;
  /** [primary, accent, background] — for swatch preview */
  swatches: [string, string, string];
  dark: boolean;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'casual',
    label: 'Casual',
    description:
      'Warm organic greens & parchment. The classic dispensary feel.',
    swatches: ['#2a6640', '#c47820', '#f7f2e7'],
    dark: false,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Rich dark luxury. Electric sage on deep black.',
    swatches: ['#4cbe72', '#d4a030', '#101a12'],
    dark: true,
  },
  {
    id: 'regal',
    label: 'Regal',
    description: 'Deep jewel tones. Burgundy & aged gold on cream parchment.',
    swatches: ['#7a2838', '#b8920a', '#f8f4ee'],
    dark: false,
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean minimal. Electric teal on crisp white.',
    swatches: ['#0a7a6a', '#e85d20', '#f8f9fa'],
    dark: false,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Near-monochrome editorial. Ultra-refined luxury apothecary.',
    swatches: ['#1a1a1a', '#2a7a40', '#fafafa'],
    dark: false,
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME: ThemeId = 'casual';

export const AVAILABLE_THEMES = THEMES;
