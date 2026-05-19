# Metrc Sync Runbook

How the `metrc-sync` BullMQ queue behaves, what to do when it gets
stuck, and which operator commands to reach for. Backs sc-608.

---

## Architecture

- **Producer:** `OrdersService.completeOrder` calls
  `MetrcSyncQueueService.enqueueSaleSync` after a successful order
  commit. The job carries `{ orderId, dispensaryId, attemptNumber }`.
- **Queue:** Single `metrc-sync` queue on Redis (BullMQ).
- **Worker:** `MetrcSyncProcessor` (NestJS `WorkerHost`). One worker
  per API process. The job calls `MetrcService.syncSaleToMetrc`,
  which POSTs to the per-dispensary Metrc endpoint and writes a row
  in `metrc_sync_logs`.
- **Retry policy:** 5 attempts with exponential backoff
  (1 min → 2 min → 4 min → 8 min → 16 min).
- **Retention:** `removeOnComplete: 100`, `removeOnFail: 200` —
  keeps the most-recent 200 failed jobs for forensic inspection;
  older jobs are evicted to control Redis memory.

The `enqueueRetryFailed` path runs separately and only operates on
orders that the DB marks `metrcSyncStatus = 'failed'` + `orderStatus
= 'completed'`. It enqueues a fresh 3-attempt cycle with 30 s
exponential backoff.

---

## Worker-crash recovery

BullMQ uses Redis as the source of truth for job state. When the
worker process crashes mid-job:

1. The job's lock (default 30 s) expires.
2. The next time the stalled-job check runs (default every 30 s),
   BullMQ detects the lock-without-progress and re-queues the job.
3. The re-queued job counts against `maxStalledCount` (default 1).
   On a single crash → re-queue and try again. On a second stall →
   the job moves to `failed` and the BullMQ failed bin retains it.

**The job is never silently lost.** If the API has been up for at
least 60 s since a crash and the job hasn't been retried, something
is wrong with the worker (not the queue) — inspect logs and
container state.

---

## Operator commands

All three are GraphQL operations under `apps/api/src/modules/metrc/metrc.resolver.ts`.

### `failedMetrcSyncs(dispensaryId)`

**Roles:** `budtender`, `dispensary_admin`, `org_admin`, `super_admin`
(dispensary_admin scoped to own tenant).

Returns the per-order DB view. Use this first when a customer
complains about a missing receipt. Each item carries `orderId`,
`metrcSyncStatus`, `lastSyncAttempt`, `lastSyncError`, and
`attemptCount`. A non-null `lastSyncError` is the body Metrc returned
on the last attempt.

### `retryFailedMetrcSyncs(dispensaryId)`

**Roles:** `dispensary_admin`, `org_admin`, `super_admin` (scoped).

Re-enqueues every `failed` + `completed` order from the orders table
with a fresh 3-attempt cycle. Use after fixing whatever caused the
underlying failure (revoked credentials, Metrc downtime, wrong
package label).

Returns the number of retry jobs enqueued.

### `metrcSyncQueueStats` (sc-608)

**Roles:** `super_admin` only.

Live BullMQ counts: `waiting`, `active`, `failed`, `completed`,
`delayed`. Use to answer "is the queue moving?" — pair with
`failedMetrcSyncs` to identify specific stuck orders.

If `active` stays > 0 with no progress for several minutes →
worker is stuck. Restart the API process; BullMQ will recover the
in-flight job via the stalled-job mechanism above.

---

## Common failure modes

| Symptom | Likely cause | Action |
| --- | --- | --- |
| `lastSyncError` mentions 401 / 403 | Revoked Metrc credentials | Re-upload credentials via the admin UI → run `retryFailedMetrcSyncs` |
| `lastSyncError` mentions a missing package label | Order references a variant without a Metrc UID | Tag the variant in admin → `retryFailedMetrcSyncs` |
| `lastSyncError` is empty / network timeout | Metrc API outage | Check `https://status.metrc.com`; the queue retries automatically — only run `retryFailedMetrcSyncs` if attempts were exhausted before the API came back |
| `metrcSyncQueueStats.active > 0` for > 5 min with no log progress | Worker stuck / DB transaction holding | Restart the API container; BullMQ's stalled-job check re-queues |
| `metrcSyncQueueStats.failed` grows but `failedMetrcSyncs` stays empty | DB row updated but queue job not cleaned up — should not happen | Open an incident; this would indicate a bug in `MetrcSyncProcessor.process` not awaiting the DB write |

---

## What's intentionally NOT here

- **Per-tenant queue stats.** The queue is global; partitioning by
  dispensary would require multi-queue routing in BullMQ. Today
  only super_admin can see queue stats. If a dispensary_admin asks
  "how is my dispensary's queue doing?" the answer is via
  `failedMetrcSyncs` (which is dispensary-scoped at the DB level).
- **Auto-retry on Metrc credential rotation.** Today an operator has
  to explicitly run `retryFailedMetrcSyncs` after re-uploading
  credentials. If this becomes a frequent operational pattern, file
  a follow-up to wire credential-rotation → auto-retry.
- **Dead-letter inspection of jobs that exhausted all 5 attempts AND
  weren't picked up by `enqueueRetryFailed`.** These exist only in
  the BullMQ failed bin (last 200) and the `metrc_sync_logs` table.
  No GraphQL surface exists. If needed, query via Redis CLI:
  `LRANGE bull:metrc-sync:failed 0 -1`.
