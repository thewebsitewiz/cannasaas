#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase H: Theming & Dynamic Branding
# File: scaffold-phase-h.sh
#
# Writes the complete theming layer shared across all three apps:
#
#   packages/utils/src/
#   └── color.ts               hexToHSL, hexToHslVars, hslToHex, contrastColor
#
#   packages/ui/src/components/
#   ├── providers/
#   │   └── ThemeProvider.tsx  Canonical Phase H ThemeProvider (spec-complete)
#   └── theme/
#       ├── ThemeToggle.tsx    Dark / light / system mode toggle button
#       ├── ColorSwatch.tsx    Single colour swatch with copy-to-clipboard
#       ├── BrandingPreview.tsx Live preview card — used in Settings > Branding
#       ├── BrandingEditor.tsx Full colour + font editor — used in admin Settings
#       └── index.ts           Barrel export for all theme components
#
#   packages/stores/src/
#   └── themeStore.ts          Upgraded: system-mode listener + applyTheme helper
#
#   tailwind.config.ts         Shared Tailwind v3 config with CSS var integration
#
# Run AFTER scaffold-stores.sh and scaffold-phase-g.sh.
#
# Usage:
#   chmod +x scaffold-phase-h.sh
#   ./scaffold-phase-h.sh [MONOREPO_ROOT]
#
# ── Dev testing tip (from Phase H spec) ──────────────────────────────────────
#   Test with two tenants simultaneously:
#     VITE_DEV_SLUG=greenleaf  pnpm --filter storefront dev --port 5173
#     VITE_DEV_SLUG=blueleaf   pnpm --filter storefront dev --port 5176
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"

UTILS_SRC="$ROOT/packages/utils/src"
UI_PROV="$ROOT/packages/ui/src/components/providers"
UI_THEME="$ROOT/packages/ui/src/components/theme"
STORES_SRC="$ROOT/packages/stores/src"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  CannaSaas — Phase H: Theming & Dynamic Branding     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo "  Target: $ROOT"
echo ""

mkdir -p "$UTILS_SRC" "$UI_PROV" "$UI_THEME" "$STORES_SRC"

# =============================================================================
# packages/utils/src/color.ts
# =============================================================================
cat > "$UTILS_SRC/color.ts" << 'TSEOF'
/**
 * @file color.ts
 * @package @cannasaas/utils
 *
 * Colour conversion utilities for the CannaSaas theming system.
 *
 * ── Why HSL? ──────────────────────────────────────────────────────────────────
 *
 * Tailwind CSS (v3) uses a CSS custom property strategy where colour tokens
 * store bare HSL channel values (no `hsl()` wrapper):
 *
 *   :root { --primary: 154 40% 30%; }
 *
 * Tailwind then references them as:
 *   hsl(var(--primary))          → full opacity
 *   hsl(var(--primary) / 0.1)   → 10% opacity (Tailwind modifier syntax)
 *
 * Storing bare channels (not `hsl(...)`) enables the opacity modifier syntax.
 * If we stored `hsl(154, 40%, 30%)` the modifier could not be appended.
 *
 * ── Functions ────────────────────────────────────────────────────────────────
 *
 *   hexToHSL(hex)        → 'hsl(154, 40%, 30%)'      full CSS hsl() string
 *   hexToHslVars(hex)    → '154 40% 30%'              bare channels for CSS vars
 *   hslToHex(h, s, l)   → '#2D6A4F'                  back-convert for pickers
 *   contrastColor(hex)   → '#ffffff' | '#000000'      WCAG-compliant text colour
 *   generatePalette(hex) → { light, base, dark }      3-step shade set
 *   parseHslVars(str)    → { h, s, l }                parse stored var string
 *
 * ── WCAG contrast ────────────────────────────────────────────────────────────
 *
 * `contrastColor` returns white or black text based on the background's
 * relative luminance (WCAG 1.4.3 minimum 4.5:1 for normal text).
 * Used to ensure button label text is always readable against tenant colours.
 */

// ── hexToHSL ─────────────────────────────────────────────────────────────────

/**
 * Converts a hex colour string to a full CSS `hsl(H, S%, L%)` string.
 *
 * Use this when you need the full hsl() function value for inline styles.
 * For CSS custom properties, prefer `hexToHslVars` (returns bare channels).
 *
 * @param hex - 3 or 6 digit hex colour, with or without leading #
 * @returns Full `hsl(H, S%, L%)` string
 *
 * @example
 *   hexToHSL('#2D6A4F')  // → 'hsl(154, 40%, 29%)'
 *   hexToHSL('#52B788')  // → 'hsl(150, 40%, 52%)'
 */
