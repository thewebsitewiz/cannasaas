#!/bin/bash
# ============================================================
# CannaSaas - COMPLETE Project Scaffolding Commands v3
# ALL files from Sprints 1-6 + Sprints 7+ Implementation Guides
# ============================================================
# Legend:
#   🔧 BACKEND     = cannasaas-api
#   🖥️ ADMIN       = cannasaas-admin
#   🛒 STOREFRONT   = cannasaas-storefront
#
# File annotations:
#   [CODE]    = Full implementation exists in the guides
#   [STUB]    = Referenced via imports; you write the implementation
#   [NestCLI] = Generated via `nest generate` but listed for completeness
#   [shadcn]  = Installed via shadcn/ui CLI
#
# SAFE TO RE-RUN:
#   mkdir -p  = skips existing directories
#   touch     = only updates timestamp on existing files, never overwrites
# ============================================================


# ============================================================
# PART 1: DIRECTORIES  (mkdir -p)
# ============================================================

echo "📁 Creating directory structure..."

# --- ⚙️ PROJECT ROOT ---

mkdir -p scripts                                  # SQL init scripts for Docker

# --- 🔧 BACKEND: cannasaas-api ---

# Core / Config
mkdir -p cannasaas-api/src/config

# Auth module (Sprint 2)
mkdir -p cannasaas-api/src/auth/dto
mkdir -p cannasaas-api/src/auth/guards
mkdir -p cannasaas-api/src/auth/strategies
mkdir -p cannasaas-api/src/auth/decorators

# Common / shared
mkdir -p cannasaas-api/src/common/entities
mkdir -p cannasaas-api/src/common/middleware
mkdir -p cannasaas-api/src/common/tenant
mkdir -p cannasaas-api/src/common/filters
mkdir -p cannasaas-api/src/common/guards
mkdir -p cannasaas-api/src/common/interceptors
mkdir -p cannasaas-api/src/common/logger
mkdir -p cannasaas-api/src/common/metrics

# Sprint 1-3: Core domain modules
mkdir -p cannasaas-api/src/users/entities
mkdir -p cannasaas-api/src/organizations/entities
mkdir -p cannasaas-api/src/companies
mkdir -p cannasaas-api/src/dispensaries/entities
mkdir -p cannasaas-api/src/tenants                # Listed in Section 1.1 tree

# Sprint 4-5: Products & Orders
mkdir -p cannasaas-api/src/products/dto
mkdir -p cannasaas-api/src/products/entities
mkdir -p cannasaas-api/src/orders/entities

# Sprint 5: Cart
mkdir -p cannasaas-api/src/cart/entities

# Sprint 6: Compliance & Health (core level)
mkdir -p cannasaas-api/src/compliance
mkdir -p cannasaas-api/src/health

# Sprint 6: Upload
mkdir -p cannasaas-api/src/upload

# Migrations (referenced in TypeORM config Section 1.7)
mkdir -p cannasaas-api/src/migrations

# Sprint 7+: Feature modules (under modules/)
mkdir -p cannasaas-api/src/modules/feature-flags/entities
mkdir -p cannasaas-api/src/modules/onboarding
mkdir -p cannasaas-api/src/modules/beta/entities
mkdir -p cannasaas-api/src/modules/analytics/entities
mkdir -p cannasaas-api/src/modules/marketing/entities
mkdir -p cannasaas-api/src/modules/health
mkdir -p cannasaas-api/src/modules/reviews/entities
mkdir -p cannasaas-api/src/modules/loyalty/entities
mkdir -p cannasaas-api/src/modules/promotions/entities
mkdir -p cannasaas-api/src/modules/inventory/entities
mkdir -p cannasaas-api/src/modules/delivery/entities
mkdir -p cannasaas-api/src/modules/notifications
mkdir -p cannasaas-api/src/modules/ai
mkdir -p cannasaas-api/src/modules/billing
mkdir -p cannasaas-api/src/modules/api-keys/entities
mkdir -p cannasaas-api/src/modules/compliance/metrc
mkdir -p cannasaas-api/src/modules/compliance/guards
mkdir -p cannasaas-api/src/modules/compliance/audit/entities
mkdir -p cannasaas-api/src/modules/mail
mkdir -p cannasaas-api/src/modules/payments

