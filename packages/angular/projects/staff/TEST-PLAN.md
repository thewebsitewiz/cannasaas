# Test Plan — Staff POS

In-store Angular 21 POS for budtenders and shift leads. Inherits the conventions in [root `CLAUDE.md`](../../../../CLAUDE.md) and the per-app guidance in `apps/staff/CLAUDE.md` (now living next to the deleted React app — historical).

Tracked in [Testing — Staff (epic 504)](https://app.shortcut.com/cannasaas/epic/504) under [objective 230](https://app.shortcut.com/cannasaas/milestone/230).

---

## 1. Scope

This is a lean, recently-shipped-coverage plan. It covers:

- **§5 Smoke pass** — login → register open → take an order → close → logout.
- **§6 Feature cases** for register session enforcement, the low-stock toast surface (sc-229), and one or two cases per shipped page.
- **§7 Regression** — Angular 21 hard rules.

Out of scope: deep cases for every feature page (NewOrderPage, OrderQueuePage, TimesheetsPage, etc. each warrant their own deeper plan once they stabilize).

## 2. Severity scale

- **S1 — Blocker:** budtender can't process an order. Halt release.
- **S2 — Major:** workaround exists but flow is degraded.
- **S3 — Minor:** cosmetic.
- **S4 — Trivial:** polish.

---

## 5. Smoke pass

| ID | Case | Expected |
| --- | --- | --- |
| SMK-1 | Login as a budtender | Token + user written to localStorage; navigate into the shell. |
| SMK-2 | Empty-session pill shown | Shell header reads "Register closed · open" before `/register/open`. |
| SMK-3 | Open register | `/register/open` accepts opening cash; pill flips to "Open since HH:MM · $X drawer". |
| SMK-4 | New order placed | From `/`, add items, place an order — succeeds without 401. |
| SMK-5 | Close register | `/register/close` accepts closing cash; pill clears. |
| SMK-6 | Logout | Sign out from shell; localStorage cleared; navigate to `/login`. |

---

## 6. Feature cases

### 6.1 Authentication + dispensary scope

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-AUTH-001 | JWT decoded correctly | Login. | `StaffUser` signal has `id`, `email`, `role`, `dispensaryId`. |
| TC-AUTH-002 | dispensaryScopedGuard blocks no-tenant users | Force a user with no `dispensaryId` and `role !== 'super_admin'`. | Guard blocks entry; redirect to `/login`. |
| TC-AUTH-003 | super_admin bypasses scope | Login as `super_admin`. | Shell loads even without `dispensaryId`. |
| TC-AUTH-004 | Logout clears socket too | Sign out while a stock-alert socket is open. | Token rotation tears the socket down; new login spins up a fresh one. |

### 6.2 Register session enforcement

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-REG-001 | Open session sets pill | Open register with $100. | Pill renders "Open since {time} · $100.00 drawer". |
| TC-REG-002 | Closed session blocks routes | While closed, navigate directly to `/queue`. | Guard redirects to `/register/open?redirect=/queue`. |
| TC-REG-003 | Post-open redirect | After TC-REG-002 + open, on success. | Navigate back to `/queue`. |
| TC-REG-004 | Close clears pill | `/register/close` with closing cash. | Pill reverts to "Register closed · open". |
| TC-REG-005 | One open session per (dispensary, user) | Try to open a second session before closing the first. | API rejects; UI surfaces the conflict. |

### 6.3 Low-stock toast notifications (sc-229)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-TST-001 | Socket connects on login | Sign in. | DevTools → WS connection includes a Bearer token in handshake; gateway joins `staff:{dispensaryId}`. |
| TC-TST-002 | Low-stock alert renders amber | API emits `inventory.low_stock`. | Top-right toast renders with amber styling, product name, qty. |
| TC-TST-003 | Out-of-stock alert renders rose | API emits `inventory.out_of_stock`. | Toast renders with rose styling, "Out of stock" copy. |
| TC-TST-004 | Beep plays on unmuted toast | First alert with mute toggle OFF. | Audible 880 Hz beep ~0.2 s. (Note: browser autoplay may suppress until first user gesture.) |
| TC-TST-005 | Mute toggle silences beeps | Toggle mute; trigger an alert. | No audio. Visual toast still renders. |
| TC-TST-006 | Mute persists across reload | Mute, hard-reload. | Toggle still muted (localStorage `cs.staff.stockAlerts.muted=1`). |
| TC-TST-007 | Dedupe per productName | Trigger 3 alerts for product X in 10 s. | Only the latest renders; older ones hidden. |
| TC-TST-008 | Auto-dismiss after 8 s | Trigger an alert and don't interact. | Toast marks read and disappears within ~8 s. |
| TC-TST-009 | Click-through to inventory | Tap an active toast. | Navigate to `/inventory`. |
| TC-TST-010 | Dismiss button removes one toast | Tap the X. | That toast disappears; other toasts unchanged. |
| TC-TST-011 | Queue caps at 10 | Trigger 15 distinct alerts. | Only 10 most-recent kept in state. |
| TC-TST-012 | Token rotation re-opens socket | Force token refresh. | Old socket torn down; new one re-attaches to `staff:{dispensaryId}`. |

### 6.4 Shipped pages — smoke

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-PAGE-001 | NewOrderPage default route | Open session, navigate to `/`. | NewOrderPage renders. |
| TC-PAGE-002 | OrderQueuePage list | Open `/queue`. | Active orders list renders. |
| TC-PAGE-003 | TimesheetsPage | Open `/timesheets`. | Page renders without console errors. |
| TC-PAGE-004 | ProductLookupPage search | Type a query. | Results render. |
| TC-PAGE-005 | FulfillmentPage | Open `/fulfillment`. | Page renders. |
| TC-PAGE-006 | InventoryPage | Open `/inventory`. | Stock list + filter render. |

---

## 7. Regression — cross-cutting (Angular 21 hard rules)

| ID | Case |
| --- | --- |
| TC-REG-101 | `grep -rn '\*ngIf\|\*ngFor\|\*ngSwitch' packages/angular/projects/staff/src` returns nothing. |
| TC-REG-102 | Every component declares `ChangeDetectionStrategy.OnPush`. |
| TC-REG-103 | No `BehaviorSubject` used for component-visible state. |
| TC-REG-104 | No constructor-parameter injection; everything uses `inject()`. |
| TC-REG-105 | `ng build staff` clean. |

---

## 8. Open follow-ups

- Deep per-page plans (NewOrder cart edge cases, OrderQueue transitions, Fulfillment flow).
- Hardware soak on the target tablet (60 min) with an active register session.
