#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase F API Integration Layer Setup Script
# =============================================================================
#
# PURPOSE
# -------
# Creates the complete directory structure and writes every Phase F file
# into the cannabis-platform monorepo. Run this from the monorepo root.
#
# WHAT THIS SCRIPT DOES
# ----------------------
# 1. Validates that it is being run from the monorepo root (checks for
#    pnpm-workspace.yaml or package.json).
# 2. Creates all necessary directories under packages/api-client/src/.
# 3. Copies every generated file from this build directory into its
#    correct location in the monorepo.
# 4. Writes a package.json for packages/api-client if one doesn't exist.
# 5. Prints a summary of all created files.
# 6. Prints next-step instructions for wiring the package into each app.
#
# USAGE
# -----
#   From the monorepo root (cannabis-platform/):
#   bash setup-phase-f.sh
#
#   Or from anywhere, pointing at the monorepo root:
#   bash setup-phase-f.sh /path/to/cannabis-platform
#
# DIRECTORY STRUCTURE CREATED
# ----------------------------
#
#   packages/
#   └── api-client/
#       ├── package.json
#       └── src/
#           ├── index.js            ← barrel export (all hooks + utilities)
#           ├── types/
#           │   └── api.types.js    ← JSDoc type definitions
#           ├── lib/
#           │   ├── apiClient.js    ← Axios instance + JWT interceptor
#           │   └── queryClient.js  ← TanStack Query client + queryKeys factory
#           ├── providers/
#           │   ├── QueryProvider.jsx
#           │   ├── AuthProvider.jsx
#           │   └── index.js
#           ├── hooks/
#           │   ├── index.js        ← barrel export
#           │   ├── useDebounce.js
#           │   ├── auth/
#           │   │   ├── useLogin.js
#           │   │   └── useCurrentUser.js
#           │   ├── products/
#           │   │   ├── useProducts.js
#           │   │   ├── useProduct.js
#           │   │   └── useCreateProduct.js
#           │   ├── cart/
#           │   │   ├── useCart.js
#           │   │   ├── useAddToCart.js
#           │   │   ├── useRemoveCartItem.js
#           │   │   ├── useUpdateCartItem.js
#           │   │   └── useApplyPromo.js
#           │   ├── orders/
#           │   │   ├── useOrders.js
#           │   │   └── useCreateOrder.js
#           │   ├── analytics/
#           │   │   └── useAnalytics.js
#           │   └── reviews/
#           │       └── useProductReviews.js
#           └── components/
#               ├── boundaries/
#               │   ├── QueryBoundary.jsx
#               │   ├── ErrorFallback.jsx
#               │   └── LoadingFallback.jsx
#               ├── feedback/
#               │   ├── MutationStatus.jsx
#               │   └── OptimisticIndicator.jsx
#               └── index.js
#
#   apps/
#   ├── storefront/src/pages/
#   │   ├── ProductsPage.jsx
#   │   ├── ProductDetailPage.jsx
#   │   ├── LoginPage.jsx
#   │   └── storefront/
#   │       ├── ProductsPage.jsx       (same as above but in subdirectory)
#   │       └── ProductDetailPage.jsx
#   ├── admin/src/pages/
#   │   ├── AdminDashboardPage.jsx
#   │   └── AdminProductsPage.jsx
#   └── staff/src/pages/
#       └── IntegrationStatusPage.jsx
#
# =============================================================================
set -euo pipefail