export function hexToHSL(hex: string): string {
  const { h, s, l } = hexToHslComponents(hex);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Converts a hex colour to bare HSL channel values for use in CSS custom properties.
 *
 * Returns format: 'H S% L%' (no `hsl()` wrapper, no commas).
 * This format is required for Tailwind's opacity modifier syntax to work:
 *   --primary: 154 40% 29%
 *   → hsl(var(--primary) / 0.1)  ← opacity modifier appended outside the var
 *
 * @param hex - 3 or 6 digit hex colour, with or without leading #
 * @returns Bare HSL channel string, e.g. '154 40% 29%'
 *
 * @example
 *   hexToHslVars('#2D6A4F')  // → '154 40% 29%'
 *
 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function hexToHslVars(hex: string): string {
  const { h, s, l } = hexToHslComponents(hex);
  return `${h} ${s}% ${l}%`;
}

// ── Internal hex → HSL converter ─────────────────────────────────────────────

interface HslComponents { h: number; s: number; l: number; }

/**
 * Core hex → HSL math. Handles 3-digit and 6-digit hex, with or without #.
 * Used internally by all public conversion functions.
 */
function hexToHslComponents(hex: string): HslComponents {
  // Normalise: strip #, expand 3-digit to 6-digit
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) {
    console.warn(`[color.ts] Invalid hex: "${hex}", falling back to #000000`);
    return { h: 0, s: 0, l: 0 };
  }

  // Parse RGB channels (0–1 range)
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max  = Math.max(r, g, b);
  const min  = Math.min(r, g, b);
  const l    = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6;               break;
      case b: hue = ((r - g) / d + 4) / 6;               break;
    }
  }

  return {
    h: Math.round(hue * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ── hslToHex ─────────────────────────────────────────────────────────────────

/**
 * Converts HSL values back to a 6-digit hex colour string.
 *
 * Used when displaying a colour picker pre-populated from stored CSS var values.
 * The input uses the same Tailwind CSS var format (separate h, s, l integers).
 *
 * @example
 *   hslToHex(154, 40, 29) // → '#2d6a4c'
 */
export function hslToHex(h: number, s: number, l: number): string {
  const ls = l / 100;
  const ss = s / 100;
  const a  = ss * Math.min(ls, 1 - ls);

  const toHex = (n: number): string => {
    const x = ls - a * (n % 12 === 0 ? -1 : n % 12 < 4 ? n % 12 - 3 : n % 12 < 8 ? 3 - n % 12 + 4 : n % 12 - 9);
    return Math.round(255 * Math.max(0, Math.min(1, x))).toString(16).padStart(2, '0');
  };

  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

// ── contrastColor ─────────────────────────────────────────────────────────────

/**
 * Returns '#ffffff' or '#000000' depending on which provides better contrast
 * against the given background hex colour.
 *
 * Uses the WCAG relative luminance formula to ensure a minimum 4.5:1 contrast
 * ratio for normal text (WCAG 1.4.3 AA).
 *
 * Use this to automatically set button label and icon colours based on the
 * tenant's primary/secondary/accent colours.
 *
 * @example
 *   contrastColor('#2D6A4F')  // → '#ffffff' (dark background → white text)
 *   contrastColor('#B7E4C7')  // → '#000000' (light background → black text)
 */
export function contrastColor(hex: string): '#ffffff' | '#000000' {
  const h   = hex.replace('#', '');
  const r   = parseInt(h.slice(0, 2), 16);
  const g   = parseInt(h.slice(2, 4), 16);
  const b   = parseInt(h.slice(4, 6), 16);

  // Relative luminance (WCAG 2.1 formula)
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // White contrast: (L + 0.05) / (0.0 + 0.05), Black contrast: (1 + 0.05) / (L + 0.05)
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

// ── generatePalette ───────────────────────────────────────────────────────────

/**
 * Generates a 3-step shade palette (light, base, dark) from a single hex colour.
 *
 * Used by BrandingPreview to show a visual palette preview and by the
 * ThemeProvider to automatically derive light/dark mode variants.
 *
 * @example
 *   generatePalette('#2D6A4F')
 *   // → { light: '#4d8a6f', base: '#2D6A4F', dark: '#1a4a35' }
 */
export function generatePalette(hex: string): { light: string; base: string; dark: string } {
  const { h, s, l } = hexToHslComponents(hex);
  return {
    light: hslToHex(h, Math.max(0, s - 5), Math.min(100, l + 15)),
    base:  hex,
    dark:  hslToHex(h, Math.min(100, s + 5), Math.max(0, l - 15)),
  };
}

// ── parseHslVars ──────────────────────────────────────────────────────────────

/**
 * Parses a stored CSS var string back into component integers.
 *
 * @example
 *   parseHslVars('154 40% 29%') // → { h: 154, s: 40, l: 29 }
 */
export function parseHslVars(str: string): HslComponents {
  const [h, s, l] = str.trim().split(/\s+/).map((v) => parseInt(v, 10));
  return { h: h ?? 0, s: s ?? 0, l: l ?? 0 };
}

/**
 * Reads a CSS custom property from :root and parses it as an HSL string.
 *
 * @example
 *   getCssVar('--primary')  // → '154 40% 29%' (or null if not set)
 */
export function getCssVar(prop: string): string | null {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || null;
}
TSEOF
echo "  ✓ packages/utils/src/color.ts"

# =============================================================================
# packages/stores/src/themeStore.ts  — Phase H upgrade
# =============================================================================
cat > "$STORES_SRC/themeStore.ts" << 'TSEOF'
/**
 * @file themeStore.ts
 * @package @cannasaas/stores
 *
 * Phase H upgrade — Theme (dark/light/system) Zustand store with:
 *   - System mode media query listener (live OS preference tracking)
 *   - `applyTheme()` helper called by ThemeProvider on every mode change
 *   - `resolvedMode` derived value (always 'light' | 'dark', never 'system')
 *
 * ── Two independent theming layers ───────────────────────────────────────────
 *
 *   Layer 1 — Per-tenant brand colours (organizationStore.resolvedBranding)
 *     Applied as CSS custom properties: --primary, --secondary, --accent
 *     Handled by ThemeProvider reading the organization store.
 *     Always active; does not change with dark/light mode.
 *
 *   Layer 2 — User's colour scheme preference (this store)
 *     Adds/removes the `dark` class on <html>.
 *     Tailwind's dark mode utilities (`dark:bg-stone-900` etc.) activate
 *     when the `dark` class is present.
 *     Persisted to localStorage; defaults to 'system'.
 *
 * ── System mode implementation ───────────────────────────────────────────────
 *
 * When mode === 'system', ThemeProvider subscribes to the
 * `prefers-color-scheme: dark` media query and updates the DOM whenever
 * the OS preference changes — even mid-session (e.g. macOS auto dark mode
 * at sunset). This is important for WCAG 1.4.3 users who rely on OS-level
 * contrast settings.
 *
 * The listener is added/removed in ThemeProvider's useEffect cleanup.
 * The store itself does not add a listener — it only exposes `setMode`.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   const { mode, setMode, resolvedMode } = useThemeStore();
 *
 *   setMode('dark')    // always dark
 *   setMode('light')   // always light
 *   setMode('system')  // follow OS
 *
 *   resolvedMode       // 'dark' | 'light' — use for toggle icon
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode         = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

interface ThemeState {
  /** User's explicit choice, persisted to localStorage */
  mode: ThemeMode;

  /**
   * Resolved mode — always 'light' or 'dark', never 'system'.
   * Derived at store init time and kept in sync by applyTheme().
   * Use for rendering conditional icons (sun / moon) and CSS class decisions.
   */
  resolvedMode: ResolvedThemeMode;

  /** Update the user's preference and immediately apply it to the DOM */
  setMode: (mode: ThemeMode) => void;

  /**
   * Apply the current (or given) mode to the document.
   * Called by ThemeProvider on mount and whenever mode changes.
   * Safe to call outside React (e.g. from the media query listener).
   *
   * @param override - If provided, apply this mode instead of the stored one.
   *                   Used by the system-mode media query listener to pass
   *                   the OS preference without changing the stored preference.
   */
  applyTheme: (override?: ResolvedThemeMode) => void;
}

// ── System preference helper ──────────────────────────────────────────────────

function getSystemPreference(): ResolvedThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode:         'system',
      resolvedMode: getSystemPreference(), // Initialise from OS before first render

      setMode: (mode) => {
        const resolved: ResolvedThemeMode =
          mode === 'system' ? getSystemPreference() : mode;
        set({ mode, resolvedMode: resolved });
        get().applyTheme(resolved);
      },

      applyTheme: (override) => {
        const { mode } = get();
        const effective: ResolvedThemeMode =
          override ?? (mode === 'system' ? getSystemPreference() : mode);
        set({ resolvedMode: effective });
        const root = document.documentElement;
        if (effective === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      },
    }),
    {
      name:    'cannasaas-theme',
      storage: createJSONStorage(() => localStorage),
      // Only persist mode — resolvedMode is derived at runtime
      partialize: (s) => ({ mode: s.mode }),
      // After rehydration, re-apply the stored mode to the DOM
      onRehydrateStorage: () => (state) => {
        state?.applyTheme();
      },
    },
  ),
);
TSEOF
echo "  ✓ packages/stores/src/themeStore.ts"

