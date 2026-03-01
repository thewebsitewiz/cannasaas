#!/usr/bin/env zsh
# =============================================================================
# CannaSaas — Part 3: Monorepo Foundation & Tooling
# Scaffolding Script  |  Version 3.0  |  February 2026
# =============================================================================
#
# USAGE
#   zsh scaffold-cannasaas-part3.zsh              # creates ./cannabis-platform
#   zsh scaffold-cannasaas-part3.zsh ~/projects   # creates ~/projects/cannabis-platform
#
# WHAT THIS DOES
#   Creates the complete pnpm + Turborepo monorepo skeleton:
#     • Root config files (pnpm-workspace.yaml, turbo.json, tsconfig.base.json,
#       .eslintrc.cjs, .prettierrc, .gitignore, .env.example)
#     • Root package.json (workspace root — no app code here)
#     • packages/types   — shared TypeScript contracts
#     • packages/stores  — Zustand state stores
#     • packages/api-client — Axios + TanStack Query hooks
#     • packages/ui      — WCAG component library + tokens.css
#     • packages/utils   — formatters, validators, helpers
#     • apps/storefront  — Customer e-commerce app  (port 5173)
#     • apps/admin       — Admin dashboard           (port 5174)
#     • apps/staff       — Staff/budtender portal    (port 5175)
#
# IDEMPOTENT — safe to run more than once. Existing files are skipped.
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
autoload -U colors && colors
info()    { print -P "%F{cyan}  ▸%f  $*" }
ok()      { print -P "%F{green}  ✔%f  $*" }
skip()    { print -P "%F{yellow}  ↷%f  $* (already exists — skipped)" }
section() { print -P "\n%F{magenta}%B── $* ──%b%f" }
err()     { print -P "%F{red}  ✘%f  $*" >&2; exit 1 }

# ── Target directory ─────────────────────────────────────────────────────────
BASE="${1:-$(pwd)}"
ROOT="${BASE}/cannabis-platform"

print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  CannaSaas · Part 3 Monorepo Scaffold        ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f\n"
info "Target root: ${ROOT}"

# ── Helper: write file only if it does not yet exist ─────────────────────────
# Usage:  write_file <path> <<'EOF'
#           ...content...
#         EOF
write_file() {
  local target="$1"
  if [[ -f "$target" ]]; then
    skip "$target"
    # Drain stdin so the heredoc doesn't become a pipe error
    cat > /dev/null
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  cat > "$target"
  ok "Created $target"
}

# ── Helper: ensure directory exists ──────────────────────────────────────────
mkd() {
  if [[ -d "$1" ]]; then
    skip "(dir) $1"
  else
    mkdir -p "$1"
    ok "(dir) $1"
  fi
}

# =============================================================================
# SECTION 1 — DIRECTORY SKELETON
# =============================================================================
section "1/9 · Directory skeleton"

mkd "${ROOT}"
mkd "${ROOT}/apps/storefront/src/assets"
mkd "${ROOT}/apps/storefront/src/components"
mkd "${ROOT}/apps/storefront/src/pages"
mkd "${ROOT}/apps/storefront/src/layouts"
mkd "${ROOT}/apps/storefront/src/hooks"
mkd "${ROOT}/apps/storefront/src/providers"
mkd "${ROOT}/apps/storefront/src/utils"
mkd "${ROOT}/apps/storefront/public"

mkd "${ROOT}/apps/admin/src/components"
mkd "${ROOT}/apps/admin/src/pages"
mkd "${ROOT}/apps/admin/src/layouts"
mkd "${ROOT}/apps/admin/src/hooks"
mkd "${ROOT}/apps/admin/src/providers"
mkd "${ROOT}/apps/admin/public"

mkd "${ROOT}/apps/staff/src/components"
mkd "${ROOT}/apps/staff/src/pages"
mkd "${ROOT}/apps/staff/src/layouts"
mkd "${ROOT}/apps/staff/src/hooks"
mkd "${ROOT}/apps/staff/src/providers"
mkd "${ROOT}/apps/staff/public"

mkd "${ROOT}/packages/types/src/models"
mkd "${ROOT}/packages/stores/src"
mkd "${ROOT}/packages/api-client/src/hooks"
mkd "${ROOT}/packages/api-client/src/services"
mkd "${ROOT}/packages/ui/src/components"
mkd "${ROOT}/packages/ui/src/providers"
mkd "${ROOT}/packages/ui/src/styles"
mkd "${ROOT}/packages/utils/src"

# =============================================================================
# SECTION 2 — ROOT CONFIG FILES
# =============================================================================
section "2/9 · Root configuration files"

# ── pnpm-workspace.yaml ──────────────────────────────────────────────────────
write_file "${ROOT}/pnpm-workspace.yaml" <<'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# ── turbo.json ───────────────────────────────────────────────────────────────
write_file "${ROOT}/turbo.json" <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "a11y": {
      "dependsOn": ["build"]
    }
  }
}
EOF

# ── tsconfig.base.json ───────────────────────────────────────────────────────
write_file "${ROOT}/tsconfig.base.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
EOF

# ── .gitignore ───────────────────────────────────────────────────────────────
write_file "${ROOT}/.gitignore" <<'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.nuxt/
out/

# Turborepo
.turbo/

# Environment files
.env
.env.local
.env.*.local

# Coverage
coverage/

# Editor
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# PWA
sw.js
workbox-*.js

# TypeScript cache
*.tsbuildinfo
EOF

# ── .prettierrc ──────────────────────────────────────────────────────────────
write_file "${ROOT}/.prettierrc" <<'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 90,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
EOF

# ── .eslintrc.cjs ────────────────────────────────────────────────────────────
write_file "${ROOT}/.eslintrc.cjs" <<'EOF'
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['@typescript-eslint', 'react-refresh', 'jsx-a11y'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
  },
  rules: {
    // React
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // A11y extras beyond recommended
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.cjs'],
};
EOF

# ── .env.example ─────────────────────────────────────────────────────────────
write_file "${ROOT}/.env.example" <<'EOF'
# Copy this file to .env.local and fill in values.
# NEVER commit .env.local to source control.

# API & WebSocket
VITE_API_URL=http://localhost:3000/v1
VITE_WS_URL=ws://localhost:3000

# Default tenant (development only — resolved from subdomain in production)
VITE_DEFAULT_ORG_ID=org-dev-placeholder
VITE_DEFAULT_DISPENSARY_ID=disp-dev-placeholder

