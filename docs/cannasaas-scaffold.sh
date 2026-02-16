#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🌿 CannaSaas Platform — DEFINITIVE Scaffolding Script v4
# ═══════════════════════════════════════════════════════════════════
#
# This script reconciles ALL file structures from:
#   • Sprint 1-3 guide  (project root, Docker, auth, orgs, dispensaries)
#   • Sprint 4-6 guide  (products, orders, cart, compliance, upload)
#   • Sprint 7-8 guide  (onboarding, beta, Metrc, age verification)
#   • Sprint 9-12 guide (search, delivery, POS, analytics, PWA)
#   • Project spec doc   (monorepo, packages, shared types)
#   • Implementation guide (pnpm + Turborepo monorepo)
#
# Architecture: Monorepo with pnpm workspaces + Turborepo
#   cannasaas/
#   ├── apps/           → 3 React frontends (storefront, admin, staff)
#   ├── packages/       → 5 shared libraries (ui, api-client, stores, utils, types)
#   ├── cannasaas-api/  → NestJS backend
#   ├── docker/         → Container orchestration
#   └── scripts/        → DB init, seed data, utilities
#
# SAFE TO RE-RUN:
#   mkdir -p  = skips existing dirs
#   touch     = only updates timestamp on existing files (never overwrites)
#
# Annotations:
#   [S1-S3]   = Sprint 1-3    [S4-S6]  = Sprint 4-6
#   [S7-S8]   = Sprint 7-8    [S9-S12] = Sprint 9-12
#   [CODE]    = Full implementation exists in guides
#   [STUB]    = Referenced via imports; you write the implementation
#   [NestCLI] = Can be generated via `nest generate`
#   [shadcn]  = Installed via shadcn/ui CLI
#   [VITE]    = Generated via Vite scaffolding
# ═══════════════════════════════════════════════════════════════════

set -e  # Exit on error

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo ""
echo "🌿 CannaSaas Platform — Definitive Scaffolding v4"
echo "═══════════════════════════════════════════════════"
echo "📍 Working directory: $(pwd)"
echo ""


# ═══════════════════════════════════════════════════════════════════
# 1. ROOT CONFIG FILES
# ═══════════════════════════════════════════════════════════════════

echo "⚙️  [1/8] Root configuration..."

mkdir -p scripts
mkdir -p docker
mkdir -p .github/workflows

# Monorepo tooling
touch pnpm-workspace.yaml                          # [CODE] workspace definition
touch turbo.json                                   # [CODE] Turborepo pipeline config
touch package.json                                 # [CODE] root package.json
touch tsconfig.base.json                           # [CODE] shared TS config

# Docker
touch docker/docker-compose.yml                    # [CODE] S1 — Postgres + Redis + API
touch docker/docker-compose.dev.yml                # [CODE] dev overrides
touch docker/Dockerfile.api                        # [CODE] multi-stage NestJS build
touch docker/Dockerfile.storefront                 # [STUB] storefront container
touch docker/Dockerfile.admin                      # [STUB] admin container
touch docker/nginx.conf                            # [STUB] reverse proxy config

# Scripts
touch scripts/init-postgres.sql                    # [CODE] S1 — DB init for Docker
touch scripts/seed-data.ts                         # [STUB] dev seed data
touch scripts/migrate.sh                           # [STUB] migration runner

# CI/CD
touch .github/workflows/ci.yml                     # [STUB] GitHub Actions pipeline
touch .github/workflows/deploy.yml                 # [STUB] deployment pipeline

# Root dotfiles
touch .gitignore                                   # [CODE] S1
touch .env.example                                 # [CODE] env template
touch .eslintrc.js                                 # [STUB] shared lint rules
touch .prettierrc                                  # [STUB] shared formatting
touch README.md                                    # [CODE] S1


# ═══════════════════════════════════════════════════════════════════
# 2. BACKEND: cannasaas-api/ (NestJS + TypeORM + PostgreSQL)
# ═══════════════════════════════════════════════════════════════════

echo "🔧 [2/8] Backend API (cannasaas-api)..."

# --- Config ---
mkdir -p cannasaas-api/src/config
touch cannasaas-api/src/config/database.config.ts  # [CODE] S1 — TypeORM config
touch cannasaas-api/src/config/redis.config.ts     # [CODE] S1 — Redis connection
touch cannasaas-api/src/config/jwt.config.ts       # [CODE] S2 — JWT settings
touch cannasaas-api/src/config/env.config.ts       # [CODE] S1 — env validation
touch cannasaas-api/src/config/s3.config.ts        # [CODE] S3 — AWS S3 config
touch cannasaas-api/src/config/elasticsearch.config.ts # [CODE] S9 — ES config
touch cannasaas-api/src/config/twilio.config.ts    # [CODE] S10 — SMS config

# --- Common / Shared ---
mkdir -p cannasaas-api/src/common/entities
mkdir -p cannasaas-api/src/common/middleware
mkdir -p cannasaas-api/src/common/tenant
mkdir -p cannasaas-api/src/common/filters
mkdir -p cannasaas-api/src/common/guards
mkdir -p cannasaas-api/src/common/interceptors
mkdir -p cannasaas-api/src/common/pipes
mkdir -p cannasaas-api/src/common/decorators
mkdir -p cannasaas-api/src/common/logger
mkdir -p cannasaas-api/src/common/metrics

