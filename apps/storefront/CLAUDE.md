# CLAUDE.md — apps/storefront

Customer-facing dispensary storefront. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5173`
**Audience:** anonymous customers + authenticated dispensary customers
**Auth:** optional for browsing, required for checkout

---

## Tenant resolution

Storefront serves **one dispensary per request**, resolved from the URL:

- Production: subdomain (`{slug}.cannasaas.com`)
- Local dev: path prefix (`localhost:5173/{slug}`)

A `DispensaryResolver` (functional `ResolveFn`) reads the slug, fetches the dispensary via GraphQL, and provides it via DI. **Every downstream service and component should accept the dispensary from DI**, not re-resolve it.

If the slug is invalid or the dispensary is inactive: redirect to a generic landing page with no tenant context.

---

## Per-tenant theme injection

Storefront is the **only app with dynamic per-tenant theming**.

**Static baseline:** `index.html` `<link>`s `@cannasaas/ui/themes/all-themes.css` (the design-system baseline — portal activation via `[data-portal]`, ~5200 lines).

**Dynamic per-tenant theme:** an `AppThemeService` queries `theme_configs` for the current dispensary on app init, then sets `document.documentElement.dataset.theme = '<theme-slug>'`. Theme files use `:root[data-theme="X"]` specificity so the switch is attribute-only — no CSS reload.

- Allowed theme slugs are whitelisted in `AppThemeService.ALLOWED_THEMES` — same set as the React `ThemeProvider`. Update both during the migration window.
- `AppThemeService` exposes `currentTheme = signal<ThemeSlug>(...)` so components can react.
- Falls back to `dark` if `theme_configs` returns no row.

**Do not introduce a third theming mechanism.** The two parallel systems (theme-presets + design-systems) are tech debt being unified post-launch.

---

## Age verification (21+ gate)

Hard requirement. Every dispensary has a 21+ access gate.

- Implemented as a route guard (`canMatch: [ageVerifiedGuard]`) wrapping all customer-facing routes.
- Verification persists in `localStorage` (`cs:age-verified:{dispensary-id}:1`) for 24 hours.
- The gate component is **not** lazy-loaded — it's part of the initial bundle so verification can resolve before any product data renders.
- Compliance note: do not show product imagery, prices, or strain content before verification. Hero/branding-only content is OK.

---

## SSR

Storefront uses **Angular Universal SSR** (`@angular/ssr`). SEO is a hard requirement — dispensaries care about search.

- Product detail pages SSR with the resolved dispensary's product data.
- Cart and account routes are CSR-only (`renderMode: 'client'`).
- `transferState` to hydrate Apollo cache from server to client. No double-fetching.
- Image domains for `NgOptimizedImage` are configured in `app.config.server.ts` per environment.

---

## Cart, checkout, payments

- Cart state: signal-based service in `packages/stores` (or `apps/storefront/src/app/cart`), persisted to `localStorage` keyed by dispensary ID.
- Checkout flow calls dispensary-scoped GraphQL mutations only — `createOrder`, `confirmPayment`. No payment processor SDK on the client.
- The cannabis-friendly payment processor (replacing Stripe) returns a redirect URL or a tokenized form; the frontend handles whichever pattern the API exposes.
- **Stripe is forbidden.** If you see `@stripe/*` in this app, remove it.

---

## Lazy loading + performance

- Every feature route is lazy-loaded.
- `@defer` blocks for below-the-fold content (related products, reviews, store info).
- `NgOptimizedImage` for all product images.
- Critical CSS path: only `styles.css` + Tailwind output ship in the initial chunk.

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/all-themes.css';

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';

/* Customer-facing only — set sane defaults for the public document. */
:root {
  color-scheme: light dark;
}
```

---

## App-specific forbidden patterns

- Direct payment processor SDK imports. **The frontend never holds processor keys.**
- `localStorage` writes outside `cart`, `age-verified`, and theme preference. PII (addresses, payment details) goes to the API.
- Hardcoded dispensary IDs or slugs anywhere in code (use the resolver).
- Third theming mechanism beyond the existing two.
- Server-side imports (`fs`, `path`) in components — keep them in SSR-only files.

---

## Testing notes

- Test the age gate guard with `provideExperimentalZonelessChangeDetection()` if the rest of the app is Zone-based — the gate is performance-sensitive.
- Mock `AppThemeService` in component tests; don't trigger real `<link>` injection.
- SSR snapshot tests for product detail pages — they're SEO-critical.
