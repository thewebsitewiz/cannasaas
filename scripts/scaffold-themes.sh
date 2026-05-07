#!/usr/bin/env bash
# =============================================================================
#  scaffold-themes.sh
#  GreenStack Design System — Theme Switching Scaffold
#
#  WHAT THIS DOES:
#    1. Places greenstack-design-system.css into packages/ui/src/
#    2. Creates packages/ui/src/themes/ with 5 starter theme files
#    3. Creates packages/ui/src/ThemeLoader.tsx
#    4. Creates packages/ui/src/ThemePicker.tsx (admin UI component)
#    5. Patches packages/stores/src/organizationStore.ts — adds themeId
#    6. Patches packages/types/src/organization.types.ts — adds themeId field
#    7. Patches apps/*/src/main.tsx — adds CSS import + <ThemeLoader />
#    8. Patches apps/*/index.html — adds data-portal attribute
#    9. Creates packages/ui/src/index.ts export entry if missing
#   10. Creates cannasaas-api migration for organizations.theme_id column
#
#  USAGE:
#    # From your monorepo root (~/Documents/Projects/cannasaas):
#    chmod +x scaffold-themes.sh
#    ./scaffold-themes.sh
#
#    # Or pass an explicit root:
#    ./scaffold-themes.sh ~/Documents/Projects/cannasaas
#
#  SAFETY:
#    - Idempotent — safe to re-run. Never overwrites existing file content
#      unless the script explicitly patches a known injection point.
#    - All patches use marker comments so re-runs are no-ops.
#    - Creates .bak backups before patching any existing file.
#    - set -euo pipefail — exits immediately on any error.
#
#  AFTER RUNNING:
#    pnpm install
#    pnpm -r type-check
# =============================================================================

set -euo pipefail

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}  ✗ ERROR:${RESET} $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}$*${RESET}"; }
skip()    { echo -e "  ${YELLOW}↷${RESET} (already patched) $*"; }

# ── Root resolution ────────────────────────────────────────────────────────────
# Accept an explicit path argument, otherwise use cwd.
ROOT="${1:-$(pwd)}"

# Hard-fail if this looks like a wrong directory (Downloads, Desktop, ~, etc.)
# A monorepo root must have at least one of these markers.
if [[ ! -f "$ROOT/pnpm-workspace.yaml" ]] && \
   [[ ! -f "$ROOT/turbo.json" ]] && \
   [[ ! -d "$ROOT/packages" ]] && \
   [[ ! -d "$ROOT/apps" ]]; then
  echo ""
  echo -e "${RED}  ✗  Wrong directory.${RESET}"
  echo ""
  echo -e "  This script must be run from your CannaSaas monorepo root, not from"
  echo -e "  Downloads, Desktop, or your home folder."
  echo ""
  echo -e "  ${BOLD}Run it like this:${RESET}"
  echo -e "  ${CYAN}  cd ~/Documents/Projects/cannasaas${RESET}"
  echo -e "  ${CYAN}  bash ~/Downloads/scaffold-themes.sh${RESET}"
  echo ""
  echo -e "  ${BOLD}Or pass the path explicitly:${RESET}"
  echo -e "  ${CYAN}  bash ~/Downloads/scaffold-themes.sh ~/Documents/Projects/cannasaas${RESET}"
  echo ""
  exit 1
fi

# Soft-warn if pnpm-workspace.yaml is absent but other markers were found
[[ -f "$ROOT/pnpm-workspace.yaml" ]] || \
  warn "pnpm-workspace.yaml not found — proceeding with packages/ and apps/ directories."

# ── Expected directory paths ───────────────────────────────────────────────────
UI_SRC="$ROOT/packages/ui/src"
UI_THEMES="$UI_SRC/themes"
STORES_SRC="$ROOT/packages/stores/src"
TYPES_SRC="$ROOT/packages/types/src"
MIGRATIONS="$ROOT/cannasaas-api/src/migrations"

APPS=("storefront" "admin" "staff")

# ── Portable portal name lookup (replaces bash 4-only declare -A) ──────────────
# macOS ships bash 3.2 which does not support associative arrays.
portal_name() {
  case "$1" in
    storefront) echo "storefront" ;;
    admin)      echo "admin"      ;;
    staff)      echo "staff"      ;;
    kiosk)      echo "kiosk"      ;;
    *)          echo "$1"         ;;
  esac
}

# ── Banner ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   GreenStack Theme System — CannaSaas Monorepo Scaffold      ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Monorepo root : ${CYAN}$ROOT${RESET}"
echo ""

# ── Preflight: ensure required dirs exist ──────────────────────────────────────
header "§ 0  Preflight checks"

mkdir -p "$UI_SRC" "$UI_THEMES" "$STORES_SRC" "$TYPES_SRC" "$MIGRATIONS"
success "Core directories ready"

for app in "${APPS[@]}"; do
  mkdir -p "$ROOT/apps/$app/src"
  success "apps/$app/src"
done

# =============================================================================
#  § 1  GREENSTACK DESIGN SYSTEM CSS → packages/ui/src/
# =============================================================================
header "§ 1  Design system CSS"

CSS_DEST="$UI_SRC/greenstack-design-system.css"
CSS_SRC="$(dirname "$0")/greenstack-design-system.css"

if [[ -f "$CSS_DEST" ]]; then
  skip "packages/ui/src/greenstack-design-system.css (already exists)"
elif [[ -f "$CSS_SRC" ]]; then
  cp "$CSS_SRC" "$CSS_DEST"
  success "Copied greenstack-design-system.css → packages/ui/src/"
