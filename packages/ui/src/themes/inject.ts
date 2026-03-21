/**
 * @file themes/inject.ts
 * @package @cannasaas/ui
 *
 * Injects theme by setting data-theme attribute and/or
 * overriding individual CSS custom properties on :root.
 */

import type { ThemeColors } from './presets';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Switch to a named preset theme via data-theme attribute.
 * The corresponding theme.*.css file must be imported.
 */
export function setThemePreset(themeId: string): void {
  const root = document.documentElement;
  if (themeId === 'casual') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', themeId);
  }
}

/**
 * Inject custom color overrides as inline CSS properties on :root.
 * Used by the Theme Designer for live preview of custom colors.
 * Property names match what casual.css expects.
 */
export function injectThemeVars(colors: ThemeColors): void {
  const root = document.documentElement;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);

  root.style.setProperty('--color-bg', colors.bgPrimary);
  root.style.setProperty('--color-bg-alt', colors.bgSecondary);
  root.style.setProperty('--color-surface', colors.bgCard);
  root.style.setProperty('--color-surface-alt', colors.bgSecondary);

  root.style.setProperty('--color-text', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);

  root.style.setProperty('--gs-deep-pine', colors.sidebarBg);
  root.style.setProperty('--gs-pine', colors.sidebarBg);

  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-danger', colors.error);
  root.style.setProperty('--color-info', colors.info);

  root.style.setProperty('--color-primary-rgb', hexToRgb(colors.primary));
  root.style.setProperty('--color-accent-rgb', hexToRgb(colors.accent));

  if (colors.isDark) {
    root.setAttribute('data-theme-dark', '');
    root.style.setProperty('color-scheme', 'dark');
  } else {
    root.removeAttribute('data-theme-dark');
    root.style.setProperty('color-scheme', 'light');
  }
}

/**
 * Clear all inline style overrides from :root.
 * Call this when switching back to a pure CSS preset.
 */
export function clearInlineThemeVars(): void {
  const root = document.documentElement;
  const props = [
    '--color-primary', '--color-primary-hover', '--color-accent',
    '--color-bg', '--color-bg-alt', '--color-surface', '--color-surface-alt',
    '--color-text', '--color-text-secondary',
    '--gs-deep-pine', '--gs-pine',
    '--color-success', '--color-warning', '--color-danger', '--color-info',
    '--color-primary-rgb', '--color-accent-rgb', 'color-scheme',
  ];
  props.forEach((p) => root.style.removeProperty(p));
  root.removeAttribute('data-theme-dark');
}
