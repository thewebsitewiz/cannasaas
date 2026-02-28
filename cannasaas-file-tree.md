# 🌿 CannaSaas Platform — Definitive File Tree

> **Architecture:** pnpm monorepo + Turborepo  
> **Backend:** NestJS · TypeORM · PostgreSQL · Redis  
> **Frontend:** React · Vite · Tailwind · shadcn/ui · Zustand  
> **Sprints Covered:** 1–12 (all modules)

```
cannasaas/
│
├── 📋 pnpm-workspace.yaml          # Workspace definition
├── 📋 turbo.json                    # Turborepo pipeline config
├── 📋 package.json                  # Root package.json
├── 📋 tsconfig.base.json            # Shared TypeScript config
├── 🔒 .env.example                  # Environment template
├── 🔀 .gitignore
├── 📝 README.md
├── ⚙️  .eslintrc.js
├── ⚙️  .prettierrc
│
├── 🐳 docker/
│   ├── docker-compose.yml           # Postgres + Redis + API
│   ├── docker-compose.dev.yml       # Dev overrides
│   ├── Dockerfile.api               # Multi-stage NestJS build
│   ├── Dockerfile.storefront
│   ├── Dockerfile.admin
│   └── nginx.conf                   # Reverse proxy
│
├── 🛠️  scripts/
│   ├── init-postgres.sql            # DB init for Docker
│   ├── seed-data.ts                 # Dev seed data
│   └── migrate.sh                   # Migration runner
│
├── 🤖 .github/workflows/
│   ├── ci.yml                       # CI pipeline
│   └── deploy.yml                   # Deployment
│
├── 📖 docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   ├── multi-tenancy.md
│   ├── compliance-guide.md
│   └── pos-integration.md
│
│
│ ╔══════════════════════════════════════════════════════════════╗
│ ║  BACKEND API                                                ║
│ ╚══════════════════════════════════════════════════════════════╝
│
├── 🔧 cannasaas-api/
│   ├── package.json
│   ├── tsconfig.json / tsconfig.build.json
│   ├── nest-cli.json
│   ├── ormconfig.ts                  # TypeORM CLI config
│   ├── .env / .env.example
│   │
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   │
│   └── src/
│       ├── app.module.ts             # Root module
│       ├── main.ts                   # Bootstrap
│       │
│       ├── config/                   ─── CONFIGURATION ───
│       │   ├── database.config.ts        S1  TypeORM
│       │   ├── redis.config.ts           S1  Redis
│       │   ├── jwt.config.ts             S2  JWT settings
│       │   ├── env.config.ts             S1  Env validation
│       │   ├── s3.config.ts              S3  AWS S3
│       │   ├── elasticsearch.config.ts   S9  Elasticsearch
│       │   └── twilio.config.ts          S10 SMS
│       │
│       ├── common/                   ─── SHARED INFRASTRUCTURE ───
│       │   ├── entities/
│       │   │   └── base.entity.ts        S1  Shared base entity
│       │   ├── middleware/
│       │   │   ├── tenant.middleware.ts   S1  Tenant context
│       │   │   └── rate-limit.middleware.ts
│       │   ├── tenant/
│       │   │   ├── tenant.service.ts     S1  Tenant resolver
│       │   │   └── tenant.module.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   ├── guards/
│       │   │   └── tenant.guard.ts       S1  Isolation guard
│       │   ├── interceptors/
│       │   │   ├── logging.interceptor.ts
│       │   │   └── transform.interceptor.ts
│       │   ├── pipes/
│       │   │   └── validation.pipe.ts
│       │   ├── decorators/
│       │   │   ├── tenant.decorator.ts   S1  @CurrentTenant()
│       │   │   └── roles.decorator.ts    S2  @Roles()
│       │   ├── logger/
│       │   │   └── logger.service.ts
│       │   └── metrics/
│       │       └── metrics.service.ts
│       │
│       ├── auth/                     ─── SPRINT 2: AUTHENTICATION ───
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts        Login / register / refresh
│       │   ├── auth.service.ts           JWT + bcrypt
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts
│       │   │   └── refresh-token.strategy.ts
│       │   ├── decorators/
│       │   │   └── public.decorator.ts   @Public()
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       ├── register.dto.ts
│       │       └── refresh-token.dto.ts
│       │
│       ├── users/                    ─── SPRINT 2: USER MANAGEMENT ───
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── entities/
│       │   │   ├── user.entity.ts        Roles, tenant refs
│       │   │   └── role.entity.ts        RBAC
│       │   └── dto/
│       │       ├── create-user.dto.ts
│       │       └── update-user.dto.ts
│       │
│       ├── organizations/            ─── SPRINT 3: ORG HIERARCHY ───
│       │   ├── organizations.module.ts
│       │   ├── organizations.controller.ts
│       │   ├── organizations.service.ts
│       │   ├── entities/
│       │   │   └── organization.entity.ts    Top-level tenant
│       │   └── dto/
│       │       ├── create-organization.dto.ts
│       │       └── update-organization.dto.ts
│       │
│       ├── companies/                ─── SPRINT 3 ───
│       │   ├── companies.module.ts
│       │   ├── companies.controller.ts
│       │   ├── companies.service.ts
│       │   ├── entities/
│       │   │   └── company.entity.ts         Legal business entity
│       │   └── dto/
│       │       ├── create-company.dto.ts
│       │       └── update-company.dto.ts
│       │
│       ├── dispensaries/             ─── SPRINT 3 ───
│       │   ├── dispensaries.module.ts
│       │   ├── dispensaries.controller.ts
│       │   ├── dispensaries.service.ts       Geospatial queries
│       │   ├── entities/
│       │   │   └── dispensary.entity.ts      Location, branding, PostGIS
│       │   └── dto/
│       │       ├── create-dispensary.dto.ts
│       │       └── update-dispensary.dto.ts
│       │
│       ├── products/                 ─── SPRINT 4: CATALOG ───
│       │   ├── products.module.ts
│       │   ├── products.controller.ts
│       │   ├── products.service.ts
│       │   ├── entities/
│       │   │   ├── product.entity.ts         Strain, THC%, CBD%
│       │   │   ├── product-category.entity.ts
│       │   │   ├── product-variant.entity.ts SKU, weight, price
│       │   │   └── product-image.entity.ts
│       │   └── dto/
│       │       ├── create-product.dto.ts
│       │       ├── update-product.dto.ts
│       │       └── product-filter.dto.ts
│       │
│       ├── inventory/                ─── SPRINT 4 ───
│       │   ├── inventory.module.ts
│       │   ├── inventory.controller.ts
│       │   ├── inventory.service.ts
│       │   ├── entities/
│       │   │   ├── inventory.entity.ts
│       │   │   └── inventory-transaction.entity.ts  Audit ledger
│       │   └── dto/
│       │       └── adjust-inventory.dto.ts
│       │
│       ├── cart/                     ─── SPRINT 5: SHOPPING ───
│       │   ├── cart.module.ts
│       │   ├── cart.controller.ts
│       │   ├── cart.service.ts
│       │   ├── entities/
│       │   │   ├── cart.entity.ts
│       │   │   └── cart-item.entity.ts
│       │   └── dto/
│       │       ├── add-to-cart.dto.ts
│       │       └── update-cart-item.dto.ts
│       │
│       ├── orders/                   ─── SPRINT 5-6: ORDERS ───
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts
│       │   ├── orders.service.ts
│       │   ├── entities/
│       │   │   ├── order.entity.ts           Status lifecycle
│       │   │   └── order-item.entity.ts
│       │   └── dto/
│       │       ├── create-order.dto.ts
│       │       └── update-order.dto.ts
│       │
│       ├── payments/                 ─── SPRINT 6: PAYMENTS ───
│       │   ├── payments.module.ts
│       │   ├── payments.controller.ts
│       │   ├── payments.service.ts           Stripe
│       │   └── dto/
│       │
│       ├── promotions/               ─── SPRINT 6: PROMO CODES ───
│       │   ├── promotions.module.ts
│       │   ├── promotions.controller.ts
│       │   ├── promotions.service.ts
│       │   ├── entities/
│       │   │   └── promotion.entity.ts
│       │   └── dto/
│       │       ├── create-promotion.dto.ts
│       │       └── apply-promotion.dto.ts
│       │
│       ├── compliance/               ─── SPRINT 7: COMPLIANCE ───
│       │   ├── compliance.module.ts
│       │   ├── compliance.controller.ts
│       │   ├── compliance.service.ts         Audit logging
│       │   ├── age-verification.service.ts   ID check
│       │   ├── metrc.service.ts              State tracking API
│       │   ├── purchase-limit.service.ts     Daily/rolling limits
│       │   ├── entities/
│       │   │   ├── compliance-log.entity.ts
│       │   │   └── daily-sales-report.entity.ts
│       │   └── dto/
│       │       └── compliance-query.dto.ts
│       │
│       ├── onboarding/               ─── SPRINT 7: ONBOARDING ───
│       │   ├── onboarding.module.ts
│       │   ├── onboarding.controller.ts
│       │   ├── onboarding.service.ts         Wizard state machine
│       │   └── dto/
│       │       └── onboarding-step.dto.ts
│       │
│       ├── tenants/                  ─── SPRINT 8: TENANT MGMT ───
│       │   ├── tenants.module.ts
│       │   ├── tenants.controller.ts
│       │   ├── tenants.service.ts            Schema provisioning
│       │   └── dto/
│       │       └── create-tenant.dto.ts
│       │
│       ├── branding/                 ─── SPRINT 8: WHITE-LABEL ───
│       │   ├── branding.module.ts
│       │   ├── branding.controller.ts
│       │   ├── branding.service.ts           Dynamic theming
│       │   ├── entities/
│       │   │   └── branding.entity.ts        Logos, colors, fonts
│       │   └── dto/
│       │       └── update-branding.dto.ts
│       │
│       ├── search/                   ─── SPRINT 9: DISCOVERY ───
│       │   ├── search.module.ts
│       │   ├── search.controller.ts
│       │   ├── search.service.ts             Elasticsearch queries
│       │   ├── search-index.service.ts       Index management
│       │   └── cannabis-analyzer.ts          Strain synonyms
│       │
│       ├── recommendations/          ─── SPRINT 9 ───
│       │   ├── recommendations.module.ts
│       │   ├── recommendations.controller.ts
│       │   └── recommendations.service.ts    Similar, trending
│       │
│       ├── delivery/                 ─── SPRINT 10: DELIVERY ───
│       │   ├── delivery.module.ts
│       │   ├── delivery.controller.ts
│       │   ├── delivery.service.ts           Zone validation, fee calc
│       │   ├── delivery.gateway.ts           WebSocket live tracking
│       │   ├── entities/
│       │   │   ├── delivery-zone.entity.ts   PostGIS polygons
│       │   │   ├── driver.entity.ts
│       │   │   └── delivery-assignment.entity.ts
│       │   └── dto/
│       │       ├── create-delivery-zone.dto.ts
│       │       └── assign-driver.dto.ts
│       │
│       ├── notifications/            ─── SPRINT 10 + 12 ───
│       │   ├── notifications.module.ts
│       │   ├── notifications.service.ts      Twilio SMS
│       │   └── push.service.ts               Web push (S12)
│       │
│       ├── pos/                      ─── SPRINT 11: POS INTEGRATION ───
│       │   ├── pos.module.ts
│       │   ├── pos.controller.ts
│       │   ├── pos.service.ts                Adapter orchestrator
│       │   ├── interfaces/
│       │   │   └── pos-provider.interface.ts Common interface
│       │   ├── adapters/
│       │   │   ├── dutchie.adapter.ts        GraphQL
│       │   │   └── treez.adapter.ts          REST
│       │   ├── entities/
│       │   │   ├── pos-connection.entity.ts
│       │   │   ├── product-mapping.entity.ts External ↔ internal IDs
│       │   │   └── sync-log.entity.ts        Sync audit trail
│       │   └── dto/
│       │       └── connect-pos.dto.ts
│       │
│       ├── analytics/                ─── SPRINT 12: ANALYTICS ───
│       │   ├── analytics.module.ts
│       │   ├── analytics.controller.ts
│       │   ├── analytics.service.ts          Dashboard data
│       │   ├── analytics-aggregation.cron.ts Nightly job
│       │   ├── entities/
│       │   │   └── daily-analytics.entity.ts
│       │   └── dto/
│       │       ├── analytics-query.dto.ts
│       │       └── export.dto.ts             CSV export
│       │
│       ├── upload/                   ─── SPRINT 4: FILE UPLOAD ───
│       │   ├── upload.module.ts
│       │   ├── upload.controller.ts
│       │   └── upload.service.ts             S3 presigned URLs
│       │
│       ├── health/
│       │   ├── health.module.ts
│       │   └── health.controller.ts          /health endpoint
│       │
│       ├── services/                 ─── SHARED SERVICES ───
│       │   ├── mail.service.ts               Transactional email
│       │   ├── stripe.service.ts             Stripe SDK wrapper
│       │   └── ai/
│       │       ├── recommendations.ts        AI product recs
│       │       ├── forecasting.ts            Demand forecasting
│       │       └── chatbot.ts                AI chatbot
│       │
│       ├── workers/                  ─── BACKGROUND JOBS ───
│       │   ├── inventory-monitor.ts          Low-stock alerts
│       │   ├── email-campaigns.ts            Marketing
│       │   └── pos-sync.cron.ts              10-min POS sync (S11)
│       │
│       └── migrations/               ─── TYPEORM MIGRATIONS ───
│
│
│ ╔══════════════════════════════════════════════════════════════╗
│ ║  FRONTEND APPS                                              ║
│ ╚══════════════════════════════════════════════════════════════╝
│
├── 🛒 apps/storefront/              Customer-Facing · port 5173
│   ├── index.html · package.json · vite.config.ts
│   ├── tailwind.config.ts · postcss.config.js · tsconfig.json
│   ├── public/
│   │   └── manifest.json                     PWA (S12)
│   └── src/
│       ├── App.tsx · main.tsx · routes.tsx · index.css
│       ├── service-worker.ts                 PWA (S12)
│       ├── pages/
│       │   ├── Home.tsx · Products.tsx · ProductDetail.tsx
│       │   ├── Cart.tsx · Checkout.tsx
│       │   ├── Orders.tsx · OrderDetail.tsx · Account.tsx
│       │   ├── Login.tsx · Register.tsx
│       │   ├── AgeGate.tsx                   Age verification (S7)
│       │   └── DeliveryTracking.tsx           Live tracking (S10)
│       ├── components/
│       │   ├── ProductCard.tsx · CartSummary.tsx
│       │   ├── Header.tsx · Footer.tsx
│       │   ├── SearchBar.tsx                  Autocomplete (S9)
│       │   ├── CategoryFilter.tsx · StrainFilter.tsx
│       │   ├── PromoCodeInput.tsx             Promo codes (S6)
│       │   └── DeliveryMap.tsx                Live map (S10)
│       ├── layouts/
│       │   ├── MainLayout.tsx
│       │   └── CheckoutLayout.tsx
│       ├── hooks/
│       │   ├── useCart.ts · useProducts.ts · useTenant.ts
│       │   ├── useAuth.ts · useAnalytics.ts · useSocket.ts
│       └── lib/api/
│           └── client.ts                      Axios instance
│
├── 🖥️  apps/admin/                   Admin Portal · port 5174
│   ├── index.html · package.json · vite.config.ts
│   ├── tailwind.config.ts · postcss.config.js · tsconfig.json
│   └── src/
│       ├── App.tsx · main.tsx · routes.tsx · index.css
│       ├── pages/
│       │   ├── Dashboard/    Dashboard.tsx
│       │   ├── Products/     ProductList · ProductForm · ProductDetail
│       │   ├── Orders/       OrderList · OrderDetail
│       │   ├── Customers/    CustomerList · CustomerDetail
│       │   ├── Inventory/    InventoryList · StockAdjust
│       │   ├── Analytics/    Analytics.tsx
│       │   ├── Compliance/   ComplianceLogs · DailySalesReport
│       │   ├── Delivery/     DeliveryZones · DriverManagement · ActiveDeliveries
│       │   ├── POS/          POSConnections · SyncStatus
│       │   └── Settings/     General · Branding · Users · Compliance · Payments
│       ├── components/
│       │   ├── Sidebar.tsx · Topbar.tsx · DataTable.tsx · StatCard.tsx
│       │   ├── onboarding/OnboardingWizard.tsx     (S7)
│       │   ├── beta/BetaFeedbackWidget.tsx         (S7)
│       │   └── ui/ (shadcn: button, input, textarea, select, dialog,
│       │            table, toast, progress, tabs, card, badge)
│       ├── services/api/
│       │   ├── dispensaries · products · orders · analytics
│       │   ├── compliance · delivery · pos
│       ├── hooks/
│       │   ├── useAuth · useDispensaries · useSocket
│       └── lib/api/
│           └── client.ts
│
├── 👤 apps/staff/                    Staff Portal · POS Interface
│   ├── index.html · package.json · vite.config.ts
│   ├── tailwind.config.ts · postcss.config.js · tsconfig.json
│   └── src/
│       ├── App.tsx · main.tsx · routes.tsx · index.css
│       ├── pages/
│       │   ├── QuickSale.tsx         Simplified POS
│       │   ├── OrderQueue.tsx        Pickup/delivery queue
│       │   ├── CustomerLookup.tsx    ID verification
│       │   └── InventoryCount.tsx    Stock counts
│       ├── hooks/useAuth.ts
│       └── lib/api/client.ts
│
│
│ ╔══════════════════════════════════════════════════════════════╗
│ ║  SHARED PACKAGES (@cannasaas/*)                             ║
│ ╚══════════════════════════════════════════════════════════════╝
│
├── 📦 packages/
│   ├── types/                        @cannasaas/types
│   │   └── src/
│   │       ├── index.ts · organization.ts · dispensary.ts
│   │       ├── product.ts · order.ts · user.ts · cart.ts
│   │       ├── compliance.ts · delivery.ts · analytics.ts
│   │       ├── pos.ts · branding.ts · api-responses.ts
│   │
│   ├── ui/                           @cannasaas/ui
│   │   └── src/
│   │       ├── index.ts
│   │       ├── button · input · dialog · table · select
│   │       ├── toast · card · badge · spinner · empty-state
│   │
│   ├── api-client/                   @cannasaas/api-client
│   │   └── src/
│   │       ├── index.ts · client.ts · endpoints.ts · interceptors.ts
│   │
│   ├── stores/                       @cannasaas/stores
│   │   └── src/
│   │       ├── index.ts
│   │       ├── authStore · cartStore · organizationStore · tenantStore
│   │
│   └── utils/                        @cannasaas/utils
│       └── src/
│           ├── index.ts
│           ├── formatCurrency · validators · dateHelpers
│           ├── cannabisUnits · complianceHelpers
```