# ─── Color output helpers ─────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${BLUE}ℹ${RESET}  $*"; }
success() { echo -e "${GREEN}✓${RESET}  $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "${RED}✗${RESET}  $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${RESET}\n"; }

# ─── Locate monorepo root ─────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="${1:-$SCRIPT_DIR}"

# Accept explicit path as first argument
if [[ -n "${1:-}" && -d "$1" ]]; then
  MONOREPO_ROOT="$(cd "$1" && pwd)"
fi

# Validate monorepo root
if [[ ! -f "$MONOREPO_ROOT/pnpm-workspace.yaml" && ! -f "$MONOREPO_ROOT/package.json" ]]; then
  error "Could not find monorepo root at: $MONOREPO_ROOT"
  error "Please run this script from the cannabis-platform/ root, or pass the path as the first argument."
  error "Example: bash setup-phase-f.sh /path/to/cannabis-platform"
  exit 1
fi

info "Monorepo root: ${BOLD}$MONOREPO_ROOT${RESET}"

# Build directory where generated files live (same dir as this script)
BUILD_DIR="$SCRIPT_DIR"

# ─── Destination paths ────────────────────────────────────────────────────────

PKG_ROOT="$MONOREPO_ROOT/packages/api-client"
PKG_SRC="$PKG_ROOT/src"

APP_STOREFRONT="$MONOREPO_ROOT/apps/storefront/src"
APP_ADMIN="$MONOREPO_ROOT/apps/admin/src"
APP_STAFF="$MONOREPO_ROOT/apps/staff/src"

# ─── File counter ─────────────────────────────────────────────────────────────

FILES_CREATED=0
FILES_SKIPPED=0

# ─── Helper: create directory ─────────────────────────────────────────────────

make_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    mkdir -p "$dir"
    info "Created directory: ${dir#$MONOREPO_ROOT/}"
  fi
}

# ─── Helper: copy a file ──────────────────────────────────────────────────────

# Usage: copy_file <source_path> <dest_path> [--overwrite]
copy_file() {
  local src="$1"
  local dest="$2"
  local overwrite="${3:-}"

  if [[ ! -f "$src" ]]; then
    warn "Source not found, skipping: ${src#$BUILD_DIR/}"
    ((FILES_SKIPPED++)) || true
    return
  fi

  make_dir "$(dirname "$dest")"

  if [[ -f "$dest" && "$overwrite" != "--overwrite" ]]; then
    warn "Already exists (skipping): ${dest#$MONOREPO_ROOT/}"
    ((FILES_SKIPPED++)) || true
    return
  fi

  cp "$src" "$dest"
  success "Wrote: ${dest#$MONOREPO_ROOT/}"
  ((FILES_CREATED++)) || true
}

# ─── Helper: write inline content to a file ───────────────────────────────────

write_file() {
  local dest="$1"
  local content="$2"
  local overwrite="${3:-}"

  make_dir "$(dirname "$dest")"

  if [[ -f "$dest" && "$overwrite" != "--overwrite" ]]; then
    warn "Already exists (skipping): ${dest#$MONOREPO_ROOT/}"
    ((FILES_SKIPPED++)) || true
    return
  fi

  echo "$content" > "$dest"
  success "Wrote: ${dest#$MONOREPO_ROOT/}"
  ((FILES_CREATED++)) || true
}

# =============================================================================
# PHASE 1: packages/api-client structure
# =============================================================================

header "Phase 1: packages/api-client"

# ── package.json ──────────────────────────────────────────────────────────────
write_file "$PKG_ROOT/package.json" '{
  "name": "@cannasaas/api-client",
  "version": "0.0.1",
  "description": "Axios HTTP client, TanStack Query hooks, and React providers for CannaSaas",
  "main": "src/index.js",
  "types": "src/index.d.ts",
  "exports": {
    ".": "./src/index.js",
    "./hooks": "./src/hooks/index.js",
    "./providers": "./src/providers/index.js",
    "./components": "./src/components/index.js",
    "./lib/apiClient": "./src/lib/apiClient.js",
    "./lib/queryClient": "./src/lib/queryClient.js"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.0.0"
  }
}'

# ── types/ ────────────────────────────────────────────────────────────────────
copy_file "$BUILD_DIR/types/api.types.js"                      "$PKG_SRC/types/api.types.js"

# ── lib/ ─────────────────────────────────────────────────────────────────────
copy_file "$BUILD_DIR/lib/apiClient.js"                        "$PKG_SRC/lib/apiClient.js"
copy_file "$BUILD_DIR/lib/queryClient.js"                      "$PKG_SRC/lib/queryClient.js"

