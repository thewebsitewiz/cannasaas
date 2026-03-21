// Components
export { ThemeLoader, applyThemeLocally } from './ThemeLoader';
export { ThemePicker } from './ThemePicker';

// Theme data
export {
  THEME_PRESETS,
  PRESET_IDS,
  DEFAULT_PRESET,
  type PresetId,
  type ThemePreset,
  type ThemeColors,
} from './themes/presets';

// Backward-compatible re-exports
export {
  THEMES,
  AVAILABLE_THEMES,
  THEME_IDS,
  DEFAULT_THEME,
  type ThemeId,
  type ThemeMeta,
} from './themes/index';

// CSS injector
export { injectThemeVars, setThemePreset, clearInlineThemeVars } from './themes/inject';
