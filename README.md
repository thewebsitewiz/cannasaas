# CannaSaas / GreenStack

> Multi-tenant cannabis dispensary SaaS platform for NY, NJ, and CT markets.
> An affordable alternative to Dutchie, Jane Technologies, and Flowhub — built for independent dispensary operators with 1–5 locations.

---

## What Is This

CannaSaas is a full-stack platform that gives cannabis dispensaries everything they need to run their business: an online storefront for customers, an admin portal for owners, a staff terminal for budtenders, and a self-service kiosk — all backed by a single API with built-in Metrc compliance reporting.

**Tech Stack:**

| Layer            | Technology                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| API              | NestJS, TypeORM, PostgreSQL, GraphQL, BullMQ, Redis                      |
| Storefront       | Next.js 14 (App Router), React 18, TanStack Query                        |
| Admin            | Vite + React 18, TanStack Query                                          |
| Staff Portal     | Vite + React 18 (dark terminal UI, tablet-optimized)                     |
| Kiosk            | Vite + React 18 (touch-first, large targets)                             |
| Platform Manager | Vite + React 18 (super-admin tenant management)                          |
| Shared Packages  | `packages/ui`, `packages/types`, `packages/utils`, `packages/api-client` |
| Monorepo         | pnpm workspaces + Turborepo                                              |
| Design System    | CSS custom properties, runtime theme switching, Google Fonts             |

---

## Repo Structure

```
cannasaas/
├── apps/
│   ├── api/                    # NestJS GraphQL API (port 3000)
│   │   └── src/modules/        # 33 domain modules (see below)
│   ├── storefront/             # Next.js customer-facing shop (port 5173)
│   ├── admin/                  # Vite React admin portal (port 5174)
│   ├── staff/                  # Vite React POS / floor ops (port 5175)
│   ├── kiosk/                  # Vite React self-service terminal (port 5176)
│   └── platform/               # Vite React super-admin panel (port 5177)
│
├── packages/
│   ├── ui/                     # Shared components, design system CSS, themes
│   │   └── src/
│   │       ├── casual.css      # Default design system (Lora + Plus Jakarta Sans)
│   │       ├── spring-bloom.css # Alt design system (Sora + Nunito Sans)
│   │       └── themes/         # Runtime color themes (casual, dark, regal, etc.)
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # NY/NJ/CT tax helpers, Zod schemas
│   └── api-client/             # Axios + TanStack Query hooks
│
├── docs/                       # Architecture docs, prototypes, design system reference
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## API Modules

The NestJS API is organized into 33 domain modules:

| Module                | Description                                                                                    | Status           |
| --------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| **auth**              | JWT access + refresh tokens, register, login, role guards                                      | ✅ Complete      |
| **users**             | User CRUD, role management                                                                     | ✅ Complete      |
| **organizations**     | Multi-tenant org hierarchy                                                                     | ✅ Complete      |
| **companies**         | Company entities under orgs                                                                    | ✅ Complete      |
| **dispensaries**      | Dispensary CRUD, settings, design system config                                                | ✅ Complete      |
| **products**          | Product catalog, variants, pricing, batches, full-text search, autocomplete                    | ✅ Complete      |
| **brands**            | Brand entities linked to products                                                              | ✅ Complete      |
| **manufacturers**     | Manufacturer entities                                                                          | ✅ Complete      |
| **inventory**         | Stock tracking, reservations                                                                   | ✅ Core complete |
| **inventory-control** | Adjustments, audits, transfers                                                                 | ✅ Core complete |
| **orders**            | Full lifecycle: pending → confirmed → preparing → ready → completed                            | ✅ Complete      |
| **payments**          | Payment processing integration                                                                 | 🔲 Stub          |
| **stripe**            | Stripe payment integration                                                                     | 🔲 Stub          |
| **metrc**             | Metrc track-and-trace: credentials, sales receipt sync, compliance reports, BullMQ retry queue | ✅ Complete      |
| **compliance**        | Compliance logging and audit trail                                                             | ✅ Core complete |
| **customers**         | Customer profiles, order history                                                               | ✅ Core complete |
| **loyalty**           | Points, tiers, rewards                                                                         | 🔲 Stub          |
| **promotions**        | Discount rules, promo codes                                                                    | 🔲 Stub          |
| **fulfillment**       | Pickup and delivery workflow                                                                   | 🔲 Stub          |
| **scheduling**        | Staff shift scheduling                                                                         | 🔲 Stub          |
| **staffing**          | Employee management                                                                            | 🔲 Stub          |
| **timeclock**         | Clock in/out tracking                                                                          | 🔲 Stub          |
| **vendor**            | Vendor/supplier management                                                                     | 🔲 Stub          |
| **notifications**     | Order status notifications                                                                     | 🔲 Stub          |
| **analytics**         | Business intelligence queries                                                                  | 🔲 Stub          |
| **reporting**         | Report generation                                                                              | 🔲 Stub          |
| **pos**               | POS integration layer                                                                          | 🔲 Stub          |
| **platform**          | Super-admin tenant operations                                                                  | 🔲 Stub          |
| **tenant**            | Tenant resolution middleware                                                                   | ✅ Complete      |
| **theme**             | Theme config per dispensary                                                                    | ✅ Complete      |
| **product-data**      | Strain data, Leafly scraper integration                                                        | ✅ Complete      |
| **image**             | Image upload and processing                                                                    | 🔲 Stub          |
| **ws**                | WebSocket gateway for real-time updates                                                        | 🔲 Stub          |

---

## Getting Started

### Prerequisites

- **Node.js** 20.x (managed via `.nvmrc`)
- **pnpm** 8+
- **PostgreSQL** 14+ (local or Docker)
- **Redis** 7+ (required for BullMQ job queue)
- **Docker** (optional, for Postgres/Redis)

### Setup

```bash
# Clone
git clone https://github.com/thewebsitewiz/cannasaas.git
cd cannasaas