# Stripe (public key — safe to commit if you use the example value below)
VITE_STRIPE_PUBLIC_KEY=pk_test_replace_me

# Sentry (optional — error tracking)
VITE_SENTRY_DSN=

# Feature flags
VITE_ENABLE_AI_RECOMMENDATIONS=false
VITE_ENABLE_LOYALTY=false
VITE_ENABLE_PWA=false
EOF

# ── .vscode/extensions.json ──────────────────────────────────────────────────
mkd "${ROOT}/.vscode"
write_file "${ROOT}/.vscode/extensions.json" <<'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "streetsidesoftware.code-spell-checker",
    "axe-devtools.axe-devtools"
  ]
}
EOF

write_file "${ROOT}/.vscode/settings.json" <<'EOF'
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
EOF

# =============================================================================
# SECTION 3 — ROOT package.json
# =============================================================================
section "3/9 · Root package.json"

write_file "${ROOT}/package.json" <<'EOF'
{
  "name": "cannabis-platform",
  "version": "0.0.1",
  "private": true,
  "description": "CannaSaas multi-tenant cannabis e-commerce monorepo",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev":        "turbo dev",
    "dev:store":  "turbo dev --filter=storefront",
    "dev:admin":  "turbo dev --filter=admin",
    "dev:staff":  "turbo dev --filter=staff",
    "build":      "turbo build",
    "lint":       "turbo lint",
    "type-check": "turbo type-check",
    "test":       "turbo test",
    "test:e2e":   "turbo e2e",
    "a11y":       "turbo a11y",
    "clean":      "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo":                       "^2.0.0",
    "typescript":                  "^5.4.0",
    "@types/node":                 "^20.0.0",
    "eslint":                      "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser":   "^7.0.0",
    "eslint-plugin-react-hooks":   "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "eslint-plugin-jsx-a11y":      "^6.8.0",
    "prettier":                    "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.14"
  }
}
EOF

# =============================================================================
# SECTION 4 — packages/types
# =============================================================================
section "4/9 · packages/types"

write_file "${ROOT}/packages/types/package.json" <<'EOF'
{
  "name": "@cannasaas/types",
  "version": "0.0.1",
  "private": true,
  "description": "Shared TypeScript contracts for CannaSaas platform",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
EOF

write_file "${ROOT}/packages/types/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"]
}
EOF

write_file "${ROOT}/packages/types/src/index.ts" <<'EOF'
// ── Shared TypeScript contracts ───────────────────────────────────────────────
// Re-export all types from this barrel file.
// Apps and packages import from '@cannasaas/types', never from deep paths.

export * from './models/Product';
export * from './models/Order';
export * from './models/User';
export * from './models/Compliance';
export * from './models/Cart';
export * from './models/Analytics';
export * from './models/Delivery';
export * from './api';
EOF

write_file "${ROOT}/packages/types/src/api.ts" <<'EOF'
/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Structured error from the API */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

/** Tenant context resolved from subdomain or login */
export interface TenantContext {
  organizationId: string;
  organizationName: string;
  companyId?: string;
  dispensaryId?: string;
  dispensaryName?: string;
  brandingConfig?: BrandingConfig;
  subdomain: string;
}

export interface BrandingConfig {
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  headingFont?: string;
  bodyFont?: string;
  customDomain?: string;
}
EOF

write_file "${ROOT}/packages/types/src/models/Product.ts" <<'EOF'
/** Cannabis-specific strain classifications */
export type StrainType =
  | 'indica'
  | 'sativa'
  | 'hybrid'
  | 'indica_dominant_hybrid'
  | 'sativa_dominant_hybrid'
  | 'cbd_dominant';

/** Terpene profile entry */
export interface Terpene {
  name: string;       // e.g., "Myrcene"
  percentage: number; // 0-100
}

/** Cannabis-specific product metadata */
export interface CannabisInfo {
  strainType: StrainType;
  thcContent: number;     // percentage, e.g., 24.5
  cbdContent: number;
  terpenes: Terpene[];
  effects: string[];      // e.g., ["relaxing", "euphoric"]
  flavors: string[];
  growMethod?: 'indoor' | 'outdoor' | 'greenhouse';
  originState?: string;
}

/** A product variant (size/weight option with its own SKU and price) */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;       // e.g., "1/8 oz", "1g", "500mg"
  sku: string;
  weight?: number;
  weightUnit?: 'g' | 'oz' | 'mg' | 'ml';
  price: number;
  compareAtPrice?: number; // Original price for sale display
  quantity: number;        // Current stock level
  lowStockThreshold: number;
  isActive: boolean;
  metrcPackageId?: string; // Metrc seed-to-sale tracking ID
}

/** Product image with alt text for accessibility */
export interface ProductImage {
  id: string;
  url: string;
  altText: string; // Required — WCAG 1.1.1 non-text content
  isPrimary: boolean;
  sortOrder: number;
}

/** Full product model */
export interface Product {
  id: string;
  dispensaryId: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: ProductCategory;
  cannabisInfo: CannabisInfo;
  variants: ProductVariant[];
  images: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  purchaseLimit?: number; // Per-order limit
  ageRestricted: boolean; // Always true for cannabis
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'flower'
  | 'pre_roll'
  | 'vape'
  | 'concentrate'
  | 'edible'
  | 'tincture'
  | 'topical'
  | 'capsule'
  | 'accessory';
EOF

write_file "${ROOT}/packages/types/src/models/Order.ts" <<'EOF'
import type { Address } from './User';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  weightUnit: string;
  batchNumber?: string;
  thcContent?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable: CS-2026-001234
  dispensaryId: string;
  customerId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  deliveryAddress?: Address;
  pickupReadyAt?: string;
  estimatedDeliveryAt?: string;
  driverId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
EOF

write_file "${ROOT}/packages/types/src/models/User.ts" <<'EOF'
export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'budtender'
  | 'driver'
  | 'customer';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  dispensaryIds: string[];
  isAgeVerified: boolean;
  ageVerifiedAt?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: UserRole[];
  permissions: string[];
  iat: number;
  exp: number;
}
EOF

write_file "${ROOT}/packages/types/src/models/Compliance.ts" <<'EOF'
export type ComplianceEventType =
  | 'sale'
  | 'return'
  | 'inventory_adjustment'
  | 'inventory_received'
  | 'inventory_destroyed'
  | 'id_verification'
  | 'purchase_limit_check';

