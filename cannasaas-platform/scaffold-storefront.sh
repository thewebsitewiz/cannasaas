#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# CannaSaas Storefront — Frontend Scaffolding Script
# ═══════════════════════════════════════════════════════════════════════════
#
# Generates the complete directory structure and barrel exports for the
# storefront React app (apps/storefront/src/).
#
# This script is IDEMPOTENT:
#   - Creates directories only if they don't exist (mkdir -p)
#   - Barrel index.ts files are ALWAYS overwritten to stay in sync
#   - Component/hook files are created as STUBS only if they don't exist
#     (won't overwrite your populated files from the zips)
#
# Usage:
#   cd /path/to/cannasaas
#   chmod +x scaffold-storefront.sh
#   ./scaffold-storefront.sh
#
# After running:
#   1. Unzip storefront.zip into apps/storefront/src/ (Home page)
#   2. Unzip products.zip into apps/storefront/src/ (Products page)
#   3. The populated files replace the stubs; barrel exports are already correct.
#
# ═══════════════════════════════════════════════════════════════════════════
#
# COMPLETE FILE TREE (37 files):
#
# apps/storefront/src/
# ├── pages/
# │   ├── Home.tsx                              ← Orchestrator: hero, categories, featured, trending, new arrivals
# │   └── Products.tsx                          ← Orchestrator: search, filters, grid, pagination
# │
# ├── hooks/
# │   ├── index.ts                              ← BARREL: consolidated exports for all hooks
# │   ├── useReducedMotion.ts                   ← OS prefers-reduced-motion detection
# │   ├── useMediaQuery.ts                      ← Generic CSS media query hook
# │   ├── useIntersectionObserver.ts            ← Viewport detection (fire-once pattern)
# │   ├── useAutoplay.ts                        ← Timer with pause/hover/focus/a11y
# │   ├── useDebounce.ts                        ← Generic value debouncer (search input)
# │   └── useProductFilters.ts                  ← URL ↔ filter state bridge (useSearchParams)
# │
# ├── components/
# │   ├── layout/
# │   │   ├── index.ts                          ← BARREL: Section, SectionErrorBoundary
# │   │   ├── Section.tsx                       ← Compound component: Section + Header + Content
# │   │   └── SectionErrorBoundary.tsx          ← Per-section error isolation (class component)
# │   │
# │   ├── home/
# │   │   ├── index.ts                          ← BARREL: all home page components
# │   │   ├── HeroBanner.tsx                    ← Auto-rotating promotions carousel (WCAG 2.2.2)
# │   │   ├── HeroBannerSkeleton.tsx            ← Loading placeholder
# │   │   ├── CategoryGrid.tsx                  ← Memoized category nav tiles
# │   │   ├── ProductCarousel.tsx               ← Render prop horizontal scroll
# │   │   ├── ProductCarouselSkeleton.tsx       ← Loading placeholder
# │   │   ├── TrendingSection.tsx               ← Lazy-loaded via IntersectionObserver
# │   │   └── cards/
# │   │       ├── index.ts                      ← BARREL: card variants
# │   │       ├── FeaturedProductCard.tsx        ← Staff Pick badge + potency
# │   │       ├── TrendingProductCard.tsx        ← Rank number badge
# │   │       └── NewArrivalCard.tsx             ← "NEW" badge
# │   │
# │   └── products/
# │       ├── index.ts                          ← BARREL: all product page components
# │       ├── SearchInput.tsx                   ← Debounced search (500ms) with clear
# │       ├── FilterAccordionItem.tsx           ← Native <details>/<summary> accordion
# │       ├── CategoryFilter.tsx                ← Radio-style single-select
# │       ├── RangeSlider.tsx                   ← Dual-thumb native range inputs
# │       ├── StrainTypeFilter.tsx              ← Multi-select checkbox group
# │       ├── ActiveFilters.tsx                 ← Removable filter chip bar
# │       ├── FilterSidebar.tsx                 ← Composes all filter controls
# │       ├── MobileFilterDrawer.tsx            ← Native <dialog> slide-in panel
# │       ├── SortDropdown.tsx                  ← Native <select> for sort order
# │       ├── ProductCard.tsx                   ← Grid card with hover Add to Cart
# │       ├── ProductGrid.tsx                   ← 2-col mobile / 3-col desktop
# │       ├── ProductGridSkeleton.tsx           ← 6-card shimmer loading
# │       └── Pagination.tsx                    ← Smart ellipsis: 1 … 4 [5] 6 … 10
# │
# └── (other dirs not managed by this script: styles/, types/, utils/, etc.)
#
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────

ROOT="apps/storefront/src"

# Verify we're in the monorepo root
if [ ! -d "apps" ] && [ ! -d "packages" ]; then
  echo "⚠️  Run this script from the CannaSaas monorepo root."
  echo "   Expected to find apps/ and packages/ directories."
  echo ""
  echo "   Usage: cd /path/to/cannasaas && ./scaffold-storefront.sh"
  exit 1
