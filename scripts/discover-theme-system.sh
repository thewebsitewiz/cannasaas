#!/bin/zsh
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/usr/sbin:/sbin:$PATH"
# ~/Documents/Projects/cannasaas/scripts/discover-theme-system.sh
# Run: cs && ./scripts/discover-theme-system.sh > /tmp/theme-discovery.txt

set -e
cd ~/Documents/Projects/cannasaas

dump() {
  local path="$1"
  if [[ -f "$path" ]]; then
    echo ""
    echo "===== FILE: $path ====="
    echo "----- ($(wc -l < "$path") lines) -----"
    cat "$path"
    echo "===== END: $path ====="
  else
    echo ""
    echo "!!!!! MISSING: $path !!!!!"
  fi
}

section() {
  echo ""
  echo "###############################################"
  echo "# $1"
  echo "###############################################"
}

section "1. THEME / TEMPLATE FILE INVENTORY"
echo "--- All theme-related CSS files ---"
find apps packages -type f \( -name "*theme*.css" -o -name "*template*.css" -o -name "all-themes.css" \) 2>/dev/null | grep -v node_modules | sort

echo ""
echo "--- Files mentioning theme_configs, ThemeProvider, data-theme ---"
grep -rln --include="*.ts" --include="*.tsx" --include="*.css" \
  -e "theme_configs" -e "ThemeProvider" -e "data-theme" -e "template_id" -e "custom_primary" \
  apps packages 2>/dev/null | grep -v node_modules | sort

section "2. BACKEND: ENTITY + MIGRATIONS"
find apps/api/src -type f -iname "*theme*" -o -iname "*template*" 2>/dev/null | grep -v node_modules | while read f; do dump "$f"; done
find apps/api/src/migrations -type f -iname "*theme*" -o -iname "*template*" 2>/dev/null | while read f; do dump "$f"; done

section "3. BACKEND: GRAPHQL RESOLVER + SERVICE + DTOs"
find apps/api/src -type d \( -iname "*theme*" -o -iname "*template*" \) 2>/dev/null | while read d; do
  find "$d" -type f \( -name "*.ts" \) | while read f; do dump "$f"; done
done

section "4. STOREFRONT: THEME PROVIDER + INJECTION"
find apps/storefront -type f \( -name "*Theme*.tsx" -o -name "*Theme*.ts" -o -name "*theme*.ts" -o -name "*theme*.tsx" \) 2>/dev/null | grep -v node_modules | while read f; do dump "$f"; done

section "5. ADMIN: TEMPLATE GALLERY + BRAND CUSTOMIZER PAGES"
find apps/admin/src -type f \( -iname "*Theme*" -o -iname "*Template*" -o -iname "*Branding*" -o -iname "*Appearance*" \) 2>/dev/null | grep -v node_modules | while read f; do dump "$f"; done

section "6. TEMPLATE PRESET SAMPLE (spring-bloom if it exists)"
find . -name "spring-bloom.css" -not -path "*/node_modules/*" 2>/dev/null | while read f; do dump "$f"; done

section "7. all-themes.css — HEAD + TAIL ONLY (too big to dump fully)"
ALL_THEMES=$(find . -name "all-themes.css" -not -path "*/node_modules/*" 2>/dev/null | head -1)
if [[ -n "$ALL_THEMES" ]]; then
  echo "File: $ALL_THEMES ($(wc -l < "$ALL_THEMES") lines)"
  echo "--- First 150 lines ---"
  head -150 "$ALL_THEMES"
  echo "--- Last 80 lines ---"
  tail -80 "$ALL_THEMES"
  echo ""
  echo "--- All CSS custom property names declared ---"
  grep -oE "^\s*--[a-zA-Z0-9-]+" "$ALL_THEMES" | sort -u
fi

section "8. STOREFRONT ROOT LAYOUT (where link tag gets injected)"
for candidate in apps/storefront/app/layout.tsx apps/storefront/src/app/layout.tsx apps/storefront/pages/_app.tsx apps/storefront/src/pages/_app.tsx; do
  dump "$candidate"
done

section "9. GRAPHQL SCHEMA EXCERPTS"
find apps/api -name "schema.gql" -o -name "schema.graphql" 2>/dev/null | while read f; do
  echo "File: $f"
  grep -A 15 -iE "type.*theme|type.*template|input.*theme|input.*brand" "$f" 2>/dev/null || true
done

section "DONE"
