<<<<<<< HEAD
# CannaSaas — GreenStack Platform

Multi-tenant SaaS platform for licensed cannabis dispensaries across all US states with legal cannabis programs. Built with a **"Botanical Luxury"** design language across all frontend applications.

## Architecture

- **API**: NestJS 11 + GraphQL (Apollo) + PostgreSQL 16 + Redis 7
- **ORM**: Drizzle ORM (alongside TypeORM — migration in progress)
- **Storefront**: Next.js 15 (customer e-commerce, PWA, i18n EN/ES)
- **Admin**: React 19 + Vite 8 (dispensary management)
- **Staff**: React 19 + Vite 8 (counter operations + barcode scanner)
- **Kiosk**: React 19 + Vite 8 (in-store self-service, PWA, mobile check-in)
- **Platform**: React 19 + Vite 8 (super admin + changelog)
- **Styling**: Tailwind CSS v4 across all apps
- **Search**: Meilisearch + vibe search
- **Observability**: Prometheus metrics, Sentry error tracking, circuit breakers
- **Security**: GraphQL depth/complexity limiting, CSRF protection, request body size limits

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker

# Start PostgreSQL + Redis
docker compose up -d

# Install dependencies
pnpm install

# Run migrations and seed data
pnpm db:migrate
pnpm db:seed

# Start all apps in parallel
pnpm dev
```

## Ports

| App | Port |
|-----|------|
| API (GraphQL + REST) | :3000 |
| Storefront | :5173 |
| Admin | :5174 |
| Staff | :5175 |
| Kiosk | :5176 |
| Platform | :5177 |

## Key Commands

```bash
pnpm dev              # Start all apps
pnpm dev:api          # Start API only
pnpm dev:admin        # Start admin only
pnpm build            # Build all apps
pnpm test             # Run unit tests (58 tests)
pnpm test:e2e         # Run E2E / integration tests
pnpm test:load        # Run k6 load tests
pnpm lint             # Lint all code
pnpm type-check       # TypeScript check
pnpm type-check:native # Fast check via tsgo
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
```

## Project Structure

```
apps/
  api/          NestJS backend (43+ modules, 95+ tables)
  admin/        Dispensary admin portal
  staff/        Staff operations portal (barcode scanner)
  kiosk/        In-store self-service (PWA, mobile check-in)
  storefront/   Customer e-commerce (PWA, i18n, express checkout)
  platform/     Super admin dashboard (changelog)
packages/
  ui/           Shared design system (10 theme presets)
  stores/       Zustand state stores
  types/        Shared TypeScript types
deploy/
  Dockerfile.*  Production Docker images (multi-stage)
  nginx.conf    Reverse proxy config
docs/           Architecture & business docs
```

## Backend Modules (43+)

**Core:** Auth (with 2FA), Users, Organizations, Companies, Dispensaries, Brands
**Catalog:** Products, Manufacturers, Promotions, ProductData, Recommendations, Search (Meilisearch + vibe search)
**Commerce:** Orders, Payments, Stripe (webhook queue), CanPay, AeroPay
**Inventory:** Inventory, InventoryControl
**Compliance:** Metrc, BioTrack, Compliance, Reporting (PDF reports)
**People:** Customers (segmentation), Loyalty, Staffing, TimeClock, Scheduling, Notifications (back-in-stock + email templates)
**Operations:** Delivery, Fulfillment, Vendors, POS (Dutchie/Treez), Analytics (AI weekly digest)
**Platform:** Platform (changelog), Theme, Image, WebSocket, Health, Metrics (Prometheus)
**Engagement:** Reviews, Knowledge Base, Marketing Suite, Promotions, Webhooks API
**Verification:** Digital ID verification

## Frontend Features

- **Botanical Luxury** design language with strain-specific gradient backgrounds on product cards
- **10 theme presets**: casual, dark, regal, modern, minimal, apothecary, citrus, earthy, midnight, neon
- **PWA support** on storefront + kiosk
- **i18n**: English + Spanish
- **Dark mode toggle** across all apps
- **Effects/flavors tags** on product cards
- **Express checkout** (storefront)
- **Digital menu board** (admin)
- **Barcode scanner** (staff)
- **Mobile check-in** (kiosk)
- **Onboarding wizard** for new tenants

## Test Suite

- 8 unit test files (58 tests)
- 2 integration tests
- k6 load test
- GitHub Actions CI/CD with staging deployment

## Test Credentials (Dev)

- Admin: `admin@greenleaf.com` / `Admin123!`
- GraphQL Playground: http://localhost:3000/graphql
- Swagger Docs: http://localhost:3000/docs

## Production Deployment

```bash
# Set required environment variables
export DB_PASSWORD=<secure-password>
# See .env.template for all variables

