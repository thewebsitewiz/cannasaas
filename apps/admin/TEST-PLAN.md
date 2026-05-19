# Test Plan — Admin

Dispensary back-office, React 19 + Vite + TanStack Query + Zustand. Inherits the conventions in [root `CLAUDE.md`](../../CLAUDE.md) and [admin `CLAUDE.md`](./CLAUDE.md).

Tracked in [Testing — Admin (epic 503)](https://app.shortcut.com/cannasaas/epic/503) under [objective 230](https://app.shortcut.com/cannasaas/milestone/230).

---

## 1. Scope

This is a lean, recently-shipped-coverage plan. It covers:

- **§5 Smoke pass** — critical paths a dispensary admin needs to do their job (login, dashboard, settings, logout).
- **§6 Feature cases** for the recently-shipped low-stock widget (sc-227) and lightweight smoke on the larger forms.
- **§7 Regression** — guardrails on patterns the React codebase still has to honour.

Out of scope: deep cases for every page (TaxManagement, Theme designer, Payment Processors provisioning all have multi-form state worth exercising; file follow-up plans before any major change to those pages).

## 2. Severity scale

- **S1 — Blocker:** admin can't log in or perform a critical operation. Halt release.
- **S2 — Major:** workaround exists but flow is degraded.
- **S3 — Minor:** cosmetic or low-frequency.
- **S4 — Trivial:** polish.

---

## 5. Smoke pass (must run before every release)

| ID | Case | Expected |
| --- | --- | --- |
| SMK-1 | Login as a `dispensary_admin` user | Token + user written to sessionStorage; redirected to `/`. |
| SMK-2 | Dashboard renders | KPI cards, sales trend chart, top products, inventory health, low-stock widget all render without console errors. |
| SMK-3 | Settings → Theme | `/settings/theme` opens; preset switch live-previews. |
| SMK-4 | Settings → Payments | `/settings/payments` opens; both Aeropay + CanPay panels visible. |
| SMK-5 | Logout clears auth | Logout from AdminLayout → sessionStorage `cs_token` / `cs_user` cleared; navigate to `/login`. |

---

## 6. Feature cases

### 6.1 Authentication

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-AUTH-001 | Login happy path | Submit valid email + password ≥ 8 chars. | JWT decoded; `cs_token` + `cs_user` in sessionStorage with `dispensaryId`. Redirect to `/`. |
| TC-AUTH-002 | Login bad credentials | Wrong password. | Inline error; no sessionStorage write. |
| TC-AUTH-003 | Protected route redirect | Navigate to `/orders` while logged out. | Redirect to `/login`. |
| TC-AUTH-004 | Tax Rules link gated by role | View AdminLayout nav as a `dispensary_admin`. | "Tax Rules" link NOT visible. View as `super_admin` → visible. |
| TC-AUTH-005 | Logout clears organization context | Logout. | `useOrganizationStore` reset (no org / dispensary id in localStorage). |
| TC-AUTH-006 | Direct URL to `/tax-management` as super_admin | Sign in as `super_admin`; navigate directly to `/tax-management`. | TaxManagementPage renders. |
| TC-AUTH-007 | Direct URL to `/tax-management` as dispensary_admin | Sign in as `dispensary_admin`; navigate directly to `/tax-management`. | `RoleRoute` redirects to `/`. Page does not render. |
| TC-AUTH-008 | Direct URL to `/tax-management` as org_admin | Sign in as `org_admin`; navigate directly. | Same as TC-AUTH-007: redirect to `/`. |

### 6.2 Dashboard — low-stock widget (sc-227)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-LSW-001 | Empty state | Tenant with no low-stock items. | "Stock levels look healthy — no alerts." |
| TC-LSW-002 | Seed-only render | Dashboard query returns 3 low-stock items. | All 3 render with the seed badge color; live indicator shows "live" but no live entries. |
| TC-LSW-003 | Live event flips a card | Staff InventoryPage adjusts a visible variant to status `low_stock`. | Within ~1 s, a "live" row appears at the top of the widget with that productName. |
| TC-LSW-004 | Live overrides seed for the same product | A seed row exists for product X; a live `out_of_stock` event arrives for X. | The seed row disappears; the live row replaces it (out_of_stock styling). |
| TC-LSW-005 | Dedupe across many events for same product | Trigger 5 events for product X over 10 s (varying status). | Widget shows the latest one only — no stacked duplicates. |
| TC-LSW-006 | Queue caps at 20 alerts | Trigger 25 distinct alerts. | Hook keeps ≤ 20 in state; the oldest are evicted. |
| TC-LSW-007 | Click-through to inventory | Tap "View all inventory →". | Navigate to `/inventory`. |
| TC-LSW-008 | Socket reconnects after API blip | Stop API for 30 s, restart. | Socket reconnects; subsequent events still update the widget. |
| TC-LSW-009 | Token rotation reopens the socket | Force a logout + re-login. | Old socket closed; new socket opens with the new token. |

### 6.3 Settings — theme + payments smoke

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-SET-001 | Theme preset switch live-previews | On `/settings/theme`, switch preset. | Color tokens update in the preview pane without reload. |
| TC-SET-002 | Payment processor toggle | Toggle Aeropay enabled/disabled. | Save mutation runs; processor card reflects new state on reload. |
| TC-SET-003 | Cash discount slider save | Move the slider; click Save. | Success toast for ~3 s. |

### 6.4 Heavy-form smoke (one case each — file deep cases later)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-FRM-001 | Menu Categories drag-to-reorder | Drag a category up; save. | Order persists across reload. |
| TC-FRM-002 | Tax Management add rule | Add a new tax rule; save. | Rule appears in list scoped to chosen state. |

---

## 7. Regression — cross-cutting

| ID | Case | Notes |
| --- | --- | --- |
| TC-REG-001 | No Stripe references | `grep -rn '@stripe\|Stripe(' apps/admin/src` returns nothing. |
| TC-REG-002 | Admin theme is fixed | Only one theme CSS is imported in `src/styles.css`; no `data-theme` switching at runtime. |
| TC-REG-003 | All routes behind ProtectedRoute | `App.tsx` — every non-`/login` route is wrapped. |

---

## 8. Open follow-ups

- Per-page deep cases for TaxManagement, ThemePage, PaymentProcessorsPage, MenuCategoriesPage.
- RBAC currently only gates `/tax-management` (super_admin). Other routes that should be role-gated per the admin CLAUDE.md hierarchy (e.g. `/settings/payments` for dispensary_admin+, `/onboarding` for org_admin+) still rely on `ProtectedRoute` token-only. File deeper hardening stories before any prod tenant has multiple operator roles using the same login.