touch cannasaas-api/src/common/entities/base.entity.ts           # [CODE] S1 — shared base entity
touch cannasaas-api/src/common/middleware/tenant.middleware.ts    # [CODE] S1 — tenant context extraction
touch cannasaas-api/src/common/middleware/rate-limit.middleware.ts # [CODE] S1
touch cannasaas-api/src/common/tenant/tenant.service.ts          # [CODE] S1 — tenant resolver
touch cannasaas-api/src/common/tenant/tenant.module.ts           # [CODE] S1
touch cannasaas-api/src/common/filters/http-exception.filter.ts  # [CODE] S1 — global error handler
touch cannasaas-api/src/common/guards/tenant.guard.ts            # [CODE] S1 — tenant isolation guard
touch cannasaas-api/src/common/interceptors/logging.interceptor.ts    # [CODE] S1
touch cannasaas-api/src/common/interceptors/transform.interceptor.ts  # [CODE] S1
touch cannasaas-api/src/common/pipes/validation.pipe.ts          # [CODE] S1
touch cannasaas-api/src/common/decorators/tenant.decorator.ts    # [CODE] S1 — @CurrentTenant()
touch cannasaas-api/src/common/decorators/roles.decorator.ts     # [CODE] S2 — @Roles()
touch cannasaas-api/src/common/logger/logger.service.ts          # [STUB] structured logging
touch cannasaas-api/src/common/metrics/metrics.service.ts        # [STUB] APM/metrics

# --- Auth Module (Sprint 2) ---
mkdir -p cannasaas-api/src/auth/dto
mkdir -p cannasaas-api/src/auth/guards
mkdir -p cannasaas-api/src/auth/strategies
mkdir -p cannasaas-api/src/auth/decorators

touch cannasaas-api/src/auth/auth.module.ts            # [CODE] S2
touch cannasaas-api/src/auth/auth.controller.ts        # [CODE] S2 — login/register/refresh
touch cannasaas-api/src/auth/auth.service.ts           # [CODE] S2 — JWT + bcrypt
touch cannasaas-api/src/auth/guards/jwt-auth.guard.ts  # [CODE] S2
touch cannasaas-api/src/auth/guards/roles.guard.ts     # [CODE] S2
touch cannasaas-api/src/auth/strategies/jwt.strategy.ts         # [CODE] S2
touch cannasaas-api/src/auth/strategies/refresh-token.strategy.ts # [CODE] S2
touch cannasaas-api/src/auth/decorators/public.decorator.ts     # [CODE] S2 — @Public()
touch cannasaas-api/src/auth/dto/login.dto.ts          # [CODE] S2
touch cannasaas-api/src/auth/dto/register.dto.ts       # [CODE] S2
touch cannasaas-api/src/auth/dto/refresh-token.dto.ts  # [CODE] S2

# --- Users Module (Sprint 2) ---
mkdir -p cannasaas-api/src/users/entities
mkdir -p cannasaas-api/src/users/dto

touch cannasaas-api/src/users/users.module.ts          # [CODE] S2
touch cannasaas-api/src/users/users.controller.ts      # [CODE] S2
touch cannasaas-api/src/users/users.service.ts         # [CODE] S2
touch cannasaas-api/src/users/entities/user.entity.ts  # [CODE] S2 — w/ roles, tenant refs
touch cannasaas-api/src/users/entities/role.entity.ts  # [CODE] S2 — RBAC roles
touch cannasaas-api/src/users/dto/create-user.dto.ts   # [CODE] S2
touch cannasaas-api/src/users/dto/update-user.dto.ts   # [CODE] S2

# --- Organizations Module (Sprint 3) ---
mkdir -p cannasaas-api/src/organizations/entities
mkdir -p cannasaas-api/src/organizations/dto

touch cannasaas-api/src/organizations/organizations.module.ts      # [CODE] S3
touch cannasaas-api/src/organizations/organizations.controller.ts  # [CODE] S3
touch cannasaas-api/src/organizations/organizations.service.ts     # [CODE] S3
touch cannasaas-api/src/organizations/entities/organization.entity.ts # [CODE] S3 — top-level tenant
touch cannasaas-api/src/organizations/dto/create-organization.dto.ts  # [CODE] S3
touch cannasaas-api/src/organizations/dto/update-organization.dto.ts  # [CODE] S3

# --- Companies Module (Sprint 3) ---
mkdir -p cannasaas-api/src/companies/entities
mkdir -p cannasaas-api/src/companies/dto

touch cannasaas-api/src/companies/companies.module.ts      # [CODE] S3
touch cannasaas-api/src/companies/companies.controller.ts  # [CODE] S3
touch cannasaas-api/src/companies/companies.service.ts     # [CODE] S3
touch cannasaas-api/src/companies/entities/company.entity.ts # [CODE] S3 — mid-level entity
touch cannasaas-api/src/companies/dto/create-company.dto.ts  # [CODE] S3
touch cannasaas-api/src/companies/dto/update-company.dto.ts  # [CODE] S3

# --- Dispensaries Module (Sprint 3) ---
mkdir -p cannasaas-api/src/dispensaries/entities
mkdir -p cannasaas-api/src/dispensaries/dto

