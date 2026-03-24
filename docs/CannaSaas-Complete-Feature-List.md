# CannaSaas — GreenStack Platform

## Complete Feature List

**March 2026 | v1.0 | Confidential**

| Metric | Value |
|---|---|
| Backend Modules | 33 |
| Database Tables | 95+ |
| GraphQL Operations | 180+ |
| REST Endpoints | 12 |
| Frontend Applications | 5 |
| E2E Tests | 32 |
| Unit Tests | 42 |
| CSS Themes | 10 |
| Seeded Vendors | 5 |
| Loyalty Rewards | 5 |
| Subscription Tiers | 3 ($299 / $499 / $799) |
| Target Markets | All US states with legal cannabis programs (38+ states) |

---

# 1. Frontend Applications

## 1.1 Customer Storefront (Next.js — port 5173)

- Home page with featured products and dispensary branding
- Products listing with full-text search, strain filters (indica/sativa/hybrid), THC/CBD display
- Product detail page with variant selection, effects, terpenes, add to cart
- Shopping cart with quantity controls, line item management, subtotal
- Checkout with fulfillment toggle (pickup/delivery), payment method (cash/card)
- Stripe PaymentIntent integration — `createPaymentIntent`, `clientSecret` flow
- Order tracking page with live WebSocket progress bar (Confirmed → Preparing → Ready → Delivered)
- Customer registration and login (JWT authentication)
- Account page with profile stats, addresses, order history
- Age verification page (21+, ID type, state, DOB)
- Loyalty card — points balance, tier badge, progress to next tier, available rewards
- Theme provider — loads tenant CSS theme on init
- WCAG 2.1 AA compliant, responsive design

## 1.2 Admin Portal (Vite + React — port 5174)

- Dashboard with revenue, orders, product mix KPIs
- Products management with search and filtering
- Orders management with status tracking
- Inventory overview with stock levels and alerts
- Inventory control — transfers, counts, adjustments, health dashboard
- Compliance monitoring with audit trail viewer
- Staffing — employee roster, certification tracking, compliance KPIs
- Time clock — active clocks with 30-second refresh, payroll report, CSV export
- Scheduling — weekly grid, publish shifts, drivers, time-off request management
- Reports — tabbed view (Sales/Tax/Staff/Inventory), date range filters, CSV downloads
- Settings — theme selector with 10 visual previews, custom CSS editor
- Vendor management — vendor table with KPIs, create form, purchase order viewer
- Loyalty admin — member stats, tier breakdown, rewards catalog, create new rewards
- Image upload component — drag-and-drop product photo upload with preview

## 1.3 Staff Portal (Vite + React — port 5175)

- Order queue with Kanban-style lanes
- Fulfillment zone management
- Inventory lookup and stock alert banners
- Product search for customer assistance
- Clock-in/out widget in header — green pulse when active, live HH:MM elapsed timer
- Real-time WebSocket toast notifications — new orders, low stock, delivery updates
- Connection status indicator (Live/Disconnected)
- Slide-in animation with auto-dismiss after 8 seconds

## 1.4 Self-Service Kiosk (Vite + React — port 5176)

- Full-screen layout optimized for tablets and touch screens
- Product grid with category filters (Flower, Edible, Vape, Pre-Roll, Concentrate)
- Quick-add buttons with 1.5-second confirmation feedback
- Product detail with variant selection, THC/CBD, effects display
- Cart with inline quantity controls
- Checkout — name entry for pickup, `createOrder` mutation
- Order confirmation with 15-second auto-reset to menu
- Anti-zoom, no text selection, overscroll prevention (kiosk lockdown)
- Large touch targets (48px+ height) throughout

## 1.5 Platform Manager (Vite + React — port 5177)

- Dark sidebar layout with 6 pages
- Dashboard — MRR/ARR, tenant counts (active/trial/suspended), locations, users, orders/GMV, tier breakdown
- Tenants — full roster with metrics, create new tenant (auto-scaffolds org+company+dispensary), change tier, suspend
- Billing — invoice history table with payment status
- Tax configuration — rules grouped by state, add new rules/states, toggle active/inactive
- Reports — tenant health table, churn rate calculation
- Activity — color-coded event feed (onboards, payments, suspensions, config changes)
- Super admin auth gate (role check on login)

# 2. Backend Modules (33 Total)

## 2.1 Core Infrastructure

### Authentication & Authorization

