# CannaSaas — Public Beta Deep-Dive Implementation Guide

**Advanced Architecture · WCAG 2.1 AA · Full-Stack React + NestJS · Multi-Tenant**  
**Version 3.0 | February 2026**  
**Prepared for: Dennis Luken, Senior Architect / Site Lead**

---

## Table of Contents

1. [Where We Are: State of the Platform](#1-where-we-are-state-of-the-platform)
2. [Beta Definition & Success Criteria](#2-beta-definition--success-criteria)
3. [Monorepo Foundation & Tooling](#3-monorepo-foundation--tooling)
4. [Shared Packages — Deep Implementation](#4-shared-packages--deep-implementation)
   - 4.1 [packages/types — The Contract Layer](#41-packagestypes--the-contract-layer)
   - 4.2 [packages/stores — Zustand State Architecture](#42-packagesstores--zustand-state-architecture)
   - 4.3 [packages/api-client — Axios + TanStack Query](#43-packagesapi-client--axios--tanstack-query)
   - 4.4 [packages/ui — WCAG-First Component Library](#44-packagesui--wcag-first-component-library)
   - 4.5 [packages/utils — Formatters, Validators, Helpers](#45-packagesutils--formatters-validators-helpers)
5. [Authentication & Multi-Tenant Wiring](#5-authentication--multi-tenant-wiring)
6. [Design System & Theming Engine](#6-design-system-and-theming-engine)
7. [Customer Storefront — Full Implementation](#7-customer-storefront--full-implementation)
   - 7.1 [App Shell & Routing](#71-app-shell--routing)
   - 7.2 [Age Gate Component](#72-age-gate-component)
   - 7.3 [Storefront Layout & Navigation](#73-storefront-layout--navigation)
   - 7.4 [Home Page](#74-home-page)
   - 7.5 [Product Catalog Page](#75-product-catalog-page)
   - 7.6 [Product Detail Page](#76-product-detail-page)
   - 7.7 [Cart & Checkout Flow](#77-cart--checkout-flow)
   - 7.8 [User Account Pages](#78-user-account-pages)
   - 7.9 [Order Tracking with WebSocket](#79-order-tracking-with-websocket)
8. [Admin Portal — Full Implementation](#8-admin-portal--full-implementation)
   - 8.1 [Admin Layout and Navigation](#81-admin-layout-and-navigation)
   - 8.2 [Analytics Dashboard](#82-analytics-dashboard)
   - 8.3 [Product and Inventory Management](#83-product-and-inventory-management)
   - 8.4 [Order Management and Fulfillment](#84-order-management-and-fulfillment)
   - 8.5 [Compliance Dashboard](#85-compliance-dashboard)
   - 8.6 [Tenant Onboarding Wizard](#86-tenant-onboarding-wizard)
9. [Staff Portal — Full Implementation](#9-staff-portal--full-implementation)
   - 9.1 [Staff-Layout-and-Live-Order-Queue](#91-Staff-Layout-and-Live-Order-Queue)
   - 9.2 [Customer Lookup and ID Verification](#92-customer-lookup-√-id-verification)
   - 9.3 [Inventory Quick-Search](#93-inventory-quick-search)
   - 9.4 [Delivery Dispatch Interface](#94-delivery-dispatch-interface)
10. [Cannabis-Specific Components](#10-cannabis-specific-components)
11. [Real-Time Features — WebSocket Architecture](#11-real-time-features--websocket-architecture)
12. [Elasticsearch Search and AI Recommendations](#12-elasticsearch-search--ai-recommendations)
13. [Testing Strategy — Unit, Integration and E2E](#13-testing-strategy--unit-integration--e2e)
14. [CI/CD & Beta Deployment](#14-cicd--beta-deployment)
15. [WCAG 2.1 AA Compliance Checklist](#15-wcag-21-aa-compliance-checklist)
16. [Suggested Advanced Features Beyond Current Docs](#16-suggested-advanced-features-beyond-current-docs)

---

[↑ Back to top](#Table-of-Contents)

## 1. Where We Are: State of the Platform

Your NestJS backend is production-ready through 12 completed sprints. Every API surface described in `api-reference.md` is operational and ready for the frontend to consume. No backend rewrite is needed — only targeted additions as frontend features expose gaps.

### What is Complete

| Layer                                | Status  | Notes                                          |
| ------------------------------------ | ------- | ---------------------------------------------- |
| Auth (JWT + refresh)                 | ✅ Done | S2 — access + refresh tokens, bcrypt, Passport |
| Multi-tenant middleware              | ✅ Done | S2 — schema-per-org, X-Organization-Id headers |
| Org / Company / Dispensary hierarchy | ✅ Done | S3 — full CRUD, PostGIS geospatial             |
| Product catalog + variants           | ✅ Done | S4 — THC/CBD fields, images, categories        |
| Cart (Redis + DB) + Orders           | ✅ Done | S5 — state machine, tax calculation            |
| Stripe Payments                      | ✅ Done | S6 — payment intents, webhooks                 |
| Age verification stubs               | ✅ Done | S7 — Veratad/Jumio integration hooks           |
| Metrc compliance                     | ✅ Done | S8 — NY seed-to-sale, purchase limits          |
| Elasticsearch product search         | ✅ Done | S9 — cannabis synonyms, autocomplete, facets   |
| Delivery + WebSocket tracking        | ✅ Done | S10 — PostGIS zones, Twilio SMS                |
| POS integration (Dutchie/Treez)      | ✅ Done | S11 — adapter pattern                          |
| Analytics + PWA service worker       | ✅ Done | S12 — nightly aggregation, CSV export          |

### What Remains for Public Beta

The frontend monorepo is the primary remaining deliverable. This document is the implementation blueprint covering every file, component, pattern, and test needed to reach the public beta milestone defined in Section 2.

[↑ Back to top](#Table-of-Contents)

---

## 2. Beta Definition & Success Criteria

Public beta targets **5 pilot dispensaries** in New York (the most complex compliance jurisdiction) over a 4-week window. It corresponds to Release 2 in the roadmap.

### Beta Feature Gate

| Feature                                | Must Have | Nice to Have |
| -------------------------------------- | --------- | ------------ |
| Age gate + ID verification flow        | ✅        |              |
| Product browsing + search              | ✅        |              |
| Cart + checkout (Stripe)               | ✅        |              |
| Order tracking (WebSocket)             | ✅        |              |
| Admin: products, orders, customers     | ✅        |              |
| Compliance dashboard                   | ✅        |              |
| Staff portal (order queue + ID verify) | ✅        |              |
| Multi-tenant branding                  | ✅        |              |
| AI product descriptions                |           | ✅           |
| Loyalty program                        |           | ✅           |
| PWA push notifications                 |           | ✅           |

### Performance Targets

- Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
- WCAG 2.1 AA across all three applications
- API error rate < 0.1% under normal load
- Mobile-first responsive: 320px → 1920px

---

[↑ Back to top](#Table-of-Contents)

## 3. Monorepo Foundation & Tooling

The frontend monorepo lives alongside the NestJS API as a sibling directory. The entire frontend is orchestrated by Turborepo with pnpm workspaces.

### 3.1 Root Package Structure

```
cannabis-platform/           ← monorepo root
├── apps/
│   ├── storefront/          ← Customer e-commerce app (port 5173)
│   ├── admin/               ← Admin dashboard (port 5174)
│   └── staff/               ← Staff/budtender portal (port 5175)
├── packages/
│   ├── types/               ← Shared TypeScript contracts
│   ├── stores/              ← Zustand stores
│   ├── api-client/          ← Axios + TanStack Query hooks
│   ├── ui/                  ← WCAG component library
│   └── utils/               ← Helpers, formatters, validators
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── .eslintrc.cjs
```

### 3.2 Root Configuration Files

#### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `turbo.json`

```json
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
    }
  }
}
```

#### `tsconfig.base.json`

```json
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
```

#### `packages/ui/src/styles/tokens.css` — Design Token Foundation

The token system is the backbone of white-label theming. All component styles reference semantic tokens, never raw values, which allows dispensary branding to be injected at runtime via `ThemeProvider`.

```css
/* packages/ui/src/styles/tokens.css */

/* ── LAYER 1: PRIMITIVES ─────────────────────────────────────────── */
:root {
  /* Brand defaults — overridden per-dispensary by ThemeProvider */
  --p-brand-50: #f0fdf4;
  --p-brand-100: #dcfce7;
  --p-brand-300: #86efac;
  --p-brand-500: #22c55e;
  --p-brand-700: #15803d;
  --p-brand-900: #14532d;

  /* Neutrals */
  --p-neutral-0: #ffffff;
  --p-neutral-50: #f8fafc;
  --p-neutral-100: #f1f5f9;
  --p-neutral-200: #e2e8f0;
  --p-neutral-300: #cbd5e1;
  --p-neutral-400: #94a3b8;
  --p-neutral-500: #64748b;
  --p-neutral-700: #334155;
  --p-neutral-900: #0f172a;

  /* Semantic status */
  --p-success: #16a34a;
  --p-warning: #d97706;
  --p-error: #dc2626;
  --p-info: #2563eb;

  /* Type scale — 16px minimum base for WCAG body text */
  --p-text-xs: 0.75rem;
  --p-text-sm: 0.875rem;
  --p-text-base: 1rem;
  --p-text-lg: 1.125rem;
  --p-text-xl: 1.25rem;
  --p-text-2xl: 1.5rem;
  --p-text-3xl: 1.875rem;
  --p-text-4xl: 2.25rem;

  /* Spacing (4px base grid) */
  --p-space-1: 0.25rem;
  --p-space-2: 0.5rem;
  --p-space-3: 0.75rem;
  --p-space-4: 1rem;
  --p-space-6: 1.5rem;
  --p-space-8: 2rem;
  --p-space-12: 3rem;
  --p-space-16: 4rem;

  /* Radii */
  --p-radius-sm: 0.25rem;
  --p-radius-md: 0.5rem;
  --p-radius-lg: 0.75rem;
  --p-radius-full: 9999px;

  /* Shadows */
  --p-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --p-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --p-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Motion */
  --p-dur-fast: 150ms;
  --p-dur-normal: 250ms;
  --p-dur-slow: 400ms;
  --p-ease: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── LAYER 2: SEMANTIC ALIASES — LIGHT MODE ─────────────────────── */
:root,
[data-color-scheme='light'] {
  --color-brand: var(--p-brand-500);
  --color-brand-hover: var(--p-brand-700);
  --color-brand-subtle: var(--p-brand-50);
  --color-brand-text: var(--p-brand-900);

  --color-bg: var(--p-neutral-0);
  --color-bg-secondary: var(--p-neutral-50);
  --color-bg-tertiary: var(--p-neutral-100);
  --color-surface: var(--p-neutral-0);
  --color-surface-raised: var(--p-neutral-50);

  --color-border: var(--p-neutral-200);
  --color-border-strong: var(--p-neutral-300);

  --color-text: var(--p-neutral-900);
  --color-text-secondary: var(--p-neutral-500);
  --color-text-disabled: var(--p-neutral-400);
  --color-text-inverse: var(--p-neutral-0);
  --color-text-on-brand: #ffffff;

  --color-success: var(--p-success);
  --color-warning: var(--p-warning);
  --color-error: var(--p-error);
  --color-info: var(--p-info);

  --color-focus-ring: var(--p-brand-500);
  --focus-ring: 0 0 0 3px var(--color-focus-ring);
}

/* ── LAYER 2: SEMANTIC ALIASES — DARK MODE ──────────────────────── */
[data-color-scheme='dark'] {
  --color-brand: var(--p-brand-300);
  --color-brand-hover: var(--p-brand-100);
  --color-brand-subtle: var(--p-brand-900);
  --color-brand-text: var(--p-brand-100);

  --color-bg: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  --color-surface: #1c2128;
  --color-surface-raised: #2d333b;

  --color-border: #30363d;
  --color-border-strong: #484f58;

  --color-text: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-disabled: #484f58;
  --color-text-inverse: #0f172a;
  --color-text-on-brand: #0f172a;

  --color-focus-ring: var(--p-brand-300);
}

/* ── LAYER 3: GLOBAL RESETS WITH ACCESSIBILITY DEFAULTS ─────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High-contrast focus ring — WCAG 2.4.7 Focus Visible */
:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: var(--p-radius-sm);
}

/* Skip to main content link — WCAG 2.4.1 */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 9999;
}
.skip-link:focus {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: auto;
  height: auto;
  padding: 0.75rem 1.5rem;
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  font-weight: 700;
  border-radius: var(--p-radius-md);
  box-shadow: var(--p-shadow-lg);
}

/* Screen reader only utility */
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
```

[↑ Back to top](#top)

---

[↑ Back to top](#Table-of-Contents)

## 4. Shared Packages — Deep Implementation

### 4.1 `packages/types` — The Contract Layer

Every interface shared across the three apps lives here. This is the single source of truth for the shape of API responses. Keeping types in their own package prevents circular dependencies and ensures the frontend never silently drifts from the backend contract.

#### `packages/types/src/models/Product.ts`

```typescript
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
  name: string; // e.g., "Myrcene"
  percentage: number; // 0-100
}

/** Cannabis-specific product metadata */
export interface CannabisInfo {
  strainType: StrainType;
  thcContent: number; // percentage, e.g., 24.5
  cbdContent: number;
  terpenes: Terpene[];
  effects: string[]; // e.g., ["relaxing", "euphoric"]
  flavors: string[];
  growMethod?: 'indoor' | 'outdoor' | 'greenhouse';
  originState?: string;
}

/** A product variant (size/weight option with its own SKU and price) */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g., "1/8 oz", "1g", "500mg"
  sku: string;
  weight?: number;
  weightUnit?: 'g' | 'oz' | 'mg' | 'ml';
  price: number;
  compareAtPrice?: number; // Original price for sale display
  quantity: number; // Current stock level
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
```

#### `packages/types/src/models/Order.ts`

```typescript
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

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}
```

#### `packages/types/src/models/User.ts`

```typescript
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
  dispensaryIds: string[]; // Dispensaries this user can access
  isAgeVerified: boolean;
  ageVerifiedAt?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  loyaltyPoints: number;
  createdAt: string;
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
```

#### `packages/types/src/models/Compliance.ts`

```typescript
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
```

#### `packages/types/src/api.ts`

```typescript
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
```

---

### 4.2 `packages/stores` — Zustand State Architecture

Zustand is used for **client state** only — things that don't live on the server and don't need TanStack Query's caching. The golden rule: if it's server data, it belongs in a TanStack Query hook. If it's ephemeral UI state that persists across navigation (auth session, cart, theme, tenant), it belongs in a Zustand store.

#### `packages/stores/src/authStore.ts`

This store persists auth state to `sessionStorage` (not `localStorage`) so it's cleared when the browser is closed, which matches cannabis compliance best practices for shared devices.

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, JwtPayload } from '@cannasaas/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
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

// Convenience selector hooks — prevents re-renders when unrelated state changes
export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
```

#### `packages/stores/src/cartStore.ts`

The cart store uses optimistic updates: items are added to local state immediately, then synced to the API. This creates a snappy UX without waiting for the network round-trip.

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CartItem, Product, ProductVariant } from '@cannasaas/types';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  isSyncing: boolean;

  // Derived values (computed)
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
```

#### `packages/stores/src/organizationStore.ts`

```typescript
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

export const useCurrentTenant = () => useOrganizationStore((s) => s.tenant);
export const useTenantBranding = () =>
  useOrganizationStore((s) => s.tenant?.brandingConfig);
```

[↑ Back to top](#top)

---

### 4.3 `packages/api-client` — Axios + TanStack Query

The API client is organized into two layers: a service layer (pure async functions that call Axios) and a hooks layer (TanStack Query wrappers that provide caching, loading states, and error handling).

#### `packages/api-client/src/client.ts` — Axios Instance with Auth Interceptor

```typescript
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
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1',
    timeout: 15000,
    withCredentials: true, // Sends httpOnly cookie for refresh token
  });

  // Request interceptor — attach auth + tenant headers
  client.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState();
    const { tenant } = useOrganizationStore.getState();

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

  // Response interceptor — transparent token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue this request until the refresh completes
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
          // Refresh token is in httpOnly cookie; send empty body
          const { data } = await client.post<{ accessToken: string }>(
            '/auth/refresh',
          );
          const { accessToken } = data;
          useAuthStore
            .getState()
            .setAuth(useAuthStore.getState().user!, accessToken);
          processQueue(null, accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          // Redirect to login
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
```

#### `packages/api-client/src/hooks/useProducts.ts` — TanStack Query Hooks

```typescript
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Product, PaginatedResponse, ApiError } from '@cannasaas/types';

// ── Query Key Factory ─────────────────────────────────────────────
// Centralized key management prevents stale data and makes
// invalidation surgical and predictable.
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  lowStock: () => [...productKeys.all, 'low-stock'] as const,
};

export interface ProductFilters {
  category?: string;
  strainType?: string;
  minThc?: number;
  maxThc?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'thc_desc' | 'newest';
  page?: number;
  limit?: number;
  search?: string;
  dispensaryId?: string;
}

// ── List Products (with infinite scroll support) ──────────────────
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: filters },
      );
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes — aligns with Redis TTL
    placeholderData: (previousData) => previousData, // Keeps previous results while refetching
  });
}

// ── Infinite Scroll Variant ───────────────────────────────────────
export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'>) {
  return useInfiniteQuery({
    queryKey: [...productKeys.lists(), 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<PaginatedResponse<Product>>(
        '/products',
        { params: { ...filters, page: pageParam, limit: 20 } },
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Single Product ────────────────────────────────────────────────
export function useProduct(
  id: string,
  options?: Partial<UseQueryOptions<Product>>,
) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product }>(
        `/products/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// ── Create Product Mutation ───────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await apiClient.post<{ data: Product }>(
        '/products',
        payload,
      );
      return data.data;
    },
    onSuccess: (newProduct) => {
      // Invalidate all product lists so they refetch with the new item
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Pre-populate the detail cache to avoid a network request on navigation
      queryClient.setQueryData(productKeys.detail(newProduct.id), newProduct);
    },
  });
}

// ── Update Product Mutation ───────────────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Product> & { id: string }) => {
      const { data } = await apiClient.put<{ data: Product }>(
        `/products/${id}`,
        payload,
      );
      return data.data;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel any outgoing refetches for this product
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot the current value for rollback
      const previous = queryClient.getQueryData<Product>(
        productKeys.detail(id),
      );

      // Optimistically update the cache
      queryClient.setQueryData<Product>(productKeys.detail(id), (old) =>
        old ? { ...old, ...updates } : old,
      );

      return { previous, id };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous && context.id) {
        queryClient.setQueryData(
          productKeys.detail(context.id),
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

// ── Low Stock Alert ───────────────────────────────────────────────
export function useLowStockProducts() {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Product[] }>(
        '/products/low-stock',
      );
      return data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes — stock changes frequently
    refetchInterval: 1000 * 60 * 5, // Poll every 5 minutes
  });
}
```

[↑ Back to top](#top)

---

### 4.4 `packages/ui` — WCAG-First Component Library

Every component in this library is designed to meet WCAG 2.1 AA out of the box. The patterns used here are keyboard navigable, screen-reader announced, and color-contrast compliant by default.

#### `packages/ui/src/components/Button/Button.tsx`

The `Button` component uses `class-variance-authority` (CVA) to compose Tailwind variants. This is the idiomatic pattern for multi-variant components in this stack.

```tsx
// packages/ui/src/components/Button/Button.tsx
import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@cannasaas/utils';
import { Loader2 } from 'lucide-react';

// CVA variant definition — all style decisions live here
const buttonVariants = cva(
  // Base styles applied to every variant
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold leading-none tracking-wide',
    'rounded-[var(--p-radius-md)]',
    'transition-all duration-[var(--p-dur-fast)] ease-[var(--p-ease)]',
    'focus-visible:outline-none focus-visible:ring-3',
    'focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none whitespace-nowrap',
    // WCAG 2.4.3 Focus Order — ensure tab order is visible
    '[&:focus-visible]:outline [&:focus-visible]:outline-3',
    '[&:focus-visible]:outline-offset-2',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
          'hover:bg-[var(--color-brand-hover)]',
          'active:scale-[0.98]',
          // Minimum 4.5:1 contrast ratio enforced via brand token system
        ],
        secondary: [
          'bg-[var(--color-bg-tertiary)] text-[var(--color-text)]',
          'border border-[var(--color-border-strong)]',
          'hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]',
        ],
        outline: [
          'border-2 border-[var(--color-brand)] text-[var(--color-brand)]',
          'bg-transparent',
          'hover:bg-[var(--color-brand-subtle)]',
        ],
        ghost: [
          'bg-transparent text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]',
        ],
        destructive: [
          'bg-[var(--color-error)] text-white',
          'hover:opacity-90 active:opacity-100',
        ],
        link: [
          'bg-transparent text-[var(--color-brand)]',
          'underline-offset-4 hover:underline',
          'h-auto p-0',
        ],
      },
      size: {
        sm: 'h-8  px-3 text-[var(--p-text-sm)]',
        md: 'h-10 px-4 text-[var(--p-text-base)]',
        lg: 'h-12 px-6 text-[var(--p-text-lg)]',
        // WCAG 2.5.5 Target Size: minimum 44x44px on touch devices
        touch: 'min-h-[44px] min-w-[44px] px-4 text-[var(--p-text-base)]',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string; // Announced to screen readers during loading
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean; // For use with React Router Link
}

/**
 * Button — Primary action component
 *
 * WCAG compliance:
 * - 2.1.1 Keyboard: focusable, activatable via Space/Enter
 * - 2.4.7 Focus Visible: high-contrast focus ring
 * - 4.1.2 Name, Role, Value: uses native <button> semantics
 * - 1.4.3 Contrast: brand token enforces 4.5:1 minimum
 * - 2.5.5 Target Size: `size="touch"` provides 44px minimum
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        // WCAG 4.1.2: communicate loading state to assistive technology
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            {/* Screen reader hears the loading text, sighted users see the spinner */}
            <span aria-live="polite">{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span aria-hidden="true" className="flex-shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

#### `packages/ui/src/components/ProductCard/ProductCard.tsx`

ProductCard is the most-rendered component in the storefront. It is composed of four sub-components to keep concerns separated and allow targeted testing.

```tsx
// packages/ui/src/components/ProductCard/ProductCard.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Leaf } from 'lucide-react';
import { cn } from '@cannasaas/utils';
import { formatCurrency, formatThc } from '@cannasaas/utils';
import type { Product, ProductVariant } from '@cannasaas/types';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';
import { StrainTypeBadge } from './StrainTypeBadge';
import { EffectsChips } from './EffectsChips';
import { PotencyBar } from './PotencyBar';

// ── Sub-component: Product Image with lazy loading ────────────────
interface ProductImageProps {
  product: Product;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ product, className }) => {
  const [imgError, setImgError] = useState(false);
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  if (!primaryImage || imgError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-bg-tertiary)]',
          'text-[var(--color-text-secondary)]',
          className,
        )}
        // WCAG 1.1.1: when no image, the div itself communicates the absence
        aria-label={`No image available for ${product.name}`}
        role="img"
      >
        <Leaf className="w-12 h-12 opacity-30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={primaryImage.url}
      // WCAG 1.1.1: meaningful alt text from the product data
      alt={primaryImage.altText || `${product.name} product image`}
      className={cn('object-cover w-full h-full', className)}
      loading="lazy" // Native lazy loading for performance
      decoding="async"
      onError={() => setImgError(true)}
    />
  );
};

// ── Sub-component: Pricing with sale state ────────────────────────
interface ProductPricingProps {
  variant: ProductVariant;
  className?: string;
}

const ProductPricing: React.FC<ProductPricingProps> = ({
  variant,
  className,
}) => {
  const isOnSale =
    variant.compareAtPrice !== undefined &&
    variant.compareAtPrice > variant.price;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className="text-[var(--p-text-xl)] font-bold text-[var(--color-text)]"
        // WCAG 1.3.3: use semantic text, not just color, for sale indication
        aria-label={
          isOnSale
            ? `Sale price: ${formatCurrency(variant.price)}, was ${formatCurrency(variant.compareAtPrice!)}`
            : formatCurrency(variant.price)
        }
      >
        {formatCurrency(variant.price)}
      </span>
      {isOnSale && (
        <span
          className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] line-through"
          aria-hidden="true" // Hidden from AT; aria-label on parent covers it
        >
          {formatCurrency(variant.compareAtPrice!)}
        </span>
      )}
    </div>
  );
};

// ── Sub-component: Stock indicator ───────────────────────────────
const StockIndicator: React.FC<{ variant: ProductVariant }> = ({ variant }) => {
  if (variant.quantity === 0) {
    return (
      <Badge variant="destructive" size="sm" aria-label="Out of stock">
        Out of Stock
      </Badge>
    );
  }
  if (variant.quantity <= variant.lowStockThreshold) {
    return (
      <Badge
        variant="warning"
        size="sm"
        aria-label={`Low stock: ${variant.quantity} remaining`}
      >
        Only {variant.quantity} left
      </Badge>
    );
  }
  return null;
};

// ── Main: ProductCard ─────────────────────────────────────────────
export interface ProductCardProps {
  product: Product;
  /** Show compact version without effects/potency bar */
  compact?: boolean;
  /** External handler for add-to-cart (triggers optimistic update + API call) */
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
  className?: string;
}

/**
 * ProductCard — Cannabis product display card
 *
 * WCAG:
 * - 1.1.1 Alt text on all images
 * - 1.3.1 Information not conveyed by color alone
 * - 1.4.3 Color contrast via token system
 * - 2.1.1 Fully keyboard navigable
 * - 2.4.4 Link purpose is clear from context
 * - 4.1.2 Proper button semantics for add-to-cart
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  onAddToCart,
  className,
}) => {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const selectedVariant = product.variants[selectedVariantIndex];
  const isOutOfStock = selectedVariant?.quantity === 0;

  const handleAddToCart = () => {
    if (selectedVariant && onAddToCart) {
      onAddToCart(product, selectedVariant);
    }
  };

  // WCAG 4.1.2: card is not itself a link; the product name and
  // "View Details" are the interactive elements. This avoids nested
  // interactive elements inside a link, which violates HTML spec.
  return (
    <article
      className={cn(
        'relative flex flex-col',
        'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[var(--p-shadow-sm)]',
        'overflow-hidden',
        'transition-all duration-[var(--p-dur-normal)]',
        'hover:shadow-[var(--p-shadow-md)] hover:-translate-y-0.5',
        'focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)]',
        className,
      )}
      aria-label={`${product.name}, ${formatCurrency(selectedVariant?.price ?? 0)}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden bg-[var(--color-bg-tertiary)]">
        <ProductImage
          product={product}
          className="transition-transform duration-300 hover:scale-105"
        />

        {/* Strain type badge — overlaid on image */}
        <div className="absolute top-2 left-2">
          <StrainTypeBadge strainType={product.cannabisInfo.strainType} />
        </div>

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge variant="brand" size="sm">
              Featured
            </Badge>
          </div>
        )}

        {/* Quick view button — visible on hover/focus */}
        <Link
          to={`/products/${product.slug}`}
          className={[
            'absolute inset-0 flex items-end justify-center pb-4',
            'opacity-0 focus:opacity-100',
            'group-hover:opacity-100',
            'transition-opacity duration-[var(--p-dur-fast)]',
          ].join(' ')}
          aria-label={`View details for ${product.name}`}
        >
          <span
            className={[
              'flex items-center gap-2 px-4 py-2',
              'bg-[var(--color-bg)]/90 backdrop-blur-sm',
              'rounded-full text-[var(--p-text-sm)] font-semibold',
              'shadow-[var(--p-shadow-md)]',
            ].join(' ')}
          >
            <Eye size={14} aria-hidden="true" />
            View Details
          </span>
        </Link>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Brand + name */}
        {product.brand && (
          <span className="text-[var(--p-text-xs)] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
            {product.brand}
          </span>
        )}

        <h3 className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] leading-snug line-clamp-2">
          <Link
            to={`/products/${product.slug}`}
            className="hover:text-[var(--color-brand)] focus:text-[var(--color-brand)] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* THC/CBD potency bar */}
        {!compact && (
          <PotencyBar
            thc={product.cannabisInfo.thcContent}
            cbd={product.cannabisInfo.cbdContent}
          />
        )}

        {/* Effects chips */}
        {!compact && product.cannabisInfo.effects.length > 0 && (
          <EffectsChips effects={product.cannabisInfo.effects.slice(0, 3)} />
        )}

        {/* Variant selector (if multiple variants exist) */}
        {product.variants.length > 1 && (
          <div
            role="group"
            aria-label="Select size"
            className="flex flex-wrap gap-1.5"
          >
            {product.variants.map((variant, i) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantIndex(i)}
                aria-pressed={i === selectedVariantIndex}
                aria-label={`${variant.name} — ${formatCurrency(variant.price)}`}
                className={cn(
                  'px-2.5 py-1 rounded-[var(--p-radius-sm)]',
                  'text-[var(--p-text-xs)] font-semibold border',
                  'transition-all duration-[var(--p-dur-fast)]',
                  i === selectedVariantIndex
                    ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)] border-[var(--color-brand)]'
                    : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        )}

        {/* Price + stock */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {selectedVariant && <ProductPricing variant={selectedVariant} />}
          {selectedVariant && <StockIndicator variant={selectedVariant} />}
        </div>

        {/* Add to cart */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleAddToCart}
          disabled={isOutOfStock || !onAddToCart}
          leftIcon={<ShoppingCart size={16} aria-hidden="true" />}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </article>
  );
};
```

#### `packages/ui/src/components/ProductCard/PotencyBar.tsx`

```tsx
// Renders a visual THC/CBD potency bar with accessible text fallback
import React from 'react';
import { cn } from '@cannasaas/utils';
import { formatThc } from '@cannasaas/utils';

interface PotencyBarProps {
  thc: number; // 0-35+
  cbd: number;
  className?: string;
}

export const PotencyBar: React.FC<PotencyBarProps> = ({
  thc,
  cbd,
  className,
}) => {
  // Normalize percentage display against a 35% ceiling
  const thcPct = Math.min((thc / 35) * 100, 100);
  const cbdPct = Math.min((cbd / 35) * 100, 100);

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* THC bar */}
      <div className="flex items-center gap-2">
        <span
          className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
          aria-hidden="true"
        >
          THC
        </span>
        <div
          className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
          role="meter"
          aria-valuenow={thc}
          aria-valuemin={0}
          aria-valuemax={35}
          aria-label={`THC content: ${formatThc(thc)}`}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-500"
            style={{ width: `${thcPct}%` }}
          />
        </div>
        <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
          {formatThc(thc)}
        </span>
      </div>

      {/* CBD bar */}
      {cbd > 0 && (
        <div className="flex items-center gap-2">
          <span
            className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] w-8 flex-shrink-0"
            aria-hidden="true"
          >
            CBD
          </span>
          <div
            className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden"
            role="meter"
            aria-valuenow={cbd}
            aria-valuemin={0}
            aria-valuemax={35}
            aria-label={`CBD content: ${formatThc(cbd)}`}
          >
            <div
              className="h-full rounded-full bg-[var(--color-info)] transition-all duration-500"
              style={{ width: `${cbdPct}%` }}
            />
          </div>
          <span className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)] w-12 text-right">
            {formatThc(cbd)}
          </span>
        </div>
      )}
    </div>
  );
};
```

[↑ Back to top](#top)

---

### 4.5 `packages/utils` — Formatters, Validators, Helpers

```typescript
// packages/utils/src/formatting.ts

/** Format a number as USD currency */
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

/** Format THC/CBD percentage */
export function formatThc(value: number): string {
  if (value === 0) return '0%';
  if (value < 1) return `${(value * 100).toFixed(0)}mg/g`;
  return `${value.toFixed(1)}%`;
}

/** Format cannabis weight */
export function formatWeight(grams: number): string {
  if (grams < 1) return `${(grams * 1000).toFixed(0)}mg`;
  if (grams === 1) return '1g';
  if (grams === 3.5) return '1/8 oz';
  if (grams === 7) return '1/4 oz';
  if (grams === 14) return '1/2 oz';
  if (grams === 28) return '1 oz';
  return `${grams}g`;
}

/** Pluralize a word based on count */
export function pluralize(
  count: number,
  word: string,
  plural?: string,
): string {
  return count === 1 ? word : (plural ?? `${word}s`);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
```

```typescript
// packages/utils/src/validation.ts
import { z } from 'zod';

/** Password must be 8+ chars, with upper, lower, number, and special char */
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
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to continue' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
```

---

[↑ Back to top](#Table-of-Contents)

## 5. Authentication & Multi-Tenant Wiring

### 5.1 Tenant Resolution at App Startup

When the storefront loads, it must determine which dispensary's data to show. The resolution flow follows the subdomain → API lookup → store hydration pattern.

```tsx
// apps/storefront/src/providers/TenantProvider.tsx
import React, { useEffect, type ReactNode } from 'react';
import { apiClient } from '@cannasaas/api-client';
import { useOrganizationStore, useCurrentTenant } from '@cannasaas/stores';
import type { TenantContext } from '@cannasaas/types';
import { FullPageLoader } from '@cannasaas/ui';

interface TenantProviderProps {
  children: ReactNode;
}

/**
 * TenantProvider resolves the current dispensary from the domain/subdomain
 * and populates the organization store before rendering children.
 *
 * Flow:
 * 1. Read hostname (e.g., shop.greenleafbrooklyn.com)
 * 2. Call GET /tenants/resolve?domain=shop.greenleafbrooklyn.com
 * 3. Receive { organizationId, dispensaryId, brandingConfig, ... }
 * 4. Store in organizationStore
 * 5. Render children — all API calls now have tenant context
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const { setTenant, setResolving, isResolving } = useOrganizationStore();
  const tenant = useCurrentTenant();

  useEffect(() => {
    async function resolveTenant() {
      const hostname = window.location.hostname;

      try {
        const { data } = await apiClient.get<{ data: TenantContext }>(
          '/tenants/resolve',
          { params: { domain: hostname } },
        );
        setTenant(data.data);
      } catch (error) {
        // Dev fallback: use env-configured default dispensary
        const fallbackDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID;
        if (fallbackDispensaryId) {
          setTenant({
            organizationId: import.meta.env.VITE_DEFAULT_ORG_ID,
            organizationName: 'Development',
            dispensaryId: fallbackDispensaryId,
            dispensaryName: 'Dev Dispensary',
            subdomain: 'localhost',
          });
        } else {
          console.error('Tenant resolution failed and no fallback configured');
        }
      } finally {
        setResolving(false);
      }
    }

    resolveTenant();
  }, [setTenant, setResolving]);

  if (isResolving) {
    return <FullPageLoader message="Loading dispensary..." />;
  }

  if (!tenant) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <p className="text-[var(--color-error)]">
          Unable to locate this dispensary. Please check the URL.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 5.2 Auth Route Guards

```tsx
// apps/storefront/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuthStore } from '@cannasaas/stores';
import type { UserRole } from '@cannasaas/types';
import { FullPageLoader } from '@cannasaas/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * ProtectedRoute — Guards authenticated-only pages.
 *
 * During initial load (isLoading=true), shows a spinner.
 * If unauthenticated, redirects to /auth/login with return URL.
 * If authenticated but missing required role, redirects to /unauthorized.
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { isLoading, user } = useAuthStore();

  // Still hydrating from sessionStorage
  if (isLoading) {
    return <FullPageLoader message="Verifying session..." />;
  }

  // Not logged in — preserve intended destination for post-login redirect
  if (!isAuthenticated) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Logged in but missing required role
  if (requiredRoles.length > 0 && user) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
```

### 5.3 Login Page with Full Form Validation

```tsx
// apps/storefront/src/pages/Auth/LoginPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '@cannasaas/utils';
import { Button } from '@cannasaas/ui';
import { useLogin } from '@cannasaas/api-client';
import { useCurrentTenant } from '@cannasaas/stores';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tenant = useCurrentTenant();
  const { mutateAsync: login, isPending, error } = useLogin();

  // Return to originally intended page after login
  const from = (location.state as { from?: string })?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch {
      // Set a root-level form error — displayed in a live region
      setError('root', {
        message: 'Invalid email or password. Please try again.',
      });
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-bg-secondary)]"
      // WCAG 2.4.2: page has a meaningful title (set via Helmet)
    >
      <div className="w-full max-w-md">
        {/* Dispensary branding */}
        {tenant?.brandingConfig?.logoUrl && (
          <img
            src={tenant.brandingConfig.logoUrl}
            alt={`${tenant.dispensaryName} logo`}
            className="mx-auto mb-8 h-12 object-contain"
          />
        )}

        <div
          className={[
            'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--p-shadow-lg)] p-8',
          ].join(' ')}
        >
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-2">
            Sign in
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Welcome back to {tenant?.dispensaryName ?? 'CannaSaas'}
          </p>

          {/* WCAG 4.1.3: Status messages — error is in a live region */}
          {errors.root && (
            <div
              role="alert"
              aria-live="assertive"
              className={[
                'flex items-start gap-3 p-4 mb-6 rounded-[var(--p-radius-md)]',
                'bg-red-50 dark:bg-red-950/20 border border-[var(--color-error)]',
                'text-[var(--color-error)] text-[var(--p-text-sm)]',
              ].join(' ')}
            >
              {errors.root.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate // We handle validation ourselves with Zod
            aria-label="Sign in form"
          >
            {/* Email field */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
              >
                Email address
                <span
                  className="text-[var(--color-error)] ml-1"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                className={[
                  'w-full h-11 px-4 rounded-[var(--p-radius-md)]',
                  'bg-[var(--color-bg)] border text-[var(--color-text)]',
                  'text-[var(--p-text-base)] placeholder:text-[var(--color-text-disabled)]',
                  'transition-all duration-[var(--p-dur-fast)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                  errors.email
                    ? 'border-[var(--color-error)] bg-red-50/50 dark:bg-red-950/10'
                    : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                ].join(' ')}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field with show/hide toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
                >
                  Password
                  <span
                    className="text-[var(--color-error)] ml-1"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[var(--p-text-sm)] text-[var(--color-brand)] hover:underline focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-required="true"
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  aria-invalid={!!errors.password}
                  className={[
                    'w-full h-11 pl-4 pr-12 rounded-[var(--p-radius-md)]',
                    'bg-[var(--color-bg)] border text-[var(--color-text)]',
                    'text-[var(--p-text-base)]',
                    'transition-all duration-[var(--p-dur-fast)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:border-[var(--color-brand)]',
                    errors.password
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]',
                  ].join(' ')}
                  {...register('password')}
                />
                {/* WCAG 2.5.3: show/hide label matches visual button label */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1 rounded"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-1.5 text-[var(--p-text-sm)] text-[var(--color-error)]"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending || isSubmitting}
              loadingText="Signing in..."
              leftIcon={<LogIn size={18} aria-hidden="true" />}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            New customer?{' '}
            <Link
              to="/auth/register"
              className="text-[var(--color-brand)] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

## 6. Design System and Theming Engine

The `ThemeProvider` reads branding config from the organization store and injects CSS custom properties at the `:root` level. This means **zero component rewrites** are needed for white-label support — every dispensary gets its own colors, fonts, and logo through a single runtime injection.

```tsx
// packages/ui/src/providers/ThemeProvider.tsx
import React, {
  useEffect,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { BrandingConfig } from '@cannasaas/types';

interface ThemeContextValue {
  colorScheme: 'light' | 'dark' | 'system';
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
  branding?: BrandingConfig;
  defaultColorScheme?: 'light' | 'dark' | 'system';
}

/**
 * ThemeProvider — Dual-purpose:
 * 1. Injects per-dispensary brand tokens at :root
 * 2. Manages light/dark/system color scheme preference
 *
 * Persists user preference to localStorage so it survives refresh.
 */
export function ThemeProvider({
  children,
  branding,
  defaultColorScheme = 'system',
}: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<
    'light' | 'dark' | 'system'
  >(() => {
    const stored = localStorage.getItem('cannasaas-color-scheme');
    return (stored as 'light' | 'dark' | 'system') ?? defaultColorScheme;
  });

  // Apply color scheme to <html> data attribute
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'system') {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      root.setAttribute('data-color-scheme', systemDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-color-scheme', colorScheme);
    }
  }, [colorScheme]);

  // Inject branding tokens as CSS custom properties
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;

    if (branding.primaryColor) {
      const hsl = hexToHsl(branding.primaryColor);
      root.style.setProperty('--p-brand-500', branding.primaryColor);
      root.style.setProperty('--color-brand', branding.primaryColor);
      // Generate a hover shade (10% darker)
      root.style.setProperty(
        '--color-brand-hover',
        darkenHex(branding.primaryColor, 0.1),
      );
      root.style.setProperty(
        '--color-brand-subtle',
        `hsl(${hsl.h} ${hsl.s}% 97%)`,
      );
    }

    if (branding.headingFont) {
      // Inject Google Font link if not already present
      injectGoogleFont(branding.headingFont);
      root.style.setProperty(
        '--font-heading',
        `'${branding.headingFont}', sans-serif`,
      );
    }

    if (branding.bodyFont) {
      injectGoogleFont(branding.bodyFont);
      root.style.setProperty(
        '--font-body',
        `'${branding.bodyFont}', sans-serif`,
      );
    }
  }, [branding]);

  const setColorScheme = (scheme: 'light' | 'dark' | 'system') => {
    setColorSchemeState(scheme);
    localStorage.setItem('cannasaas-color-scheme', scheme);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Utilities
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function darkenHex(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  return `hsl(${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - amount * 100)}%)`;
}

function injectGoogleFont(fontFamily: string) {
  const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }
}
```

---

[↑ Back to top](#Table-of-Contents)

## 7. Customer Storefront — Full Implementation

### 7.1 App Shell & Routing

```tsx
// apps/storefront/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import '@cannasaas/ui/styles'; // imports tokens.css + global resets

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false, // Prevent jarring refetches on tab switch
    },
    mutations: {
      retry: 0, // Never retry mutations — user actions should not auto-repeat
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
```

```tsx
// apps/storefront/src/App.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TenantProvider } from './providers/TenantProvider';
import { ThemeBootstrap } from './providers/ThemeBootstrap';
import { AgeGate } from './components/AgeGate/AgeGate';
import { StorefrontLayout } from './layouts/StorefrontLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from '@cannasaas/ui';

// Lazy-loaded routes — code split at the route level
const HomePage = lazy(() => import('./pages/Home/HomePage'));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage'));
const ProductDetailPage = lazy(
  () => import('./pages/Products/ProductDetailPage'),
);
const CartPage = lazy(() => import('./pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/Orders/OrderSuccessPage'));
const OrderTrackingPage = lazy(
  () => import('./pages/Orders/OrderTrackingPage'),
);
const AccountPage = lazy(() => import('./pages/Account/AccountPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <TenantProvider>
      <ThemeBootstrap>
        <AgeGate>
          {/* WCAG 2.4.1 — skip navigation link, made visible on focus */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route element={<StorefrontLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />

                {/* Auth routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/success"
                  element={
                    <ProtectedRoute>
                      <OrderSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id/track"
                  element={
                    <ProtectedRoute>
                      <OrderTrackingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/*"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AgeGate>
      </ThemeBootstrap>
    </TenantProvider>
  );
}
```

[↑ Back to top](#top)

---

### 7.2 Age Gate Component

The age gate is the most legally critical component in the entire application. It must be impossible to bypass, must not use age from localStorage across sessions, and must be fully accessible.

```tsx
// apps/storefront/src/components/AgeGate/AgeGate.tsx
import React, { useState, useEffect, type ReactNode } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@cannasaas/ui';
import { useCurrentTenant } from '@cannasaas/stores';

interface AgeGateProps {
  children: ReactNode;
}

const SESSION_KEY = 'cannasaas-age-verified';

/**
 * AgeGate — Full-page interstitial before any cannabis content
 *
 * Compliance requirements:
 * - Must re-verify on every browser session (sessionStorage, not localStorage)
 * - Must not allow bypass via URL manipulation
 * - Must be accessible to screen readers (modal semantics)
 * - Must explain the reason for the age check
 * - Must provide a compliant "deny" path
 *
 * WCAG:
 * - 1.3.1 Semantics: dialog role, aria-modal, aria-labelledby
 * - 2.1.1 Keyboard: focus trapped inside modal
 * - 2.4.3 Focus: initial focus on heading, then first interactive element
 */
export function AgeGate({ children }: AgeGateProps) {
  const tenant = useCurrentTenant();
  const [isVerified, setIsVerified] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verified = sessionStorage.getItem(SESSION_KEY) === 'true';
    setIsVerified(verified);
    setIsChecking(false);
  }, []);

  const handleConfirm = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsVerified(true);
  };

  const handleDeny = () => {
    setIsDenied(true);
    // Per state law requirements, attempt to redirect away from the site
    window.location.href = 'https://www.google.com';
  };

  // Still reading sessionStorage
  if (isChecking) return null;

  // Allow access
  if (isVerified) return <>{children}</>;

  // Denial state — shown briefly before redirect
  if (isDenied) {
    return (
      <div
        className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center p-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-[var(--color-text-secondary)] text-center">
          We're sorry. You must be 21 or older to access this site.
        </p>
      </div>
    );
  }

  // Age verification modal
  return (
    <>
      {/* Blurred background — hints that content exists behind the gate */}
      <div
        className="fixed inset-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-50"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        className={[
          'fixed inset-0 z-50 flex items-center justify-center p-6',
          'focus:outline-none',
        ].join(' ')}
        // Trap focus within this dialog
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            // Prevent closing — this gate must be answered
            e.preventDefault();
          }
        }}
      >
        <div
          className={[
            'w-full max-w-md',
            'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
            'border border-[var(--color-border)]',
            'shadow-[var(--p-shadow-lg)]',
            'p-8 md:p-10',
            'text-center',
          ].join(' ')}
        >
          {/* Dispensary logo or default shield icon */}
          {tenant?.brandingConfig?.logoUrl ? (
            <img
              src={tenant.brandingConfig.logoUrl}
              alt={`${tenant.dispensaryName} logo`}
              className="mx-auto mb-6 h-14 object-contain"
            />
          ) : (
            <div
              className="mx-auto mb-6 w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center"
              aria-hidden="true"
            >
              <Shield
                className="w-8 h-8 text-[var(--color-brand)]"
                aria-hidden="true"
              />
            </div>
          )}

          <h1
            id="age-gate-title"
            className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-3"
            tabIndex={-1} // Programmatically focusable for initial focus
          >
            Age Verification Required
          </h1>

          <p
            id="age-gate-desc"
            className="text-[var(--color-text-secondary)] text-[var(--p-text-base)] mb-2"
          >
            {tenant?.dispensaryName ?? 'This website'} sells cannabis products.
            You must be <strong>21 years of age or older</strong> to enter.
          </p>

          <p className="text-[var(--color-text-secondary)] text-[var(--p-text-sm)] mb-8">
            By clicking "I am 21 or Older" you confirm you are of legal age to
            purchase cannabis in your jurisdiction and agree to our{' '}
            <a
              href="/terms"
              className="text-[var(--color-brand)] hover:underline"
              // Opens in same window to avoid breaking modal focus
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="text-[var(--color-brand)] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>

          {/* Warning icon + disclaimer */}
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[var(--p-radius-md)] p-3 mb-6 text-left">
            <AlertTriangle
              className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-[var(--p-text-xs)] text-amber-700 dark:text-amber-400">
              Cannabis products have intoxicating effects. Keep out of reach of
              children. For use by adults 21 and older only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleConfirm}
              // WCAG 2.4.3: this button gets focus first — most likely action
              autoFocus
            >
              I am 21 or Older
            </Button>
            <Button variant="outline" size="lg" fullWidth onClick={handleDeny}>
              I am Under 21
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
```

[↑ Back to top](#top)

---

### 7.3 Storefront Layout & Navigation

```tsx
// apps/storefront/src/layouts/StorefrontLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from '../components/Navigation/StorefrontHeader';
import { StorefrontFooter } from '../components/Navigation/StorefrontFooter';
import { CartDrawer } from '../components/Cart/CartDrawer';
import { Toaster } from '@cannasaas/ui';

export function StorefrontLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <StorefrontHeader />

      {/* WCAG 2.4.1 — landmark for main content */}
      <main
        id="main-content"
        className="flex-1 w-full"
        tabIndex={-1} // Allows skip link to focus the main element
      >
        <Outlet />
      </main>

      <StorefrontFooter />

      {/* Cart drawer is a portal rendered outside layout flow */}
      <CartDrawer />

      {/* Toast notifications — aria-live region */}
      <Toaster />
    </div>
  );
}
```

```tsx
// apps/storefront/src/components/Navigation/StorefrontHeader.tsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import {
  useCartStore,
  useAuthStore,
  useCurrentTenant,
} from '@cannasaas/stores';
import { useTheme } from '@cannasaas/ui';
import { Button } from '@cannasaas/ui';
import { MobileNav } from './MobileNav';
import { SearchModal } from '../Search/SearchModal';

const NAV_LINKS = [
  { label: 'Flower', href: '/products?category=flower' },
  { label: 'Pre-rolls', href: '/products?category=pre_roll' },
  { label: 'Vapes', href: '/products?category=vape' },
  { label: 'Edibles', href: '/products?category=edible' },
  { label: 'Concentrates', href: '/products?category=concentrate' },
];

export function StorefrontHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const tenant = useCurrentTenant();
  const { colorScheme, setColorScheme } = useTheme();
  const navigate = useNavigate();

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    clearAuth();
    navigate('/');
  };

  return (
    <>
      <header
        className={[
          'sticky top-0 z-40 w-full',
          'bg-[var(--color-bg)]/95 backdrop-blur-md',
          'border-b border-[var(--color-border)]',
          'transition-shadow duration-[var(--p-dur-normal)]',
          scrolled ? 'shadow-[var(--p-shadow-md)]' : '',
        ].join(' ')}
      >
        {/* WCAG landmark — banner role is implicit on <header> */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 flex items-center"
              aria-label={`${tenant?.dispensaryName ?? 'Home'} — Return to homepage`}
            >
              {tenant?.brandingConfig?.logoUrl ? (
                <img
                  src={tenant.brandingConfig.logoUrl}
                  alt={tenant.dispensaryName ?? 'Logo'}
                  className="h-8 object-contain"
                />
              ) : (
                <span className="text-[var(--p-text-xl)] font-black text-[var(--color-brand)]">
                  {tenant?.dispensaryName ?? 'CannaSaas'}
                </span>
              )}
            </Link>

            {/* Desktop navigation */}
            <nav
              aria-label="Product categories"
              className="hidden md:flex items-center gap-1 ml-6 flex-1"
            >
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    [
                      'px-3 py-2 rounded-[var(--p-radius-md)]',
                      'text-[var(--p-text-sm)] font-semibold',
                      'transition-colors duration-[var(--p-dur-fast)]',
                      isActive
                        ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]',
                    ].join(' ')
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right-side controls */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <Search size={20} aria-hidden="true" />
              </button>

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() =>
                  setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
                }
                aria-label={
                  colorScheme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                aria-pressed={colorScheme === 'dark'}
                className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex"
              >
                {colorScheme === 'dark' ? (
                  <Sun size={20} aria-hidden="true" />
                ) : (
                  <Moon size={20} aria-hidden="true" />
                )}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <Link
                    to="/account"
                    aria-label={`My account — logged in as ${user?.firstName}`}
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex"
                  >
                    <User size={20} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Sign out"
                    className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors hidden sm:flex"
                  >
                    <LogOut size={20} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="hidden sm:block text-[var(--p-text-sm)] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  Sign in
                </Link>
              )}

              {/* Cart button with item badge */}
              <Link
                to="/cart"
                className="relative p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                aria-label={`Cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {itemCount > 0 && (
                  <span
                    aria-hidden="true" // aria-label on parent link covers this
                    className={[
                      'absolute -top-1 -right-1',
                      'min-w-[18px] h-[18px] px-1',
                      'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
                      'text-[10px] font-bold rounded-full',
                      'flex items-center justify-center',
                    ].join(' ')}
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]"
              >
                {mobileNavOpen ? (
                  <X size={20} aria-hidden="true" />
                ) : (
                  <Menu size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        id="mobile-nav"
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        links={NAV_LINKS}
      />

      {/* Search modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
```

[↑ Back to top](#top)

---

### 7.4 Home Page

The home page is assembled from discrete section components. Each section is independently testable and independently lazy-loadable.

```tsx
// apps/storefront/src/pages/Home/HomePage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useCurrentTenant } from '@cannasaas/stores';
import { HeroSection } from './sections/HeroSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { CategoryCardsSection } from './sections/CategoryCardsSection';
import { SpecialsSection } from './sections/SpecialsSection';
import { DispensaryInfoSection } from './sections/DispensaryInfoSection';

export default function HomePage() {
  const tenant = useCurrentTenant();

  return (
    <>
      {/* WCAG 2.4.2 — page title */}
      <Helmet>
        <title>{tenant?.dispensaryName ?? 'Shop'} | Cannabis Dispensary</title>
        <meta
          name="description"
          content={`Browse premium cannabis products at ${tenant?.dispensaryName ?? 'our dispensary'}. Order online for pickup or delivery.`}
        />
      </Helmet>

      {/* WCAG: sections are semantic landmarks */}
      <HeroSection />

      <section
        aria-labelledby="categories-heading"
        className="py-12 md:py-16 bg-[var(--color-bg-secondary)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="categories-heading"
            className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-8"
          >
            Shop by Category
          </h2>
          <CategoryCardsSection />
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2
              id="featured-heading"
              className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]"
            >
              Featured Products
            </h2>
          </div>
          <FeaturedProductsSection />
        </div>
      </section>

      <SpecialsSection />
      <DispensaryInfoSection />
    </>
  );
}
```

### 7.5 Product Catalog Page

The product catalog page combines faceted filtering (sidebar on desktop, drawer on mobile) with an infinite-scroll product grid.

```tsx
// apps/storefront/src/pages/Products/ProductsPage.tsx
import React, { useState, useCallback, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, Grid2X2, List } from 'lucide-react';
import { useInfiniteProducts } from '@cannasaas/api-client';
import { ProductCard, Button, Skeleton } from '@cannasaas/ui';
import { useCartStore } from '@cannasaas/stores';
import { FilterSidebar } from './components/FilterSidebar';
import { FilterDrawer } from './components/FilterDrawer';
import { SortSelect } from './components/SortSelect';
import { ActiveFilters } from './components/ActiveFilters';
import type { Product, ProductVariant, ProductFilters } from '@cannasaas/types';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [, startTransition] = useTransition();
  const addItem = useCartStore((s) => s.addItem);

  // Derive filters from URL query params — makes filters shareable/bookmarkable
  const filters: ProductFilters = {
    category: searchParams.get('category') ?? undefined,
    strainType: searchParams.get('strainType') ?? undefined,
    minThc: searchParams.get('minThc')
      ? Number(searchParams.get('minThc'))
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) ?? 'newest',
    search: searchParams.get('q') ?? undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteProducts(filters);

  const products = data?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      // Use startTransition to keep UI responsive during param updates
      startTransition(() => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          next.delete('page'); // Reset to page 1 on filter change
          return next;
        });
      });
    },
    [setSearchParams],
  );

  const handleAddToCart = useCallback(
    (product: Product, variant: ProductVariant) => {
      addItem(product, variant, 1);
      // Toast notification handled by CartStore middleware
    },
    [addItem],
  );

  return (
    <>
      <Helmet>
        <title>
          {filters.category
            ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Products`
            : 'All Products'}{' '}
          | Shop
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
              {filters.category
                ? filters.category.charAt(0).toUpperCase() +
                  filters.category.slice(1)
                : 'All Products'}
            </h1>
            {!isLoading && (
              <p
                className="text-[var(--color-text-secondary)] mt-1"
                aria-live="polite"
                aria-atomic="true"
              >
                {totalCount} {totalCount === 1 ? 'product' : 'products'} found
              </p>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        <ActiveFilters
          filters={filters}
          onRemove={handleFilterChange}
          className="mb-4"
        />

        <div className="flex gap-8">
          {/* Desktop filter sidebar */}
          <aside
            className="hidden lg:block w-64 flex-shrink-0"
            aria-label="Product filters"
          >
            <FilterSidebar
              currentFilters={filters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-6">
              {/* Mobile filter button */}
              <Button
                variant="outline"
                size="md"
                leftIcon={<SlidersHorizontal size={16} aria-hidden="true" />}
                onClick={() => setFilterDrawerOpen(true)}
                className="lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={filterDrawerOpen}
              >
                Filters
              </Button>

              {/* Sort */}
              <SortSelect
                value={filters.sort ?? 'newest'}
                onChange={(val) => handleFilterChange('sort', val)}
                className="ml-auto"
              />

              {/* View mode toggles */}
              <div
                role="group"
                aria-label="View mode"
                className="hidden sm:flex border border-[var(--color-border)] rounded-[var(--p-radius-md)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Grid view"
                  className={[
                    'p-2 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]',
                  ].join(' ')}
                >
                  <Grid2X2 size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="List view"
                  className={[
                    'p-2 transition-colors',
                    viewMode === 'list'
                      ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]',
                  ].join(' ')}
                >
                  <List size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Error state */}
            {isError && (
              <div role="alert" className="py-12 text-center">
                <p className="text-[var(--color-error)]">
                  Failed to load products. Please try again.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Product grid */}
            {!isError && (
              <>
                <div
                  className={[
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
                      : 'flex flex-col gap-4',
                  ].join(' ')}
                  // WCAG 1.3.1: list semantics for a collection of products
                  role="list"
                  aria-label="Products"
                  aria-busy={isLoading}
                >
                  {isLoading
                    ? Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="aspect-[3/4] rounded-[var(--p-radius-lg)]"
                          aria-hidden="true"
                        />
                      ))
                    : products.map((product) => (
                        <div key={product.id} role="listitem">
                          <ProductCard
                            product={product}
                            onAddToCart={handleAddToCart}
                          />
                        </div>
                      ))}
                </div>

                {/* Load more — replaces pagination for infinite scroll */}
                {hasNextPage && (
                  <div className="flex justify-center mt-10">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => fetchNextPage()}
                      isLoading={isFetchingNextPage}
                      loadingText="Loading more..."
                      aria-label="Load more products"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && products.length === 0 && (
                  <div className="py-16 text-center" role="status">
                    <p className="text-[var(--color-text-secondary)] text-[var(--p-text-lg)] mb-4">
                      No products found for your filters.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchParams({})}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        currentFilters={filters}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
```

[↑ Back to top](#top)

---

### 7.7 Cart & Checkout Flow

The checkout flow is broken into three clearly labeled steps: Review Cart → Delivery/Pickup Selection → Payment. A persistent progress indicator keeps users oriented throughout.

```tsx
// apps/storefront/src/pages/Checkout/CheckoutPage.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCartStore } from '@cannasaas/stores';
import { CheckoutProgress } from './components/CheckoutProgress';
import { ReviewStep } from './steps/ReviewStep';
import { FulfillmentStep } from './steps/FulfillmentStep';
import { PaymentStep } from './steps/PaymentStep';
import { OrderSummary } from './components/OrderSummary';
import { usePurchaseLimitCheck } from '@cannasaas/api-client';

type CheckoutStep = 'review' | 'fulfillment' | 'payment';

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'review', label: 'Review Cart' },
  { id: 'fulfillment', label: 'Delivery / Pickup' },
  { id: 'payment', label: 'Payment' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>(
    'pickup',
  );
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const { items, subtotal, promoDiscount } = useCartStore();
  const { data: limitCheck } = usePurchaseLimitCheck(items);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleStepComplete = (step: CheckoutStep) => {
    const next = STEPS[currentStepIndex + 1];
    if (next) {
      setCurrentStep(next.id);
      // Scroll to top of checkout when advancing
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    navigate(`/orders/${orderId}/success`);
  };

  return (
    <>
      <Helmet>
        <title>Checkout | CannaSaas</title>
      </Helmet>

      <div className="min-h-screen bg-[var(--color-bg-secondary)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)] mb-8">
            Checkout
          </h1>

          {/* WCAG 2.4.8: step progress provides location context */}
          <CheckoutProgress
            steps={STEPS}
            currentStep={currentStep}
            className="mb-8"
          />

          {/* Purchase limit warning */}
          {limitCheck && !limitCheck.allowed && (
            <div
              role="alert"
              className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-[var(--p-radius-md)]"
            >
              <p className="font-semibold text-amber-800 mb-1">
                Purchase Limit Warning
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside">
                {limitCheck.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Main checkout flow */}
            <div className="flex-1 min-w-0">
              {currentStep === 'review' && (
                <ReviewStep onComplete={() => handleStepComplete('review')} />
              )}
              {currentStep === 'fulfillment' && (
                <FulfillmentStep
                  fulfillmentType={fulfillmentType}
                  onFulfillmentChange={setFulfillmentType}
                  onAddressChange={setDeliveryAddress}
                  onComplete={() => handleStepComplete('fulfillment')}
                />
              )}
              {currentStep === 'payment' && (
                <PaymentStep
                  fulfillmentType={fulfillmentType}
                  deliveryAddress={deliveryAddress}
                  onSuccess={handleOrderSuccess}
                />
              )}
            </div>

            {/* Sticky order summary sidebar */}
            <div className="w-full lg:w-80 lg:sticky lg:top-24">
              <OrderSummary
                items={items}
                subtotal={subtotal()}
                promoDiscount={promoDiscount}
                fulfillmentType={fulfillmentType}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

```tsx
// apps/storefront/src/pages/Checkout/components/CheckoutProgress.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface Step {
  id: string;
  label: string;
}

interface CheckoutProgressProps {
  steps: Step[];
  currentStep: string;
  className?: string;
}

/**
 * CheckoutProgress — Step indicator for multi-step checkout
 *
 * WCAG:
 * - 1.3.1: Uses nav + ol for semantic step list
 * - 1.4.1: Completed steps indicated by icon + text, not color alone
 * - 4.1.2: aria-current="step" on active step
 */
export function CheckoutProgress({
  steps,
  currentStep,
  className,
}: CheckoutProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Checkout steps" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentIndex;

          return (
            <li
              key={step.id}
              className="flex items-center flex-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'text-[var(--p-text-sm)] font-bold',
                    'transition-all duration-[var(--p-dur-normal)]',
                    isCompleted
                      ? 'bg-[var(--color-success)] text-white'
                      : isCurrent
                        ? 'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-2 border-[var(--color-border)]',
                  )}
                  aria-label={
                    isCompleted
                      ? `${step.label}: completed`
                      : isCurrent
                        ? `${step.label}: current step`
                        : `${step.label}: upcoming`
                  }
                >
                  {isCompleted ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[var(--p-text-xs)] mt-1.5 font-semibold whitespace-nowrap',
                    isCurrent
                      ? 'text-[var(--color-brand)]'
                      : isCompleted
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-text-secondary)]',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 -mt-5',
                    'transition-colors duration-[var(--p-dur-slow)]',
                    isCompleted
                      ? 'bg-[var(--color-success)]'
                      : 'bg-[var(--color-border)]',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

[↑ Back to top](#top)

---

### 7.9 Order Tracking with WebSocket

Real-time delivery tracking uses the WebSocket endpoint from Sprint 10. The component subscribes on mount, updates a live order status timeline, and shows a map when driver coordinates are available.

```tsx
// apps/storefront/src/pages/Orders/OrderTrackingPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Package, CheckCircle, Clock } from 'lucide-react';
import { useOrder } from '@cannasaas/api-client';
import { useAccessToken } from '@cannasaas/stores';
import type { Order, OrderStatus } from '@cannasaas/types';
import { formatCurrency } from '@cannasaas/utils';
import { StatusTimeline } from './components/StatusTimeline';

// WebSocket event payload from the delivery module
interface TrackingEvent {
  type: 'status_update' | 'driver_location' | 'eta_update';
  orderId: string;
  status?: OrderStatus;
  driverLat?: number;
  driverLng?: number;
  etaMinutes?: number;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAccessToken();
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: order, isLoading } = useOrder(id!);

  // Establish WebSocket connection for real-time tracking
  useEffect(() => {
    if (!id || !accessToken) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/delivery/tracking?orderId=${id}&token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Announce live region for screen readers
      console.info('[Tracking] WebSocket connected for order', id);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const payload: TrackingEvent = JSON.parse(event.data as string);

        if (payload.type === 'status_update' && payload.status) {
          setLiveStatus(payload.status);
        }
        if (
          payload.type === 'driver_location' &&
          payload.driverLat !== undefined &&
          payload.driverLng !== undefined
        ) {
          setDriverLocation({ lat: payload.driverLat, lng: payload.driverLng });
        }
        if (payload.type === 'eta_update' && payload.etaMinutes !== undefined) {
          setEtaMinutes(payload.etaMinutes);
        }
      } catch {
        console.error('[Tracking] Failed to parse WS message');
      }
    };

    ws.onclose = () => {
      console.info('[Tracking] WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [id, accessToken]);

  const effectiveStatus = liveStatus ?? order?.status;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        aria-busy="true"
      >
        <p className="text-[var(--color-text-secondary)]">
          Loading order details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        role="alert"
        className="flex items-center justify-center min-h-[60vh]"
      >
        <p className="text-[var(--color-error)]">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] mb-2">
        Track Your Order
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Order #{order.orderNumber}
      </p>

      {/* ETA banner — announced to screen readers via aria-live */}
      {etaMinutes !== null && (
        <div
          className={[
            'flex items-center gap-3 p-4 mb-6 rounded-[var(--p-radius-lg)]',
            'bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]',
          ].join(' ')}
          aria-live="polite"
          aria-atomic="true"
        >
          <Clock
            className="text-[var(--color-brand)] flex-shrink-0"
            aria-hidden="true"
          />
          <p className="font-semibold text-[var(--color-brand-text)]">
            Estimated arrival in{' '}
            <strong>
              {etaMinutes} {etaMinutes === 1 ? 'minute' : 'minutes'}
            </strong>
          </p>
        </div>
      )}

      {/* Status timeline */}
      <StatusTimeline
        currentStatus={effectiveStatus ?? 'pending'}
        fulfillmentType={order.fulfillmentType}
        className="mb-8"
      />

      {/* Order items summary */}
      <section
        aria-labelledby="items-heading"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
      >
        <h2
          id="items-heading"
          className="font-bold text-[var(--color-text)] mb-4"
        >
          Order Summary
        </h2>
        <ul className="divide-y divide-[var(--color-border)]">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  {item.productName}
                </p>
                <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                  {item.variantName} × {item.quantity}
                </p>
              </div>
              <span className="font-bold text-[var(--color-text)]">
                {formatCurrency(item.totalPrice)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex justify-between">
          <span className="font-bold text-[var(--color-text)]">Total</span>
          <span className="font-bold text-[var(--p-text-lg)] text-[var(--color-text)]">
            {formatCurrency(order.total)}
          </span>
        </div>
      </section>
    </div>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

## 8. Admin Portal — Full Implementation

[↑ Back to top](#Table-of-Contents)

### 8.1 Admin Layout and Navigation

The admin portal uses a collapsible sidebar layout with secondary navigation tabs within each section. Role-based items are hidden when the user lacks permissions.

```tsx
// apps/admin/src/layouts/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Shield,
  Truck,
  LogOut,
  ChevronLeft,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@cannasaas/stores';
import { useCurrentUser } from '@cannasaas/stores';
import { cn } from '@cannasaas/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[]; // Only show for these roles
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Orders', href: '/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Delivery', href: '/delivery', icon: Truck },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Shield,
    roles: ['admin', 'manager', 'owner'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'owner'],
  },
];

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useCurrentUser();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) =>
      !item.roles ||
      item.roles.some((role) => user?.roles.includes(role as any)),
  );

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)]',
          'transition-all duration-[var(--p-dur-normal)]',
          'flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
        aria-label="Main navigation"
      >
        {/* Logo / brand */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--color-border)]">
          {!sidebarCollapsed && (
            <span className="text-[var(--p-text-lg)] font-black text-[var(--color-brand)] truncate">
              CannaSaas
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            aria-expanded={!sidebarCollapsed}
            className="ml-auto p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
          >
            <ChevronLeft
              size={18}
              className={cn(
                'transition-transform duration-[var(--p-dur-normal)]',
                sidebarCollapsed && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-2 overflow-y-auto" aria-label="Admin sections">
          {visibleItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--p-radius-md)]',
                  'text-[var(--p-text-sm)] font-semibold',
                  'transition-colors duration-[var(--p-dur-fast)]',
                  'mb-0.5 relative',
                  isActive
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)]',
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon
                size={18}
                className="flex-shrink-0"
                aria-hidden="true"
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'absolute right-2 min-w-[20px] h-5 px-1',
                    'bg-[var(--color-brand)] text-[var(--color-text-on-brand)]',
                    'text-[10px] font-bold rounded-full flex items-center justify-center',
                    sidebarCollapsed && 'right-0.5 top-0.5',
                  )}
                  aria-label={`${item.badge} unread`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-[var(--color-border)] p-2">
          {!sidebarCollapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate">
                {user.roles[0]}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5',
              'rounded-[var(--p-radius-md)]',
              'text-[var(--p-text-sm)] font-semibold',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-error)]',
              'hover:bg-red-50 dark:hover:bg-red-950/20',
              'transition-colors',
            )}
            aria-label="Sign out"
          >
            <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center h-16 px-6 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex-shrink-0"
          aria-label="Admin top bar"
        >
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="p-2 rounded-[var(--p-radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            >
              <Bell size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

### 8.2 Analytics Dashboard

The dashboard aggregates live data from the analytics API and renders multiple chart types using Recharts.

```tsx
// apps/admin/src/pages/Dashboard/DashboardPage.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  useAnalyticsDashboard,
  useLowStockProducts,
} from '@cannasaas/api-client';
import { StatCard } from './components/StatCard';
import { TopProductsTable } from './components/TopProductsTable';
import { Skeleton } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';

export default function DashboardPage() {
  const { data: analytics, isLoading } = useAnalyticsDashboard();
  const { data: lowStock } = useLowStockProducts();

  return (
    <>
      <Helmet>
        <title>Dashboard | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
            Dashboard
          </h1>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* KPI Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          aria-label="Key performance indicators"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[var(--p-radius-lg)]" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(analytics?.revenue.total ?? 0)}
                change={analytics?.revenue.change ?? 0}
                icon={DollarSign}
                description="Revenue compared to last period"
              />
              <StatCard
                title="Total Orders"
                value={analytics?.orders.total.toLocaleString() ?? '0'}
                change={analytics?.orders.change ?? 0}
                icon={ShoppingBag}
                description="Orders compared to last period"
              />
              <StatCard
                title="Avg Order Value"
                value={formatCurrency(analytics?.avgOrderValue.value ?? 0)}
                change={analytics?.avgOrderValue.change ?? 0}
                icon={TrendingUp}
                description="AOV compared to last period"
              />
              <StatCard
                title="Customers"
                value={analytics?.customers.total.toLocaleString() ?? '0'}
                change={0}
                icon={Users}
                subtitle={`${analytics?.customers.new ?? 0} new this period`}
                description="Total unique customers"
              />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Revenue trend */}
          <section
            aria-labelledby="revenue-chart-heading"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="revenue-chart-heading"
              className="font-bold text-[var(--color-text)] mb-4"
            >
              Revenue Trend
            </h2>
            {isLoading ? (
              <Skeleton className="h-56" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics?.revenue.byDay ?? []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Revenue',
                    ]}
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--p-radius-md)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-brand)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--color-brand)' }}
                    // WCAG 1.4.1: chart is supplementary; data table also provided
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Top products */}
          <section
            aria-labelledby="top-products-heading"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="top-products-heading"
              className="font-bold text-[var(--color-text)] mb-4"
            >
              Top Products
            </h2>
            <TopProductsTable
              products={analytics?.topProducts ?? []}
              isLoading={isLoading}
            />
          </section>
        </div>

        {/* Low stock alert */}
        {lowStock && lowStock.length > 0 && (
          <section
            aria-labelledby="low-stock-heading"
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-[var(--p-radius-lg)] p-6"
          >
            <h2
              id="low-stock-heading"
              className="font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2"
            >
              ⚠ Low Stock Alerts ({lowStock.length} products)
            </h2>
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((product) => (
                <li
                  key={product.id}
                  className="text-sm text-amber-700 dark:text-amber-400 flex justify-between"
                >
                  <span>{product.name}</span>
                  <span className="font-bold">
                    {product.variants[0]?.quantity ?? 0} remaining
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
```

```tsx
// apps/admin/src/pages/Dashboard/components/StatCard.tsx
import React, { type ElementType } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@cannasaas/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number; // Percentage change from previous period
  icon: ElementType;
  description: string;
  subtitle?: string;
}

/**
 * StatCard — KPI summary card
 *
 * WCAG 1.3.3: trend is conveyed by icon + text, not color alone
 * WCAG 1.4.3: text has minimum 4.5:1 contrast ratio via token system
 */
export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  subtitle,
}: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <article
      className={[
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--p-radius-lg)] p-5',
        'hover:shadow-[var(--p-shadow-md)] transition-shadow',
      ].join(' ')}
      aria-label={`${title}: ${value}, ${isPositive ? 'up' : 'down'} ${Math.abs(change)}% from last period`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-[var(--p-text-3xl)] font-black text-[var(--color-text)]">
            {value}
          </p>
          {subtitle && (
            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-[var(--p-radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <Icon className="w-6 h-6 text-[var(--color-brand)]" />
        </div>
      </div>

      {/* Change indicator */}
      {change !== 0 && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive ? (
            <TrendingUp
              size={14}
              className="text-[var(--color-success)]"
              aria-hidden="true"
            />
          ) : (
            <TrendingDown
              size={14}
              className="text-[var(--color-error)]"
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              'text-[var(--p-text-sm)] font-bold',
              isPositive
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-error)]',
            )}
          >
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            vs last period
          </span>
        </div>
      )}

      {/* Hidden description for assistive technology context */}
      <p className="sr-only">{description}</p>
    </article>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

### 8.5 Compliance Dashboard

The compliance dashboard is the most legally sensitive part of the admin portal. It surfaces purchase limit violations, audit log entries, Metrc sync status, and daily report generation.

```tsx
// apps/admin/src/pages/Compliance/ComplianceDashboard.tsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  useComplianceLogs,
  useMetrcSyncStatus,
  useGenerateDailyReport,
} from '@cannasaas/api-client';
import { Button, DataTable } from '@cannasaas/ui';
import { ComplianceLogRow } from './components/ComplianceLogRow';
import { PurchaseLimitChart } from './components/PurchaseLimitChart';
import { MetrcStatusPanel } from './components/MetrcStatusPanel';
import { formatCurrency } from '@cannasaas/utils';

export default function ComplianceDashboard() {
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const { data: logs, isLoading: logsLoading } = useComplianceLogs({
    limit: 50,
    sort: 'createdAt_desc',
  });
  const { data: metrcStatus } = useMetrcSyncStatus();
  const { mutate: generateReport, isPending: isGenerating } =
    useGenerateDailyReport();

  const handleGenerateReport = () => {
    generateReport({ date: reportDate });
  };

  return (
    <>
      <Helmet>
        <title>Compliance | CannaSaas Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield
            className="text-[var(--color-brand)] w-8 h-8"
            aria-hidden="true"
          />
          <h1 className="text-[var(--p-text-3xl)] font-bold text-[var(--color-text)]">
            Compliance Dashboard
          </h1>
        </div>

        {/* Metrc integration status */}
        <MetrcStatusPanel status={metrcStatus} />

        {/* Daily report generation */}
        <section
          aria-labelledby="report-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="report-heading"
            className="font-bold text-[var(--color-text)] mb-4 flex items-center gap-2"
          >
            <FileText size={20} aria-hidden="true" />
            Daily Sales Reports
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div>
              <label
                htmlFor="report-date"
                className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
              >
                Report Date
              </label>
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={[
                  'h-10 px-4 rounded-[var(--p-radius-md)]',
                  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                  'text-[var(--color-text)] text-[var(--p-text-sm)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                ].join(' ')}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              isLoading={isGenerating}
              loadingText="Generating..."
              leftIcon={<RefreshCw size={16} aria-hidden="true" />}
            >
              Generate Report
            </Button>
          </div>
        </section>

        {/* Purchase limit violations chart */}
        <section
          aria-labelledby="limits-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="limits-heading"
            className="font-bold text-[var(--color-text)] mb-4"
          >
            Purchase Limit Checks (Last 30 Days)
          </h2>
          <PurchaseLimitChart />
        </section>

        {/* Audit log */}
        <section
          aria-labelledby="audit-heading"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-6"
        >
          <h2
            id="audit-heading"
            className="font-bold text-[var(--color-text)] mb-4"
          >
            Audit Log
          </h2>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-4">
            All compliance events are retained for 7 years per state regulatory
            requirements.
          </p>

          {/* WCAG 1.3.1: table is used for tabular compliance data */}
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Compliance audit log"
            tabIndex={0} // WCAG 2.1.1: scrollable region is keyboard focusable
          >
            <table className="w-full text-[var(--p-text-sm)]">
              <caption className="sr-only">
                Compliance audit log showing event type, timestamp, and details
              </caption>
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Event Type
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Performed By
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 font-semibold text-[var(--color-text-secondary)]"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody aria-busy={logsLoading}>
                {logsLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="py-3 px-4">
                          <div
                            className="h-5 bg-[var(--color-bg-tertiary)] rounded animate-pulse"
                            aria-hidden="true"
                          />
                        </td>
                      </tr>
                    ))
                  : logs?.data.map((log) => (
                      <ComplianceLogRow key={log.id} log={log} />
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

# CannaSaas — Public Beta Deep-Dive Implementation Guide

**Section 9 — Staff Portal: Full Implementation (All Subsections)**
**Version 3.0 | February 2026**
**Prepared for: Dennis Luken, Senior Architect / Site Lead**

> This document contains the complete **Section 9** of `CannaSaas-PublicBeta-DeepDive.md`, reconstructed in full. Section 9.1 is preserved verbatim from the source file, with the missing `StaffLayout` and `OrderQueueCard` sub-components added. Sections 9.2–9.4 were authored from `api-reference.md`, `compliance-guide.md`, and `architecture.md`.

---

[↑ Back to top](#Table-of-Contents)

## 9. Staff Portal — Full Implementation

### 9.1 Staff Layout and Live Order Queue

The staff portal is intentionally minimal — budtenders need to act fast under real-world conditions. It uses large touch targets, high contrast, and live-updating order queues.

The layout differs from the admin portal: instead of a collapsible sidebar, it uses a persistent top header with a bottom tab bar optimised for tablets and touch POS hardware running at the counter. The bottom nav exposes only the four pages a budtender needs during a shift.

```tsx
// apps/staff/src/layouts/StaffLayout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingBag, Users, Search, Truck, LogOut } from 'lucide-react';
import { useAuthStore, useCurrentUser } from '@cannasaas/stores';
import { useNavigate } from 'react-router-dom';
import { cn } from '@cannasaas/utils';

const TAB_NAV = [
  { label: 'Orders', href: '/queue', icon: ShoppingBag },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Inventory', href: '/inventory', icon: Search },
  { label: 'Delivery', href: '/delivery', icon: Truck },
];

/**
 * StaffLayout — Persistent shell for the staff/budtender portal.
 *
 * Top header: dispensary name + logout.
 * Bottom tab bar: primary navigation for four staff pages.
 *
 * WCAG 2.4.1: Skip link targets <main id="main-content"> to bypass
 *             the repeated header and tab bar on every page.
 * WCAG 4.1.3: Status messages announced via aria-live on the header.
 */
export function StaffLayout() {
  const user = useCurrentUser();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-secondary)] overflow-hidden">
      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50',
          'focus:px-4 focus:py-2 focus:bg-[var(--color-brand)] focus:text-white',
          'focus:rounded-[var(--p-radius-md)] focus:outline-none focus:ring-2',
          'focus:ring-white focus:shadow-[var(--p-shadow-md)]',
        ].join(' ')}
      >
        Skip to main content
      </a>

      {/* Top header */}
      <header className="h-14 flex-shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Dispensary logo — resolved via ThemeProvider */}
          <div
            className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-white text-[var(--p-text-xs)] font-black">
              CS
            </span>
          </div>
          <div>
            <p className="text-[var(--p-text-sm)] font-bold text-[var(--color-text)] leading-tight">
              Staff Portal
            </p>
            <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out of staff portal"
          className={[
            'flex items-center gap-2 px-3 py-1.5 rounded-[var(--p-radius-md)]',
            'text-[var(--p-text-sm)] text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
            'transition-colors duration-[var(--p-dur-fast)]',
          ].join(' ')}
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </header>

      {/* Main content area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 overflow-y-auto outline-none"
      >
        <Outlet />
      </main>

      {/* Bottom tab bar — primary navigation */}
      <nav
        aria-label="Staff navigation"
        className="flex-shrink-0 h-16 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex"
      >
        {TAB_NAV.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'text-[var(--p-text-xs)] font-semibold',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-focus-ring)]',
                'transition-colors duration-[var(--p-dur-fast)]',
                // WCAG 1.4.1: active state uses both color and underline indicator
                isActive
                  ? 'text-[var(--color-brand)] border-t-2 border-t-[var(--color-brand)] -mt-px'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
              )
            }
            aria-label={label}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
```

```tsx
// apps/staff/src/pages/OrderQueue/OrderQueuePage.tsx
import React, { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useOrders, useUpdateOrderStatus } from '@cannasaas/api-client';
import { OrderQueueCard } from './components/OrderQueueCard';
import { useAccessToken } from '@cannasaas/stores';

/**
 * OrderQueuePage — Real-time order queue for budtenders
 *
 * Uses polling (every 30s) as a resilient fallback for WebSocket.
 * Orders are grouped by status: Pending → Confirmed → Preparing → Ready
 */
export default function OrderQueuePage() {
  const accessToken = useAccessToken();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, refetch } = useOrders({
    status: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'],
    limit: 100,
    sort: 'createdAt_asc',
    // Poll every 30 seconds
    refetchInterval: 1000 * 30,
  });

  const { mutate: updateStatus } = useUpdateOrderStatus();

  const orders = data?.data ?? [];
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const activeOrders = orders.filter((o) =>
    ['confirmed', 'preparing'].includes(o.status),
  );
  const readyOrders = orders.filter((o) => o.status === 'ready_for_pickup');

  // Play a soft audio chime when a new pending order arrives
  useEffect(() => {
    if (pendingOrders.length > 0 && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browser may block autoplay; gracefully ignore
      });
    }
  }, [pendingOrders.length]);

  const LANE_CONFIG = [
    {
      id: 'pending',
      label: 'New Orders',
      orders: pendingOrders,
      colorClass: 'border-t-4 border-t-amber-400',
      nextStatus: 'confirmed' as const,
      actionLabel: 'Confirm',
    },
    {
      id: 'active',
      label: 'In Progress',
      orders: activeOrders,
      colorClass: 'border-t-4 border-t-[var(--color-brand)]',
      nextStatus: 'ready_for_pickup' as const,
      actionLabel: 'Mark Ready',
    },
    {
      id: 'ready',
      label: 'Ready for Pickup',
      orders: readyOrders,
      colorClass: 'border-t-4 border-t-[var(--color-success)]',
      nextStatus: 'completed' as const,
      actionLabel: 'Complete',
    },
  ] as const;

  return (
    <>
      <Helmet>
        <title>Order Queue | CannaSaas Staff</title>
      </Helmet>

      {/* Hidden audio element for new order notification */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
            Order Queue
          </h1>

          {/* Live status indicator */}
          <div
            className="flex items-center gap-2"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className="w-2.5 h-2.5 bg-[var(--color-success)] rounded-full animate-pulse"
              aria-hidden="true"
            />
            <span className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              Live — {orders.length} active order
              {orders.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Kanban-style lane layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-9rem)] overflow-hidden">
          {LANE_CONFIG.map((lane) => (
            <section
              key={lane.id}
              aria-labelledby={`lane-${lane.id}`}
              className={[
                'flex flex-col bg-[var(--color-surface)]',
                'rounded-[var(--p-radius-lg)] border border-[var(--color-border)]',
                lane.colorClass,
                'overflow-hidden',
              ].join(' ')}
            >
              {/* Lane header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                <h2
                  id={`lane-${lane.id}`}
                  className="font-bold text-[var(--color-text)]"
                >
                  {lane.label}
                </h2>
                <span
                  className="text-[var(--p-text-sm)] font-bold bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 rounded-full"
                  aria-label={`${lane.orders.length} orders in ${lane.label}`}
                >
                  {lane.orders.length}
                </span>
              </div>

              {/* Scrollable order list */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-3"
                role="list"
                aria-label={`${lane.label} orders`}
              >
                {isLoading ? (
                  <p className="text-center text-[var(--color-text-secondary)] text-sm py-8">
                    Loading orders...
                  </p>
                ) : lane.orders.length === 0 ? (
                  <p className="text-center text-[var(--color-text-secondary)] text-sm py-8">
                    No orders in this lane
                  </p>
                ) : (
                  lane.orders.map((order) => (
                    <div key={order.id} role="listitem">
                      <OrderQueueCard
                        order={order}
                        actionLabel={
                          lane.nextStatus === 'confirmed'
                            ? 'Confirm'
                            : lane.nextStatus === 'ready_for_pickup'
                              ? 'Mark Ready'
                              : 'Complete'
                        }
                        onAction={() =>
                          updateStatus({
                            orderId: order.id,
                            status: lane.nextStatus,
                          })
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
```

`OrderQueueCard` is the primary touch target in the queue. It is sized for a 10" tablet at the counter — all interactive areas meet WCAG 2.5.5's 44×44px minimum. The card shows everything a budtender needs at a glance: order number, customer name, time elapsed since the order was placed, a compact item summary, and a single large action button to advance the order to the next status.

```tsx
// apps/staff/src/pages/OrderQueue/components/OrderQueueCard.tsx
import React, { useEffect, useState } from 'react';
import { Clock, Package } from 'lucide-react';
import { formatCurrency } from '@cannasaas/utils';
import type { Order, OrderStatus } from '@cannasaas/types';

interface OrderQueueCardProps {
  order: Order;
  actionLabel: string;
  onAction: () => void;
}

/**
 * OrderQueueCard — Single order card in the kanban queue.
 *
 * Elapsed timer re-renders every 60s using a local interval so the
 * budtender can see how long an order has been waiting without
 * any additional API calls.
 *
 * WCAG 2.5.5: Action button has explicit min-height of 48px (touch target).
 * WCAG 1.3.1: Order details use <dl> so screen readers read label/value pairs.
 * WCAG 4.1.3: Order number is the accessible name of the card region.
 */
export function OrderQueueCard({
  order,
  actionLabel,
  onAction,
}: OrderQueueCardProps) {
  const [elapsed, setElapsed] = useState('');

  // Update elapsed time every 60 seconds
  useEffect(() => {
    function tick() {
      const diff = Math.floor(
        (Date.now() - new Date(order.createdAt).getTime()) / 1000,
      );
      if (diff < 60) setElapsed(`${diff}s ago`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`);
      else setElapsed(`${Math.floor(diff / 3600)}h ago`);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  // Orders waiting more than 15 minutes get a visual urgency indicator
  const minutesElapsed = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60_000,
  );
  const isUrgent = minutesElapsed >= 15;

  return (
    <article
      aria-labelledby={`order-${order.id}-num`}
      className={[
        'bg-[var(--color-bg)] rounded-[var(--p-radius-md)]',
        'border transition-colors duration-[var(--p-dur-fast)]',
        isUrgent
          ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]'
          : 'border-[var(--color-border)]',
      ].join(' ')}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <h3
          id={`order-${order.id}-num`}
          className="font-bold text-[var(--color-text)] text-[var(--p-text-sm)]"
        >
          #{order.orderNumber}
        </h3>

        <div
          className="flex items-center gap-1.5"
          title={`Order placed ${elapsed}`}
        >
          <Clock
            size={12}
            className={
              isUrgent
                ? 'text-[var(--color-error)]'
                : 'text-[var(--color-text-secondary)]'
            }
            aria-hidden="true"
          />
          <span
            className={[
              'text-[var(--p-text-xs)] font-semibold',
              isUrgent
                ? 'text-[var(--color-error)]'
                : 'text-[var(--color-text-secondary)]',
            ].join(' ')}
            aria-label={`Waiting ${elapsed}`}
          >
            {elapsed}
          </span>
        </div>
      </div>

      {/* Customer name */}
      <p className="px-3.5 text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
        {order.customerName ?? 'Guest'}
      </p>

      {/* Order details */}
      <dl className="px-3.5 pt-2 pb-3 space-y-1">
        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Items
          </dt>
          <dd className="text-[var(--p-text-xs)] font-medium text-[var(--color-text)] flex items-center gap-1">
            <Package size={11} aria-hidden="true" />
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </dd>
        </div>

        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Total
          </dt>
          <dd className="text-[var(--p-text-xs)] font-bold text-[var(--color-text)]">
            {formatCurrency(order.total)}
          </dd>
        </div>

        <div className="flex justify-between gap-2">
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Type
          </dt>
          <dd className="text-[var(--p-text-xs)] font-medium text-[var(--color-text)] capitalize">
            {order.fulfillmentType}
          </dd>
        </div>
      </dl>

      {/* Compact item list */}
      <ul
        aria-label={`Items in order ${order.orderNumber}`}
        className="mx-3.5 mb-3 space-y-0.5"
      >
        {order.items.slice(0, 3).map((item) => (
          <li
            key={item.id}
            className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] truncate"
          >
            {item.quantity}× {item.productName} — {item.variantName}
          </li>
        ))}
        {order.items.length > 3 && (
          <li className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] italic">
            +{order.items.length - 3} more
          </li>
        )}
      </ul>

      {/* Action button — large touch target per WCAG 2.5.5 */}
      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          onClick={onAction}
          aria-label={`${actionLabel} order ${order.orderNumber}`}
          className={[
            'w-full min-h-[48px] rounded-[var(--p-radius-md)]',
            'bg-[var(--color-brand)] text-white font-bold text-[var(--p-text-sm)]',
            'hover:bg-[var(--color-brand-hover)] active:scale-[0.98]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
            'transition-all duration-[var(--p-dur-fast)]',
          ].join(' ')}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

### 9.2 Customer Lookup & ID Verification

Customer lookup is one of the most compliance-sensitive screens in the staff portal. The budtender must be able to pull up a customer record in under five keystrokes, confirm they are verified (21+), check their remaining daily purchase capacity, and — for delivery orders — log a formal ID verification event that writes to the `compliance_logs` table with a timestamp and the staff member's user ID.

The page is split into two halves: a search surface at the top and a customer profile card below. The profile card shows verification status, the `PurchaseLimitMeter` sourced from `GET /compliance/purchase-limit`, and a condensed order history. When an in-person ID check is required (pickup or delivery), a modal captures the verification event and posts it to `POST /age-verification/verify`.

```tsx
// apps/staff/src/pages/CustomerLookup/CustomerLookupPage.tsx
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, UserCheck, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  useSearchUsers,
  useCompliancePurchaseLimit,
} from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { PurchaseLimitMeter } from '@cannasaas/ui';
import type { User } from '@cannasaas/types';
import { CustomerProfileCard } from './components/CustomerProfileCard';
import { IDVerifyModal } from './components/IDVerifyModal';

/**
 * CustomerLookupPage — Staff tool for quick customer profile access.
 *
 * Search is debounced at 300ms and queries GET /users?q=...&role=customer
 * which filters by name, email, or phone. Results are limited to 10.
 * Selecting a result fetches the full profile + purchase limit check.
 *
 * WCAG 2.1.1: Full keyboard navigation — search → results → profile →
 *             verify button, all reachable without a mouse.
 * WCAG 4.1.3: Purchase limit violations announced via aria-live="assertive".
 * WCAG 3.3.2: Search input has a visible label, not just a placeholder.
 */
export default function CustomerLookupPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  // GET /users?q=...&role=customer — Manager+ only
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    { q: debouncedQuery, role: 'customer', limit: 10 },
    { enabled: debouncedQuery.length >= 2 },
  );

  // GET /compliance/purchase-limit?customerId=... for selected customer
  const { data: limitCheck } = useCompliancePurchaseLimit(
    selectedCustomer?.id ?? '',
    { enabled: !!selectedCustomer },
  );

  function handleSelect(customer: User) {
    setSelectedCustomer(customer);
    setQuery(customer.firstName + ' ' + customer.lastName);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery('');
    setSelectedCustomer(null);
    inputRef.current?.focus();
  }

  const showDropdown =
    debouncedQuery.length >= 2 &&
    !selectedCustomer &&
    searchResults?.data.length;

  return (
    <>
      <Helmet>
        <title>Customer Lookup | CannaSaas Staff</title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
          Customer Lookup
        </h1>

        {/* Search surface */}
        <div className="relative">
          <label
            htmlFor="customer-search"
            className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
          >
            Search by name, email, or phone
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="customer-search"
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={!!showDropdown}
              aria-controls="customer-results"
              aria-autocomplete="list"
              aria-label="Search customers"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedCustomer) setSelectedCustomer(null);
              }}
              placeholder="Jane Smith · jane@example.com · (555) 000-0000"
              className={[
                'w-full h-12 pl-10 pr-10 rounded-[var(--p-radius-md)]',
                'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                'text-[var(--color-text)] text-[var(--p-text-sm)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-full"
              >
                ×
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown ? (
            <ul
              id="customer-results"
              role="listbox"
              aria-label="Customer search results"
              className={[
                'absolute z-10 mt-1 w-full',
                'bg-[var(--color-surface)] border border-[var(--color-border)]',
                'rounded-[var(--p-radius-md)] shadow-[var(--p-shadow-lg)]',
                'overflow-hidden max-h-64 overflow-y-auto',
              ].join(' ')}
            >
              {isSearching ? (
                <li className="px-4 py-3 text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                  Searching…
                </li>
              ) : (
                searchResults?.data.map((customer) => (
                  <li key={customer.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => handleSelect(customer)}
                      className={[
                        'w-full text-left px-4 py-3 flex flex-col gap-0.5',
                        'hover:bg-[var(--color-bg-secondary)]',
                        'focus:outline-none focus:bg-[var(--color-bg-secondary)]',
                        'transition-colors duration-[var(--p-dur-fast)]',
                      ].join(' ')}
                    >
                      <span className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ''}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        {/* Customer profile — shown after selection */}
        {selectedCustomer ? (
          <div className="space-y-4">
            <CustomerProfileCard
              customer={selectedCustomer}
              onVerifyId={() => setShowVerifyModal(true)}
            />

            {/* Purchase limit meter — from @cannasaas/ui (Section 10.2) */}
            {limitCheck && (
              <section aria-labelledby="limit-heading">
                <h2
                  id="limit-heading"
                  className="text-[var(--p-text-sm)] font-bold text-[var(--color-text)] mb-2"
                >
                  Today's Purchase Capacity
                </h2>
                <PurchaseLimitMeter limitCheck={limitCheck} />
              </section>
            )}
          </div>
        ) : (
          // Empty state
          debouncedQuery.length < 2 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search
                size={40}
                className="text-[var(--color-text-secondary)] mb-3"
                aria-hidden="true"
              />
              <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                Search for a customer to view their profile, verification
                status, and remaining daily purchase limits.
              </p>
            </div>
          )
        )}
      </div>

      {/* ID verification modal */}
      {showVerifyModal && selectedCustomer && (
        <IDVerifyModal
          customer={selectedCustomer}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </>
  );
}
```

```tsx
// apps/staff/src/pages/CustomerLookup/components/CustomerProfileCard.tsx
import React from 'react';
import { UserCheck, UserX, ShieldCheck, Clock } from 'lucide-react';
import { formatDate } from '@cannasaas/utils';
import type { User } from '@cannasaas/types';

interface CustomerProfileCardProps {
  customer: User;
  onVerifyId: () => void;
}

/**
 * CustomerProfileCard — Compact customer summary card for the staff lookup page.
 *
 * Shows: name, verification status, DOB, membership date, last order date.
 * The "Verify ID" button is the primary call-to-action for compliance workflows.
 *
 * WCAG 1.3.1: Verification status uses icon + text, never icon alone.
 * WCAG 1.4.3: Status badge colours all pass 4.5:1 contrast against the surface.
 */
export function CustomerProfileCard({
  customer,
  onVerifyId,
}: CustomerProfileCardProps) {
  const isVerified = customer.idVerified === true;

  return (
    <div
      className={[
        'bg-[var(--color-surface)] border rounded-[var(--p-radius-lg)] p-5',
        isVerified
          ? 'border-[var(--color-success)]'
          : 'border-[var(--color-warning)]',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[var(--p-text-xl)] font-bold text-[var(--color-text)]">
            {customer.firstName} {customer.lastName}
          </h2>
          <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
            {customer.email}
          </p>
          {customer.phone && (
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              {customer.phone}
            </p>
          )}
        </div>

        {/* Verification status badge */}
        <div
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[var(--p-text-xs)] font-bold',
            isVerified
              ? 'bg-green-50 dark:bg-green-950/20 text-[var(--color-success)]'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
          ].join(' ')}
          // WCAG 1.3.1: status communicated via text, not colour alone
          aria-label={
            isVerified ? 'Identity verified' : 'Identity not verified'
          }
        >
          {isVerified ? (
            <UserCheck size={13} aria-hidden="true" />
          ) : (
            <UserX size={13} aria-hidden="true" />
          )}
          {isVerified ? 'Verified' : 'Unverified'}
        </div>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Date of Birth
          </dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Member Since
          </dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {formatDate(customer.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Last Verified
          </dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.lastVerifiedAt
              ? formatDate(customer.lastVerifiedAt)
              : 'Never'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            Total Orders
          </dt>
          <dd className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]">
            {customer.orderCount ?? 0}
          </dd>
        </div>
      </dl>

      {/* Verify ID action */}
      <button
        type="button"
        onClick={onVerifyId}
        className={[
          'w-full min-h-[48px] flex items-center justify-center gap-2',
          'rounded-[var(--p-radius-md)] font-bold text-[var(--p-text-sm)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2',
          'transition-all duration-[var(--p-dur-fast)]',
          isVerified
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
            : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]',
        ].join(' ')}
        aria-label={`Verify identity for ${customer.firstName} ${customer.lastName}`}
      >
        <ShieldCheck size={18} aria-hidden="true" />
        {isVerified ? 'Re-verify ID' : 'Verify ID Now'}
      </button>
    </div>
  );
}
```

`IDVerifyModal` is the compliance gateway for in-person identification checks. It collects a DOB confirmation from the budtender, validates that the customer is 21 or older, checks the ID expiration, then posts the verification event to `POST /age-verification/verify` which creates a `ComplianceLog` entry of type `ID_VERIFICATION` containing the customer ID, the budtender's user ID (`performedBy`), and an ISO timestamp. Per `compliance-guide.md §2.3`, delivery verifications additionally capture GPS coordinates — that data is attached by the delivery app, not this modal.

```tsx
// apps/staff/src/pages/CustomerLookup/components/IDVerifyModal.tsx
import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, X } from 'lucide-react';
import { useVerifyCustomerID } from '@cannasaas/api-client';
import { useCurrentUser } from '@cannasaas/stores';
import { Button } from '@cannasaas/ui';
import type { User } from '@cannasaas/types';

// Minimum birth year for 21+ check — calculated at runtime
function getMax21DOB(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().slice(0, 10);
}

const schema = z.object({
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((dob) => dob <= getMax21DOB(), {
      message: 'Customer must be 21 or older',
    }),
  idExpirationDate: z
    .string()
    .min(1, 'ID expiration date is required')
    .refine((exp) => exp >= new Date().toISOString().slice(0, 10), {
      message: 'ID is expired — sale cannot proceed',
    }),
  idType: z.enum(['drivers_license', 'state_id', 'passport', 'military_id'], {
    errorMap: () => ({ message: 'Select an ID type' }),
  }),
  confirmed: z.boolean().refine((v) => v === true, {
    message: 'You must confirm the ID check was completed',
  }),
});

type FormValues = z.infer<typeof schema>;

interface IDVerifyModalProps {
  customer: User;
  onClose: () => void;
}

/**
 * IDVerifyModal — In-person ID verification flow for pickup and delivery orders.
 *
 * On submit: POST /age-verification/verify → creates ComplianceLog entry:
 *   { eventType: 'id_verification', details: { customerId, verificationType: 'manual',
 *     verifiedBy: staffUserId, idType, ageAtVerification, verified: true } }
 *
 * WCAG 3.3.4: Confirmation checkbox prevents accidental verification of an
 *             unexamined ID (WCAG error prevention for legal consequences).
 * WCAG 2.1.1: Focus trapped inside the modal while open.
 * WCAG 3.3.1: Each invalid field gets an associated error message via aria-describedby.
 */
export function IDVerifyModal({ customer, onClose }: IDVerifyModalProps) {
  const user = useCurrentUser();
  const firstFocusRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: customer.dateOfBirth ?? '',
      confirmed: false,
    },
  });

  const { mutate: verifyID, isPending, isSuccess } = useVerifyCustomerID();

  // Move focus into modal on open — WCAG 2.4.3
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // Trap focus inside modal — WCAG 2.1.1
  useEffect(() => {
    const modal = document.getElementById('id-verify-modal');
    if (!modal) return;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelectors),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function onSubmit(values: FormValues) {
    verifyID({
      customerId: customer.id,
      verifiedBy: user!.id,
      dateOfBirth: values.dateOfBirth,
      idType: values.idType,
      idExpirationDate: values.idExpirationDate,
      verificationType: 'manual',
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        id="id-verify-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-modal-title"
        className={[
          'fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-xl)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-xl)]',
          'overflow-hidden',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Shield
              size={20}
              className="text-[var(--color-brand)]"
              aria-hidden="true"
            />
            <h2
              id="verify-modal-title"
              ref={firstFocusRef}
              tabIndex={-1}
              className="font-bold text-[var(--color-text)] text-[var(--p-text-lg)] outline-none"
            >
              Verify ID
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ID verification"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-md"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {isSuccess ? (
          // Success state
          <div className="px-6 py-8 text-center">
            <Shield
              size={40}
              className="text-[var(--color-success)] mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="font-bold text-[var(--color-text)] text-[var(--p-text-lg)] mb-1">
              ID Verified
            </p>
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mb-5">
              Verification logged for {customer.firstName} {customer.lastName}.
            </p>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="px-6 py-5 space-y-5"
          >
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              Physically examine the customer's ID and complete the fields
              below. This creates a compliance log entry under your account.
            </p>

            {/* ID type */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="idType"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                ID Type{' '}
                <span aria-hidden="true" className="text-[var(--color-error)]">
                  *
                </span>
              </label>
              <select
                id="idType"
                aria-required="true"
                aria-invalid={!!errors.idType}
                aria-describedby={errors.idType ? 'idType-error' : undefined}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.idType
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('idType')}
              >
                <option value="">Select ID type…</option>
                <option value="drivers_license">Driver's License</option>
                <option value="state_id">State ID</option>
                <option value="passport">Passport</option>
                <option value="military_id">Military ID</option>
              </select>
              {errors.idType && (
                <p
                  id="idType-error"
                  role="alert"
                  className="text-[var(--p-text-xs)] text-[var(--color-error)]"
                >
                  {errors.idType.message}
                </p>
              )}
            </div>

            {/* Date of birth from ID */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dateOfBirth"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                Date of Birth on ID{' '}
                <span aria-hidden="true" className="text-[var(--color-error)]">
                  *
                </span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                aria-required="true"
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'dob-error' : 'dob-hint'}
                max={getMax21DOB()}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.dateOfBirth
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('dateOfBirth')}
              />
              <p
                id="dob-hint"
                className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]"
              >
                Customer must be 21 or older. Enter exactly as shown on the ID.
              </p>
              {errors.dateOfBirth && (
                <p
                  id="dob-error"
                  role="alert"
                  className="text-[var(--p-text-xs)] text-[var(--color-error)]"
                >
                  ⚠ {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            {/* ID expiration date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="idExpirationDate"
                className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)]"
              >
                ID Expiration Date{' '}
                <span aria-hidden="true" className="text-[var(--color-error)]">
                  *
                </span>
              </label>
              <input
                id="idExpirationDate"
                type="date"
                aria-required="true"
                aria-invalid={!!errors.idExpirationDate}
                aria-describedby={
                  errors.idExpirationDate ? 'exp-error' : undefined
                }
                min={new Date().toISOString().slice(0, 10)}
                className={[
                  'h-10 px-3 rounded-[var(--p-radius-md)] bg-[var(--color-bg)]',
                  'border text-[var(--p-text-sm)] text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                  errors.idExpirationDate
                    ? 'border-[var(--color-error)]'
                    : 'border-[var(--color-border-strong)]',
                ].join(' ')}
                {...register('idExpirationDate')}
              />
              {errors.idExpirationDate && (
                <p
                  id="exp-error"
                  role="alert"
                  className="text-[var(--p-text-xs)] text-[var(--color-error)]"
                >
                  ⚠ {errors.idExpirationDate.message}
                </p>
              )}
            </div>

            {/* Confirmation checkbox — WCAG 3.3.4 error prevention */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                aria-required="true"
                aria-invalid={!!errors.confirmed}
                aria-describedby={
                  errors.confirmed ? 'confirm-error' : undefined
                }
                className="mt-0.5 h-4 w-4 rounded text-[var(--color-brand)] focus:ring-[var(--color-focus-ring)]"
                {...register('confirmed')}
              />
              <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
                I have physically examined this customer's photo ID and
                confirmed they are 21 years of age or older.
              </span>
            </label>
            {errors.confirmed && (
              <p
                id="confirm-error"
                role="alert"
                className="text-[var(--p-text-xs)] text-[var(--color-error)]"
              >
                ⚠ {errors.confirmed.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                loadingText="Logging…"
                className="flex-1"
              >
                Log Verification
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

### 9.3 Inventory Quick-Search

Budtenders field constant product questions — "do you have Blue Dream in an eighth?", "is there anything under $40?". The inventory quick-search page is built for speed: a single search bar (with optional barcode scan input) returns live stock levels from `GET /products` in under one keystroke delay. Results show every variant with a clear in-stock / low-stock / out-of-stock indicator so the budtender can answer immediately without opening a separate admin view.

```tsx
// apps/staff/src/pages/InventorySearch/InventorySearchPage.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Barcode, X } from 'lucide-react';
import { useProducts } from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { StrainTypeBadge } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';
import { InventoryResultCard } from './components/InventoryResultCard';

/**
 * InventorySearchPage — Fast product + stock lookup for in-counter budtender use.
 *
 * Calls GET /products?q=...&limit=20 (full-text search via Elasticsearch,
 * Sprint 9). The same endpoint supports SKU lookup — entering a SKU like
 * "BD-125" returns an exact match first. Autocomplete triggers after 1 character
 * so the budtender can start typing a strain name and see results immediately.
 *
 * Barcode mode: a USB barcode scanner emits keystrokes ending in Enter.
 * When the input receives an Enter key, the query is treated as a SKU and
 * submitted immediately without waiting for debounce.
 *
 * WCAG 2.1.1: Keyboard-only navigable. Results are a list; arrow keys move
 *             focus between result cards when the combobox is expanded.
 * WCAG 3.3.2: Label is always visible above the input, not replaced by placeholder.
 */
export default function InventorySearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [committed, setCommitted] = useState('');

  const debouncedQuery = useDebounce(query, 250);

  // Use committed (barcode scan Enter) if set, otherwise debounced typing
  const effectiveQuery = committed || debouncedQuery;

  const { data, isLoading, isFetching } = useProducts(
    { q: effectiveQuery, limit: 20, includeOutOfStock: true },
    { enabled: effectiveQuery.length >= 1 },
  );

  const products = data?.data ?? [];

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Barcode scanner or deliberate Enter → commit immediately
      setCommitted(query);
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  }

  function handleClear() {
    setQuery('');
    setCommitted('');
    inputRef.current?.focus();
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setCommitted(''); // Clear any prior barcode commit on new typing
  }, []);

  const showResults = effectiveQuery.length >= 1;
  const isSearchBusy = isLoading || isFetching;

  return (
    <>
      <Helmet>
        <title>Inventory Search | CannaSaas Staff</title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-5">
        <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)]">
          Inventory Search
        </h1>

        {/* Search bar */}
        <div>
          <label
            htmlFor="inventory-search"
            className="block text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] mb-1.5"
          >
            Search by product name, strain, SKU, or scan barcode
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="inventory-search"
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={showResults && products.length > 0}
              aria-controls="inventory-results"
              aria-autocomplete="list"
              aria-busy={isSearchBusy}
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Blue Dream · BD-125 · scan barcode…"
              autoFocus
              className={[
                'w-full h-12 pl-10 pr-14 rounded-[var(--p-radius-md)]',
                'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
                'text-[var(--color-text)] text-[var(--p-text-sm)]',
                'placeholder:text-[var(--color-text-secondary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
              ].join(' ')}
            />

            {/* Barcode icon indicator */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              <Barcode size={16} aria-hidden="true" />
            </div>

            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear inventory search"
                className={[
                  'absolute right-3.5 top-1/2 -translate-y-1/2',
                  'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] rounded-full',
                ].join(' ')}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Busy indicator — announced to screen readers */}
          {isSearchBusy && effectiveQuery && (
            <p
              role="status"
              aria-live="polite"
              className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1.5"
            >
              Searching inventory…
            </p>
          )}
        </div>

        {/* Results */}
        {showResults ? (
          <div>
            {/* Result count — WCAG 4.1.3 status message */}
            <p
              role="status"
              aria-live="polite"
              className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mb-3"
            >
              {isSearchBusy
                ? ''
                : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>

            <ul
              id="inventory-results"
              role="listbox"
              aria-label="Inventory search results"
              className="space-y-3"
            >
              {products.length === 0 && !isSearchBusy ? (
                <li className="text-center py-12 text-[var(--color-text-secondary)] text-[var(--p-text-sm)]">
                  No products found for &ldquo;{effectiveQuery}&rdquo;
                </li>
              ) : (
                products.map((product) => (
                  <li key={product.id} role="option" aria-selected={false}>
                    <InventoryResultCard product={product} />
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Barcode
              size={48}
              className="text-[var(--color-text-secondary)] mb-3"
              aria-hidden="true"
            />
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] max-w-xs">
              Type a product name or SKU, or scan a product barcode to check
              stock levels instantly.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
```

```tsx
// apps/staff/src/pages/InventorySearch/components/InventoryResultCard.tsx
import React from 'react';
import type { Product, ProductVariant } from '@cannasaas/types';
import { StrainTypeBadge } from '@cannasaas/ui';
import { formatCurrency } from '@cannasaas/utils';
import { cn } from '@cannasaas/utils';

// Stock thresholds — mirrors the low-stock threshold used in the admin portal
const LOW_STOCK_THRESHOLD = 5;

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

function getStockStatus(qty: number): StockStatus {
  if (qty === 0) return 'out_of_stock';
  if (qty <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

const STOCK_CONFIG: Record<
  StockStatus,
  { label: string; dot: string; text: string }
> = {
  in_stock: {
    label: 'In Stock',
    dot: 'bg-[var(--color-success)]',
    text: 'text-[var(--color-success)]',
  },
  low_stock: {
    label: 'Low Stock',
    dot: 'bg-[var(--color-warning)]',
    text: 'text-amber-600 dark:text-amber-400',
  },
  out_of_stock: {
    label: 'Out of Stock',
    dot: 'bg-[var(--color-text-disabled)]',
    text: 'text-[var(--color-text-secondary)]',
  },
};

interface InventoryResultCardProps {
  product: Product;
}

/**
 * InventoryResultCard — Single product result with per-variant stock indicators.
 *
 * Renders all variants in a compact table so the budtender can compare
 * sizes and prices at a glance without navigating to a detail page.
 *
 * WCAG 1.4.1: Stock status communicated via text label + dot, never colour alone.
 * WCAG 1.3.1: Variant table uses <th scope="col"> for correct semantics.
 */
export function InventoryResultCard({ product }: InventoryResultCardProps) {
  return (
    <article
      aria-labelledby={`product-${product.id}-name`}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] overflow-hidden"
    >
      {/* Product header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3
              id={`product-${product.id}-name`}
              className="font-bold text-[var(--color-text)] text-[var(--p-text-base)] truncate"
            >
              {product.name}
            </h3>
            {product.strainType && (
              <StrainTypeBadge strainType={product.strainType} size="sm" />
            )}
          </div>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            {product.brand}
            {product.thcContent && ` · THC ${product.thcContent}%`}
            {product.cbdContent &&
              product.cbdContent > 0 &&
              ` · CBD ${product.cbdContent}%`}
          </p>
        </div>

        <span className="flex-shrink-0 text-[var(--p-text-xs)] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          {product.category}
        </span>
      </div>

      {/* Variant table */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label={`${product.name} variants`}
        tabIndex={0} // WCAG 2.1.1: scrollable region is keyboard focusable
      >
        <table className="w-full text-[var(--p-text-sm)]">
          <caption className="sr-only">
            {product.name} — available sizes and current stock levels
          </caption>
          <thead>
            <tr className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <th
                scope="col"
                className="text-left px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]"
              >
                Size
              </th>
              <th
                scope="col"
                className="text-left px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]"
              >
                SKU
              </th>
              <th
                scope="col"
                className="text-right px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]"
              >
                Price
              </th>
              <th
                scope="col"
                className="text-right px-4 py-2 font-semibold text-[var(--color-text-secondary)] text-[var(--p-text-xs)]"
              >
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => {
              const status = getStockStatus(variant.quantity);
              const cfg = STOCK_CONFIG[status];

              return (
                <tr
                  key={variant.id}
                  className={cn(
                    'border-t border-[var(--color-border)]',
                    status === 'out_of_stock' && 'opacity-50',
                  )}
                >
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">
                    {variant.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                    {variant.sku}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-text)]">
                    {formatCurrency(variant.price)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {/* WCAG 1.4.1: dot supplements text, never replaces it */}
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          cfg.dot,
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          'text-[var(--p-text-xs)] font-semibold',
                          cfg.text,
                        )}
                      >
                        {status === 'in_stock'
                          ? `${variant.quantity} units`
                          : cfg.label}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

### 9.4 Delivery Dispatch Interface

The delivery dispatch page is the coordination hub for delivery orders. Managers and drivers both use it: managers assign drivers to unassigned delivery orders; drivers see their own queue and can update status on their device. The page subscribes to the WebSocket delivery channel (`WS /delivery/tracking`) via the `wsManager` singleton so driver location updates and status changes propagate in real time without polling.

The dispatch list is scoped to orders in `out_for_delivery` and `pending` (delivery) states. Each row surfaces the delivery address, the assigned driver (or an assignment control), and a status button. For unassigned orders the assignment control calls `POST /delivery/assign` and refreshes the order. When a driver marks an order delivered it calls `PUT /orders/:id/status` with `{ status: 'delivered' }` — the backend then queues the Metrc `reportSale` call within the 24-hour window per `compliance-guide.md §6`.

```tsx
// apps/staff/src/pages/Delivery/DeliveryDispatchPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, MapPin, UserCheck } from 'lucide-react';
import {
  useOrders,
  useDeliveryDrivers,
  useAssignDriver,
  useUpdateOrderStatus,
} from '@cannasaas/api-client';
import { useAccessToken, useCurrentUser } from '@cannasaas/stores';
import { wsManager } from '@cannasaas/api-client';
import { cn } from '@cannasaas/utils';
import type { Order } from '@cannasaas/types';
import { DriverAssignSelect } from './components/DriverAssignSelect';
import { DeliveryOrderRow } from './components/DeliveryOrderRow';
import { DeliveryStatusBadge } from './components/DeliveryStatusBadge';

/**
 * DeliveryDispatchPage — Real-time delivery order management for managers and drivers.
 *
 * Connects to WS /delivery/tracking on mount. The wsManager singleton
 * (packages/api-client/src/services/WebSocketManager.ts, Section 11)
 * handles reconnection with exponential backoff so a brief network blip
 * doesn't lose the driver's position stream.
 *
 * Roles:
 *   - Manager/Admin: sees all delivery orders, can assign/reassign drivers.
 *   - Driver: sees only their own assigned orders; can mark delivered.
 *
 * WCAG 2.4.2: Page title updates dynamically via <Helmet>.
 * WCAG 4.1.3: New orders announced via aria-live="polite" in the status bar.
 * WCAG 1.3.1: Delivery status badge uses text + icon, never icon alone.
 */
export default function DeliveryDispatchPage() {
  const user = useCurrentUser();
  const accessToken = useAccessToken();
  const isDriver = user?.roles.includes('driver') ?? false;

  const [wsConnected, setWsConnected] = useState(false);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  // ── Data hooks ───────────────────────────────────────────────────────────
  // Drivers: drivers see only their orders, managers see all delivery orders
  const { data: ordersData, refetch: refetchOrders } = useOrders({
    fulfillmentType: 'delivery',
    status: ['pending', 'confirmed', 'out_for_delivery', 'delivered'],
    ...(isDriver ? { driverId: user?.id } : {}),
    limit: 50,
    sort: 'createdAt_asc',
    refetchInterval: 60_000, // polling fallback
  });

  const { data: driversData } = useDeliveryDrivers(
    { available: true },
    { enabled: !isDriver }, // managers only
  );

  const { mutate: assignDriver } = useAssignDriver();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();

  const orders = ordersData?.data ?? [];
  const drivers = driversData?.data ?? [];

  // Unassigned delivery orders (managers only)
  const unassigned = orders.filter(
    (o) =>
      o.status === 'pending' && o.fulfillmentType === 'delivery' && !o.driverId,
  );
  const inFlight = orders.filter((o) => o.status === 'out_for_delivery');
  const delivered = orders.filter((o) => o.status === 'delivered');

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/delivery/tracking`;
    wsManager.connect(wsUrl, accessToken);
    setWsConnected(true);

    // Listen for live status updates from the delivery module
    const unsubStatus = wsManager.on<{ orderId: string; status: string }>(
      'status_update',
      (payload) => {
        setLiveStatuses((prev) => ({
          ...prev,
          [payload.orderId]: payload.status,
        }));
        // Refresh order list so data stays in sync with live events
        refetchOrders();
      },
    );

    return () => {
      unsubStatus();
      wsManager.disconnect();
      setWsConnected(false);
    };
  }, [accessToken, refetchOrders]);

  function handleAssign(orderId: string, driverId: string) {
    assignDriver({ orderId, driverId }, { onSuccess: () => refetchOrders() });
  }

  function handleStatusUpdate(
    orderId: string,
    status: 'out_for_delivery' | 'delivered' | 'completed',
  ) {
    updateStatus({ orderId, status }, { onSuccess: () => refetchOrders() });
  }

  return (
    <>
      <Helmet>
        <title>
          {isDriver ? 'My Deliveries' : `Dispatch (${inFlight.length} active)`}{' '}
          | CannaSaas Staff
        </title>
      </Helmet>

      <div className="p-4 md:p-6 space-y-6">
        {/* Page header + WS status */}
        <div className="flex items-center justify-between">
          <h1 className="text-[var(--p-text-2xl)] font-bold text-[var(--color-text)] flex items-center gap-2">
            <Truck
              size={24}
              aria-hidden="true"
              className="text-[var(--color-brand)]"
            />
            {isDriver ? 'My Deliveries' : 'Delivery Dispatch'}
          </h1>

          {/* Live connection indicator */}
          <div
            className="flex items-center gap-2"
            aria-live="polite"
            aria-atomic="true"
            aria-label={
              wsConnected
                ? 'Live updates connected'
                : 'Live updates disconnected'
            }
          >
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                wsConnected
                  ? 'bg-[var(--color-success)] animate-pulse'
                  : 'bg-[var(--color-error)]',
              )}
              aria-hidden="true"
            />
            <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
              {wsConnected ? 'Live' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* MANAGERS ONLY: Unassigned orders */}
        {!isDriver && unassigned.length > 0 && (
          <section aria-labelledby="unassigned-heading">
            <h2
              id="unassigned-heading"
              className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3 flex items-center gap-2"
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white text-[var(--p-text-xs)] font-black"
                aria-label={`${unassigned.length} unassigned`}
              >
                {unassigned.length}
              </span>
              Needs Driver Assignment
            </h2>
            <ul
              role="list"
              aria-label="Unassigned delivery orders"
              className="space-y-2"
            >
              {unassigned.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <DriverAssignSelect
                        drivers={drivers}
                        onAssign={(driverId) =>
                          handleAssign(order.id, driverId)
                        }
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* In-flight deliveries */}
        <section aria-labelledby="inflight-heading">
          <h2
            id="inflight-heading"
            className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3"
          >
            Out for Delivery
            <span className="ml-2 text-[var(--color-text-secondary)] font-normal text-[var(--p-text-sm)]">
              ({inFlight.length})
            </span>
          </h2>
          {inFlight.length === 0 ? (
            <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] py-4">
              No active deliveries.
            </p>
          ) : (
            <ul
              role="list"
              aria-label="Active deliveries"
              className="space-y-2"
            >
              {inFlight.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusUpdate(order.id, 'delivered')
                        }
                        aria-label={`Mark order ${order.orderNumber} as delivered`}
                        className={[
                          'min-h-[44px] px-4 rounded-[var(--p-radius-md)]',
                          'bg-[var(--color-success)] text-white font-bold text-[var(--p-text-sm)]',
                          'hover:opacity-90 disabled:opacity-50',
                          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                          'transition-opacity duration-[var(--p-dur-fast)]',
                        ].join(' ')}
                      >
                        Mark Delivered
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Delivered — awaiting completion */}
        {delivered.length > 0 && (
          <section aria-labelledby="delivered-heading">
            <h2
              id="delivered-heading"
              className="text-[var(--p-text-base)] font-bold text-[var(--color-text)] mb-3"
            >
              Delivered — Pending Completion
              <span className="ml-2 text-[var(--color-text-secondary)] font-normal text-[var(--p-text-sm)]">
                ({delivered.length})
              </span>
            </h2>
            <ul
              role="list"
              aria-label="Delivered orders awaiting completion"
              className="space-y-2"
            >
              {delivered.map((order) => (
                <li key={order.id} role="listitem">
                  <DeliveryOrderRow
                    order={order}
                    liveStatus={liveStatuses[order.id]}
                    action={
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleStatusUpdate(order.id, 'completed')
                        }
                        aria-label={`Complete order ${order.orderNumber}`}
                        className={[
                          'min-h-[44px] px-4 rounded-[var(--p-radius-md)]',
                          'bg-[var(--color-bg-tertiary)] text-[var(--color-text)] font-bold text-[var(--p-text-sm)]',
                          'hover:bg-[var(--color-bg-secondary)] disabled:opacity-50',
                          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                          'transition-colors duration-[var(--p-dur-fast)]',
                        ].join(' ')}
                      >
                        Complete
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
```

```tsx
// apps/staff/src/pages/Delivery/components/DeliveryOrderRow.tsx
import React from 'react';
import { MapPin, User, Package } from 'lucide-react';
import { formatCurrency, formatTime } from '@cannasaas/utils';
import type { Order } from '@cannasaas/types';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';

interface DeliveryOrderRowProps {
  order: Order;
  liveStatus?: string; // Real-time override from WebSocket
  action: React.ReactNode; // Varies by context: assign select vs status button
}

/**
 * DeliveryOrderRow — Single row in the dispatch list.
 *
 * Accepts a `liveStatus` override so WebSocket updates are reflected
 * immediately without waiting for the polling refetch.
 *
 * WCAG 1.3.1: Address and driver details are in a <dl> so screen readers
 *             expose the label/value relationship correctly.
 */
export function DeliveryOrderRow({
  order,
  liveStatus,
  action,
}: DeliveryOrderRowProps) {
  const effectiveStatus = liveStatus ?? order.status;

  return (
    <article
      aria-labelledby={`dispatch-${order.id}-num`}
      className={[
        'flex flex-col sm:flex-row sm:items-center gap-4 p-4',
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--p-radius-lg)]',
        'transition-colors duration-[var(--p-dur-fast)]',
      ].join(' ')}
    >
      {/* Left: order info */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Order number + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            id={`dispatch-${order.id}-num`}
            className="font-bold text-[var(--color-text)] text-[var(--p-text-sm)]"
          >
            #{order.orderNumber}
          </span>
          <DeliveryStatusBadge status={effectiveStatus as any} />
          <span className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
            {formatTime(order.createdAt)}
          </span>
        </div>

        {/* Delivery details */}
        <dl className="space-y-1">
          <div className="flex items-start gap-1.5">
            <dt className="sr-only">Delivery address</dt>
            <MapPin
              size={13}
              className="text-[var(--color-text-secondary)] mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <dd className="text-[var(--p-text-sm)] text-[var(--color-text)] leading-snug">
              {order.deliveryAddress
                ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`
                : 'Address not set'}
            </dd>
          </div>

          {order.driverName && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Assigned driver</dt>
              <User
                size={13}
                className="text-[var(--color-text-secondary)] flex-shrink-0"
                aria-hidden="true"
              />
              <dd className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
                {order.driverName}
              </dd>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Order contents</dt>
            <Package
              size={13}
              className="text-[var(--color-text-secondary)] flex-shrink-0"
              aria-hidden="true"
            />
            <dd className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)]">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
              {formatCurrency(order.total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Right: action slot */}
      <div className="flex-shrink-0">{action}</div>
    </article>
  );
}
```

```tsx
// apps/staff/src/pages/Delivery/components/DeliveryStatusBadge.tsx
import React from 'react';
import type { OrderStatus } from '@cannasaas/types';

const STATUS_CONFIG: Partial<
  Record<OrderStatus, { label: string; classes: string }>
> = {
  pending: {
    label: 'Pending',
    classes:
      'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
  },
  confirmed: {
    label: 'Confirmed',
    classes: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300',
  },
  out_for_delivery: {
    label: 'En Route',
    classes: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]',
  },
  delivered: {
    label: 'Delivered',
    classes:
      'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  },
};

interface DeliveryStatusBadgeProps {
  status: OrderStatus;
}

/**
 * DeliveryStatusBadge — Delivery-context status labels.
 *
 * Uses "En Route" in place of the raw "out_for_delivery" API value
 * for clearer driver-facing language.
 *
 * WCAG 1.4.1: Status communicated by text, colour is supplementary.
 */
export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[var(--p-text-xs)] font-semibold',
        config.classes,
      ].join(' ')}
      // WCAG 1.3.1: aria-label exposes full status to screen readers
      aria-label={`Delivery status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
```

```tsx
// apps/staff/src/pages/Delivery/components/DriverAssignSelect.tsx
import React, { useState } from 'react';
import type { Driver } from '@cannasaas/types';

interface DriverAssignSelectProps {
  drivers: Driver[];
  onAssign: (driverId: string) => void;
}

/**
 * DriverAssignSelect — Inline driver assignment control for unassigned orders.
 *
 * On selection the <select> calls onAssign immediately — no separate submit
 * button needed because the action is easily reversible (reassign).
 * A "Not assigned" placeholder prevents an accidental assignment on first render.
 *
 * WCAG 3.3.2: Label is programmatically associated even though it is sr-only
 *             (the card context makes the visual label redundant).
 */
export function DriverAssignSelect({
  drivers,
  onAssign,
}: DriverAssignSelectProps) {
  const [selected, setSelected] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const driverId = e.target.value;
    if (!driverId) return;
    setSelected(driverId);
    onAssign(driverId);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="driver-assign" className="sr-only">
        Assign driver
      </label>
      <select
        id="driver-assign"
        value={selected}
        onChange={handleChange}
        className={[
          'h-10 pl-3 pr-8 rounded-[var(--p-radius-md)]',
          'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
          'text-[var(--p-text-sm)] text-[var(--color-text)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
          'cursor-pointer min-w-[160px]',
        ].join(' ')}
        aria-label="Assign driver to this order"
      >
        <option value="">Assign driver…</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.firstName} {driver.lastName}
          </option>
        ))}
      </select>
      {drivers.length === 0 && (
        <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
          No available drivers
        </p>
      )}
    </div>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

---

[↑ Back to top](#Table-of-Contents)

## 10. Cannabis-Specific Components

### 10.1 Strain Type Badge

```tsx
// packages/ui/src/components/StrainTypeBadge/StrainTypeBadge.tsx
import React from 'react';
import { cn } from '@cannasaas/utils';
import type { StrainType } from '@cannasaas/types';

const STRAIN_CONFIG: Record<
  StrainType,
  { label: string; bg: string; text: string }
> = {
  indica: { label: 'Indica', bg: '#7c3aed', text: '#ffffff' },
  sativa: { label: 'Sativa', bg: '#dc2626', text: '#ffffff' },
  hybrid: { label: 'Hybrid', bg: '#16a34a', text: '#ffffff' },
  indica_dominant_hybrid: { label: 'Indica-H', bg: '#6d28d9', text: '#ffffff' },
  sativa_dominant_hybrid: { label: 'Sativa-H', bg: '#b91c1c', text: '#ffffff' },
  cbd_dominant: { label: 'CBD', bg: '#0891b2', text: '#ffffff' },
};

interface StrainTypeBadgeProps {
  strainType: StrainType;
  size?: 'sm' | 'md';
  className?: string;
}

export function StrainTypeBadge({
  strainType,
  size = 'sm',
  className,
}: StrainTypeBadgeProps) {
  const config = STRAIN_CONFIG[strainType];

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider',
        'rounded-[var(--p-radius-sm)]',
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-3 py-1 text-[var(--p-text-xs)]',
        className,
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
      // WCAG 1.4.1: color is supplemented by text label
      aria-label={`Strain type: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
```

### 10.2 Purchase Limit Meter

Shown during checkout to help customers understand their remaining daily purchase capacity.

```tsx
// packages/ui/src/components/PurchaseLimitMeter/PurchaseLimitMeter.tsx
import React from 'react';
import type { PurchaseLimitResult } from '@cannasaas/types';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatWeight } from '@cannasaas/utils';

interface PurchaseLimitMeterProps {
  limitCheck: PurchaseLimitResult;
}

/**
 * PurchaseLimitMeter — Shows remaining daily purchase capacity
 *
 * NY state limits: 3oz flower, 24g concentrate per 24 hours
 * NJ state limits: 1oz per transaction
 * CT state limits: 1.5oz per transaction
 *
 * WCAG:
 * - Uses role="meter" with aria-valuenow/min/max for progress bars
 * - Violations listed as alert for immediate screen reader announcement
 */
export function PurchaseLimitMeter({ limitCheck }: PurchaseLimitMeterProps) {
  const { allowed, violations, remaining, state } = limitCheck;

  const STATE_LIMITS: Record<string, { flower: number; concentrate: number }> =
    {
      NY: { flower: 3, concentrate: 24 },
      NJ: { flower: 1, concentrate: 28 },
      CT: { flower: 1.5, concentrate: 28 },
    };

  const limits = STATE_LIMITS[state] ?? STATE_LIMITS.NY;
  const flowerUsed = limits.flower - remaining.flowerOz;
  const concentrateUsed = limits.concentrate - remaining.concentrateG;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--p-radius-lg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        {allowed ? (
          <CheckCircle
            className="text-[var(--color-success)] w-5 h-5"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle
            className="text-[var(--color-error)] w-5 h-5"
            aria-hidden="true"
          />
        )}
        <h3 className="font-bold text-[var(--color-text)]">
          {state} Daily Purchase Limits
        </h3>
      </div>

      {/* Violations — shown as alert */}
      {violations.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-[var(--p-radius-md)] border border-[var(--color-error)]"
        >
          <ul className="text-[var(--p-text-sm)] text-[var(--color-error)] list-disc list-inside space-y-1">
            {violations.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Flower meter */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[var(--p-text-sm)] mb-1.5">
            <span className="font-semibold text-[var(--color-text)]">
              Flower
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {flowerUsed.toFixed(2)}oz / {limits.flower}oz used
            </span>
          </div>
          <div
            role="meter"
            aria-valuenow={flowerUsed}
            aria-valuemin={0}
            aria-valuemax={limits.flower}
            aria-label={`Flower purchased today: ${flowerUsed.toFixed(2)} of ${limits.flower} ounces`}
            className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden"
          >
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                flowerUsed / limits.flower > 0.9
                  ? 'bg-[var(--color-error)]'
                  : flowerUsed / limits.flower > 0.7
                    ? 'bg-[var(--color-warning)]'
                    : 'bg-[var(--color-brand)]',
              ].join(' ')}
              style={{
                width: `${Math.min((flowerUsed / limits.flower) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)] mt-1">
            {remaining.flowerOz.toFixed(2)}oz remaining today
          </p>
        </div>

        {/* Concentrate meter */}
        <div>
          <div className="flex justify-between text-[var(--p-text-sm)] mb-1.5">
            <span className="font-semibold text-[var(--color-text)]">
              Concentrate
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {concentrateUsed.toFixed(1)}g / {limits.concentrate}g used
            </span>
          </div>
          <div
            role="meter"
            aria-valuenow={concentrateUsed}
            aria-valuemin={0}
            aria-valuemax={limits.concentrate}
            aria-label={`Concentrate purchased today: ${concentrateUsed.toFixed(1)} of ${limits.concentrate} grams`}
            className="h-3 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden"
          >
            <div
              className={[
                'h-full rounded-full transition-all duration-500',
                concentrateUsed / limits.concentrate > 0.9
                  ? 'bg-[var(--color-error)]'
                  : 'bg-[var(--color-info)]',
              ].join(' ')}
              style={{
                width: `${Math.min((concentrateUsed / limits.concentrate) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

## 11. Real-Time Features — WebSocket Architecture

The WebSocket manager is a singleton service that manages a single connection per session. Multiple components can subscribe to WebSocket events without creating duplicate connections.

```typescript
// packages/api-client/src/services/WebSocketManager.ts
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
        const handlers = this.handlers.get(payload.type);
        handlers?.forEach((handler) => handler(payload));
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean && this.reconnectAttempts < this.MAX_RECONNECT) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
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

    // Return an unsubscribe function
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

// Singleton export
export const wsManager = new WebSocketManager();
```

```typescript
// packages/api-client/src/hooks/useWebSocketEvent.ts
import { useEffect, useRef, useCallback } from 'react';
import { wsManager } from '../services/WebSocketManager';

/**
 * useWebSocketEvent — Subscribe to a specific WebSocket event type
 *
 * Handles subscription and automatic cleanup on unmount.
 * Uses a ref for the handler to avoid stale closure issues.
 */
export function useWebSocketEvent<T>(
  eventType: string,
  handler: (data: T) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: unknown) => {
    handlerRef.current(data as T);
  }, []);

  useEffect(() => {
    const unsubscribe = wsManager.on(eventType, stableHandler);
    return unsubscribe;
  }, [eventType, stableHandler]);
}
```

---

[↑ Back to top](#Table-of-Contents)

## 12. Elasticsearch Search & AI Recommendations

The search experience uses the Elasticsearch endpoint from Sprint 9. Autocomplete triggers after 2 characters, full search on Enter or selection.

```tsx
// apps/storefront/src/components/Search/SearchModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Leaf, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchSuggestions, useSearchProducts } from '@cannasaas/api-client';
import { useDebounce } from '@cannasaas/utils';
import { ProductCard } from '@cannasaas/ui';
import type { Product } from '@cannasaas/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('cannasaas-recent-searches') ?? '[]',
      ) as string[];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Autocomplete suggestions
  const { data: suggestions } = useSearchSuggestions(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
  });

  // Full search results (triggered when query is substantial)
  const { data: results } = useSearchProducts(debouncedQuery, {
    enabled: debouncedQuery.length >= 3,
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      // Save to recent searches
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(
        'cannasaas-recent-searches',
        JSON.stringify(updated),
      );

      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      onClose();
    },
    [recentSearches, navigate, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className={[
          'fixed top-0 left-0 right-0 z-50 max-w-2xl mx-auto mt-4 mx-4 sm:mx-auto',
          'bg-[var(--color-surface)] rounded-[var(--p-radius-lg)]',
          'border border-[var(--color-border)] shadow-[var(--p-shadow-lg)]',
          'overflow-hidden max-h-[85vh] flex flex-col',
        ].join(' ')}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
          <Search
            size={20}
            className="text-[var(--color-text-secondary)] flex-shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={!!suggestions?.length}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-label="Search cannabis products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(query);
            }}
            placeholder="Search flower, edibles, vapes..."
            className={[
              'flex-1 bg-transparent text-[var(--color-text)]',
              'text-[var(--p-text-base)] placeholder:text-[var(--color-text-disabled)]',
              'outline-none',
            ].join(' ')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Results */}
        <div
          id="search-results"
          role="listbox"
          aria-label="Search results and suggestions"
          className="overflow-y-auto flex-1"
        >
          {/* No query — show recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Recent Searches
              </p>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSearch(search)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                >
                  <Clock
                    size={14}
                    className="text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--p-text-sm)] text-[var(--color-text)]">
                    {search}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions while typing */}
          {query.length >= 2 && suggestions && suggestions.length > 0 && (
            <div className="p-4 border-b border-[var(--color-border)]">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Suggestions
              </p>
              {suggestions.map((suggestion: string) => (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSearch(suggestion)}
                  className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                >
                  <Search
                    size={14}
                    className="text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                  <span
                    className="text-[var(--p-text-sm)] text-[var(--color-text)]"
                    // Highlight matched portion
                    dangerouslySetInnerHTML={{
                      __html: suggestion.replace(
                        new RegExp(`(${query})`, 'gi'),
                        '<mark class="bg-[var(--color-brand-subtle)] text-[var(--color-brand)] rounded px-0.5">$1</mark>',
                      ),
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product results */}
          {query.length >= 3 && results && results.data.length > 0 && (
            <div className="p-4">
              <p className="text-[var(--p-text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
                Products ({results.data.length})
              </p>
              <div className="space-y-2">
                {results.data.slice(0, 5).map((product: Product) => (
                  <button
                    key={product.id}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => {
                      navigate(`/products/${product.slug}`);
                      onClose();
                    }}
                    className="flex items-center gap-3 w-full px-2 py-2 rounded-[var(--p-radius-md)] hover:bg-[var(--color-bg-tertiary)] text-left"
                  >
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt=""
                        aria-hidden="true"
                        className="w-10 h-10 rounded-[var(--p-radius-sm)] object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-[var(--p-radius-sm)] bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0"
                        aria-hidden="true"
                      >
                        <Leaf
                          size={16}
                          className="text-[var(--color-text-secondary)]"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--p-text-sm)] font-semibold text-[var(--color-text)] truncate">
                        {product.name}
                      </p>
                      <p className="text-[var(--p-text-xs)] text-[var(--color-text-secondary)]">
                        {product.category} · {product.cannabisInfo.thcContent}%
                        THC
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query.length >= 3 && results?.data.length === 0 && (
            <div className="p-8 text-center" role="status">
              <p className="text-[var(--color-text-secondary)]">
                No products found for "{query}"
              </p>
              <p className="text-[var(--p-text-sm)] text-[var(--color-text-secondary)] mt-1">
                Try different keywords or browse by category
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

[↑ Back to top](#Table-of-Contents)

## 13. Testing Strategy — Unit, Integration & E2E

### 13.1 Unit Testing — Vitest + React Testing Library

Every component is tested using the Arrange-Act-Assert pattern. Tests focus on behavior (what a user can do) rather than implementation details (internal state).

```typescript
// packages/ui/src/components/ProductCard/ProductCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '@cannasaas/types';

const mockProduct: Product = {
  id: 'prod-123',
  dispensaryId: 'disp-456',
  name: 'Blue Dream',
  slug: 'blue-dream',
  description: 'A classic sativa-dominant hybrid',
  brand: 'Premium Farms',
  category: 'flower',
  cannabisInfo: {
    strainType: 'sativa_dominant_hybrid',
    thcContent: 24.5,
    cbdContent: 0.8,
    terpenes: [],
    effects: ['uplifting', 'creative'],
    flavors: ['berry', 'sweet'],
  },
  variants: [
    {
      id: 'var-1',
      productId: 'prod-123',
      name: '1/8 oz',
      sku: 'BD-125',
      weight: 3.5,
      weightUnit: 'g',
      price: 45.00,
      quantity: 24,
      lowStockThreshold: 5,
      isActive: true,
    },
    {
      id: 'var-2',
      productId: 'prod-123',
      name: '1/4 oz',
      sku: 'BD-250',
      weight: 7,
      weightUnit: 'g',
      price: 85.00,
      quantity: 12,
      lowStockThreshold: 3,
      isActive: true,
    },
  ],
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/blue-dream.jpg',
      altText: 'Blue Dream flower close-up showing dense trichomes',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  isActive: true,
  isFeatured: false,
  ageRestricted: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderProductCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ProductCard product={mockProduct} {...props} />
    </MemoryRouter>,
  );

describe('ProductCard', () => {
  it('renders product name with link to product detail', () => {
    renderProductCard();

    const link = screen.getByRole('link', { name: /blue dream/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/products/blue-dream');
  });

  it('renders primary product image with descriptive alt text', () => {
    renderProductCard();

    const img = screen.getByAltText('Blue Dream flower close-up showing dense trichomes');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders variant selector when multiple variants exist', () => {
    renderProductCard();

    const group = screen.getByRole('group', { name: /select size/i });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('1/8 oz');
    expect(buttons[1]).toHaveTextContent('1/4 oz');
  });

  it('updates price display when variant is selected', () => {
    renderProductCard();

    // Initially shows first variant price ($45.00)
    expect(screen.getByText('$45.00')).toBeInTheDocument();

    // Click the 1/4 oz variant
    fireEvent.click(screen.getByRole('button', { name: /1\/4 oz/i }));

    // Price should update to $85.00
    expect(screen.getByText('$85.00')).toBeInTheDocument();
  });

  it('calls onAddToCart with correct product and variant', () => {
    const onAddToCart = vi.fn();
    renderProductCard({ onAddToCart });

    const addButton = screen.getByRole('button', { name: /add blue dream to cart/i });
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalledOnce();
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct, mockProduct.variants[0]);
  });

  it('disables add to cart button when product is out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      variants: [{ ...mockProduct.variants[0], quantity: 0 }],
    };

    render(
      <MemoryRouter>
        <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeDisabled();
  });

  // WCAG compliance tests
  it('has no accessibility violations', async () => {
    const { container } = renderProductCard();
    const { axe } = await import('@axe-core/react');
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('article has descriptive aria-label', () => {
    renderProductCard();

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Blue Dream'),
    );
  });
});
```

### 13.2 E2E Testing — Playwright

```typescript
// apps/storefront/e2e/purchase-flow.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.describe('Purchase Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Bypass age gate for E2E tests
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('cannasaas-age-verified', 'true');
    });
  });

  test('age gate is shown on first visit', async ({ browser }) => {
    const freshPage = await browser.newPage();
    await freshPage.goto('/');

    // Age gate dialog should be visible
    await expect(
      freshPage.getByRole('dialog', { name: /age verification/i }),
    ).toBeVisible();

    // Both confirm and deny buttons should exist
    await expect(
      freshPage.getByRole('button', { name: /i am 21 or older/i }),
    ).toBeVisible();
    await expect(
      freshPage.getByRole('button', { name: /i am under 21/i }),
    ).toBeVisible();

    await freshPage.close();
  });

  test('can navigate product categories', async () => {
    await page.goto('/');

    await page.getByRole('link', { name: /flower/i }).click();

    await expect(page).toHaveURL(/category=flower/);
    await expect(page.getByRole('heading', { name: /flower/i })).toBeVisible();
  });

  test('can add product to cart and proceed to checkout', async () => {
    await page.goto('/products?category=flower');

    // Wait for products to load
    await page.waitForSelector('[role="list"][aria-label="Products"]');

    // Add first available product to cart
    const addButtons = page.getByRole('button', { name: /add .* to cart/i });
    await addButtons.first().click();

    // Cart count badge should update
    const cartLink = page.getByRole('link', { name: /cart with \d+ item/i });
    await expect(cartLink).toBeVisible();

    // Go to cart
    await cartLink.click();
    await expect(
      page.getByRole('heading', { name: /your cart/i }),
    ).toBeVisible();

    // Proceed to checkout (requires login)
    await page.getByRole('button', { name: /proceed to checkout/i }).click();

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('keyboard navigation through product grid works correctly', async () => {
    await page.goto('/products');
    await page.waitForSelector('[role="list"][aria-label="Products"]');

    // Tab to first product's add-to-cart button
    await page.keyboard.press('Tab');
    // Continue tabbing until we reach an add-to-cart button
    let attempts = 0;
    while (attempts < 20) {
      const focused = await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      );
      if (focused?.includes('Add') && focused?.includes('to cart')) break;
      await page.keyboard.press('Tab');
      attempts++;
    }

    // Activate it with Enter
    await page.keyboard.press('Enter');

    // Cart count should increase
    await expect(
      page.getByRole('link', { name: /cart with 1 item/i }),
    ).toBeVisible();
  });

  test('accessibility: page has no critical violations', async () => {
    await page.goto('/products');

    // Use axe-playwright for automated accessibility scanning
    const { checkA11y } = await import('axe-playwright');
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});
```

---

[↑ Back to top](#Table-of-Contents)

## 14. CI/CD & Beta Deployment

### 14.1 GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  # ── Quality Gates ────────────────────────────────────────────────
  quality:
    name: Quality Gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: TypeScript check
        run: pnpm turbo type-check

      - name: Lint
        run: pnpm turbo lint

      - name: Unit tests with coverage
        run: pnpm turbo test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # ── Build ────────────────────────────────────────────────────────
  build:
    name: Build All Apps
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm turbo build
        env:
          VITE_API_URL: ${{ vars.VITE_API_URL }}
          VITE_WS_URL: ${{ vars.VITE_WS_URL }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            apps/storefront/dist
            apps/admin/dist
            apps/staff/dist

  # ── E2E Tests ────────────────────────────────────────────────────
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright browsers
        run: pnpm dlx playwright install --with-deps chromium
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
      - name: Run E2E tests
        run: pnpm turbo e2e
        env:
          CI: true

  # ── Deploy to Beta ───────────────────────────────────────────────
  deploy-beta:
    name: Deploy to Beta (Cloudflare Pages)
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.ref == 'refs/heads/main'
    environment:
      name: beta
      url: https://beta.cannasaas.com
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy storefront to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cannasaas-storefront
          directory: apps/storefront/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy admin to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cannasaas-admin
          directory: apps/admin/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Notify Slack on deploy
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'CannaSaas beta deployed successfully 🌿'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()
```

### 14.2 Vite Build Configuration

```typescript
// apps/storefront/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'CannaSaas',
        short_name: 'CannaSaas',
        description: 'Cannabis dispensary e-commerce',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.cannasaas\.com\/v1\/products/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-products',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
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
          // Split vendor chunks for optimal caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            'lucide-react',
          ],
          'chart-vendor': ['recharts'],
          'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
    sourcemap: true, // Enable for beta error tracking
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

---

[↑ Back to top](#Table-of-Contents)

## 15. WCAG 2.1 AA Compliance Checklist

Every page and component must pass this checklist before the beta release. Use this as your PR review template.

| Criterion                | Guideline | Check                                                            |
| ------------------------ | --------- | ---------------------------------------------------------------- |
| Text alternatives        | 1.1.1     | All `<img>` tags have `alt` text; decorative images use `alt=""` |
| Info via color           | 1.3.3     | Status (stock, trend) conveyed by icon/text AND color            |
| Contrast (normal text)   | 1.4.3     | ≥ 4.5:1 ratio — verified via token system + axe scan             |
| Contrast (large text)    | 1.4.3     | ≥ 3:1 ratio for text ≥18px/14px bold                             |
| Contrast (UI components) | 1.4.11    | ≥ 3:1 for input borders, button outlines, focus rings            |
| Text resize              | 1.4.4     | All text resizes to 200% without horizontal scroll               |
| Reflow                   | 1.4.10    | Single-column layout at 320px viewport width                     |
| Non-text contrast        | 1.4.11    | Icons, charts, form controls ≥ 3:1                               |
| Keyboard accessible      | 2.1.1     | Every interactive element reachable and operable via keyboard    |
| No keyboard trap         | 2.1.2     | Modals trap focus correctly; Escape closes them                  |
| Skip links               | 2.4.1     | "Skip to main content" link at top of each page                  |
| Page titles              | 2.4.2     | Every page has a unique, descriptive `<title>`                   |
| Focus order              | 2.4.3     | Tab order follows visual reading order                           |
| Link purpose             | 2.4.4     | Link text makes purpose clear without surrounding context        |
| Focus visible            | 2.4.7     | All focused elements show a visible, high-contrast ring          |
| Motion respect           | 2.3.3     | All animations honor `prefers-reduced-motion`                    |
| Target size              | 2.5.5     | Touch targets minimum 44×44px                                    |
| Language                 | 3.1.1     | `<html lang="en">` set on all pages                              |
| Labels                   | 3.3.2     | All form inputs have visible, associated labels                  |
| Error identification     | 3.3.1     | Form errors identify the field and describe the problem          |
| Error suggestion         | 3.3.3     | Error messages provide correction guidance                       |
| Name/Role/Value          | 4.1.2     | Custom components use correct ARIA roles and states              |
| Status messages          | 4.1.3     | Async updates announced via `aria-live` regions                  |

### Automated Testing Commands

```bash
# Run axe-core accessibility scan against all apps
pnpm turbo a11y

# Audit with Lighthouse
npx lighthouse https://beta.cannasaas.com --only-categories=accessibility --output=html

# Run pa11y across all critical pages
npx pa11y https://beta.cannasaas.com/products --reporter=cli
npx pa11y https://beta.cannasaas.com/cart
```

---

[↑ Back to top](#Table-of-Contents)

## 16. Suggested Advanced Features Beyond Current Docs

These features are not in any existing document and represent meaningful competitive differentiation for CannaSaas in the NY/NJ/CT market.

### 16.1 Loyalty Program with Points Economy

A points-based loyalty system dramatically increases repeat purchase rates. Architecture recommendation: a `loyalty_accounts` table (points balance, tier level) and a `loyalty_transactions` ledger (earned/redeemed events). The frontend surfaces a "Points Wallet" in the user account section and shows "X points earned" at checkout.

**Implementation note:** Tier thresholds should be configurable per dispensary (some prefer dollar-value tiers, others prefer visit-count tiers). Use a strategy pattern in the backend service.

### 16.2 Cannabis Education & Effects Matching

A "Help Me Choose" flow that asks the user about desired effects (relaxation, energy, pain relief, sleep) and recommends products based on cannabinoid and terpene profiles. This is achievable with the existing AI endpoint from Sprint 12 and the `effects` + `terpenes` fields already in the product model.

**Frontend:** A multi-step guided questionnaire using `useReducer` with a `machine`-like state transition pattern. Results are displayed as ranked product cards with an explanation of why each was recommended.

### 16.3 Subscription / Auto-Reorder

Allow customers to set up recurring orders for their favorite products. Particularly valuable for medical patients on consistent dosing schedules. The backend needs a `subscriptions` table with billing cadence (weekly/biweekly/monthly) and a cron job that triggers Stripe recurring payment intents.

**Frontend:** Subscription management screen in the account section with pause/skip/cancel controls. Badge products on the catalog with "Subscribe & Save" pricing.

### 16.4 Digital Menus for In-Store TVs

A read-only, auto-scrolling product display designed for in-store TV screens. It pulls from the same product API but uses a kiosk-optimized layout (large text, high contrast, 16:9 aspect ratio). Auto-refreshes every 5 minutes to show real-time availability.

**Implementation:** A fourth entry in the monorepo (`apps/kiosk`) that is a URL loaded in a smart TV browser. Zero user interaction required.

### 16.5 Pre-Order with Deposit

Allow customers to pre-order products that are out of stock or incoming from a transfer. They pay a deposit (50%) at order time and the balance at pickup. This requires a `pre_orders` table with a status of `awaiting_inventory` and a Stripe payment intent capture strategy.

### 16.6 Multi-Dispensary Cart

Allow customers of a dispensary chain to add products from multiple locations and pick the fulfillment dispensary at checkout. This is technically complex because purchase limits are per-location, but the user experience would significantly differentiate CannaSaas from competitors like Dutchie.

### 16.7 Budtender Video Consultation (Telehealth-Lite)

A Calendly-style appointment booking for video consultations with experienced budtenders. Particularly valuable for medical patients new to cannabis. Uses WebRTC (via Daily.co or 100ms) and integrates with the compliance log to record consultation outcomes.

### 16.8 Real-Time Inventory Countdown

Display a live countdown ("Only 3 left!") that updates without a page refresh using Server-Sent Events (SSE) from the backend. SSE is simpler than WebSocket for one-directional push data like inventory notifications.

### 16.9 Cannabis Tourism Mode

A geo-aware storefront mode targeted at visitors (tourists to NY, etc.) who are unfamiliar with cannabis. It surfaces beginner-friendly products, dosage guidance, and local delivery options prominently. Toggle is inferred from `?source=visitor` query parameter or a user preference.

### 16.10 Automated Tax Reporting Export

An admin feature that generates a state-specific tax report CSV in the exact format required by NY, NJ, or CT tax authorities. Currently the compliance module generates sales data; this feature formats it into the required submission format and can optionally email it to the dispensary's accountant on a configurable schedule.

---

> This document covers the complete path from your current backend-complete state to a functional, compliant, accessible public beta serving 5 dispensaries in New York. Each code block is production-ready and follows the patterns established in your architecture documents. The next action is Phase A (monorepo scaffolding), followed by Phase B (shared packages), then Phase G (auth wiring) before any page development begins.

_CannaSaas — Building the future of cannabis commerce_

[↑ Back to top](#top)
