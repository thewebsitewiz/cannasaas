#!/bin/zsh
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/usr/sbin:/sbin:$PATH"
cd ~/Documents/Projects/cannasaas || exit 1

set -e

echo "=== Pre-flight checks ==="
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is not clean. Commit or stash first."
  git status --short
  exit 1
fi
echo "✅ Working tree clean"

echo ""
echo "=== Removing orphaned theme files ==="

# Admin - duplicates of what lives in packages/ui
git rm -r apps/admin/public/themes/

# Staff - duplicates of what lives in packages/ui
git rm -r apps/staff/public/themes/

# Storefront - orphan copies (public/ copies stay — they're live)
git rm apps/storefront/src/app/all-themes.css
git rm -r apps/storefront/src/styles/

echo ""
echo "=== Removing .bak files ==="
find apps packages -name "*.bak" -not -path '*/node_modules/*' -exec git rm {} \;

echo ""
echo "=== Summary ==="
git status --short | head -60
echo ""
echo "Total files staged for deletion: $(git status --short | grep -c '^D')"
echo ""
echo "To commit:"
echo "  git commit -m 'chore: remove orphaned theme files and .bak backups'"
echo ""
echo "To abort:"
echo "  git restore --staged . && git checkout ."