# Test directory
mkdir -p cannasaas-api/test

# --- 🖥️ ADMIN: cannasaas-admin ---

mkdir -p cannasaas-admin/src/components/auth
mkdir -p cannasaas-admin/src/components/dispensaries
mkdir -p cannasaas-admin/src/components/ui
mkdir -p cannasaas-admin/src/components/onboarding
mkdir -p cannasaas-admin/src/components/beta
mkdir -p cannasaas-admin/src/companies
mkdir -p cannasaas-admin/src/dispensaries
mkdir -p cannasaas-admin/src/hooks
mkdir -p cannasaas-admin/src/lib/api
mkdir -p cannasaas-admin/src/organizations
mkdir -p cannasaas-admin/src/pages

# --- 🛒 STOREFRONT: cannasaas-storefront ---

mkdir -p cannasaas-storefront/public/icons
mkdir -p cannasaas-storefront/src/hooks
mkdir -p cannasaas-storefront/src/components/ui
mkdir -p cannasaas-storefront/src/lib/api
mkdir -p cannasaas-storefront/src/pages

echo "✅ Directories created"
echo ""


# ============================================================
# PART 2: FILES  (touch)
# ============================================================

echo "📄 Creating files..."

# ===========================================================
# ⚙️ PROJECT ROOT
# ===========================================================

touch docker-compose.yml                                   # [CODE] Section 1.2
touch .gitignore                                           # [CODE] Sprint 1
touch README.md                                            # [CODE] Sprint 1
touch "Project Guide.md"                                   # Listed in Section 1.1 tree


# ===========================================================
# ⚙️ SCRIPTS (Infrastructure)
# ===========================================================

touch scripts/init-postgres.sql                            # [CODE] Section 1.3 - Docker entrypoint SQL


# ===========================================================
# 🔧 BACKEND: cannasaas-api
# ===========================================================

# --- Root config files ---
touch cannasaas-api/.env.example                          # [CODE] Section 1.4
touch cannasaas-api/Dockerfile                            # [CODE] Section 1.2 (docker-compose ref)
touch cannasaas-api/docker-compose.yml                    # [CODE] Section 1.2
touch cannasaas-api/nest-cli.json                         # [CODE] Sprint 1
touch cannasaas-api/package.json                          # [CODE] Sprint 1
touch cannasaas-api/tsconfig.json                         # [CODE] Sprint 1

# --- App entry points ---
touch cannasaas-api/src/main.ts                           # [CODE] Section 1.5 + Sprint 7 (Sentry init)
touch cannasaas-api/src/app.module.ts                     # [CODE] Section 1.6

# --- Config ---
touch cannasaas-api/src/config/typeorm.config.ts          # [CODE] Section 1.7


# =====================
# Section 2: Database & Models (Entities)
# =====================

# 2.1 Base Entity
touch cannasaas-api/src/common/entities/base.entity.ts              # [CODE] Section 2.1

# 2.2 Organization Entity
touch cannasaas-api/src/organizations/entities/organization.entity.ts # [CODE] Section 2.2

# 2.3 User Entity
touch cannasaas-api/src/users/entities/user.entity.ts               # [CODE] Section 2.3

# 2.4-2.7 Product Entities
touch cannasaas-api/src/products/entities/product.entity.ts         # [CODE] Section 2.4
touch cannasaas-api/src/products/entities/product-variant.entity.ts # [CODE] Section 2.5
touch cannasaas-api/src/products/entities/product-image.entity.ts   # [CODE] Section 2.6
touch cannasaas-api/src/products/entities/category.entity.ts        # [CODE] Section 2.7

# 2.8 Dispensary Entity
touch cannasaas-api/src/dispensaries/entities/dispensary.entity.ts  # [CODE] Section 2.8

