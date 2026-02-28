// packages/ui/src/providers/ThemeProvider.tsx
import React, {
  useEffect,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { BrandingConfig } from '@cannasaas/types';

interface ThemeContextValue {
  colorScheme: 'light' | 'dark' | 'system';
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
  branding?: BrandingConfig;
  defaultColorScheme?: 'light' | 'dark' | 'system';
}

/**
 * ThemeProvider — Dual-purpose:
 * 1. Injects per-dispensary brand tokens at :root
 * 2. Manages light/dark/system color scheme preference
 *
 * Persists user preference to localStorage so it survives refresh.
 */
export function ThemeProvider({
  children,
  branding,
  defaultColorScheme = 'system',
}: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<
    'light' | 'dark' | 'system'
  >(() => {
    const stored = localStorage.getItem('cannasaas-color-scheme');
    return (stored as 'light' | 'dark' | 'system') ?? defaultColorScheme;
  });

  // Apply color scheme to <html> data attribute
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'system') {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      root.setAttribute('data-color-scheme', systemDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-color-scheme', colorScheme);
    }
  }, [colorScheme]);

  // Inject branding tokens as CSS custom properties
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;

    if (branding.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      root.style.setProperty('--p-brand-500', branding.primaryColor);
      root.style.setProperty('--color-brand', branding.primaryColor);
      // Generate a hover shade (10% darker)
      root.style.setProperty(
        '--color-brand-hover',
        darkenHex(branding.primaryColor, 0.1),
      );
      root.style.setProperty(
        '--color-brand-subtle',
        `hsl(${hsl.h} ${hsl.s}% 97%)`,
      );
    }

    if (branding.headingFont) {
      // Inject Google Font link if not already present
      injectGoogleFont(branding.headingFont);
      root.style.setProperty(
        '--font-heading',
        `'${branding.headingFont}', sans-serif`,
      );
    }

    if (branding.bodyFont) {
      injectGoogleFont(branding.bodyFont);
      root.style.setProperty(
        '--font-body',
        `'${branding.bodyFont}', sans-serif`,
      );
    }
  }, [branding]);

  const setColorScheme = (scheme: 'light' | 'dark' | 'system') => {
    setColorSchemeState(scheme);
    localStorage.setItem('cannasaas-color-scheme', scheme);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── File-private utilities ────────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function darkenHex(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - amount * 100)}%)`;
}

function injectGoogleFont(fontFamily: string) {
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
}