else
  # CSS file not alongside script — write the minimal token skeleton so the
  # project still compiles. Developer replaces with full file.
  cat > "$CSS_DEST" << 'CSSEOF'
/**
 * GreenStack Design System — place the full file here.
 * Generated placeholder by scaffold-themes.sh
 *
 * Replace this file with the full greenstack-design-system.css
 * from your Claude conversation output.
 */
:root {
  --gs-forest:   #122d1f;
  --gs-fern:     #2a6640;
  --gs-sage:     #5e9b73;
  --gs-cream:    #f5f0e4;
  --gs-amber:    #c47820;
  --gs-charcoal: #18181a;

  --color-bg:       var(--gs-cream);
  --color-surface:  #ffffff;
  --color-primary:  var(--gs-fern);
  --color-text:     var(--gs-charcoal);
  --font-display:   'Lora', Georgia, serif;
  --font-body:      'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono:      'JetBrains Mono', monospace;
}
CSSEOF
  warn "greenstack-design-system.css not found next to script."
  warn "Wrote placeholder → packages/ui/src/greenstack-design-system.css"
  warn "Replace it with the full file from your Claude output."
fi

# =============================================================================
#  § 2  THEME FILES → packages/ui/src/themes/
#       Each theme only re-declares :root CSS custom properties.
#       data-theme="<id>" on <html> activates the overrides.
# =============================================================================
header "§ 2  Theme files"

write_theme() {
  local file="$UI_THEMES/$1"
  if [[ -f "$file" ]]; then
    skip "$file"
    return
  fi
  cat > "$file"
  success "themes/$1"
}

# ── theme.earthy.css (default — warm greens & parchment) ──────────────────────
write_theme "theme.earthy.css" << 'EOF'
/**
 * GreenStack Theme: Earthy (default)
 * Warm organic cannabis dispensary. Deep forest greens, golden amber,
 * parchment cream. Serif display type.
 * Activate: <html data-theme="earthy">
 */
[data-theme="earthy"],
:root {
  --color-bg:             #f7f2e7;
  --color-bg-alt:         #f0ead8;
  --color-surface:        #ffffff;
  --color-surface-alt:    #faf7f0;
  --color-surface-hover:  #f3ede0;
  --color-border:         #e8e1ce;
  --color-border-strong:  #d4cbb2;
  --color-text:           #1a1a16;
  --color-text-secondary: #3a3a30;
  --color-text-muted:     #6e6858;
  --color-text-faint:     #a8a090;
  --color-primary:        #2a6640;
  --color-primary-hover:  #1e4b31;
  --color-primary-light:  #5e9b73;
  --color-primary-xlight: #e8f4ec;
  --color-accent:         #c47820;
  --color-accent-hover:   #a8640e;
  --color-accent-light:   #f0b655;
  --color-accent-xlight:  #fdf1dc;
  --gs-forest:            #122d1f;
  --gs-pine:              #1e4b31;
  --gs-fern:              #2a6640;
  --gs-sage:              #5e9b73;
  --gs-cream:             #f5f0e4;
  --gs-amber:             #c47820;
  --font-display:         'Lora', Georgia, serif;
  --font-body:            'Plus Jakarta Sans', system-ui, sans-serif;
}
EOF

# ── theme.midnight.css (dark luxury) ──────────────────────────────────────────
write_theme "theme.midnight.css" << 'EOF'
/**
 * GreenStack Theme: Midnight
 * Dark luxury dispensary. Deep blacks, electric sage, gold accents.
 * Premium after-dark atmosphere. Sans-serif display.
 * Activate: <html data-theme="midnight">
 */
[data-theme="midnight"] {
  --color-bg:             #08100a;
  --color-bg-alt:         #0c1610;
  --color-surface:        #111e14;
  --color-surface-alt:    #162219;
  --color-surface-hover:  #1c2c20;
  --color-border:         rgba(255,255,255,.08);
  --color-border-strong:  rgba(255,255,255,.15);
  --color-text:           rgba(245,242,232,.94);
  --color-text-secondary: rgba(245,242,232,.72);
  --color-text-muted:     rgba(245,242,232,.48);
  --color-text-faint:     rgba(245,242,232,.28);
  --color-primary:        #4db870;
  --color-primary-hover:  #3aa05e;
  --color-primary-light:  #7dd4a0;
  --color-primary-xlight: rgba(77,184,112,.14);
  --color-accent:         #d4a030;
  --color-accent-hover:   #b88820;
  --color-accent-light:   #f0c060;
  --color-accent-xlight:  rgba(212,160,48,.14);
  --gs-forest:            #060d07;
  --gs-pine:              #0e1e11;
  --gs-fern:              #1e5230;
  --gs-sage:              #4db870;
  --gs-cream:             rgba(245,242,232,.94);
  --gs-amber:             #d4a030;
  --font-display:         'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:            'Plus Jakarta Sans', system-ui, sans-serif;

  color-scheme: dark;
}

/* Darken scrollbar for midnight */
[data-theme="midnight"] ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); }
EOF

# ── theme.citrus.css (bright modern) ──────────────────────────────────────────
write_theme "theme.citrus.css" << 'EOF'
/**
 * GreenStack Theme: Citrus
 * Bright, energetic, modern dispensary. White base, lime greens,
 * punchy orange accents. Clean sans-serif throughout.
 * Activate: <html data-theme="citrus">
 */
