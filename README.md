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