# Install dependencies
nvm use
pnpm install

# Environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your database credentials

# Database
createdb cannasaas  # or use Docker

# Run migrations
cd apps/api
source ~/.nvm/nvm.sh && nvm use
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/data-source.ts

# Start everything
cd ../..
pnpm dev          # Starts all apps via Turborepo
```

### Individual App Commands

```bash
# API only
pda               # Shell alias → cd to root, start API

# Individual apps
cd apps/storefront && npx next dev --port 5173
cd apps/admin && pnpm dev        # port 5174
cd apps/staff && pnpm dev        # port 5175
cd apps/kiosk && pnpm dev        # port 5176
cd apps/platform && pnpm dev     # port 5177
```

### Environment Variables

```bash
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cannasaas
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
METRC_INTEGRATOR_API_KEY=your-key
METRC_SANDBOX_MODE=true

# apps/storefront/.env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DISPENSARY_ID=c0000000-0000-0000-0000-000000000001
VITE_DISPENSARY_ID=c0000000-0000-0000-0000-000000000001
VITE_API_URL=http://localhost:3000/graphql
```

---

## Core Features

### Multi-Tenant Architecture

Every dispensary is a tenant. Data is scoped by `dispensaryId` at every layer:

- API queries filter by dispensaryId
- Role guards prevent cross-tenant access
- Budtenders can only access their own dispensary's data
- Org admins can access all dispensaries in their organization

### Order Lifecycle

```
pending → confirmed → preparing → ready → completed → [Metrc sync]
                                                    ↘ cancelled