# Deploy with Docker Compose (multi-stage builds, TLS)
docker compose -f docker-compose.prod.yml up -d
```

## Documentation

- [Architecture Document](docs/CannaSaas-Architecture-Document.md)
- [Business Plan](docs/CannaSaas-Business-Plan.md)
- [Complete Feature List](docs/CannaSaas-Complete-Feature-List.md)
- [Executive Summary](docs/CannaSaas-Executive-Summary.md)
- [Feature One-Pager](docs/CannaSaas-Feature-One-Pager.md)
- [Platform Architecture](docs/CannaSaas-Platform-Architecture.md)
- [Deployment Guide](deployment.md)
=======
# CannaSaas / GreenStack

> Multi-tenant cannabis dispensary SaaS platform for NY, NJ, and CT markets.
> An affordable alternative to Dutchie, Jane Technologies, and Flowhub — built for independent dispensary operators with 1–5 locations.

---

## What Is This

CannaSaas (marketed as **GreenStack**) is a full-stack platform that gives cannabis dispensaries everything they need to run their business: an online storefront for customers, an admin portal for owners, a staff terminal for budtenders, and a self-service kiosk — all backed by a single API with built-in Metrc compliance reporting.

**Tech Stack:**

| Layer | Technology |
|---|---|
| API | NestJS, TypeORM, PostgreSQL, GraphQL, BullMQ, Redis |
| Storefront | Next.js 14 (App Router), React 18, TanStack Query |
| Admin | Vite + React 18, TanStack Query |
| Staff Portal | Vite + React 18 (dark terminal UI, tablet-optimized) |
| Kiosk | Vite + React 18 (touch-first, large targets) |
| Platform Manager | Vite + React 18 (super-admin tenant management) |
| Shared Packages | `packages/ui`, `packages/types`, `packages/utils`, `packages/api-client` |
| Monorepo | pnpm workspaces + Turborepo |
| Design System | CSS custom properties, runtime theme switching, Google Fonts |

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

| Module | Description | Status |
|---|---|---|
| **auth** | JWT access + refresh tokens, register, login, role guards | ✅ Complete |
| **users** | User CRUD, role management | ✅ Complete |
| **organizations** | Multi-tenant org hierarchy | ✅ Complete |
| **companies** | Company entities under orgs | ✅ Complete |
| **dispensaries** | Dispensary CRUD, settings, design system config | ✅ Complete |
| **products** | Product catalog, variants, pricing, batches, full-text search, autocomplete | ✅ Complete |
| **brands** | Brand entities linked to products | ✅ Complete |
| **manufacturers** | Manufacturer entities | ✅ Complete |
| **inventory** | Stock tracking, reservations | ✅ Core complete |
| **inventory-control** | Adjustments, audits, transfers | ✅ Core complete |
| **orders** | Full lifecycle: pending → confirmed → preparing → ready → completed | ✅ Complete |
| **payments** | Payment processing integration | 🔲 Stub |
| **stripe** | Stripe payment integration | 🔲 Stub |
| **metrc** | Metrc track-and-trace: credentials, sales receipt sync, compliance reports, BullMQ retry queue | ✅ Complete |
| **compliance** | Compliance logging and audit trail | ✅ Core complete |
| **customers** | Customer profiles, order history | ✅ Core complete |
| **loyalty** | Points, tiers, rewards | 🔲 Stub |
| **promotions** | Discount rules, promo codes | 🔲 Stub |
| **fulfillment** | Pickup and delivery workflow | 🔲 Stub |
| **scheduling** | Staff shift scheduling | 🔲 Stub |
| **staffing** | Employee management | 🔲 Stub |
| **timeclock** | Clock in/out tracking | 🔲 Stub |
| **vendor** | Vendor/supplier management | 🔲 Stub |
| **notifications** | Order status notifications | 🔲 Stub |
| **analytics** | Business intelligence queries | 🔲 Stub |
| **reporting** | Report generation | 🔲 Stub |
| **pos** | POS integration layer | 🔲 Stub |
| **platform** | Super-admin tenant operations | 🔲 Stub |
| **tenant** | Tenant resolution middleware | ✅ Complete |
| **theme** | Theme config per dispensary | ✅ Complete |
| **product-data** | Strain data, Leafly scraper integration | ✅ Complete |
| **image** | Image upload and processing | 🔲 Stub |
| **ws** | WebSocket gateway for real-time updates | 🔲 Stub |

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

| Mutation | Transition | Effect |
|---|---|---|
| `createOrder` | → pending | Inventory reserved, tax calculated (NY/NJ/CT) |
| `confirmOrder` | pending → confirmed | Staff acknowledges order |
| `startPreparingOrder` | confirmed → preparing | Staff begins fulfillment |
| `markOrderReady` | preparing → ready | Packed and waiting |
| `completeOrder` | ready → completed | Inventory deducted, Metrc sync enqueued |
| `cancelOrder` | any → cancelled | Requires reason |

Each transition is guarded — you can't skip states.

### Tax Calculation

Automatic per-state cannabis tax:

| State | State | Local | Excise | Total |
|---|---|---|---|---|
| NY | 9% | 4% | 13% | **26%** |
| NJ | 6.625% | 2% | 6% | **14.625%** |
| CT | 6.35% | 3% | 3% | **12.35%** |

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
  searchProducts(input: {
    dispensaryId: "..."
    query: "blue dream"
    productTypeId: 1
    minThc: 20
    maxPrice: 50
    limit: 20
  }) {
    totalCount
    products { id name thcPercent }
    facets { productTypes { id name count } }
  }
}
```