touch cannasaas-api/src/dispensaries/dispensaries.module.ts      # [CODE] S3 — w/ PostGIS
touch cannasaas-api/src/dispensaries/dispensaries.controller.ts  # [CODE] S3
touch cannasaas-api/src/dispensaries/dispensaries.service.ts     # [CODE] S3 — geospatial queries
touch cannasaas-api/src/dispensaries/entities/dispensary.entity.ts # [CODE] S3 — location, branding
touch cannasaas-api/src/dispensaries/dto/create-dispensary.dto.ts  # [CODE] S3
touch cannasaas-api/src/dispensaries/dto/update-dispensary.dto.ts  # [CODE] S3

# --- Products Module (Sprint 4) ---
mkdir -p cannasaas-api/src/products/entities
mkdir -p cannasaas-api/src/products/dto

touch cannasaas-api/src/products/products.module.ts        # [CODE] S4
touch cannasaas-api/src/products/products.controller.ts    # [CODE] S4
touch cannasaas-api/src/products/products.service.ts       # [CODE] S4
touch cannasaas-api/src/products/entities/product.entity.ts          # [CODE] S4 — strain, THC, CBD
touch cannasaas-api/src/products/entities/product-category.entity.ts # [CODE] S4 — flower, edible, etc.
touch cannasaas-api/src/products/entities/product-variant.entity.ts  # [CODE] S4 — SKU, weight, price
touch cannasaas-api/src/products/entities/product-image.entity.ts    # [CODE] S4
touch cannasaas-api/src/products/dto/create-product.dto.ts    # [CODE] S4
touch cannasaas-api/src/products/dto/update-product.dto.ts    # [CODE] S4
touch cannasaas-api/src/products/dto/product-filter.dto.ts    # [CODE] S4 — query filters

# --- Inventory Module (Sprint 4) ---
mkdir -p cannasaas-api/src/inventory/entities
mkdir -p cannasaas-api/src/inventory/dto

touch cannasaas-api/src/inventory/inventory.module.ts          # [CODE] S4
touch cannasaas-api/src/inventory/inventory.controller.ts      # [CODE] S4
touch cannasaas-api/src/inventory/inventory.service.ts         # [CODE] S4 — stock tracking
touch cannasaas-api/src/inventory/entities/inventory.entity.ts # [CODE] S4
touch cannasaas-api/src/inventory/entities/inventory-transaction.entity.ts # [CODE] S4 — audit ledger
touch cannasaas-api/src/inventory/dto/adjust-inventory.dto.ts  # [CODE] S4

# --- Cart Module (Sprint 5) ---
mkdir -p cannasaas-api/src/cart/entities
mkdir -p cannasaas-api/src/cart/dto

touch cannasaas-api/src/cart/cart.module.ts             # [CODE] S5
touch cannasaas-api/src/cart/cart.controller.ts         # [CODE] S5
touch cannasaas-api/src/cart/cart.service.ts            # [CODE] S5
touch cannasaas-api/src/cart/entities/cart.entity.ts         # [CODE] S5
touch cannasaas-api/src/cart/entities/cart-item.entity.ts    # [CODE] S5
touch cannasaas-api/src/cart/dto/add-to-cart.dto.ts     # [CODE] S5
touch cannasaas-api/src/cart/dto/update-cart-item.dto.ts # [CODE] S5

# --- Orders Module (Sprint 5-6) ---
mkdir -p cannasaas-api/src/orders/entities
mkdir -p cannasaas-api/src/orders/dto

touch cannasaas-api/src/orders/orders.module.ts          # [CODE] S5
touch cannasaas-api/src/orders/orders.controller.ts      # [CODE] S5
touch cannasaas-api/src/orders/orders.service.ts         # [CODE] S5
touch cannasaas-api/src/orders/entities/order.entity.ts       # [CODE] S5 — status lifecycle
touch cannasaas-api/src/orders/entities/order-item.entity.ts  # [CODE] S5
touch cannasaas-api/src/orders/dto/create-order.dto.ts   # [CODE] S5
touch cannasaas-api/src/orders/dto/update-order.dto.ts   # [CODE] S5

# --- Payments Module (Sprint 6) ---
mkdir -p cannasaas-api/src/payments/dto

touch cannasaas-api/src/payments/payments.module.ts      # [CODE] S6
touch cannasaas-api/src/payments/payments.controller.ts  # [CODE] S6
touch cannasaas-api/src/payments/payments.service.ts     # [CODE] S6 — Stripe integration

# --- Promotions Module (Sprint 6) ---
mkdir -p cannasaas-api/src/promotions/entities
mkdir -p cannasaas-api/src/promotions/dto

touch cannasaas-api/src/promotions/promotions.module.ts      # [CODE] S6
touch cannasaas-api/src/promotions/promotions.controller.ts  # [CODE] S6
touch cannasaas-api/src/promotions/promotions.service.ts     # [CODE] S6 — promo code engine
touch cannasaas-api/src/promotions/entities/promotion.entity.ts # [CODE] S6
touch cannasaas-api/src/promotions/dto/create-promotion.dto.ts  # [CODE] S6
touch cannasaas-api/src/promotions/dto/apply-promotion.dto.ts   # [CODE] S6

# --- Compliance Module (Sprint 7) ---
mkdir -p cannasaas-api/src/compliance/entities
mkdir -p cannasaas-api/src/compliance/dto