[data-theme="citrus"] {
  --color-bg:             #f8faf4;
  --color-bg-alt:         #f0f5e8;
  --color-surface:        #ffffff;
  --color-surface-alt:    #f4f8ee;
  --color-surface-hover:  #edf4e0;
  --color-border:         #d8e8c0;
  --color-border-strong:  #bcd8a0;
  --color-text:           #1a2010;
  --color-text-secondary: #2e3c20;
  --color-text-muted:     #5a7040;
  --color-text-faint:     #8aaa68;
  --color-primary:        #5aaa20;
  --color-primary-hover:  #489010;
  --color-primary-light:  #88cc50;
  --color-primary-xlight: #edfad0;
  --color-accent:         #e87820;
  --color-accent-hover:   #cc6010;
  --color-accent-light:   #ffaa60;
  --color-accent-xlight:  #fff0e0;
  --gs-forest:            #1a3808;
  --gs-pine:              #285010;
  --gs-fern:              #5aaa20;
  --gs-sage:              #88cc50;
  --gs-cream:             #f8faf4;
  --gs-amber:             #e87820;
  --font-display:         'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:            'Plus Jakarta Sans', system-ui, sans-serif;
}
EOF

# ── theme.apothecary.css (clinical / medical) ─────────────────────────────────
write_theme "theme.apothecary.css" << 'EOF'
/**
 * GreenStack Theme: Apothecary
 * Clinical, medical-grade aesthetic. Cool whites, navy, slate blue.
 * Trust, precision, pharmaceutical credibility.
 * Activate: <html data-theme="apothecary">
 */
[data-theme="apothecary"] {
  --color-bg:             #f4f6fb;
  --color-bg-alt:         #edf0f8;
  --color-surface:        #ffffff;
  --color-surface-alt:    #f7f9fd;
  --color-surface-hover:  #eef1f8;
  --color-border:         #d8dff0;
  --color-border-strong:  #b8c4e0;
  --color-text:           #0f1628;
  --color-text-secondary: #1e2e50;
  --color-text-muted:     #4a5880;
  --color-text-faint:     #8090b8;
  --color-primary:        #2660b8;
  --color-primary-hover:  #1a4a98;
  --color-primary-light:  #6090d8;
  --color-primary-xlight: #e8f0fb;
  --color-accent:         #20a89a;
  --color-accent-hover:   #168878;
  --color-accent-light:   #60d8d0;
  --color-accent-xlight:  #e0faf8;
  --gs-forest:            #0a1428;
  --gs-pine:              #122040;
  --gs-fern:              #2660b8;
  --gs-sage:              #6090d8;
  --gs-cream:             #f4f6fb;
  --gs-amber:             #20a89a;
  --font-display:         'Lora', Georgia, serif;
  --font-body:            'Plus Jakarta Sans', system-ui, sans-serif;
}
EOF

# ── theme.neon.css (streetwear / bold) ────────────────────────────────────────
write_theme "theme.neon.css" << 'EOF'
/**
 * GreenStack Theme: Neon
 * Bold streetwear dispensary aesthetic. Near-black base, electric green,
 * hot pink accents. Urban, energetic, unapologetic.
 * Activate: <html data-theme="neon">
 */
[data-theme="neon"] {
  --color-bg:             #0a0a0a;
  --color-bg-alt:         #111111;
  --color-surface:        #161616;
  --color-surface-alt:    #1e1e1e;
  --color-surface-hover:  #242424;
  --color-border:         rgba(0,255,120,.12);
  --color-border-strong:  rgba(0,255,120,.22);
  --color-text:           #f0f0e8;
  --color-text-secondary: #d0d0c8;
  --color-text-muted:     #888880;
  --color-text-faint:     #505050;
  --color-primary:        #00ff78;
  --color-primary-hover:  #00dd60;
  --color-primary-light:  #80ffbc;
  --color-primary-xlight: rgba(0,255,120,.12);
  --color-accent:         #ff2d78;
  --color-accent-hover:   #dd1860;
  --color-accent-light:   #ff80b0;
  --color-accent-xlight:  rgba(255,45,120,.12);
  --gs-forest:            #050505;
  --gs-pine:              #0a0a0a;
  --gs-fern:              #00cc60;
  --gs-sage:              #00ff78;
  --gs-cream:             #f0f0e8;
  --gs-amber:             #ff2d78;
  --font-display:         'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:            'Plus Jakarta Sans', system-ui, sans-serif;

  color-scheme: dark;
}

