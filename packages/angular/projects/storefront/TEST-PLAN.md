# Test Plan — Storefront

Customer-facing Angular 21 dispensary site on `:5273`. CSR-only, per-tenant subdomain (prod) / path-prefix (dev) resolution, optional account auth (required for checkout), age gate, live WS stock updates.

Inherits the conventions in [root `CLAUDE.md`](../../../../CLAUDE.md) and [storefront `CLAUDE.md`](./CLAUDE.md).

---

## 1. Scope & strategy

### In scope
- Every route in `app.routes.ts`: `/`, `/products`, `/products/:id`, `/cart`, `/login`, `/register`, `/checkout`, `/express-checkout`, `/orders`, `/orders/:id`, `/account`, `/account/verify`.
- Core services: `DispensaryContextService`, `AuthService`, `CartService`, `AgeGateService`, `AppThemeService`, `PaymentMethodService`, `PaymentFlowService`, `DeliveryService`, `OrderSocketService`, `StockUpdatesService`, `CartStockGuardianService`.
- Real-time integrations: `stock:changed` (anonymous storefront room), `order:update`, `delivery:update`.
- Both processor paths (`canpay`, `aeropay`) plus the `cash` no-redirect path.

### Out of scope
- The web-of-trust for processor webhooks — covered by `apps/api` integration tests.
- Email content of order-status notifications — covered by `apps/api` listener tests.

### Test layers
| Layer | Runner | Owner | Trigger |
| --- | --- | --- | --- |
| Unit | Vitest (`ng test storefront`) | Eng on PR | Every push |
| Integration (service ↔ Apollo / socket mocks) | Vitest | Eng on PR | Every push |
| Manual smoke (this doc § 5) | QA | Before release | Each release branch |
| Manual feature (this doc § 6+) | QA | Before release | Each release branch |
| Multi-tenant smoke (this doc § 9) | QA | Monthly + after any tenant-resolution change | Cron + ad hoc |

### Test environments
| Env | API | Tenant URL pattern |
| --- | --- | --- |
| Local | `http://localhost:3000/graphql` | `localhost:5273/{slug}` |
| Sandbox | `https://api-sandbox.cannasaas.com` | `{slug}.sandbox.cannasaas.com` |
| Production | `https://api.cannasaas.com` | `{slug}.cannasaas.com` |

### Test data prerequisites
- **Two active dispensaries**, slugs `acme` and `omega`, with different themes and different payment-method configs (`acme`: cash+canpay; `omega`: cash+aeropay).
- **One inactive dispensary**, slug `archived`.
- For each: ≥10 products spanning Indica, Sativa, Hybrid; one with **0 stock** and one with **1 unit** for the eviction case.
- **One delivery zone** seeded for `acme` covering a known lat/lng; `omega` is pickup-only.
- **Two member accounts**:
  - `verified@example.com` — age-verified.
  - `unverified@example.com` — registered but `ageVerified: false`.
- **One walk-in / anonymous** browser session for age-gate cases.
- Time-slot rows seeded for at least the next 48 hours.

### Severity scale
- **S1 — Blocker:** Customer cannot place an order. Halt release.
- **S2 — Major:** Workaround exists but flow is degraded. Fix before release.
- **S3 — Minor:** Cosmetic or low-frequency. Ship with bug filed.
- **S4 — Trivial:** Polish. Backlog.

---

## 2. Entry & exit criteria

**Entry to QA pass**
- All Vitest suites green; `ng build storefront` clean.
- Sandbox API seeded with the test data above.
- At least one canpay sandbox account + one aeropay sandbox account configured against `acme` / `omega` respectively.

**Exit (ready to release)**
- §5 smoke passes on both `acme` and `omega` in sandbox.
- All §6 feature cases pass on `acme` (delivery + cash + canpay) and the §6.8 + §6.10 cases that are aeropay-specific pass on `omega`.
- §9 multi-tenant smoke passes.
- Zero open S1 / S2.
- A known broken-WS scenario (API down) has been visually verified — the app degrades gracefully.

---

## 3. Automated coverage target

