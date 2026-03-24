# CannaSaas — The All-in-One Cannabis Dispensary Platform

**28 Modules | 79 Database Tables | 150+ API Operations | 4 Frontend Apps | 10 Themes**

---

## E-Commerce

- Product catalog with full-text search & autocomplete
- Faceted filtering by strain, effects, THC/CBD
- Shopping cart with variant selection
- Delivery & pickup with geo-fenced eligibility
- Cash & card payments with cash discount system
- Real-time order tracking via WebSocket

## Customer Accounts

- Registration & JWT authentication
- Age verification (21+) with ID type tracking
- Saved addresses with delivery instructions
- Order history with pagination
- Loyalty points tracking
- Medical patient designation

## Compliance

- Metrc seed-to-sale integration (all Metrc-integrated states)
- Manifest generation for all transfers
- Daily automated reconciliation (local vs Metrc)
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

## Notifications

- Email via SendGrid/SMTP + SMS via Twilio
- 18 templates: order lifecycle, welcome, cert expiry
- Event-driven (order.completed, status_changed)
- Customer preferences (email/SMS per category)
- Notification log with status tracking
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

## White-Label

- 10 pre-built CSS themes (dark, earth, purple, luxury, neon, etc.)
- CSS custom properties for instant switching
- Custom CSS override per tenant
- Logo & brand name per dispensary
- HTML never changes — CSS-only theming

## Infrastructure

- Docker Compose production stack (7 services)
- Nginx reverse proxy with rate limiting
- WebSocket for real-time updates
- BullMQ async job queues
- Daily CRON jobs (reconciliation, cert expiry, alerts)
- Non-root containers, health checks, security headers

---

**Tech Stack:** NestJS | GraphQL | PostgreSQL | React | Next.js | Zustand | TanStack Query | Tailwind CSS | Docker | nginx | Redis | BullMQ | Socket.IO

**Target Markets:** All US states with legal cannabis programs (38+ states) | **Pricing:** $299-$799/month per location