## Summary

| Layer | Directory | Files | Sprints |
|---|---|---|---|
| 🔧 Backend API | `cannasaas-api/` | 179 | S1–S12 |
| 🛒 Storefront | `apps/storefront/` | 42 | S2, S4–S7, S9–S10, S12 |
| 🖥️ Admin Portal | `apps/admin/` | 61 | S1–S12 |
| 👤 Staff Portal | `apps/staff/` | 16 | Stubs |
| 📦 Shared Packages | `packages/` | 49 | Cross-cutting |
| ⚙️ Root/Infra | Root + docker + scripts | 26 | S1 |
| **Total** | | **373** | |

## Backend Modules (20)

| Module | Sprint | Purpose |
|---|---|---|
| auth | S2 | JWT authentication + refresh tokens |
| users | S2 | User CRUD + RBAC |
| organizations | S3 | Top-level tenant entity |
| companies | S3 | Legal business entities |
| dispensaries | S3 | Physical locations + PostGIS |
| products | S4 | Catalog + categories + variants |
| inventory | S4 | Stock tracking + audit ledger |
| upload | S4 | S3 presigned URLs |
| cart | S5 | Shopping cart |
| orders | S5-6 | Order processing + status lifecycle |
| payments | S6 | Stripe integration |
| promotions | S6 | Promo code engine |
| compliance | S7 | Audit logging + Metrc + purchase limits |
| onboarding | S7 | Wizard state machine |
| tenants | S8 | Schema provisioning |
| branding | S8 | White-label theming |
| search | S9 | Elasticsearch + cannabis synonyms |
| recommendations | S9 | Similar/trending products |
| delivery | S10 | Zones + drivers + WebSocket tracking |
| pos | S11 | Dutchie + Treez adapters |
| analytics | S12 | Dashboard + aggregation + CSV export |
| notifications | S10/12 | SMS + web push |