| Service / component | Required spec |
| --- | --- |
| `DispensaryContextService` | Slug resolution via path + subdomain; null on invalid; signal updates downstream |
| `AuthService` | login / register / logout; in-flight refresh dedup; 401 from GraphQL triggers refresh; JWT decode of `ageVerified` claim |
| `CartService` | add (new + increment), updateQuantity (cap, zero), removeItem, localStorage round-trip, single-key per browser (NOT per-tenant — documented) |
| `AgeGateService` | sessionStorage round-trip, `confirmed` signal flips on `confirm()` |
| `AppThemeService` | Whitelist enforcement; fallback to `dark` on unknown preset; `data-theme` attribute set |
| `StockUpdatesService` | Anonymous handshake variables; `stock:changed` ingest; teardown on tenant change; tenant-clear empties map |
| `CartStockGuardianService` | out_of_stock evicts; low_stock does not; dismiss removes one entry; cap-5 FIFO |
| `OrderSocketService` | Lazy connect (refcount), token rotation, `order:update` + `delivery:update` filtering |
| `DeliveryService` | Eligibility shape, zone list shape, time slots query variables |
| `PaymentFlowService` | externalUrl redirect path vs in-app confirmation path |
| `ProductCard` / `ProductDetailPage` | Live stock overlays initial query stockStatus; live `available` preferred for max-qty cap |
| Checkout | Address validity gate, can-place-order gate, scheduledFor wiring, payment branch dispatch |

> **Heuristic:** Anything with deterministic logic and no API → unit test. Anything with the real API or a real socket → manual.

---

## 4. Test data table

| Alias | Value | Used in |
| --- | --- | --- |
| `ACME_SLUG` | `acme` | All multi-tenant + delivery cases |
| `OMEGA_SLUG` | `omega` | Pickup-only + aeropay |
| `ARCH_SLUG` | `archived` | TC-TEN-004 |
| `VERIFIED_EMAIL` | `verified@example.com` | Checkout, account |
| `UNVERIFIED_EMAIL` | `unverified@example.com` | Verify-age flow |
| `ADDR_IN_ZONE` | line1 / city / state / postal of an address inside the acme delivery zone | TC-CO-010, TC-CO-012 |
| `ADDR_OUT_OF_ZONE` | An address outside any zone | TC-CO-013 |
| `KNOWN_LAT_LNG` | lat/lng matching `ADDR_IN_ZONE` | TC-CO-014 |
| `PROD_LIVE_STOCK_1` | Product id whose only in-stock variant has stock 1 | TC-STOCK-002 |
| `PROD_OOS` | Product id all variants stock 0 | TC-STOCK-001 |

---

## 5. Smoke pass (must run before every release)

> Time-box: < 15 min. Run on the release branch in sandbox against **both** `ACME_SLUG` and `OMEGA_SLUG`.

| ID | Case | Expected |
| --- | --- | --- |
| SMK-1 | Tenant resolves (path prefix on local) | `/acme/` renders home; theme applied; no fallback. |
| SMK-2 | Age gate appears for anonymous session | Fresh sessionStorage → modal blocks content. |
| SMK-3 | Age gate confirm grants access | After confirm, products render; modal does not re-appear. |
| SMK-4 | Browse → product detail | Tap a card → detail renders with variant + price. |
| SMK-5 | Login | Sign in as `VERIFIED_EMAIL`; `/account` accessible. |
| SMK-6 | Cart add | Add 1 item; `/cart` shows the line. |
| SMK-7 | Cash checkout (pickup) | Place a pickup-cash order; redirect to `/orders/:id`; status `pending`. |
| SMK-8 | Order tracking renders | `/orders/:id` shows current status. |
| SMK-9 | Logout | Logout from `/account`; `/account` redirects to `/login`. |

Failure of any SMK → release blocked.

---

## 6. Feature test cases

### 6.1 Tenant resolution

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-TEN-001 | Path prefix (local) | Navigate to `localhost:5273/acme`. | `DispensaryContextService.entityId()` populated; theme applied. |
| TC-TEN-002 | Subdomain (sandbox) | Open `acme.sandbox.cannasaas.com`. | Same as TC-TEN-001. |
| TC-TEN-003 | No slug + no default | Open root `localhost:5273/` with `defaultDispensarySlug: null`. | Generic landing UI; no product calls fired. |
| TC-TEN-004 | Inactive dispensary | Open `archived.sandbox.cannasaas.com`. | Resolver returns null; landing UI; no theme override. |
| TC-TEN-005 | Bad slug | Open `nonexistent.sandbox.cannasaas.com`. | Same as TC-TEN-004; no console errors. |
| TC-TEN-006 | Slug change mid-session | Browse `acme`, then navigate the address bar to `omega`. | `DispensaryContextService.current` swaps; cart is NOT cleared (documented — cart is browser-scoped). |

