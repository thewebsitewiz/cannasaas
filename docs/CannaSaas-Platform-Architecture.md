# CannaSaas — GreenStack Platform

## Platform Architecture

**33 Modules · 95+ Tables · 180+ API Operations · 5 Frontend Apps · 10 Themes**

**March 2026 | Confidential**

---

## Table of Contents

# 1. System Architecture

The CannaSaas platform consists of five frontend applications communicating through an nginx reverse proxy to a NestJS API server, backed by PostgreSQL and Redis, with optional integrations to Stripe, Metrc, SendGrid, and Twilio.

## 1.1 Component Overview

| Component | Technology | Port | Purpose |
|---|---|---|---|
| Storefront | Next.js 14 | :5173 | Customer e-commerce — browse, cart, checkout, order tracking |
| Admin Portal | Vite + React | :5174 | Dispensary management — products, orders, staff, compliance, vendors, loyalty |
| Staff Portal | Vite + React | :5175 | Counter operations — order queue, fulfillment, inventory, clock-in/out |
| Kiosk | Vite + React | :5176 | In-store self-service — touch-optimized menu, cart, checkout |
| Platform Manager | Vite + React | :5177 | Super admin — tenant management, billing, tax config, reports |
| API Server | NestJS + GraphQL | :3000 | 180+ GraphQL operations, 12 REST endpoints, WebSocket |
| Database | PostgreSQL 16 | :5432 | 95+ tables with UUID, JSONB, FTS, pgcrypto |
| Cache / Queue | Redis 7 | :6379 | BullMQ job queues, caching, session store |
| Reverse Proxy | nginx | :80/:443 | TLS termination, rate limiting, security headers, subdomain routing |

## 1.2 Request Flow

Every request follows this path through the system.

## 1.3 External Service Integrations

| Service | Purpose | Graceful Degradation |
|---|---|---|
| Stripe | Card payments — intents, webhooks, refunds | Falls back to cash-only if not configured |
| Metrc | Seed-to-sale compliance tracking (NY/NJ/CT) | Local-only mode; sync queued for later |
| SendGrid / SMTP | Email notifications (18 templates) | Logs to console if not configured |
| Twilio | SMS notifications | Skipped silently if not configured |

# 2. Backend Modules (33)

The API is organized into 33 NestJS modules grouped across eight domains. Each module is self-contained with its own service, resolver/controller, and entity definitions. Cross-module communication uses EventEmitter2 events.

| Domain | Modules | Key Capabilities |
|---|---|---|
| Core (6) | Auth, Users, Organizations, Companies, Dispensaries, Brands | JWT + RBAC (6 roles), multi-tenant hierarchy, user management |
| Catalog (4) | Products, Manufacturers, Promotions, ProductData | 30+ product fields, variants, pricing, FTS, Otreeba strain enrichment |
| Commerce (3) | Orders, Payments, Stripe | Full order lifecycle, cash discount, Stripe intents/webhooks/refunds |
| Inventory (2) | Inventory, InventoryControl | Stock tracking, transfers, counts, adjustments, reorder alerts, dead stock |
| Compliance (3) | Metrc, Compliance, Reporting | Metrc sync + BullMQ retry, manifests, waste, audit log, reconciliation, 7 reports + 4 CSV |
| People (6) | Customers, Loyalty, Staffing, TimeClock, Scheduling, Notifications | Profiles, 4-tier loyalty, employees/certs, payroll, shifts/swaps, email/SMS |
| Operations (5) | Delivery, Fulfillment, Vendors, POS, Analytics | Drivers + GPS, geo-fencing, vendor directory + PO lifecycle, Dutchie/Treez adapters, KPIs |
| Platform (4) | Platform, Theme, Image, WebSocket | Tenant admin + billing, 10 CSS themes, image upload/thumbnails, real-time events |

## 2.1 Module Interactions

Modules communicate through events, not direct service imports:

- **`order.completed`** → LoyaltyService (earn points), NotificationService (email/SMS), OrderGateway (WebSocket broadcast)
- **`order.status_changed`** → NotificationService, OrderGateway (broadcast to customer + staff rooms)
- **`order.payment_received`** → OrdersService (mark paid), OrderGateway (WebSocket)
- **`inventory.low_stock`** → OrderGateway (staff alert), NotificationService
- **`delivery.status_changed`** → OrderGateway (customer + staff rooms)
- **`customer.registered`** → NotificationService (welcome email), LoyaltyService (signup bonus)