export interface PurchaseLimitResult {
  allowed: boolean;
  violations: string[];
  remaining: {
    flowerOz: number;
    concentrateG: number;
    edibleMg: number;
  };
  windowHours: number;
  state: 'NY' | 'NJ' | 'CT';
}

export interface ComplianceLog {
  id: string;
  dispensaryId: string;
  eventType: ComplianceEventType;
  details: Record<string, unknown>;
  performedBy?: string;
  createdAt: string;
}
EOF

write_file "${ROOT}/packages/types/src/models/Cart.ts" <<'EOF'
import type { Product, ProductVariant } from './Product';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  weightUnit: string;
  product: Product;
  variant: ProductVariant;
}

export interface Cart {
  id: string;
  dispensaryId: string;
  customerId?: string;
  items: CartItem[];
  promoCode?: string;
  promoDiscount: number;
  subtotal: number;
  tax: number;
  total: number;
}
EOF

write_file "${ROOT}/packages/types/src/models/Analytics.ts" <<'EOF'
export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
  quantity: number;
}

export interface AnalyticsDashboard {
  revenue: {
    total: number;
    change: number; // % vs previous period
    byDay: DailyRevenue[];
  };
  orders: {
    total: number;
    change: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  avgOrderValue: {
    value: number;
    change: number;
  };
  topProducts: TopProduct[];
}
EOF

write_file "${ROOT}/packages/types/src/models/Delivery.ts" <<'EOF'
import type { Address } from './User';

export interface DeliveryZone {
  id: string;
  dispensaryId: string;
  name: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedMinutes: number;
  isActive: boolean;
  // PostGIS polygon stored as GeoJSON
  polygon: GeoJSON.Polygon;
}

export interface Driver {
  id: string;
  dispensaryId: string;
  userId: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  updatedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  driverId: string;
  assignedAt: string;
  estimatedArrivalAt: string;
  completedAt?: string;
}
EOF

# =============================================================================
# SECTION 5 — packages/stores
# =============================================================================
section "5/9 · packages/stores"

write_file "${ROOT}/packages/stores/package.json" <<'EOF'
{
  "name": "@cannasaas/stores",
  "version": "0.0.1",
  "private": true,
  "description": "Shared Zustand state stores",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "zustand":            "^4.5.0",
    "immer":              "^10.0.4",
    "@cannasaas/types":   "workspace:*"
  },
  "devDependencies": {
    "typescript": "*"
  }
}
EOF

write_file "${ROOT}/packages/stores/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../types" }
  ]
}
EOF

write_file "${ROOT}/packages/stores/src/index.ts" <<'EOF'
export { useAuthStore, useCurrentUser, useIsAuthenticated, useAccessToken } from './authStore';
export { useCartStore } from './cartStore';
export { useOrganizationStore, useCurrentTenant, useTenantBranding } from './organizationStore';
export { useThemeStore } from './themeStore';
EOF

write_file "${ROOT}/packages/stores/src/authStore.ts" <<'EOF'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@cannasaas/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken) => {
        set((state) => {
          state.user = user;
          state.accessToken = accessToken;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
      },

      updateUser: (updates) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
          }
        });
      },

      clearAuth: () => {
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },
    })),
    {
      name: 'cannasaas-auth',
      // sessionStorage clears on browser close — appropriate for shared POS devices
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Convenience selector hooks — prevent re-renders on unrelated state changes
export const useCurrentUser       = () => useAuthStore((s) => s.user);
export const useIsAuthenticated   = () => useAuthStore((s) => s.isAuthenticated);
export const useAccessToken       = () => useAuthStore((s) => s.accessToken);
EOF

write_file "${ROOT}/packages/stores/src/cartStore.ts" <<'EOF'
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, ProductVariant } from '@cannasaas/types';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  isSyncing: boolean;

  // Derived values (computed, not stored)
  itemCount: () => number;
  subtotal: () => number;

  // Actions
  addItem: (product: Product, variant: ProductVariant, qty: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  clearCart: () => void;
  setSyncing: (syncing: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      isSyncing: false,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.variant.price * item.quantity,
          0,
        ),

      addItem: (product, variant, qty) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === variant.id);
          if (existing) {
            existing.quantity += qty;
          } else {
            state.items.push({
              id: `local-${Date.now()}`,
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              variantName: variant.name,
              quantity: qty,
              unitPrice: variant.price,
              totalPrice: variant.price * qty,
              weight: variant.weight ?? 0,
              weightUnit: variant.weightUnit ?? 'g',
              product,
              variant,
            });
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          state.items = state.items.filter((i) => i.id !== itemId);
        });
      },

      updateQuantity: (itemId, qty) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId);
          if (item) {
            if (qty <= 0) {
              state.items = state.items.filter((i) => i.id !== itemId);
            } else {
              item.quantity = qty;
              item.totalPrice = item.unitPrice * qty;
            }
          }
        });
      },

      applyPromo: (code, discount) => {
        set((state) => {
          state.promoCode = code;
          state.promoDiscount = discount;
        });
      },

      removePromo: () => {
        set((state) => {
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      clearCart: () => {
        set((state) => {
          state.items = [];
          state.promoCode = null;
          state.promoDiscount = 0;
        });
      },

      setSyncing: (syncing) => {
        set((state) => {
          state.isSyncing = syncing;
        });
      },
    })),
    {
      name: 'cannasaas-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
EOF

write_file "${ROOT}/packages/stores/src/organizationStore.ts" <<'EOF'
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TenantContext, BrandingConfig } from '@cannasaas/types';

interface OrganizationState {
  tenant: TenantContext | null;
  isResolving: boolean;
  setTenant: (tenant: TenantContext) => void;
  updateBranding: (branding: BrandingConfig) => void;
  clearTenant: () => void;
  setResolving: (resolving: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  immer((set) => ({
    tenant: null,
    isResolving: true,

    setTenant: (tenant) => {
      set((state) => {
        state.tenant = tenant;
      });
    },

    updateBranding: (branding) => {
      set((state) => {
        if (state.tenant) {
          state.tenant.brandingConfig = branding;
        }
      });
    },

    clearTenant: () => {
      set((state) => {
        state.tenant = null;
      });
    },

    setResolving: (resolving) => {
      set((state) => {
        state.isResolving = resolving;
      });
    },
  })),
);

export const useCurrentTenant  = () => useOrganizationStore((s) => s.tenant);
export const useTenantBranding = () =>
  useOrganizationStore((s) => s.tenant?.brandingConfig);
EOF

write_file "${ROOT}/packages/stores/src/themeStore.ts" <<'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  resolvedScheme: () => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: 'system',