[data-theme="neon"] ::-webkit-scrollbar-thumb { background: rgba(0,255,120,.2); }
[data-theme="neon"] ::selection { background: #00ff78; color: #0a0a0a; }
EOF

# =============================================================================
#  § 3  ThemeLoader.tsx → packages/ui/src/ThemeLoader.tsx
# =============================================================================
header "§ 3  ThemeLoader component"

THEME_LOADER="$UI_SRC/ThemeLoader.tsx"
if [[ -f "$THEME_LOADER" ]]; then
  skip "packages/ui/src/ThemeLoader.tsx"
else
  cat > "$THEME_LOADER" << 'EOF'
/**
 * @file ThemeLoader.tsx
 * @package @cannasaas/ui
 *
 * Reads the active organization's themeId from Zustand and does two things:
 *
 *   1. Sets data-theme="<themeId>" on <html> so CSS custom property
 *      overrides ([data-theme="midnight"] { ... }) cascade immediately.
 *
 *   2. Injects a <link> tag to load the per-theme CSS file from /themes/.
 *      On fast connections the file is already cached; on slow connections
 *      the data-theme attribute applies instantly from the base system file
 *      while the theme file streams in (progressive enhancement).
 *
 * Mount this once at the root of every app:
 *   apps/storefront/src/main.tsx
 *   apps/admin/src/main.tsx
 *   apps/staff/src/main.tsx
 *
 * It renders null — no DOM output, only side effects.
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';

// Must match the filenames in packages/ui/src/themes/ and /public/themes/
export const AVAILABLE_THEMES = [
  'earthy',
  'midnight',
  'citrus',
  'apothecary',
  'neon',
] as const;

export type ThemeId = typeof AVAILABLE_THEMES[number];

export const DEFAULT_THEME: ThemeId = 'earthy';

const LINK_ID = 'gs-theme';

/**
 * Swaps the active theme CSS file and data-theme attribute.
 * Called by useEffect whenever themeId changes.
 */
function applyTheme(themeId: string): void {
  const safeId = AVAILABLE_THEMES.includes(themeId as ThemeId)
    ? themeId
    : DEFAULT_THEME;

  // 1. Attribute — instant, CSS cascade handles the rest
  document.documentElement.setAttribute('data-theme', safeId);

  // 2. Link tag — loads the theme override file
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // Swap href atomically — browser loads new file before removing old
  link.href = `/themes/theme.${safeId}.css`;
}

export function ThemeLoader(): null {
  // Pull themeId from the organization context.
  // Falls back to DEFAULT_THEME if org hasn't loaded yet.
  const themeId = useOrganizationStore(
    (state) => state.themeId ?? DEFAULT_THEME,
  );

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  // Apply immediately on first render (before paint) to avoid flash
  // This runs synchronously during SSR or concurrent React hydration
  if (typeof document !== 'undefined') {
    applyTheme(themeId);
  }

  return null;
}

export default ThemeLoader;
EOF
  success "packages/ui/src/ThemeLoader.tsx"
fi

# =============================================================================
#  § 4  ThemePicker.tsx → packages/ui/src/ThemePicker.tsx
#       Admin UI component — allows selecting & previewing themes.
#       Uses only inline styles + the design system CSS classes so it
#       works in any consuming app without extra dependencies.
# =============================================================================
header "§ 4  ThemePicker component"

THEME_PICKER="$UI_SRC/ThemePicker.tsx"
if [[ -f "$THEME_PICKER" ]]; then
  skip "packages/ui/src/ThemePicker.tsx"
else
  cat > "$THEME_PICKER" << 'EOF'
/**
 * @file ThemePicker.tsx
 * @package @cannasaas/ui
 *
 * Admin settings component for selecting and previewing dispensary themes.
 *
 * USAGE in apps/admin/src/pages/Settings/BrandingPage.tsx:
 *
 *   import { ThemePicker } from '@cannasaas/ui';
 *
 *   <ThemePicker
 *     currentThemeId={organization.themeId}
 *     onSelect={(themeId) => patchOrganization({ themeId })}
 *     loading={isPending}
 *   />
 *
 * The component shows a live preview by temporarily setting data-theme
 * on hover, then reverts if the user doesn't confirm. On confirm it calls
 * onSelect — the parent is responsible for persisting to the API.
 */

import { useState, useCallback } from 'react';
import { AVAILABLE_THEMES, DEFAULT_THEME, type ThemeId } from './ThemeLoader';

/** Visual metadata for each theme shown in the picker */
const THEME_META: Record<ThemeId, {
  label: string;
  description: string;
  swatches: [string, string, string];
  dark: boolean;
}> = {
  earthy: {
    label: 'Earthy',
    description: 'Warm organic greens & parchment. The classic dispensary feel.',
    swatches: ['#2a6640', '#c47820', '#f5f0e4'],
    dark: false,
  },
  midnight: {
    label: 'Midnight',
    description: 'Dark luxury. Electric sage on near-black. Premium after-hours.',
    swatches: ['#4db870', '#d4a030', '#111e14'],
    dark: true,
  },
  citrus: {
    label: 'Citrus',
    description: 'Bright & energetic. Lime greens and punchy orange on white.',
    swatches: ['#5aaa20', '#e87820', '#f8faf4'],
    dark: false,
  },
  apothecary: {
    label: 'Apothecary',
    description: 'Clinical precision. Navy and slate on cool white. Medical credibility.',
    swatches: ['#2660b8', '#20a89a', '#f4f6fb'],
    dark: false,
  },
  neon: {
    label: 'Neon',
    description: 'Bold streetwear. Electric green & hot pink on black. Unapologetic.',
    swatches: ['#00ff78', '#ff2d78', '#0a0a0a'],
    dark: true,
  },
};

interface ThemePickerProps {
  /** Currently saved theme for this organization */
  currentThemeId?: string;
  /** Called when user confirms a theme selection */
  onSelect: (themeId: ThemeId) => void;
  /** Disable interaction while saving */
  loading?: boolean;
}

export function ThemePicker({
  currentThemeId = DEFAULT_THEME,
  onSelect,
  loading = false,
}: ThemePickerProps) {
  const [selected, setSelected] = useState<ThemeId>(
    AVAILABLE_THEMES.includes(currentThemeId as ThemeId)
      ? (currentThemeId as ThemeId)
      : DEFAULT_THEME,
  );
  const [previewing, setPreviewing] = useState<ThemeId | null>(null);
  const [saved, setSaved] = useState(false);

  // Live preview on hover: temporarily swap data-theme attribute
  const handleMouseEnter = useCallback((id: ThemeId) => {
    setPreviewing(id);
    document.documentElement.setAttribute('data-theme', id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPreviewing(null);
    // Revert to current confirmed selection
    document.documentElement.setAttribute('data-theme', selected);
  }, [selected]);

  const handleSelect = useCallback((id: ThemeId) => {
    setSelected(id);
    document.documentElement.setAttribute('data-theme', id);
  }, []);

  const handleSave = useCallback(() => {
    onSelect(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [selected, onSelect]);

  const isDirty = selected !== currentThemeId;

  return (
    <div className="gs-card gs-card--padded gs-stack--6">

      {/* Header */}
      <div className="gs-flex-between">
        <div>
          <h3 className="gs-title">Storefront Theme</h3>
          <p className="gs-body-sm gs-text-muted" style={{ marginTop: 4 }}>
            Applies to your customer storefront, staff portal, and kiosk.
          </p>
        </div>
        {previewing && (
          <span className="gs-badge gs-badge--amber">
            Previewing: {THEME_META[previewing].label}
          </span>
        )}
      </div>

      {/* Theme grid */}
      <div className="gs-grid gs-grid--auto-md" style={{ gap: 12 }}>
        {AVAILABLE_THEMES.map((id) => {
          const meta = THEME_META[id];
          const isSelected = selected === id;
          const isCurrent = currentThemeId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              onMouseEnter={() => handleMouseEnter(id)}
              onMouseLeave={handleMouseLeave}
              disabled={loading}
              aria-pressed={isSelected}
              aria-label={`Select ${meta.label} theme`}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 16,
                borderRadius: 16,
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected
                  ? 'var(--color-primary-xlight)'
                  : 'var(--color-surface)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 160ms ease',
                outline: 'none',
                boxShadow: isSelected ? 'var(--ring-green)' : 'var(--shadow-sm)',
              }}
            >
              {/* Swatch row */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {meta.swatches.map((color, i) => (
                  <span
                    key={i}
                    style={{
                      width: i === 0 ? 32 : 20,
                      height: i === 0 ? 32 : 20,
                      borderRadius: '50%',
                      background: color,
                      border: '2px solid rgba(0,0,0,.08)',
                      flexShrink: 0,
                    }}
                  />
                ))}
                {meta.dark && (
                  <span
                    className="gs-badge gs-badge--gray"
                    style={{ marginLeft: 'auto', fontSize: 10 }}
                  >
                    Dark
                  </span>
                )}
              </div>

              {/* Label + desc */}
              <div>
                <div style={{
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  {meta.label}
                  {isCurrent && (
                    <span className="gs-badge gs-badge--green">Active</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                  {meta.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="gs-flex-between" style={{ paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
        <span className="gs-body-sm gs-text-muted">
          {isDirty
            ? `Unsaved: switching to ${THEME_META[selected].label}`
            : 'No unsaved changes'}
        </span>
        <button
          type="button"
          className={`gs-btn gs-btn--primary${loading ? ' gs-btn--loading' : ''}`}
          onClick={handleSave}
          disabled={loading || !isDirty}
        >
          {loading ? 'Saving…' : saved ? '✓ Saved' : 'Apply Theme'}
        </button>
      </div>

    </div>
  );
}

export default ThemePicker;
EOF
  success "packages/ui/src/ThemePicker.tsx"
fi

# =============================================================================
#  § 5  PATCH organizationStore.ts — add themeId field
# =============================================================================
header "§ 5  Patch organizationStore"

ORG_STORE="$STORES_SRC/organizationStore.ts"

if [[ ! -f "$ORG_STORE" ]]; then
  warn "packages/stores/src/organizationStore.ts not found — skipping patch."
  warn "Add 'themeId: string | null' manually to OrganizationState."
else
  MARKER="// [THEME-SCAFFOLD] themeId added"
  if grep -q "$MARKER" "$ORG_STORE" 2>/dev/null; then
    skip "organizationStore.ts already patched"
  else
    cp "$ORG_STORE" "${ORG_STORE}.bak"
    info "Backed up → organizationStore.ts.bak"

    # Insert themeId into the OrganizationState interface.
    # Matches the line containing 'branding:' and appends after it.
    # Works for both BrandingConfig and branding?: null patterns.
    if grep -q "branding" "$ORG_STORE"; then
      sed -i.tmp "s|\(branding.*\)|\1\n  /** GreenStack CSS theme ID. Maps to theme.<id>.css ${MARKER} */\n  themeId: string \| null;|" "$ORG_STORE"
    else
      # Fallback: inject after the opening brace of the interface
      sed -i.tmp "s|interface OrganizationState {|interface OrganizationState {\n  /** GreenStack CSS theme ID. Maps to theme.<id>.css ${MARKER} */\n  themeId: string \| null;|" "$ORG_STORE"
    fi

    # Also patch initialState / reset object if present
    if grep -q "branding: null" "$ORG_STORE"; then
      sed -i.tmp "s|branding: null,|branding: null,\n  themeId: null, ${MARKER}|" "$ORG_STORE"
    fi

    # Add setTheme action if setBranding exists (mirrors the pattern)
    if grep -q "setBranding" "$ORG_STORE" && ! grep -q "setTheme" "$ORG_STORE"; then
      sed -i.tmp "s|setBranding: (branding) => {|setTheme: (themeId: string) => {\n        set((state) => { state.themeId = themeId; }); ${MARKER}\n      },\n\n      setBranding: (branding) => {|" "$ORG_STORE"
    fi

    rm -f "${ORG_STORE}.tmp"
    success "organizationStore.ts — themeId field + setTheme action added"
  fi
fi

# =============================================================================
#  § 6  PATCH organization types — add themeId to Organization interface
# =============================================================================
header "§ 6  Patch Organization type"

# Try to find the types file — could be organization.ts, types.ts, etc.
ORG_TYPES=""
for candidate in \
  "$TYPES_SRC/organization.types.ts" \
  "$TYPES_SRC/organization.ts" \
  "$TYPES_SRC/index.ts" \
  "$TYPES_SRC/types.ts"; do
  if [[ -f "$candidate" ]] && grep -q "Organization" "$candidate" 2>/dev/null; then
    ORG_TYPES="$candidate"
    break
  fi
done

TYPE_MARKER="// [THEME-SCAFFOLD] themeId"

if [[ -z "$ORG_TYPES" ]]; then
  # Create a minimal types file so TypeScript is happy
  cat > "$TYPES_SRC/theme.types.ts" << 'EOF'
/**
 * @file theme.types.ts
 * @package @cannasaas/types
 *
 * Theme-related TypeScript types for the GreenStack design system.
 * Auto-generated by scaffold-themes.sh
 */

/** Registered theme IDs — must match filenames in packages/ui/src/themes/ */
export type ThemeId =
  | 'earthy'
  | 'midnight'
  | 'citrus'
  | 'apothecary'
  | 'neon';

/** Theme metadata for the admin ThemePicker UI */
export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  /** [primary, accent, background] hex swatches */
  swatches: [string, string, string];
  dark: boolean;
}

/** Extension for Organization — add themeId to the existing interface */
export interface OrganizationThemeFields {
  /** Active GreenStack theme. Defaults to 'earthy'. */
  themeId: ThemeId | null;
}
EOF
  success "packages/types/src/theme.types.ts (new)"
  warn "Your Organization interface is in an unknown location."
  warn "Manually add: themeId?: ThemeId from '@cannasaas/types'"
else
  if grep -q "$TYPE_MARKER" "$ORG_TYPES" 2>/dev/null; then
    skip "$ORG_TYPES already patched"
  else
    cp "$ORG_TYPES" "${ORG_TYPES}.bak"
    # Inject after 'id:' line inside the Organization interface
    sed -i.tmp "s|\(  id: string;\)|\1\n  /** GreenStack CSS theme. Defaults to 'earthy'. ${TYPE_MARKER} */\n  themeId?: string \| null;|" "$ORG_TYPES"
    rm -f "${ORG_TYPES}.tmp"
    success "$(basename "$ORG_TYPES") — themeId field added"
  fi
fi

# =============================================================================
#  § 7  PATCH packages/ui/src/index.ts — export ThemeLoader + ThemePicker
# =============================================================================
header "§ 7  Update packages/ui/src/index.ts"

UI_INDEX="$UI_SRC/index.ts"
EXPORT_MARKER="// [THEME-SCAFFOLD] exports"

if [[ ! -f "$UI_INDEX" ]]; then
  cat > "$UI_INDEX" << EOF
/**
 * @file index.ts
 * @package @cannasaas/ui
 *
 * Public exports for the GreenStack UI package.
 * Auto-generated by scaffold-themes.sh
 */

// Design system CSS — import once in each app's main.tsx
export const DESIGN_SYSTEM_CSS = '@cannasaas/ui/src/greenstack-design-system.css';

// Theme system ${EXPORT_MARKER}
export { ThemeLoader, AVAILABLE_THEMES, DEFAULT_THEME } from './ThemeLoader';
export type { ThemeId } from './ThemeLoader';
export { ThemePicker } from './ThemePicker';
EOF
  success "packages/ui/src/index.ts (created)"
elif grep -q "$EXPORT_MARKER" "$UI_INDEX" 2>/dev/null; then
  skip "packages/ui/src/index.ts already has theme exports"
else
  cp "$UI_INDEX" "${UI_INDEX}.bak"
  cat >> "$UI_INDEX" << EOF

// Theme system ${EXPORT_MARKER}
export { ThemeLoader, AVAILABLE_THEMES, DEFAULT_THEME } from './ThemeLoader';
export type { ThemeId } from './ThemeLoader';
export { ThemePicker } from './ThemePicker';
EOF
  success "packages/ui/src/index.ts — theme exports appended"
fi

# =============================================================================
#  § 8  PATCH apps/*/src/main.tsx — add CSS import + <ThemeLoader />
# =============================================================================
header "§ 8  Patch app main.tsx files"

patch_main_tsx() {
  local app="$1"
  local main="$ROOT/apps/$app/src/main.tsx"
  local css_marker="// [THEME-SCAFFOLD] css-import"
  local loader_marker="// [THEME-SCAFFOLD] ThemeLoader"

  if [[ ! -f "$main" ]]; then
    warn "apps/$app/src/main.tsx not found — creating stub"
    cat > "$main" << EOF
/**
 * @file main.tsx
 * @app $app
 *
 * Application entry point.
 * Generated stub by scaffold-themes.sh
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@cannasaas/ui/src/greenstack-design-system.css'; ${css_marker}
import { ThemeLoader } from '@cannasaas/ui'; ${loader_marker}
import App from './App';

const root = document.getElementById('root')!;

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ThemeLoader />
    <App />
  </React.StrictMode>,
);
EOF
    success "apps/$app/src/main.tsx (stub created with theme wiring)"
    return
  fi

  local patched=false

  # Inject CSS import after last existing import if not already present
  if ! grep -q "$css_marker" "$main" 2>/dev/null; then
    cp "$main" "${main}.bak"
    # Prepend to file — add after the last @import or import statement block
    local tmpfile
    tmpfile=$(mktemp)
    awk -v marker="$css_marker" '
      /^import / { last_import=NR }
      { lines[NR]=$0 }
      END {
        for (i=1; i<=NR; i++) {
          print lines[i]
          if (i==last_import) {
            print "import '"'"'@cannasaas/ui/src/greenstack-design-system.css'"'"'; " marker
          }
        }
      }
    ' "$main" > "$tmpfile"
    mv "$tmpfile" "$main"
    patched=true
    success "apps/$app/src/main.tsx — CSS import added"
  else
    skip "apps/$app/src/main.tsx CSS import"
  fi

  # Inject ThemeLoader import + JSX if not already present
  if ! grep -q "$loader_marker" "$main" 2>/dev/null; then
    [[ "$patched" == false ]] && cp "$main" "${main}.bak"
    local tmpfile2
    tmpfile2=$(mktemp)
    awk -v marker="$loader_marker" '
      /^import / { last_import=NR }
      { lines[NR]=$0 }
      END {
        for (i=1; i<=NR; i++) {
          print lines[i]
          if (i==last_import) {
            print "import { ThemeLoader } from '"'"'@cannasaas/ui'"'"'; " marker
          }
        }
      }
    ' "$main" > "$tmpfile2"
    mv "$tmpfile2" "$main"

    # Inject <ThemeLoader /> before <App /> or after <React.StrictMode>
    sed -i.tmp "s|<App />|<ThemeLoader /> ${loader_marker}\n    <App />|" "$main"
    rm -f "${main}.tmp"
    success "apps/$app/src/main.tsx — ThemeLoader JSX added"
  else
    skip "apps/$app/src/main.tsx ThemeLoader"
  fi
}

for app in "${APPS[@]}"; do
  patch_main_tsx "$app"
done

# =============================================================================
#  § 9  PATCH apps/*/index.html — add data-portal attribute
# =============================================================================
header "§ 9  Patch index.html data-portal attributes"

patch_index_html() {
  local app="$1"
  local portal
  portal="$(portal_name "$app")"
  local html="$ROOT/apps/$app/index.html"
  local marker="data-portal="

  if [[ ! -f "$html" ]]; then
    warn "apps/$app/index.html not found — creating stub"
    cat > "$html" << EOF
<!DOCTYPE html>
<html lang="en" data-portal="${portal}" data-theme="earthy">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GreenStack — ${portal^}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
    success "apps/$app/index.html (stub created, data-portal=\"${portal}\")"
    return
  fi

  if grep -q "$marker" "$html" 2>/dev/null; then
    skip "apps/$app/index.html — data-portal already set"
  else
    cp "$html" "${html}.bak"
    # Inject data-portal and data-theme into the <html> tag
    sed -i.tmp "s|<html\([^>]*\)>|<html\1 data-portal=\"${portal}\" data-theme=\"earthy\">|" "$html"
    rm -f "${html}.tmp"
    success "apps/$app/index.html — data-portal=\"${portal}\" + data-theme=\"earthy\" added"
  fi
}

for app in "${APPS[@]}"; do
  patch_index_html "$app"
done

# =============================================================================
#  § 10  DATABASE MIGRATION — add theme_id to organizations table
# =============================================================================
header "§ 10  NestJS TypeORM migration"

# Generate a timestamp-prefixed migration filename
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="$MIGRATIONS/${TIMESTAMP}-AddThemeIdToOrganizations.ts"

# Check if a matching migration already exists (any timestamp)
EXISTING_MIGRATION=$(find "$MIGRATIONS" -name "*AddThemeIdToOrganizations.ts" 2>/dev/null | head -1)

if [[ -n "$EXISTING_MIGRATION" ]]; then
  skip "Migration already exists: $(basename "$EXISTING_MIGRATION")"
else
  cat > "$MIGRATION_FILE" << 'EOF'
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddThemeIdToOrganizations
 *
 * Adds `theme_id` column to the `organizations` table.
 * Maps to the GreenStack design system theme files:
 *   packages/ui/src/themes/theme.<id>.css
 *
 * Valid values: 'earthy' | 'midnight' | 'citrus' | 'apothecary' | 'neon'
 * Default: 'earthy'
 *
 * Generated by scaffold-themes.sh
 */
export class AddThemeIdToOrganizations implements MigrationInterface {
  name = 'AddThemeIdToOrganizations';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add theme_id with a default so existing rows are valid immediately
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "theme_id" VARCHAR(64)
      NOT NULL DEFAULT 'earthy'
    `);

    // Add a check constraint to prevent invalid theme IDs
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD CONSTRAINT "chk_organizations_theme_id"
      CHECK ("theme_id" IN ('earthy', 'midnight', 'citrus', 'apothecary', 'neon'))
    `);

    // Index for fast lookup when resolving tenant branding
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_organizations_theme_id"
      ON "organizations" ("theme_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_organizations_theme_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP CONSTRAINT IF EXISTS "chk_organizations_theme_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "theme_id"
    `);
  }
}
EOF
  success "Migration: ${TIMESTAMP}-AddThemeIdToOrganizations.ts"
fi

# =============================================================================
#  § 11  NestJS: patch organizations.entity.ts — add @Column themeId
# =============================================================================
header "§ 11  Patch Organization entity"

ENTITY_MARKER="// [THEME-SCAFFOLD] themeId column"

# Try to find the entity file
ORG_ENTITY=""
for candidate in \
  "$ROOT/cannasaas-api/src/modules/organizations/organization.entity.ts" \
  "$ROOT/cannasaas-api/src/organizations/organization.entity.ts" \
  "$ROOT/cannasaas-api/src/entities/organization.entity.ts"; do
  if [[ -f "$candidate" ]]; then
    ORG_ENTITY="$candidate"
    break
  fi
done

if [[ -z "$ORG_ENTITY" ]]; then
  warn "organization.entity.ts not found — skipping entity patch."
  warn "Manually add to your Organization @Entity():"
  warn "  @Column({ name: 'theme_id', default: 'earthy' })"
  warn "  themeId: string;"
else
  if grep -q "$ENTITY_MARKER" "$ORG_ENTITY" 2>/dev/null; then
    skip "organization.entity.ts already patched"
  else
    cp "$ORG_ENTITY" "${ORG_ENTITY}.bak"
    # Inject after the last @Column decorator block before class closing
    sed -i.tmp "s|\(}\s*$\)|  @Column({ name: 'theme_id', length: 64, default: 'earthy' }) ${ENTITY_MARKER}\n  themeId: string;\n\n\1|" "$ORG_ENTITY"
    rm -f "${ORG_ENTITY}.tmp"
    success "organization.entity.ts — themeId @Column added"
  fi
fi

# =============================================================================
#  § 12  Copy theme CSS files to each app's /public/themes/ directory
#        so the ThemeLoader <link> href="/themes/theme.<id>.css" resolves.
# =============================================================================
header "§ 12  Copy themes to app public/ directories"

for app in "${APPS[@]}"; do
  PUBLIC_THEMES="$ROOT/apps/$app/public/themes"
  mkdir -p "$PUBLIC_THEMES"

  for theme_file in "$UI_THEMES"/*.css; do
    dest="$PUBLIC_THEMES/$(basename "$theme_file")"
    if [[ -f "$dest" ]]; then
      skip "apps/$app/public/themes/$(basename "$theme_file")"
    else
      cp "$theme_file" "$dest"
      success "apps/$app/public/themes/$(basename "$theme_file")"
    fi
  done
done

# =============================================================================
#  § 13  Update packages/ui/package.json — ensure style export field
# =============================================================================
header "§ 13  Check packages/ui/package.json"

UI_PKG="$ROOT/packages/ui/package.json"

if [[ ! -f "$UI_PKG" ]]; then
  cat > "$UI_PKG" << 'EOF'
{
  "name": "@cannasaas/ui",
  "version": "1.0.0",
  "description": "GreenStack shared UI components and design system",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./src/greenstack-design-system.css": "./src/greenstack-design-system.css",
    "./src/themes/*": "./src/themes/*"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
EOF
  success "packages/ui/package.json (created)"
else
  # Check if CSS export is already present
  if grep -q "greenstack-design-system.css" "$UI_PKG" 2>/dev/null; then
    skip "packages/ui/package.json — CSS export already present"
  else
    warn "packages/ui/package.json exists but may be missing CSS exports."
    warn "Manually ensure the 'exports' field includes:"
    warn '  "./src/greenstack-design-system.css": "./src/greenstack-design-system.css"'
    warn '  "./src/themes/*": "./src/themes/*"'
  fi
fi

# =============================================================================
#  DONE — Summary
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║   ✓  Theme scaffold complete!                                ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Files created / patched:${RESET}"
echo -e "  ${CYAN}packages/ui/src/${RESET}"
echo    "    greenstack-design-system.css"
echo    "    ThemeLoader.tsx"
echo    "    ThemePicker.tsx"
echo    "    index.ts"
echo -e "  ${CYAN}packages/ui/src/themes/${RESET}"
echo    "    theme.earthy.css  theme.midnight.css  theme.citrus.css"
echo    "    theme.apothecary.css  theme.neon.css"
echo -e "  ${CYAN}packages/stores/src/${RESET}"
echo    "    organizationStore.ts  (patched: + themeId + setTheme)"
echo -e "  ${CYAN}packages/types/src/${RESET}"
echo    "    theme.types.ts  (or patched existing Organization type)"
echo -e "  ${CYAN}apps/*/src/main.tsx${RESET}  (patched: CSS import + ThemeLoader)"
echo -e "  ${CYAN}apps/*/index.html${RESET}     (patched: data-portal + data-theme attrs)"
echo -e "  ${CYAN}apps/*/public/themes/${RESET} (theme CSS files copied)"
echo -e "  ${CYAN}cannasaas-api/src/migrations/${RESET}"
echo    "    ${TIMESTAMP}-AddThemeIdToOrganizations.ts"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo -e "  ${YELLOW}1.${RESET} pnpm install"
echo -e "  ${YELLOW}2.${RESET} pnpm -r type-check"
echo -e "  ${YELLOW}3.${RESET} Run migration: pnpm --filter @cannasaas/api migration:run"
echo -e "  ${YELLOW}4.${RESET} Add ThemePicker to apps/admin/src/pages/Settings/"
echo -e "  ${YELLOW}5.${RESET} Wire PATCH /organizations/:id to accept { themeId }"
echo -e "  ${YELLOW}6.${RESET} If CSS file was a placeholder, replace packages/ui/src/greenstack-design-system.css"
echo ""
echo -e "  ${BOLD}How to activate a theme:${RESET}"
echo -e "  ${CYAN}Admin selects theme → PATCH /organizations/:id → organizationStore.setTheme(id)"
echo -e "  → ThemeLoader fires → data-theme attr swaps → CSS cascade applies instantly${RESET}"
echo ""
echo -e "  ${BOLD}.bak files${RESET} were created for any patched source files. Review diffs:"
echo    "  find $ROOT -name '*.bak' | head -20"
echo ""
