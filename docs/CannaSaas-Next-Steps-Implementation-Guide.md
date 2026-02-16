# CANNASAAS
## Multi-Tenant Cannabis E-Commerce Platform

---

# Next Steps Implementation Guide
### React Frontend Monorepo + Backend Integration

**Version 2.0 | February 2026**
**Prepared for: Dennis Luken, Senior Architect / Site Lead**

---

## Table of Contents

1. [Where You Are Now: Completed Backend Sprints](#1-where-you-are-now-completed-backend-sprints)
2. [What Comes Next: The Frontend Build](#2-what-comes-next-the-frontend-build)
3. [Phase A: Monorepo Setup & Tooling (Week 1)](#3-phase-a-monorepo-setup--tooling-week-1)
4. [Phase B: Shared Packages & Design System (Weeks 1-2)](#4-phase-b-shared-packages--design-system-weeks-1-2)
5. [Phase C: Customer Storefront App (Weeks 2-4)](#5-phase-c-customer-storefront-app-weeks-2-4)
6. [Phase D: Admin Portal App (Weeks 4-6)](#6-phase-d-admin-portal-app-weeks-4-6)
7. [Phase E: Staff Portal App (Weeks 6-7)](#7-phase-e-staff-portal-app-weeks-6-7)
8. [Phase F: Backend API Integration (Weeks 3-7)](#8-phase-f-backend-api-integration-weeks-3-7)
9. [Phase G: Authentication & Multi-Tenant Wiring (Weeks 2-3)](#9-phase-g-authentication--multi-tenant-wiring-weeks-2-3)
10. [Phase H: Theming & Dynamic Branding (Week 4)](#10-phase-h-theming--dynamic-branding-week-4)
11. [Phase I: Testing Strategy & Implementation (Weeks 5-8)](#11-phase-i-testing-strategy--implementation-weeks-5-8)
12. [Phase J: Build, Deployment & CI/CD (Week 8)](#12-phase-j-build-deployment--cicd-week-8)
13. [Implementation Order & Dependency Map](#13-implementation-order--dependency-map)
14. [File-by-File Checklist](#14-file-by-file-checklist)
15. [Feature Release Roadmap](#15-feature-release-roadmap)

---

## 1. Where You Are Now: Completed Backend Sprints

Your NestJS backend (cannasaas-api) is substantially built out through 12 sprints. Here is a summary of what is operational and ready for the frontend to consume:

| Sprint | Module | What Was Built |
|--------|--------|----------------|
| 1 | Infrastructure | NestJS project, Docker (PostgreSQL + PostGIS, Redis), TypeORM config, environment setup, health checks |
| 2 | Auth & Multi-Tenant | JWT authentication (access + refresh tokens), Passport strategies, User entity, RBAC guards, Tenant middleware (subdomain routing) |
| 3 | Organizations | Org → Company → Dispensary hierarchy, BrandingConfig entity, S3 uploads, geospatial queries |
| 4 | Product Catalog | Category, Product, ProductVariant, ProductImage entities, cannabis-specific fields (THC, CBD, terpenes, strain), filtering, search, low-stock alerts |
| 5 | Cart & Orders | Cart (Redis + DB), checkout flow, Order entity, order status state machine, tax calculation, multi-step checkout |
| 6 | Payments | Stripe integration (payment intents, webhooks), cash payment option, compliance event logging, purchase limits, daily sales reports |
| 7 | Age Verification | ID scan integration (Veratad/Jumio stubs), medical card verification, customer verification status tracking |
| 8 | Metrc/Compliance | Metrc integration (NY state), package tracking, purchase limit enforcement, compliance reporting, manifest generation |
| 9 | Product Discovery | Elasticsearch with cannabis synonyms/analyzers, faceted filtering, autocomplete, product recommendations, Redis caching |
| 10 | Delivery | PostGIS delivery zones, driver management, real-time location, closest-driver assignment, WebSocket tracking, Twilio SMS notifications |
| 11 | POS Integration | Adapter pattern for Dutchie (GraphQL) and Treez (REST), product mapping, scheduled inventory sync, order push, audit logging |
| 12 | Analytics & PWA | Event tracking pipeline, nightly aggregation cron, dashboard API (revenue, AOV, conversion), CSV export, PWA service worker, push notifications |

> ⚠️ **Your backend APIs are the foundation.** Every frontend feature described below will call these existing endpoints. No backend rewrite is needed — only targeted additions as new frontend features reveal gaps.

---

## 2. What Comes Next: The Frontend Build

According to the Project Guide, the React frontend is a monorepo containing three applications (Storefront, Admin, Staff) that share common packages. This section maps the Project Guide architecture directly to actionable implementation phases.

### High-Level Architecture Recap

The frontend consists of three React applications built on shared infrastructure:

| Application | Directory | Purpose & Key Features |
|-------------|-----------|------------------------|
| Customer Storefront | `apps/storefront` | Public e-commerce: product browsing, search, cart, checkout, user accounts, order tracking. Mobile-first responsive design. |
| Admin Portal | `apps/admin` | Store management: dashboard analytics, product/inventory CRUD, order processing, customer management, settings, compliance reports. |
| Staff Portal | `apps/staff` | Simplified interface for budtenders: order fulfillment, customer lookup, inventory search, quick actions, delivery dispatch. |

### Shared Packages

All three apps import from these shared packages in the `packages/` directory:

- **packages/ui** — Shared UI component library built on shadcn/ui + Tailwind CSS + Radix UI primitives (Button, Input, Card, Modal, Table, Dialog, Toast, etc.)
- **packages/api-client** — Axios-based HTTP client with interceptors, TanStack Query hooks for every API domain (useProducts, useOrders, useAuth, etc.), and service layer functions
- **packages/stores** — Zustand state stores: authStore, cartStore, organizationStore, themeStore — shared across all three apps
- **packages/utils** — Formatting (currency, dates), validation schemas (Zod), constants, and helper functions
- **packages/types** — Shared TypeScript interfaces and types: Product, Order, User, Organization, Cart, etc. — single source of truth

### Technology Stack Summary

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript 5.3 |
| Build Tool | Vite 5 (per-app), Turborepo (monorepo orchestration) |
| Package Manager | pnpm (workspace protocol) |
| State Management | Zustand 4.4 (client state) + TanStack Query 5 (server state) |
| Routing | React Router v6 (per-app, lazy-loaded pages) |
| Styling | Tailwind CSS 3.3 + shadcn/ui (Radix UI primitives) |
| Forms | React Hook Form 7 + Zod validation |
| HTTP Client | Axios 1.6 with auth interceptors + token refresh |
| Charts | Recharts 2.10 (admin analytics dashboards) |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library + Playwright (E2E) |
| Linting | ESLint + Prettier + prettier-plugin-tailwindcss |

---

## 3. Phase A: Monorepo Setup & Tooling (Week 1)

This phase creates the entire project skeleton. By the end, you will have a running monorepo with three empty React apps that share common configuration.

### Step A.1: Initialize the Monorepo Root

Create the root directory and initialize pnpm workspaces with Turborepo:

```bash
mkdir cannabis-platform && cd cannabis-platform
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# Install Turborepo as a dev dependency
pnpm add -Dw turbo
```

#### Why pnpm + Turborepo?

pnpm uses a content-addressable store, which means shared dependencies are installed once and symlinked. Turborepo adds intelligent caching and parallel task execution. Together, they provide the fastest possible monorepo build pipeline. This is the same tooling used by Vercel, Shopify, and Netflix.

### Step A.2: Configure Turborepo

Create `turbo.json` at the project root. This defines the dependency graph for build, dev, lint, and test tasks:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

> 💡 **TIP:** The `dependsOn: ["^build"]` syntax means "build my dependencies first." This ensures `packages/types` compiles before `apps/storefront` tries to import from it.

### Step A.3: Create the Three React Apps

Each app is a standalone Vite + React + TypeScript project that imports from shared packages:

```bash
# Storefront (customer-facing)
mkdir -p apps/storefront && cd apps/storefront
pnpm create vite . --template react-ts

# Admin Portal
mkdir -p ../admin && cd ../admin
pnpm create vite . --template react-ts

# Staff Portal
mkdir -p ../staff && cd ../staff
pnpm create vite . --template react-ts

cd ../../  # back to root
```

### Step A.4: Create Shared Package Stubs

Initialize each shared package with its own `package.json` and `tsconfig.json`. These will be populated in Phase B:

```bash
# Create package directories
mkdir -p packages/{ui,api-client,stores,utils,types}/src

# Initialize each with package.json
for pkg in ui api-client stores utils types; do
  cat > packages/$pkg/package.json << EOF
{
  "name": "@cannasaas/$pkg",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
EOF
done
```

### Step A.5: Configure Shared TypeScript

Create a base `tsconfig.json` at the root. Each app and package extends it:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Step A.6: Add Shared Dependencies to Each App

Wire each app to consume the shared packages using the pnpm workspace protocol:

```jsonc
// In each app's package.json, add:
"dependencies": {
  "@cannasaas/ui": "workspace:*",
  "@cannasaas/api-client": "workspace:*",
  "@cannasaas/stores": "workspace:*",
  "@cannasaas/utils": "workspace:*",
  "@cannasaas/types": "workspace:*"
}
```

```bash
# Then install everything from root:
pnpm install
```

### Step A.7: Configure Tailwind CSS + shadcn/ui

Install Tailwind in each app and configure the shared design tokens. The `tailwind.config.js` uses CSS custom properties (HSL values) that get overridden per-tenant for dynamic branding:

```bash
# In each app directory:
pnpm add tailwindcss postcss autoprefixer
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast
pnpm add class-variance-authority clsx tailwind-merge
npx tailwindcss init -p

# Initialize shadcn/ui:
npx shadcn-ui@latest init
```

> ⚠️ **IMPORTANT:** The `tailwind.config.js` must use the HSL CSS variable pattern from the Project Guide (`--primary`, `--secondary`, `--accent`, etc.). This is what enables per-tenant branding. Each tenant's colors are injected at runtime via the ThemeProvider component.

### Step A.8: Verify the Setup

Run all three apps simultaneously from the root:

```bash
# Start all apps in dev mode
turbo dev

# You should see:
# apps/storefront  -> http://localhost:5173
# apps/admin       -> http://localhost:5174
# apps/staff       -> http://localhost:5175
```

### Phase A Deliverables Checklist

- [ ] Monorepo root with `pnpm-workspace.yaml` and `turbo.json`
- [ ] Three Vite + React + TypeScript apps (storefront, admin, staff)
- [ ] Five shared packages initialized (ui, api-client, stores, utils, types)
- [ ] Base `tsconfig.json` extended by all projects
- [ ] Tailwind CSS + shadcn/ui configured in each app
- [ ] `turbo dev` starts all three apps simultaneously
- [ ] ESLint + Prettier configured with consistent rules

---

## 4. Phase B: Shared Packages & Design System (Weeks 1-2)

This phase builds out the five shared packages that all three apps depend on. This is the most architecturally critical phase because it establishes the contracts between frontend and backend.

### Step B.1: packages/types — TypeScript Interfaces

This package defines every data model your frontend will work with. These types must exactly match the shapes returned by your NestJS API. Create one file per domain:

#### Product.ts

This is the most complex type because it includes cannabis-specific metadata, variants with pricing/inventory, media assets, and review aggregates. Your NestJS Product entity from Sprint 4 maps directly to this:

```typescript
// packages/types/src/models/Product.ts
export interface Product {
  _id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: { short: string; long: string; aiGenerated?: string };
  category: string;
  subcategory: string;
  tags: string[];
  brand: { name: string; logo?: string };
  cannabisInfo: CannabisInfo;
  variants: ProductVariant[];
  media: { images: ProductImage[]; videos?: ProductVideo[] };
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
  reviews: { count: number; averageRating: number; distribution: Record<number, number> };
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CannabisInfo {
  strain: { name: string; type: string; genetics?: string };
  cannabinoids: {
    thc: { percentage: number; min?: number; max?: number };
    cbd: { percentage: number; min?: number; max?: number };
  };
  terpenes: Array<{ name: string; percentage: number }>;
  effects: { primary: string[]; medical?: string[] };
  flavors: string[];
  labTesting: {
    tested: boolean;
    labName?: string;
    batchNumber?: string;
    testDate?: string;
    coaUrl?: string;
  };
}

export interface ProductVariant {
  _id: string;
  name: string;
  sku: string;
  weight?: number;
  unit?: string;
  pricing: {
    basePrice: number;
    salePrice?: number;
    onSale: boolean;
    costPrice?: number;
    msrp?: number;
  };
  inventory: {
    quantity: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  };
  compliance?: {
    metrcId?: string;
    batchNumber?: string;
    harvestDate?: string;
    expirationDate?: string;
  };
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVideo {
  url: string;
  thumbnail?: string;
}
```

Create corresponding types for: **Order**, **User**, **Organization**, **CartItem**, **Coupon**, **Review**, **DeliveryZone**, **Driver**, **ComplianceEvent**, and **AnalyticsSummary**. Each should mirror the entity shapes from your NestJS backend.

#### api.ts — API Response Wrappers

Standardize how every API response is typed:

```typescript
// packages/types/src/api.ts
export interface ApiResponse<T> { data: T; message?: string; }
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number; limit: number;
    total: number; totalPages: number;
  };
}
export interface ApiError {
  statusCode: number; message: string;
  errors?: Record<string, string[]>;
}
```

> 💡 **TIP:** Keep this package dependency-free. It should only contain interfaces and type aliases — no runtime code. This makes it importable everywhere with zero bundle cost.

### Step B.2: packages/stores — Zustand State Stores

Create four core stores as defined in the Project Guide. These manage all client-side state that is not server data (server data is handled by TanStack Query in the api-client package).

#### authStore.ts

Manages user session, JWT tokens, and authentication status. Uses the persist middleware to survive page refreshes (stores refreshToken in localStorage, NOT the accessToken for security):

```typescript
// packages/stores/src/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@cannasaas/types';

// Full implementation from Project Guide Section 4
// Key: persist only user + refreshToken, never accessToken
```

#### cartStore.ts

Client-side shopping cart with Immer middleware for immutable updates. Persisted to localStorage so the cart survives browser closes.

#### organizationStore.ts

Holds the current tenant context (organization, company, dispensary) resolved from the subdomain during app initialization.

#### themeStore.ts

Manages dark/light mode preference. Persisted to localStorage.

### Step B.3: packages/api-client — HTTP Client & TanStack Query Hooks

This is the bridge between your frontend and your NestJS API. It contains:

- **client.ts** — Axios instance with base URL, auth interceptor (adds JWT), tenant header interceptor (adds `X-Organization-Id`), and automatic token refresh on 401
- **endpoints.ts** — Typed endpoint map for every API route
- **hooks/** — TanStack Query hooks: `useProducts(filters)`, `useProduct(slug)`, `useCreateProduct()`, `useOrders(filters)`, `useCart()`, `useAddToCart()`, `useLogin()`, `useCurrentUser()`, `useAnalytics(range)`, `useProductReviews(id)`

### Step B.4: packages/ui — Shared Component Library

Wrap shadcn/ui primitives with your design system. Each component should accept a `className` prop for per-app overrides. Start with: Button, Input, Card, Dialog, Table, Select, Badge, Toast, Spinner, EmptyState.

### Step B.5: packages/utils — Utility Functions

- **cn.ts** — The `clsx` + `tailwind-merge` utility function used by every UI component
- **formatting.ts** — `formatCurrency(cents, locale?)`, `formatDate(date, format?)`, `formatWeight(grams)`
- **validation.ts** — Zod schemas matching backend DTOs (loginSchema, registerSchema, productSchema, orderSchema)
- **date.ts** — Wrappers around date-fns for consistent date handling
- **currency.ts** — Tax calculation helpers, price formatting with locale support

---

## 5. Phase C: Customer Storefront App (Weeks 2-4)

The storefront is the highest priority because it is customer-facing and directly generates revenue. It is a mobile-first, responsive single-page application.

### Page-by-Page Implementation

#### Home Page (`pages/storefront/Home.tsx`)

Hero banner with current promotions, featured product carousel, category grid navigation, and trending/new arrival sections. Calls `useProducts` with `featured=true` filter and the organization's active promotions.

#### Products Page (`pages/storefront/Products.tsx`)

This is the most complex storefront page. The Project Guide provides the complete implementation including:

- URL-driven filters via `useSearchParams` (category, price range, THC range, strain type)
- Debounced search input (500ms delay using `useDebounce` hook)
- Sidebar filter accordion (categories, price slider, THC slider, strain type checkboxes)
- Sort dropdown (popularity, price asc/desc, newest, name)
- Responsive product grid (2-col mobile, 3-col desktop)
- Skeleton loading states during data fetch
- Smart pagination with ellipsis (shows first, last, current ±1 pages)

#### Product Detail Page (`pages/storefront/ProductDetail.tsx`)

Displays full cannabis product information including strain genetics, cannabinoid percentages, terpene profiles, effects, and flavors. Variant selector for different sizes/weights with dynamic price updates. Connects to your Sprint 4 product and Sprint 9 recommendations APIs.

#### Cart Page (`pages/storefront/Cart.tsx`)

Reads from the Zustand `cartStore`. Displays line items with quantity adjusters, remove buttons, and real-time subtotal calculation. Coupon code input calls your Sprint 5 cart coupon endpoint. Links to checkout with purchase limit validation.

#### Checkout Page (`pages/storefront/Checkout.tsx`)

Multi-step form using React Hook Form + Zod. The Project Guide provides the full `CheckoutForm` component with:

- Fulfillment method selection (delivery vs pickup) with conditional fields
- Address selection from saved addresses or new address form
- Payment method (card via Stripe Elements or cash)
- Coupon code application and loyalty points redemption
- Order summary with tax calculation
- Stripe payment intent creation on submit

#### Account Pages (`pages/storefront/Account.tsx`)

Nested routes under `/account/*` for: profile editing, order history with status tracking, saved addresses, loyalty points dashboard, and notification preferences. Uses `ProtectedRoute` wrapper from the Project Guide.

### Storefront Layouts

- **StorefrontLayout:** Header (logo, search bar, navigation, cart icon with badge, user menu) + main content Outlet + Footer
- **Header:** Dynamic logo from `organizationStore`, `SearchBar` component with autocomplete, `CartButton` showing `itemCount` from `cartStore`
- **Footer:** Store info, quick links, social media, age verification notice

---

## 6. Phase D: Admin Portal App (Weeks 4-6)

The admin portal is a data-dense management application. It uses a sidebar navigation layout and is optimized for desktop use (though responsive). Protected by `ProtectedRoute` with `requiredRole="admin"`.

### Dashboard Page

Overview cards (total revenue, orders today, active customers, average order value) with change percentages. Revenue chart using Recharts (line or area chart, selectable date range). Top products table, recent orders list, and low-stock alerts. Calls your Sprint 12 analytics endpoints.

### Products Management

DataTable with columns: image thumbnail, name, category, THC%, price, stock, status. Bulk actions (activate, deactivate, delete). Create/Edit form with:

- **Basic info:** name, slug (auto-generated), descriptions (with AI generation button calling your Sprint 9 AI endpoint)
- **Cannabis info:** strain type selector, THC/CBD percentage inputs, terpene multi-select, effects and flavors tag inputs
- **Variants:** dynamic variant list with pricing (base, sale, cost, MSRP) and inventory per variant
- **Media:** drag-and-drop image upload to S3 (Sprint 3 endpoint), primary image selection, alt text
- **SEO:** meta title, meta description, keywords (with AI suggestion button)
- **Compliance:** METRC ID input, batch number, harvest/expiration dates

### Order Management

Order list with filters (status, date range, fulfillment method). Order detail view with status timeline, customer info, items snapshot, payment details, and fulfillment tracking. Staff can update order status (confirm, mark ready, assign driver, mark delivered, cancel with refund). Connects to your Sprint 5 order endpoints and Sprint 10 delivery assignment.

### Customer Management

Customer list with search and filters. Customer detail shows order history, loyalty status, verification status, and lifetime value. Verification management for age/medical card approvals (Sprint 7 endpoints).

### Analytics

Extended analytics page consuming your Sprint 12 dashboard API. Includes: revenue over time, orders by fulfillment type, top products by revenue/quantity, customer acquisition chart, conversion funnel, and CSV export.

### Settings

Organization profile editing (name, hours, contact), branding configuration (logo upload, color pickers for primary/secondary/accent, font selection), delivery zone management (map-based polygon editor for PostGIS zones from Sprint 10), tax configuration, and staff account management.

---

## 7. Phase E: Staff Portal App (Weeks 6-7)

The staff portal is a streamlined interface for budtenders and fulfillment staff. It prioritizes speed and simplicity over feature richness.

### Key Pages

- **Order Queue:** Real-time order list grouped by status (new, preparing, ready for pickup, out for delivery). WebSocket connection from Sprint 10 for live updates. One-click status advancement.
- **Customer Lookup:** Quick search by name, phone, or email. Displays verification status, purchase history, and remaining daily purchase limit (Sprint 8 compliance endpoint).
- **Inventory Search:** Fast product lookup by name or SKU. Shows current stock levels per variant. Barcode scanner integration placeholder. Low-stock alerts.
- **Delivery Dispatch:** Assign drivers to delivery orders, view active deliveries on map (WebSocket from Sprint 10), mark deliveries complete.
- **Quick Actions:** Verify customer age, check purchase limits, look up product details, process returns.

---

## 8. Phase F: Backend API Integration (Weeks 3-7)

This phase runs in parallel with the app-building phases. As each page is built, the corresponding API integration hooks are wired up. This section details the integration patterns.

### TanStack Query Configuration

The QueryClient is configured at the app root with global defaults from the Project Guide:

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});
```

### API-to-Hook Mapping

This table maps your existing NestJS endpoints to the TanStack Query hooks that each app will use:

| Backend Endpoint | Hook Name | Used By | Query Key |
|------------------|-----------|---------|-----------|
| `GET /products` | `useProducts` | Storefront, Admin | `['products', filters]` |
| `GET /products/:slug` | `useProduct` | Storefront | `['product', slug]` |
| `POST /products` | `useCreateProduct` | Admin | Invalidates `['products']` |
| `POST /auth/login` | `useLogin` | All apps | N/A (mutation) |
| `GET /orders` | `useOrders` | Admin, Staff | `['orders', filters]` |
| `POST /orders` | `useCreateOrder` | Storefront | Invalidates `['orders']` |
| `GET /cart` | `useCart` | Storefront | `['cart']` |
| `POST /cart/items` | `useAddToCart` | Storefront | Optimistic update |
| `GET /users/me` | `useCurrentUser` | All apps | `['user', 'me']` |
| `GET /analytics/overview` | `useAnalytics` | Admin | `['analytics', range]` |
| `GET /reviews/:productId` | `useProductReviews` | Storefront | `['reviews', id]` |

### Optimistic Updates Pattern

For the cart, use optimistic updates so the UI responds instantly. The Project Guide provides the complete pattern: cancel outgoing refetches, snapshot previous state, apply optimistic update, roll back on error, and always refetch on settle. This gives users instant feedback while ensuring data consistency.

---

## 9. Phase G: Authentication & Multi-Tenant Wiring (Weeks 2-3)

### Authentication Flow

The auth system uses the authStore (Zustand) + api-client (Axios interceptors) + ProtectedRoute (React Router wrapper):

1. User submits login form → `useLogin` mutation calls `POST /auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. `authStore.login()` stores user + refreshToken (persisted), accessToken (memory only)
4. Axios request interceptor attaches `Authorization: Bearer {accessToken}` to every request
5. On 401 response, interceptor automatically calls `POST /auth/refresh` with refreshToken
6. If refresh succeeds, retry original request with new accessToken
7. If refresh fails, `authStore.logout()` clears state and redirects to login

### ProtectedRoute Component

Wraps routes that require authentication. Accepts optional `requiredRole` prop for RBAC. Redirects to login if unauthenticated, shows forbidden page if role doesn't match.

### Multi-Tenant Resolution

This mirrors your Sprint 2 backend tenant middleware:

1. The `RootLayout` component is the first thing that renders (wraps all routes)
2. It extracts the subdomain from `window.location.hostname` (e.g., `greenleaf` from `greenleaf.cannasaas.com`)
3. It calls `GET /organizations/by-slug/:slug` to fetch the organization data
4. Stores the result in `organizationStore` via `setOrganization(org)`
5. `ThemeProvider` reads `organizationStore` and applies branding (colors, fonts, logo, favicon, page title)
6. If no organization is found, renders a 404-style "Store not found" page

> ⚠️ **IMPORTANT:** Every API request must include the `organizationId`. The Axios request interceptor should add an `X-Organization-Id` header (or the backend resolves it from the subdomain). This ensures tenant data isolation.

---

## 10. Phase H: Theming & Dynamic Branding (Week 4)

Each dispensary tenant gets their own branding. The `ThemeProvider` component from the Project Guide handles this by dynamically setting CSS custom properties on the document root element.

### How It Works

1. Organization branding data is fetched during app initialization (Phase G above)
2. `ThemeProvider` reads `organization.branding.colors` (primary, secondary, accent)
3. Each hex color is converted to HSL using the `hexToHSL` utility function
4. HSL values are set as CSS custom properties: `--primary`, `--secondary`, `--accent`
5. Tailwind CSS references these variables via the theme config (`hsl(var(--primary))`)
6. All shadcn/ui components automatically use the tenant's colors with zero component changes
7. Fonts are applied similarly via `--font-heading` and `--font-body` CSS properties
8. Custom CSS and favicon are injected for advanced per-tenant customization
9. Dark/light mode is toggled via the `themeStore`, adding/removing the `dark` class on document root

```typescript
// components/providers/ThemeProvider.tsx
import { useEffect } from 'react';
import { useOrganizationStore } from '@cannasaas/stores';
import { useThemeStore } from '@cannasaas/stores';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const organization = useOrganizationStore((state) => state.organization);
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    if (!organization?.branding) return;
    const { colors, fonts, customCSS } = organization.branding;

    if (colors) {
      const root = document.documentElement;
      if (colors.primary) root.style.setProperty('--primary', hexToHSL(colors.primary));
      if (colors.secondary) root.style.setProperty('--secondary', hexToHSL(colors.secondary));
      if (colors.accent) root.style.setProperty('--accent', hexToHSL(colors.accent));
    }

    if (fonts) {
      const root = document.documentElement;
      if (fonts.heading) root.style.setProperty('--font-heading', fonts.heading);
      if (fonts.body) root.style.setProperty('--font-body', fonts.body);
    }

    if (customCSS) {
      let styleEl = document.getElementById('custom-org-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-org-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = customCSS;
    }

    if (organization.branding.logo?.favicon) {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (link) link.href = organization.branding.logo.favicon;
    }

    document.title = organization.name || 'Cannabis Dispensary';
  }, [organization]);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [mode]);

  return <>{children}</>;
}
```

> 💡 **TIP:** Test branding with at least two different tenant configurations during development. Set up `greenleaf.localhost:5173` and `blueleaf.localhost:5173` with different color schemes to verify the dynamic theming works correctly.

---

## 11. Phase I: Testing Strategy & Implementation (Weeks 5-8)

Testing runs in parallel with development. The Project Guide specifies Vitest for unit and integration tests, React Testing Library for component tests, and Playwright for end-to-end tests.

### Testing Pyramid

| Level | Tool | What to Test |
|-------|------|-------------|
| Unit Tests | Vitest | Zustand stores (addItem, removeItem, cart calculations), utility functions (formatCurrency, hexToHSL), Zod validation schemas |
| Component Tests | RTL + Vitest | UI components (Button renders, disabled state, variants), ProductCard (displays name, price, handles add-to-cart click), CheckoutForm (validates required fields) |
| Integration Tests | RTL + MSW | Full page renders with mocked API responses (Products page fetches and displays products, Checkout submits order), Auth flow (login, token refresh, logout) |
| E2E Tests | Playwright | Complete user journeys: browse products → add to cart → checkout → order confirmation. Admin: create product → verify in storefront |

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

The Project Guide provides complete test examples for the Button component, cartStore hooks, and integration tests with rendered pages and mocked APIs. Follow these patterns to achieve the test coverage needed for confidence in the MVP.

---

## 12. Phase J: Build, Deployment & CI/CD (Week 8)

### Build Configuration

Each app builds independently via Vite with Turborepo orchestration:

```bash
# Build all apps (Turborepo handles dependency order)
turbo build

# Each app outputs to apps/{name}/dist/
# These are static files deployable to any CDN/host
```

### Deployment Strategy

1. **Storefront:** Deploy to Cloudflare Pages or Vercel. Configure wildcard subdomain routing (`*.cannasaas.com`) so each tenant resolves to the same React app. The app reads the subdomain at runtime.
2. **Admin Portal:** Deploy to same CDN but on a separate route or subdomain (`admin.cannasaas.com`). Protected by auth, so no public access concerns.
3. **Staff Portal:** Deploy similarly, accessible at `staff.cannasaas.com` or as a route within the admin domain.
4. **NestJS Backend:** Already containerized from Sprint 1. Deploy via AWS ECS, Railway, or Render. Ensure CORS allows all `*.cannasaas.com` origins.

### CI/CD Pipeline (GitHub Actions)

The Project Guide provides a complete GitHub Actions workflow that: installs pnpm dependencies, type-checks all packages, runs ESLint, executes Vitest tests, builds all apps, and deploys to production on main branch merges.

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: turbo type-check
      - run: turbo lint
      - run: turbo test
      - run: turbo build

  deploy-storefront:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: turbo build --filter=storefront
      # Deploy to Cloudflare Pages or Vercel
```

---

## 13. Implementation Order & Dependency Map

This is the critical-path order. Each item depends on the ones above it:

| Week | Phase | What to Build | Depends On |
|------|-------|---------------|------------|
| 1 | A: Monorepo | pnpm workspace, Turborepo, 3 Vite apps, Tailwind/shadcn | Nothing (start here) |
| 1-2 | B: Packages | types, stores, api-client, ui components, utils | Phase A complete |
| 2-3 | G: Auth | Login/Register pages, ProtectedRoute, tenant resolution, token refresh | api-client + stores built |
| 2-4 | C: Storefront | Home, Products, Product Detail, Cart, Checkout, Account pages | Phase B + Phase G auth flow |
| 4 | H: Theming | ThemeProvider, hexToHSL, per-tenant branding, dark mode | organizationStore + CSS vars |
| 4-6 | D: Admin | Dashboard, Products CRUD, Orders, Customers, Analytics, Settings | Full api-client + ui library |
| 6-7 | E: Staff | Order queue, customer lookup, inventory search, delivery dispatch | Admin patterns established |
| 5-8 | I: Testing | Unit, component, integration, E2E tests across all apps | Pages exist to test |
| 8 | J: Deploy | Vite builds, Cloudflare/Vercel, CI/CD, wildcard subdomains | All apps building cleanly |

> 💡 **TIP:** You do not need to finish one phase entirely before starting the next. For example, start building storefront pages (Phase C) as soon as you have the api-client and a few UI components from Phase B. The dependency map shows the minimum prerequisites.

---

## 14. File-by-File Checklist

This is every file you need to create, organized by package.

### packages/types
- [ ] `src/index.ts` — barrel export
- [ ] `src/models/Product.ts` — Product, CannabisInfo, ProductVariant, ProductImage
- [ ] `src/models/Order.ts` — Order, OrderItem, OrderStatus
- [ ] `src/models/User.ts` — User, UserRole, Permission
- [ ] `src/models/Organization.ts` — Organization, Company, Dispensary, BrandingConfig
- [ ] `src/models/Cart.ts` — Cart, CartItem
- [ ] `src/models/Review.ts` — Review, ReviewSummary
- [ ] `src/models/Delivery.ts` — DeliveryZone, Driver, DeliveryAssignment
- [ ] `src/models/Compliance.ts` — ComplianceEvent, PurchaseLimit
- [ ] `src/models/Analytics.ts` — AnalyticsSummary, TimeRange
- [ ] `src/api.ts` — ApiResponse, PaginatedResponse, ApiError

### packages/stores
- [ ] `src/index.ts` — barrel export
- [ ] `src/authStore.ts` — user, tokens, login/logout actions
- [ ] `src/cartStore.ts` — items, add/remove/update, totals
- [ ] `src/organizationStore.ts` — current tenant context
- [ ] `src/themeStore.ts` — dark/light mode

### packages/api-client
- [ ] `src/index.ts` — barrel export
- [ ] `src/client.ts` — Axios instance + interceptors
- [ ] `src/endpoints.ts` — typed endpoint map
- [ ] `src/hooks/useAuth.ts` — useLogin, useRegister, useLogout
- [ ] `src/hooks/useProducts.ts` — useProducts, useProduct, CRUD mutations
- [ ] `src/hooks/useOrders.ts` — useOrders, useOrderTracking, mutations
- [ ] `src/hooks/useCart.ts` — useCart, useAddToCart (optimistic)
- [ ] `src/hooks/useUsers.ts` — useCurrentUser, useAddresses, useLoyalty
- [ ] `src/hooks/useReviews.ts` — useProductReviews, useCreateReview
- [ ] `src/hooks/useAnalytics.ts` — useAnalyticsOverview, useExportCsv

### packages/ui
- [ ] `src/index.ts` — barrel export
- [ ] `src/components/Button/Button.tsx`
- [ ] `src/components/Input/Input.tsx`
- [ ] `src/components/Card/Card.tsx`
- [ ] `src/components/Dialog/Dialog.tsx`
- [ ] `src/components/Table/DataTable.tsx`
- [ ] `src/components/Select/Select.tsx`
- [ ] `src/components/Badge/Badge.tsx`
- [ ] `src/components/Toast/Toast.tsx`
- [ ] `src/components/Skeleton/Skeleton.tsx`
- [ ] `src/components/Tabs/Tabs.tsx`
- [ ] `src/components/Accordion/Accordion.tsx`
- [ ] `src/components/Slider/Slider.tsx`
- [ ] `src/components/Checkbox/Checkbox.tsx`

### packages/utils
- [ ] `src/index.ts` — barrel export
- [ ] `src/cn.ts` — clsx + tailwind-merge
- [ ] `src/formatting.ts` — formatCurrency, formatDate, formatWeight
- [ ] `src/validation.ts` — Zod schemas for all forms
- [ ] `src/date.ts` — date-fns wrappers
- [ ] `src/currency.ts` — tax calculation helpers

---

## 15. Feature Release Roadmap

After the core frontend ships, features are released incrementally:

| Release | Target | Features |
|---------|--------|----------|
| Release 1 (MVP) | Week 8 | Storefront (browse, cart, checkout), Admin (dashboard, products, orders), basic auth, single-tenant |
| Release 2 | Week 12 | Multi-tenant branding, delivery tracking, age verification gate, compliance dashboard |
| Release 3 | Week 16 | Elasticsearch search + autocomplete, product recommendations, POS sync status |
| Release 4 | Week 20 | Staff portal, WebSocket live orders, inventory management, advanced analytics |
| Release 5 | Week 24 | PWA + push notifications, loyalty program, AI recommendations, customer reviews |

---

*End of Implementation Guide*
*CannaSaas — Building the future of cannabis commerce*
