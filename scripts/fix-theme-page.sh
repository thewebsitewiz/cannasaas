#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
# Patch ThemePage.tsx — fix setPreset calls + ThemeColors import
# ═══════════════════════════════════════════════════════════════════
#
# Usage:
#   cd ~/Documents/Projects/cannasaas
#   chmod +x fix-theme-page.sh
#   ./fix-theme-page.sh
#
# ═══════════════════════════════════════════════════════════════════

FILE="apps/admin/src/pages/Settings/ThemePage.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ $FILE not found. Run from the monorepo root."
  exit 1
fi

echo "📦 Backing up $FILE..."
cp "$FILE" "${FILE}.bak"

echo "🔧 Patching ThemePage.tsx..."

# ─── 1. Fix the import: add ThemeColors from @cannasaas/stores ───
# Change: import { useThemeStore } from '@cannasaas/stores';
# To:     import { useThemeStore, type ThemeColors } from '@cannasaas/stores';
sed -i '' "s|import { useThemeStore } from '@cannasaas/stores';|import { useThemeStore, type ThemeColors } from '@cannasaas/stores';|" "$FILE"
echo "  ✓ Added ThemeColors import from @cannasaas/stores"

# ─── 2. Remove the separate ThemeColors import from @cannasaas/ui if present ───
# The script generated:  import { ..., type ThemeColors, ... } from '@cannasaas/ui';
# We need to remove ThemeColors from that import since it now comes from stores.
# Replace the ui import line to remove ThemeColors
sed -i '' "s|type ThemeColors,||g" "$FILE"
# Also handle if it was at the end: , type ThemeColors
sed -i '' "s|, type ThemeColors||g" "$FILE"
echo "  ✓ Removed ThemeColors from @cannasaas/ui import"

# ─── 3. Fix preset button click: setPreset(p.id) → setPreset(p.id, p as unknown as ThemeColors) ───
sed -i '' "s|setPreset(p.id)|setPreset(p.id, p as unknown as ThemeColors)|g" "$FILE"
echo "  ✓ Fixed preset button onClick"

# ─── 4. Fix reset button: setPreset('casual') → setPreset('casual', THEME_PRESETS['casual'] as unknown as ThemeColors) ───
sed -i '' "s|setPreset('casual');|setPreset('casual', THEME_PRESETS['casual'] as unknown as ThemeColors);|g" "$FILE"
echo "  ✓ Fixed reset button onClick"

echo ""
echo "✅ Done! Restart the dev server:"
echo "   pnpm --filter '@cannasaas/admin' dev"