touch cannasaas-api/src/compliance/compliance.module.ts          # [CODE] S7
touch cannasaas-api/src/compliance/compliance.controller.ts      # [CODE] S7
touch cannasaas-api/src/compliance/compliance.service.ts         # [CODE] S7 — audit logging
touch cannasaas-api/src/compliance/age-verification.service.ts   # [CODE] S7 — ID check
touch cannasaas-api/src/compliance/metrc.service.ts              # [CODE] S7 — state tracking API
touch cannasaas-api/src/compliance/purchase-limit.service.ts     # [CODE] S7 — daily/rolling limits
touch cannasaas-api/src/compliance/entities/compliance-log.entity.ts    # [CODE] S7
touch cannasaas-api/src/compliance/entities/daily-sales-report.entity.ts # [CODE] S7
touch cannasaas-api/src/compliance/dto/compliance-query.dto.ts   # [CODE] S7

# --- Onboarding Module (Sprint 7) ---
mkdir -p cannasaas-api/src/onboarding/dto

touch cannasaas-api/src/onboarding/onboarding.module.ts      # [CODE] S7
touch cannasaas-api/src/onboarding/onboarding.controller.ts  # [CODE] S7
touch cannasaas-api/src/onboarding/onboarding.service.ts     # [CODE] S7 — wizard state machine
touch cannasaas-api/src/onboarding/dto/onboarding-step.dto.ts # [CODE] S7

# --- Tenants Module (Sprint 8) ---
mkdir -p cannasaas-api/src/tenants/dto

touch cannasaas-api/src/tenants/tenants.module.ts        # [CODE] S8
touch cannasaas-api/src/tenants/tenants.controller.ts    # [CODE] S8
touch cannasaas-api/src/tenants/tenants.service.ts       # [CODE] S8 — schema provisioning
touch cannasaas-api/src/tenants/dto/create-tenant.dto.ts # [CODE] S8

# --- Branding Module (Sprint 8) ---
mkdir -p cannasaas-api/src/branding/entities
mkdir -p cannasaas-api/src/branding/dto

touch cannasaas-api/src/branding/branding.module.ts      # [CODE] S8
touch cannasaas-api/src/branding/branding.controller.ts  # [CODE] S8
touch cannasaas-api/src/branding/branding.service.ts     # [CODE] S8 — white-label theming
touch cannasaas-api/src/branding/entities/branding.entity.ts # [CODE] S8 — logos, colors, fonts
touch cannasaas-api/src/branding/dto/update-branding.dto.ts  # [CODE] S8

# --- Search Module (Sprint 9) ---
mkdir -p cannasaas-api/src/search

touch cannasaas-api/src/search/search.module.ts          # [CODE] S9
touch cannasaas-api/src/search/search.controller.ts      # [CODE] S9 — /search endpoint
touch cannasaas-api/src/search/search.service.ts         # [CODE] S9 — Elasticsearch queries
touch cannasaas-api/src/search/search-index.service.ts   # [CODE] S9 — index management
touch cannasaas-api/src/search/cannabis-analyzer.ts      # [CODE] S9 — strain synonyms

# --- Recommendations Module (Sprint 9) ---
mkdir -p cannasaas-api/src/recommendations

touch cannasaas-api/src/recommendations/recommendations.module.ts      # [CODE] S9
touch cannasaas-api/src/recommendations/recommendations.controller.ts  # [CODE] S9
touch cannasaas-api/src/recommendations/recommendations.service.ts     # [CODE] S9 — similar, trending

# --- Delivery Module (Sprint 10) ---
mkdir -p cannasaas-api/src/delivery/entities
mkdir -p cannasaas-api/src/delivery/dto

touch cannasaas-api/src/delivery/delivery.module.ts          # [CODE] S10
touch cannasaas-api/src/delivery/delivery.controller.ts      # [CODE] S10
touch cannasaas-api/src/delivery/delivery.service.ts         # [CODE] S10 — zone validation, fee calc
touch cannasaas-api/src/delivery/delivery.gateway.ts         # [CODE] S10 — WebSocket live tracking
touch cannasaas-api/src/delivery/entities/delivery-zone.entity.ts       # [CODE] S10 — PostGIS polygons
touch cannasaas-api/src/delivery/entities/driver.entity.ts              # [CODE] S10
touch cannasaas-api/src/delivery/entities/delivery-assignment.entity.ts # [CODE] S10
touch cannasaas-api/src/delivery/dto/create-delivery-zone.dto.ts   # [CODE] S10
touch cannasaas-api/src/delivery/dto/assign-driver.dto.ts          # [CODE] S10

# --- Notifications Module (Sprint 10) ---
mkdir -p cannasaas-api/src/notifications

touch cannasaas-api/src/notifications/notifications.module.ts    # [CODE] S10
touch cannasaas-api/src/notifications/notifications.service.ts   # [CODE] S10 — Twilio SMS
touch cannasaas-api/src/notifications/push.service.ts            # [CODE] S12 — web push

# --- POS Integration Module (Sprint 11) ---
mkdir -p cannasaas-api/src/pos/adapters
mkdir -p cannasaas-api/src/pos/entities
mkdir -p cannasaas-api/src/pos/interfaces
mkdir -p cannasaas-api/src/pos/dto

touch cannasaas-api/src/pos/pos.module.ts                  # [CODE] S11
touch cannasaas-api/src/pos/pos.controller.ts              # [CODE] S11
touch cannasaas-api/src/pos/pos.service.ts                 # [CODE] S11 — adapter orchestrator
touch cannasaas-api/src/pos/interfaces/pos-provider.interface.ts # [CODE] S11 — common interface
touch cannasaas-api/src/pos/adapters/dutchie.adapter.ts    # [CODE] S11 — GraphQL
touch cannasaas-api/src/pos/adapters/treez.adapter.ts      # [CODE] S11 — REST
touch cannasaas-api/src/pos/entities/pos-connection.entity.ts    # [CODE] S11
touch cannasaas-api/src/pos/entities/product-mapping.entity.ts   # [CODE] S11 — external ↔ internal IDs
touch cannasaas-api/src/pos/entities/sync-log.entity.ts          # [CODE] S11 — sync audit trail
touch cannasaas-api/src/pos/dto/connect-pos.dto.ts         # [CODE] S11

