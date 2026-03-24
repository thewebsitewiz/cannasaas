# Order Completion & Metrc Sync — Implementation Guide

> **Module:** `apps/api/src/modules/orders/` + `apps/api/src/modules/metrc/`
> **Status:** Complete
> **Last Updated:** March 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Order Lifecycle](#order-lifecycle)
3. [Architecture](#architecture)
4. [GraphQL API](#graphql-api)
5. [Metrc Sales Receipt Sync](#metrc-sales-receipt-sync)
6. [BullMQ Queue & Retry](#bullmq-queue--retry)
7. [Database Schema](#database-schema)
8. [File Map](#file-map)
9. [Configuration](#configuration)
10. [Testing the Full Chain](#testing-the-full-chain)
11. [Error Handling & Recovery](#error-handling--recovery)
12. [Monitoring & Observability](#monitoring--observability)
13. Future Improvements

---

## Overview

This implementation provides the complete order-to-compliance pipeline for CannaSaas dispensaries operating in NY, NJ, and CT. When a customer places an order, it flows through a five-stage lifecycle. Upon completion, the sale is automatically reported to the state's Metrc track-and-trace system via a resilient, retry-capable background queue.

**Key guarantees:**

- Orders follow a strict state machine — no skipping stages
- Inventory is reserved on order creation and deducted on completion
- Metrc sync is decoupled from the order flow via event-driven architecture
- Failed syncs retry with exponential backoff (5 attempts over ~31 minutes)
- A failed sync dashboard surfaces unsynced orders for manual intervention
- NY/NJ/CT cannabis tax rates are calculated automatically based on dispensary state

---

## Order Lifecycle

```
┌─────────┐    confirmOrder    ┌───────────┐   startPreparingOrder   ┌───────────┐
│ PENDING  │──────────────────>│ CONFIRMED │────────────────────────>│ PREPARING │
└─────────┘                    └───────────┘                         └───────────┘
     │                                                                     │
     │  cancelOrder                                              markOrderReady
     │  (from any non-                                                     │
     │   terminal state)                                                   ▼
     │                         ┌───────────┐    completeOrder      ┌───────────┐
     └────────────────────────>│ CANCELLED │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│   READY   │
                               └───────────┘                       └───────────┘
                                                                         │
                                                                   completeOrder
                                                                         │
                                                                         ▼
                                                                   ┌───────────┐
                                                                   │ COMPLETED │
                                                                   └───────────┘
                                                                         │
                                                                    (automatic)
                                                                         │
                                                                         ▼
                                                                   ┌───────────┐
                                                                   │METRC SYNC │
                                                                   │  (async)  │
                                                                   └───────────┘
```

### Status Transitions

| Mutation              | From                               | To          | Who Can Call     | What Happens                                   |
| --------------------- | ---------------------------------- | ----------- | ---------------- | ---------------------------------------------- |
| `createOrder`         | —                                  | `pending`   | budtender, admin | Order + line items created, inventory reserved |
| `confirmOrder`        | `pending`                          | `confirmed` | budtender, admin | Staff acknowledges the order                   |
| `startPreparingOrder` | `confirmed`                        | `preparing` | budtender, admin | Staff begins fulfilling the order              |
| `markOrderReady`      | `preparing`                        | `ready`     | budtender, admin | Order is packed and waiting for customer       |
| `completeOrder`       | `ready`\*                          | `completed` | budtender, admin | Inventory deducted, Metrc sync enqueued        |
| `cancelOrder`         | any except `completed`/`cancelled` | `cancelled` | admin            | Reason required, inventory released            |

\*`completeOrder` also accepts `confirmed` or `preparing` for edge cases (e.g., walk-in POS sales that skip the preparation flow).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GraphQL API Layer                            │
│                                                                     │
│  OrdersResolver                                                     │
│    ├── createOrder()     → OrdersService.createOrder()              │
│    ├── confirmOrder()    → OrdersService.confirmOrder()             │
│    ├── startPreparingOrder() → OrdersService.startPreparing()       │
│    ├── markOrderReady()  → OrdersService.markReady()                │
│    ├── completeOrder()   → OrdersService.completeOrder()            │
│    │                        ├── Updates order status                │
│    │                        ├── Deducts inventory                  │
│    │                        └── Emits 'order.completed' event      │
│    └── cancelOrder()     → OrdersService.cancelOrder()              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                          EventEmitter2 event
                         'order.completed'
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Metrc Module                                 │
│                                                                     │
│  OrderCompletedListener                                             │
│    └── @OnEvent('order.completed')                                  │
│         └── MetrcSyncQueueService.enqueueSaleSync()                 │
│                                                                     │
│  MetrcSyncQueueService (BullMQ)                                     │
│    ├── enqueueSaleSync()      → adds job to 'metrc-sync' queue      │
│    ├── enqueueRetryFailed()   → re-enqueues all failed syncs        │
│    └── getQueueStats()        → waiting/active/failed/completed     │
│                                                                     │
│  MetrcSyncProcessor (BullMQ Worker)                                 │
│    └── process()                                                    │
│         └── MetrcService.syncSaleToMetrc()                          │
│              ├── Fetches credential + order + line items             │
│              ├── Builds Metrc receipt payload                       │
│              ├── POSTs to Metrc sales/v2/receipts                   │
│              ├── Creates metrc_sync_logs entry                      │
│              └── Updates order metrcSyncStatus                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │   Metrc API        │
                        │   (state-specific) │
                        │   NY / NJ / CT     │
                        └───────────────────┘
```

### Event Flow (Happy Path)

1. Staff calls `completeOrder` mutation
2. `OrdersService` updates status to `completed`, deducts inventory from `quantity_on_hand`
3. `EventEmitter2` fires `order.completed` event
4. `OrderCompletedListener` catches event, calls `MetrcSyncQueueService.enqueueSaleSync()`
5. BullMQ adds job to `metrc-sync` queue with exponential backoff config
6. `MetrcSyncProcessor` picks up job, calls `MetrcService.syncSaleToMetrc()`
7. Service builds Metrc receipt payload from order + line items
8. POSTs to `{baseUrl}/sales/v2/receipts?licenseNumber={license}`
9. Updates `metrc_sync_logs` with result, updates order `metrcSyncStatus` to `synced` or `failed`

---

## GraphQL API

### Mutations

#### createOrder

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    orderId
    dispensaryId
    orderStatus
    subtotal
    taxTotal
    total
    taxBreakdown { label ratePercent amount }
    lineItemCount
    createdAt
  }
}

# Variables
{
  "input": {
    "dispensaryId": "c0000000-0000-0000-0000-000000000001",
    "orderType": "in_store",
    "lineItems": [
      { "productId": "<uuid>", "variantId": "<uuid>", "quantity": 2 }
    ],
    "customerUserId": null,
    "notes": "Customer requested gift bag"
  }
}
```

#### confirmOrder

```graphql
mutation ConfirmOrder($orderId: ID!, $dispensaryId: ID) {
  confirmOrder(orderId: $orderId, dispensaryId: $dispensaryId)
}
```

#### startPreparingOrder

```graphql
mutation StartPreparing($orderId: ID!, $dispensaryId: ID) {
  startPreparingOrder(orderId: $orderId, dispensaryId: $dispensaryId)
}
```

#### markOrderReady

```graphql
mutation MarkReady($orderId: ID!, $dispensaryId: ID) {
  markOrderReady(orderId: $orderId, dispensaryId: $dispensaryId)
}
```

#### completeOrder

```graphql
mutation CompleteOrder($input: CompleteOrderInput!) {
  completeOrder(input: $input)
}

# Variables
{
  "input": {
    "orderId": "<uuid>",
    "dispensaryId": "c0000000-0000-0000-0000-000000000001",
    "metrcReceiptId": null,
    "notes": null
  }
}
```

#### cancelOrder

```graphql
mutation CancelOrder($orderId: ID!, $reason: String!, $dispensaryId: ID) {
  cancelOrder(orderId: $orderId, reason: $reason, dispensaryId: $dispensaryId)
}
```

### Queries

#### orders (list)

```graphql
query Orders($dispensaryId: ID, $limit: Int, $offset: Int) {
  orders(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
    orderId
    orderStatus
    orderType
    subtotal
    taxTotal
    total
    createdAt
  }
}
```

#### order (single with line items)

```graphql
query Order($orderId: ID!, $dispensaryId: ID) {
  order(orderId: $orderId, dispensaryId: $dispensaryId) {
    orderId
    orderStatus
    subtotal
    taxTotal
    total
    taxBreakdown
    line_items
    createdAt
    updatedAt
  }
}
```

#### failedMetrcSyncs

```graphql
query FailedSyncs($dispensaryId: ID!) {
  failedMetrcSyncs(dispensaryId: $dispensaryId) {
    dispensaryId
    totalFailed
    oldestFailedAt
    items {
      orderId
      metrcSyncStatus
      lastSyncAttempt
      lastSyncError
      attemptCount
    }
  }
}
```

### Role-Based Access

| Role               | Create | Confirm | Prepare | Ready | Complete | Cancel | View |
| ------------------ | ------ | ------- | ------- | ----- | -------- | ------ | ---- |
| `budtender`        | ✅     | ✅      | ✅      | ✅    | ✅       | ❌     | ✅   |
| `dispensary_admin` | ✅     | ✅      | ✅      | ✅    | ✅       | ✅     | ✅   |
| `org_admin`        | ✅     | ✅      | ✅      | ✅    | ✅       | ✅     | ✅   |
| `super_admin`      | ✅     | ✅      | ✅      | ✅    | ✅       | ✅     | ✅   |

All roles except `super_admin` and `org_admin` are scoped to their own dispensary — cross-dispensary access is forbidden.

---

## Metrc Sales Receipt Sync

### Payload Format

The sync constructs a Metrc-compliant receipt payload:

```json
[
  {
    "SalesDateTime": "2026-03-23T14:30:00.000Z",
    "SalesCustomerType": "Consumer",
    "PatientLicenseNumber": null,
    "CaregiverLicenseNumber": null,
    "IdentificationMethod": "DL",
    "Transactions": [
      {
        "PackageLabel": "1A4000000000000000012345",
        "PackageState": "NY",
        "Quantity": 2.0,
        "UnitOfMeasure": "Each",
        "TotalAmount": 70.0
      }
    ]
  }
]
```

### Endpoint

```
POST {baseUrl}/sales/v2/receipts?licenseNumber={license}
Authorization: Basic {base64(userApiKey:integratorApiKey)}
Content-Type: application/json
```

### State-Specific Base URLs

| State | Production                 | Sandbox                            |
| ----- | -------------------------- | ---------------------------------- |
| NY    | `https://api-mn.metrc.com` | `https://sandbox-api-mn.metrc.com` |
| NJ    | `https://api-nj.metrc.com` | `https://sandbox-api-mn.metrc.com` |
| CT    | `https://api-ct.metrc.com` | `https://sandbox-api-mn.metrc.com` |

### Skip Conditions

If no line items have a `metrcItemUid` or `metrcPackageLabel`, the sync is marked as `skipped` (not `failed`) — this handles orders for non-tracked items like accessories.

---

## BullMQ Queue & Retry

### Queue Configuration

| Setting          | Value                       |
| ---------------- | --------------------------- |
| Queue Name       | `metrc-sync`                |
| Job Names        | `sync-sale`, `retry-failed` |
| Max Attempts     | 5 (initial sync), 3 (retry) |
| Backoff Type     | Exponential                 |
| Base Delay       | 60s (initial), 30s (retry)  |
| Retain Completed | Last 100                    |
| Retain Failed    | Last 200                    |

### Retry Schedule (Initial Sync)

| Attempt | Delay     | Cumulative |
| ------- | --------- | ---------- |
| 1       | Immediate | 0m         |
| 2       | 1 minute  | 1m         |
| 3       | 2 minutes | 3m         |
| 4       | 4 minutes | 7m         |
| 5       | 8 minutes | 15m        |

After 5 failed attempts, the order remains with `metrcSyncStatus = 'failed'` and appears on the failed sync dashboard.

### Manual Retry

Admins can re-enqueue all failed syncs for a dispensary:

```graphql
mutation RetryFailed($dispensaryId: ID!) {
  retryFailedMetrcSyncs(dispensaryId: $dispensaryId)
}
```

### Queue Stats

```graphql
query QueueStats {
  metrcQueueStats {
    waiting
    active
    failed
    completed
    delayed
  }
}
```

### Redis Requirement

BullMQ requires Redis. Ensure Redis is running:

```bash
# Docker Compose (recommended)
docker compose up redis -d

# Or standalone
redis-server
```

Default connection: `localhost:6379`. Configure via `REDIS_URL` in `.env` if different.

---

## Database Schema

### orders table

| Column               | Type                   | Description                                                            |
| -------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `orderId`            | UUID PK                | Auto-generated                                                         |
| `dispensaryId`       | UUID FK                | Links to dispensaries                                                  |
| `customerUserId`     | UUID FK (nullable)     | Customer who placed the order                                          |
| `staffUserId`        | UUID FK (nullable)     | Staff who processed the order                                          |
| `orderType`          | varchar                | `in_store`, `pickup`, `delivery`                                       |
| `orderStatus`        | varchar                | `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled` |
| `subtotal`           | decimal                | Pre-tax total                                                          |
| `discountTotal`      | decimal                | Total discounts applied                                                |
| `taxTotal`           | decimal                | Total tax (state + local + excise)                                     |
| `total`              | decimal                | Final total (subtotal - discounts + tax)                               |
| `taxBreakdown`       | JSONB                  | Array of `{ label, ratePercent, amount }`                              |
| `notes`              | text (nullable)        | Staff/customer notes                                                   |
| `metrcReceiptId`     | varchar (nullable)     | Metrc receipt identifier                                               |
| `metrcSyncStatus`    | varchar (nullable)     | `pending`, `synced`, `failed`, `skipped`                               |
| `metrcReportedAt`    | timestamptz (nullable) | When successfully synced                                               |
| `cancellationReason` | text (nullable)        | Required when cancelled                                                |
| `cancelledAt`        | timestamptz (nullable) | When cancelled                                                         |
| `createdAt`          | timestamptz            | Auto                                                                   |
| `updatedAt`          | timestamptz            | Auto                                                                   |

### order_line_items table

| Column              | Type               | Description                   |
| ------------------- | ------------------ | ----------------------------- |
| `lineItemId`        | UUID PK            | Auto-generated                |
| `orderId`           | UUID FK            | Links to orders               |
| `productId`         | UUID FK            | Product reference             |
| `variantId`         | UUID FK (nullable) | Specific variant              |
| `quantity`          | integer            | Quantity ordered              |
| `unitPrice`         | decimal            | Price at time of order        |
| `discountApplied`   | decimal            | Line-level discount           |
| `taxApplied`        | decimal            | Prorated tax amount           |
| `metrcItemUid`      | varchar (nullable) | Metrc item UID for compliance |
| `metrcPackageLabel` | varchar (nullable) | Metrc package label           |
| `createdAt`         | timestamptz        | Auto                          |

### metrc_sync_logs table

| Column                  | Type        | Description                    |
| ----------------------- | ----------- | ------------------------------ |
| `sync_id`               | UUID PK     | Auto-generated                 |
| `dispensary_id`         | UUID FK     | Dispensary                     |
| `credential_id`         | UUID FK     | Which API key was used         |
| `sync_type`             | varchar     | `sale_receipt`                 |
| `reference_entity_type` | varchar     | `order`                        |
| `reference_entity_id`   | varchar     | The order ID                   |
| `status`                | varchar     | `pending`, `success`, `failed` |
| `metrc_response`        | JSONB       | Raw response from Metrc        |
| `attempt_count`         | integer     | Number of attempts             |
| `created_at`            | timestamptz | Auto                           |
| `updated_at`            | timestamptz | Auto                           |

---

## File Map

```
apps/api/src/modules/
├── orders/
│   ├── dto/
│   │   ├── create-order.input.ts         # CreateOrderInput (dispensaryId, lineItems, etc.)
│   │   ├── complete-order.input.ts       # CompleteOrderInput (orderId, dispensaryId)
│   │   └── order-summary.type.ts         # OrderSummary + TaxLineItem GraphQL types
│   ├── entities/
│   │   ├── order.entity.ts               # Order TypeORM entity
│   │   └── order-line-item.entity.ts     # OrderLineItem TypeORM entity
│   ├── events/
│   │   └── order-completed.event.ts      # Event payload (orderId, dispensaryId, completedAt)
│   ├── orders.service.ts                 # Business logic: create, confirm, prepare, ready, complete, cancel
│   ├── orders.resolver.ts               # GraphQL mutations + queries
│   └── orders.module.ts                 # NestJS module (imports MetrcModule)
│
├── metrc/
│   ├── dto/                              # Input/output types for Metrc operations
│   ├── entities/
│   │   ├── metrc-credential.entity.ts    # API keys per dispensary
│   │   ├── metrc-sync-log.entity.ts      # Sync attempt log
│   │   ├── compliance-log.entity.ts      # Compliance audit trail
│   │   └── regulatory-library.entity.ts  # State regulatory rules
│   ├── listeners/
│   │   └── order-completed.listener.ts   # @OnEvent('order.completed') → enqueue sync
│   ├── queue/
│   │   ├── metrc-sync.queue.ts           # Queue name + job name constants
│   │   ├── metrc-sync.queue-service.ts   # Enqueue methods (enqueueSaleSync, retryFailed, getStats)
│   │   └── metrc-sync.processor.ts       # BullMQ worker (processes sync jobs)
│   ├── cron/
│   │   └── metrc-inventory-sync.cron.ts  # Scheduled inventory sync (separate from sales)
│   ├── metrc.service.ts                  # Core Metrc API interactions (credentials, sync, compliance)
│   ├── metrc-api.client.ts              # Low-level HTTP client for Metrc API
│   ├── metrc.resolver.ts                # GraphQL resolver for Metrc queries/mutations
│   └── metrc.module.ts                  # NestJS module (BullMQ registration, exports)
```

---

## Configuration

### Environment Variables

```bash
# .env (apps/api)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cannasaas
REDIS_URL=redis://localhost:6379

# Metrc
METRC_INTEGRATOR_API_KEY=your-integrator-key
METRC_SANDBOX_MODE=true    # Set to false for production

# JWT (for auth)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Tax Rates

Tax rates are hardcoded in `orders.service.ts` and reflect 2025 cannabis tax law:

| State | State Tax | Local Tax | Excise Tax | Total   |
| ----- | --------- | --------- | ---------- | ------- |
| NY    | 9%        | 4%        | 13%        | 26%     |
| NJ    | 6.625%    | 2%        | 6%         | 14.625% |
| CT    | 6.35%     | 3%        | 3%         | 12.35%  |

These should be moved to a config table or env vars for production.

---

## Testing the Full Chain

### Prerequisites

```bash
# Ensure API, Postgres, and Redis are running
pda                          # Start API
docker compose up redis -d   # Start Redis (if using Docker)
```

### Step-by-Step Test

```bash
# 1. Login to get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"admin@greenleaf.com\", password: \"admin123\") { accessToken }}"}' \
  | jq -r '.data.login.accessToken')

DISPENSARY_ID="c0000000-0000-0000-0000-000000000001"

# 2. Create an order
ORDER_ID=$(curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\":\"mutation { createOrder(input: { dispensaryId: \\\"$DISPENSARY_ID\\\", orderType: \\\"in_store\\\", lineItems: [{ productId: \\\"<your-product-uuid>\\\", quantity: 1 }] }) { orderId orderStatus total }}\"}" \
  | jq -r '.data.createOrder.orderId')

echo "Created order: $ORDER_ID"

# 3. Walk through the lifecycle
curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\":\"mutation { confirmOrder(orderId: \\\"$ORDER_ID\\\") }\"}"

curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\":\"mutation { startPreparingOrder(orderId: \\\"$ORDER_ID\\\") }\"}"

curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\":\"mutation { markOrderReady(orderId: \\\"$ORDER_ID\\\") }\"}"

curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\":\"mutation { completeOrder(input: { orderId: \\\"$ORDER_ID\\\", dispensaryId: \\\"$DISPENSARY_ID\\\" }) }\"}"

# 4. Check Metrc sync status
PGPASSWORD=postgres psql -h localhost -U postgres -d cannasaas \
  -c "SELECT \"orderId\", \"orderStatus\", \"metrcSyncStatus\", \"metrcReportedAt\" FROM orders WHERE \"orderId\" = '$ORDER_ID';"

# 5. Check sync logs
PGPASSWORD=postgres psql -h localhost -U postgres -d cannasaas \
  -c "SELECT sync_id, status, attempt_count, metrc_response FROM metrc_sync_logs WHERE reference_entity_id = '$ORDER_ID';"
```

### Expected Results

After `completeOrder`:

- `orderStatus` = `completed`
- `metrcSyncStatus` = `synced` (if Metrc credentials are valid and sandbox is accessible) or `failed` (if not configured)
- A `metrc_sync_logs` entry exists with the attempt details

---

## Error Handling & Recovery

### Sync Failures

| Scenario              | Behavior                                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| No Metrc credential   | Sync returns `{ success: false }`, order stays `metrcSyncStatus: 'failed'` |
| Metrc API returns 4xx | Logged to `metrc_sync_logs`, BullMQ retries with backoff                   |
| Metrc API returns 5xx | Same — retried up to 5 times                                               |
| Network timeout       | Same — retried up to 5 times                                               |
| No tagged line items  | Order marked `metrcSyncStatus: 'skipped'` (not an error)                   |
| All retries exhausted | Order appears on `failedMetrcSyncs` dashboard                              |

### Manual Recovery

```graphql
# View all failed syncs
query {
  failedMetrcSyncs(dispensaryId: "c0000000-...") {
    totalFailed
    oldestFailedAt
    items {
      orderId
      lastSyncError
      attemptCount
    }
  }
}

# Re-enqueue all failed syncs for retry
mutation {
  retryFailedMetrcSyncs(dispensaryId: "c0000000-...")
}
```

### Inventory Safety

- **On create:** `quantity_available` decremented, `quantity_reserved` incremented
- **On complete:** `quantity_on_hand` decremented, `quantity_reserved` decremented
- **On cancel:** Reserved inventory should be released (TODO: add inventory release to `cancelOrder`)

### 24-Hour Compliance Window

Metrc requires sales to be reported within 24 hours. The exponential backoff exhausts all retries within ~15 minutes. If all fail, the order surfaces on the failed sync dashboard. Dispensary admins should check this dashboard at least once per shift and use `retryFailedMetrcSyncs` to re-attempt.

---

## Monitoring & Observability

### Key Metrics to Track

| Metric                | Source                                      | Alert Threshold  |
| --------------------- | ------------------------------------------- | ---------------- |
| Failed syncs count    | `failedMetrcSyncs` query                    | > 0 for > 1 hour |
| Queue depth           | `metrcQueueStats` query                     | `waiting` > 10   |
| Sync latency          | `metrc_sync_logs.created_at` → `updated_at` | > 5 minutes      |
| Compliance percentage | `complianceReport` query                    | < 95%            |

### Logging

All components use NestJS `Logger`:

```
[OrdersService]           Order created/confirmed/preparing/ready/completed/cancelled
[OrderCompletedListener]  Order completed: {orderId} — enqueueing Metrc sync
[MetrcSyncQueueService]   Enqueued Metrc sync for order {orderId}
[MetrcSyncProcessor]      Processing Metrc sync job: order={orderId} attempt={n}
[MetrcSyncProcessor]      Metrc sync succeeded/failed for order {orderId}
```

### Database Queries for Monitoring

```sql
-- Orders pending Metrc sync for more than 1 hour
SELECT "orderId", "orderStatus", "metrcSyncStatus", "createdAt"
FROM orders
WHERE "metrcSyncStatus" IN ('pending', 'failed')
  AND "orderStatus" = 'completed'
  AND "createdAt" < NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" ASC;

-- Sync success rate (last 24 hours)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as pct
FROM metrc_sync_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Average sync attempts before success
SELECT
  ROUND(AVG(attempt_count), 1) as avg_attempts,
  MAX(attempt_count) as max_attempts
FROM metrc_sync_logs
WHERE status = 'success'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## Future Improvements

- [ ] Add inventory release on `cancelOrder` (currently only reserves are tracked)
- [ ] Move tax rates to a config table (currently hardcoded per state)
- [ ] Add WebSocket notifications for real-time order status updates to staff portal
- [ ] Add CRON job to auto-retry failed syncs older than 30 minutes
- [ ] Add Metrc receipt ID feedback — after sync, store the actual Metrc-assigned receipt ID
- [ ] Add unit weight support for Metrc transactions (currently uses "Each" for all items)
- [ ] Add delivery fulfillment tracking (pickup vs delivery status sub-states)
