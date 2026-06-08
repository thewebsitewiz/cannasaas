# Test Plan — API (integration probes)

NestJS API at `apps/api`. Tracked in [Testing — API (epic 505)](https://app.shortcut.com/cannasaas/epic/505) under [objective 230](https://app.shortcut.com/cannasaas/milestone/230).

This plan covers **integration seams** — flows that unit tests can't validate end-to-end. Unit-level coverage (resolver shape, service logic, guard branches) lives in the existing Jest specs and is not duplicated here.

---

## 1. Scope

- **§5 Smoke** — boot, schema regen, BullMQ connect.
- **§6 Feature integration cases** — order lifecycle, inventory event → WS, payment webhooks, kiosk attestation guard, Metrc sync queue.
- **§7 Migration verification** for the two recent kiosk-hardening migrations.

Out of scope: REST controller exhaustive cases (covered by their own Jest specs), GraphQL type-system coverage (covered by codegen + autoSchemaFile).

## 2. Test environment

Same as the kiosk/storefront plans:

| Env | URL | Notes |
| --- | --- | --- |
| Local | `http://localhost:3000/graphql` | `pde` brings up postgres + redis + api |
| Sandbox | `https://api-sandbox.cannasaas.com` | pre-prod soak |

## 3. Severity scale

- **S1 — Blocker:** API down, orders can't be placed, payments don't reconcile.
- **S2 — Major:** flow degraded but workaround exists.
- **S3 — Minor:** cosmetic / log noise.
- **S4 — Trivial:** polish.

---

## 5. Smoke

| ID | Case | Expected |
| --- | --- | --- |
| SMK-1 | API boots without DB errors | `pnpm --filter @cannasaas/api dev` succeeds; no Redis spam in the first 5 s. |
| SMK-2 | Schema auto-regenerates | After a resolver change, restart the API; `schema.gql` reflects the new mutation. |
| SMK-3 | GraphQL playground reachable | `curl http://localhost:3000/graphql` returns the apollo landing page. |

---

## 6. Feature integration cases

### 6.1 Order lifecycle — happy path with WS broadcasts

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-ORDER-001 | createOrder → pending → confirmed → preparing → ready → completed | Walk an order through every transition mutation. | Each mutation succeeds; each transition emits the matching event (`order.created`, `order.confirmed`, …, `order.completed`). |
| TC-ORDER-002 | Concurrent stock contention is safe | Two clients place orders for the last unit of the same variant simultaneously. | One succeeds; the other gets a stock-validation error. No phantom inventory. |
| TC-ORDER-003 | WS gateway broadcasts on every transition | Subscribe a WS client to `user:{id}` + `staff:{dispensaryId}` + `order:{orderId}`. Walk the order through. | Every transition emits `order:update` to the appropriate rooms with the correct payload shape. |
| TC-ORDER-004 | completeOrder enqueues Metrc sync | Complete an order. | `metric-sync` BullMQ queue has a `sync-sale` job with `{orderId, dispensaryId, attemptNumber: 1}`. |

### 6.2 Inventory event emitter + WS gateway (sc-225 + sc-226)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-INV-001 | adjustQuantity emits stock_changed | Adjust a variant from 10 → 8. | `inventory.stock_changed` emitted with `status: 'in_stock'`, `source: 'adjustment'`. Gateway broadcasts `stock:changed` to `storefront:{dispensaryId}` with public projection only (no productName, no threshold). |
| TC-INV-002 | reserveStock to threshold emits low_stock | Reserve from 10 → 4 (threshold 5). | Both `stock_changed` and `inventory.low_stock` emitted. Gateway broadcasts `inventory:alert` to `staff:{dispensaryId}` (NOT to storefront). |
| TC-INV-003 | reserveStock to zero emits out_of_stock | Reserve from 4 → 0. | Both `stock_changed` and `inventory.out_of_stock` emitted. `staff:` and `storefront:` rooms both updated (storefront with public projection only). |
| TC-INV-004 | releaseReserve emits stock_changed | Release a held reserve. | `stock_changed` with `source: 'release'`. |
| TC-INV-005 | storefront projection strips operator context | Inspect the `stock:changed` event in DevTools on the storefront. | Only `type`, `variantId`, `available`, `status`, `timestamp`. No `productName`, no `reorderThreshold`. |
| TC-INV-LS-001 | Order reserve emits via StockEventEmitter | `createOrder` for a variant whose available drops from 10 → 4 (threshold 5). | Post-commit, `recordChange` is called with `source: 'reserve'`, `previousAvailable: 10`, `newAvailable: 4`, `reorderThreshold: 5`. Gateway broadcasts `inventory:alert` to `staff:` room. |
| TC-INV-LS-002 | Order cancel emits via StockEventEmitter | `cancelOrder` releases 6 units back to a variant (4 → 10). | `recordChange` called with `source: 'release'`. Status crossover from `low_stock` → `in_stock` does NOT re-fire low/out events. |
| TC-INV-LS-003 | RETURNING handles null `reorder_threshold` | Reserve against a variant with no threshold configured. | `recordChange` called with `reorderThreshold: null`; no low/out crossover emitted regardless of available level. |
| TC-NOTIF-LS-001 | LowStock email fan-out per dispensary admin | Emit `inventory.low_stock` for a dispensary with two active `dispensary_admin` users. | `sendByTemplate('low_stock_alert', …)` called twice, once per admin email, with `dispensaryName` and `quantity` interpolated. |
| TC-NOTIF-LS-002 | Cooldown suppresses repeat low_stock in window | Emit two `inventory.low_stock` events for the same (dispensary, productName) within 60 minutes. | First emits; second short-circuits via `CacheService.setNxEx` returning `false`. No second email sent. |
| TC-NOTIF-LS-003 | OutOfStock uses distinct cooldown key | Emit `inventory.out_of_stock` immediately after a `low_stock` for the same product. | Separate cooldown key (`…:out_of_stock_alert:…` vs `…:low_stock_alert:…`); both send. |
| TC-NOTIF-LS-004 | No admin recipients → graceful skip | Emit `inventory.low_stock` for a dispensary with no active admins. | Listener logs a warning, no template lookup, no send. |

### 6.3 Payment webhooks (Aeropay + CanPay)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-PAY-001 | Aeropay HMAC verification rejects bad signature | POST a webhook body with a wrong `X-Aeropay-Signature`. | 401; no event emitted; no order update. |
| TC-PAY-002 | Aeropay success webhook flips order | Initiate a sandbox transaction; fire the success webhook. | `payment.webhook.payment.succeeded` event emitted; order status → `confirmed`. |
| TC-PAY-003 | Aeropay failure webhook surfaces | Fire the `transaction.failed` webhook. | `payment.webhook.payment.failed` event emitted; order moves to `payment_failed`. |
| TC-PAY-004 | CanPay parity | Repeat TC-PAY-001..003 against the CanPay processor. | Symmetric behavior; HMAC algorithm + header are the CanPay-spec values. |
| TC-PAY-005 | initiateCashlessPayment returns redirect or referenceId | Call the mutation against the sandbox. | Response includes either `externalUrl` (Aeropay) or `referenceId` + (optional) `qrPayload` (CanPay). |

### 6.4 Kiosk attestation guard (sc-474)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-ATT-API-001 | Legacy kiosk (no kiosk_devices row) bypasses | Authenticate as the seeded `kiosk@greenleaf.com`. Issue any query. | Succeeds; guard skips signature check. |
| TC-ATT-API-002 | Attested kiosk without header is rejected | `kiosk_devices.public_key` is set; issue a request with no `X-Device-Signature`. | 401. |
| TC-ATT-API-003 | Replay protection — same nonce twice | Replay a signed request twice within 90 s. | First passes, second returns 401 (`Replayed nonce`). |
| TC-ATT-API-004 | Schema includes attestKioskDevice | Inspect `schema.gql` after boot. | `attestKioskDevice(publicKey: String!): Boolean!` present under Mutation. |

### 6.5 Metrc sync queue

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-METRC-001 | Sync succeeds first try | Complete an order with a valid Metrc license. | Job runs once; `metrcSyncStatus` flips to `success`. |
| TC-METRC-002 | Sync retries with exponential backoff | Stub Metrc to return 500 twice then 200. | Job retries with 60 s → 120 s → 200 success; `metrcSyncStatus` → `success`. |
| TC-METRC-003 | Exhausted attempts mark failed | Stub Metrc to always 500. | After 5 attempts, `metrcSyncStatus` → `failed`. |
| TC-METRC-004 | enqueueRetryFailed picks up failed orders | Run the retry-failed cron / job manually. | Failed orders re-queued with 3 fresh attempts. |

---

## 7. Migration verification

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-MIG-001 | `CreateKioskDevices1779408000000` up | Run on a fresh DB. | `kiosk_devices` table exists with `user_id`, `dispensary_id`, `label`, `current_token_id`. Indexes on user_id (unique) + dispensary_id. |
| TC-MIG-002 | `CreateKioskDevices1779408000000` down | Roll back. | Table dropped cleanly. |
| TC-MIG-003 | `AddKioskPublicKey1779410000000` up | Apply on a DB with existing kiosk_devices rows. | `public_key` column added, nullable. Existing rows have NULL. |
| TC-MIG-004 | `AddKioskPublicKey1779410000000` down | Roll back. | Column dropped cleanly. |
| TC-MIG-005 | Re-provisioning clears public_key | Call `provisionKiosk` for an already-provisioned + attested kiosk. | `current_token_id` rotates AND `public_key` resets to NULL — kiosk must re-attest. |

---

## 8. Verified limits + open follow-ups

### GraphQL query limits (sc-610 verified)

Both plugins reject malformed queries during Apollo's
`didResolveOperation` phase, before any resolver runs.

| Limit | Value | Plugin | Error code |
| --- | --- | --- | --- |
| Max query depth | 10 | [`depth-limit.plugin.ts`](src/common/plugins/depth-limit.plugin.ts) | `QUERY_TOO_DEEP` |
| Max complexity (field count) | 1000 | [`complexity-limit.plugin.ts`](src/common/plugins/complexity-limit.plugin.ts) | `QUERY_TOO_COMPLEX` |

Both are exercised by [`depth-limit.plugin.spec.ts`](src/common/plugins/depth-limit.plugin.spec.ts) and [`complexity-limit.plugin.spec.ts`](src/common/plugins/complexity-limit.plugin.spec.ts) — 4 cases each, including boundary (depth 10 / 1000 fields pass) and well-over (depth 50 / 2000 fields reject with the right extension code).

If the limits ever feel too tight for a legitimate frontend query, the right move is to:
1. Confirm the rejection isn't actually masking a query that fans out unboundedly.
2. Tune the constant in the plugin file; no other config knobs.
3. Re-run the plugin specs to confirm the boundary still rejects the next-larger query.

### sc-225/sc-226 worker-crash recovery (sc-608 documented)

See [`docs/metrc-sync-runbook.md`](docs/metrc-sync-runbook.md) for the full Metrc sync queue story (architecture, worker-crash recovery semantics, operator commands, common failure modes).

### Tenant isolation (sc-609 audited + 3 leaks fixed)

See [`docs/tenant-isolation-audit.md`](docs/tenant-isolation-audit.md). 151 dispensary-scoped endpoints inventoried; 0 missing post-fix.

### Open follow-ups

- TenantMiddleware coverage for cross-tenant data leakage in non-GraphQL surfaces (webhooks, REST controllers).
- Service-layer leaks across the 114 "delegated" endpoints from the tenant-isolation audit — these would need a runtime test rig against a seeded test DB.
