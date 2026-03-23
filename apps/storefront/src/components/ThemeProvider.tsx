'use client';

import { setThemePreset } from '@cannasaas/ui';
import { useEffect } from 'react';

const THEME_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset
      isDark
    }
  }
`;

const DESIGN_SYSTEM_QUERY = `
  query DesignSystemConfig($dispensaryId: ID!) {
    designSystemConfig(dispensaryId: $dispensaryId) {
      designSystem
      designSystemFile
    }
  }
`;

// Whitelist of valid design system CSS files
const ALLOWED_DS_FILES = new Set(['casual.css', 'spring-bloom.css']);
const DS_LINK_ID = 'design-system-css';

/**
 * Fetches the saved theme AND design system for this dispensary.
 * - Theme preset → applied via data-theme attribute (existing behavior)
 * - Design system → injects a <link> for the CSS file (e.g. spring-bloom.css)
 *
 * "casual" is the default and doesn't need an extra <link> since casual.css
 * is already statically imported in layout.tsx.
 */
export function ThemeProvider() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const dispensaryId =
      process.env.NEXT_PUBLIC_DISPENSARY_ID ||
      'c0000000-0000-0000-0000-000000000001';

    // ── Load theme preset (existing behavior) ──────────────────────
    async function loadTheme() {
      try {
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
        console.warn(
          '[ThemeProvider] Could not load theme, using default:',
          err,
        );
      }
    }

    // ── Load design system CSS ─────────────────────────────────────
    async function loadDesignSystem() {
      try {
        const res = await fetch(`${apiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: DESIGN_SYSTEM_QUERY,
            variables: { dispensaryId },
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data } = await res.json();

        const file = data?.designSystemConfig?.designSystemFile;

        // Remove any existing design system link first
        const existing = document.getElementById(DS_LINK_ID);

        if (file && file !== 'casual.css' && ALLOWED_DS_FILES.has(file)) {
          // Inject or update the design system CSS
          let link = existing as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = DS_LINK_ID;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = `/styles/${file}`;
        } else {
          // Casual is the default (already imported) — remove any override
          existing?.remove();
        }
      } catch (err) {
        console.warn(
          '[ThemeProvider] Could not load design system, using casual:',
          err,
        );
      }
    }

    loadTheme();
    loadDesignSystem();
  }, []);

  return null;
}