      setColorScheme: (scheme) => set({ colorScheme: scheme }),

      resolvedScheme: () => {
        const { colorScheme } = get();
        if (colorScheme !== 'system') return colorScheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      },
    }),
    {
      name: 'cannasaas-color-scheme',
    },
  ),
);
EOF

# =============================================================================
# SECTION 6 — packages/api-client
# =============================================================================
section "6/9 · packages/api-client"

write_file "${ROOT}/packages/api-client/package.json" <<'EOF'
{
  "name": "@cannasaas/api-client",
  "version": "0.0.1",
  "private": true,
  "description": "Axios HTTP client + TanStack Query hooks for CannaSaas API",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "axios":                   "^1.7.0",
    "@tanstack/react-query":   "^5.40.0",
    "react":                   "^18.3.0",
    "@cannasaas/types":        "workspace:*",
    "@cannasaas/stores":       "workspace:*"
  },
  "devDependencies": {
    "typescript": "*",
    "@types/react": "*"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
EOF

write_file "${ROOT}/packages/api-client/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../stores" }
  ]
}
EOF

write_file "${ROOT}/packages/api-client/src/index.ts" <<'EOF'
export { apiClient, createApiClient } from './client';
export { productKeys, useProducts, useInfiniteProducts, useProduct,
         useCreateProduct, useUpdateProduct, useLowStockProducts } from './hooks/useProducts';
export { useLogin, useRegister, useLogout, useCurrentUserQuery } from './hooks/useAuth';
export { useOrders, useOrder, useUpdateOrderStatus } from './hooks/useOrders';
export { useCart, useAddToCart, useRemoveFromCart } from './hooks/useCart';
export { useAnalyticsDashboard } from './hooks/useAnalytics';
export { useComplianceLogs, useMetrcSyncStatus, useGenerateDailyReport,
         usePurchaseLimitCheck } from './hooks/useCompliance';
export { useSearchSuggestions, useSearchProducts } from './hooks/useSearch';
export { wsManager } from './services/WebSocketManager';
export { useWebSocketEvent } from './hooks/useWebSocketEvent';
EOF

write_file "${ROOT}/packages/api-client/src/client.ts" <<'EOF'
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { useAuthStore } from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: (import.meta as Record<string, Record<string, string>>).env?.VITE_API_URL
      ?? 'http://localhost:3000/v1',
    timeout: 15_000,
    withCredentials: true, // Sends httpOnly cookie for refresh token
  });

  // Request interceptor — attach auth + tenant headers
  client.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    const { tenant }      = useOrganizationStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (tenant?.organizationId) {
      config.headers['X-Organization-Id'] = tenant.organizationId;
    }
    if (tenant?.dispensaryId) {
      config.headers['X-Dispensary-Id'] = tenant.dispensaryId;
    }

    return config;
  });

  // Response interceptor — transparent token refresh with request queuing
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(client(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await client.post<{ accessToken: string }>(
            '/auth/refresh',
          );
          const { accessToken } = data;
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            accessToken,
          );
          processQueue(null, accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          window.location.href = '/auth/login?session=expired';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
EOF

# Placeholder hook files — full implementations in subsequent parts
for hook in useProducts useAuth useOrders useCart useAnalytics useCompliance useSearch useWebSocketEvent; do
  write_file "${ROOT}/packages/api-client/src/hooks/${hook}.ts" <<EOF
// TODO: Full implementation in Part 4 (packages/api-client deep dive)
// Placeholder — import from '@cannasaas/api-client' once implemented.
export {};
EOF
done

write_file "${ROOT}/packages/api-client/src/services/WebSocketManager.ts" <<'EOF'
type EventHandler = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url = '';
  private accessToken = '';

  connect(url: string, accessToken: string): void {
    this.url = url;
    this.accessToken = accessToken;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${this.url}?token=${this.accessToken}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.info('[WS] Connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data as string) as { type: string };
        this.handlers.get(payload.type)?.forEach((h) => h(payload));
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean && this.reconnectAttempts < this.MAX_RECONNECT) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        this.reconnectTimer = setTimeout(() => {
          this.reconnectAttempts++;
          this.openConnection();
        }, delay);
      }
    };
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'User disconnected');
    this.ws = null;
    this.handlers.clear();
  }
}

export const wsManager = new WebSocketManager();
EOF

# =============================================================================
# SECTION 7 — packages/ui  (includes tokens.css — the heart of Part 3)
# =============================================================================
section "7/9 · packages/ui + tokens.css"

write_file "${ROOT}/packages/ui/package.json" <<'EOF'
{
  "name": "@cannasaas/ui",
  "version": "0.0.1",
  "private": true,
  "description": "WCAG 2.1 AA compliant shared component library",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/tokens.css"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react":                          "^18.3.0",
    "react-dom":                      "^18.3.0",
    "class-variance-authority":       "^0.7.0",
    "clsx":                           "^2.1.0",
    "tailwind-merge":                 "^2.3.0",
    "lucide-react":                   "^0.378.0",
    "@radix-ui/react-dialog":         "^1.0.5",
    "@radix-ui/react-dropdown-menu":  "^2.0.6",
    "@radix-ui/react-select":         "^2.0.0",
    "@radix-ui/react-tabs":           "^1.0.4",
    "@radix-ui/react-toast":          "^1.1.5",
    "@radix-ui/react-tooltip":        "^1.0.7",
    "@radix-ui/react-checkbox":       "^1.0.4",
    "@radix-ui/react-slider":         "^1.1.2",
    "@radix-ui/react-switch":         "^1.0.3",
    "@radix-ui/react-accordion":      "^1.1.2",
    "@cannasaas/types":               "workspace:*",
    "@cannasaas/utils":               "workspace:*"
  },
  "devDependencies": {
    "typescript": "*",
    "@types/react": "*",
    "@types/react-dom": "*",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "*",
    "@testing-library/react": "*",
    "@testing-library/jest-dom": "*",
    "@axe-core/react": "*"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "tailwindcss": "^3.0.0"
  }
}
EOF

write_file "${ROOT}/packages/ui/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../utils" }
  ]
}
EOF