fi

echo "🏗️  Scaffolding storefront at: ${ROOT}/"
echo ""

# ── Create Directories ────────────────────────────────────────────────────

echo "📁 Creating directories..."

dirs=(
  "${ROOT}/pages"
  "${ROOT}/hooks"
  "${ROOT}/components/layout"
  "${ROOT}/components/home/cards"
  "${ROOT}/components/products"
)

for dir in "${dirs[@]}"; do
  mkdir -p "$dir"
  echo "   ✓ $dir/"
done

echo ""

# ── Helper: create stub file only if it doesn't already exist ─────────────

stub() {
  local filepath="$1"
  local description="$2"

  if [ ! -f "$filepath" ]; then
    cat > "$filepath" << STUB
/**
 * ${description}
 *
 * TODO: Replace this stub with the populated version from the zip.
 * This file was auto-generated by scaffold-storefront.sh
 */

export {};
STUB
    echo "   📝 Created stub: $filepath"
  else
    echo "   ✅ Exists:       $filepath"
  fi
}

# ── Barrel Exports (always overwritten to stay in sync) ───────────────────

echo "📦 Writing barrel exports (index.ts files)..."

# hooks/index.ts — CONSOLIDATED (Home + Products hooks)
cat > "${ROOT}/hooks/index.ts" << 'EOF'
/**
 * Barrel export for all custom hooks.
 *
 * Home page hooks:
 *   useReducedMotion      — OS prefers-reduced-motion detection
 *   useMediaQuery         — Generic CSS media query hook
 *   useIntersectionObserver — Viewport detection (fire-once)
 *   useAutoplay           — Timer with pause/hover/focus/a11y
 *
 * Products page hooks:
 *   useDebounce           — Generic value debouncer (500ms search)
 *   useProductFilters     — URL ↔ filter state via useSearchParams
 */
export { useReducedMotion } from './useReducedMotion';
export { useMediaQuery } from './useMediaQuery';
export { useIntersectionObserver } from './useIntersectionObserver';
export { useAutoplay } from './useAutoplay';
export { useDebounce } from './useDebounce';
export { useProductFilters } from './useProductFilters';
export type { ProductFilters, FilterActions, SortOption } from './useProductFilters';
EOF
echo "   ✓ ${ROOT}/hooks/index.ts"

# components/layout/index.ts
cat > "${ROOT}/components/layout/index.ts" << 'EOF'
export { Section } from './Section';
export { SectionErrorBoundary } from './SectionErrorBoundary';
EOF
echo "   ✓ ${ROOT}/components/layout/index.ts"

# components/home/cards/index.ts
cat > "${ROOT}/components/home/cards/index.ts" << 'EOF'
export { FeaturedProductCard } from './FeaturedProductCard';
export { TrendingProductCard } from './TrendingProductCard';
export { NewArrivalCard } from './NewArrivalCard';
EOF
echo "   ✓ ${ROOT}/components/home/cards/index.ts"

# components/home/index.ts
cat > "${ROOT}/components/home/index.ts" << 'EOF'
export { HeroBanner } from './HeroBanner';
export { HeroBannerSkeleton } from './HeroBannerSkeleton';
export { CategoryGrid } from './CategoryGrid';
export { ProductCarousel } from './ProductCarousel';
export { ProductCarouselSkeleton } from './ProductCarouselSkeleton';
export { TrendingSection } from './TrendingSection';
export { FeaturedProductCard, TrendingProductCard, NewArrivalCard } from './cards';
EOF
echo "   ✓ ${ROOT}/components/home/index.ts"

# components/products/index.ts
cat > "${ROOT}/components/products/index.ts" << 'EOF'
export { SearchInput } from './SearchInput';
export { FilterAccordionItem } from './FilterAccordionItem';
export { CategoryFilter } from './CategoryFilter';
export { RangeSlider } from './RangeSlider';
export { StrainTypeFilter } from './StrainTypeFilter';
export { ActiveFilters } from './ActiveFilters';
export { FilterSidebar } from './FilterSidebar';
export { MobileFilterDrawer } from './MobileFilterDrawer';
export { SortDropdown } from './SortDropdown';
export { ProductCard } from './ProductCard';
export { ProductGrid } from './ProductGrid';
export { ProductGridSkeleton } from './ProductGridSkeleton';
export { Pagination } from './Pagination';
EOF
echo "   ✓ ${ROOT}/components/products/index.ts"

echo ""

# ── Stub Files (only created if they don't exist) ────────────────────────

echo "📄 Creating stub files (skipping existing)..."

# Pages
stub "${ROOT}/pages/Home.tsx"              "Home Page — Hero, categories, featured, trending, new arrivals"
stub "${ROOT}/pages/Products.tsx"          "Products Page — Search, filters, grid, pagination"