# 2.9 Order Entities
touch cannasaas-api/src/orders/entities/order.entity.ts                # [CODE] Section 2.9
touch cannasaas-api/src/orders/entities/order-item.entity.ts           # [CODE] Section 2.9
touch cannasaas-api/src/orders/entities/order-status-history.entity.ts # [CODE] Section 2.9


# =====================
# Section 3: Auth & Multi-Tenancy
# =====================

# 3.1-3.3 Tenant
touch cannasaas-api/src/common/middleware/tenant.middleware.ts       # [CODE] Section 3.1
touch cannasaas-api/src/common/tenant/tenant.service.ts             # [CODE] Section 3.2
touch cannasaas-api/src/common/tenant/tenant.module.ts              # [CODE] Section 3.3

# 3.4-3.9 Auth
touch cannasaas-api/src/auth/auth.module.ts               # [CODE] Section 3.4
touch cannasaas-api/src/auth/auth.service.ts              # [CODE] Section 3.5
touch cannasaas-api/src/auth/auth.controller.ts           # [CODE] Section 3.6
touch cannasaas-api/src/auth/dto/login.dto.ts             # [CODE] Section 3.7
touch cannasaas-api/src/auth/dto/register.dto.ts          # [CODE] Section 3.7
touch cannasaas-api/src/auth/strategies/jwt.strategy.ts   # [CODE] Section 3.8
touch cannasaas-api/src/auth/guards/jwt-auth.guard.ts     # [CODE] Section 3.9
touch cannasaas-api/src/auth/guards/roles.guard.ts        # [CODE] Section 3.9
touch cannasaas-api/src/auth/decorators/roles.decorator.ts # [CODE] Section 3.9


# =====================
# Section 4: Core API Endpoints
# =====================

# 4.1-4.4 Products
touch cannasaas-api/src/products/products.module.ts                 # [CODE] Section 4.1
touch cannasaas-api/src/products/products.service.ts                # [CODE] Section 4.2
touch cannasaas-api/src/products/products.controller.ts             # [CODE] Section 4.3
touch cannasaas-api/src/products/dto/create-product.dto.ts          # [CODE] Section 4.4
touch cannasaas-api/src/products/dto/update-product.dto.ts          # [CODE] Section 4.4


# =================================
# Core Modules (app.module imports)
# =================================

# Users (module/controller/service for CRUD)
touch cannasaas-api/src/users/users.module.ts              # [NestCLI]
touch cannasaas-api/src/users/users.controller.ts          # [NestCLI]
touch cannasaas-api/src/users/users.service.ts             # [NestCLI]

# Organizations
touch cannasaas-api/src/organizations/organizations.module.ts     # [NestCLI]
touch cannasaas-api/src/organizations/organizations.controller.ts # [NestCLI]
touch cannasaas-api/src/organizations/organizations.service.ts    # [NestCLI]

# Companies
touch cannasaas-api/src/companies/companies.module.ts      # [NestCLI]
touch cannasaas-api/src/companies/companies.controller.ts  # [NestCLI]
touch cannasaas-api/src/companies/companies.service.ts     # [NestCLI]

# Dispensaries
touch cannasaas-api/src/dispensaries/dispensaries.module.ts        # [NestCLI]
touch cannasaas-api/src/dispensaries/dispensaries.controller.ts    # [NestCLI]
touch cannasaas-api/src/dispensaries/dispensaries.service.ts       # [NestCLI]

# Orders
touch cannasaas-api/src/orders/orders.module.ts                    # [NestCLI]
touch cannasaas-api/src/orders/orders.controller.ts                # [NestCLI]
touch cannasaas-api/src/orders/orders.service.ts                   # [NestCLI]
touch cannasaas-api/src/orders/order.service.ts                    # [STUB] Sprint 7+ (imported by reviews)

# Cart
touch cannasaas-api/src/cart/entities/cart.entity.ts               # [CODE] from walkthrough
touch cannasaas-api/src/cart/entities/cart-item.entity.ts          # [CODE] from walkthrough
touch cannasaas-api/src/cart/cart.module.ts                         # [NestCLI]
touch cannasaas-api/src/cart/cart.controller.ts                     # [NestCLI]
touch cannasaas-api/src/cart/cart.service.ts                        # [NestCLI]