write_file "${ROOT}/packages/ui/src/index.ts" <<'EOF'
// Components will be exported here as they are implemented in Part 4
// e.g.:
// export { Button } from './components/Button/Button';
// export { ProductCard } from './components/ProductCard/ProductCard';
export {};
EOF

# ── The design-token CSS — the backbone of the entire theming system ──────────
write_file "${ROOT}/packages/ui/src/styles/tokens.css" <<'EOF'
/* =============================================================================
 * CannaSaas — Design Token System
 * packages/ui/src/styles/tokens.css
 *
 * LAYER ORDER
 * 1. Primitives   — raw color/size values, NEVER referenced in components
 * 2. Semantic     — role-based aliases (--color-brand, --color-surface, …)
 * 3. Component    — scoped overrides applied via CVA variant classes
 *
 * MULTI-TENANT THEMING
 * ThemeProvider (src/providers/ThemeProvider.tsx) reads BrandingConfig from
 * the organizationStore and overwrites the brand primitive tokens at runtime:
 *   document.documentElement.style.setProperty('--p-brand-500', '#hexvalue')
 * All component styles reference semantic aliases, so swapping a dispensary's
 * brand requires no component-level changes.
 *
 * WCAG 2.1 AA COMPLIANCE NOTES
 * • All semantic text/bg pairings enforce ≥ 4.5:1 contrast (normal text)
 * • Large text pairings enforce ≥ 3:1 contrast
 * • Focus ring is 3px solid brand color with 2px offset — clearly visible
 * • prefers-reduced-motion disables all transitions globally at the bottom
 * =============================================================================
 */

/* ── LAYER 1: PRIMITIVES ─────────────────────────────────────────────────── */
:root {
  /* ── Brand palette (defaults — overridden per-dispensary by ThemeProvider) */
  --p-brand-50:  #f0fdf4;
  --p-brand-100: #dcfce7;
  --p-brand-200: #bbf7d0;
  --p-brand-300: #86efac;
  --p-brand-400: #4ade80;
  --p-brand-500: #22c55e;   /* Primary CTA colour */
  --p-brand-600: #16a34a;
  --p-brand-700: #15803d;
  --p-brand-800: #166534;
  --p-brand-900: #14532d;
  --p-brand-950: #052e16;

  /* ── Neutral palette */
  --p-neutral-0:   #ffffff;
  --p-neutral-50:  #f8fafc;
  --p-neutral-100: #f1f5f9;
  --p-neutral-200: #e2e8f0;
  --p-neutral-300: #cbd5e1;
  --p-neutral-400: #94a3b8;
  --p-neutral-500: #64748b;
  --p-neutral-600: #475569;
  --p-neutral-700: #334155;
  --p-neutral-800: #1e293b;
  --p-neutral-900: #0f172a;
  --p-neutral-950: #020617;

  /* ── Semantic status */
  --p-success-light: #dcfce7;
  --p-success:       #16a34a;
  --p-success-dark:  #14532d;

  --p-warning-light: #fef9c3;
  --p-warning:       #d97706;
  --p-warning-dark:  #78350f;

  --p-error-light:   #fee2e2;
  --p-error:         #dc2626;
  --p-error-dark:    #7f1d1d;

  --p-info-light:    #dbeafe;
  --p-info:          #2563eb;
  --p-info-dark:     #1e3a8a;

  /* ── Type scale — 16px minimum base satisfies WCAG 1.4.4 body text */
  --p-text-xs:   0.75rem;    /* 12px */
  --p-text-sm:   0.875rem;   /* 14px */
  --p-text-base: 1rem;       /* 16px */
  --p-text-lg:   1.125rem;   /* 18px */
  --p-text-xl:   1.25rem;    /* 20px */
  --p-text-2xl:  1.5rem;     /* 24px */
  --p-text-3xl:  1.875rem;   /* 30px */
  --p-text-4xl:  2.25rem;    /* 36px */
  --p-text-5xl:  3rem;       /* 48px */

  /* ── Spacing (4px base grid) */
  --p-space-0:   0;
  --p-space-px:  1px;
  --p-space-0-5: 0.125rem;   /*  2px */
  --p-space-1:   0.25rem;    /*  4px */
  --p-space-2:   0.5rem;     /*  8px */
  --p-space-3:   0.75rem;    /* 12px */
  --p-space-4:   1rem;       /* 16px */
  --p-space-5:   1.25rem;    /* 20px */
  --p-space-6:   1.5rem;     /* 24px */
  --p-space-8:   2rem;       /* 32px */
  --p-space-10:  2.5rem;     /* 40px */
  --p-space-12:  3rem;       /* 48px */
  --p-space-16:  4rem;       /* 64px */
  --p-space-20:  5rem;       /* 80px */

  /* ── Border radius */
  --p-radius-none: 0;
  --p-radius-sm:   0.25rem;   /*  4px */
  --p-radius-md:   0.5rem;    /*  8px */
  --p-radius-lg:   0.75rem;   /* 12px */
  --p-radius-xl:   1rem;      /* 16px */
  --p-radius-2xl:  1.5rem;    /* 24px */
  --p-radius-full: 9999px;

  /* ── Shadows */
  --p-shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
  --p-shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10);
  --p-shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10);
  --p-shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10);
  --p-shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* ── Motion */
  --p-dur-instant: 0ms;
  --p-dur-fast:    150ms;
  --p-dur-normal:  250ms;
  --p-dur-slow:    400ms;
  --p-dur-slower:  600ms;
  --p-ease:        cubic-bezier(0.4, 0, 0.2, 1);
  --p-ease-in:     cubic-bezier(0.4, 0, 1, 1);
  --p-ease-out:    cubic-bezier(0, 0, 0.2, 1);
  --p-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* ── Z-index scale */
  --p-z-below:    -1;
  --p-z-base:      0;
  --p-z-raised:    1;
  --p-z-dropdown:  10;
  --p-z-sticky:    20;
  --p-z-overlay:   30;
  --p-z-modal:     40;
  --p-z-toast:     50;
  --p-z-tooltip:   60;
}