# Hooks
stub "${ROOT}/hooks/useReducedMotion.ts"        "useReducedMotion — OS prefers-reduced-motion detection"
stub "${ROOT}/hooks/useMediaQuery.ts"            "useMediaQuery — Generic CSS media query hook"
stub "${ROOT}/hooks/useIntersectionObserver.ts"  "useIntersectionObserver — Viewport detection (fire-once)"
stub "${ROOT}/hooks/useAutoplay.ts"              "useAutoplay — Auto-advance timer with WCAG 2.2.2 compliance"
stub "${ROOT}/hooks/useDebounce.ts"              "useDebounce — Generic value debouncer for search input"
stub "${ROOT}/hooks/useProductFilters.ts"        "useProductFilters — URL-driven filter state via useSearchParams"

# Layout components
stub "${ROOT}/components/layout/Section.tsx"              "Section — Compound component (Section + Header + Content)"
stub "${ROOT}/components/layout/SectionErrorBoundary.tsx" "SectionErrorBoundary — Per-section error isolation"

# Home components
stub "${ROOT}/components/home/HeroBanner.tsx"             "HeroBanner — Auto-rotating promotions carousel"
stub "${ROOT}/components/home/HeroBannerSkeleton.tsx"     "HeroBannerSkeleton — Loading placeholder"
stub "${ROOT}/components/home/CategoryGrid.tsx"           "CategoryGrid — Memoized category navigation tiles"
stub "${ROOT}/components/home/ProductCarousel.tsx"        "ProductCarousel — Render prop horizontal scroll"
stub "${ROOT}/components/home/ProductCarouselSkeleton.tsx" "ProductCarouselSkeleton — Loading placeholder"
stub "${ROOT}/components/home/TrendingSection.tsx"        "TrendingSection — Lazy-loaded via IntersectionObserver"

# Home card variants
stub "${ROOT}/components/home/cards/FeaturedProductCard.tsx" "FeaturedProductCard — Staff Pick badge + potency"
stub "${ROOT}/components/home/cards/TrendingProductCard.tsx" "TrendingProductCard — Rank number badge"
stub "${ROOT}/components/home/cards/NewArrivalCard.tsx"      "NewArrivalCard — Green NEW badge"

# Products components
stub "${ROOT}/components/products/SearchInput.tsx"           "SearchInput — Debounced search (500ms) with clear button"
stub "${ROOT}/components/products/FilterAccordionItem.tsx"   "FilterAccordionItem — Native <details>/<summary> accordion"
stub "${ROOT}/components/products/CategoryFilter.tsx"        "CategoryFilter — Radio-style single-select categories"
stub "${ROOT}/components/products/RangeSlider.tsx"           "RangeSlider — Dual-thumb native range inputs (price, THC)"
stub "${ROOT}/components/products/StrainTypeFilter.tsx"      "StrainTypeFilter — Multi-select checkbox group"
stub "${ROOT}/components/products/ActiveFilters.tsx"         "ActiveFilters — Removable filter chip bar"
stub "${ROOT}/components/products/FilterSidebar.tsx"         "FilterSidebar — Composes all filter controls"
stub "${ROOT}/components/products/MobileFilterDrawer.tsx"    "MobileFilterDrawer — Native <dialog> slide-in panel"
stub "${ROOT}/components/products/SortDropdown.tsx"          "SortDropdown — Native <select> for sort order"
stub "${ROOT}/components/products/ProductCard.tsx"           "ProductCard — Grid card with hover Add to Cart"
stub "${ROOT}/components/products/ProductGrid.tsx"           "ProductGrid — 2-col mobile / 3-col desktop responsive grid"
stub "${ROOT}/components/products/ProductGridSkeleton.tsx"   "ProductGridSkeleton — 6-card shimmer loading placeholder"
stub "${ROOT}/components/products/Pagination.tsx"            "Pagination — Smart ellipsis: 1 … 4 [5] 6 … 10"

echo ""

# ── Summary ───────────────────────────────────────────────────────────────

total_files=$(find "${ROOT}/pages" "${ROOT}/hooks" "${ROOT}/components" -type f | wc -l)
total_dirs=$(find "${ROOT}/pages" "${ROOT}/hooks" "${ROOT}/components" -type d | wc -l)

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Scaffolding complete!"
echo ""
echo "   ${total_dirs} directories"
echo "   ${total_files} files"
echo ""
echo "Next steps:"
echo "   1. Unzip storefront.zip into ${ROOT}/ (Home page files)"
echo "   2. Unzip products.zip into ${ROOT}/ (Products page files)"
echo "   3. The populated .tsx files replace the stubs."
echo "      Barrel exports (index.ts) are already correct."
echo ""
echo "   The zips will NOT overwrite index.ts files because they"
echo "   are already generated by this script with the consolidated"
echo "   exports."
echo "═══════════════════════════════════════════════════════════════"