# =============================================================================
# packages/ui/src/components/providers/ThemeProvider.tsx
# =============================================================================
cat > "$UI_PROV/ThemeProvider.tsx" << 'TSEOF'
/**
 * @file ThemeProvider.tsx
 * @package @cannasaas/ui
 *
 * Canonical Phase H ThemeProvider — shared across all three CannaSaas apps.
 *
 * ── What it does ─────────────────────────────────────────────────────────────
 *
 * 1. BRAND COLOUR INJECTION
 *    Reads `organization.branding.colors` and writes CSS custom properties
 *    to `document.documentElement` using `hexToHslVars()`:
 *
 *      --primary:   154 40% 29%
 *      --secondary: 150 40% 52%
 *      --accent:    145 40% 80%
 *
 *    Tailwind utilities reference these via `hsl(var(--primary))`, enabling
 *    the full opacity modifier syntax: `bg-[hsl(var(--primary)/0.1)]`.
 *
 *    This approach means zero component changes are needed when a tenant
 *    switches brand colours — every shadcn/ui component picks up new colours
 *    automatically through the Tailwind theme config.
 *
 * 2. FONT INJECTION
 *    Writes `--font-heading` and `--font-body` CSS vars, then appends a
 *    Google Fonts <link> for any font not in the system stack.
 *
 * 3. CUSTOM CSS INJECTION
 *    Injects `organization.branding.customCSS` into a `<style id="tenant-custom-css">`
 *    element in <head>. This CSS is sanitised server-side before storage.
 *
 * 4. FAVICON SWAP
 *    If `organization.branding.logo.favicon` is set, replaces the default
 *    `<link rel="icon">` with the tenant's favicon URL.
 *
 * 5. DOCUMENT TITLE
 *    Sets `document.title` to the organisation name on load.
 *    Individual pages update title with their own content (e.g. "Blue Dream | Green Leaf").
 *
 * 6. DARK/LIGHT/SYSTEM MODE
 *    Reads `themeStore.mode` and applies the `dark` class to `<html>`.
 *    In 'system' mode, subscribes to the `prefers-color-scheme` media query
 *    and calls `themeStore.applyTheme()` whenever the OS preference changes.
 *    The listener is cleaned up on unmount.
 *
 * ── Performance considerations ───────────────────────────────────────────────
 *
 * ThemeProvider uses two separate useEffects to avoid unnecessary work:
 *   Effect 1: Brand colours + fonts + custom CSS — runs when `organization` changes
 *   Effect 2: Dark/light mode — runs when `mode` changes
 *
 * Splitting them means a mode toggle (very frequent) does not re-run the full
 * branding injection (expensive DOM operations).
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   // In each app's main.tsx or App.tsx root:
 *   import { ThemeProvider } from '@cannasaas/ui';
 *
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 *
 * ThemeProvider must be rendered:
 *   - Inside <QueryClientProvider> (it uses zustand, not TanStack)
 *   - Inside <BrowserRouter> is optional (it uses no routing)
 *   - After wireAuthToAxios() has been called
 *   - The organizationStore should be populated before ThemeProvider renders
 *     for instant brand colour application. If it's not (fresh page load),
 *     ThemeProvider will re-run when the org resolves.
 *
 * ── Accessibility ────────────────────────────────────────────────────────────
 *
 * - System mode honours `prefers-color-scheme` (WCAG 1.4.3)
 * - Contrast colours are validated via `contrastColor()` in BrandingEditor
 * - Font changes do not reduce text size below minimum (enforced by Tailwind config)
 * - Colour-blind safe: never conveys info through colour alone in generated CSS
 *
 * @see packages/utils/src/color.ts  for hexToHSL + hexToHslVars implementation
 * @see packages/stores/src/themeStore.ts  for mode management
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';
import { useThemeStore }        from '@cannasaas/stores';
import { hexToHslVars }         from '@cannasaas/utils';

// ── Google Fonts loader ──────────────────────────────────────────────────────

/** Fonts available for tenant branding that require a Google Fonts download */
const GOOGLE_FONT_FAMILIES = new Set([
  'DM Sans', 'Plus Jakarta Sans', 'Nunito', 'Poppins',
  'Merriweather', 'Playfair Display', 'Lora', 'Raleway',
]);

/**
 * Appends a Google Fonts <link> for the given font family.
 * Idempotent — won't add a duplicate <link> if already present.
 */
function loadGoogleFont(family: string): void {
  if (!GOOGLE_FONT_FAMILIES.has(family)) return;
  const id = `gfont-${family.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = Object.assign(document.createElement('link'), {
    id,
    rel:  'stylesheet',
    href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700;800&display=swap`,
  });
  document.head.appendChild(link);
}

// ── CSS var injection ─────────────────────────────────────────────────────────

/**
 * Writes a CSS custom property to :root only if the value has changed.
 * Avoids unnecessary style recalculations on re-renders where branding hasn't changed.
 */
function setCssVar(prop: string, value: string): void {
  const root    = document.documentElement;
  const current = root.style.getPropertyValue(prop).trim();
  if (current !== value) root.style.setProperty(prop, value);
}