- JWT access tokens (configurable TTL, default 15 min) + refresh tokens (7 days)
- Role-based access control: super_admin, org_admin, dispensary_admin, shift_lead, budtender, customer
- Registration with email validation and password strength check (8+ chars)
- Login with last-login tracking, refresh token rotation
- Logout and logout-all (revoke all refresh tokens)
- Rate limiting on auth endpoints: 10 login/min, 5 register/5min per IP

### Multi-Tenant Architecture

- Three-level hierarchy: Organizations → Companies → Dispensaries
- Subdomain-based tenant resolution
- Tenant context headers (`x-dispensary-id`, `x-organization-id`) on all requests
- Data isolation at query level — all queries scoped to tenant

### Users & Roles

- User CRUD with role assignment
- Users scoped to organization and dispensary
- Email verified flag, password change tracking

## 2.2 Product & Catalog

### Products

- Full product CRUD with 30+ fields (name, description, SKU, strain, THC/CBD, effects, terpenes, lineage)
- Product variants with barcode, SKU, sort order
- Product pricing with variant-level retail/wholesale/medical prices
- Full-text search with PostgreSQL tsvector
- Autocomplete search endpoint
- Product type and category lookup tables
- Metrc item UID and package label tracking
- Compliance fields: child-resistant packaging, tamper-evident, no minor appeals
- Image URL, thumbnail URL, and gallery URLs (JSONB) per product

### Brands & Manufacturers

- Brand directory with logo and description
- Manufacturer directory linked to products

### Strain Data (Otreeba Integration)

- Strain enrichment from Otreeba API
- Cached strain data with effects, flavors, terpene profiles
- OCPC (Open Cannabis Product Code) tracking

## 2.3 Orders & Payments

### Orders

- Full order lifecycle: pending → confirmed → preparing → ready → out_for_delivery → delivered/picked_up → completed
- Line items with product + variant + quantity
- Tax calculation with state-specific engines (NY, NJ, CT, CA, CO, MA, IL, MI, AZ, WA, OR, NV, FL, and more)
- Order type: pickup or delivery
- Customer user ID linking for order history
- Order notes field

### Payments (Cash)

- Cash payment processing with tendered/change calculation
- Cash discount configuration per dispensary (0-20%)
- Cash discount preview endpoint
- Cash delivery toggle

### Stripe Integration

- Payment intent creation with automatic payment methods
- Server-side payment confirmation
- Webhook handler (`POST /v1/webhooks/stripe`) with signature verification
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- Full and partial refund support
- Payment status query per order
- Stripe enabled/disabled check query
- Auto-updates order payment status on webhook
- Graceful fallback when Stripe not configured (cash-only mode)

## 2.4 Inventory

### Inventory Tracking

- Real-time stock tracking per variant per dispensary
- Quantity on hand, quantity available, quantity reserved
- Reorder thresholds with low stock alerts
- Inventory overview query with total SKUs, units, value
- Dead stock detection
- Expiring inventory tracking

### Inventory Control

- Inter-dispensary transfers: request → approve → ship → receive lifecycle
- Transfer items with variant-level tracking
- Physical inventory counts with item-level entry
- Variance reporting (expected vs actual with auto-adjustment)
- Inventory adjustments with 10 reason codes and approval workflow
- Adjustment reasons lookup table

## 2.5 Compliance & Regulatory

### Metrc Integration

- API credential management with AES-256-CBC encryption
- Dynamic state-specific Metrc base URL resolution for all Metrc-integrated states
- Sandbox mode toggle
- Sync retry queues with BullMQ and exponential backoff
- Metrc sync overview and failed sync queries
- Product UID tagging (individual and bulk)
- Metrc item category mapping

### Compliance Suite

- Metrc manifest generation for inter-location transfers
- Manifest items tracking
- Waste and destruction logging with witness name, approval workflow, inventory deduction
- Waste type lookup table
- Daily automated reconciliation: local inventory vs Metrc records (6 AM CRON)
- Reconciliation reports with item-level discrepancies
- Full audit logging: entity type, action, user, timestamp, JSONB before/after changes
- Entity-level audit trail query
- Metrc compliance report
- pgcrypto extension for encryption

### State Tax Engine

