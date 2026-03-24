# CannaSaas — GreenStack Platform

Multi-tenant SaaS platform for licensed cannabis dispensaries across all US states with legal cannabis programs.

## Architecture

- **API**: NestJS 11 + GraphQL (Apollo) + PostgreSQL 16 + Redis 7
- **Storefront**: Next.js 15 (customer e-commerce)
- **Admin**: React 19 + Vite 8 (dispensary management)
- **Staff**: React 19 + Vite 8 (counter operations)
- **Kiosk**: React 19 + Vite 8 (in-store self-service)
- **Platform**: React 19 + Vite 8 (super admin)

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
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm lint             # Lint all code
pnpm type-check       # TypeScript check
pnpm type-check:native # Fast check via tsgo
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
```

## Project Structure

```
apps/
  api/          NestJS backend (34 modules, 95+ tables)
  admin/        Dispensary admin portal
  staff/        Staff operations portal
  kiosk/        In-store self-service
  storefront/   Customer e-commerce
  platform/     Super admin dashboard
packages/
  ui/           Shared design system (10 themes)
  stores/       Zustand state stores
  types/        Shared TypeScript types
deploy/
  Dockerfile.*  Production Docker images
  nginx.conf    Reverse proxy config
docs/           Architecture & business docs
```

## Test Credentials (Dev)

- Admin: `admin@greenleaf.com` / `Admin123!`
- GraphQL Playground: http://localhost:3000/graphql
- Swagger Docs: http://localhost:3000/docs

## Production Deployment

```bash
# Set required environment variables
export DB_PASSWORD=<secure-password>
# See .env.template for all variables

# Deploy with Docker Compose
docker compose -f docker-compose.prod.yml up -d
```

## Documentation

- [Architecture Document](docs/CannaSaas-Architecture-Document.md)
- [Business Plan](docs/CannaSaas-Business-Plan.md)
- [Complete Feature List](docs/CannaSaas-Complete-Feature-List.md)
- [Platform Architecture](docs/CannaSaas-Platform-Architecture.md)
