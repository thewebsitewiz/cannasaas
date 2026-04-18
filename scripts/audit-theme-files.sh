#!/bin/zsh
# ============================================================================
# audit-theme-files.sh
# ----------------------------------------------------------------------------
# Determines which of the ~5 theme file locations are actually referenced at
# runtime and which are orphaned (safe to delete).
#
# Locations checked:
#   1. apps/admin/public/themes/          (static-served by Vite)
#   2. apps/staff/public/themes/          (static-served by Vite)
#   3. apps/storefront/public/themes/     (static-served by Next.js)
#   4. apps/storefront/public/all-themes.css
#   5. apps/storefront/src/app/all-themes.css   (imported via bundler?)
#   6. apps/storefront/src/styles/        (imported via bundler?)
#   7. packages/ui/src/themes/            (imported by any app?)
#   8. packages/ui/src/theme-vars.css
#
# Strategy: for each location, search the codebase for any reference to it
# (import statement, <link href>, fetch(), string literal path). If nothing
# references it, it's likely orphaned.
# ============================================================================

export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/usr/sbin:/sbin:$PATH"
cd ~/Documents/Projects/cannasaas || exit 1

divider() {
  echo ""
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

check_refs() {
  # $1 = human description
  # $2 = search pattern (regex-lite; fed to grep -E)
  # $3 = exclude-dir patterns already handled by --exclude-dir defaults
  local label="$1"
  local pattern="$2"
  echo ""
  echo "---- $label ----"
  echo "  search pattern: $pattern"
  local results
  results=$(grep -rnE "$pattern" \
    --include="*.ts" --include="*.tsx" \
    --include="*.js"  --include="*.jsx" \
    --include="*.css" --include="*.scss" \
    --include="*.html" \
    --include="*.json" \
    --include="next.config.*" --include="vite.config.*" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
    --exclude-dir=.turbo --exclude-dir=build --exclude-dir=coverage \
    apps packages 2>/dev/null)
  if [ -z "$results" ]; then
    echo "  ❌ NO REFERENCES FOUND — candidate for deletion"
  else
    echo "  ✅ referenced in:"
    echo "$results" | sed 's/^/     /'
  fi
}

divider "1. THEME FILE LOCATIONS ON DISK"
echo ""
echo "admin themes:      $(find apps/admin/public/themes -name 'theme.*.css' 2>/dev/null | wc -l | tr -d ' ') files"
echo "staff themes:      $(find apps/staff/public/themes -name 'theme.*.css' 2>/dev/null | wc -l | tr -d ' ') files"
echo "storefront public: $(find apps/storefront/public/themes -name 'theme.*.css' 2>/dev/null | wc -l | tr -d ' ') files"
echo "storefront src:    $(find apps/storefront/src/styles -name 'theme.*.css' 2>/dev/null | wc -l | tr -d ' ') files"
echo "packages/ui:       $(find packages/ui/src/themes -name 'theme.*.css' 2>/dev/null | wc -l | tr -d ' ') files"
echo ""
echo "all-themes.css locations:"
find apps packages -name "all-themes.css" -not -path '*/node_modules/*' 2>/dev/null | sed 's/^/  /'

divider "2. WHO LOADS WHAT — RUNTIME REFERENCES"

# --- admin/public/themes
check_refs "A. apps/admin/public/themes/theme.*.css" \
  "/themes/theme\.|public/themes/theme\."

# --- staff/public/themes  (same pattern as admin — look at which app references it)
check_refs "B. apps/staff/public/themes/ (same string pattern as admin — check which files live under apps/staff or apps/admin)" \
  "/themes/theme\."

# --- storefront/public/themes
# Already covered by above if the string literal is the same, but let's be explicit
check_refs "C. String literal '/themes/' (any app using public-served themes via <link>)" \
  "[\"'\\\`]/themes/theme\\."

# --- storefront/public/all-themes.css
check_refs "D. public/all-themes.css (Next.js public dir)" \
  "[\"'\\\`]/all-themes\\.css"

# --- storefront/src/app/all-themes.css  (imported via bundler)
check_refs "E. src/app/all-themes.css (bundler import)" \
  "src/app/all-themes|\\./all-themes|\\.\\./app/all-themes"

# --- storefront/src/styles/theme.*.css  (bundler import)
check_refs "F. src/styles/theme.*.css (bundler import)" \
  "src/styles/theme\\.|\\./styles/theme\\.|\\.\\./styles/theme\\.|styles/theme\\."

# --- packages/ui/src/themes/
check_refs "G. packages/ui/src/themes/ (package import)" \
  "@cannasaas/ui/themes|packages/ui/src/themes|ui/src/themes"

# --- packages/ui/src/theme-vars.css
check_refs "H. packages/ui/src/theme-vars.css" \
  "theme-vars\\.css"

divider "3. BACKUP FILES IN TREE (orphans)"
find apps packages -name "*.bak" -o -name "*.orig" -o -name "*.old" 2>/dev/null | grep -v node_modules

divider "4. THEME INJECTION CODE"
echo ""
echo "---- packages/ui/src/themes/inject.ts (first 40 lines) ----"
head -40 packages/ui/src/themes/inject.ts 2>/dev/null

echo ""
echo "---- storefront/src/components/ThemeProvider.tsx (first 60 lines) ----"
head -60 apps/storefront/src/components/ThemeProvider.tsx 2>/dev/null

echo ""
echo "---- storefront/src/components/ThemeLoader.tsx (first 60 lines) ----"
head -60 apps/storefront/src/components/ThemeLoader.tsx 2>/dev/null

echo ""
echo "---- storefront/src/app/layout.tsx (theme-relevant lines) ----"
grep -n -E "theme|Theme|all-themes|data-theme" apps/storefront/src/app/layout.tsx 2>/dev/null

divider "5. IS all-themes.css IMPORTED OR <link>-INJECTED?"
echo ""
echo "If it's bundled (imported), only src/app/all-themes.css matters."
echo "If it's <link>-injected at runtime, only public/all-themes.css matters."
echo ""
echo "---- Next.js globals.css / layout.tsx imports ----"
for f in apps/storefront/src/app/globals.css apps/storefront/src/app/layout.tsx apps/storefront/src/styles/globals.css; do
  if [ -f "$f" ]; then
    echo "  $f:"
    grep -nE "import.*css|@import|all-themes|theme" "$f" 2>/dev/null | head -20 | sed 's/^/    /'
  fi
done

divider "DONE"
echo ""
echo "Interpretation guide:"
echo "  - Locations marked ❌ NO REFERENCES are safe-to-delete candidates."
echo "  - Locations with ✅ references are live — check which app/layer references them."
echo "  - If two locations both have refs, confirm they serve different apps"
echo "    (admin vs storefront) rather than being redundant copies."