Plus real-time autocomplete suggestions.

### Design System

Two design systems with runtime switching from the admin panel:

| Design System | Fonts | Palette | File |
|---|---|---|---|
| **Casual** (default) | Lora + Plus Jakarta Sans | Pine/Fern/Amber on Cream | `casual.css` |
| **Spring Bloom** | Sora + Nunito Sans | Meadow/Wisteria/Poppy on Warm Stone | `spring-bloom.css` |

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

| Table | Purpose |
|---|---|
| `users` | Auth, roles, dispensary assignment |
| `organizations` | Top-level tenant grouping |
| `companies` | Business entities under orgs |
| `dispensaries` | Individual store locations (primary tenant entity) |
| `products` | Product catalog |
| `product_variants` | Size/weight variants per product |
| `product_pricing` | Time-bound pricing per variant |
| `orders` | Order header with status, tax, Metrc sync status |
| `order_line_items` | Line items with Metrc UIDs |
| `inventory` | Current stock per variant per dispensary |
| `metrc_credentials` | API keys per dispensary |
| `metrc_sync_logs` | Audit trail of every Metrc API call |
| `theme_configs` | Theme preset per dispensary |
| `strain_data` | Strain database (Leafly scraper) |
| `lkp_*` (15 tables) | Product types, categories, effects, terpenes, tax categories, Metrc categories, etc. |

---

## Authentication & Roles

JWT-based with access + refresh tokens:

```graphql
mutation { register(input: { email: "...", password: "...", role: "customer" }) { accessToken } }
mutation { login(email: "...", password: "...") { accessToken refreshToken } }
query { me { id email role dispensaryId } }
```

| Role | Scope |
|---|---|
| `customer` | Storefront only |
| `budtender` | Staff portal, own dispensary |
| `dispensary_admin` | Admin portal, own dispensary |
| `org_admin` | All dispensaries in org |
| `super_admin` | Platform-wide |

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

| Tier | Price | Target |
|---|---|---|
| Starter | $299/mo | Single-location |
| Growth | $599/mo | 2–3 locations |
| Enterprise | Custom | 4+ locations, white-label |

---

## Brand

| Element | Value |
|---|---|
| Product Name | GreenStack |
| Company Name | CannaSaas |
| GitHub | thewebsitewiz/cannasaas |
| Demo Dispensary | GreenLeaf - Tappan |
| Target Markets | NY, NJ, CT |

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
>>>>>>> a551edd8 (fix: restore globals.css import and PostCSS config in storefront)