```

| Mutation              | Transition            | Effect                                        |
| --------------------- | --------------------- | --------------------------------------------- |
| `createOrder`         | → pending             | Inventory reserved, tax calculated (NY/NJ/CT) |
| `confirmOrder`        | pending → confirmed   | Staff acknowledges order                      |
| `startPreparingOrder` | confirmed → preparing | Staff begins fulfillment                      |
| `markOrderReady`      | preparing → ready     | Packed and waiting                            |
| `completeOrder`       | ready → completed     | Inventory deducted, Metrc sync enqueued       |
| `cancelOrder`         | any → cancelled       | Requires reason                               |

Each transition is guarded — you can't skip states.

### Tax Calculation

Automatic per-state cannabis tax:

| State | State  | Local | Excise | Total       |
| ----- | ------ | ----- | ------ | ----------- |
| NY    | 9%     | 4%    | 13%    | **26%**     |
| NJ    | 6.625% | 2%    | 6%     | **14.625%** |
| CT    | 6.35%  | 3%    | 3%     | **12.35%**  |

Tax breakdown is stored as JSONB on each order for audit.

### Metrc Compliance

Sales are automatically reported to the state Metrc system when an order completes:

1. `completeOrder` fires an `order.completed` event
2. Event listener enqueues a BullMQ job
3. Worker builds the Metrc receipt payload and POSTs to the state API
4. On failure: exponential backoff retries (1m → 2m → 4m → 8m → 16m, 5 attempts)
5. Failed syncs surface on a dashboard for manual retry

```
OrdersService.completeOrder()
  → EventEmitter2('order.completed')
    → OrderCompletedListener
      → MetrcSyncQueueService.enqueueSaleSync()
        → BullMQ 'metrc-sync' queue
          → MetrcSyncProcessor
            → MetrcService.syncSaleToMetrc()
              → POST /sales/v2/receipts (Metrc API)
```

Supports NY, NJ, and CT Metrc endpoints with sandbox mode for development.

### Product Search

Full-text search with faceted filtering:

```graphql
query {
  searchProducts(
    input: {
      dispensaryId: "..."
      query: "blue dream"
      productTypeId: 1
      minThc: 20
      maxPrice: 50
      limit: 20
    }
  ) {
    totalCount
    products {
      id
      name
      thcPercent
    }
    facets {
      productTypes {
        id
        name
        count
      }
    }
  }
}
```

Plus real-time autocomplete suggestions.

### Design System

Two design systems with runtime switching from the admin panel:

| Design System        | Fonts                    | Palette                             | File               |
| -------------------- | ------------------------ | ----------------------------------- | ------------------ |
| **Casual** (default) | Lora + Plus Jakarta Sans | Pine/Fern/Amber on Cream            | `casual.css`       |
| **Spring Bloom**     | Sora + Nunito Sans       | Meadow/Wisteria/Poppy on Warm Stone | `spring-bloom.css` |

Design systems override CSS custom properties (`--color-bg`, `--color-primary`, `--font-display`, etc.) and are loaded at runtime by the storefront's `ThemeProvider`. Selection persists to the database via `designSystemConfig` GraphQL query/mutation.

On top of the design system, 10 color themes are available (casual, dark, regal, modern, minimal, apothecary, citrus, earthy, midnight, neon) via the `data-theme` attribute.

**Adding a new design system:**

1. Create `your-theme.css` overriding the `--color-*`, `--font-*`, `--shadow-*`, and `--gs-*` tokens
2. Include portal overrides for `[data-portal="storefront"]`, `[data-portal="admin"]`, `[data-portal="staff"]`, `[data-portal="kiosk"]`
3. Add entry to `DESIGN_SYSTEMS` array in `DesignSystemPicker.tsx`
4. Add filename to `ALLOWED_DS_FILES` in `ThemeProvider.tsx`
5. Place the CSS in each app's `public/styles/` directory

---

## Database

### Migrations

```bash
cd apps/api

# Run pending
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/data-source.ts

# Generate from entity changes
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migrations/YourName -d src/data-source.ts
```

`synchronize` is `false` — all schema changes go through migrations.

### Key Tables

| Table               | Purpose                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `users`             | Auth, roles, dispensary assignment                                                   |
| `organizations`     | Top-level tenant grouping                                                            |
| `companies`         | Business entities under orgs                                                         |
| `dispensaries`      | Individual store locations (primary tenant entity)                                   |
| `products`          | Product catalog                                                                      |
| `product_variants`  | Size/weight variants per product                                                     |
| `product_pricing`   | Time-bound pricing per variant                                                       |
| `orders`            | Order header with status, tax, Metrc sync status                                     |
| `order_line_items`  | Line items with Metrc UIDs                                                           |
| `inventory`         | Current stock per variant per dispensary                                             |
| `metrc_credentials` | API keys per dispensary                                                              |
| `metrc_sync_logs`   | Audit trail of every Metrc API call                                                  |
| `theme_configs`     | Theme preset per dispensary                                                          |
| `strain_data`       | Strain database (Leafly scraper)                                                     |
| `lkp_*` (15 tables) | Product types, categories, effects, terpenes, tax categories, Metrc categories, etc. |

---

## Authentication & Roles

JWT-based with access + refresh tokens:

```graphql
mutation {
  register(input: { email: "...", password: "...", role: "customer" }) {
    accessToken
  }
}
mutation {
  login(email: "...", password: "...") {
    accessToken
    refreshToken
  }
}
query {
  me {
    id
    email
    role
    dispensaryId
  }
}
```

| Role               | Scope                        |
| ------------------ | ---------------------------- |
| `customer`         | Storefront only              |
| `budtender`        | Staff portal, own dispensary |
| `dispensary_admin` | Admin portal, own dispensary |
| `org_admin`        | All dispensaries in org      |
| `super_admin`      | Platform-wide                |

---

## GraphQL API

Endpoint: `http://localhost:3000/graphql`

