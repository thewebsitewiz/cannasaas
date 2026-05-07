# CLAUDE.md — apps/platform

Super-admin console for the CannaSaaS internal team. Cross-tenant operations, billing oversight, audit, support tooling. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5177`
**Audience:** CannaSaaS internal staff only (founders, support, ops)
**Auth:** required; restricted to users with `super_admin` role

---

## This app operates above the multi-tenant hierarchy

Unlike storefront/admin/staff/kiosk, **platform is not dispensary-scoped**. It views and manages the platform itself:

- All organizations, companies, dispensaries
- Aggregate billing, usage, and Metrc compliance state
- Cross-tenant audit logs
- Internal feature flags
- Support-ticket-style impersonation tooling

GraphQL operations from this app use platform-scoped resolvers that the API exposes only to `super_admin` users. **If a query requires a `dispensaryId`**, the user explicitly selects one in the UI — there is no implicit current dispensary.

---

## Tenant impersonation

A core platform feature is "view as dispensary" — operators inspect what an admin user would see for a given dispensary, for support purposes.

- Impersonation is **read-only by default.** Mutations require an explicit "enable write" toggle that audit-logs every action.
- Impersonation state lives in `ImpersonationService` — a signal holding `null | { dispensaryId, mode: 'read' | 'write' }`.
- An `ImpersonationBanner` component renders fixed at the top of the viewport whenever active. Visually obvious, hard to ignore.
- Impersonation does not log into the impersonated user's account — it scopes platform's own queries to that dispensary.

---

## RBAC

Stricter than admin. Every route requires `super_admin`:

```ts
{ path: '', canMatch: [authGuard, hasRoleGuard('super_admin')] }
```

There is no other role tier in this app. If a user without `super_admin` somehow lands here, hard-redirect to `/unauthorized`.

---

## Billing oversight (cannabis-friendly processor)

Platform shows aggregate billing data: subscription tier per organization, MRR/ARR, payment failures, cannabis-processor account status.

- All payment data comes from the API. **No processor SDK in this app.**
- Sensitive data (full account numbers, card details) is never returned by the API — only masked summaries and processor-issued IDs.
- Reconciliation jobs (Stripe-replacement processor → CannaSaaS internal records) live in the API as BullMQ jobs. Platform views their state and can manually retry, not run them locally.

---

## Audit log surface

Audit log is a append-only record of consequential actions across all tenants:

- User logins / failed logins
- Permission changes
- Order voids / refunds
- Metrc sync failures
- Impersonation start/stop and any mutations performed during impersonation
- Subscription changes

Platform exposes:

- A unified searchable log table (filter by tenant, actor, action type, date range).
- Per-dispensary "recent activity" tabs.
- Anomaly highlights (e.g., "5 failed logins in 10 minutes").

Pagination and search are server-side. `rxResource()` with debounced query signals.

---

## Common patterns this app uses

### Cross-tenant tables

Most tables span all organizations. Use signal-based query state + `rxResource()`. Default sort: most-recent activity first.

### Drill-down navigation

Click an organization → companies. Click a company → dispensaries. Click a dispensary → impersonation entry point. Use route-level resolvers to pre-fetch.

### Feature flag editor

Internal feature flags toggle in/out features per organization. Keep the editor simple — boolean flags with descriptions, no fancy targeting rules. If targeting becomes complex, that's a sign to build a separate flag service.

---

## Theme

Single internal theme, same as admin/staff. Platform is internal tooling — branding doesn't matter, clarity does.

---

## App-specific forbidden patterns

- Dispensary-scoped operations without explicit dispensary selection (no implicit "current dispensary").
- Impersonation that doesn't render the banner.
- Mutations during impersonation without audit logging.
- Direct payment processor SDK imports.
- Hardcoded organization or dispensary IDs.
- Routes accessible without `super_admin` role.
- Raw SQL or DB access — even for platform, all data flows through the API's GraphQL surface.

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/theme.dark.css';

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';
```

---

## Testing notes

- RBAC: test that non-`super_admin` users can't access any route in this app.
- Impersonation: write-mode requires explicit toggle, audit log entry per mutation.
- Cross-tenant queries: assert dispensary scope is explicit, never inferred.
- Audit log search: server-side only — verify no client-side filtering of sensitive fields.
