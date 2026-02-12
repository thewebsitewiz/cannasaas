# ============================================================
# CannaSaas - Complete Project Scaffolding Commands
# Based on Implementation Guides: Sprints 1-6 + Sprints 7+
# ============================================================
# Legend:
#   🔧 BACKEND    = cannasaas-api
#   🖥️ ADMIN      = cannasaas-admin
#   🛒 STOREFRONT  = cannasaas-storefront
# ============================================================


# ============================================================
# PART 1: DIRECTORIES  (mkdir -p)
# ============================================================

# --- 🔧 BACKEND: cannasaas-api ---

# Core
mkdir -p cannasaas-api/src/config

# Auth module
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

# Feature modules - entities
mkdir -p cannasaas-api/src/users/entities
mkdir -p cannasaas-api/src/organizations/entities
mkdir -p cannasaas-api/src/dispensaries/entities
mkdir -p cannasaas-api/src/products/dto
mkdir -p cannasaas-api/src/products/entities
mkdir -p cannasaas-api/src/orders/entities
mkdir -p cannasaas-api/src/cart/entities

# Feature modules - Sprint 7+ services
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
mkdir -p cannasaas-api/src/modules/upload

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


# ============================================================
# PART 2: FILES  (touch)
# ============================================================
# Files are grouped by application, then by directory.
# Files marked [CODE] have full implementations in the guide.
# Files marked [STUB] are referenced via imports but need your implementation.
# ============================================================

# --- 🔧 BACKEND: cannasaas-api ---

# Root config files
touch cannasaas-api/.env.example
touch cannasaas-api/Dockerfile
touch cannasaas-api/docker-compose.yml
touch cannasaas-api/nest-cli.json
touch cannasaas-api/package.json
touch cannasaas-api/tsconfig.json

# App entry points [CODE]
touch cannasaas-api/src/main.ts
touch cannasaas-api/src/app.module.ts

# Config [CODE]
touch cannasaas-api/src/config/typeorm.config.ts

# Auth module [CODE]
touch cannasaas-api/src/auth/auth.module.ts
touch cannasaas-api/src/auth/auth.controller.ts
touch cannasaas-api/src/auth/auth.service.ts
touch cannasaas-api/src/auth/dto/login.dto.ts
touch cannasaas-api/src/auth/dto/register.dto.ts
touch cannasaas-api/src/auth/guards/jwt-auth.guard.ts
touch cannasaas-api/src/auth/guards/roles.guard.ts
touch cannasaas-api/src/auth/strategies/jwt.strategy.ts
touch cannasaas-api/src/auth/decorators/roles.decorator.ts

# Common / shared [CODE]
touch cannasaas-api/src/common/entities/base.entity.ts
touch cannasaas-api/src/common/middleware/tenant.middleware.ts
touch cannasaas-api/src/common/middleware/request-logger.middleware.ts
touch cannasaas-api/src/common/tenant/tenant.module.ts
touch cannasaas-api/src/common/tenant/tenant.service.ts
touch cannasaas-api/src/common/filters/sentry-exception.filter.ts
touch cannasaas-api/src/common/guards/api-key.guard.ts
touch cannasaas-api/src/common/interceptors/metrics.interceptor.ts
touch cannasaas-api/src/common/interceptors/audit.interceptor.ts
touch cannasaas-api/src/common/logger/winston.config.ts
touch cannasaas-api/src/common/metrics/metrics.service.ts
touch cannasaas-api/src/common/metrics/metrics.controller.ts

# Core entities (Sprints 1-6) [CODE]
touch cannasaas-api/src/users/entities/user.entity.ts
touch cannasaas-api/src/organizations/entities/organization.entity.ts
touch cannasaas-api/src/dispensaries/entities/dispensary.entity.ts

# Products module [CODE]
touch cannasaas-api/src/products/products.module.ts
touch cannasaas-api/src/products/products.controller.ts
touch cannasaas-api/src/products/products.service.ts
touch cannasaas-api/src/products/dto/create-product.dto.ts
touch cannasaas-api/src/products/dto/update-product.dto.ts
touch cannasaas-api/src/products/entities/product.entity.ts
touch cannasaas-api/src/products/entities/product-variant.entity.ts
touch cannasaas-api/src/products/entities/product-image.entity.ts
touch cannasaas-api/src/products/entities/category.entity.ts

