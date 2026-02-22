#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase C Storefront: MASTER SCAFFOLD RUNNER
# File: scaffold-storefront.sh
#
# Usage:
#   ./scaffold-storefront.sh [project-root]
#
# Defaults to the current working directory if no root is given.
#
# This script runs all four Phase C storefront scaffold parts in order:
#
#   Part 1 — Layout system, router, shared UI, hooks (18 files)
#     main.tsx, App.tsx, routes.tsx
#     layouts/StorefrontLayout.tsx
#     components/layout/*  (Header, Footer, SearchBar, CartButton, etc.)
#     components/ui/*      (AgeGate, Pagination, SkeletonCard)
#     hooks/*              (useDebounce, useIntersectionObserver, etc.)
#
#   Part 2 — Home + Products pages (22 files)
#     components/product/* (ProductCard, ProductBadge, ProductCarousel)
#     components/home/*    (HeroBanner, CategoryGrid, FeaturedSection, etc.)
#     components/products/* (FilterSidebar, FilterChips, SortDropdown, etc.)
#     pages/Home.tsx
#     pages/Products.tsx
#     types/storefront.ts
#
#   Part 3 — ProductDetail + Cart pages (10 files)
#     components/product-detail/* (Gallery, VariantSelector, Cannabinoids, etc.)
#     components/cart/*     (CartLineItem, CartSummary, CartEmpty, PromoCode)
#     pages/ProductDetail.tsx
#     pages/Cart.tsx
#
#   Part 4 — Checkout + Account + Auth pages (18 files)
#     components/checkout/* (StepIndicator, FulfillmentStep, PaymentStep, etc.)
#     components/account/*  (AccountNav, ProfileForm, OrderHistoryList, etc.)
#     pages/Checkout.tsx
#     pages/Account.tsx
#     pages/OrderConfirmation.tsx
#     pages/Login.tsx
#     pages/Register.tsx
#     pages/NotFound.tsx
#
# =============================================================================
# Full file tree generated (58 files across apps/storefront/src/):
#
#   apps/storefront/src/
#   ├── main.tsx
#   ├── App.tsx
#   ├── routes.tsx
#   ├── types/
#   │   └── storefront.ts
#   ├── layouts/
#   │   └── StorefrontLayout.tsx
#   ├── hooks/
#   │   ├── useDebounce.ts
#   │   ├── useIntersectionObserver.ts
#   │   ├── useLocalStorage.ts
#   │   └── usePurchaseLimitCheck.ts
#   ├── components/
#   │   ├── layout/
#   │   │   ├── Header.tsx
#   │   │   ├── HeaderLogo.tsx
#   │   │   ├── NavMenu.tsx
#   │   │   ├── CartButton.tsx
#   │   │   ├── UserMenu.tsx
#   │   │   ├── SearchBar.tsx
#   │   │   └── Footer.tsx
#   │   ├── ui/
#   │   │   ├── AgeGate.tsx
#   │   │   ├── Pagination.tsx
#   │   │   └── SkeletonCard.tsx
#   │   ├── product/
#   │   │   ├── ProductBadge.tsx
#   │   │   ├── ProductCard.tsx
#   │   │   └── ProductCarousel.tsx
#   │   ├── home/
#   │   │   ├── HeroBanner.tsx
#   │   │   ├── CategoryGrid.tsx
#   │   │   ├── FeaturedSection.tsx
#   │   │   └── TrendingSection.tsx
#   │   ├── products/
#   │   │   ├── FilterSidebar.tsx
#   │   │   ├── FilterChips.tsx
#   │   │   ├── SortDropdown.tsx
#   │   │   ├── ProductGrid.tsx
#   │   │   └── MobileFilterDrawer.tsx
#   │   ├── product-detail/
#   │   │   ├── ProductImageGallery.tsx
#   │   │   ├── VariantSelector.tsx
#   │   │   ├── CannabinoidProfile.tsx
#   │   │   ├── EffectsFlavorTags.tsx
#   │   │   ├── ProductReviews.tsx
#   │   │   └── RecommendedProducts.tsx
#   │   ├── cart/
#   │   │   ├── CartLineItem.tsx
#   │   │   ├── CartSummary.tsx
#   │   │   ├── CartEmpty.tsx
#   │   │   └── PromoCodeInput.tsx
#   │   ├── checkout/
#   │   │   ├── StepIndicator.tsx
#   │   │   ├── FulfillmentStep.tsx
#   │   │   ├── PaymentStep.tsx
#   │   │   └── OrderReviewStep.tsx
#   │   └── account/
#   │       ├── AccountNav.tsx
#   │       ├── ProfileForm.tsx
#   │       ├── OrderHistoryList.tsx
#   │       └── LoyaltyDashboard.tsx
#   └── pages/
#       ├── Home.tsx
#       ├── Products.tsx
#       ├── ProductDetail.tsx
#       ├── Cart.tsx
#       ├── Checkout.tsx
#       ├── Account.tsx
#       ├── OrderConfirmation.tsx
#       ├── Login.tsx
#       ├── Register.tsx
#       └── NotFound.tsx
#
# =============================================================================
# WCAG 2.1 AA Compliance Overview
# =============================================================================
# Every file follows these accessibility patterns:
#
#   1.1.1  Non-text Content      — All <img> have meaningful alt text;
#                                   decorative images use alt="" aria-hidden
#   1.3.1  Info & Relationships  — Semantic HTML5 (header, nav, main, footer,
#                                   article, section, aside, fieldset, legend)
#   1.3.5  Input Purpose         — autoComplete attributes on all form inputs
#   1.4.1  Use of Color          — Colour never used as the ONLY indicator;
#                                   always paired with text or icons
#   1.4.3  Contrast              — Text ≥ 4.5:1 against backgrounds
#   1.4.4  Resize Text           — rem/em units; no fixed px text sizes
#   2.1.1  Keyboard              — All features operable without a mouse
#   2.1.2  No Keyboard Trap      — Modals (AgeGate, mobile nav): Escape closes;
#                                   focus returns to trigger on close
#   2.3.3  Animation from Motion — prefers-reduced-motion respected on all
#                                   animations (skeleton pulse, transitions)
#   2.4.1  Bypass Blocks         — Skip-to-content link on StorefrontLayout
#   2.4.2  Page Titled           — Every page sets document.title on mount
#   2.4.3  Focus Order           — Tab order follows visual/logical flow
#   2.4.6  Headings & Labels     — Descriptive <h1>–<h3> hierarchy per page
#   2.4.8  Location              — Breadcrumb on ProductDetail (WCAG 2.4.8)
#   2.5.5  Target Size           — All interactive targets ≥ 44×44px
#   3.1.2  Language of Parts     — lang="en" on <html> (set in index.html)
#   3.2.2  On Input              — No surprise navigations on focus/input
#   4.1.2  Name, Role, Value     — aria-expanded, aria-pressed, aria-current,
#                                   aria-disabled, aria-selected on controls
#   4.1.3  Status Messages       — aria-live regions for cart count, errors,
#                                   success states, loading indicators
#
# =============================================================================
# Design System
# =============================================================================
#   Theme:     CSS custom properties from organizationStore.resolvedBranding
#   Variables: --primary, --secondary, --accent (HSL format)
#   Defaults:  forest green (#2D6A4F), sage (#52B788), mint (#B7E4C7)
#   Fonts:     Playfair Display (headings) + DM Sans (body)
#   Tailwind:  Utility-first; hsl(var(--primary)) for brand colours
#   Aesthetic: Premium cannabis wellness — organic, sophisticated, not "stoner"
#
# =============================================================================
# Data Layer
# =============================================================================
#   State:     Zustand (client) + TanStack Query v5 (server)
#   Stores:    authStore, cartStore, organizationStore
#   Hooks:     useProducts, useProduct, useCart, useAddToCart,
#              useCreateOrder, useLogin, useRegister, useProductReviews,
#              useProductCategories, useApplyPromo, useRemovePromo,
#              usePurchaseLimit, useOrders, useOrder, useUpdateCartItem,
#              useRemoveCartItem
#   API:       Axios client from @cannasaas/api-client
#              Base URL: https://api.cannasaas.com/v1
#              Auth: JWT Bearer in Authorization header
#              Tenant: X-Organization-Id + X-Dispensary-Id headers
#
# =============================================================================
# Prerequisites
# =============================================================================
#   - Node.js ≥ 18
#   - pnpm workspace (monorepo root has pnpm-workspace.yaml)
#   - The following packages already scaffolded:
#       @cannasaas/types         (scaffold-types.sh)
#       @cannasaas/api-client    (scaffold-api-client.sh)
#       @cannasaas/stores        (scaffold-stores.sh)
#   - Tailwind configured in apps/storefront/tailwind.config.js
#   - Dependencies installed: react-router-dom, @tanstack/react-query,
#     react-hook-form, @hookform/resolvers, zod, @stripe/react-stripe-js
#
# =============================================================================

