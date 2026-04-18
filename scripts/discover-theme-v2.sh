#!/bin/zsh
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/usr/sbin:/sbin:$PATH"
cd ~/Documents/Projects/cannasaas

echo "################ 1. ALL THEME-RELATED FILES ################"
find apps packages -type f \( -name "*theme*" -o -name "*template*" -o -name "*branding*" -o -name "*appearance*" \) 2>/dev/null | grep -v node_modules | grep -v dist | sort

echo ""
echo "################ 2. MENTIONS IN TS/TSX FILES ################"
grep -rln --include="*.ts" --include="*.tsx" \
  -e "theme_configs" -e "ThemeProvider" -e "data-theme" -e "template_id" -e "customPrimary" -e "custom_primary" \
  apps packages 2>/dev/null | grep -v node_modules | sort

echo ""
echo "################ 3. BACKEND THEME ENTITY ################"
find apps/api/src -type f \( -iname "*theme*.ts" -o -iname "*template*.ts" \) | grep -v node_modules | sort

echo ""
echo "################ 4. THEME MIGRATION FILES ################"
find apps/api/src/migrations -type f \( -iname "*theme*" -o -iname "*template*" -o -iname "*branding*" \) 2>/dev/null | sort

echo ""
echo "################ 5. ADMIN THEME/TEMPLATE PAGES ################"
find apps/admin/src -type f \( -iname "*Theme*" -o -iname "*Template*" -o -iname "*Branding*" -o -iname "*Appearance*" \) | grep -v node_modules | sort

echo ""
echo "################ 6. STOREFRONT THEME PROVIDER ################"
find apps/storefront -type f -iname "*heme*" | grep -v node_modules | grep -v public | sort

echo ""
echo "################ 7. GRAPHQL SCHEMA — THEME TYPES ################"
for f in apps/api/schema.gql apps/api/src/schema.gql apps/api/src/schema.graphql; do
  if [ -f "$f" ]; then
    echo "=== $f ==="
    grep -B1 -A 20 -iE "type Theme|type Template|input Theme|input Template|input Branding|input Appearance" "$f" 2>/dev/null
  fi
done

echo ""
echo "################ 8. all-themes.css HEAD (50 lines) ################"
head -50 apps/storefront/public/all-themes.css 2>/dev/null

echo ""
echo "################ 9. all-themes.css CSS VARIABLES ################"
grep -hoE "^\s*--[a-zA-Z0-9-]+" apps/storefront/public/all-themes.css 2>/dev/null | sort -u

echo ""
echo "################ 10. SAMPLE THEME OVERRIDE FILE ################"
head -80 apps/storefront/public/themes/theme.dark.css 2>/dev/null

echo ""
echo "################ DONE ################"
