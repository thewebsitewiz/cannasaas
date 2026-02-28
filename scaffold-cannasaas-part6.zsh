#!/usr/bin/env zsh
# =============================================================================
# CannaSaas — Part 6: Design System & Theming Engine
# Scaffold Script  |  Version 3.0  |  February 2026
# =============================================================================
#
# COVERS SECTION 6  (lines 2310–2464 of CannaSaas-PublicBeta-DeepDive.md)
#
#   One file is defined in this section:
#
#     packages/ui/src/providers/ThemeProvider.tsx
#       — Dual-purpose provider:
#         1. Injects per-dispensary brand CSS custom properties at :root
#            at runtime — zero component rewrites for white-label support.
#         2. Manages light / dark / system color-scheme preference,
#            persisted to localStorage.
#       — Exports:  ThemeProvider, useTheme
#       — Utility functions (file-private): hexToHsl, darkenHex,
#            injectGoogleFont
#
#   Plus one targeted update:
#     packages/ui/src/index.ts
#       — Activates the ThemeProvider + useTheme export line
#
# DOES NOT INCLUDE
#   Section 7 (Customer Storefront pages) — covered in Part 7
#
# RELATIONSHIP TO PRIOR PARTS
#   Requires Part 3 (monorepo skeleton) and Part 4 (packages/ui scaffold).
#   Part 4 created packages/ui/src/providers/ as a directory and left a
#   commented-out export in packages/ui/src/index.ts — this script fills both.
#
# USAGE
#   zsh scaffold-cannasaas-part6.zsh                   # uses ./cannasaas-platform
#   zsh scaffold-cannasaas-part6.zsh ~/projects        # uses ~/projects/cannasaas-platform
#   zsh scaffold-cannasaas-part6.zsh ~/projects --skip-existing
#
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
autoload -U colors && colors
info()    { print -P "%F{cyan}  ▸%f  $*" }
ok()      { print -P "%F{green}  ✔%f  $*" }
skip()    { print -P "%F{yellow}  ↷%f  $* (skipped — already exists)" }
warn()    { print -P "%F{yellow}  ⚠%f  $*" }
section() { print -P "\n%F{magenta}%B── $* ──%b%f" }
err()     { print -P "%F{red}  ✘%f  $*" >&2; exit 1 }

# ── Argument parsing ──────────────────────────────────────────────────────────
SKIP_EXISTING=false
BASE=""

for arg in "$@"; do
  case "$arg" in
    --skip-existing) SKIP_EXISTING=true ;;
    *)               BASE="$arg" ;;
  esac
done

BASE="${BASE:-$(pwd)}"
ROOT="${BASE}/cannasaas-platform"

[[ -d "${ROOT}" ]] || \
  err "cannasaas-platform/ not found at ${ROOT}\nRun Part 3 scaffold first."

print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  CannaSaas · Part 6 — Theming Engine         ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f\n"
info "Target root: ${ROOT}"
[[ "${SKIP_EXISTING}" == "true" ]] && \
  warn "Skip-existing mode ON — existing files will NOT be overwritten"

# ── File writer ───────────────────────────────────────────────────────────────
# Default: always writes (replaces any prior stub).
# --skip-existing: idempotent, safe after manual edits.
write_file() {
  local target="$1"
  if [[ "${SKIP_EXISTING}" == "true" && -f "$target" ]]; then
    skip "$target"
    cat > /dev/null
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  cat > "$target"
  ok "Wrote $target"
}

mkd() { [[ -d "$1" ]] || { mkdir -p "$1"; ok "(dir) $1"; } }

# =============================================================================
# SECTION 6 — packages/ui/src/providers/ThemeProvider.tsx
# =============================================================================
section "6 · packages/ui/src/providers/ThemeProvider.tsx"

mkd "${ROOT}/packages/ui/src/providers"

write_file "${ROOT}/packages/ui/src/providers/ThemeProvider.tsx" <<'HEREDOC'
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
HEREDOC

