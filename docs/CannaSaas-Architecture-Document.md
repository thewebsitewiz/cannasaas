# CannaSaas — GreenStack Platform

## Comprehensive Architecture Document

**Version 1.0 | March 2026 | Confidential**

| Metric | Value |
|---|---|
| Backend Modules | 43+ |
| Database Tables | 95+ |
| GraphQL Operations | 180+ |
| REST Endpoints | 12 |
| Frontend Applications | 6 |
| Total Tests | 60 (8 unit suites / 58 tests + 2 integration + k6 load) |
| CSS Themes | 10 |
| Target Markets | All US states with legal cannabis programs (38+ states) |
| Tech Stack | NestJS · GraphQL · PostgreSQL · React · Next.js · Docker |

---

## Table of Contents

# 1. Executive Overview

CannaSaas (branded as GreenStack) is a comprehensive, multi-tenant software-as-a-service platform purpose-built for licensed cannabis dispensaries operating in all states with legal cannabis programs. The platform delivers a complete technology stack covering e-commerce, point-of-sale integration, inventory management, seed-to-sale regulatory compliance, staffing operations, delivery logistics, customer loyalty, vendor management, and payment processing.

The architecture is designed around three core principles: regulatory compliance as a first-class concern, multi-tenancy with complete data isolation, and a modular backend that enables rapid feature development without cross-module coupling.

## 1.1 Design Principles

- **Compliance-First:** Every data mutation is auditable. Metrc integration, tax calculation, purchase limits, and age verification are baked into the core order and inventory flows, not bolted on as afterthoughts.
- **Multi-Tenant Isolation:** All queries are scoped to the tenant (dispensary, company, or organization) via middleware-injected context headers. There is no global data leakage path.
- **Module Independence:** Each of the 43+ backend modules is a self-contained NestJS module with its own service, resolver (or controller), and entity definitions. Modules communicate via EventEmitter2 events, not direct imports.
- **API-First:** The GraphQL schema is the single source of truth. All five frontend applications consume the same API. No frontend has special server-side access.
- **Progressive Enhancement:** Cash payments work out of the box. Stripe, Metrc, SendGrid, and Twilio are optional and gracefully degrade when not configured.

# 2. System Architecture

## 2.1 High-Level Topology

The platform consists of six frontend applications, a single NestJS API server, two data stores (PostgreSQL and Redis), and four optional external service integrations. In production, all components run as Docker containers behind an nginx reverse proxy.

| Component | Technology | Port | Purpose |
|---|---|---|---|
| Storefront | Next.js 15 | :5173 | Customer e-commerce (PWA, i18n EN/ES) |
| Admin Portal | Vite + React | :5174 | Dispensary management |
| Staff Portal | Vite + React | :5175 | Counter operations |
| Kiosk | Vite + React | :5176 | In-store self-service |
| Platform Manager | Vite + React | :5177 | Super admin |
| API | NestJS + GraphQL | :3000 | Backend services |
| Database | PostgreSQL 16 | :5432 | 95+ tables |
| Cache / Queue | Redis 7 | :6379 | BullMQ, sessions |
| Reverse Proxy | nginx | :80/:443 | TLS, rate limiting, gzip, CSP |

## 2.2 Request Flow

Every client request follows the same path:

1. Client sends request to nginx reverse proxy (port 80/443)
2. Nginx applies rate limiting (30r/s API, 5r/m auth per IP), adds security headers, and routes by subdomain
3. Request hits NestJS: SanitizeMiddleware strips XSS vectors, TenantMiddleware extracts `x-dispensary-id` and `x-organization-id` headers
4. JwtAuthGuard validates the Bearer token, RolesGuard checks RBAC permissions
5. RateLimitGuard applies per-endpoint limits (e.g., `@RateLimit(10, 60)` on login)
6. ValidationPipe runs class-validator decorators on input DTOs
7. Resolver or Controller executes business logic via injected Service
8. Service queries PostgreSQL via Drizzle ORM (or TypeORM during migration), reads/writes Redis as needed
9. GlobalExceptionFilter catches all errors: maps TypeORM errors to clean GraphQL responses, sanitizes SQL details in production
10. Response returned to client. If WebSocket events were emitted, Socket.IO broadcasts to relevant rooms.