# Orders module [CODE]
touch cannasaas-api/src/orders/entities/order.entity.ts
touch cannasaas-api/src/orders/entities/order-item.entity.ts
touch cannasaas-api/src/orders/entities/order-status-history.entity.ts
touch cannasaas-api/src/orders/order.service.ts

# Cart [STUB - referenced by marketing campaign service]
touch cannasaas-api/src/cart/entities/cart.entity.ts

# --- Sprint 7+ Feature Modules ---

# Feature Flags [CODE]
touch cannasaas-api/src/modules/feature-flags/entities/feature-flag.entity.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.service.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.guard.ts
touch cannasaas-api/src/modules/feature-flags/feature-flag.module.ts

# Onboarding [CODE]
touch cannasaas-api/src/modules/onboarding/onboarding.service.ts
touch cannasaas-api/src/modules/onboarding/onboarding.controller.ts
touch cannasaas-api/src/modules/onboarding/onboarding.module.ts

# Beta [CODE]
touch cannasaas-api/src/modules/beta/beta.service.ts
touch cannasaas-api/src/modules/beta/beta.controller.ts
touch cannasaas-api/src/modules/beta/beta.module.ts
touch cannasaas-api/src/modules/beta/entities/beta-invitation.entity.ts
touch cannasaas-api/src/modules/beta/entities/beta-feedback.entity.ts

# Analytics [CODE]
touch cannasaas-api/src/modules/analytics/analytics.service.ts
touch cannasaas-api/src/modules/analytics/advanced-analytics.service.ts
touch cannasaas-api/src/modules/analytics/analytics.controller.ts
touch cannasaas-api/src/modules/analytics/analytics.module.ts
touch cannasaas-api/src/modules/analytics/entities/analytics-event.entity.ts

# Marketing [CODE]
touch cannasaas-api/src/modules/marketing/campaign.service.ts
touch cannasaas-api/src/modules/marketing/marketing.module.ts
touch cannasaas-api/src/modules/marketing/entities/marketing-log.entity.ts

# Health [CODE]
touch cannasaas-api/src/modules/health/health.controller.ts
touch cannasaas-api/src/modules/health/redis.health.ts
touch cannasaas-api/src/modules/health/health.module.ts

# Reviews [CODE]
touch cannasaas-api/src/modules/reviews/review.service.ts
touch cannasaas-api/src/modules/reviews/review.controller.ts
touch cannasaas-api/src/modules/reviews/review.module.ts
touch cannasaas-api/src/modules/reviews/entities/review.entity.ts

# Loyalty [CODE]
touch cannasaas-api/src/modules/loyalty/loyalty.service.ts
touch cannasaas-api/src/modules/loyalty/loyalty.controller.ts
touch cannasaas-api/src/modules/loyalty/loyalty.module.ts
touch cannasaas-api/src/modules/loyalty/entities/loyalty-account.entity.ts
touch cannasaas-api/src/modules/loyalty/entities/loyalty-transaction.entity.ts

# Promotions [CODE]
touch cannasaas-api/src/modules/promotions/promotion.service.ts
touch cannasaas-api/src/modules/promotions/promotion.controller.ts
touch cannasaas-api/src/modules/promotions/promotion.module.ts
touch cannasaas-api/src/modules/promotions/entities/promotion.entity.ts

# Inventory [CODE]
touch cannasaas-api/src/modules/inventory/inventory.service.ts
touch cannasaas-api/src/modules/inventory/inventory.controller.ts
touch cannasaas-api/src/modules/inventory/inventory.module.ts
touch cannasaas-api/src/modules/inventory/entities/inventory-item.entity.ts
touch cannasaas-api/src/modules/inventory/entities/stock-movement.entity.ts

# Delivery [CODE]
touch cannasaas-api/src/modules/delivery/delivery.service.ts
touch cannasaas-api/src/modules/delivery/delivery.controller.ts
touch cannasaas-api/src/modules/delivery/delivery.module.ts
touch cannasaas-api/src/modules/delivery/entities/delivery.entity.ts

# Notifications / WebSocket [CODE]
touch cannasaas-api/src/modules/notifications/notification.gateway.ts
touch cannasaas-api/src/modules/notifications/notification.module.ts