- **NY:** 9% retail cannabis excise + per-mg THC taxes (flower $0.005, concentrate $0.008, edible $0.03)
- **NJ:** 6.625% sales tax + 6% cannabis excise + up to 2% municipal tax
- **CT:** 6.35% sales tax + 3% cannabis excise + up to 3% municipal tax
- **CA:** 15% cannabis excise + 7.25% state sales tax
- **CO:** 15% state excise + 2.9% state sales tax
- **MA:** 10.75% excise + 6.25% state sales tax
- And 10+ additional states with pre-configured tax rules
- Tax category lookup table with statutory references
- Tax report with line-item breakdown and CSV export
- Platform admin: add/update/toggle tax rules, add new states

### Purchase Limit Enforcement

- State-mandated limits by product category (flower, concentrate, edible)
- Per-transaction and rolling-period tracking
- Medical patient allowances for applicable states (NJ, FL, etc.)
- Purchase limit check query at checkout

### Age Verification

- 21+ gate with date of birth, ID type, state tracking
- Verification history per customer
- Customer profile age verification status

## 2.6 Customer Management

### Customer Profiles

- Customer profile CRUD with loyalty points, total orders, total spent
- Preferred dispensary tracking
- Medical patient designation
- Notification preferences (email/SMS per category)
- Date of birth for age verification and birthday rewards

### Customer Addresses

- Multiple saved addresses per customer
- Address type (home/work/other), delivery instructions
- Default address flag

### Customer Loyalty & Rewards

- Configurable program per dispensary: points per dollar, signup/review/referral bonuses
- 4 tiers: Bronze (1x), Silver (1.25x at 500 pts), Gold (1.5x at 1500 pts), Platinum (2x at 5000 pts)
- Automatic tier upgrade based on lifetime points
- Points multiplier by tier on every purchase
- Rewards catalog with 5 reward types: discount_percent, discount_fixed, free_item, free_delivery
- Reward redemption with balance check and max redemption limits
- Birthday bonus: 200 points + 15% discount within 7-day window, once per year
- Daily 8 AM CRON birthday check
- Full point transaction ledger with balance tracking
- Admin: loyalty stats, tier breakdown, create rewards, manually give points
- Event-driven: auto-earn points on `order.completed` with tier multiplier

## 2.7 Staffing & HR

### Employee Management

- Employee profiles with 11 position types
- Certification tracking with type, issue date, expiry date
- Auto-expiry alerts for expiring certifications
- Performance reviews
- Staff compliance overview query

### Time Clock & Payroll

- Clock-in/out with dispensary scope
- Active clocks query with elapsed time
- Clock status query per user
- Overtime calculation (1.5x over 40 hours/week)
- Exempt employee handling
- Payroll report with CSV export (`GET /v1/payroll/export`)
- Time entries query by date range

### Scheduling

- Shift templates for recurring weekly patterns
- Auto-generate schedules from templates
- Weekly schedule view by dispensary
- Coverage gap detection (minimum staff vs assigned)
- Shift swap requests: request → claim → approve workflow
- Time-off requests: PTO, sick, personal leave types
- Publish week with one click

## 2.8 Delivery & Fulfillment

### Delivery Management

- Driver profiles with vehicle type, license, insurance, GPS tracking flag
- Delivery trip lifecycle: assigned → picked_up → in_transit → delivered
- Trip distance and ETA tracking
- Customer ratings per delivery
- Driver performance stats (average time, rating, miles)
- Real-time driver GPS broadcasting via WebSocket

### Fulfillment

- Delivery zones with geo-fencing
- Delivery time slots with capacity management
- Delivery eligibility check (address + minimum order)
- Order tracking with real-time status updates

## 2.9 Vendor Management

- Vendor directory with 5 types: cultivator, manufacturer, distributor, packaging, other
- License tracking with state, number, and expiry date
- Vendor contacts with primary contact flag
- Payment terms: net_15, net_30, net_45
- Vendor rating and performance tracking
- Purchase orders: full lifecycle (draft → submitted → approved → shipped → received → closed)
- PO line items with variant linking, SKU, quantity ordered/received, unit cost
- Auto-inventory update on PO receipt (received status)
- PO number auto-generation
- Vendor stats: active vendors, total/open POs, total spend, outstanding balance

## 2.10 Notifications

- Email via SendGrid/SMTP with nodemailer
- SMS via Twilio (graceful fallback if not configured)
- 18 notification templates: order lifecycle, welcome, cert expiry, low stock, etc.
- Template engine with `{{var}}` and `{{#if}}` conditional blocks
- Event-driven: `order.completed`, `order.status_changed`, `customer.registered`
- Customer notification preferences (email/SMS toggles per category)
- Notification log with delivery status tracking
- Admin: send test, view stats