# ── providers/ ────────────────────────────────────────────────────────────────
copy_file "$BUILD_DIR/providers/QueryProvider.jsx"             "$PKG_SRC/providers/QueryProvider.jsx"
copy_file "$BUILD_DIR/providers/AuthProvider.jsx"              "$PKG_SRC/providers/AuthProvider.jsx"
copy_file "$BUILD_DIR/providers/index.js"                      "$PKG_SRC/providers/index.js"

# ── hooks/ ────────────────────────────────────────────────────────────────────
copy_file "$BUILD_DIR/hooks/index.js"                          "$PKG_SRC/hooks/index.js"
copy_file "$BUILD_DIR/hooks/useDebounce.js"                    "$PKG_SRC/hooks/useDebounce.js"

# auth
copy_file "$BUILD_DIR/hooks/auth/useLogin.js"                  "$PKG_SRC/hooks/auth/useLogin.js"
copy_file "$BUILD_DIR/hooks/auth/useCurrentUser.js"            "$PKG_SRC/hooks/auth/useCurrentUser.js"

# products
copy_file "$BUILD_DIR/hooks/products/useProducts.js"           "$PKG_SRC/hooks/products/useProducts.js"
copy_file "$BUILD_DIR/hooks/products/useProduct.js"            "$PKG_SRC/hooks/products/useProduct.js"
copy_file "$BUILD_DIR/hooks/products/useCreateProduct.js"      "$PKG_SRC/hooks/products/useCreateProduct.js"

# cart
copy_file "$BUILD_DIR/hooks/cart/useCart.js"                   "$PKG_SRC/hooks/cart/useCart.js"
copy_file "$BUILD_DIR/hooks/cart/useAddToCart.js"              "$PKG_SRC/hooks/cart/useAddToCart.js"
copy_file "$BUILD_DIR/hooks/cart/useRemoveCartItem.js"         "$PKG_SRC/hooks/cart/useRemoveCartItem.js"
copy_file "$BUILD_DIR/hooks/cart/useUpdateCartItem.js"         "$PKG_SRC/hooks/cart/useUpdateCartItem.js"
copy_file "$BUILD_DIR/hooks/cart/useApplyPromo.js"             "$PKG_SRC/hooks/cart/useApplyPromo.js"

# orders
copy_file "$BUILD_DIR/hooks/orders/useOrders.js"               "$PKG_SRC/hooks/orders/useOrders.js"
copy_file "$BUILD_DIR/hooks/orders/useCreateOrder.js"          "$PKG_SRC/hooks/orders/useCreateOrder.js"

# analytics
copy_file "$BUILD_DIR/hooks/analytics/useAnalytics.js"         "$PKG_SRC/hooks/analytics/useAnalytics.js"

# reviews
copy_file "$BUILD_DIR/hooks/reviews/useProductReviews.js"      "$PKG_SRC/hooks/reviews/useProductReviews.js"

# ── components/ ───────────────────────────────────────────────────────────────
copy_file "$BUILD_DIR/components/boundaries/QueryBoundary.jsx"  "$PKG_SRC/components/boundaries/QueryBoundary.jsx"
copy_file "$BUILD_DIR/components/boundaries/ErrorFallback.jsx"  "$PKG_SRC/components/boundaries/ErrorFallback.jsx"
copy_file "$BUILD_DIR/components/boundaries/LoadingFallback.jsx" "$PKG_SRC/components/boundaries/LoadingFallback.jsx"
copy_file "$BUILD_DIR/components/feedback/MutationStatus.jsx"   "$PKG_SRC/components/feedback/MutationStatus.jsx"
copy_file "$BUILD_DIR/components/feedback/OptimisticIndicator.jsx" "$PKG_SRC/components/feedback/OptimisticIndicator.jsx"
copy_file "$BUILD_DIR/components/index.js"                      "$PKG_SRC/components/index.js"