### 6.2 Theme injection

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-THM-001 | Theme applied | Open a tenant configured for the `casual` theme. | `<html data-theme="casual">`; CSS vars reflect that theme. |
| TC-THM-002 | Unknown preset falls back | Force a tenant's `theme_configs.preset` to `unknown`. | Falls back to `dark`; no JS error. |
| TC-THM-003 | Switching tenants reapplies | Path-switch between two tenants with different presets. | `data-theme` attribute updates; no visual flash beyond one paint. |
| TC-THM-004 | No `theme_configs` row | Tenant has no row. | Default theme `dark`; landing renders. |

### 6.3 Age gate

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-AGE-001 | Anonymous gate fires | Fresh session, navigate to `/products`. | Modal blocks product list; "I'm 21+" + "Under 21" buttons. |
| TC-AGE-002 | Confirm persists for session | After confirm, navigate to `/cart`. | No re-prompt. |
| TC-AGE-003 | Reload re-confirms (session) | After confirm, hard-reload. | sessionStorage key persists → no re-prompt. (Per `apps/storefront/CLAUDE.md`, sessionStorage is the right scope; revisit if compliance asks for 24-hour rule.) |
| TC-AGE-004 | New tab re-prompts | Open a second tab to the same tenant. | sessionStorage isolated per tab — modal re-appears in the new tab. |
| TC-AGE-005 | Under-21 path | Tap "Under 21". | Redirects to a compliance landing / generic page; no product imagery exposed. |
| TC-AGE-006 | Verified member auto-bypasses | Sign in as `VERIFIED_EMAIL` whose `ageVerified` claim is true. | No modal on first visit. |
| TC-AGE-007 | Unverified member still gates | Sign in as `UNVERIFIED_EMAIL`. | Modal still gates content. |

### 6.4 Home — `/`

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-HOME-001 | Renders branding | After age gate, view `/`. | Header, hero, footer present; no product calls fired here. |
| TC-HOME-002 | Header CTA → menu | Tap **Menu** in header. | Navigate to `/products`. |
| TC-HOME-003 | Express CTA → express | Tap **Express**. | Navigate to `/express-checkout`. |

### 6.5 Product browse — `/products`

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-PROD-001 | Initial render | Open `/products`. | `ProductsGQL` fires once with `dispensaryId`; grid renders. |
| TC-PROD-002 | Search debounce | Type "blue" into the search field, character-by-character. | One `AutocompleteProductsGQL` call after 200 ms of inactivity, with `query: 'blue'`. |
| TC-PROD-003 | Search < 2 chars | Type "b". | No autocomplete call. |
| TC-PROD-004 | Strain filter | Tap **Indica**. | Query-param `strain=indica`; client-side filter applied to grid. |
| TC-PROD-005 | Combine search + strain | Search "diesel", filter Sativa. | Both filters apply. |
| TC-PROD-006 | Empty result | Search "xxxxxxx". | Empty-state copy renders; grid hidden. |
| TC-PROD-007 | Network error | Stop API, reload. | Inline error banner; no app crash. |
| TC-PROD-008 | Card → detail | Tap a card. | Navigate to `/products/:id`. |
| TC-PROD-009 | Live stock badge on card | While viewing list, trigger a stock_changed event for a visible variant via staff InventoryPage to set status to `out_of_stock`. | Card flips to "Sold Out" badge within ~1 s; Add button disabled. |
| TC-PROD-010 | Live low-stock | Same as TC-PROD-009 but to `low_stock`. | Badge flips to "Low Stock" amber. |
| TC-PROD-011 | List re-render efficiency | Trigger 5 stock events in quick succession. | No layout thrash; final state matches last event. |