## 2.11 Reporting & Analytics

### Reports (7 GraphQL + 4 CSV)

- Sales summary: total revenue, orders, average order value, cash vs card breakdown
- Sales by day: daily revenue and order count
- Sales by product: per-product revenue and quantity sold
- Sales by hour: hourly traffic patterns
- Tax report: state-specific breakdown with statutory references
- Labor cost report: staff cost with percentage of revenue
- Shrinkage report: loss by reason code with estimated value
- CSV exports: `GET /v1/reports/sales/csv`, `/tax/csv`, `/staff/csv`, `/inventory/csv`

### Analytics Dashboard

- 8 parallel dashboard queries for fast loading
- Revenue, orders, product mix KPIs
- Top products by volume and revenue
- Sales overview and sales trend
- Period comparisons

## 2.12 POS Integration

- Adapter architecture for Dutchie and Treez POS systems
- Product mapping between CannaSaas and POS catalogs
- Sync logging with status tracking
- Extensible for additional POS providers

## 2.13 Platform Administration

### Platform Manager (super_admin)

- Platform dashboard: MRR/ARR, tenant counts by status, user/order/GMV stats, tier breakdown
- Tenant CRUD: create (auto-scaffolds org+company+dispensary), update tier/status, suspend with reason
- Subscription tiers: Starter ($299), Professional ($499), Enterprise ($799) with feature gating
- Billing invoices table with payment status tracking
- Revenue by month query
- Platform activity log: tenant onboards, payments, suspensions, config changes
- Platform report: tenant health table, churn rate calculation

### Tax Administration

- View all tax rules grouped by state
- Add new tax rules with rate, basis, statutory reference
- Toggle rules active/inactive
- Add new states

## 2.14 White-Label Theming

- 10 pre-built CSS themes: default, dark, earth, purple, minimal, luxury, ocean, sunset, forest, neon
- CSS custom properties define all visual tokens (25+ variables per theme)
- `data-theme` attribute on root HTML element switches themes instantly
- HTML structure never changes — CSS-only theming
- Custom CSS override per tenant
- Logo URL and brand name per dispensary
- 30+ utility classes: `bg-t-primary`, `text-t-brand`, `btn-t-primary`, `card-t`, `input-t`, etc.
- Theme selector in admin settings with visual mini-previews
- Dark theme scrollbar styling

## 2.15 Real-Time (WebSocket)

- JWT-authenticated WebSocket connections via Socket.IO
- Auto-join rooms: `user:{id}`, `dispensary:{id}`, `staff:{id}`
- Per-order subscription: `subscribe:order` / `unsubscribe:order`
- Driver GPS location broadcasting to staff room
- Event broadcasts: `order.new`, `order.update`, `inventory.alert`, `delivery.update`
- Ping/pong keepalive
- Connected users query for admin

## 2.16 Image Management

- Product image upload: `POST /v1/images/product/:id`
- Gallery images: `POST /v1/images/product/:id/gallery` (JSONB array)
- Avatar upload: `POST /v1/images/avatar`
- Image deletion with file cleanup: `DELETE /v1/images/product/:id`
- Sharp thumbnail generation (300x300 cover crop, WebP)
- Static file serving at `/uploads/`
- 5MB max, JPEG/PNG/WebP validation
- Local file storage (dev), S3-ready (prod via `UPLOAD_DIR` env)

# 3. Infrastructure & DevOps

## 3.1 Production Deployment

- Docker Compose production stack: 7 services (postgres, redis, api, storefront, admin, staff, nginx)
- Multi-stage Dockerfiles: NestJS API, Next.js standalone, Vite → nginx static
- Nginx reverse proxy with subdomain routing
- Rate limiting: 30 requests/second API, 5 requests/minute auth (per IP)
- Security headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- WebSocket proxying via nginx
- Health checks on all services
- Non-root containers
- All internal ports bound to 127.0.0.1 except nginx
- PostgreSQL 16 with persistent volume
- Redis 7 with AOF persistence and 256MB LRU eviction

## 3.2 Development Environment

- Docker Compose dev: postgres + redis only
- `.env.development` with all config vars and dev defaults
- `.env.template` with documented production config
- pnpm monorepo with Turborepo
- TypeORM with `synchronize: false` and manual migrations
- Swagger API docs at `/docs` (dev only)