# 3. Multi-Tenant Hierarchy

The platform uses a shared-database, shared-schema multi-tenancy model with a three-level organizational hierarchy. All operational data is scoped to a dispensary. Tenant isolation is enforced by middleware-injected context headers on every request.

## 3.1 Hierarchy

Platform (super_admin) manages all tenants:

### Green Leaf Holdings — Professional Tier

- **Company:** Green Leaf LLC
- **Dispensary:** Tappan, NY (license: NY-DIS-2024-0001)
- **Data:** products, orders, inventory, staff, Metrc credentials, loyalty, vendors

### Garden State Wellness — Enterprise Tier

- **Company:** Garden State LLC
- **Dispensary:** Newark, NJ (license: NJ-DIS-2024-0001)
- **Dispensary:** Hoboken, NJ (license: NJ-DIS-2024-0002)

### Constitution Cannabis — Starter Tier (Trial)

- **Company:** Constitution LLC
- **Dispensary:** Hartford, CT (license: CT-DIS-2024-0001)

## 3.2 Role-Based Access Control

| Role | Access Scope |
|---|---|
| super_admin | Full platform: all tenants, billing, tax rules, platform reports |
| org_admin | All dispensaries within their organization |
| dispensary_admin | Single dispensary: products, orders, staff, compliance, settings |
| shift_lead | Orders, inventory, clock staff in/out |
| budtender | Process orders, product lookup, clock in/out |
| customer | Storefront: browse, order, profile, loyalty, order tracking |

# 4. Order Lifecycle

Orders follow a state machine with defined transitions. Each transition triggers events consumed by notifications, loyalty, and WebSocket modules.

## 4.1 State Transitions

| From | To | Trigger |
|---|---|---|
| (new) | pending | Customer places order via storefront, kiosk, or staff |
| pending | confirmed | Payment received (cash accepted or Stripe webhook) |
| confirmed | preparing | Staff begins order preparation |
| preparing | ready | Order packed and ready |
| ready | picked_up | Customer picks up at counter |
| ready | out_for_delivery | Driver assigned for delivery |
| out_for_delivery | delivered | Driver confirms delivery |
| picked_up / delivered | completed | Auto-close after fulfillment |
| pending / confirmed | cancelled | Customer or admin cancels |

## 4.2 Events Emitted

- **`order.completed`** → Earn loyalty points (with tier multiplier), send confirmation email/SMS, WebSocket broadcast to staff + customer
- **`order.status_changed`** → Notify customer of status change, update staff order queue via WebSocket
- **`order.payment_received`** → Mark order as paid, broadcast to customer for real-time tracking

# 5. Payment Flow (Stripe)

The platform supports dual payment methods: cash (processed locally with optional discount) and card (processed via Stripe). The Stripe integration follows the PaymentIntent pattern for PCI compliance.

## 5.1 Card Payment Sequence

The 8-step card payment flow.

## 5.2 Cash Payment

- Cash tendered and change calculated at point of sale
- Configurable cash discount per dispensary (0-20%) to incentivize cash payments
- Cash discount preview endpoint for checkout display
- Cash delivery toggle per dispensary

## 5.3 Refunds

- `refundPayment` mutation (admin only) supports full and partial refunds via Stripe Refunds API
- Partial refunds set status to 'partially_refunded'; full refunds set 'refunded'
- `charge.refunded` webhook handles asynchronous confirmation

# 6. Purchase Order Lifecycle

The vendor management module supports a full purchase order lifecycle from draft to closure, with automatic inventory updates on receipt.

## 6.1 PO State Machine

| From | To | Action |
|---|---|---|
| (new) | draft | Admin creates PO, selects vendor, adds line items |
| draft | submitted | Submit to vendor for fulfillment |
| submitted | approved | Manager reviews and approves |
| approved | shipped | Vendor confirms shipment |
| shipped | received | Warehouse confirms receipt → auto-updates inventory |
| received | closed | PO finalized, vendor performance logged |
| draft/submitted/approved | cancelled | Cancel at any pre-ship stage |

## 6.2 Auto-Inventory Update

When a PO transitions to 'received' status, the system automatically updates inventory for all line items that have a linked `variant_id`. Quantity on hand and quantity available are incremented by the received quantity. This eliminates manual inventory entry for vendor shipments.

# 7. Loyalty Tier Progression