## 2.3 Multi-Tenant Architecture

The platform uses a shared-database, shared-schema multi-tenancy model with a three-level organizational hierarchy:

- **Organization:** The billing entity. Owns one or more companies. Holds subscription tier, billing status, MRR, Stripe customer ID.
- **Company:** A legal entity under an organization. Owns one or more dispensaries. Enables multi-brand operators.
- **Dispensary:** A physical retail location. All operational data (products, orders, inventory, staff, compliance) is scoped to a dispensary.

Tenant isolation is enforced at two levels. First, the TenantMiddleware extracts dispensary and organization IDs from request headers and attaches them to the request context. Second, every repository query and raw SQL statement includes a WHERE clause filtering by `dispensary_id` or `organization_id`. There is no administrative API that returns cross-tenant data except for the Platform Manager module, which requires the `super_admin` role.

# 3. Backend Architecture

## 3.1 Module Organization

The API is organized into 43+ NestJS modules, each following a consistent pattern: a module file that declares providers and exports, a service file containing all business logic, and a resolver file (GraphQL) or controller file (REST) that handles I/O. Modules are grouped into ten domains:

| Domain | Modules | Key Responsibilities |
|---|---|---|
| Core (7) | Auth (JWT + 2FA/TOTP), Users, Organizations, Companies, Dispensaries, Brands, Manufacturers | JWT auth with 2FA, RBAC, multi-tenant hierarchy, user management |
| Catalog (6) | Products, ProductData (Otreeba), Promotions, Search (Meilisearch + vibe search), Recommendations (AI), Knowledge Base (budtender AI) | Product CRUD with 30+ fields, variants, pricing, Meilisearch FTS, AI recommendations, strain enrichment |
| Commerce (5) | Orders, Payments (Cash), Stripe (webhook retry via BullMQ), CanPay, AeroPay | Order lifecycle with tax engine for all legal states, cash/card/cannabis payments, Stripe intents/webhooks/refunds |
| Inventory (3) | Inventory, InventoryControl, Reorder Suggestions (AI) | Stock tracking, transfers, counts, adjustments, AI-driven reorder alerts |
| Compliance (4) | Metrc, BioTrack, Compliance, Compliance Alerts (CRON) | Metrc + BioTrack sync, manifests, waste, audit log, reconciliation, automated compliance alerts |
| People (7) | Customers (6 auto-segments), Loyalty (4 tiers), Staffing, TimeClock, Scheduling, Notifications (back-in-stock + white-label templates), Marketing Suite (campaigns/automations) | Profiles with segmentation, loyalty/rewards, employees, payroll, shifts, email/SMS, marketing campaigns |
| Operations (3) | Delivery, Fulfillment (zones/slots/tracking), Vendors | Drivers, geo-fenced zones, delivery slots, POs |
| Platform (6) | Platform, Theme (10 presets), Changelog, Image, WebSocket, Health | Tenant admin, 10 CSS themes, changelog, image upload, real-time events, health checks |
| Security (3) | Verification (digital ID/OCR), Webhooks API (HMAC-SHA256), Status | Digital ID verification, outbound webhook delivery, status page |
| Observability (3) | Metrics (Prometheus), Reviews, POS (Dutchie/Treez) | Prometheus metrics, customer reviews & ratings, POS adapters |

## 3.2 Authentication and Authorization

Authentication uses JSON Web Tokens with a dual-token strategy. Access tokens have a configurable TTL (default 15 minutes in production, 24 hours in development). Refresh tokens are stored in the database with a 7-day expiry and are rotated on each refresh. Passwords are hashed with bcrypt (12 rounds). The login flow tracks last login time and user agent/IP for audit purposes.