# ── barrel index ──────────────────────────────────────────────────────────────
write_file "$PKG_SRC/index.js" '/**
 * @file packages/api-client/src/index.js
 * @description Main barrel export for @cannasaas/api-client.
 * Apps import from this entry point.
 *
 * @example
 *   import { useProducts, QueryProvider, AuthProvider } from "@cannasaas/api-client";
 */

// Providers
export { QueryProvider }                 from "./providers/QueryProvider";
export { AuthProvider, useAuth }         from "./providers/AuthProvider";

// React Query client + key factory
export { queryClient, queryKeys, invalidateQueries, prefetchQuery } from "./lib/queryClient";

// Axios API client
export { apiClient, setAuthContext, clearAuthContext, isAuthenticated, hasRole, STORAGE_KEYS } from "./lib/apiClient";

// All hooks
export * from "./hooks/index";

// Boundary + feedback components
export { QueryBoundary }                 from "./components/boundaries/QueryBoundary";
export { ErrorFallback }                 from "./components/boundaries/ErrorFallback";
export { LoadingFallback }               from "./components/boundaries/LoadingFallback";
export { MutationStatusToaster }         from "./components/feedback/MutationStatus";
export { OptimisticIndicator, OptimisticOverlay } from "./components/feedback/OptimisticIndicator";
'

# =============================================================================
# PHASE 2: apps/storefront pages
# =============================================================================

header "Phase 2: apps/storefront pages"

make_dir "$APP_STOREFRONT/pages"
make_dir "$APP_STOREFRONT/pages/storefront"

copy_file "$BUILD_DIR/pages/LoginPage.jsx"                       "$APP_STOREFRONT/pages/LoginPage.jsx"
copy_file "$BUILD_DIR/pages/storefront/ProductsPage.jsx"         "$APP_STOREFRONT/pages/storefront/ProductsPage.jsx"
copy_file "$BUILD_DIR/pages/storefront/ProductDetailPage.jsx"    "$APP_STOREFRONT/pages/storefront/ProductDetailPage.jsx"

# =============================================================================
# PHASE 3: apps/admin pages
# =============================================================================

header "Phase 3: apps/admin pages"

make_dir "$APP_ADMIN/pages/admin"

copy_file "$BUILD_DIR/pages/admin/AdminDashboardPage.jsx"        "$APP_ADMIN/pages/admin/AdminDashboardPage.jsx"
copy_file "$BUILD_DIR/pages/admin/AdminProductsPage.jsx"         "$APP_ADMIN/pages/admin/AdminProductsPage.jsx"

# =============================================================================
# PHASE 4: apps/staff developer pages
# =============================================================================

header "Phase 4: apps/staff developer pages"

make_dir "$APP_STAFF/pages"

copy_file "$BUILD_DIR/pages/IntegrationStatusPage.jsx"           "$APP_STAFF/pages/IntegrationStatusPage.jsx"

# =============================================================================
# PHASE 5: Wire the package into each app
# =============================================================================

header "Phase 5: Checking app package.json wiring"

for APP_DIR in storefront admin staff; do
  APP_PKG="$MONOREPO_ROOT/apps/$APP_DIR/package.json"

  if [[ ! -f "$APP_PKG" ]]; then
    warn "apps/$APP_DIR/package.json not found — skipping dependency check"
    continue
  fi

  if grep -q "@cannasaas/api-client" "$APP_PKG" 2>/dev/null; then
    success "apps/$APP_DIR: @cannasaas/api-client already in dependencies"
  else
    warn "apps/$APP_DIR: @cannasaas/api-client NOT in dependencies"
    echo -e "     ${YELLOW}Run: pnpm add @cannasaas/api-client@workspace:* --filter @cannasaas/$APP_DIR${RESET}"
  fi
done

# =============================================================================
# PHASE 6: Write App root wiring snippets
# =============================================================================

header "Phase 6: Writing app root wiring snippets"

# main.jsx snippet for each app — written as .snippet files so they
# don't overwrite existing main.jsx if the app is already partially set up.