### 6.6 Product detail — `/products/:id`

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-PDP-001 | Initial render | Open a known product. | Variants list, price, stock, THC/CBD render. |
| TC-PDP-002 | Variant switch updates price | Tap a non-default variant. | Price updates. |
| TC-PDP-003 | Variant switch resets stepper | Set qty 3, switch variant. | Qty resets to 1. |
| TC-PDP-004 | Add-to-cart loop | Set qty 3, tap Add to Cart. | `CartService.items()` reflects qty 3 for the variant; "Added to Cart" success briefly renders. |
| TC-PDP-005 | Max-qty cap | Set qty above `stockQty`. | Stepper inc disabled at `maxAddable`. |
| TC-PDP-006 | Already-in-cart deducts from max | Cart already has 2 of variant with stock 5; open detail. | maxAddable = 3. |
| TC-PDP-007 | Out-of-stock badge | Open `PROD_OOS`. | "Sold Out" overlay; Add disabled. |
| TC-PDP-008 | Live stock overrides query | Open product, then trigger WS `stock:changed` to flip it to `out_of_stock`. | Badge + stepper update without refresh. |
| TC-PDP-009 | Back navigation | Use the Back chevron. | Returns to the previous route, preserving `/products` scroll position. |
| TC-PDP-010 | Not found | Open `/products/not-a-real-id`. | "Product not found" renders. |

### 6.7 Cart — `/cart` + live stock eviction

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-CART-001 | Empty state | Fresh session, open `/cart`. | Empty-cart UI. |
| TC-CART-002 | Add increments qty | Add same variant twice. | One line, qty 2. |
| TC-CART-003 | Distinct variants → distinct lines | Add two variants of one product. | Two lines. |
| TC-CART-004 | Qty stepper caps | Try to set qty past `maxQuantity`. | Capped silently. |
| TC-CART-005 | Quantity to zero removes | Decrement to zero. | Line removed. |
| TC-CART-006 | localStorage persists | Refresh page. | Cart contents intact. |
| TC-CART-007 | Cart is isolated per tenant (sc-605) | Add items on `acme`, switch path to `omega`. | Cart on `omega` is empty. Switch back to `acme` — original items restored. localStorage has separate `cs.storefront.cart:<dispensaryId>` keys per tenant. |
| TC-CART-008 | OOS eviction toast | With items in cart, trigger a WS `stock:changed` `out_of_stock` event for one of them. | Item removed from cart; bottom-right toast: "Sold out — removed from cart" with product + variant name. |
| TC-CART-009 | Toast dismiss button | After TC-CART-008. | Tap X — toast disappears; item stays removed. |
| TC-CART-010 | Multiple evictions stacked | Trigger OOS on 3 items in cart. | Up to 5 toasts visible; FIFO cap enforced. |
| TC-CART-011 | Low-stock does not evict | Trigger `low_stock` for a cart item. | Item stays in cart; no toast. |

### 6.8 Auth

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-AUTH-001 | Register | Open `/register`; submit a fresh email + password. | `RegisterGQL` succeeds; auto-login; redirect to `/account`. |
| TC-AUTH-002 | Register — duplicate email | Submit `VERIFIED_EMAIL`. | Inline error from API; no token written. |
| TC-AUTH-003 | Login happy | `/login` with `VERIFIED_EMAIL`. | Token in `cs.storefront.accessToken`; user signal populated. |
| TC-AUTH-004 | Login bad creds | Wrong password. | Inline error; no token written. |
| TC-AUTH-005 | Refresh on 401 | Run any logged-in op; force-expire the access token mid-flight (DevTools). | Refresh endpoint hit once; original op retries and succeeds; only one refresh call in network panel even with rapid retries (dedup). |
| TC-AUTH-006 | Logout | `/account` → logout. | Token cleared; navigate to `/`; protected routes redirect to `/login`. |
| TC-AUTH-007 | Redirect param | Navigate to `/checkout` while logged out. | `/login?redirect=/checkout`; after login, navigate back to `/checkout`. |

### 6.9 Account & verify age

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-ACC-001 | Account renders | Sign in, open `/account`. | Email, name, role render. |
| TC-ACC-002 | Loyalty card defer | Scroll to loyalty card. | `MyLoyaltyGQL` only fires when the deferred block enters viewport. |
| TC-ACC-003 | Unverified path | Sign in as `UNVERIFIED_EMAIL`. | "Verify Age to Order" link visible. |
| TC-ACC-004 | Verify flow | Tap "Verify Age"; complete the vendor flow (sandbox); return. | `VerifyAgeGQL` succeeds; `AuthService.setAgeVerified(true)` runs; `/account` shows verified badge. |
| TC-ACC-005 | Verification persists across token refresh | After TC-ACC-004, force a token refresh. | Refreshed token's `ageVerified` claim true; UI stays verified. |