## 3.3 Error Handling & Security

- Enhanced global exception filter: maps TypeORM errors to clean GraphQL responses
- Production mode: sanitizes SQL details, strips stack traces
- Duplicate key → 409 Conflict, FK violation → 400 Bad Request, not-null → 400
- Validation helpers: `validateUUID`, `validateDateString`, `validateEmail`, `ensureFound`
- In-memory rate limit guard with `@RateLimit` decorator
- Input sanitization middleware: strips `<script>`, `<iframe>`, event handlers, `javascript:` protocol
- Helmet security headers (relaxed CSP in dev, strict in prod)
- Cookie parser + compression

## 3.4 Testing

- 74 total tests: 32 E2E + 42 unit tests
- E2E suite: auth (4), products (5), orders (3), platform (20 across 8 modules)
- Shared test helper with proper NestJS setup (versioning, validation, filters, tenant headers)
- Tests run against real database with seeded data
- `jest-e2e.config.js` with `--runInBand --forceExit`

# 4. Database (95+ Tables)

Key tables organized by domain:

- **Core:** organizations, companies, dispensaries, users, refresh_tokens
- **Products:** products, product_variants, product_pricing, strain_data, lkp_product_types, lkp_product_categories
- **Orders:** orders, order_items, payments
- **Inventory:** inventory, inventory_transfers, inventory_transfer_items, inventory_counts, inventory_count_items, inventory_adjustments, lkp_adjustment_reasons
- **Compliance:** metrc_credentials, metrc_sync_logs, metrc_manifests, metrc_manifest_items, waste_destruction_logs, lkp_waste_types, audit_log, reconciliation_reports, reconciliation_items, lkp_tax_categories
- **Customers:** customer_profiles, customer_addresses, age_verifications, purchase_limit_rules
- **Loyalty:** loyalty_programs, loyalty_tiers, loyalty_transactions, loyalty_rewards, loyalty_redemptions
- **Staffing:** employee_profiles, employee_certifications, performance_reviews, time_entries, lkp_positions, lkp_certification_types
- **Scheduling:** shift_templates, scheduled_shifts, shift_swap_requests, time_off_requests
- **Delivery:** driver_profiles, delivery_trips, delivery_zones, delivery_time_slots, order_tracking
- **Vendors:** vendors, vendor_contacts, purchase_orders, purchase_order_items, vendor_performance
- **Notifications:** notification_templates, notification_log
- **Platform:** subscription_tiers, billing_invoices, platform_activity
- **Theming:** lkp_themes
- **POS:** pos_integrations, pos_product_mappings, pos_sync_logs
- **Brands:** brands, manufacturers, promotions

# 5. Technology Stack

## Backend

- **NestJS 10 (Node.js 20)** — modular, decorator-based framework
- **GraphQL (Apollo Server)** — 180+ operations, code-first schema
- **PostgreSQL 16** — primary database with UUID, JSONB, FTS, pgcrypto
- **TypeORM 0.3** — entity mapping, migrations, repository pattern
- **Redis 7** — caching, BullMQ job queues, session store
- **BullMQ** — async job processing (Metrc sync, image processing, notifications)
- **Socket.IO** — real-time WebSocket communication
- **Stripe SDK** — payment processing
- **Sharp** — image resizing and thumbnail generation
- **Passport.js + JWT** — authentication strategy
- **class-validator + class-transformer** — input validation
- **Helmet** — security headers
- **nodemailer** — email delivery (SendGrid/SMTP)

## Frontend

- **Next.js 14** — storefront (SSR, app router)
- **Vite 6** — admin, staff, kiosk, platform (SPA)
- **React 18** — component framework
- **TypeScript** — type safety across all apps
- **Tailwind CSS 3** — utility-first styling
- **Zustand** — lightweight state management (auth, cart stores)
- **TanStack Query (React Query)** — server state, caching, mutations
- **React Router 6** — SPA routing (admin, staff, kiosk, platform)
- **Lucide React** — icon library
- **Socket.IO Client** — real-time updates
- **graphql-request** — GraphQL client

## Infrastructure

- **Docker + Docker Compose** — containerization
- **Nginx** — reverse proxy, rate limiting, static serving
- **pnpm** — package management
- **Turborepo** — monorepo build orchestration
- **Jest + Supertest** — testing framework
- **ts-jest** — TypeScript test compilation
