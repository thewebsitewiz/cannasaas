/**
 * @file ThemeLoader.tsx
 * @package @cannasaas/ui
 *
 * Reads the active organization's themeId from Zustand and:
 *  1. Sets data-theme="<id>" on <html> — CSS cascade handles the rest instantly
 *  2. Injects a <link> to load the theme's CSS override file from /themes/
 *
 * Mount once at the root of every app. Renders null.
 */
'use client'; // Next.js app router compat

import { useEffect } from 'react';
import { DEFAULT_THEME, THEME_IDS } from './themes/index';

const LINK_ID = 'gs-active-theme';

export function applyTheme(themeId: string): void {
  const safe = THEME_IDS.includes(themeId) ? themeId : DEFAULT_THEME;

  // 1. Instant — CSS [data-theme] selector kicks in immediately
  document.documentElement.setAttribute('data-theme', safe);

  // 2. Load the full theme override file
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `/themes/theme.${safe}.css`;
}

interface ThemeLoaderProps {
  /** Pass themeId directly (for Next.js server components / SSR) */
  themeId?: string;
}

export function ThemeLoader({ themeId }: ThemeLoaderProps = {}): null {
  // Try to get themeId from Zustand store (Vite apps)
  // Falls back to prop (Next.js apps pass it from server)
  let activeTheme = themeId ?? DEFAULT_THEME;

  try {
    // Dynamic import guard — won't throw if stores package isn't present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useOrganizationStore } = require('@cannasaas/stores');
    // This hook call is conditional but safe — only runs if stores is available
    activeTheme = useOrganizationStore(
      (s: { themeId?: string }) => s.themeId ?? DEFAULT_THEME,
    ) ?? activeTheme;
  } catch {
    // stores package not available — use prop or default
  }

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  return null;
}

export default ThemeLoader;