# --- Analytics Module (Sprint 12) ---
mkdir -p cannasaas-api/src/analytics/entities
mkdir -p cannasaas-api/src/analytics/dto

touch cannasaas-api/src/analytics/analytics.module.ts          # [CODE] S12
touch cannasaas-api/src/analytics/analytics.controller.ts      # [CODE] S12
touch cannasaas-api/src/analytics/analytics.service.ts         # [CODE] S12 — dashboard data
touch cannasaas-api/src/analytics/analytics-aggregation.cron.ts # [CODE] S12 — nightly job
touch cannasaas-api/src/analytics/entities/daily-analytics.entity.ts   # [CODE] S12
touch cannasaas-api/src/analytics/dto/analytics-query.dto.ts   # [CODE] S12
touch cannasaas-api/src/analytics/dto/export.dto.ts            # [CODE] S12 — CSV export

# --- Upload Module (Sprint 4) ---
mkdir -p cannasaas-api/src/upload

touch cannasaas-api/src/upload/upload.module.ts          # [CODE] S4
touch cannasaas-api/src/upload/upload.controller.ts      # [CODE] S4
touch cannasaas-api/src/upload/upload.service.ts         # [CODE] S4 — S3 presigned URLs

# --- Health Module ---
mkdir -p cannasaas-api/src/health

touch cannasaas-api/src/health/health.module.ts          # [CODE] S1
touch cannasaas-api/src/health/health.controller.ts      # [CODE] S1 — /health endpoint

# --- Shared Services ---
mkdir -p cannasaas-api/src/services/ai

touch cannasaas-api/src/services/mail.service.ts         # [STUB] transactional email
touch cannasaas-api/src/services/stripe.service.ts       # [STUB] Stripe SDK wrapper
touch cannasaas-api/src/services/ai/recommendations.ts   # [STUB] AI product recs
touch cannasaas-api/src/services/ai/forecasting.ts       # [STUB] demand forecasting
touch cannasaas-api/src/services/ai/chatbot.ts           # [STUB] AI chatbot

# --- Workers (Background Jobs) ---
mkdir -p cannasaas-api/src/workers

touch cannasaas-api/src/workers/inventory-monitor.ts     # [STUB] low-stock alerts
touch cannasaas-api/src/workers/email-campaigns.ts       # [STUB] marketing automation
touch cannasaas-api/src/workers/pos-sync.cron.ts         # [CODE] S11 — 10-min sync

# --- Migrations ---
mkdir -p cannasaas-api/src/migrations

# --- App Entry ---
touch cannasaas-api/src/app.module.ts                    # [CODE] S1 — root module
touch cannasaas-api/src/main.ts                          # [CODE] S1 — bootstrap

# --- Test ---
mkdir -p cannasaas-api/test

touch cannasaas-api/test/app.e2e-spec.ts                 # [STUB]
touch cannasaas-api/test/jest-e2e.json                   # [STUB]

# --- Backend Root Config ---
touch cannasaas-api/package.json                         # [CODE]
touch cannasaas-api/tsconfig.json                        # [CODE]
touch cannasaas-api/tsconfig.build.json                  # [CODE]
touch cannasaas-api/nest-cli.json                        # [CODE]
touch cannasaas-api/.env                                 # local env (gitignored)
touch cannasaas-api/.env.example                         # [CODE] template
touch cannasaas-api/ormconfig.ts                         # [CODE] TypeORM CLI config


# ═══════════════════════════════════════════════════════════════════
# 3. FRONTEND: apps/storefront/ (Customer-Facing React App)
# ═══════════════════════════════════════════════════════════════════

echo "🛒 [3/8] Storefront app (apps/storefront)..."

mkdir -p apps/storefront/src/components
mkdir -p apps/storefront/src/pages
mkdir -p apps/storefront/src/layouts
mkdir -p apps/storefront/src/hooks
mkdir -p apps/storefront/src/lib/api
mkdir -p apps/storefront/public

# Root config [VITE]
touch apps/storefront/index.html
touch apps/storefront/package.json
touch apps/storefront/tailwind.config.ts
touch apps/storefront/postcss.config.js
touch apps/storefront/tsconfig.json
touch apps/storefront/vite.config.ts

# App entry
touch apps/storefront/src/App.tsx                  # [VITE]
touch apps/storefront/src/main.tsx                 # [VITE]
touch apps/storefront/src/routes.tsx               # [CODE] — React Router config
touch apps/storefront/src/index.css                # [CODE] — Tailwind directives

