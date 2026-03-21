/**
 * @file ThemeLoader.tsx
 * @package @cannasaas/ui
 *
 * Invisible component that fetches the dispensary's theme config
 * from the GraphQL API and injects CSS custom properties.
 *
 * Drop into any portal's root layout:
 *   <ThemeLoader dispensaryId={orgId} apiUrl="/graphql" />
 *
 * If no dispensaryId is provided, it falls back to the "casual" preset.
 */

import { useEffect, useState } from 'react';
import { THEME_PRESETS, DEFAULT_PRESET } from './themes/presets';
import { injectThemeVars } from './themes/inject';
import type { ThemeColors } from './themes/presets';

interface ThemeLoaderProps {
  /** UUID of the current dispensary. If omitted, uses default preset. */
  dispensaryId?: string | null;
  /** GraphQL endpoint. Defaults to '/graphql'. */
  apiUrl?: string;
}

const THEME_CONFIG_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary
      sidebarBg sidebarText
      success warning error info
      isDark
    }
  }
`;

export function ThemeLoader({ dispensaryId, apiUrl = '/graphql' }: ThemeLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dispensaryId) {
      // No dispensary context yet — apply default preset
      injectThemeVars(THEME_PRESETS[DEFAULT_PRESET]);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function fetchTheme() {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: THEME_CONFIG_QUERY,
            variables: { dispensaryId },
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { data } = await res.json();

        if (!cancelled && data?.themeConfig) {
          const config = data.themeConfig as ThemeColors;
          injectThemeVars(config);
        }
      } catch (err) {
        console.warn('[ThemeLoader] Failed to fetch theme, using default:', err);
        if (!cancelled) {
          injectThemeVars(THEME_PRESETS[DEFAULT_PRESET]);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchTheme();
    return () => { cancelled = true; };
  }, [dispensaryId, apiUrl]);

  return null; // Invisible — side-effect only
}

/**
 * Apply a theme locally (without API call).
 * Useful for live preview in the theme designer.
 */
export function applyThemeLocally(colors: ThemeColors): void {
  injectThemeVars(colors);
}
