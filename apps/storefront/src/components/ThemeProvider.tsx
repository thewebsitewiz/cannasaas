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
 * dispensaryId resolution:
 *   1. NEXT_PUBLIC_DISPENSARY_ID env var (explicit override)
 *   2. Subdomain extraction from window.location.hostname (e.g. tappan.greenstack.io → lookup by slug)
 *   3. Fallback to default seed dispensary
 */
export function ThemeProvider() {
  useEffect(() => {
    async function loadTheme() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        // Resolve dispensary: env override → subdomain slug → default
        let dispensaryId = process.env.NEXT_PUBLIC_DISPENSARY_ID || '';
        if (!dispensaryId && typeof window !== 'undefined') {
          const host = window.location.hostname;
          const parts = host.split('.');
          if (parts.length >= 3) {
            // Subdomain-based: e.g. tappan.greenstack.io
            const slug = parts[0];
            try {
              const slugRes = await fetch(`${apiUrl}/graphql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: `query($slug: String!) { tenantBySlug(slug: $slug) { dispensaryId } }`,
                  variables: { slug },
                }),
              });
              const slugData = await slugRes.json();
              dispensaryId = slugData?.data?.tenantBySlug?.dispensaryId || '';
            } catch {
              // Slug resolution failed — fall through to default
            }
          }
        }
        if (!dispensaryId) dispensaryId = '45cd244d-7016-4db8-8e88-9c71725340c8';

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