# Pages
touch apps/storefront/src/pages/Home.tsx           # [CODE] S4
touch apps/storefront/src/pages/Products.tsx       # [CODE] S4
touch apps/storefront/src/pages/ProductDetail.tsx  # [CODE] S4
touch apps/storefront/src/pages/Cart.tsx           # [CODE] S5
touch apps/storefront/src/pages/Checkout.tsx       # [CODE] S6
touch apps/storefront/src/pages/Orders.tsx         # [CODE] S5
touch apps/storefront/src/pages/OrderDetail.tsx    # [CODE] S5
touch apps/storefront/src/pages/Account.tsx        # [STUB]
touch apps/storefront/src/pages/Login.tsx          # [CODE] S2
touch apps/storefront/src/pages/Register.tsx       # [CODE] S2
touch apps/storefront/src/pages/AgeGate.tsx        # [CODE] S7 — age verification gate
touch apps/storefront/src/pages/DeliveryTracking.tsx # [CODE] S10 — live delivery map

# Components
touch apps/storefront/src/components/ProductCard.tsx      # [CODE] S4
touch apps/storefront/src/components/CartSummary.tsx      # [CODE] S5
touch apps/storefront/src/components/Header.tsx           # [CODE]
touch apps/storefront/src/components/Footer.tsx           # [STUB]
touch apps/storefront/src/components/SearchBar.tsx        # [CODE] S9 — autocomplete
touch apps/storefront/src/components/CategoryFilter.tsx   # [CODE] S4
touch apps/storefront/src/components/StrainFilter.tsx     # [CODE] S9
touch apps/storefront/src/components/PromoCodeInput.tsx   # [CODE] S6
touch apps/storefront/src/components/DeliveryMap.tsx      # [CODE] S10

# Layouts
touch apps/storefront/src/layouts/MainLayout.tsx         # [CODE]
touch apps/storefront/src/layouts/CheckoutLayout.tsx     # [CODE]

# Hooks
touch apps/storefront/src/hooks/useCart.ts               # [CODE] S5
touch apps/storefront/src/hooks/useProducts.ts           # [CODE] S4
touch apps/storefront/src/hooks/useTenant.ts             # [CODE] S1
touch apps/storefront/src/hooks/useAuth.ts               # [CODE] S2
touch apps/storefront/src/hooks/useAnalytics.ts          # [CODE] S12 — event tracking
touch apps/storefront/src/hooks/useSocket.ts             # [CODE] S10 — WebSocket

# API client
touch apps/storefront/src/lib/api/client.ts              # [CODE] — Axios instance

# PWA (Sprint 12)
touch apps/storefront/public/manifest.json               # [CODE] S12
touch apps/storefront/src/service-worker.ts              # [CODE] S12


# ═══════════════════════════════════════════════════════════════════
# 4. FRONTEND: apps/admin/ (Admin Portal)
# ═══════════════════════════════════════════════════════════════════

echo "🖥️  [4/8] Admin portal (apps/admin)..."

mkdir -p apps/admin/src/pages/Dashboard
mkdir -p apps/admin/src/pages/Products
mkdir -p apps/admin/src/pages/Orders
mkdir -p apps/admin/src/pages/Customers
mkdir -p apps/admin/src/pages/Analytics
mkdir -p apps/admin/src/pages/Settings
mkdir -p apps/admin/src/pages/Inventory
mkdir -p apps/admin/src/pages/Compliance
mkdir -p apps/admin/src/pages/Delivery
mkdir -p apps/admin/src/pages/POS
mkdir -p apps/admin/src/components/onboarding
mkdir -p apps/admin/src/components/beta
mkdir -p apps/admin/src/components/ui
mkdir -p apps/admin/src/services/api
mkdir -p apps/admin/src/hooks
mkdir -p apps/admin/src/lib/api

# Root config [VITE]
touch apps/admin/index.html
touch apps/admin/package.json
touch apps/admin/tailwind.config.ts
touch apps/admin/postcss.config.js
touch apps/admin/tsconfig.json
touch apps/admin/vite.config.ts

# App entry
touch apps/admin/src/App.tsx                       # [VITE]
touch apps/admin/src/main.tsx                      # [VITE]
touch apps/admin/src/routes.tsx                    # [CODE]
touch apps/admin/src/index.css                     # [CODE]

# Pages — Dashboard
touch apps/admin/src/pages/Dashboard/Dashboard.tsx # [CODE] S1

# Pages — Products
touch apps/admin/src/pages/Products/ProductList.tsx    # [CODE] S4
touch apps/admin/src/pages/Products/ProductForm.tsx    # [CODE] S4
touch apps/admin/src/pages/Products/ProductDetail.tsx  # [CODE] S4

# Pages — Orders
touch apps/admin/src/pages/Orders/OrderList.tsx    # [CODE] S5
touch apps/admin/src/pages/Orders/OrderDetail.tsx  # [CODE] S5

# Pages — Customers
touch apps/admin/src/pages/Customers/CustomerList.tsx    # [STUB]
touch apps/admin/src/pages/Customers/CustomerDetail.tsx  # [STUB]

# Pages — Analytics
touch apps/admin/src/pages/Analytics/Analytics.tsx       # [CODE] S12

# Pages — Inventory
touch apps/admin/src/pages/Inventory/InventoryList.tsx   # [CODE] S4
touch apps/admin/src/pages/Inventory/StockAdjust.tsx     # [CODE] S4

# Pages — Compliance
touch apps/admin/src/pages/Compliance/ComplianceLogs.tsx       # [CODE] S7
touch apps/admin/src/pages/Compliance/DailySalesReport.tsx     # [CODE] S7

# Pages — Delivery
touch apps/admin/src/pages/Delivery/DeliveryZones.tsx    # [CODE] S10
touch apps/admin/src/pages/Delivery/DriverManagement.tsx # [CODE] S10
touch apps/admin/src/pages/Delivery/ActiveDeliveries.tsx # [CODE] S10