# AI [CODE]
touch cannasaas-api/src/modules/ai/ai-description.service.ts
touch cannasaas-api/src/modules/ai/chatbot.service.ts
touch cannasaas-api/src/modules/ai/forecast.service.ts
touch cannasaas-api/src/modules/ai/ai.controller.ts
touch cannasaas-api/src/modules/ai/ai.module.ts

# Billing [CODE]
touch cannasaas-api/src/modules/billing/billing.service.ts
touch cannasaas-api/src/modules/billing/billing.controller.ts
touch cannasaas-api/src/modules/billing/billing.module.ts

# API Keys [CODE]
touch cannasaas-api/src/modules/api-keys/api-key.service.ts
touch cannasaas-api/src/modules/api-keys/api-key.controller.ts
touch cannasaas-api/src/modules/api-keys/api-key.module.ts
touch cannasaas-api/src/modules/api-keys/entities/api-key.entity.ts

# Compliance - METRC [CODE]
touch cannasaas-api/src/modules/compliance/metrc/metrc.service.ts
touch cannasaas-api/src/modules/compliance/metrc/metrc.module.ts

# Compliance - Guards [CODE]
touch cannasaas-api/src/modules/compliance/guards/compliance.guard.ts

# Compliance - Audit [CODE]
touch cannasaas-api/src/modules/compliance/audit/audit.service.ts
touch cannasaas-api/src/modules/compliance/audit/audit.controller.ts
touch cannasaas-api/src/modules/compliance/audit/audit.module.ts
touch cannasaas-api/src/modules/compliance/audit/entities/audit-log.entity.ts

# Compliance - root module
touch cannasaas-api/src/modules/compliance/compliance.module.ts

# Mail [STUB - referenced by onboarding, beta, marketing]
touch cannasaas-api/src/modules/mail/mail.service.ts
touch cannasaas-api/src/modules/mail/mail.module.ts

# Payments [STUB - referenced by onboarding]
touch cannasaas-api/src/modules/payments/stripe.service.ts
touch cannasaas-api/src/modules/payments/payments.module.ts

# Upload [STUB - referenced in sprint 1-6 guide]
touch cannasaas-api/src/modules/upload/upload.service.ts
touch cannasaas-api/src/modules/upload/upload.module.ts


# --- 🖥️ ADMIN: cannasaas-admin ---

# Root config
touch cannasaas-admin/index.html
touch cannasaas-admin/package.json
touch cannasaas-admin/tailwind.config.js
touch cannasaas-admin/tsconfig.json
touch cannasaas-admin/vite.config.ts

# App entry [STUB]
touch cannasaas-admin/src/App.tsx
touch cannasaas-admin/src/main.tsx

# API client [STUB]
touch cannasaas-admin/src/lib/api/client.ts

# Hooks [CODE]
touch cannasaas-admin/src/hooks/useAuth.ts
touch cannasaas-admin/src/hooks/useSocket.ts

# Components [CODE]
touch cannasaas-admin/src/components/onboarding/OnboardingWizard.tsx
touch cannasaas-admin/src/components/beta/BetaFeedbackWidget.tsx

# Component stubs (shadcn/ui - installed via CLI, listed for reference)
touch cannasaas-admin/src/components/ui/button.tsx
touch cannasaas-admin/src/components/ui/input.tsx
touch cannasaas-admin/src/components/ui/textarea.tsx
touch cannasaas-admin/src/components/ui/progress.tsx


# --- 🛒 STOREFRONT: cannasaas-storefront ---

# Root config
touch cannasaas-storefront/index.html
touch cannasaas-storefront/package.json
touch cannasaas-storefront/tailwind.config.js
touch cannasaas-storefront/tsconfig.json
touch cannasaas-storefront/vite.config.ts

# App entry [STUB]
touch cannasaas-storefront/src/App.tsx
touch cannasaas-storefront/src/main.tsx

# PWA [CODE]
touch cannasaas-storefront/public/manifest.json
touch cannasaas-storefront/src/service-worker.ts

# API client [STUB]
touch cannasaas-storefront/src/lib/api/client.ts

# Hooks [CODE]
touch cannasaas-storefront/src/hooks/useAnalytics.ts
touch cannasaas-storefront/src/hooks/useSocket.ts
touch cannasaas-storefront/src/hooks/useAuth.ts


# --- ⚙️ PROJECT ROOT ---

touch docker-compose.yml
touch .gitignore
touch README.md