/* ── LAYER 2: SEMANTIC ALIASES — LIGHT MODE ─────────────────────────────── */
:root,
[data-color-scheme="light"] {
  /* Brand */
  --color-brand:         var(--p-brand-500);
  --color-brand-hover:   var(--p-brand-700);
  --color-brand-active:  var(--p-brand-800);
  --color-brand-subtle:  var(--p-brand-50);
  --color-brand-muted:   var(--p-brand-100);
  --color-brand-text:    var(--p-brand-900);
  --color-text-on-brand: #ffffff;

  /* Surfaces */
  --color-bg:             var(--p-neutral-0);
  --color-bg-secondary:   var(--p-neutral-50);
  --color-bg-tertiary:    var(--p-neutral-100);
  --color-surface:        var(--p-neutral-0);
  --color-surface-raised: var(--p-neutral-50);
  --color-surface-overlay: rgb(255 255 255 / 0.85);

  /* Borders */
  --color-border:        var(--p-neutral-200);
  --color-border-strong: var(--p-neutral-300);
  --color-border-brand:  var(--p-brand-300);

  /* Text */
  --color-text:           var(--p-neutral-900);
  --color-text-secondary: var(--p-neutral-500);
  --color-text-tertiary:  var(--p-neutral-400);
  --color-text-disabled:  var(--p-neutral-300);
  --color-text-inverse:   var(--p-neutral-0);

  /* Status colours (background / foreground pairs) */
  --color-success-bg:   var(--p-success-light);
  --color-success:      var(--p-success);
  --color-success-text: var(--p-success-dark);

  --color-warning-bg:   var(--p-warning-light);
  --color-warning:      var(--p-warning);
  --color-warning-text: var(--p-warning-dark);

  --color-error-bg:     var(--p-error-light);
  --color-error:        var(--p-error);
  --color-error-text:   var(--p-error-dark);

  --color-info-bg:      var(--p-info-light);
  --color-info:         var(--p-info);
  --color-info-text:    var(--p-info-dark);

  /* Focus — WCAG 2.4.7 Focus Visible: 3px solid, clearly visible */
  --color-focus-ring: var(--p-brand-500);
  --focus-ring: 0 0 0 3px var(--color-focus-ring);

  /* Shadows — reuse primitives */
  --shadow-sm:  var(--p-shadow-sm);
  --shadow-md:  var(--p-shadow-md);
  --shadow-lg:  var(--p-shadow-lg);
  --shadow-xl:  var(--p-shadow-xl);
  --shadow-2xl: var(--p-shadow-2xl);
}


/* ── LAYER 2: SEMANTIC ALIASES — DARK MODE ──────────────────────────────── */
[data-color-scheme="dark"] {
  /* Brand — lighter shades for dark-bg contrast */
  --color-brand:         var(--p-brand-400);
  --color-brand-hover:   var(--p-brand-300);
  --color-brand-active:  var(--p-brand-200);
  --color-brand-subtle:  var(--p-brand-950);
  --color-brand-muted:   var(--p-brand-900);
  --color-brand-text:    var(--p-brand-100);
  --color-text-on-brand: var(--p-neutral-950);

  /* Surfaces — GitHub-style dark palette */
  --color-bg:             #0d1117;
  --color-bg-secondary:   #161b22;
  --color-bg-tertiary:    #21262d;
  --color-surface:        #1c2128;
  --color-surface-raised: #2d333b;
  --color-surface-overlay: rgb(13 17 23 / 0.85);

  /* Borders */
  --color-border:        #30363d;
  --color-border-strong: #484f58;
  --color-border-brand:  var(--p-brand-800);

  /* Text */
  --color-text:           #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-tertiary:  #6e7681;
  --color-text-disabled:  #484f58;
  --color-text-inverse:   var(--p-neutral-950);

  /* Status — dark-mode adjusted backgrounds */
  --color-success-bg:   rgb(22 163 74 / 0.15);
  --color-success:      #4ade80;
  --color-success-text: #86efac;

  --color-warning-bg:   rgb(217 119 6 / 0.15);
  --color-warning:      #fbbf24;
  --color-warning-text: #fde68a;

  --color-error-bg:     rgb(220 38 38 / 0.15);
  --color-error:        #f87171;
  --color-error-text:   #fca5a5;

  --color-info-bg:      rgb(37 99 235 / 0.15);
  --color-info:         #60a5fa;
  --color-info-text:    #bfdbfe;

  /* Focus */
  --color-focus-ring: var(--p-brand-400);

  /* Dark-mode shadows — more opaque */
  --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.40);
  --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.50);
  --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.50);
  --shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.50);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.70);
}


/* ── LAYER 3: GLOBAL RESETS WITH ACCESSIBILITY DEFAULTS ─────────────────── */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  /* Prevent iOS font-size inflation */
  -webkit-text-size-adjust: 100%;
  /* Smooth scrolling (disabled below for reduced-motion users) */
  scroll-behavior: smooth;
  /* Ensure background covers full viewport in dark mode */
  background-color: var(--color-bg);
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-body, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif);
  font-size: var(--p-text-base);  /* 16px — WCAG 1.4.4 minimum */
  line-height: 1.5;
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading, inherit);
  color: var(--color-text);
  line-height: 1.2;
}

/* Remove list styling when used for navigation / cards */
ul[role="list"],
ol[role="list"] {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Images don't overflow their containers */
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Inherit font from body in forms */
input, button, textarea, select {
  font: inherit;
}

/* Remove default button appearance */
button {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

/* Anchor colour */
a {
  color: var(--color-brand);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

/* ── WCAG 2.4.7 Focus Visible — globally applied ─────────────────────────── */
/* Replace the browser default (often invisible in dark mode) with our ring */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: var(--p-radius-sm);
}

/* ── WCAG 2.4.1 Bypass Blocks — skip-to-main-content link ───────────────── */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: var(--p-z-toast);
}

.skip-link:focus,
.skip-link:focus-visible {
  position: fixed;
  left: var(--p-space-4);
  top: var(--p-space-4);
  width: auto;
  height: auto;
  padding: var(--p-space-3) var(--p-space-6);
  background-color: var(--color-brand);
  color: var(--color-text-on-brand);
  font-weight: 700;
  font-size: var(--p-text-base);
  border-radius: var(--p-radius-md);
  box-shadow: var(--shadow-lg);
  outline: 3px solid var(--color-text-on-brand);
  outline-offset: 2px;
}

/* ── Screen-reader only utility ──────────────────────────────────────────── */
/* Use this class on elements that must exist in the DOM for AT
   but should not be visible to sighted users. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Inverse: visible only to sighted users, hidden from AT */
.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* ── WCAG 2.3.3 Animation from Interactions — motion preference ──────────── */
/* Disables ALL motion for users who prefer reduced motion. Components must
   not override this with !important. Transition durations are set to 0.01ms
   (not 0ms) to avoid breaking JS that reads transition durations.) */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration:       0.01ms !important;
    animation-iteration-count: 1     !important;
    transition-duration:      0.01ms !important;
    scroll-behavior:          auto   !important;
  }

  html {
    scroll-behavior: auto;
  }
}