set -euo pipefail

# ── Resolve project root ──────────────────────────────────────────────────────
ROOT="${1:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colour output helpers ─────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Colour

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║   CannaSaas — Phase C: Customer Storefront (Complete)       ║${NC}"
  echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${CYAN}Project root:${NC} $ROOT"
  echo -e "  ${CYAN}Target:${NC}       $ROOT/apps/storefront/src/"
  echo ""
}

print_part() {
  local n="$1" label="$2"
  echo ""
  echo -e "  ${BOLD}${YELLOW}▶ Part $n: $label${NC}"
}

print_done() {
  local n="$1" count="$2"
  echo -e "    ${GREEN}✅ Part $n complete — $count files written${NC}"
}

print_footer() {
  local total="$1"
  echo ""
  echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${GREEN}║   Phase C Storefront scaffold complete!                     ║${NC}"
  echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${CYAN}Total files written:${NC} $total"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo ""
  echo -e "    1. Install storefront dependencies:"
  echo -e "       ${CYAN}cd apps/storefront && pnpm install${NC}"
  echo ""
  echo -e "    2. Add missing deps to apps/storefront/package.json:"
  echo -e "       ${CYAN}react-hook-form @hookform/resolvers zod${NC}"
  echo -e "       ${CYAN}@stripe/react-stripe-js @stripe/stripe-js${NC}"
  echo ""
  echo -e "    3. Set environment variables in apps/storefront/.env.local:"
  echo -e "       ${CYAN}VITE_API_URL=https://api.cannasaas.com/v1${NC}"
  echo -e "       ${CYAN}VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...${NC}"
  echo ""
  echo -e "    4. Start the storefront dev server:"
  echo -e "       ${CYAN}pnpm dev --filter=storefront${NC}"
  echo ""
  echo -e "    5. Phase D (Admin Portal) and Phase E (Staff Portal) are next."
  echo ""
}

