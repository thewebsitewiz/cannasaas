# CannaSaas — The All-in-One Cannabis Dispensary Platform

**43+ Modules | 95+ Database Tables | 180+ API Operations | 6 Frontend Apps | 10 Themes**

---

## E-Commerce

- Product catalog with Meilisearch full-text search, vibe search (semantic), & autocomplete
- AI-powered product recommendations
- Faceted filtering by strain, effects, THC/CBD
- Shopping cart with variant selection & express checkout
- Delivery & pickup with geo-fenced eligibility
- Cash, Stripe, CanPay & AeroPay payments with cash discount system
- Real-time order tracking via WebSocket
- Back-in-stock notifications
- "Botanical Luxury" design with strain-specific gradient cards

## Customer Accounts

- Registration & JWT authentication with 2FA/TOTP
- Age verification (21+) with ID type tracking
- Digital ID verification with OCR
- Saved addresses with delivery instructions
- Order history with pagination
- Loyalty points tracking (4 tiers: Bronze/Silver/Gold/Platinum)
- Medical patient designation
- 6 automatic customer segments (new, VIP, at-risk, frequent, medical, birthday)
- Customer reviews & ratings

## Compliance

- Metrc + BioTrack seed-to-sale integration
- Manifest generation for all transfers
- Daily automated reconciliation (local vs Metrc)
- Automated compliance alerts (CRON) — license expiry, discrepancies, failures
- Waste/destruction logging with witness tracking
- Purchase limit enforcement per state law
- Full audit trail (who, what, when, JSONB changes)
- AES-256-CBC credential encryption

## Tax Engine

- State-specific multi-line tax calculations for 13+ states
- NY: retail excise + per-mg THC by product type
- NJ: sales tax + cannabis excise + municipal
- CT: sales tax + excise + municipal
- CA, CO, MA, IL, MI, AZ, WA, OR, NV, FL, and more
- Statutory references for every tax line
- Tax report with CSV export for accountants

## Inventory

- Real-time stock tracking with reorder thresholds
- AI-powered reorder suggestions based on sales velocity
- Inter-dispensary transfers (request/approve/ship/receive)
- Physical count with variance reporting & auto-adjust
- Adjustments with 10 reason codes & approval workflow
- Expiration tracking, dead stock detection, lot numbers
- Inventory health dashboard & valuation report

## Staffing & HR

- Employee roster with 11 position types
- Certification tracking with auto-expiry alerts
- Performance reviews
- Clock-in/out with overtime calculation (1.5x over 40h)
- Payroll report with CSV export
- Exempt employee handling

## Scheduling

- Shift templates (recurring weekly patterns)
- Auto-generate schedules from templates
- Coverage gap detection (min staff vs assigned)
- Shift swap requests with manager approval
- Time-off requests (PTO, sick, personal)
- Publish week with one click

## Delivery

- Driver profiles with vehicle & insurance tracking
- Trip assignment with distance/ETA
- Real-time driver GPS broadcasting
- Delivery completion with customer ratings
- Driver performance stats (avg time, rating, miles)
- Delivery zones with geo-fencing

## Notifications & Marketing

- Email via SendGrid/SMTP + SMS via Twilio
- 18+ templates with white-label branding per tenant
- Back-in-stock automatic notifications
- Event-driven (order.completed, status_changed)
- Customer preferences (email/SMS per category)
- Notification log with status tracking
- Marketing Suite: campaign builder & automation workflows
- Targeted campaigns using customer segments
- Admin: send test, manual notify, stats dashboard

## Reporting

- Sales summary: revenue, orders, avg value, cash vs card
- Sales by day, product, and hour breakdowns
- Tax report with statutory references per state
- Labor cost report with % of revenue
- Shrinkage report by reason with estimated value
- Inventory valuation
- 4 CSV export endpoints

## POS Integration

- Dutchie & Treez adapter architecture
- Product mapping & sync logging
- Extensible for additional POS providers

## Analytics

- Revenue, orders, product mix KPIs
- 8 parallel dashboard queries
- Period comparisons
- Top products by volume and revenue

## AI & Search

- Meilisearch full-text search with typo tolerance
- Vibe search — semantic product discovery via natural language
- AI product recommendations (collaborative + content-based)
- AI reorder suggestions for inventory
- Budtender Knowledge Base — AI-powered product assistant

## Security & Webhooks

- Digital ID verification with OCR
- Webhooks API with HMAC-SHA256 signed payloads
- GraphQL depth limiting (max 10) + complexity limiting (max 1000)
- CSRF protection, request body size limits
- Circuit breakers on external service calls

## White-Label

- 10 pre-built CSS themes (casual, dark, regal, modern, minimal, apothecary, citrus, earthy, midnight, neon)
- CSS custom properties for instant switching
- Custom CSS override per tenant
- Logo & brand name per dispensary
- HTML never changes — CSS-only theming

## Infrastructure

- Docker multi-stage builds with nginx reverse proxy (HTTPS/TLS/gzip/CSP)
- Prometheus metrics endpoint for observability
- Redis caching (products, themes, tax rules)
- Sentry error tracking (optional) with structured logging + request IDs
- WebSocket (Socket.IO) for real-time updates
- BullMQ async job queues (Stripe webhook retry, Metrc sync, notifications, marketing)
- CRON jobs (reconciliation, cert expiry, compliance alerts, birthday check)
- Non-root containers, health checks, security headers
- CI/CD: GitHub Actions with staging deployment
- Husky + commitlint + lint-staged

---

**Tech Stack:** NestJS 11 | GraphQL (Apollo) | PostgreSQL 16 | Drizzle ORM | React 19 | Next.js 15 | Vite 8 | TypeScript 5.8 | Tailwind CSS v4 | Meilisearch | Zustand | TanStack Query | Docker | nginx | Redis 7 | BullMQ | Socket.IO | Prometheus | Sentry

**Target Markets:** All US states with legal cannabis programs (38+ states) | **Pricing:** $299-$799/month per location