write_file "$MONOREPO_ROOT/apps/storefront/QUERY_WIRING.snippet.jsx" '/**
 * PASTE THIS into apps/storefront/src/main.jsx
 * or wrap your existing <App /> in these providers.
 *
 * Order matters:
 *   QueryProvider (outermost — AuthProvider uses React Query)
 *   └─ AuthProvider (reads/writes auth cache)
 *      └─ BrowserRouter
 *         └─ App
 *            └─ MutationStatusToaster (at app root, outside routes)
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryProvider,
  AuthProvider,
  MutationStatusToaster,
} from "@cannasaas/api-client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          {/* Toast notifications for all mutations — renders at DOM root */}
          <MutationStatusToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
'

write_file "$MONOREPO_ROOT/apps/admin/QUERY_WIRING.snippet.jsx" '/**
 * PASTE THIS into apps/admin/src/main.jsx
 * Same provider stack as storefront.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider, AuthProvider, MutationStatusToaster } from "@cannasaas/api-client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <MutationStatusToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
'

write_file "$MONOREPO_ROOT/apps/staff/QUERY_WIRING.snippet.jsx" '/**
 * PASTE THIS into apps/staff/src/main.jsx
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider, AuthProvider, MutationStatusToaster } from "@cannasaas/api-client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <MutationStatusToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
'

write_file "$MONOREPO_ROOT/apps/storefront/ROUTES.snippet.jsx" '/**
 * PASTE THESE ROUTES into apps/storefront/src/App.jsx
 *
 * Uses React.lazy for code splitting — each page is a separate chunk.
 * The QueryBoundary around each lazy route handles:
 *   - Suspense loading state (skeleton UI)
 *   - Error boundary (retry button)
 */
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryBoundary, LoadingFallback } from "@cannasaas/api-client";

const LoginPage         = lazy(() => import("./pages/LoginPage"));
const ProductsPage      = lazy(() => import("./pages/storefront/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/storefront/ProductDetailPage"));
// const CartPage       = lazy(() => import("./pages/storefront/CartPage"));
// const CheckoutPage   = lazy(() => import("./pages/storefront/CheckoutPage"));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <QueryBoundary loadingFallback={<LoadingFallback label="Loading login page" />}>
          <LoginPage />
        </QueryBoundary>
      } />
      <Route path="/products" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="card" label="Loading products" />}>
          <ProductsPage />
        </QueryBoundary>
      } />
      <Route path="/products/:slug" element={
        <QueryBoundary loadingFallback={<LoadingFallback label="Loading product details" />}>
          <ProductDetailPage />
        </QueryBoundary>
      } />
      <Route path="/" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
'

write_file "$MONOREPO_ROOT/apps/admin/ROUTES.snippet.jsx" '/**
 * PASTE THESE ROUTES into apps/admin/src/App.jsx
 */
import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryBoundary, LoadingFallback } from "@cannasaas/api-client";

const LoginPage           = lazy(() => import("./pages/LoginPage"));
const AdminDashboardPage  = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage   = lazy(() => import("./pages/admin/AdminProductsPage"));

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<QueryBoundary><LoginPage /></QueryBoundary>} />
      <Route path="/admin" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="table" label="Loading dashboard" />}>
          <AdminDashboardPage />
        </QueryBoundary>
      } />
      <Route path="/admin/products" element={
        <QueryBoundary loadingFallback={<LoadingFallback variant="table" label="Loading products" />}>
          <AdminProductsPage />
        </QueryBoundary>
      } />
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
'

# =============================================================================
# PHASE 7: Environment variable templates
# =============================================================================

header "Phase 7: Environment variable templates"

write_file "$MONOREPO_ROOT/.env.example" '# CannaSaas — Environment Variables
# Copy this file to .env.local and fill in the values.
# .env.local is in .gitignore — never commit real credentials.

# ── API ────────────────────────────────────────────────────────────────────
# Base URL for the NestJS API (architecture.md §6 Data Flow)
VITE_API_BASE_URL=https://api.cannasaas.com/v1

# WebSocket URL for real-time delivery updates (Sprint 10)
VITE_WS_URL=wss://api.cannasaas.com