### 6.10 Checkout — pickup

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-CO-001 | Auth required | Open `/checkout` logged out. | Redirect to `/login?redirect=/checkout`. |
| TC-CO-002 | Empty cart | Logged in, empty cart, open `/checkout`. | Empty-cart UI; Place Order disabled. |
| TC-CO-003 | Pickup default | Add an item; open checkout. | Fulfillment toggle defaults appropriately for tenant (pickup if delivery disabled). |
| TC-CO-004 | Pickup cash | Pickup + cash + ASAP. | `CreateOrderGQL` with `orderType: 'pickup'`, no address; redirect to `/orders/:id`. |
| TC-CO-005 | Pickup scheduled | Pickup + pick a time slot. | `scheduledFor` populated in input; order shows the slot. |
| TC-CO-006 | Tax calc | Subtotal $100 at 22%. | Tax $22, total $122. |
| TC-CO-007 | Place-button disabled while in-flight | Tap Place Order, rapid second tap. | Second tap ignored; single mutation in network panel. |
| TC-CO-008 | API error | Stop API, place order. | Inline error banner; cart not cleared. |
| TC-CO-009 | Cart cleared on success | After TC-CO-004. | localStorage cart empty; `/orders/:id` rendered. |

### 6.11 Checkout — delivery (acme only)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-CO-010 | Address validity gate | Toggle delivery; leave city blank. | Place Order disabled; inline message names the missing field. |
| TC-CO-011 | State 2-char enforced | Enter "NewYork" in state. | Validation message; uppercase forced for 2-char input. |
| TC-CO-012 | Eligible address | Enter `ADDR_IN_ZONE`. | `CheckDeliveryEligibilityGQL` fires; eligibility = true; zone name shown; delivery fee from zone. |
| TC-CO-013 | Out-of-zone address | Enter `ADDR_OUT_OF_ZONE`. | Eligibility = false; reason copy shown; Place Order disabled. |
| TC-CO-014 | Geolocation auto-fill | Tap "Use my location"; allow prompt; mock lat/lng = `KNOWN_LAT_LNG`. | Fields populate; eligibility re-checks; zone displayed. |
| TC-CO-015 | Geolocation denied | Deny the browser prompt. | Inline "Location permission denied" copy; fields stay manual. |
| TC-CO-016 | Time slot | Open scheduled-delivery picker. | `AvailableTimeSlotsGQL` fires with `slotType: 'delivery'`. |
| TC-CO-017 | Pickup-only tenant hides delivery toggle | Open checkout on `OMEGA_SLUG`. | Toggle not rendered; only pickup path available. |
| TC-CO-018 | Delivery happy path | Place a delivery order with cash. | `CreateOrderGQL` succeeds with `orderType: 'delivery'` + `deliveryAddress` + `scheduledFor`; redirect to `/orders/:id`. |

### 6.12 Checkout — payments

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-PAY-001 | Cash | Place a cash order. | No `InitiateCashlessPaymentGQL` call; redirect to `/orders/:id`. |
| TC-PAY-002 | CanPay redirect | On `acme`, select canpay. | `InitiateCashlessPaymentGQL` fires; if `externalUrl` present → `window.location` replaced with that URL. |
| TC-PAY-003 | Aeropay redirect | On `omega`, select aeropay. | Same shape as TC-PAY-002 but provider `aeropay`. |
| TC-PAY-004 | Processor returns no externalUrl | Mock the mutation to return only `referenceId`. | App routes to `/orders/:id` and waits for webhook-driven status flip. |
| TC-PAY-005 | Method not enabled hidden | Aeropay disabled on `acme`. | Option not visible in the selector. |
| TC-PAY-006 | Stripe never appears | Audit checkout source. | No string `stripe` or `@stripe/*` import anywhere in the storefront tree. |

### 6.13 Express checkout — `/express-checkout`

> Confirm the implementation details with eng before running these — the route exists but the component requires audit.

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-EXP-001 | Route reachable | Open `/express-checkout`. | Page renders without errors. |
| TC-EXP-002 | Auth required (assumed) | Open logged out. | Redirect to `/login?redirect=/express-checkout`. |
| TC-EXP-003 | Happy path | TBD on impl review. | TBD. |

### 6.14 Orders list — `/orders`

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-ORD-001 | List renders for member | Sign in with prior orders. | `MyOrdersGQL` fires; list shows reverse-chrono. |
| TC-ORD-002 | Empty state | New member, no orders. | Empty-state copy. |
| TC-ORD-003 | Row → tracking | Tap a row. | Navigate to `/orders/:id`. |