# Pages — POS
touch apps/admin/src/pages/POS/POSConnections.tsx  # [CODE] S11
touch apps/admin/src/pages/POS/SyncStatus.tsx      # [CODE] S11

# Pages — Settings
touch apps/admin/src/pages/Settings/General.tsx    # [STUB]
touch apps/admin/src/pages/Settings/Branding.tsx   # [CODE] S8 — white-label config
touch apps/admin/src/pages/Settings/Users.tsx      # [CODE] S2 — user management
touch apps/admin/src/pages/Settings/Compliance.tsx # [CODE] S7
touch apps/admin/src/pages/Settings/Payments.tsx   # [CODE] S6

# Components — Shared
touch apps/admin/src/components/Sidebar.tsx        # [CODE]
touch apps/admin/src/components/Topbar.tsx         # [CODE]
touch apps/admin/src/components/DataTable.tsx      # [CODE]
touch apps/admin/src/components/StatCard.tsx       # [CODE]

# Components — Onboarding (Sprint 7)
touch apps/admin/src/components/onboarding/OnboardingWizard.tsx  # [CODE] S7

# Components — Beta (Sprint 7)
touch apps/admin/src/components/beta/BetaFeedbackWidget.tsx      # [CODE] S7

# Components — shadcn/ui [shadcn]
touch apps/admin/src/components/ui/button.tsx
touch apps/admin/src/components/ui/input.tsx
touch apps/admin/src/components/ui/textarea.tsx
touch apps/admin/src/components/ui/select.tsx
touch apps/admin/src/components/ui/dialog.tsx
touch apps/admin/src/components/ui/table.tsx
touch apps/admin/src/components/ui/toast.tsx
touch apps/admin/src/components/ui/progress.tsx
touch apps/admin/src/components/ui/tabs.tsx
touch apps/admin/src/components/ui/card.tsx
touch apps/admin/src/components/ui/badge.tsx

# API services
touch apps/admin/src/services/api/dispensaries.ts  # [CODE] S3
touch apps/admin/src/services/api/products.ts      # [CODE] S4
touch apps/admin/src/services/api/orders.ts        # [CODE] S5
touch apps/admin/src/services/api/analytics.ts     # [CODE] S12
touch apps/admin/src/services/api/compliance.ts    # [CODE] S7
touch apps/admin/src/services/api/delivery.ts      # [CODE] S10
touch apps/admin/src/services/api/pos.ts           # [CODE] S11

# Hooks
touch apps/admin/src/hooks/useAuth.ts              # [CODE] S2
touch apps/admin/src/hooks/useDispensaries.ts      # [CODE] S3
touch apps/admin/src/hooks/useSocket.ts            # [CODE] S10

# API client
touch apps/admin/src/lib/api/client.ts             # [CODE]


# ═══════════════════════════════════════════════════════════════════
# 5. FRONTEND: apps/staff/ (Staff/Budtender/POS Portal)
# ═══════════════════════════════════════════════════════════════════

echo "👤 [5/8] Staff portal (apps/staff)..."

mkdir -p apps/staff/src/pages
mkdir -p apps/staff/src/components
mkdir -p apps/staff/src/hooks
mkdir -p apps/staff/src/lib/api

touch apps/staff/index.html
touch apps/staff/package.json
touch apps/staff/tailwind.config.ts
touch apps/staff/postcss.config.js
touch apps/staff/tsconfig.json
touch apps/staff/vite.config.ts

touch apps/staff/src/App.tsx                       # [VITE]
touch apps/staff/src/main.tsx                      # [VITE]
touch apps/staff/src/routes.tsx                    # [STUB]
touch apps/staff/src/index.css                     # [STUB]

touch apps/staff/src/pages/QuickSale.tsx           # [STUB] — simplified POS
touch apps/staff/src/pages/OrderQueue.tsx          # [STUB] — pickup/delivery queue
touch apps/staff/src/pages/CustomerLookup.tsx      # [STUB] — ID verification
touch apps/staff/src/pages/InventoryCount.tsx      # [STUB] — stock counts

touch apps/staff/src/hooks/useAuth.ts              # [STUB]
touch apps/staff/src/lib/api/client.ts             # [STUB]


# ═══════════════════════════════════════════════════════════════════
# 6. SHARED PACKAGES: packages/
# ═══════════════════════════════════════════════════════════════════

echo "📦 [6/8] Shared packages..."

# --- @cannasaas/types ---
mkdir -p packages/types/src

touch packages/types/package.json                  # [CODE]
touch packages/types/tsconfig.json                 # [CODE]
touch packages/types/src/index.ts                  # [CODE] — barrel export

touch packages/types/src/organization.ts           # [CODE] — Org, Company, Dispensary types
touch packages/types/src/dispensary.ts             # [CODE]
touch packages/types/src/product.ts                # [CODE] — Product, Variant, Category
touch packages/types/src/order.ts                  # [CODE] — Order, OrderItem, Status
touch packages/types/src/user.ts                   # [CODE] — User, Role, Permission
touch packages/types/src/cart.ts                   # [CODE] — Cart, CartItem
touch packages/types/src/compliance.ts             # [CODE] — ComplianceLog, PurchaseLimit
touch packages/types/src/delivery.ts               # [CODE] — Zone, Driver, Assignment
touch packages/types/src/analytics.ts              # [CODE] — DashboardData, TimeRange
touch packages/types/src/pos.ts                    # [CODE] — PosConnection, SyncLog
touch packages/types/src/branding.ts               # [CODE] — Theme, Colors, Fonts
touch packages/types/src/api-responses.ts          # [CODE] — Paginated, ApiError

