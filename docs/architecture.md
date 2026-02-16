# CannaSaas — System Architecture

**Version:** 2.0 | February 2026

---

## 1. High-Level Architecture

CannaSaas is a multi-tenant, white-label cannabis dispensary e-commerce platform built on a monorepo architecture with clear separation between frontend applications, shared libraries, and the backend API.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  Storefront    │  │  Admin Portal  │  │  Staff Portal  │       │
│  │  (React/Vite)  │  │  (React/Vite)  │  │  (React/Vite)  │       │
│  │  :5173         │  │  :5174         │  │  :5175         │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                 │
│  ┌───────┴──────────────────┴──────────────────┴───────┐       │
│  │              Shared Packages (@cannasaas/*)          │       │
│  │  types · ui · api-client · stores · utils            │       │
│  └──────────────────────┬──────────────────────────────┘       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                                │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  CloudFront   │  │  Route 53      │  │  ALB           │       │
│  │  CDN          │  │  DNS           │  │  Load Balancer │       │
│  └──────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│         │                  │                  │                 │
│  ┌──────┴──────────────────┴──────────────────┴───────┐       │
│  │                 cannasaas-api (NestJS)               │       │
│  │                 ECS Fargate · Port 3000              │       │
│  │  ┌──────────────────────────────────────────────┐   │       │
│  │  │  Modules:                                     │   │       │
│  │  │  auth · users · organizations · companies     │   │       │
│  │  │  dispensaries · products · inventory · cart    │   │       │
│  │  │  orders · payments · promotions · compliance  │   │       │
│  │  │  onboarding · tenants · branding · search     │   │       │
│  │  │  recommendations · delivery · notifications   │   │       │
│  │  │  pos · analytics · upload · health            │   │       │
│  │  └──────────────────────────────────────────────┘   │       │
│  └─────────┬─────────────────┬─────────────────┬──────┘       │
│            │                 │                 │                │
│  ┌─────────▼──────┐  ┌──────▼───────┐  ┌─────▼────────┐      │
│  │  PostgreSQL 16  │  │  Redis 7+     │  │  Elastic-     │      │
│  │  + PostGIS      │  │  Cache/Queue  │  │  search       │      │
│  │  RDS Multi-AZ   │  │  ElastiCache  │  │  OpenSearch   │      │
│  └────────────────┘  └──────────────┘  └──────────────┘      │
│                                                                 │
│  ┌────────────────┐  ┌──────────────┐                          │
│  │  S3 Buckets     │  │  SQS/SNS      │                          │
│  │  Assets/Uploads │  │  Event Bus    │                          │
│  └────────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Organizational Hierarchy

```
Organization (Holding Company / Parent Entity)
├── Branding (Master Brand Assets)
├── Billing & Subscription Management
└── Companies (1-n Legal Business Entities)
    ├── Branding (Inherits from Organization, Can Override)
    ├── License Information (State-specific)
    ├── Payment Processor Configuration
    └── Dispensaries (1-n Physical/Virtual Locations)
        ├── Branding (Inherits from Company, Full Override Allowed)
        ├── Inventory (Isolated per Dispensary)
        ├── License Type (Medical / Recreational / Both)
        ├── Operating Hours & Delivery Zones
        └── Staff & Role Assignments
```

**Example:**
```
Organization: "Green Leaf Holdings LLC"
  Company_1: "Green Leaf NY Inc." (NY License #NY-123)
    Dispensary_1: "Green Leaf Brooklyn" (Medical + Recreational)
    Dispensary_2: "Green Leaf Manhattan" (Recreational only)
  Company_2: "Green Leaf NJ Corp." (NJ License #NJ-456)
    Dispensary_3: "Green Leaf Newark" (Medical + Recreational)
```

---

## 3. Multi-Tenancy Strategy

See [multi-tenancy.md](./multi-tenancy.md) for full details.

**Summary:** Hybrid approach — separate PostgreSQL schemas per organization (hard partition) with shared tables using `tenant_id` filtering within each schema. Row-level security prevents cross-org data leaks.

---

## 4. Backend Module Architecture

The NestJS backend is organized into 20+ domain modules, each following the standard NestJS pattern: `module → controller → service → entity/dto`.

| Module | Sprint | Responsibility |
|---|---|---|
| `auth` | S2 | JWT authentication, refresh tokens, bcrypt |
| `users` | S2 | User CRUD, RBAC roles |
| `organizations` | S3 | Top-level tenant management |
| `companies` | S3 | Legal business entities |
| `dispensaries` | S3 | Locations, PostGIS geospatial |
| `products` | S4 | Catalog, categories, variants |
| `inventory` | S4 | Stock tracking, transaction ledger |
| `upload` | S4 | S3 presigned URLs |
| `cart` | S5 | Shopping cart |
| `orders` | S5-6 | Order lifecycle |
| `payments` | S6 | Stripe integration |
| `promotions` | S6 | Promo code engine |
| `compliance` | S7 | Audit logging, Metrc, purchase limits |
| `onboarding` | S7 | Tenant onboarding wizard |
| `tenants` | S8 | Schema provisioning |
| `branding` | S8 | White-label theming |
| `search` | S9 | Elasticsearch, cannabis synonyms |
| `recommendations` | S9 | Similar/trending products |
| `delivery` | S10 | Zones, drivers, WebSocket tracking |
| `notifications` | S10/12 | SMS (Twilio), web push |
| `pos` | S11 | Dutchie/Treez adapters |
| `analytics` | S12 | Dashboard data, nightly aggregation |

---

## 5. Frontend Architecture

Three React applications share code through five workspace packages:

| App | Purpose | Port |
|---|---|---|
| `apps/storefront` | Customer-facing shop | 5173 |
| `apps/admin` | Admin dashboard | 5174 |
| `apps/staff` | Budtender/POS interface | 5175 |

| Package | Purpose |
|---|---|
| `@cannasaas/types` | Shared TypeScript interfaces |
| `@cannasaas/ui` | shadcn/ui component library |
| `@cannasaas/api-client` | Axios + TanStack Query hooks |
| `@cannasaas/stores` | Zustand state stores |
| `@cannasaas/utils` | Formatters, validators, helpers |

**Tech Stack:**
- React 18 + TypeScript 5.3
- Vite 5 (per-app), Turborepo (monorepo orchestration)
- pnpm (workspace protocol)
- Zustand 4.4 (client state) + TanStack Query 5 (server state)
- React Router v6 (lazy-loaded pages)
- Tailwind CSS 3.3 + shadcn/ui (Radix UI primitives)
- React Hook Form 7 + Zod validation

---

## 6. Data Flow

### Authentication Flow
```
User → Login Form → POST /auth/login → JWT + Refresh Token
     → Axios interceptor attaches Bearer token to all requests
     → Token expires → interceptor calls POST /auth/refresh
     → New access token → retry original request
```

### Tenant Resolution Flow
```
Request → tenant.middleware.ts
       → Extract X-Organization-Id and X-Dispensary-Id from headers
       → Resolve tenant context (org, company, dispensary)
       → Attach TenantContext to request
       → tenant.guard.ts validates user has access to tenant
       → Controller receives @CurrentTenant() decorator
       → Service filters all queries by tenant_id
```

### Order Flow
```
Add to Cart → POST /cart/items
Apply Promo → POST /cart/promo
Checkout    → POST /orders (validates inventory, purchase limits)
Payment     → POST /payments (Stripe payment intent)
Fulfillment → PUT /orders/:id/status (pickup/delivery)
Compliance  → Auto-logs to compliance_logs table
Analytics   → Nightly aggregation cron
```

---

## 7. Caching Strategy

```
L1: Browser Cache (static assets via CloudFront, 1 year TTL)
L2: Redis Cache (API responses, 5-15 min TTL)
    - Product listings: 5 min
    - Dispensary details: 15 min
    - User sessions: 7 days
    - Rate limiting counters: 1 min window
L3: PostgreSQL (source of truth)

Write-through: On product update → invalidate Redis key → next read repopulates
```

---

## 8. AWS Deployment Architecture

```
Route 53 (DNS: *.cannasaas.com)
    │
CloudFront (CDN: static assets, storefront)
    │
Application Load Balancer
    ├── Public Subnets (ALB, NAT Gateway)
    │
    ├── Private Subnets AZ-1
    │   ├── ECS Fargate (API tasks)
    │   └── RDS Primary (PostgreSQL)
    │
    ├── Private Subnets AZ-2
    │   ├── ECS Fargate (API tasks)
    │   └── RDS Read Replica
    │
    └── Private Subnets AZ-3
        ├── ECS Fargate (Worker tasks)
        └── ElastiCache (Redis cluster)

External:
    ├── S3 (uploads, branding assets)
    ├── OpenSearch Service (product search)
    ├── SES (transactional email)
    └── Secrets Manager (credentials)
```

---

## 9. Security Architecture

- **Authentication:** JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- **Authorization:** RBAC with 7 roles: `super_admin`, `owner`, `admin`, `manager`, `budtender`, `driver`, `customer`
- **Tenant Isolation:** Schema-level + row-level security, enforced by middleware
- **Encryption:** AES-256 at rest (RDS, S3), TLS 1.3 in transit
- **Rate Limiting:** Per-tenant, per-endpoint (Redis-backed)
- **Input Validation:** class-validator on all DTOs, Zod on frontend
- **CORS:** Whitelisted origins per tenant subdomain
- **POS Credentials:** Encrypted at rest via AWS KMS