/* ── High-contrast mode support (Windows, macOS) ─────────────────────────── */
@media (forced-colors: active) {
  /* Preserve focus ring in high-contrast mode */
  *:focus-visible {
    outline: 3px solid ButtonText;
  }
}
EOF

# =============================================================================
# SECTION 8 — packages/utils
# =============================================================================
section "8/9 · packages/utils"

write_file "${ROOT}/packages/utils/package.json" <<'EOF'
{
  "name": "@cannasaas/utils",
  "version": "0.0.1",
  "private": true,
  "description": "Shared formatters, validators, and helper utilities",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "clsx":         "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "zod":          "^3.23.0",
    "date-fns":     "^3.6.0"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "*"
  }
}
EOF

write_file "${ROOT}/packages/utils/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"]
}
EOF

write_file "${ROOT}/packages/utils/src/index.ts" <<'EOF'
export { cn } from './cn';
export {
  formatCurrency,
  formatThc,
  formatWeight,
  pluralize,
  truncate,
} from './formatting';
export {
  passwordSchema,
  emailSchema,
  usPhoneSchema,
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from './validation';
export { useDebounce } from './useDebounce';
export { formatDate, formatRelativeTime } from './date';
export { calculateTax, NY_CANNABIS_TAX_RATE } from './currency';
EOF

write_file "${ROOT}/packages/utils/src/cn.ts" <<'EOF'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Tailwind class name merger
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Use this for ALL className construction in the component library.
 *
 * @example
 *   cn('px-4 py-2', condition && 'bg-brand', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
EOF

write_file "${ROOT}/packages/utils/src/formatting.ts" <<'EOF'
/**
 * Format a number as USD currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format THC or CBD percentage value for display.
 * Sub-1% values are displayed as mg/g for precision.
 */
export function formatThc(value: number): string {
  if (value === 0) return '0%';
  if (value < 1) return `${(value * 100).toFixed(0)}mg/g`;
  return `${value.toFixed(1)}%`;
}

/**
 * Format a weight in grams into a human-readable cannabis unit.
 * Standard dispensary denominations are recognised and labelled.
 */
export function formatWeight(grams: number): string {
  if (grams < 1)   return `${(grams * 1000).toFixed(0)}mg`;
  if (grams === 1)  return '1g';
  if (grams === 3.5) return '1/8 oz';
  if (grams === 7)   return '1/4 oz';
  if (grams === 14)  return '1/2 oz';
  if (grams === 28)  return '1 oz';
  return `${grams}g`;
}

/** Pluralize a word based on count */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Truncate a string to maxLength, appending '…' if needed */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
EOF

write_file "${ROOT}/packages/utils/src/validation.ts" <<'EOF'
import { z } from 'zod';

/** Password: 8+ chars, upper, lower, number, special char */
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters required')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/\d/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const emailSchema = z
  .string()
  .email('Please enter a valid email address');

export const usPhoneSchema = z
  .string()
  .regex(
    /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
    'Please enter a valid US phone number',
  );

export const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName:       z.string().min(1, 'First name is required'),
    lastName:        z.string().min(1, 'Last name is required'),
    email:           emailSchema,
    password:        passwordSchema,
    confirmPassword: z.string(),
    acceptTerms:     z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues    = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
EOF

write_file "${ROOT}/packages/utils/src/useDebounce.ts" <<'EOF'
import { useState, useEffect } from 'react';

/**
 * useDebounce — Returns a debounced copy of the value.
 * The debounced value only updates after the specified delay
 * has elapsed since the last change.
 *
 * @param value   The value to debounce
 * @param delay   Delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
EOF

write_file "${ROOT}/packages/utils/src/date.ts" <<'EOF'
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** Format an ISO date string for display */
export function formatDate(
  isoString: string,
  pattern = 'MMM d, yyyy',
): string {
  try {
    return format(parseISO(isoString), pattern);
  } catch {
    return isoString;
  }
}

/** Format an ISO date string as relative time (e.g., "3 minutes ago") */
export function formatRelativeTime(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}
EOF

write_file "${ROOT}/packages/utils/src/currency.ts" <<'EOF'
/**
 * New York cannabis excise tax rates (2026).
 * Source: NY Tax Law § 496 — subject to annual adjustment.
 *
 * Flower:      $0.005 per mg of total THC
 * Concentrate: $0.008 per mg of total THC
 * Edible:      $0.03  per mg of total THC
 * Retail tax:  13%    on the retail price
 */
export const NY_CANNABIS_TAX_RATE = {
  retail:      0.13,
  flower_per_mg_thc:      0.005,
  concentrate_per_mg_thc: 0.008,
  edible_per_mg_thc:      0.03,
} as const;

/**
 * Calculate a simple retail tax for a subtotal amount.
 * Full THC-weight excise tax calculation requires product data
 * from the order service — this utility covers the retail portion only.
 */
export function calculateTax(subtotal: number, rate = NY_CANNABIS_TAX_RATE.retail): number {
  return Math.round(subtotal * rate * 100) / 100;
}
EOF

# =============================================================================
# SECTION 9 — Apps (storefront, admin, staff)
# =============================================================================
section "9/9 · App skeletons (storefront / admin / staff)"

# Shared Vite + TS config writer for all three apps
scaffold_app() {
  local NAME="$1"
  local PORT="$2"
  local APP_DIR="${ROOT}/apps/${NAME}"

  # ── package.json ────────────────────────────────────────────────
  write_file "${APP_DIR}/package.json" <<EOF
{
  "name": "@cannasaas/${NAME}",
  "version": "0.0.1",
  "private": true,
  "description": "CannaSaas ${NAME} application",
  "type": "module",
  "scripts": {
    "dev":        "vite --port ${PORT}",
    "build":      "tsc && vite build",
    "preview":    "vite preview --port ${PORT}",
    "lint":       "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test":       "vitest run",
    "e2e":        "playwright test"
  },
  "dependencies": {
    "react":                     "^18.3.0",
    "react-dom":                 "^18.3.0",
    "react-router-dom":          "^6.23.0",
    "@tanstack/react-query":     "^5.40.0",
    "@tanstack/react-query-devtools": "^5.40.0",
    "react-helmet-async":        "^2.0.4",
    "react-hook-form":           "^7.51.0",
    "@hookform/resolvers":       "^3.4.0",
    "axios":                     "^1.7.0",
    "@stripe/stripe-js":         "^3.0.0",
    "@stripe/react-stripe-js":   "^2.7.0",
    "@cannasaas/types":          "workspace:*",
    "@cannasaas/stores":         "workspace:*",
    "@cannasaas/api-client":     "workspace:*",
    "@cannasaas/ui":             "workspace:*",
    "@cannasaas/utils":          "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react":      "^4.3.0",
    "vite":                      "^5.2.0",
    "typescript":                "*",
    "@types/react":              "*",
    "@types/react-dom":          "*",
    "tailwindcss":               "^3.4.0",
    "autoprefixer":              "^10.4.0",
    "postcss":                   "^8.4.0",
    "vitest":                    "^1.6.0",
    "@testing-library/react":    "*",
    "@testing-library/jest-dom": "*",
    "@axe-core/react":           "*",
    "@playwright/test":          "^1.44.0"
  }
}
EOF

  # ── tsconfig.json ────────────────────────────────────────────────
  write_file "${APP_DIR}/tsconfig.json" <<EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/types" },
    { "path": "../../packages/stores" },
    { "path": "../../packages/api-client" },
    { "path": "../../packages/ui" },
    { "path": "../../packages/utils" }
  ]
}
EOF

  # ── tailwind.config.js ────────────────────────────────────────────
  write_file "${APP_DIR}/tailwind.config.js" <<EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-color-scheme="dark"]'],
  theme: {
    extend: {
      // All colours are provided by CSS custom properties in tokens.css.
      // Tailwind classes that reference those properties are safe to use.
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui'],
        body:    ['var(--font-body)',    'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
EOF

  # ── postcss.config.js ─────────────────────────────────────────────
  write_file "${APP_DIR}/postcss.config.js" <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

  # ── vite.config.ts ────────────────────────────────────────────────
  write_file "${APP_DIR}/vite.config.ts" <<EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'query-vendor':  ['@tanstack/react-query'],
          'ui-vendor':     ['@radix-ui/react-dialog', 'lucide-react'],
        },
      },
    },
    sourcemap: true,
  },
  server: {
    port: ${PORT},
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
EOF

  # ── index.html ────────────────────────────────────────────────────
  write_file "${APP_DIR}/index.html" <<EOF
<!doctype html>
<html lang="en" data-color-scheme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--
      WCAG 2.4.2 — Page Titled
      The React app will update <title> dynamically via react-helmet-async.
      This is the fallback title shown before JS loads.
    -->
    <title>CannaSaas — ${NAME^}</title>
    <!--
      Favicon references (place actual files in /public/)
      ThemeProvider will update the favicon href based on BrandingConfig.
    -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <!--
      Preconnect to API host to reduce first-request latency.
      Replace with your production API domain before deploying.
    -->
    <link rel="preconnect" href="http://localhost:3000" crossorigin />
  </head>
  <body>
    <!--
      WCAG 2.4.1 — Bypass Blocks
      The React app renders a .skip-link as its first child, which becomes
      visible on focus and scrolls the user to #main-content.
      We include a noscript fallback here for completeness.
    -->
    <noscript>
      <p style="padding:2rem;font-family:sans-serif;color:#dc2626;">
        JavaScript is required to use CannaSaas.
        Please enable JavaScript in your browser settings.
      </p>
    </noscript>

    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

  # ── src/main.tsx ──────────────────────────────────────────────────
  write_file "${APP_DIR}/src/main.tsx" <<'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
// Design tokens must be imported first so all components have access to
// CSS custom properties before any component renders.
import '@cannasaas/ui/styles';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,   // 5 min — matches Redis TTL in backend
      refetchOnWindowFocus: false, // Prevents jarring refetches on tab switch
    },
    mutations: {
      retry: 0, // Never auto-retry mutations — user actions must not repeat
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
EOF

  mkd "${APP_DIR}/src/styles"
  write_file "${APP_DIR}/src/styles/global.css" <<'EOF'
/* App-level global styles that extend tokens.css.
   tokens.css is imported first in main.tsx.
   Add only app-specific overrides here. */

@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

  write_file "${APP_DIR}/src/App.tsx" <<'EOF'
import React from 'react';
// TODO: implement routes for this app (Part 5+)
export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>CannaSaas — scaffold ready</h1>
      <p>Routes and providers will be added in subsequent parts.</p>
    </div>
  );
}
EOF

  # ── Playwright config ──────────────────────────────────────────────
  write_file "${APP_DIR}/playwright.config.ts" <<EOF
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:${PORT}',
    trace: 'on-first-retry',
    // WCAG — run axe on every page
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:${PORT}',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

  mkd "${APP_DIR}/e2e"
  write_file "${APP_DIR}/e2e/.gitkeep" <<'EOF'
