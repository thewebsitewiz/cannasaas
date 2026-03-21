'use client';

import { useEffect } from 'react';
import { setThemePreset } from '@cannasaas/ui';

const THEME_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset
      isDark
    }
  }
`;

/**
 * Fetches the saved theme for this dispensary and applies it via data-theme attribute.
 * Renders nothing visible — side-effect only.
 *
 * TODO: resolve dispensaryId from domain/subdomain in production.
 */
export function ThemeProvider() {
  useEffect(() => {
    async function loadTheme() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const dispensaryId = process.env.NEXT_PUBLIC_DISPENSARY_ID || 'c0000000-0000-0000-0000-000000000001';

        const res = await fetch(`${apiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: THEME_QUERY,
            variables: { dispensaryId },
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { data } = await res.json();

        if (data?.themeConfig?.preset) {
          setThemePreset(data.themeConfig.preset);
        }
      } catch (err) {
        console.warn('[ThemeProvider] Could not load theme, using default:', err);
      }
    }

    loadTheme();
  }, []);

  return null;
}