### 6.15 Order tracking — `/orders/:id`

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-TRK-001 | Initial load | Open the route post-checkout. | `OrderGQL` returns the order; timeline renders. |
| TC-TRK-002 | WS live status — pickup | While viewing, have staff move the order `confirmed → preparing → ready → completed`. | Timeline updates in-place without refresh. |
| TC-TRK-003 | WS live status — delivery | Same for a delivery order through `out_for_delivery → delivered`. | Timeline updates; trip info appears on `delivery:update`. |
| TC-TRK-004 | Anonymous tracking link | Open `/orders/:id` for a walk-in order in an incognito tab. | Page renders (route allows anonymous); status visible. |
| TC-TRK-005 | Bad order id | Open `/orders/00000000-0000-0000-0000-000000000000`. | Not-found UI. |
| TC-TRK-006 | WS reconnect after disconnect | While viewing, stop the API for 30 s, then restart. | Socket reconnects; status remains accurate. |

### 6.16 Stock real-time (cross-cutting WS)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-STK-001 | Connection established anonymously | Open the app; in DevTools Network → WS, inspect the handshake. | `auth.storefrontDispensaryId` present; no JWT. |
| TC-STK-002 | Public projection only | Inspect a `stock:changed` event payload. | Only `variantId`, `available`, `status`, `timestamp` (+ `type`). No `productName` or threshold. |
| TC-STK-003 | Reconnect after API blip | Stop API for 30 s, restart. | Client reconnects without manual refresh; no toast spam. |
| TC-STK-006 | Connection banner appears during outage (sc-606) | After the storefront has connected once, stop API for 30 s. | "Reconnecting — live updates paused" pill renders within ~5 s. Banner clears once the socket reconnects. |
| TC-STK-007 | Cold-boot does not flash the banner (sc-606) | Reload with API up. | Banner never renders during the initial connect handshake. |
| TC-STK-008 | Reconnects indefinitely (sc-606) | Stop API for 5 min, then restart. | Storefront still reconnects without page refresh. (Pre-sc-606 the 10-attempt budget left the client stranded after ~10 s.) |
| TC-STK-004 | Tenant change resets map | Path-switch tenants. | Old `StockUpdate` map cleared; new socket opens against the new tenant. |
| TC-STK-005 | Last-event-wins per variant | Send rapid `low_stock` then `in_stock` for the same variant. | UI ends at `in_stock`. |

### 6.17 Order socket (member-facing)

| ID | Case | Steps | Expected |
| --- | --- | --- | --- |
| TC-OS-001 | Auto-join on login | Sign in. | Socket opens with JWT in `auth.token`; gateway auto-joins `user:{id}`. |
| TC-OS-002 | Refcount close on last unsubscribe | Open `/orders/:id`, then navigate to `/account`. | Subject closes if no other subscribers; reopens when next page subscribes. |
| TC-OS-003 | Token rotation re-opens | Force a token refresh while listening. | Socket torn down + reopened with the new token; no event loss for ≥ 1 s gap is acceptable. |

---

## 7. Regression — cross-cutting

| ID | Case |
| --- | --- |
| TC-REG-001 | No `@angular/ssr` import anywhere (`grep -rn "@angular/ssr"`). |
| TC-REG-002 | No `provideClientHydration` call. |
| TC-REG-003 | No `@stripe` / `Stripe(` reference. |
| TC-REG-004 | No `*ngIf` / `*ngFor` / `*ngSwitch` (grep). |
| TC-REG-005 | Every component declares `ChangeDetectionStrategy.OnPush`. |
| TC-REG-006 | No `BehaviorSubject` outside RxJS bridges. |
| TC-REG-007 | All routes lazy-loaded except the age-gate component. |
| TC-REG-008 | `ng build storefront` chunk-size budget unchanged ± 10 KB on initial bundle. |

---

## 8. Non-functional