# ── Tenant defaults (overridden at runtime for white-label) ────────────────
# These are used during development when subdomain resolution is not available.
VITE_DEFAULT_ORG_ID=
VITE_DEFAULT_DISPENSARY_ID=

# ── Stripe ─────────────────────────────────────────────────────────────────
# Publishable key only — secret key lives on the server
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ── Feature flags ──────────────────────────────────────────────────────────
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_AI_FEATURES=false
'

write_file "$MONOREPO_ROOT/apps/storefront/.env.local.example" '# Storefront-specific env vars (port 5173)
VITE_PORT=5173
VITE_APP_NAME=CannaSaas Storefront
# Inherit from root .env.example
'

write_file "$MONOREPO_ROOT/apps/admin/.env.local.example" '# Admin portal-specific env vars (port 5174)
VITE_PORT=5174
VITE_APP_NAME=CannaSaas Admin
'

write_file "$MONOREPO_ROOT/apps/staff/.env.local.example" '# Staff portal-specific env vars (port 5175)
VITE_PORT=5175
VITE_APP_NAME=CannaSaas Staff
'

# =============================================================================
# PHASE 8: Summary and next steps
# =============================================================================

header "Summary"

echo -e "${BOLD}Files created: ${GREEN}$FILES_CREATED${RESET}"
echo -e "${BOLD}Files skipped: ${YELLOW}$FILES_SKIPPED${RESET}"

echo ""
echo -e "${BOLD}${CYAN}Next Steps:${RESET}"
echo ""

echo -e "${BOLD}1. Install dependencies from the monorepo root:${RESET}"
echo "   cd $MONOREPO_ROOT"
echo "   pnpm install"
echo ""

echo -e "${BOLD}2. Wire up each app (paste the snippet into main.jsx):${RESET}"
for APP_DIR in storefront admin staff; do
  echo "   apps/$APP_DIR/QUERY_WIRING.snippet.jsx  →  apps/$APP_DIR/src/main.jsx"
done
echo ""

echo -e "${BOLD}3. Wire up routes (paste the snippet into App.jsx):${RESET}"
for APP_DIR in storefront admin; do
  echo "   apps/$APP_DIR/ROUTES.snippet.jsx  →  apps/$APP_DIR/src/App.jsx"
done
echo ""

echo -e "${BOLD}4. Set up environment variables:${RESET}"
echo "   cp .env.example .env.local"
echo "   # Edit .env.local with your API URL and Stripe key"
echo ""

echo -e "${BOLD}5. Start the development servers:${RESET}"
echo "   turbo dev"
echo "   # Storefront:  http://localhost:5173"
echo "   # Admin:       http://localhost:5174"
echo "   # Staff:       http://localhost:5175"
echo ""

echo -e "${BOLD}6. Verify the integration status page (dev only):${RESET}"
echo "   Open http://localhost:5175/dev/integration-status"
echo "   This shows all cached queries, hook → endpoint mapping, and API health."
echo ""

echo -e "${BOLD}7. Import from @cannasaas/api-client in any app component:${RESET}"
echo "   import { useProducts, useCart, useLogin, QueryBoundary } from '@cannasaas/api-client';"
echo ""

echo -e "${BOLD}8. Read the inline documentation:${RESET}"
echo "   Every file has verbose JSDoc comments explaining:"
echo "   • Why specific patterns were chosen"
echo "   • How the hook maps to the NestJS endpoint"
echo "   • WCAG compliance rationale"
echo "   • Cache strategy and staleTime choices"
echo ""

echo -e "${BOLD}Phase F files documented in:${RESET}"
echo "   packages/api-client/src/  — The shared API integration package"
echo "   apps/storefront/src/pages/storefront/  — Customer-facing pages"
echo "   apps/admin/src/pages/admin/            — Admin portal pages"
echo "   apps/staff/src/pages/                  — Staff portal pages"
echo ""

echo -e "${GREEN}${BOLD}✓ Phase F setup complete!${RESET}"
echo ""