### Key Queries

```graphql
products(dispensaryId: ID!): [Product]
searchProducts(input: ProductSearchInput!): ProductSearchResult
orders(dispensaryId: ID): [Order]
order(orderId: ID!): Order
complianceReport(dispensaryId: ID!): ComplianceReport
failedMetrcSyncs(dispensaryId: ID!): FailedSyncDashboard
designSystemConfig(dispensaryId: ID!): DesignSystemConfig
```

### Key Mutations

```graphql
createOrder(input: CreateOrderInput!): OrderSummary
confirmOrder(orderId: ID!): Boolean
startPreparingOrder(orderId: ID!): Boolean
markOrderReady(orderId: ID!): Boolean
completeOrder(input: CompleteOrderInput!): Boolean
cancelOrder(orderId: ID!, reason: String!): Boolean
setDesignSystem(dispensaryId: ID!, designSystem: String!, designSystemFile: String!): DesignSystemConfig
upsertMetrcCredential(input: UpsertCredentialInput!): MetrcCredential
retryFailedMetrcSyncs(dispensaryId: ID!): Int
```

---

## Development

### Shell Aliases

```bash
cs          # cd ~/Documents/Projects/cannasaas
pda         # source nvm, start API dev server
```

### Key Patterns

- **TypeORM entities** use `!:` definite assignment
- **GraphQL field names** use camelCase via `@Field({ name: 'camelCase' })` mapping to snake_case DB columns
- **Dispensary scoping** — every query validates `dispensaryId` against JWT
- **Raw SQL** for complex queries (orders, inventory); TypeORM repository for simple CRUD
- **EventEmitter2** for decoupled side effects
- **BullMQ + Redis** for reliable background processing with retry

### Code Quality

- ESLint + Prettier (root config)
- TypeScript strict mode
- Husky + lint-staged pre-commit hooks
- Commitlint (conventional commits)

---

## Pricing (GreenStack)

| Tier       | Price   | Target                    |
| ---------- | ------- | ------------------------- |
| Starter    | $299/mo | Single-location           |
| Growth     | $599/mo | 2–3 locations             |
| Enterprise | Custom  | 4+ locations, white-label |

---

## Brand

| Element         | Value                   |
| --------------- | ----------------------- |
| Product Name    | GreenStack              |
| Company Name    | CannaSaas               |
| GitHub          | thewebsitewiz/cannasaas |
| Demo Dispensary | GreenLeaf - Tappan      |
| Target Markets  | NY, NJ, CT              |

---

## Remaining Roadmap

### Critical Path

- [ ] Storefront checkout wired to orders API
- [ ] Payment integration (Stripe + cash)
- [ ] Inventory management UI (real-time stock, low-stock alerts)
- [ ] Age verification gate (21+)

### Important

- [ ] Admin portal wired to API (products, orders, inventory, compliance)
- [ ] Staff portal wired to API (order queue, fulfillment, product lookup)
- [ ] Kiosk wired to API
- [ ] Delivery/fulfillment module
- [ ] Loyalty/rewards system
- [ ] Customer accounts (order history, saved addresses)
- [ ] Notifications (order status updates)

### Nice to Have

- [ ] Additional design system themes
- [ ] POS integration (Dutchie/Treez)
- [ ] Analytics/reporting dashboards
- [ ] PWA mobile support
- [ ] WebSocket real-time order updates

---

## License

Proprietary. All rights reserved.