| ID | Case | Threshold |
| --- | --- | --- |
| NFR-PERF-001 | First contentful paint on `/` | < 1.5 s on Fast 3G. |
| NFR-PERF-002 | LCP on `/products` | < 2.5 s on Fast 3G. |
| NFR-PERF-003 | Search debounce respects 200 ms | Verified in TC-PROD-002. |
| NFR-A11Y-001 | Tab traversal | Header → nav → grid → product card → footer in document order. |
| NFR-A11Y-002 | Color contrast — primary CTAs | ≥ 4.5:1 in light theme; ≥ 4.5:1 in dark. |
| NFR-A11Y-003 | Form labels associated | Every checkout input has a `<label for>` or `aria-labelledby`. |
| NFR-A11Y-004 | Live region for eviction toasts | `role="status"` + `aria-live="polite"` honored by VoiceOver. |
| NFR-RES-001 | Mobile portrait | 375 × 667 layout intact. |
| NFR-RES-002 | Tablet landscape | 1024 × 768 intact. |
| NFR-RES-003 | Desktop | 1440 × 900 intact. |
| NFR-SEC-001 | No PII in localStorage outside cart/age/theme | `localStorage` audit — only `cs.storefront.cart`, `cs.storefront.user` (non-sensitive claims), age-gate, theme pref. |
| NFR-SEC-002 | JWT not in URL query strings | Network audit — no `?token=` GETs. |
| NFR-SEC-003 | CORS rejects unknown origins | Hit API from a non-allowed origin in a test page — preflight blocked. |
| NFR-OPS-001 | Page works offline-after-load | After app loads, drop network; navigation between cached routes still works (no SSR; cached chunks OK). Checkout fails with clear copy. |

---

## 9. Multi-tenant smoke (monthly + post-resolver changes)

| ID | Case | Expected |
| --- | --- | --- |
| TC-MT-001 | Two tenants side-by-side | Open `acme` and `omega` in two browsers. | Themes differ; product lists differ; carts isolated per browser. |
| TC-MT-002 | Tenant switch mid-cart (documented) | On the same browser, browse `acme`, add to cart, switch path to `omega`. | Cart contents persist (browser-scoped, not tenant-scoped). Confirm this is still the desired UX. |
| TC-MT-003 | Inactive tenant URL | Open `archived` directly. | Generic landing; no product calls. |
| TC-MT-004 | Subdomain prod (in prod env) | Open `acme.cannasaas.com` and `omega.cannasaas.com`. | Tenant resolves from subdomain; themes correct. |

---

## 10. Webhook-driven flows (eng-only sanity, requires API)

These cannot be triggered from the storefront alone — eng on call walks them after a release:

| ID | Case | Expected |
| --- | --- | --- |
| TC-WH-001 | CanPay webhook flips order to paid | Place a canpay order in sandbox; fire the sandbox webhook. | `/orders/:id` status updates from `pending_payment` → `confirmed` via WS. |
| TC-WH-002 | Aeropay webhook flips order to paid | Same on `omega`. | Same. |
| TC-WH-003 | Payment-failed webhook | Trigger a sandbox fail event. | Order moves to `failed`; UI surfaces a retry pattern. |

---

## 11. Open risks

- ~~Cart is single-key, not per-tenant.~~ **Fixed sc-605.** Cart is namespaced by `cs.storefront.cart:<dispensaryId>`; tenant switch swaps the active key. Pre-sc-605 single-key carts are cleared on first app boot.
- **`AgeGateService` uses sessionStorage, not localStorage.** A new tab re-prompts. Compliance has not yet asked for the 24-hour persistence model the kiosk uses; this is an open product question.
- **CSR-only.** Bots and crawlers see no product content. SEO relies on meta-injection + structured data. If a customer reports ranking issues, revisit SSR (root CLAUDE.md flags this).
- **Express checkout is barely-scoped here.** §6.13 needs a follow-up audit of the component.
- ~~WS auto-reconnect budget is 10 attempts × 1 s delay.~~ **Fixed sc-606.** Both sockets now reconnect indefinitely (`reconnectionAttempts: Infinity`, `reconnectionDelayMax: 10 s`). A `<cs-connection-banner>` renders a thin amber pill while disconnected after the first successful connection.

---

## 12. Ownership

| Section | Primary | Reviewer |
| --- | --- | --- |
| §5 Smoke | QA | Eng on call |
| §6.1–6.4 Tenant / theme / age / home | Eng (PR author) | QA |
| §6.5–6.7 Browse / detail / cart | Eng (PR author) | QA |
| §6.8–6.9 Auth / account | Eng (PR author) | QA |
| §6.10–6.13 Checkout + payments | Eng (PR author) | QA + payments lead |
| §6.14–6.17 Orders / WS | Eng (PR author) | Eng reviewer |
| §7 Regression | Eng (PR author) | Eng reviewer |
| §8 Non-functional | QA + Eng | Eng on call |
| §9 Multi-tenant | QA | Eng reviewer |
| §10 Webhooks | Eng on call | Payments lead |