# Core-level Health (app.module imports from ./health/)
touch cannasaas-api/src/health/health.module.ts                    # [NestCLI]
touch cannasaas-api/src/health/health.controller.ts                # [STUB]

# Core-level Compliance (app.module imports from ./compliance/)
touch cannasaas-api/src/compliance/compliance.module.ts            # [NestCLI]

# Upload (app.module imports from ./upload/)
touch cannasaas-api/src/upload/upload.module.ts                    # [NestCLI]
touch cannasaas-api/src/upload/upload.controller.ts                # [NestCLI]
touch cannasaas-api/src/upload/upload.service.ts                   # [NestCLI]


# ========================
# Common / Shared (Sprint 7+)
# ========================

touch cannasaas-api/src/common/middleware/request-logger.middleware.ts # [CODE] Sprint 7
touch cannasaas-api/src/common/filters/sentry-exception.filter.ts   # [CODE] Sprint 7
touch cannasaas-api/src/common/guards/api-key.guard.ts              # [CODE] Sprint 12
touch cannasaas-api/src/common/interceptors/metrics.interceptor.ts  # [CODE] Sprint 8
touch cannasaas-api/src/common/interceptors/audit.interceptor.ts    # [CODE] Sprint 13
touch cannasaas-api/src/common/logger/winston.config.ts             # [CODE] Sprint 8
touch cannasaas-api/src/common/metrics/metrics.service.ts           # [CODE] Sprint 8
touch cannasaas-api/src/common/metrics/metrics.controller.ts        # [CODE] Sprint 8


# ============================================
# Sprint 7+: Feature Modules (under modules/)
# ============================================

# Feature Flags [CODE - Sprint 7]
touch cannasaas-api/src/modules/feature-flags/entities/feature-flag.entity.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.service.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.guard.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.module.ts

# Onboarding [CODE - Sprint 7]
touch cannasaas-api/src/modules/onboarding/onboarding.service.ts
touch cannasaas-api/src/modules/onboarding/onboarding.controller.ts
touch cannasaas-api/src/modules/onboarding/onboarding.module.ts

# Beta [CODE - Sprint 7]
touch cannasaas-api/src/modules/beta/beta.service.ts
touch cannasaas-api/src/modules/beta/beta.controller.ts
touch cannasaas-api/src/modules/beta/beta.module.ts
touch cannasaas-api/src/modules/beta/entities/beta-invitation.entity.ts
touch cannasaas-api/src/modules/beta/entities/beta-feedback.entity.ts

# Analytics [CODE - Sprint 7-8]
touch cannasaas-api/src/modules/analytics/analytics.service.ts
touch cannasaas-api/src/modules/analytics/advanced-analytics.service.ts
touch cannasaas-api/src/modules/analytics/analytics.controller.ts
touch cannasaas-api/src/modules/analytics/analytics.module.ts
touch cannasaas-api/src/modules/analytics/entities/analytics-event.entity.ts

# Marketing [CODE - Sprint 7]
touch cannasaas-api/src/modules/marketing/campaign.service.ts
touch cannasaas-api/src/modules/marketing/marketing.module.ts
touch cannasaas-api/src/modules/marketing/entities/marketing-log.entity.ts

# Health - Advanced (Sprint 8, under modules/)
touch cannasaas-api/src/modules/health/health.controller.ts
touch cannasaas-api/src/modules/health/redis.health.ts
touch cannasaas-api/src/modules/health/health.module.ts

# Reviews [CODE - Sprint 9]
touch cannasaas-api/src/modules/reviews/review.service.ts
touch cannasaas-api/src/modules/reviews/review.controller.ts
touch cannasaas-api/src/modules/reviews/review.module.ts
touch cannasaas-api/src/modules/reviews/entities/review.entity.ts

# Loyalty [CODE - Sprint 9]
touch cannasaas-api/src/modules/loyalty/loyalty.service.ts
touch cannasaas-api/src/modules/loyalty/loyalty.controller.ts
touch cannasaas-api/src/modules/loyalty/loyalty.module.ts
touch cannasaas-api/src/modules/loyalty/entities/loyalty-account.entity.ts
touch cannasaas-api/src/modules/loyalty/entities/loyalty-transaction.entity.ts