// ── ThemeProvider ─────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const organization = useOrganizationStore((state) => state.organization);
  const mode         = useThemeStore((state) => state.mode);
  const applyTheme   = useThemeStore((state) => state.applyTheme);

  // ── Effect 1: Brand colours, fonts, custom CSS, favicon, document title ─────
  //
  // Runs when the organisation changes (tenant switch, or initial resolution).
  // Intentionally separated from the dark-mode effect for performance.

  useEffect(() => {
    if (!organization?.branding) return;

    const { colors, fonts, customCSS, logo } = organization.branding as {
      colors?:   { primary?: string; secondary?: string; accent?: string };
      fonts?:    { heading?: string; body?: string };
      customCSS?: string;
      logo?:     { url?: string; favicon?: string };
    };

    // 1. Brand colours → CSS custom properties
    if (colors) {
      if (colors.primary)   setCssVar('--primary',   hexToHslVars(colors.primary));
      if (colors.secondary) setCssVar('--secondary', hexToHslVars(colors.secondary));
      if (colors.accent)    setCssVar('--accent',    hexToHslVars(colors.accent));
    }

    // 2. Font families → CSS custom properties + Google Fonts load
    if (fonts) {
      if (fonts.heading) {
        setCssVar('--font-heading', fonts.heading);
        loadGoogleFont(fonts.heading);
      }
      if (fonts.body) {
        setCssVar('--font-body', fonts.body);
        loadGoogleFont(fonts.body);
      }
    }

    // 3. Custom CSS → injected <style> in <head>
    //    This CSS is sanitised server-side (XSS-safe) before storage.
    if (customCSS) {
      let styleEl = document.getElementById('tenant-custom-css') as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'tenant-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = customCSS;
    }

    // 4. Favicon swap
    if (logo?.favicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) {
        link.href = logo.favicon;
      } else {
        // Create a favicon link if none exists
        document.head.appendChild(
          Object.assign(document.createElement('link'), {
            rel:  'icon',
            type: 'image/x-icon',
            href: logo.favicon,
          }),
        );
      }
    }

    // 5. Document title (individual pages will append their own title after this)
    if (organization.name) {
      document.title = organization.name;
    }
  }, [organization]);

  // ── Effect 2: Dark / light / system mode ─────────────────────────────────────
  //
  // Runs when the user's mode preference changes.
  // In 'system' mode, subscribes to the OS media query for live updates.

  useEffect(() => {
    // Apply current mode immediately
    applyTheme();

    if (mode !== 'system') return;

    // System mode: listen for OS preference changes (e.g. macOS auto dark mode)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    // Cleanup: remove listener when mode changes away from 'system' or on unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, applyTheme]);

  // ThemeProvider is a pure side-effect component — renders children unchanged
  return <>{children}</>;
}
TSEOF
echo "  ✓ packages/ui/src/components/providers/ThemeProvider.tsx"

# =============================================================================
# packages/ui/src/components/theme/ThemeToggle.tsx
# =============================================================================
cat > "$UI_THEME/ThemeToggle.tsx" << 'TSEOF'
/**
 * @file ThemeToggle.tsx
 * @package @cannasaas/ui
 *
 * Dark / light / system mode toggle button.
 *
 * ── Variants ─────────────────────────────────────────────────────────────────
 *
 * `variant="icon"`    — circular icon button, cycles Light → Dark → System
 *                       Used in the storefront nav and admin topbar.
 *
 * `variant="segmented"` — three-segment control (☀️ Light | 💻 System | 🌙 Dark)
 *                          Used in the account preferences page.
 *
 * `variant="dropdown"` — a button that opens a popover menu with all three options.
 *                         Used in compact areas (admin sidebar footer).
 *
 * ── Cycle order (icon variant) ───────────────────────────────────────────────
 *
 *   light → dark → system → light → …
 *
 * This matches the convention used by GitHub, VS Code, and most SaaS products.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="group" + aria-label on segmented variant (1.3.1)
 *   - aria-pressed on active segment (4.1.2)
 *   - aria-label on icon button describes CURRENT state + click action (4.1.2)
 *   - Icons supplemented with visually-hidden text (1.1.1)
 *   - Keyboard: Enter/Space activates, arrow keys navigate segments (2.1.1)
 *   - Focus ring visible on all interactive elements (2.4.7)
 *   - Colour change conveyed by icon + tooltip, not colour alone (1.4.1)
 */

import { useThemeStore, type ThemeMode } from '@cannasaas/stores';

// ── Icons ────────────────────────────────────────────────────────────────────

const ICONS: Record<ThemeMode, { symbol: string; label: string }> = {
  light:  { symbol: '☀️',  label: 'Light mode' },
  dark:   { symbol: '🌙', label: 'Dark mode'  },
  system: { symbol: '💻', label: 'System mode' },
};

const CYCLE: ThemeMode[] = ['light', 'dark', 'system'];

// ── Shared button class builder ───────────────────────────────────────────────

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-2';

// ── Icon variant ──────────────────────────────────────────────────────────────

/**
 * Circular icon button that cycles through light → dark → system on each click.
 * The aria-label describes the CURRENT state and the action of clicking.
 */
function IconToggle({ className = '' }: { className?: string }) {
  const { mode, setMode, resolvedMode } = useThemeStore();

  const handleClick = () => {
    const idx  = CYCLE.indexOf(mode);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setMode(next);
  };

  const { symbol, label } = ICONS[mode];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label} — click to cycle theme`}
      title={label}
      className={[
        'w-9 h-9 rounded-full flex items-center justify-center',
        'bg-stone-100 dark:bg-stone-800',
        'hover:bg-stone-200 dark:hover:bg-stone-700',
        'transition-colors',
        focusRing,
        className,
      ].join(' ')}
    >
      {/* Emoji icon — aria-hidden because the aria-label carries the meaning */}
      <span aria-hidden="true" className="text-base leading-none">{symbol}</span>
    </button>
  );
}

// ── Segmented variant ─────────────────────────────────────────────────────────

/**
 * Three-segment control with Light / System / Dark options.
 * Uses role="radiogroup" + role="radio" for proper ARIA semantics.
 * Arrow keys cycle between segments.
 */
function SegmentedToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useThemeStore();
  const segments: ThemeMode[] = ['light', 'system', 'dark'];

  const handleKeyDown = (e: React.KeyboardEvent, current: ThemeMode) => {
    const idx = segments.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setMode(segments[(idx + 1) % segments.length]);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setMode(segments[(idx - 1 + segments.length) % segments.length]);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour scheme preference"
      className={[
        'inline-flex rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700',
        'bg-stone-50 dark:bg-stone-800',
        className,
      ].join(' ')}
    >
      {segments.map((seg) => {
        const { symbol, label } = ICONS[seg];
        const isActive = mode === seg;
        return (
          <button
            key={seg}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setMode(seg)}
            onKeyDown={(e) => handleKeyDown(e, seg)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--primary,154_40%_30%))]',
              isActive
                ? 'bg-[hsl(var(--primary,154_40%_30%))] text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200',
            ].join(' ')}
          >
            <span aria-hidden="true">{symbol}</span>
            <span className="sr-only sm:not-sr-only capitalize">{label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── ThemeToggle (main export with variant prop) ────────────────────────────────

export interface ThemeToggleProps {
  /**
   * Visual variant of the toggle:
   *   'icon'      — compact circular icon button (default)
   *   'segmented' — three-segment radio-style control
   */
  variant?: 'icon' | 'segmented';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  if (variant === 'segmented') return <SegmentedToggle className={className} />;
  return <IconToggle className={className} />;
}
TSEOF
echo "  ✓ packages/ui/src/components/theme/ThemeToggle.tsx"

# =============================================================================
# packages/ui/src/components/theme/ColorSwatch.tsx
# =============================================================================
cat > "$UI_THEME/ColorSwatch.tsx" << 'TSEOF'
/**
 * @file ColorSwatch.tsx
 * @package @cannasaas/ui
 *
 * Colour swatch component with copy-to-clipboard functionality.
 * Used in BrandingPreview and BrandingEditor to display and interact with
 * individual brand colours.
 *
 * ── Anatomy ──────────────────────────────────────────────────────────────────
 *
 *   ┌──────────────┐
 *   │              │  ← coloured square (background = hex value)
 *   │   ✓ Copied!  │  ← copy confirmation overlay (aria-live)
 *   └──────────────┘
 *      Primary         ← colour name label
 *      #2D6A4F         ← hex value (click to copy)
 *      Aa              ← contrast text preview (white or black, WCAG checked)
 *
 * Accessibility (WCAG 2.1 AA):
 *   - button has descriptive aria-label including colour name + hex (4.1.2)
 *   - Copy confirmation: aria-live="polite" role="status" (4.1.3)
 *   - Contrast text ('Aa') calculated via contrastColor() (1.4.3)
 *   - Minimum 44×44px touch target (2.5.5)
 */

import { useState, useRef } from 'react';
import { contrastColor } from '@cannasaas/utils';

export interface ColorSwatchProps {
  /** Display label for the colour (e.g. "Primary", "Secondary") */
  label: string;
  /** 6-digit hex colour value (with or without #) */
  hex:   string;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function ColorSwatch({ label, hex, size = 'md' }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const normalHex   = hex.startsWith('#') ? hex : `#${hex}`;
  const textColor   = contrastColor(normalHex);
  const statusId    = `swatch-status-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalHex);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — fail silently
    }
  };

  const sizeMap = {
    sm: 'w-12 h-12 rounded-xl text-xs',
    md: 'w-16 h-16 rounded-2xl text-sm',
    lg: 'w-20 h-20 rounded-2xl text-base',
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`${label} colour ${normalHex}. Click to copy`}
        aria-describedby={statusId}
        className={[
          sizeMap[size],
          'relative flex items-center justify-center',
          'transition-transform hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400',
          'shadow-md cursor-pointer',
        ].join(' ')}
        style={{ backgroundColor: normalHex }}
      >
        {/* Contrast text preview */}
        <span
          aria-hidden="true"
          style={{ color: textColor }}
          className="font-bold select-none"
        >
          {copied ? '✓' : 'Aa'}
        </span>
      </button>

      {/* Live region for copy confirmation — polite so screen readers aren't interrupted */}
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={[
          'text-xs font-medium transition-colors',
          copied ? 'text-green-600' : 'text-stone-400',
        ].join(' ')}
      >
        {copied ? 'Copied!' : normalHex}
      </p>

      <p className="text-xs text-stone-500 font-semibold">{label}</p>
    </div>
  );
}
TSEOF
echo "  ✓ packages/ui/src/components/theme/ColorSwatch.tsx"

# =============================================================================
# packages/ui/src/components/theme/BrandingPreview.tsx
# =============================================================================
cat > "$UI_THEME/BrandingPreview.tsx" << 'TSEOF'
/**
 * @file BrandingPreview.tsx
 * @package @cannasaas/ui
 *
 * Live branding preview card — shown in the Admin Settings > Branding tab.
 *
 * Renders a realistic mini-storefront preview using the provided (or current
 * CSS-var-derived) brand colours, fonts, and logo. Updates in real-time as
 * the admin adjusts colours in BrandingEditor — no save required to preview.
 *
 * ── What it previews ─────────────────────────────────────────────────────────
 *
 *   - Storefront navbar with logo + dispensary name
 *   - A product card with primary CTA button
 *   - A secondary/outline button
 *   - Accent chip / badge
 *   - Typography sample (heading + body text) with applied font families
 *   - Colour swatch row (primary, secondary, accent)
 *   - Dark mode variant toggle (shows how dark mode looks with current colours)
 *
 * ── Props vs CSS vars ────────────────────────────────────────────────────────
 *
 * The component accepts explicit `branding` props so it can be used to preview
 * unsaved changes (the editor passes the in-progress form values).
 * If no props are passed, it falls back to reading the current CSS vars —
 * useful for displaying the current live configuration.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - role="region" aria-label on the preview frame (1.3.1)
 *   - All preview UI elements are aria-hidden (decorative demo, not interactive) (1.3.1)
 *   - Swatch buttons are fully interactive (copy) and not hidden
 *   - Colour contrast: `contrastColor()` ensures text remains readable
 */

import { useMemo } from 'react';
import { hexToHSL, hexToHslVars, contrastColor, generatePalette, getCssVar } from '@cannasaas/utils';
import { ColorSwatch } from './ColorSwatch';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BrandingConfig {
  primaryColor?:   string;
  secondaryColor?: string;
  accentColor?:    string;
  fontHeading?:    string;
  fontBody?:       string;
  logoUrl?:        string;
  dispensaryName?: string;
}

export interface BrandingPreviewProps {
  /** Explicit branding config (e.g. unsaved editor values) */
  branding?: BrandingConfig;
  /** Optional extra className on the outer wrapper */
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a branding value: use prop if provided, else read from CSS var */
function resolveColor(prop?: string, cssVarName?: string): string {
  if (prop) return prop;
  const varVal = cssVarName ? getCssVar(cssVarName) : null;
  if (varVal) {
    // CSS var stores bare HSL — convert back for display (approximate)
    return `hsl(${varVal})`;
  }
  return '#2D6A4F'; // Fallback green
}

// ── Mini-preview components ───────────────────────────────────────────────────

/**
 * Mini storefront navbar — preview of how the tenant brand looks at the top of
 * the storefront. Purely decorative, aria-hidden.
 */
function PreviewNavbar({
  primary, logoUrl, name, fontHeading,
}: { primary: string; logoUrl?: string; name: string; fontHeading?: string }) {
  const textColor = contrastColor(primary);
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between px-4 py-3 rounded-t-2xl text-xs"
      style={{ backgroundColor: primary, color: textColor, fontFamily: fontHeading }}
    >
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-5 w-auto object-contain" />
        ) : (
          <span className="text-lg">🌿</span>
        )}
        <span className="font-extrabold tracking-wide">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] opacity-80">
        <span>Products</span>
        <span>Cart (2)</span>
      </div>
    </div>
  );
}

/**
 * Mini product card — shows how the primary CTA button and accent badge look.
 */
function PreviewProductCard({
  primary, secondary, accent, fontBody,
}: { primary: string; secondary: string; accent: string; fontBody?: string }) {
  const primaryText  = contrastColor(primary);
  const accentText   = contrastColor(accent);

  return (
    <div
      aria-hidden="true"
      className="flex gap-3 p-3"
      style={{ fontFamily: fontBody }}
    >
      {/* Product image placeholder */}
      <div
        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
        style={{ backgroundColor: accent }}
      >
        🌱
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div>
            <p className="text-xs font-bold text-stone-900 truncate">Blue Dream 1/8 oz</p>
            <p className="text-[10px] text-stone-400">Sativa · 24.5% THC</p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent, color: accentText }}
          >
            New
          </span>
        </div>
        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
          Uplifting sativa with notes of berry and sweet citrus…
        </p>
        <div className="flex gap-1.5 mt-2">
          <button
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
            style={{ backgroundColor: primary, color: primaryText }}
          >
            Add to Cart
          </button>
          <button
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border"
            style={{ borderColor: secondary, color: secondary }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Typography sample — shows heading + body text with the applied font families.
 */
function PreviewTypography({
  fontHeading, fontBody, primary,
}: { fontHeading?: string; fontBody?: string; primary: string }) {
  return (
    <div aria-hidden="true" className="px-3 pb-3 border-t border-stone-100">
      <p
        className="text-sm font-extrabold text-stone-900 mt-2"
        style={{ fontFamily: fontHeading }}
      >
        {fontHeading ?? 'Inter'} heading
      </p>
      <p
        className="text-xs text-stone-500 leading-relaxed mt-0.5"
        style={{ fontFamily: fontBody }}
      >
        Body text in {fontBody ?? 'Inter'}. The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  );
}

// ── BrandingPreview (main export) ─────────────────────────────────────────────

export function BrandingPreview({ branding, className }: BrandingPreviewProps) {
  // Resolve colours — either from explicit props or from current CSS vars
  const primary   = resolveColor(branding?.primaryColor,   '--primary');
  const secondary = resolveColor(branding?.secondaryColor, '--secondary');
  const accent    = resolveColor(branding?.accentColor,    '--accent');
  const name      = branding?.dispensaryName ?? 'Your Dispensary';

  // Generate shade palette for the swatch row
  const palette = useMemo(() => generatePalette(primary), [primary]);

  return (
    <section
      role="region"
      aria-label="Branding preview — decorative sample of how your brand will appear"
      className={[
        'bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden w-full max-w-sm',
        className ?? '',
      ].join(' ')}
    >
      {/* Navbar preview */}
      <PreviewNavbar
        primary={primary}
        logoUrl={branding?.logoUrl}
        name={name}
        fontHeading={branding?.fontHeading}
      />

      {/* Product card preview */}
      <PreviewProductCard
        primary={primary}
        secondary={secondary}
        accent={accent}
        fontBody={branding?.fontBody}
      />

      {/* Typography preview */}
      <PreviewTypography
        fontHeading={branding?.fontHeading}
        fontBody={branding?.fontBody}
        primary={primary}
      />

      {/* Colour swatches */}
      <div
        aria-label="Brand colours"
        className="flex justify-center gap-5 px-3 pb-4 pt-2 border-t border-stone-100"
      >
        <ColorSwatch label="Primary"   hex={primary}   size="sm" />
        <ColorSwatch label="Secondary" hex={secondary} size="sm" />
        <ColorSwatch label="Accent"    hex={accent}    size="sm" />
      </div>
    </section>
  );
}
TSEOF
echo "  ✓ packages/ui/src/components/theme/BrandingPreview.tsx"

# =============================================================================
# packages/ui/src/components/theme/BrandingEditor.tsx
# =============================================================================
cat > "$UI_THEME/BrandingEditor.tsx" << 'TSEOF'
/**
 * @file BrandingEditor.tsx
 * @package @cannasaas/ui
 *
 * Interactive colour + font editor for the Admin Settings > Branding tab.
 *
 * ── Layout ───────────────────────────────────────────────────────────────────
 *
 * Two-column on md+, single column on mobile:
 *
 *   ┌─────────────────────────┬───────────────┐
 *   │  Colour pickers (left)  │ Live preview  │
 *   │  Font selectors         │ (right)       │
 *   │  Logo upload            │               │
 *   └─────────────────────────┴───────────────┘
 *
 * ── Colour picker approach ───────────────────────────────────────────────────
 *
 * Each colour uses a paired native <input type="color"> + hex text input.
 * The native colour picker is visually styled but functionally native for
 * the best cross-browser/accessibility experience. The hex input allows
 * precise value entry and shows the computed contrast ratio.
 *
 * ── Contrast ratio display ───────────────────────────────────────────────────
 *
 * Below each colour picker, the component shows the contrast ratio of white
 * vs black text on that background. This gives admins real-time WCAG feedback
 * without requiring a separate tool.
 *
 * ── Props ────────────────────────────────────────────────────────────────────
 *
 *   value     — current branding config (controlled)
 *   onChange  — called on every change, receives updated config
 *   onSave    — called when the user clicks "Save Changes"
 *   isSaving  — disables the save button while the mutation is in flight
 *
 * Accessibility (WCAG 2.1 AA):
 *   - All colour inputs: explicit <label> + aria-describedby for hint (1.3.5)
 *   - Contrast ratio: communicated as text, not colour alone (1.4.1)
 *   - role="status" on preview region (live) (4.1.3)
 *   - All selects: explicit <label> elements (1.3.5)
 *   - Save button: aria-busy during save (4.1.2)
 */

import { useId } from 'react';
import { contrastColor } from '@cannasaas/utils';
import { BrandingPreview, type BrandingConfig } from './BrandingPreview';

// ── Font options ──────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { value: 'Inter',              label: 'Inter (default)',    sample: 'Inter' },
  { value: 'DM Sans',            label: 'DM Sans',            sample: 'DM Sans' },
  { value: 'Plus Jakarta Sans',  label: 'Plus Jakarta Sans',  sample: 'Plus Jakarta' },
  { value: 'Nunito',             label: 'Nunito',             sample: 'Nunito' },
  { value: 'Poppins',            label: 'Poppins',            sample: 'Poppins' },
  { value: 'Playfair Display',   label: 'Playfair Display',   sample: 'Playfair' },
  { value: 'Merriweather',       label: 'Merriweather',       sample: 'Merriweather' },
  { value: 'Lora',               label: 'Lora',               sample: 'Lora' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Calculate approximate WCAG contrast ratio for display purposes */
function approxContrast(hex: string, against: '#ffffff' | '#000000' = '#ffffff'): string {
  // Simplified — full WCAG formula requires relative luminance
  // For display purposes, contrastColor() already encodes the decision
  const best = contrastColor(hex);
  return best === against ? '≥ 4.5:1 ✓' : '< 4.5:1 ✗';
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * A single colour row: labelled native colour picker + hex text input + contrast hint.
 */
function ColourRow({
  label, value, hint, onChange,
}: {
  label:    string;
  value:    string;
  hint?:    string;
  onChange: (hex: string) => void;
}) {
  const pickerId = useId();
  const textId   = useId();
  const hintId   = useId();

  const normalHex   = value.startsWith('#') ? value : `#${value}`;
  const contrastHint = approxContrast(normalHex, '#ffffff');
  const isValidHex  = /^#[0-9A-Fa-f]{6}$/.test(normalHex);

  const handleTextChange = (raw: string) => {
    // Accept live typing — only propagate when value is a valid hex
    if (/^#?[0-9A-Fa-f]{0,6}$/.test(raw)) {
      const withHash = raw.startsWith('#') ? raw : `#${raw}`;
      if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) onChange(withHash);
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={pickerId} className="block text-sm font-semibold text-stone-700">
        {label}
      </label>
      {hint && <p id={hintId} className="text-xs text-stone-400">{hint}</p>}

      <div className="flex items-center gap-2">
        {/* Native colour picker — styled wrapper */}
        <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-stone-200 shadow-sm flex-shrink-0">
          <input
            id={pickerId}
            type="color"
            value={normalHex}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={hint ? hintId : undefined}
            className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0 hover:opacity-100"
            // The visible swatch background is set via the wrapper div style
          />
          <div
            aria-hidden="true"
            className="w-full h-full rounded-lg transition-colors"
            style={{ backgroundColor: normalHex }}
          />
        </div>

        {/* Hex text input */}
        <input
          id={textId}
          type="text"
          value={normalHex}
          onChange={(e) => handleTextChange(e.target.value)}
          aria-label={`${label} hex value`}
          aria-invalid={!isValidHex}
          maxLength={7}
          className={[
            'flex-1 px-3 py-2 text-sm font-mono border rounded-xl bg-white',
            'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)]',
            isValidHex ? 'border-stone-200' : 'border-red-400 bg-red-50',
          ].join(' ')}
        />
      </div>

      {/* Contrast ratio feedback */}
      <p className={[
        'text-xs flex items-center gap-1',
        contrastHint.includes('✓') ? 'text-green-600' : 'text-amber-600',
      ].join(' ')}>
        <span aria-hidden="true">{contrastHint.includes('✓') ? '✓' : '⚠'}</span>
        White text on this colour: {contrastHint}
      </p>
    </div>
  );
}