The loyalty program is configurable per dispensary with four tiers, automatic point earning on purchases, birthday bonuses, and a rewards catalog.

## 7.1 Tier Structure

| Tier | Min Points | Multiplier | Perks |
|---|---|---|---|
| Bronze | 0 | 1.0x | Earn 1 point per $1 spent |
| Silver | 500 | 1.25x | 1.25 pts/$1 + free delivery |
| Gold | 1,500 | 1.5x | 1.5 pts/$1 + free delivery + early access to new products |
| Platinum | 5,000 | 2.0x | 2 pts/$1 + free delivery + early access + exclusive deals |

## 7.2 Earning Mechanics

- **Purchase:** Base points = order total x points_per_dollar (default 1.0) x tier multiplier
- **Signup bonus:** 50 points on registration
- **Review bonus:** 25 points per product review
- **Referral bonus:** 100 points per successful referral
- **Birthday bonus:** 200 points + 15% discount within 7-day birthday window (once per year)
- **Manual:** Admin/budtender can grant points via `givePoints` mutation

## 7.3 Rewards Catalog (5 seeded)

- $5 Off Your Order — 500 points
- 10% Off Your Order — 800 points
- Free Pre-Roll — 300 points
- 20% Off Your Order — 1,500 points
- Free Delivery — 200 points

# 8. Compliance and Metrc Flow

Cannabis compliance is architected as a first-class concern. The compliance subsystem spans three areas: Metrc seed-to-sale integration, state tax engine, and audit trail.

## 8.1 Daily Reconciliation (6 AM CRON)

## 8.2 Real-Time Sync Pipeline

## 8.3 Credential Security

## 8.4 State Tax Engine

- **New York:** 9% retail cannabis excise + per-mg THC taxes (flower $0.005, concentrate $0.008, edible $0.03)
- **New Jersey:** 6.625% sales tax + 6% cannabis excise + up to 2% municipal tax
- **Connecticut:** 6.35% sales tax + 3% cannabis excise + up to 3% municipal tax

All rules stored in `lkp_tax_categories` with statutory references (e.g., NY Tax Law § 493-a).

Platform admins can add, update, or toggle tax rules and add new states without code changes.

## 8.5 Audit Trail

The `audit_log` table records every significant data change: entity type, entity ID, action (create/update/delete), performing user ID, timestamp, and JSONB before/after state snapshots. The `entityAuditTrail` query provides the complete change history for any record.

# 9. WebSocket Room Architecture

Real-time updates use Socket.IO with JWT-authenticated connections. Clients auto-join rooms based on their role, and can subscribe to individual orders for tracking.

## 9.1 Room Structure

| Room | Auto-Join | Events Received |
|---|---|---|
| `user:{userId}` | All authenticated users | Personal: order updates, delivery updates |
| `dispensary:{id}` | All users with dispensaryId | All dispensary events |
| `staff:{id}` | budtender, shift_lead, admins | New orders, inventory alerts, delivery updates, driver GPS |
| `order:{orderId}` | Manual subscribe | Per-order status changes for live tracking |

## 9.2 Event Broadcast Map

| Event | Broadcast To |
|---|---|
| `order.completed` | `staff:{dispensaryId}` (new order alert) |
| `order.status_changed` | `user:{customerId}` + `order:{orderId}` + `staff:{dispensaryId}` |
| `inventory.low_stock` | `staff:{dispensaryId}` |
| `delivery.status_changed` | `user:{customerId}` + `staff:{dispensaryId}` + `order:{orderId}` |
| `driver:location` | `staff:{dispensaryId}` (GPS coordinates) |

# 10. Customer Journey

The end-to-end customer experience spans four phases, each supported by specific platform features:

## 10.1 Browse

- Visit storefront (themed per dispensary via CSS custom properties)
- Browse products with full-text search, strain filters, THC/CBD display
- View product detail with variants, effects, terpene profiles
- Add to cart with variant selection and quantity

## 10.2 Checkout

- Review cart with quantity controls and line-item management
- Select fulfillment: pickup (ready in ~15 min) or delivery (45-60 min)
- Choose payment: cash (pay at counter/delivery) or card (Stripe)
- Place order → `createOrder` mutation + optional `createPaymentIntent`

## 10.3 Fulfillment

- Real-time order tracking via WebSocket (progress bar: Confirmed → Preparing → Ready → Delivered)
- Push notifications for status changes (email + SMS)
- Pick up at counter or receive delivery with driver GPS tracking