# --- @cannasaas/ui ---
mkdir -p packages/ui/src

touch packages/ui/package.json                     # [CODE]
touch packages/ui/tsconfig.json                    # [CODE]
touch packages/ui/src/index.ts                     # [CODE] — barrel export

touch packages/ui/src/button.tsx                   # [shadcn] shared button
touch packages/ui/src/input.tsx                    # [shadcn]
touch packages/ui/src/dialog.tsx                   # [shadcn]
touch packages/ui/src/table.tsx                    # [shadcn]
touch packages/ui/src/select.tsx                   # [shadcn]
touch packages/ui/src/toast.tsx                    # [shadcn]
touch packages/ui/src/card.tsx                     # [shadcn]
touch packages/ui/src/badge.tsx                    # [shadcn]
touch packages/ui/src/spinner.tsx                  # [CODE] — loading spinner
touch packages/ui/src/empty-state.tsx              # [CODE] — no-data placeholder

# --- @cannasaas/api-client ---
mkdir -p packages/api-client/src

touch packages/api-client/package.json             # [CODE]
touch packages/api-client/tsconfig.json            # [CODE]
touch packages/api-client/src/index.ts             # [CODE]

touch packages/api-client/src/client.ts            # [CODE] — Axios instance w/ interceptors
touch packages/api-client/src/endpoints.ts         # [CODE] — typed endpoint map
touch packages/api-client/src/interceptors.ts      # [CODE] — auth token, tenant header, error

# --- @cannasaas/stores ---
mkdir -p packages/stores/src

touch packages/stores/package.json                 # [CODE]
touch packages/stores/tsconfig.json                # [CODE]
touch packages/stores/src/index.ts                 # [CODE]

touch packages/stores/src/authStore.ts             # [CODE] — JWT, user, login/logout
touch packages/stores/src/cartStore.ts             # [CODE] — cart state
touch packages/stores/src/organizationStore.ts     # [CODE] — active org/company/dispensary
touch packages/stores/src/tenantStore.ts           # [CODE] — branding, theme

# --- @cannasaas/utils ---
mkdir -p packages/utils/src

touch packages/utils/package.json                  # [CODE]
touch packages/utils/tsconfig.json                 # [CODE]
touch packages/utils/src/index.ts                  # [CODE]

touch packages/utils/src/formatCurrency.ts         # [CODE] — currency formatting
touch packages/utils/src/validators.ts             # [CODE] — shared validation
touch packages/utils/src/dateHelpers.ts            # [CODE] — date formatting
touch packages/utils/src/cannabisUnits.ts          # [CODE] — THC%, weight conversions
touch packages/utils/src/complianceHelpers.ts      # [CODE] — purchase limit calcs


# ═══════════════════════════════════════════════════════════════════
# 7. DOCUMENTATION
# ═══════════════════════════════════════════════════════════════════

echo "📝 [7/8] Documentation..."

mkdir -p docs

touch docs/architecture.md                         # [STUB] system architecture overview
touch docs/api-reference.md                        # [STUB] endpoint documentation
touch docs/deployment.md                           # [STUB] deployment guide
touch docs/multi-tenancy.md                        # [STUB] tenant isolation strategy
touch docs/compliance-guide.md                     # [STUB] state compliance requirements
touch docs/pos-integration.md                      # [STUB] POS adapter development


# ═══════════════════════════════════════════════════════════════════
# 8. SUMMARY
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ CannaSaas Platform scaffolding complete!"
echo "═══════════════════════════════════════════════════"
echo ""

# Count everything
DIR_COUNT=$(find . -type d | wc -l | tr -d ' ')
FILE_COUNT=$(find . -type f -not -path './.git/*' | wc -l | tr -d ' ')
API_FILES=$(find cannasaas-api -type f 2>/dev/null | wc -l | tr -d ' ')
STOREFRONT_FILES=$(find apps/storefront -type f 2>/dev/null | wc -l | tr -d ' ')
ADMIN_FILES=$(find apps/admin -type f 2>/dev/null | wc -l | tr -d ' ')
STAFF_FILES=$(find apps/staff -type f 2>/dev/null | wc -l | tr -d ' ')
PKG_FILES=$(find packages -type f 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Totals:"
echo "   Directories:    $DIR_COUNT"
echo "   Files:          $FILE_COUNT"
echo ""
echo "   🔧 Backend API:     $API_FILES files"
echo "   🛒 Storefront:      $STOREFRONT_FILES files"
echo "   🖥️  Admin Portal:    $ADMIN_FILES files"
echo "   👤 Staff Portal:    $STAFF_FILES files"
echo "   📦 Shared Packages: $PKG_FILES files"
echo ""
echo "📋 Next steps:"
echo "   1. cd cannasaas-api && nest new . --skip-git"
echo "   2. cd apps/storefront && pnpm create vite . --template react-ts"
echo "   3. cd apps/admin && pnpm create vite . --template react-ts"
echo "   4. cd apps/staff && pnpm create vite . --template react-ts"
echo "   5. pnpm install (from root)"
echo "   6. turbo dev (starts all apps)"
echo ""
echo "🌿 Happy building, Dennis!"