# ── Main execution ─────────────────────────────────────────────────────────────

print_header

SF="$ROOT/apps/storefront/src"

# Verify part scripts exist
for i in 1 2 3 4; do
  PART="$SCRIPT_DIR/scaffold-storefront-part${i}.sh"
  if [[ ! -f "$PART" ]]; then
    echo -e "  ${BOLD}\033[0;31mERROR:${NC} Missing script: $PART"
    echo "  All four part scripts must be in the same directory as this runner."
    exit 1
  fi
done

# ── Part 1: Layout system, router, shared UI, hooks ──────────────────────────
print_part 1 "Layout system · Router · Shared UI · Hooks"
bash "$SCRIPT_DIR/scaffold-storefront-part1.sh" "$ROOT"
P1_COUNT=$(find "$SF/layouts" "$SF/hooks" "$SF/components/layout" "$SF/components/ui" \
           "$SF/main.tsx" "$SF/App.tsx" "$SF/routes.tsx" \
           -type f 2>/dev/null | wc -l | tr -d ' ')
print_done 1 "$P1_COUNT"

# ── Part 2: Home + Products pages ─────────────────────────────────────────────
print_part 2 "Home Page · Products Page · Product components"
bash "$SCRIPT_DIR/scaffold-storefront-part2.sh" "$ROOT"
P2_COUNT=$(find "$SF/components/product" "$SF/components/home" "$SF/components/products" \
           "$SF/types" "$SF/pages/Home.tsx" "$SF/pages/Products.tsx" \
           -type f 2>/dev/null | wc -l | tr -d ' ')
print_done 2 "$P2_COUNT"

# ── Part 3: ProductDetail + Cart pages ────────────────────────────────────────
print_part 3 "ProductDetail Page · Cart Page · Detail components"
bash "$SCRIPT_DIR/scaffold-storefront-part3.sh" "$ROOT"
P3_COUNT=$(find "$SF/components/product-detail" "$SF/components/cart" \
           "$SF/pages/ProductDetail.tsx" "$SF/pages/Cart.tsx" \
           -type f 2>/dev/null | wc -l | tr -d ' ')
print_done 3 "$P3_COUNT"

# ── Part 4: Checkout + Account + Auth pages ───────────────────────────────────
print_part 4 "Checkout · Account · Auth pages"
bash "$SCRIPT_DIR/scaffold-storefront-part4.sh" "$ROOT"
P4_COUNT=$(find "$SF/components/checkout" "$SF/components/account" \
           "$SF/pages/Checkout.tsx" "$SF/pages/Account.tsx" \
           "$SF/pages/OrderConfirmation.tsx" "$SF/pages/Login.tsx" \
           "$SF/pages/Register.tsx" "$SF/pages/NotFound.tsx" \
           -type f 2>/dev/null | wc -l | tr -d ' ')
print_done 4 "$P4_COUNT"

# ── Final summary tree ─────────────────────────────────────────────────────────
TOTAL=$(find "$SF" -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo -e "  ${BOLD}Generated file tree:${NC}"
echo ""
find "$SF" \( -name "*.tsx" -o -name "*.ts" \) | sort | sed "s|$ROOT/||" | \
  awk '
  {
    # Split path into parts
    n = split($0, parts, "/")
    indent = ""
    for (i = 1; i < n-1; i++) indent = indent "│   "
    if (n > 1) printf "  %s├── %s\n", indent, parts[n]
    else printf "  %s\n", $0
  }'
echo ""

print_footer "$TOTAL"