# =============================================================================
# Update packages/ui/src/index.ts — activate ThemeProvider + useTheme export
#
# Part 4 left a commented-out stub:
#   // export { ThemeProvider } from './providers/ThemeProvider';
# We uncomment it and expand it to include useTheme.
# If the line is already live, sed is a no-op; if the file is missing we
# write a fresh index that includes everything through Part 6.
# =============================================================================
section "Update packages/ui/src/index.ts — activate ThemeProvider export"

UI_INDEX="${ROOT}/packages/ui/src/index.ts"

if [[ -f "${UI_INDEX}" ]]; then
  # Uncomment a stub line that only exports ThemeProvider
  sed -i.bak \
    "s|// export { ThemeProvider } from './providers/ThemeProvider';|export { ThemeProvider, useTheme } from './providers/ThemeProvider';|" \
    "${UI_INDEX}"

  # Also handle the variant that may already name both exports but be commented
  sed -i.bak \
    "s|// export { ThemeProvider, useTheme } from './providers/ThemeProvider';|export { ThemeProvider, useTheme } from './providers/ThemeProvider';|" \
    "${UI_INDEX}"

  rm -f "${UI_INDEX}.bak"

  # Check whether the export is now live; if the stub line wasn't present at
  # all (e.g. Part 4 was skipped), append the export so the index is complete.
  if ! grep -q "ThemeProvider" "${UI_INDEX}"; then
    echo "" >> "${UI_INDEX}"
    echo "// Part 6" >> "${UI_INDEX}"
    echo "export { ThemeProvider, useTheme } from './providers/ThemeProvider';" \
      >> "${UI_INDEX}"
    ok "Appended ThemeProvider export to ${UI_INDEX}"
  else
    ok "Updated ${UI_INDEX} — ThemeProvider + useTheme export active"
  fi
else
  warn "${UI_INDEX} not found — writing fresh index covering Parts 4–6"
  write_file "${UI_INDEX}" <<'HEREDOC'
// ── CannaSaas UI — Public Component Surface ───────────────────────────────────
// All apps import UI components from '@cannasaas/ui'.
// Never import from deep paths inside this package.

// ── Part 4: Core components ───────────────────────────────────────────────────
export { Button,       type ButtonProps }     from './components/Button/Button';
export { Badge,        type BadgeProps }       from './components/Badge/Badge';
export { ProductCard,  type ProductCardProps } from './components/ProductCard/ProductCard';
export { PotencyBar }                         from './components/ProductCard/PotencyBar';
export { StrainTypeBadge }                    from './components/ProductCard/StrainTypeBadge';
export { EffectsChips }                       from './components/ProductCard/EffectsChips';
export { FullPageLoader }                     from './components/FullPageLoader/FullPageLoader';

// ── Part 6: Theming engine ────────────────────────────────────────────────────
export { ThemeProvider, useTheme }            from './providers/ThemeProvider';

// ── Parts 7+ (stubs — uncomment as implemented) ───────────────────────────────
// export { Input }     from './components/Input/Input';
// export { Select }    from './components/Select/Select';
// export { Modal }     from './components/Modal/Modal';
// export { Toast }     from './components/Toast/Toast';
// export { DataTable } from './components/DataTable/DataTable';
HEREDOC
fi

# =============================================================================
# SUMMARY
# =============================================================================
print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  Part 6 complete!                             ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f"
print ""
print -P "  %F{cyan}Files written / updated:%f"
print ""
print -P "  %F{white}packages/ui%f"
print -P "    src/providers/ThemeProvider.tsx"
print -P "      ThemeProvider  — injects BrandingConfig tokens at :root,"
print -P "                       manages light/dark/system preference"
print -P "      useTheme()     — context hook for color-scheme read/write"
print -P "      hexToHsl, darkenHex, injectGoogleFont  (file-private utils)"
print ""
print -P "    src/index.ts  — ThemeProvider + useTheme export activated"
print ""
print -P "  %F{yellow}Usage in app roots (Part 7+):%f"
print -P "    import { ThemeProvider } from '@cannasaas/ui';"
print -P "    import { useTenantBranding } from '@cannasaas/stores';"
print -P ""
print -P "    <ThemeProvider branding={useTenantBranding()}>"
print -P "      <App />"
print -P "    </ThemeProvider>"
print ""
print -P "  %F{yellow}Next step:%f  run Part 7 scaffold → Customer Storefront"
print ""