Authorization is enforced by two guards applied globally via APP_GUARD. The JwtAuthGuard validates the access token on every request. The RolesGuard checks the `@Roles()` decorator on each handler against the user's role from the JWT payload. Six roles are defined in a strict hierarchy:

- **super_admin:** Full platform access. Can manage all tenants, billing, tax rules.
- **org_admin:** Organization-level access. Can manage all dispensaries under their org.
- **dispensary_admin:** Single-dispensary access. Can manage products, orders, staff, compliance.
- **shift_lead:** Operational access. Can manage orders, inventory, clock in/out staff.
- **budtender:** Counter access. Can process orders, look up products, clock in/out.
- **customer:** Storefront access. Can browse, order, manage profile, redeem loyalty.

## 3.3 GraphQL API Design

The API uses a code-first GraphQL schema generated by NestJS/GraphQL with Apollo Server. There are 180+ operations across queries and mutations. The schema is organized by domain — each module's resolver contributes its own types, queries, and mutations to the unified schema.

Key design decisions:

- All IDs use UUID v4. The GraphQL `ID` scalar maps to PostgreSQL `uuid` columns.
- Date/time fields use the GraphQL `Date` scalar mapped to PostgreSQL `timestamptz`.
- JSONB fields (effects, terpenes, gallery_urls, notification preferences) use the `graphql-type-json` scalar.
- Pagination uses limit/offset with a server-enforced maximum of 100 per page.
- Validation uses class-validator decorators on InputType classes: `@IsUUID`, `@IsNotEmpty`, `@IsOptional`, `@Min`, `@ValidateNested`.
- Errors follow a consistent structure: `GraphQLError` with extensions containing code (`UNAUTHENTICATED`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`) and HTTP status.

## 3.4 REST Endpoints

While GraphQL handles the majority of operations, twelve REST endpoints exist for specific use cases where REST is more appropriate:

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/auth/register` | POST | User registration (returns JWT) |
| `/v1/auth/login` | POST | User login (returns access + refresh tokens) |
| `/v1/auth/refresh` | POST | Token refresh |
| `/v1/auth/logout` | POST | Revoke refresh token |
| `/v1/payroll/export` | GET | Payroll CSV download |
| `/v1/reports/sales/csv` | GET | Sales report CSV |
| `/v1/reports/tax/csv` | GET | Tax report CSV |
| `/v1/reports/staff/csv` | GET | Staff performance CSV |
| `/v1/reports/inventory/csv` | GET | Inventory report CSV |
| `/v1/images/product/:id` | POST | Product image upload (multipart) |
| `/v1/images/avatar` | POST | User avatar upload (multipart) |
| `/v1/webhooks/stripe` | POST | Stripe webhook receiver |

## 3.5 Event-Driven Architecture

Cross-module communication uses NestJS EventEmitter2. Modules emit events but never import each other's services directly. This decoupling allows modules to be added or removed without cascading changes.

| Event | Emitted By | Consumed By |
|---|---|---|
| `order.completed` | OrdersService | LoyaltyService (earn points), NotificationService (email/SMS), OrderGateway (WebSocket) |
| `order.status_changed` | OrdersService | NotificationService, OrderGateway (WS broadcast to customer + staff) |
| `order.payment_received` | StripeService | OrdersService (mark paid), OrderGateway (WS) |
| `inventory.low_stock` | InventoryService | OrderGateway (WS to staff), NotificationService |
| `delivery.status_changed` | DeliveryService | OrderGateway (WS to customer + staff) |
| `customer.registered` | AuthService | NotificationService (welcome email), LoyaltyService (signup bonus) |

## 3.6 Background Jobs and CRON

Asynchronous processing uses BullMQ backed by Redis. Three categories of background work:

- **Metrc Sync Queue:** Processes sale receipts, inventory updates, and package labels with exponential backoff (3 retries, 1s/4s/16s delays). Failed jobs are logged to `metrc_sync_logs` for admin review.
- **Stripe Webhook Retry Queue:** Retries failed Stripe webhook processing with exponential backoff via BullMQ.
- **Image Processing Queue:** Thumbnail generation via Sharp (300x300 cover crop to WebP). Falls back to file copy if Sharp is unavailable.
- **Notification Queue:** Email delivery via nodemailer (SendGrid/SMTP) and SMS via Twilio. Graceful degradation if credentials are not configured.
- **Marketing Automation Queue:** Processes campaign sends and automation triggers for the Marketing Suite.

Four CRON jobs run on schedule:

- **Daily 6:00 AM — Metrc Reconciliation:** Compares local inventory against Metrc records, generates reconciliation report, flags discrepancies.
- **Daily 8:00 AM — Birthday Check:** Identifies customers with birthdays today for loyalty bonus eligibility.
- **Hourly — Certification Expiry Check:** Flags employee certifications expiring within 30 days.
- **Scheduled — Compliance Alerts:** Automated compliance alert checks across all tenants (Compliance Alerts CRON module).

# 4. Data Architecture

## 4.1 Database Design

The database uses PostgreSQL 16 with the `uuid-ossp` and `pgcrypto` extensions. Drizzle ORM is the primary ORM (alongside TypeORM during an ongoing migration) with `synchronize: false` — all schema changes are managed through manual SQL migrations. The database contains 95+ tables organized across 15 domains:

| Domain | Tables |
|---|---|
| Core | organizations, companies, dispensaries, users, refresh_tokens |
| Products | products, product_variants, product_pricing, strain_data, lkp_product_types, lkp_product_categories |
| Orders | orders, order_items, payments |
| Inventory | inventory, inventory_transfers, inventory_transfer_items, inventory_counts, inventory_count_items, inventory_adjustments, lkp_adjustment_reasons |
| Compliance | metrc_credentials, metrc_sync_logs, metrc_manifests, metrc_manifest_items, waste_destruction_logs, lkp_waste_types, audit_log, reconciliation_reports, reconciliation_items, lkp_tax_categories |
| Customers | customer_profiles, customer_addresses, age_verifications, purchase_limit_rules |
| Loyalty | loyalty_programs, loyalty_tiers, loyalty_transactions, loyalty_rewards, loyalty_redemptions |
| Staffing | employee_profiles, employee_certifications, performance_reviews, time_entries, lkp_positions, lkp_certification_types |
| Scheduling | shift_templates, scheduled_shifts, shift_swap_requests, time_off_requests |
| Delivery | driver_profiles, delivery_trips, delivery_zones, delivery_time_slots, order_tracking |
| Vendors | vendors, vendor_contacts, purchase_orders, purchase_order_items, vendor_performance |
| Notifications | notification_templates (18 templates), notification_log |
| Platform | subscription_tiers, billing_invoices, platform_activity |
| Theming | lkp_themes (10 themes) |
| POS | pos_integrations, pos_product_mappings, pos_sync_logs |

## 4.2 Key Design Patterns

- **UUID Primary Keys:** All tables use `uuid_generate_v4()` for primary keys. This eliminates sequential ID exposure and enables distributed ID generation.
- **Soft Deletes:** Critical tables (products, users) use a `deleted_at` timestamptz column. Queries filter `WHERE deleted_at IS NULL` by default.
- **Lookup Tables:** 15 lookup tables (prefixed with `lkp_`) hold state-specific reference data: tax categories, product types, positions, certification types, waste types, adjustment reasons, themes. These are seeded at migration time.
- **JSONB Fields:** Used for flexible data like product effects, terpene profiles, notification preferences, gallery image URLs, and platform activity metadata. Avoids unnecessary table proliferation.
- **Audit Trail:** The `audit_log` table records every significant data change with entity type, entity ID, action, user ID, timestamp, and JSONB before/after snapshots.
- **AES-256-CBC Encryption:** Metrc API credentials are encrypted at rest using the `ENCRYPTION_KEY` environment variable. Decryption occurs at runtime only when API calls are made.

## 4.3 Indexing Strategy

Beyond primary key indexes, the following index patterns are applied:

- Composite indexes on `(dispensary_id, created_at)` for time-series queries (orders, inventory, time entries)
- Indexes on foreign keys (`company_id`, `vendor_id`, `user_id`) for join performance
- Partial indexes on status columns for active/pending record queries
- Full-text search index on `products.name` using PostgreSQL tsvector

# 5. Frontend Architecture

## 5.1 Application Matrix

| App | Framework | Port | Users | Key Pages |
|---|---|---|---|---|
| Storefront | Next.js 15 | :5173 | Customers | Home, Products, Detail, Cart, Checkout (Stripe), Order Tracking (WS), Account + Loyalty, Login/Register, Age Verify — PWA, i18n EN/ES, "Botanical Luxury" design |
| Admin Portal | Vite 8 + React 19 | :5174 | Dispensary Admins | Dashboard, Products, Orders, Inventory, InventoryControl, Compliance, Staffing, TimeClock, Scheduling, Reports, Settings/Themes, Vendors, Loyalty, Menu Board, Onboarding Wizard, Changelog (16+ pages) |
| Staff Portal | Vite 8 + React 19 | :5175 | Budtenders | Orders (WS toasts), Fulfillment, Inventory, Lookup, Clock Widget, Barcode Scanner |
| Kiosk | Vite 8 + React 19 | :5176 | Walk-ins | Check-in, Menu, Product, Cart, Checkout, Confirm (15s reset) — PWA, touch-optimized |
| Platform Mgr | Vite 8 + React 19 | :5177 | Super Admin | Dashboard, Tenants, Billing, Tax Config, Reports, Activity, Tenant Management |

## 5.2 State Management

All frontend apps use a consistent state management pattern:

- **Zustand:** Lightweight client-side stores for authentication (JWT token, user profile) and shopping cart. Persisted to localStorage for the auth store; cart is session-only.
- **TanStack Query (React Query):** Server state management with automatic caching, refetching, and optimistic updates. Query keys are structured as `[domain, ...params]` for predictable invalidation.
- **GraphQL Client:** The storefront uses `graphql-request` with public (no auth) and authenticated clients. Admin/staff/kiosk/platform apps use a shared `gqlRequest` helper that auto-injects the JWT token from the auth store.

## 5.3 Real-Time Updates

Two custom hooks provide WebSocket integration:

- **useOrderSocket (Storefront):** Connects on auth, subscribes to individual orders for live tracking. Exposes `connected`, `lastUpdate`, `lastDelivery`, `subscribeToOrder`, `unsubscribeFromOrder`.
- **useStaffSocket (Staff Portal):** Connects on auth, receives new order alerts, inventory warnings, delivery updates, and driver GPS. Feeds the OrderToast component for slide-in notifications with auto-dismiss.

## 5.4 Theming System

The white-label theming system is entirely CSS-driven. Each of the 10 themes (casual, dark, regal, modern, minimal, apothecary, citrus, earthy, midnight, neon) defines 25+ CSS custom properties on a `[data-theme]` attribute selector. Components use utility classes (`bg-t-primary`, `text-t-brand`, `btn-t-primary`, `card-t`) that map to these variables. The storefront's ThemeProvider fetches the dispensary's theme code via the `dispensaryTheme` GraphQL query on mount and sets the `data-theme` attribute on the root HTML element. Admin users select themes via a visual preview grid in Settings.

## 5.5 Design Language — "Botanical Luxury"

All frontend applications share a cohesive "Botanical Luxury" design language:

- **Typography:** DM Sans (body) + Playfair Display (serif headings)
- **Color palette:** Emerald-based with dark hero sections
- **Product cards:** Strain-specific gradient backgrounds (indica = purple, sativa = green, hybrid = amber)
- **Effects/flavors tags** displayed on product cards
- **Dark mode toggle** across all apps

# 6. Compliance Architecture

## 6.1 Metrc Integration

CannaSaas integrates with the Metrc seed-to-sale tracking system used by 20+ states including NY, NJ, CT, CA, CO, MA, MI, OR, and others. The integration is designed for resilience:

- **Credentials:** API keys are encrypted with AES-256-CBC and stored in the `metrc_credentials` table. State-specific base URLs are configured via environment variables.
- **Sync Pipeline:** Sale receipts and inventory updates are queued via BullMQ with exponential backoff (3 retries). Failed syncs are logged with full error details for admin review.
- **Reconciliation:** A daily CRON job at 6 AM fetches Metrc inventory and compares it against local records. Discrepancies are logged to `reconciliation_reports` with item-level detail in `reconciliation_items`.
- **Manifests:** Inter-location transfers generate Metrc-compatible manifests with item-level tracking.
- **Waste Logging:** Destruction events record waste type, weight, witness name, and require approval before inventory is deducted.

## 6.2 State Tax Engine

The tax engine applies state-specific multi-line calculations at checkout:

- **New York:** 9% retail cannabis excise tax + per-milligram THC taxes that vary by product type (flower $0.005/mg, concentrate $0.008/mg, edible $0.03/mg).
- **New Jersey:** 6.625% sales tax + 6% cannabis excise tax + up to 2% municipal transfer tax.
- **Connecticut:** 6.35% sales tax + 3% cannabis excise tax + up to 3% municipal tax.
- **California:** 15% cannabis excise tax + 7.25% state sales tax.
- **Colorado:** 15% state excise tax + 2.9% state sales tax.
- **Massachusetts:** 10.75% excise tax + 6.25% state sales tax.
- And 10+ additional states with pre-configured tax rules.

Tax rules are stored in the `lkp_tax_categories` table with statutory references (e.g., 'NY Tax Law § 493-a'). Platform admins can add, update, or toggle rules and add new states without code changes.

## 6.3 Audit Trail

The `audit_log` table provides a complete compliance audit trail. Every significant data change records: entity type (product, order, inventory, etc.), entity ID, action (create, update, delete), performing user ID, timestamp, and JSONB snapshots of the before and after states. The `entityAuditTrail` query allows administrators to view the complete change history for any record.

# 7. Payment Architecture

## 7.1 Dual Payment Model

CannaSaas supports both cash and card payments, reflecting the reality of the cannabis industry where many customers prefer cash. The payment architecture is:

- **Cash:** Processed locally. The PaymentService records cash tendered and change given. Dispensaries can configure a cash discount (0-20%) to incentivize cash payments and reduce card processing fees.
- **Card (Stripe):** The StripeService creates a PaymentIntent on the server, returns the `clientSecret` to the frontend, which uses Stripe.js to collect card details and confirm the payment. Webhooks handle the asynchronous payment lifecycle.

## 7.2 Stripe Integration Flow

1. Storefront calls `createPaymentIntent` mutation with `orderId` and `amountCents`
2. Server creates Stripe PaymentIntent with `automatic_payment_methods`, saves intent ID to payments table with status 'pending'
3. Server returns `clientSecret` to frontend
4. Frontend calls `stripe.confirmCardPayment(clientSecret)` with card element
5. Stripe processes payment and sends webhook to `POST /v1/webhooks/stripe`
6. Server verifies webhook signature, handles `payment_intent.succeeded` event
7. Server updates payment status to 'succeeded', sets order `paymentStatus` to 'paid'
8. Server emits `order.payment_received` event for WebSocket broadcast

## 7.3 Refunds

The `refundPayment` mutation (admin only) supports full and partial refunds via the Stripe Refunds API. Partial refunds update payment status to 'partially_refunded'; full refunds set it to 'refunded'. The `charge.refunded` webhook handles confirmation.

# 8. Infrastructure and Deployment

## 8.1 Docker Compose Production Stack

The production deployment uses Docker Compose with seven services:

| Service | Image | Configuration |
|---|---|---|
| postgres | postgres:16-alpine | Persistent volume, health check, 127.0.0.1 binding |
| redis | redis:7-alpine | AOF persistence, 256MB LRU, health check |
| api | Custom (multi-stage) | Non-root user, raw body for webhooks, health check |
| storefront | Custom (Next.js standalone) | Non-root user, NEXT_TELEMETRY_DISABLED |
| admin | Custom (Vite → nginx) | SPA fallback, static serving |
| staff | Custom (Vite → nginx) | SPA fallback, static serving |
| nginx | nginx:alpine | Reverse proxy, TLS, rate limiting, security headers |

## 8.2 Security

- **TLS Termination:** nginx handles HTTPS with configurable certificates (Let's Encrypt recommended)
- **Rate Limiting:** nginx applies 30r/s for API, 5r/m for auth endpoints; application-level `@RateLimit` guard for per-endpoint control
- **Security Headers:** X-Frame-Options (SAMEORIGIN for storefront, DENY for admin/staff), X-Content-Type-Options (nosniff), X-XSS-Protection, Referrer-Policy (strict-origin-when-cross-origin)
- **Helmet:** Applied to all responses with relaxed CSP in development, strict in production
- **Input Sanitization:** SanitizeMiddleware strips `<script>`, `<iframe>`, event handlers, and `javascript:` protocol from all POST request bodies
- **GraphQL Security:** Depth limiting (max 10 nested levels), complexity limiting (max 1000 fields) to prevent abuse
- **CSRF Protection:** CSRF tokens required for state-changing operations
- **Request Body Size Limits:** Configurable maximum request body size to prevent denial-of-service
- **CORS:** Explicit origin allowlist for all six frontend ports; credentials enabled for cookie-based refresh
- **Non-Root Containers:** All Docker containers run as dedicated non-root users (cannasaas:1001)
- **Encryption at Rest:** Metrc API credentials encrypted with AES-256-CBC; PostgreSQL volumes can be encrypted at the host level

## 8.3 Monitoring and Health

- Docker health checks on all services (postgres: `pg_isready`, redis: `redis-cli ping`, api: GraphQL introspection query)
- **Prometheus Metrics:** `/metrics` endpoint exposing request counts, latencies, active connections, queue depths, and custom business metrics
- **Redis Caching:** Products, themes, and tax rules cached in Redis with configurable TTLs and cache invalidation on writes
- **Circuit Breakers:** External service calls (Metrc, Stripe, Meilisearch) wrapped in circuit breakers to prevent cascade failures
- **Sentry Error Tracking:** Optional Sentry integration for real-time error monitoring with request ID correlation
- **Structured Logging:** NestJS Logger with log level per module and request IDs for distributed tracing
- Metrc sync logs with success/failure status and retry counts
- Platform activity log for tenant lifecycle events

# 9. Testing Strategy

## 9.1 Test Coverage

The platform has 8 unit test suites (58 tests), 2 integration tests, and a k6 load test.

| Suite | Tests | Coverage |
|---|---|---|
| Unit Test Suites | 8 suites, 58 tests | Service logic, POS adapters, payment calculations, validation helpers |
| Integration Tests | 2 | Order flow end-to-end, GraphQL schema contract validation |
| Load Tests | 1 (k6) | API throughput and latency under load |

## 9.2 Test Infrastructure

- **Framework:** Jest with ts-jest for TypeScript compilation, Supertest for HTTP assertions
- **Configuration:** Separate `jest-e2e.config.js` with `--runInBand` (sequential execution) and `--forceExit` (cleanup)
- **Setup:** Shared `test-helper.ts` creates a properly configured NestJS application with versioning, validation pipes, exception filters, and tenant context headers
- **Data:** Tests run against the development database with seeded data (3 tenants, 5 dispensaries, 10+ products, 5 customers, 5 vendors)

# 10. Technology Stack

## 10.1 Backend

| Technology | Purpose |
|---|---|
| NestJS 11 (Node.js 20) | Modular backend framework with decorator-based DI |
| GraphQL (Apollo Server) | API layer — 180+ operations, code-first schema |
| PostgreSQL 16 | Primary database — UUID, JSONB, FTS, pgcrypto extensions |
| Drizzle ORM | Primary ORM — schema definitions, migrations (TypeORM retained during migration) |
| Redis 7 | Cache (products, themes, tax rules), session store, BullMQ job queue backing |
| Meilisearch | Full-text search engine with vibe search (semantic similarity) |
| Prometheus | Metrics collection and export for observability |
| BullMQ | Async job processing — Metrc sync, image processing, notifications |
| Socket.IO | Real-time WebSocket — order updates, driver GPS, inventory alerts |
| Stripe SDK | Payment processing — intents, webhooks, refunds |
| Sharp | Image processing — thumbnail generation (300x300, WebP) |
| Passport.js + JWT | Authentication strategy |
| class-validator | Input validation decorators |
| Helmet | HTTP security headers |
| nodemailer + Twilio | Email (SendGrid/SMTP) and SMS delivery |

## 10.2 Frontend

| Technology | Purpose |
|---|---|
| Next.js 15 | Storefront — SSR, app router, SEO optimization, PWA, i18n (EN/ES) |
| Vite 8 | Admin, Staff, Kiosk, Platform — fast SPA bundling |
| React 19 | Component framework across all apps |
| TypeScript 5.8 + @typescript/native-preview | Type safety across all frontend code (with tsgo for fast checking) |
| Tailwind CSS v4 + @tailwindcss/postcss | Utility-first styling with theme integration, "Botanical Luxury" design |
| Zustand | Client-side state (auth, cart stores) |
| TanStack Query | Server state management, caching, mutations |
| React Router 6 | SPA routing for admin, staff, kiosk, platform |
| Lucide React | Icon library — consistent across all apps |
| Socket.IO Client | Real-time updates in storefront and staff portal |
| graphql-request | Lightweight GraphQL client |

## 10.3 Infrastructure

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization and orchestration (7 services) |
| nginx | Reverse proxy, TLS termination, rate limiting, static serving |
| pnpm | Package management (fast, disk-efficient) |
| Turborepo | Monorepo build orchestration |
| Jest + Supertest | Testing framework for unit and E2E tests |
| k6 | Load testing framework |
| Husky + commitlint + lint-staged | Git hooks for code quality enforcement |
| GitHub Actions | CI/CD with staging deployment |
| Sentry | Error tracking (optional) |

# Appendix A: Environment Variables

The API is configured entirely through environment variables. A documented `.env.template` is provided.

| Variable | Description |
|---|---|
| `NODE_ENV` | development \| production |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets (64-byte hex) |
| `ENCRYPTION_KEY` | AES-256 key for Metrc credentials (32-byte hex) |
| `STRIPE_SECRET_KEY` | Stripe API key (sk_test_ or sk_live_) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `METRC_INTEGRATOR_API_KEY` | Metrc integrator key |
| `METRC_BASE_URL` | Metrc API base URL template (uses `{state}` placeholder, replaced at runtime) |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email delivery credentials |
| `TWILIO_SID` / `TWILIO_AUTH_TOKEN` | SMS delivery credentials |

# Appendix B: Seeded Test Data

The development database is pre-seeded with realistic data for multiple states:

- 3 organizations: Green Leaf Holdings (NY, Professional), Garden State Wellness (NJ, Enterprise), Constitution Cannabis (CT, Starter/Trial)
- 5 dispensaries across multiple states with distinct license numbers
- 10+ products with variants, pricing, THC/CBD levels, strain types, effects, and terpene profiles
- 5 customer accounts with addresses, loyalty points, and order history
- 5 vendors with contacts and sample purchase orders
- 15 lookup tables seeded with state-specific regulatory values
- 18 notification templates covering the full order and employee lifecycle
- 10 CSS themes with complete variable definitions
- 4 loyalty tiers and 5 reward catalog items
- Admin credentials: admin@greenleaf.com / Admin123!
