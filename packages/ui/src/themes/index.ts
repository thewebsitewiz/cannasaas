/**
 * @file themes/index.ts
 * @package @cannasaas/ui
 *
 * Re-exports everything from presets + backward-compatible aliases.
 */

export {
  THEME_PRESETS,
  PRESET_IDS,
  DEFAULT_PRESET,
  type PresetId,
  type ThemePreset,
  type ThemeColors,
} from './presets';

// ─── Backward-compatible aliases ───
// (ThemePicker previously imported AVAILABLE_THEMES / THEMES / DEFAULT_THEME / ThemeId)

import { THEME_PRESETS, PRESET_IDS, DEFAULT_PRESET } from './presets';
import type { ThemePreset } from './presets';

/** @deprecated use THEME_PRESETS */
export const THEMES: ThemeMeta[] = Object.values(THEME_PRESETS).map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  swatches: p.swatches,
  dark: p.isDark,
}));

/** @deprecated use THEME_PRESETS */
export const AVAILABLE_THEMES = THEMES;

export const THEME_IDS = PRESET_IDS;
export type ThemeId = typeof THEME_IDS[number];
export const DEFAULT_THEME = DEFAULT_PRESET;

export interface ThemeMeta {
  id: string;
  label: string;
  description: string;
  swatches: [string, string, string];
  dark: boolean;
}