# Promotions [CODE - Sprint 9]
touch cannasaas-api/src/modules/promotions/promotion.service.ts
touch cannasaas-api/src/modules/promotions/promotion.controller.ts
touch cannasaas-api/src/modules/promotions/promotion.module.ts
touch cannasaas-api/src/modules/promotions/entities/promotion.entity.ts

# Inventory [CODE - Sprint 9]
touch cannasaas-api/src/modules/inventory/inventory.service.ts
touch cannasaas-api/src/modules/inventory/inventory.controller.ts
touch cannasaas-api/src/modules/inventory/inventory.module.ts
touch cannasaas-api/src/modules/inventory/entities/inventory-item.entity.ts
touch cannasaas-api/src/modules/inventory/entities/stock-movement.entity.ts

# Delivery [CODE - Sprint 10]
touch cannasaas-api/src/modules/delivery/delivery.service.ts
touch cannasaas-api/src/modules/delivery/delivery.controller.ts
touch cannasaas-api/src/modules/delivery/delivery.module.ts
touch cannasaas-api/src/modules/delivery/entities/delivery.entity.ts

# Notifications / WebSocket [CODE - Sprint 10]
touch cannasaas-api/src/modules/notifications/notification.gateway.ts
touch cannasaas-api/src/modules/notifications/notification.module.ts

# AI [CODE - Sprint 11]
touch cannasaas-api/src/modules/ai/ai-description.service.ts
touch cannasaas-api/src/modules/ai/chatbot.service.ts
touch cannasaas-api/src/modules/ai/forecast.service.ts
touch cannasaas-api/src/modules/ai/ai.controller.ts
touch cannasaas-api/src/modules/ai/ai.module.ts

# Billing [CODE - Sprint 12]
touch cannasaas-api/src/modules/billing/billing.service.ts
touch cannasaas-api/src/modules/billing/billing.controller.ts
touch cannasaas-api/src/modules/billing/billing.module.ts

# API Keys [CODE - Sprint 12]
touch cannasaas-api/src/modules/api-keys/api-key.service.ts
touch cannasaas-api/src/modules/api-keys/api-key.controller.ts
touch cannasaas-api/src/modules/api-keys/api-key.module.ts
touch cannasaas-api/src/modules/api-keys/entities/api-key.entity.ts

# Compliance - METRC [CODE - Sprint 13]
touch cannasaas-api/src/modules/compliance/metrc/metrc.service.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc.module.ts

# Compliance - Guards [CODE - Sprint 13]
touch cannasaas-api/src/modules/compliance/guards/compliance.guard.ts

# Compliance - Audit [CODE - Sprint 13]
touch cannasaas-api/src/modules/compliance/audit/audit.service.ts
touch cannasaas-api/src/modules/compliance/audit/audit.controller.ts
touch cannasaas-api/src/modules/compliance/audit/audit.module.ts
touch cannasaas-api/src/modules/compliance/audit/entities/audit-log.entity.ts

# Compliance - root module (Sprint 13)
touch cannasaas-api/src/modules/compliance/compliance.module.ts

# Mail [STUB - referenced by onboarding, beta, marketing]
touch cannasaas-api/src/modules/mail/mail.service.ts
touch cannasaas-api/src/modules/mail/mail.module.ts

# Payments [STUB - referenced by onboarding]
touch cannasaas-api/src/modules/payments/stripe.service.ts
touch cannasaas-api/src/modules/payments/payments.module.ts


# ===========================================================
# 🖥️ ADMIN: cannasaas-admin
# ===========================================================

# Root config
touch cannasaas-admin/Dockerfile                          # [CODE] Section 1.2 (docker-compose ref)
touch cannasaas-admin/index.html                          # [CODE] Sprint 1
touch cannasaas-admin/package.json                        # [CODE] Sprint 1
touch cannasaas-admin/tailwind.config.js                  # [CODE] Sprint 1
touch cannasaas-admin/tsconfig.json                       # [CODE] Sprint 1
touch cannasaas-admin/vite.config.ts                      # [CODE] Sprint 1