## 10.4 Post-Purchase

- Loyalty points auto-earned with tier multiplier
- Check tier progress and points balance on account page
- Redeem rewards from catalog at next purchase
- Birthday bonus eligible within 7-day window

# 11. Docker Production Stack

The production deployment uses Docker Compose with seven services. All application containers run as non-root users. Internal ports are bound to 127.0.0.1; only nginx is exposed externally.

## 11.1 Services

| Service | Image | Configuration |
|---|---|---|
| nginx | nginx:alpine | TLS termination, rate limiting (30r/s API, 5r/m auth), security headers, subdomain routing |
| api | Custom multi-stage | NestJS, non-root user (cannasaas:1001), raw body for Stripe webhooks, health check |
| storefront | Custom Next.js standalone | Non-root, NEXT_TELEMETRY_DISABLED |
| admin | Custom Vite → nginx | SPA fallback, static file serving |
| staff | Custom Vite → nginx | SPA fallback, static file serving |
| postgres | postgres:16-alpine | Persistent volume (pgdata), health check (pg_isready), 127.0.0.1 binding |
| redis | redis:7-alpine | AOF persistence, 256MB LRU eviction, health check |

## 11.2 Subdomain Routing

- `yourdomain.com` → storefront (port 3001) + API (`/graphql`, `/v1/*`)
- `admin.yourdomain.com` → admin portal (port 3002)
- `staff.yourdomain.com` → staff portal (port 3003)
- WebSocket connections proxied with Upgrade header support

# 12. Subscription Tiers

CannaSaas uses a three-tier subscription model with feature gating per tier:

| Feature | Starter $299/mo | Professional $499/mo | Enterprise $799/mo |
|---|---|---|---|
| Storefront + Cart | Yes | Yes | Yes |
| Admin + Staff Portals | Yes | Yes | Yes |
| Metrc Compliance | Basic | Full | Full + Audit Trail |
| Delivery Management | -- | Yes | Yes |
| Staffing + Payroll | -- | Yes | Yes |
| Theme Customization | -- | Theme Selection | Full Custom CSS |
| Max Locations | 1 | 3 | 10 |
| Support | Email | Email + Chat | Dedicated Manager |

# 13. Database Entity Relationships (95+ Tables)

The database uses PostgreSQL 16 with uuid-ossp and pgcrypto extensions. Tables are organized across 15 domains:

| Domain | Tables and Relationships |
|---|---|
| Core | organizations → companies → dispensaries → (all operational data); users linked to org + dispensary |
| Products | products → product_variants → product_pricing; products → inventory; strain_data for enrichment |
| Orders | orders → order_items (each links to product_variant); orders → payments (cash or Stripe) |
| Inventory | inventory (per variant per dispensary); transfers → transfer_items; counts → count_items; adjustments |
| Compliance | metrc_credentials (AES encrypted); manifests → manifest_items; waste_logs; reconciliation_reports → items; audit_log |
| Customers | users → customer_profiles → customer_addresses; age_verifications; purchase_limit_rules |
| Loyalty | loyalty_programs (per dispensary) → loyalty_tiers + loyalty_rewards; users → loyalty_transactions + redemptions |
| Staffing | employee_profiles → employee_certifications; performance_reviews; time_entries |
| Scheduling | shift_templates; scheduled_shifts; shift_swap_requests; time_off_requests |
| Delivery | driver_profiles → delivery_trips; delivery_zones; delivery_time_slots; order_tracking |
| Vendors | vendors → vendor_contacts; purchase_orders → purchase_order_items; vendor_performance |
| Notifications | notification_templates (18 seeded); notification_log |
| Platform | subscription_tiers (3); billing_invoices; platform_activity |
| Theming | lkp_themes (10 seeded); theme_code + custom_css on dispensaries |
| POS | pos_integrations; pos_product_mappings; pos_sync_logs |

## 13.1 Key Design Patterns

- UUID v4 primary keys on all tables (`uuid_generate_v4()`)
- Soft deletes via `deleted_at` timestamptz on products, users
- 15 lookup tables (`lkp_` prefix) seeded with state-specific regulatory data
- JSONB for flexible data: effects, terpenes, gallery URLs, notification preferences, activity metadata
- Composite indexes on `(dispensary_id, created_at)` for time-series queries
- Full-text search index on `products.name` using tsvector
- AES-256-CBC encryption for Metrc credentials at rest