EOF

  ok "Scaffolded app: ${NAME} (port ${PORT})"
}

scaffold_app "storefront" "5173"
scaffold_app "admin"      "5174"
scaffold_app "staff"      "5175"

# =============================================================================
# DONE — Print summary
# =============================================================================
print -P "\n%F{green}%B╔══════════════════════════════════════════════╗%b%f"
print -P "%F{green}%B║  Part 3 scaffold complete!                    ║%b%f"
print -P "%F{green}%B╚══════════════════════════════════════════════╝%b%f"
print ""
print -P "  %F{cyan}Root:%f  ${ROOT}"
print ""
print -P "  %F{yellow}Next steps:%f"
print -P "  %F{white}1.%f  cd ${ROOT}"
print -P "  %F{white}2.%f  pnpm install          # install all workspace deps"
print -P "  %F{white}3.%f  cp .env.example .env.local && \$EDITOR .env.local"
print -P "  %F{white}4.%f  pnpm dev              # starts all three apps in parallel"
print -P "  %F{white}5.%f  Continue with Part 4 script (packages deep-dive)"
print ""
print -P "  %F{magenta}Apps:%f"
print -P "    storefront  →  http://localhost:5173"
print -P "    admin       →  http://localhost:5174"
print -P "    staff       →  http://localhost:5175"
print ""