# App entry
touch cannasaas-admin/src/App.tsx                         # [STUB]
touch cannasaas-admin/src/main.tsx                        # [STUB]

# API client
touch cannasaas-admin/src/lib/api/client.ts               # [STUB]

# Hooks
touch cannasaas-admin/src/hooks/useAuth.ts                # [STUB]
touch cannasaas-admin/src/hooks/useSocket.ts              # [CODE] Sprint 10

# Components [CODE]
touch cannasaas-admin/src/components/onboarding/OnboardingWizard.tsx  # [CODE] Sprint 7
touch cannasaas-admin/src/components/beta/BetaFeedbackWidget.tsx      # [CODE] Sprint 7

# Component stubs (shadcn/ui - installed via CLI)
touch cannasaas-admin/src/components/ui/button.tsx         # [shadcn]
touch cannasaas-admin/src/components/ui/input.tsx          # [shadcn]
touch cannasaas-admin/src/components/ui/textarea.tsx       # [shadcn]
touch cannasaas-admin/src/components/ui/progress.tsx       # [shadcn]


# ===========================================================
# 🛒 STOREFRONT: cannasaas-storefront
# ===========================================================

# Root config
touch cannasaas-storefront/index.html                     # [STUB]
touch cannasaas-storefront/package.json                   # [STUB]
touch cannasaas-storefront/tailwind.config.js             # [STUB]
touch cannasaas-storefront/tsconfig.json                  # [STUB]
touch cannasaas-storefront/vite.config.ts                 # [STUB]

# App entry
touch cannasaas-storefront/src/App.tsx                    # [STUB]
touch cannasaas-storefront/src/main.tsx                   # [STUB]

# PWA [CODE - Sprint 12]
touch cannasaas-storefront/public/manifest.json
touch cannasaas-storefront/src/service-worker.ts

# API client
touch cannasaas-storefront/src/lib/api/client.ts          # [STUB]

# Hooks [CODE]
touch cannasaas-storefront/src/hooks/useAnalytics.ts      # [CODE] Sprint 7
touch cannasaas-storefront/src/hooks/useSocket.ts         # [CODE] Sprint 10
touch cannasaas-storefront/src/hooks/useAuth.ts           # [STUB]


# ============================================================
# SUMMARY
# ============================================================

echo ""
echo "============================================"
echo "✅ CannaSaas scaffolding complete!"
echo "============================================"
echo ""

DIRS=$(find cannasaas-* scripts -type d 2>/dev/null | wc -l)
FILES=$(find cannasaas-* scripts -type f 2>/dev/null | wc -l)
BACKEND=$(find cannasaas-api -type f 2>/dev/null | wc -l)
ADMIN=$(find cannasaas-admin -type f 2>/dev/null | wc -l)
STORE=$(find cannasaas-storefront -type f 2>/dev/null | wc -l)
ROOT_FILES=$(ls -1 docker-compose.yml .gitignore README.md "Project Guide.md" 2>/dev/null | wc -l)
SCRIPT_FILES=$(find scripts -type f 2>/dev/null | wc -l)

echo "  📁 Directories: $DIRS"
echo "  📄 Files:       $(( FILES + ROOT_FILES + SCRIPT_FILES ))"
echo ""
echo "  🔧 Backend  (cannasaas-api):          $BACKEND files"
echo "  🖥️  Admin    (cannasaas-admin):         $ADMIN files"
echo "  🛒 Storefront (cannasaas-storefront):  $STORE files"
echo "  ⚙️  Root + scripts:                     $(( ROOT_FILES + SCRIPT_FILES )) files"
echo ""
echo "Next steps:"
echo "  1. cd cannasaas-api && npm init -y && nest new . --skip-git"
echo "  2. cd cannasaas-admin && npm create vite@latest . -- --template react-ts"
echo "  3. cd cannasaas-storefront && npm create vite@latest . -- --template react-ts"
echo ""