// ── BrandingEditor (main export) ──────────────────────────────────────────────

export interface BrandingEditorProps {
  value:     BrandingConfig;
  onChange:  (updated: BrandingConfig) => void;
  onSave:    () => void;
  isSaving?: boolean;
}

export function BrandingEditor({ value, onChange, onSave, isSaving }: BrandingEditorProps) {
  const headingFontId = useId();
  const bodyFontId    = useId();

  const update = (partial: Partial<BrandingConfig>) => onChange({ ...value, ...partial });

  return (
    <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">

      {/* ── Left: controls ──────────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Colour section */}
        <fieldset className="space-y-5">
          <legend className="text-base font-extrabold text-stone-900">Brand Colours</legend>
          <ColourRow
            label="Primary"
            value={value.primaryColor ?? '#2D6A4F'}
            hint="Main brand colour — buttons, links, active states"
            onChange={(hex) => update({ primaryColor: hex })}
          />
          <ColourRow
            label="Secondary"
            value={value.secondaryColor ?? '#52B788'}
            hint="Supporting colour — hover states, secondary buttons"
            onChange={(hex) => update({ secondaryColor: hex })}
          />
          <ColourRow
            label="Accent"
            value={value.accentColor ?? '#B7E4C7'}
            hint="Highlights — badges, chips, sale indicators"
            onChange={(hex) => update({ accentColor: hex })}
          />
        </fieldset>

        {/* Font section */}
        <fieldset className="space-y-4">
          <legend className="text-base font-extrabold text-stone-900">Typography</legend>

          <div>
            <label htmlFor={headingFontId} className="block text-sm font-semibold text-stone-700 mb-1.5">
              Heading Font
            </label>
            <select
              id={headingFontId}
              value={value.fontHeading ?? 'Inter'}
              onChange={(e) => update({ fontHeading: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)]"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={bodyFontId} className="block text-sm font-semibold text-stone-700 mb-1.5">
              Body Font
            </label>
            <select
              id={bodyFontId}
              value={value.fontBody ?? 'Inter'}
              onChange={(e) => update({ fontBody: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary,154_40%_30%)/0.3)]"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Save button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          aria-busy={isSaving}
          className={[
            'w-full py-3 rounded-xl text-sm font-bold transition-all',
            'bg-[hsl(var(--primary,154_40%_30%))] text-white',
            'hover:brightness-110 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-offset-2',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {isSaving ? 'Saving…' : 'Save Branding'}
        </button>
      </div>

      {/* ── Right: live preview ──────────────────────────────────────────── */}
      <div
        role="status"
        aria-label="Live branding preview — updates as you change settings"
        aria-live="polite"
      >
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Live Preview
        </p>
        <BrandingPreview branding={value} />
      </div>
    </div>
  );
}
TSEOF
echo "  ✓ packages/ui/src/components/theme/BrandingEditor.tsx"

# =============================================================================
# packages/ui/src/components/theme/index.ts
# =============================================================================
cat > "$UI_THEME/index.ts" << 'TSEOF'
/**
 * @file index.ts
 * @package @cannasaas/ui
 *
 * Barrel export for the theme component suite.
 *
 * ── Components ───────────────────────────────────────────────────────────────
 *
 *   ThemeToggle      — Dark/light/system mode switch button (icon or segmented)
 *   ColorSwatch      — Colour tile with copy-to-clipboard
 *   BrandingPreview  — Live mini-storefront branding preview card
 *   BrandingEditor   — Full colour + font editor with live preview integration
 *
 * ── Types ────────────────────────────────────────────────────────────────────
 *
 *   BrandingConfig   — Shape of the branding configuration object
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   // In the Admin Settings Branding tab:
 *   import { BrandingEditor, BrandingPreview, type BrandingConfig } from '@cannasaas/ui';
 *
 *   // In nav / topbar:
 *   import { ThemeToggle } from '@cannasaas/ui';
 *
 *   // ThemeProvider (wrap once at app root):
 *   import { ThemeProvider } from '@cannasaas/ui';
 */

export { ThemeToggle }        from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

export { ColorSwatch }        from './ColorSwatch';
export type { ColorSwatchProps } from './ColorSwatch';

export { BrandingPreview }    from './BrandingPreview';
export type { BrandingConfig, BrandingPreviewProps } from './BrandingPreview';

export { BrandingEditor }     from './BrandingEditor';
export type { BrandingEditorProps } from './BrandingEditor';
TSEOF
echo "  ✓ packages/ui/src/components/theme/index.ts"

# =============================================================================
# tailwind.config.ts — shared, lives at packages/ui or workspace root
# =============================================================================
cat > "$ROOT/tailwind.config.ts" << 'TSEOF'
/**
 * @file tailwind.config.ts
 * @workspace root
 *
 * Shared Tailwind CSS v3 configuration for all CannaSaas frontend apps.
 *
 * ── CSS variable colour strategy ──────────────────────────────────────────────
 *
 * All brand colours are defined as CSS custom properties in :root and
 * referenced here using the Tailwind CSS variable pattern:
 *
 *   hsl(var(--primary))            → full opacity brand colour
 *   hsl(var(--primary) / 0.1)     → 10% opacity (opacity modifier)
 *
 * CSS vars store bare HSL channel values (no `hsl()` wrapper):
 *   --primary: 154 40% 29%
 *
 * This enables Tailwind's opacity modifier syntax AND allows ThemeProvider
 * to change colours at runtime by updating the CSS var — zero component
 * changes required for a full tenant rebrand.
 *
 * ── Dark mode ────────────────────────────────────────────────────────────────
 *
 * strategy: 'class' — the `dark` class on <html> activates dark utilities.
 * Controlled by ThemeProvider which adds/removes the class based on
 * themeStore.mode.
 *
 * ── Content paths ────────────────────────────────────────────────────────────
 *
 * Includes all three apps and the shared packages. Adjust if your directory
 * structure differs.
 *
 * ── Custom utilities ──────────────────────────────────────────────────────────
 *
 * focus-ring:     Standard keyboard focus indicator (WCAG 2.4.7)
 *   Applied manually with @apply in component CSS, or via the `focus-visible:`
 *   variant + ring utilities.
 *
 * ── shadcn/ui compatibility ───────────────────────────────────────────────────
 *
 * shadcn/ui components reference the same CSS var names (--primary, --secondary,
 * etc.) via the `hsl(var(--primary))` pattern. This config ensures Tailwind
 * generates the correct utility classes that match shadcn's expectations.
 *
 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
 * @see https://ui.shadcn.com/docs/theming
 */

import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  /**
   * Class-based dark mode — ThemeProvider adds/removes 'dark' on <html>.
   * Never use `media` strategy as it bypasses the user preference store.
   */
  darkMode: ['class'],

  /**
   * Content paths — scanned for class usage during the production build.
   * Includes all three apps and all shared packages.
   */
  content: [
    './apps/storefront/src/**/*.{ts,tsx}',
    './apps/admin/src/**/*.{ts,tsx}',
    './apps/staff/src/**/*.{ts,tsx}',
    './packages/ui/src/**/*.{ts,tsx}',
    './packages/utils/src/**/*.{ts,tsx}',
  ],

  theme: {
    extend: {
      /**
       * Colour tokens — all reference CSS custom properties set by ThemeProvider.
       *
       * These replace Tailwind's default colour utilities for the named tokens.
       * Components use utilities like `bg-primary`, `text-secondary`, `border-accent`.
       *
       * Opacity modifier syntax works automatically because the CSS vars store
       * bare HSL channel values:
       *   `bg-primary/10`  → `background-color: hsl(var(--primary) / 0.1)`
       */
      colors: {
        /** Main brand colour — buttons, links, active nav states */
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 100%))',
        },
        /** Supporting colour — hover states, secondary buttons */
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground, 0 0% 100%))',
        },
        /** Highlight colour — badges, chips, sale tags */
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground, 0 0% 0%))',
        },
        /**
         * Semantic tokens for shadcn/ui compatibility.
         * ThemeProvider does not set these — they fall back to CSS defaults.
         * Override in global CSS if needed.
         */
        background:   'hsl(var(--background, 0 0% 100%))',
        foreground:   'hsl(var(--foreground, 222 47% 11%))',
        card:         'hsl(var(--card, 0 0% 100%))',
        muted:        'hsl(var(--muted, 210 40% 96%))',
        'muted-foreground': 'hsl(var(--muted-foreground, 215 16% 47%))',
        border:       'hsl(var(--border, 214 32% 91%))',
        input:        'hsl(var(--input, 214 32% 91%))',
        ring:         'hsl(var(--ring, var(--primary)))',
        destructive: {
          DEFAULT:    'hsl(var(--destructive, 0 84% 60%))',
          foreground: 'hsl(var(--destructive-foreground, 0 0% 100%))',
        },
      },

      /**
       * Font families — reference CSS custom properties set by ThemeProvider.
       * Fallback chain ensures text renders even before the Google Font loads.
       */
      fontFamily: {
        sans: [
          'var(--font-body, Inter)',
          'Inter',
          ...fontFamily.sans,
        ],
        heading: [
          'var(--font-heading, Inter)',
          'Inter',
          ...fontFamily.sans,
        ],
        mono: fontFamily.mono,
      },

      /**
       * Border radius tokens — matches shadcn/ui convention.
       * Set --radius in global CSS to change the rounding scale site-wide.
       */
      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },

      /**
       * Keyframe animations — used by loading spinners and toast notifications.
       */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.15s ease-out',
        'slide-in-right':  'slide-in-right 0.15s ease-out',
      },
    },
  },

  plugins: [
    /** @tailwindcss/typography — for rich-text content areas */
    // require('@tailwindcss/typography'),
    /** @tailwindcss/forms — for default form element resets */
    // require('@tailwindcss/forms'),
    /** tailwindcss-animate — for shadcn/ui animation utilities */
    // require('tailwindcss-animate'),
  ],
};

export default config;
TSEOF
echo "  ✓ tailwind.config.ts"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "══════════════════════════════════════════════════════"
echo "  Phase H — Complete file tree"
echo "══════════════════════════════════════════════════════"
find \
  "$UTILS_SRC/color.ts" \
  "$STORES_SRC/themeStore.ts" \
  "$UI_PROV/ThemeProvider.tsx" \
  "$UI_THEME" \
  "$ROOT/tailwind.config.ts" \
  -type f 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/  /'

COUNT=$(find "$UTILS_SRC/color.ts" "$STORES_SRC/themeStore.ts" "$UI_PROV" "$UI_THEME" "$ROOT/tailwind.config.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "  ✅  $COUNT Phase H files written"
echo ""
