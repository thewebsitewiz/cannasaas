# Test Plan — Kiosk

Self-service in-store touch terminal. Angular 21 standalone, signal-driven, runs on `:5276`. Device-provisioned identity (no per-customer login). One dispensary per device.

Inherits the conventions in [root `CLAUDE.md`](../../../../CLAUDE.md) and [kiosk `CLAUDE.md`](./CLAUDE.md).

---

## 1. Scope & strategy

### In scope

- All routes under `KioskLayout` (`/`, `/product/:id`, `/cart`, `/checkout`, `/confirm/:orderId`, `/checkin`) and the standalone `/setup` provisioning route.
- Idle/attract overlay, global error toast, header chrome, cart badge.
- Device-token + access-token auth tiers in `AuthService`.
- GraphQL ops: `ProductsGQL`, `ProductGQL`, `CreateOrderGQL`, `LoginGQL` (dev only).

### Out of scope (covered elsewhere)

- The `provisionKiosk` admin mutation lives in `apps/platform` — tested in that app's plan.
- Post-pickup operator flows (Metrc sync, payment reconciliation) — covered by `apps/api` integration tests.

### Test layers

| Layer                                          | Runner                   | Owner                | Trigger                                                                  |
| ---------------------------------------------- | ------------------------ | -------------------- | ------------------------------------------------------------------------ |
| Unit                                           | Vitest (`ng test kiosk`) | Eng on PR            | Every push                                                               |
| Integration (service ↔ Apollo mock)            | Vitest                   | Eng on PR            | Every push                                                               |
| Manual smoke (this doc § 5)                    | Human QA                 | QA before release    | Each release branch + sandbox cut                                        |
| Manual regression (this doc § 6+)              | Human QA                 | QA before release    | Each release branch                                                      |
| Hardware soak (idle, attract, all-day session) | Human QA                 | QA + a real terminal | Monthly + before any release that touches `IdleService` or `AttractMode` |

### Test environments

| Env        | API                                 | Dispensary slug | Notes                             |
| ---------- | ----------------------------------- | --------------- | --------------------------------- |
| Local      | `http://localhost:3000/graphql`     | path-resolved   | `pde` runs API + sites            |
| Sandbox    | `https://api-sandbox.cannasaas.com` | `acme-sandbox`  | Pre-prod soak                     |
| Production | `https://api.cannasaas.com`         | per-tenant      | Smoke only — no destructive cases |

### Test data prerequisites

- One dispensary with at least 12 products spanning all 5 categories (Flower, Pre-Roll, Vape, Concentrate, Edible).
- At least one product with **>1 variant** and one with **exactly 1 variant**.
- At least one product with **stock = 0** (Sold Out), one with **stock = 1** (boundary), one with **stock ≥ 20**.
- One known **device token** (JWT, 3 segments, length > 32) provisioned against the test dispensary.
- One known **bad device token** (e.g., `not.a.jwt`) for negative cases.
- `kioskAuth` credentials configured in `environment.ts` for the dev-only access-token fallback path.

### Severity scale

- **S1 — Blocker:** Customer cannot place an order. Halt release.
- **S2 — Major:** Workaround exists but flow is degraded. Fix before release.
- **S3 — Minor:** Cosmetic or low-frequency. Ship with bug filed.
- **S4 — Trivial:** Polish. Backlog.

---

## 2. Entry & exit criteria

**Entry to QA pass**

- All Vitest suites green on the release branch.
- `ng build kiosk` produces a clean production bundle.
- API sandbox is reachable and seeded with the test data above.

**Exit (ready to release)**

- All §5 smoke cases pass on sandbox.
- All §6 feature cases pass on sandbox.
- Zero open S1 / S2.
- Open S3 / S4 are filed in Shortcut and labeled `kiosk`.
- One human has run a 30-minute attract/idle soak on a real terminal — no crashes, no memory growth observed in DevTools.

---

## 3. Automated coverage target

Per `ng test kiosk`:

| Service / component       | Required spec                                                                                                                                          | Notes                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `AuthService`             | Token precedence (device > access > null), `ensureLoggedIn` happy path, `KIOSK_NOT_PROVISIONED` error, 401 retry interaction with `clearAccessToken()` | The 401 retry is the highest-risk path; cover with both device-only and access-only branches. |
| `CartService`             | `addItem` (new + increment), `updateQuantity` (cap, zero-to-remove), `removeItem`, `clearCart`, `itemCount`, `subtotal` computed                       | localStorage persistence covered by a single round-trip test.                                 |
| `IdleService`             | Fires `isIdle` after timeout, suppresses further fires until `reset()`, listens on all 3 event types                                                   | Use fake timers; do not rely on real `setTimeout`.                                            |
| `AttractMode` (component) | Renders when `isIdle`, slide rotation interval, tap-to-exit clears cart + resets                                                                       | Use `TestBed.tick()`.                                                                         |
| `MenuPage`                | Filter signal updates query variables, empty/loading/error branches                                                                                    | Mock `ProductsGQL`.                                                                           |
| `ProductPage`             | Variant selection resets quantity, quantity caps to stock, add-to-cart loops N times, "Sold Out" disables button                                       | Mock `ProductGQL`.                                                                            |
| `CheckoutPage`            | Empty-cart guard, happy-path mutation, 401 retry, post-success cart clear + nav                                                                        | Mock `CreateOrderGQL`.                                                                        |
| `OrderConfirmPage`        | Countdown ticks, manual reset, auto-redirect at zero                                                                                                   | Fake timers.                                                                                  |
| `KioskLayout`             | Back button hides on `/`, cart badge reflects `itemCount`, reset button clears cart                                                                    | Snapshot or text assertion.                                                                   |

> **Heuristic:** If a test case in §6 below has a clear deterministic expected outcome and no human judgment, prefer to cover it in Vitest. Reserve manual QA for visual polish, hardware feel, and integration with a live API.

---

## 4. Test data table

| Alias                 | Description                                                  | Used in                         |
| --------------------- | ------------------------------------------------------------ | ------------------------------- |
| `DEV_DEVICE_TOKEN`    | Long-lived kiosk device JWT for sandbox dispensary           | All sandbox cases               |
| `BAD_TOKEN`           | `not.a.token`                                                | TC-SETUP-003                    |
| `MALFORMED_TOKEN`     | `eyJ.eyJ` (too short)                                        | TC-SETUP-004                    |
| `PROD_SLUG`           | The sandbox dispensary id used in `environment.dispensaryId` | All product/cart/checkout cases |
| `PROD_MULTI_VARIANT`  | Product id with ≥2 variants                                  | TC-PROD-003, TC-PROD-005        |
| `PROD_SINGLE_VARIANT` | Product id with exactly 1 variant                            | TC-PROD-002                     |
| `PROD_SOLD_OUT`       | Product id, all variants stock 0                             | TC-MENU-005, TC-PROD-008        |
| `PROD_STOCK_1`        | Product id with one variant at stock 1                       | TC-PROD-006                     |

---

## 5. Smoke pass (must run before every release)

> Time-boxed: < 10 min. Run on the latest release branch built against sandbox.

| ID    | Case                                        | Expected                                                                         |
| ----- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| SMK-1 | Provisioned device boots into menu          | `/` renders the product grid within 3 s, no errors in console.                   |
| SMK-2 | Tap product → variant → Add → Cart shows 1  | Cart badge increments, `/cart` lists the line item with correct price.           |
| SMK-3 | Checkout places order                       | `CreateOrderGQL` returns an orderId; `/confirm/:orderId` renders.                |
| SMK-4 | Confirmation countdown auto-resets          | After ~15 s, app returns to `/` with empty cart.                                 |
| SMK-5 | Idle attract appears                        | Leave kiosk untouched for the configured idle timeout — attract overlay renders. |
| SMK-6 | Tap attract → returns to home, cart cleared | One tap exits attract, navigates to `/`, cart is empty.                          |

If any SMK fails → release is blocked. File an S1.

---

## 6. Feature test cases

### 6.1 Device provisioning — `/setup`

| ID           | Case                           | Preconditions                   | Steps                                                                 | Expected                                                              |
| ------------ | ------------------------------ | ------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| TC-SETUP-001 | Happy path — paste valid token | No device token in localStorage | 1. Navigate to `/setup`. 2. Paste `DEV_DEVICE_TOKEN`. 3. Submit.      | Token written to `cs.kiosk.deviceToken`; navigate to `/`; menu loads. |
| TC-SETUP-002 | Query-param prefill            | None                            | 1. Navigate to `/setup?token=DEV_DEVICE_TOKEN`.                       | Textarea pre-populated; submit succeeds.                              |
| TC-SETUP-003 | Bad token rejected             | None                            | 1. Paste `BAD_TOKEN`. 2. Submit.                                      | Validation error shown; no localStorage write; stays on `/setup`.     |
| TC-SETUP-004 | Malformed JWT rejected         | None                            | 1. Paste `MALFORMED_TOKEN`. 2. Submit.                                | Same as TC-SETUP-003.                                                 |
| TC-SETUP-005 | Re-provisioning overwrites     | Existing token in localStorage  | 1. Navigate to `/setup`. 2. Paste a different valid token. 3. Submit. | localStorage value replaced; `cs.kiosk.accessToken` cleared.          |
| TC-SETUP-006 | Whitespace-pad tolerated       | None                            | 1. Paste `"  DEV_DEVICE_TOKEN  "`. 2. Submit.                         | Trimmed and accepted.                                                 |

### 6.2 Idle / attract mode

| ID          | Case                        | Steps                                                          | Expected                                                          |
| ----------- | --------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| TC-IDLE-001 | Timeout fires attract       | Boot app, leave untouched for `idleTimeoutMs`.                 | Attract overlay appears; underlying route still mounted.          |
| TC-IDLE-002 | Tap exits attract           | While in attract, tap anywhere.                                | Overlay dismissed; route is `/`; cart is empty; idle timer reset. |
| TC-IDLE-003 | Attract clears mid-cart     | Add 2 items to cart, leave idle until attract fires, then tap. | Cart count badge reads 0; localStorage cart key is empty.         |
| TC-IDLE-004 | Activity resets timer       | Tap an irrelevant area every 30 s for 5 min.                   | Attract never fires.                                              |
| TC-IDLE-005 | Slide rotation              | Enter attract and watch 30 s.                                  | Slide advances roughly every 5 s; 3 distinct slides observed.     |
| TC-IDLE-006 | Keyboard counts as activity | Boot, then press any key on an attached keyboard.              | Idle timer resets.                                                |
| TC-IDLE-007 | Touch counts as activity    | On a touchscreen, tap-and-hold.                                | Idle timer resets.                                                |
| TC-IDLE-008 | Hardware soak               | Leave on attract for 8 hours.                                  | No memory growth in DevTools; no crash. (Monthly only.)           |

### 6.3 Product browse — `/`

| ID          | Case                     | Steps                                              | Expected                                                                |
| ----------- | ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------- |
| TC-MENU-001 | Initial render           | Boot app.                                          | `ProductsGQL` fires once with `dispensaryId`; grid shows products.      |
| TC-MENU-002 | Filter — Flower          | Tap **Flower** filter chip.                        | Query refetches with `productTypeId` set; grid shows only Flower.       |
| TC-MENU-003 | Filter — All resets      | After TC-MENU-002, tap **All**.                    | `productTypeId` reset to null; full grid returns.                       |
| TC-MENU-004 | Empty filter result      | Apply a filter for a category with zero products.  | "No products found" copy renders; no grid items.                        |
| TC-MENU-005 | Sold-out product card    | View `PROD_SOLD_OUT` in the grid.                  | "Sold Out" badge; Add button disabled or hidden.                        |
| TC-MENU-006 | Loading skeleton         | Throttle network to "Slow 3G" in DevTools; reload. | Spinner renders before grid; no flash of empty state.                   |
| TC-MENU-007 | Network error            | Stop the API, reload.                              | `GlobalErrorHandler` toast renders; grid stays empty.                   |
| TC-MENU-008 | Card add-button feedback | Tap **Add** on any in-stock product card.          | Button flashes "Added" for ~1.5 s; cart badge increments; stays on `/`. |
| TC-MENU-009 | Card → detail navigation | Tap a card body (not the Add button).              | Navigates to `/product/:id`.                                            |

### 6.4 Product detail — `/product/:id`

| ID          | Case                             | Steps                                                | Expected                                                                     |
| ----------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| TC-PROD-001 | Happy load                       | Navigate to a known product.                         | `ProductGQL` fires with `id` + `dispensaryId`; hero, price, variants render. |
| TC-PROD-002 | Single-variant product           | Open `PROD_SINGLE_VARIANT`.                          | No variant selector; quantity defaults to 1.                                 |
| TC-PROD-003 | Multi-variant default            | Open `PROD_MULTI_VARIANT`.                           | First variant selected; price reflects that variant.                         |
| TC-PROD-004 | Variant switch updates price     | Tap a non-default variant.                           | Price text updates immediately.                                              |
| TC-PROD-005 | Variant switch resets qty        | Set qty to 3, then switch variant.                   | Quantity resets to 1.                                                        |
| TC-PROD-006 | Boundary — stock = 1             | Open `PROD_STOCK_1`.                                 | Inc button disabled at qty 1; "1 in stock" shown.                            |
| TC-PROD-007 | Qty cannot exceed stock          | Try to inc past displayed stock.                     | Inc button disabled at max; no error toast.                                  |
| TC-PROD-008 | Sold-out variant disabled        | Open `PROD_MULTI_VARIANT` where one variant is OOS.  | OOS variant button shows "Sold Out", is disabled.                            |
| TC-PROD-009 | Add multiple at once             | Set qty to 3, tap Add.                               | Cart contains a line with quantity 3; price reflects 3× variant price.       |
| TC-PROD-010 | Add success returns home         | After TC-PROD-009.                                   | "Added!" flash for ~1.5 s, then auto-navigate to `/`.                        |
| TC-PROD-011 | Not-found product                | Manually navigate to `/product/not-a-real-id`.       | "Product not found" copy renders; no console errors.                         |
| TC-PROD-012 | Variant qty cap on cart re-entry | Add max stock from `PROD_STOCK_1`, return to detail. | Inc button disabled immediately (existing cart qty counted).                 |

### 6.5 Cart — `/cart`

| ID          | Case                      | Steps                                 | Expected                                             |
| ----------- | ------------------------- | ------------------------------------- | ---------------------------------------------------- |
| TC-CART-001 | Empty state               | Boot app, navigate to `/cart`.        | "Your cart is empty" copy + "Browse Menu" link.      |
| TC-CART-002 | Single-item list          | Add 1 item, open cart.                | Line item shows correct name, variant, qty 1, price. |
| TC-CART-003 | Increment qty             | Tap + on a line.                      | Qty increments; subtotal updates.                    |
| TC-CART-004 | Decrement to zero removes | Tap − until qty reads 0.              | Line removed entirely; subtotal recomputes.          |
| TC-CART-005 | Trash button removes      | Tap trash icon.                       | Line removed; remaining lines unchanged.             |
| TC-CART-006 | Multi-line subtotal       | Add 2 different products.             | Subtotal = sum of (qty × price) per line.            |
| TC-CART-007 | Persist across navigation | Add items, navigate to menu and back. | Cart contents unchanged.                             |
| TC-CART-008 | Reload preserves cart     | Add items, hard-reload the page.      | Cart still populated from localStorage.              |
| TC-CART-009 | Reset button clears       | Add items, tap header Reset.          | Cart empty; navigate to `/`.                         |
| TC-CART-010 | Cart badge accuracy       | Add 3 lines totaling 5 items.         | Header badge reads 5.                                |

### 6.6 Checkout — `/checkout`

| ID        | Case                                  | Steps                                                           | Expected                                                                                                                    |
| --------- | ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TC-CO-001 | Empty cart guard                      | Navigate directly to `/checkout` with empty cart.               | "Your cart is empty" prompt; no order created.                                                                              |
| TC-CO-002 | Happy path                            | Add 1 item, navigate to `/checkout`, tap Place Order.           | `CreateOrderGQL` called with `orderType: 'pickup'` + `notes: 'Kiosk pre-order'`; succeeds; redirect to `/confirm/:orderId`. |
| TC-CO-003 | Order summary correctness             | Add 2 items at known prices.                                    | Summary lists each line; subtotal matches; "Tax calculated at checkout" copy present.                                       |
| TC-CO-004 | Place button disabled while in-flight | Tap Place Order; quickly tap again before response.             | Second tap ignored; button shows spinner.                                                                                   |
| TC-CO-005 | API error path                        | Stop API, place order.                                          | Red error banner with API message; button re-enables; cart NOT cleared.                                                     |
| TC-CO-006 | 401 retry refreshes token             | Force-expire access token, then place order.                    | `clearAccessToken` fires; retry succeeds; order placed.                                                                     |
| TC-CO-007 | Not provisioned blocks                | Remove device token from localStorage; navigate to `/checkout`. | `KIOSK_NOT_PROVISIONED` error surfaces in error toast; no order created.                                                    |
| TC-CO-008 | Cart cleared on success               | After TC-CO-002.                                                | `cs.kiosk.cart` key empty after success; cart badge 0.                                                                      |

### 6.7 Order confirmation — `/confirm/:orderId`

| ID          | Case                | Steps                                                            | Expected                                                                                                            |
| ----------- | ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TC-CONF-001 | Display             | Land from successful checkout.                                   | "Order Placed!" + first 8 chars of orderId rendered.                                                                |
| TC-CONF-002 | Countdown           | Wait without interacting.                                        | Countdown decrements every second from configured `RESET_SECONDS`.                                                  |
| TC-CONF-003 | Auto-reset at zero  | Wait full countdown.                                             | Navigate to `/`; cart empty; idle timer reset.                                                                      |
| TC-CONF-004 | Manual reset button | Before countdown completes, tap "Start New Order".               | Immediate navigate to `/`; cart empty.                                                                              |
| TC-CONF-005 | Direct-URL fallback | Manually navigate to `/confirm/some-uuid` without a prior order. | Page still renders the confirmation UI (intentional — we don't refetch the order; this route is post-success-only). |

### 6.8 Header / layout

| ID         | Case                          | Steps                               | Expected                                                             |
| ---------- | ----------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| TC-LAY-001 | Back button hidden on home    | Boot.                               | No back chevron in header.                                           |
| TC-LAY-002 | Back button visible elsewhere | Navigate to any other route.        | Back chevron present; tap returns to previous route.                 |
| TC-LAY-003 | Cart badge reflects count     | Add items.                          | Badge equals `itemCount()`.                                          |
| TC-LAY-004 | Reset clears + navigates      | From `/cart` with items, tap Reset. | Cart empty; `/` rendered.                                            |
| TC-LAY-005 | Footer copy                   | View any route.                     | "Must be 21+ with valid ID · Tap any product to learn more" visible. |

### 6.9 Auth tier — service-level

> Most of this is covered by unit specs; the rows below are integration probes against the running API.

| ID          | Case                                     | Steps                                                           | Expected                                                                                                     |
| ----------- | ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| TC-AUTH-001 | Device token preferred                   | Both `cs.kiosk.deviceToken` and `cs.kiosk.accessToken` present. | Apollo middleware attaches the device token.                                                                 |
| TC-AUTH-002 | Fallback to access token (dev)           | Device token absent; `environment.kioskAuth` configured.        | `LoginGQL` runs; access token written to `cs.kiosk.accessToken`.                                             |
| TC-AUTH-003 | Neither token, no creds                  | Clear both; clear `kioskAuth` from env (or sim).                | `ensureLoggedIn` rejects with `KIOSK_NOT_PROVISIONED`.                                                       |
| TC-AUTH-004 | 401 retry with device token does nothing | Force 401 on a query while device token is set.                 | `clearAccessToken` is a no-op; retry uses the same device token; second attempt also fails — error surfaces. |
| TC-AUTH-005 | 401 retry with access token re-logs      | Force 401 with access token only.                               | Access token cleared; `LoginGQL` re-runs; retried op succeeds.                                               |

### 6.10 Error handling

| ID         | Case                                | Steps                                                      | Expected                                                                |
| ---------- | ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| TC-ERR-001 | Unhandled mutation error toasts     | Force an unexpected GraphQL error.                         | Global error toast renders at top-center with message + Dismiss button. |
| TC-ERR-002 | Dismiss button                      | After TC-ERR-001.                                          | Toast disappears; no state side effects.                                |
| TC-ERR-003 | Stale device token (server-revoked) | Run a query with a valid-shape JWT the server has revoked. | Error toast; clear path: re-provision via `/setup`.                     |

### 6.11 Check-in — `/checkin`

Phone-number keypad to attach an existing customer to the in-progress cart. Shipped in sc-473; replaces the old placeholder.

| ID         | Case                                 | Steps                                                                  | Expected                                                                                                                                                   |
| ---------- | ------------------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-CHK-001 | Keypad renders                       | Navigate to `/checkin`.                                                | 0-9 keys, Clear, Backspace, Look up, Continue as walk-in. No console errors.                                                                               |
| TC-CHK-002 | Digit entry caps at 10               | Tap digits 11+ times.                                                  | Input holds at 10 digits; digit buttons disabled at 10.                                                                                                    |
| TC-CHK-003 | Display formatting                   | Type `5551234567`.                                                     | Display reads `(555) 123-4567`.                                                                                                                            |
| TC-CHK-004 | Backspace removes one digit          | After typing, tap ⌫.                                                   | Last digit removed.                                                                                                                                        |
| TC-CHK-005 | Clear empties the buffer             | Type then tap Clear.                                                   | Input empty; Look up disabled.                                                                                                                             |
| TC-CHK-006 | Lookup happy path                    | Enter a phone tied to a customer in `customer_profiles`, tap Look up.  | `CustomerByPhoneGQL` fires with `dispensaryId` + 10-digit phone; success banner: "Welcome back, {firstName}!" + loyalty pts. Button changes to "Continue". |
| TC-CHK-007 | Continue attaches customer           | After TC-CHK-006, tap Continue.                                        | Navigate to `/`; header shows `{firstName} · {pts} pts` instead of "Check In". `cart.customer()` returns the match.                                        |
| TC-CHK-008 | No-match path                        | Enter a 10-digit number not in DB, Look up.                            | Amber banner: "We didn't find an account…". No customer attached.                                                                                          |
| TC-CHK-009 | Walk-in clears customer              | With a customer attached, tap "Continue as walk-in".                   | `cart.customer()` is null; navigate to `/`; header reverts to "Check In".                                                                                  |
| TC-CHK-010 | Edit after match resets status       | Match a customer (TC-CHK-006), then tap a digit.                       | Greeting banner removed; status back to idle; Look up disabled until 10 digits.                                                                            |
| TC-CHK-011 | Customer survives across menu/cart   | After TC-CHK-007, navigate to `/products`, add an item, open `/cart`.  | Header customer chip remains; `cart.customer()` unchanged.                                                                                                 |
| TC-CHK-012 | Reset clears customer                | With a customer attached, tap header Reset.                            | `cart.customer()` null; cart empty.                                                                                                                        |
| TC-CHK-013 | Attract clears customer              | With a customer attached, leave idle until attract fires, tap to exit. | `cart.customer()` null.                                                                                                                                    |
| TC-CHK-014 | Order placement sends customerUserId | Match → add items → checkout → Place Order.                            | `CreateOrderGQL` input includes `customerUserId: <matched id>`. Verify in server logs / order row.                                                         |
| TC-CHK-015 | Walk-in order omits customerUserId   | Skip check-in (or walk-in), place an order.                            | `CreateOrderGQL` input has no `customerUserId`; order row stored with NULL customer.                                                                       |
| TC-CHK-016 | API error during lookup              | Stop the API, tap Look up with 10 digits.                              | Inline error banner with API message; status returns to idle so user can retry.                                                                            |

---

## 7. Regression — cross-cutting

| ID         | Case                       | Notes                                                                                                                |
| ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TC-REG-001 | Theme tokens applied       | Verify no hardcoded hex colors leak through component CSS; spot-check 5 components.                                  |
| TC-REG-002 | OnPush change detection    | Every component declared `ChangeDetectionStrategy.OnPush`. Run `grep -r "ChangeDetectionStrategy" --include="*.ts"`. |
| TC-REG-003 | No `*ngIf` / `*ngFor`      | `grep -rn '\*ngIf\|\*ngFor\|\*ngSwitch' src` returns nothing.                                                        |
| TC-REG-004 | No constructor injection   | `grep -rn 'constructor(' src/app` reviewed manually — every constructor body-only or empty.                          |
| TC-REG-005 | No `any` / `// @ts-ignore` | `pnpm --filter @cannasaas/api typecheck` analog for kiosk; or `tsc --noEmit`.                                        |

---

## 8. Non-functional

| ID           | Case                             | Threshold                                                     |
| ------------ | -------------------------------- | ------------------------------------------------------------- |
| NFR-PERF-001 | Cold start to interactive menu   | < 2.5 s on the target Android tablet hardware over LAN.       |
| NFR-PERF-002 | Tap-to-detail navigation         | < 250 ms perceived lag.                                       |
| NFR-PERF-003 | Cart write latency               | Add-to-cart updates badge in < 100 ms.                        |
| NFR-A11Y-001 | Touch target size                | Every primary tap target ≥ 44 × 44 CSS px.                    |
| NFR-A11Y-002 | Contrast on solid header         | Header text on solid background ≥ 4.5:1.                      |
| NFR-A11Y-003 | Screen reader headings           | `<h1>` per route; landmarks present.                          |
| NFR-RES-001  | Tablet portrait                  | Layout intact at 800 × 1280.                                  |
| NFR-RES-002  | Tablet landscape                 | Layout intact at 1280 × 800.                                  |
| NFR-SEC-001  | Device token not exposed in logs | Production console output contains no JWT segments.           |
| NFR-SEC-002  | Mixed-content safe               | All API calls go to HTTPS in sandbox/prod.                    |
| NFR-OPS-001  | 8-hour soak                      | No crashes; memory plateau under DevTools Performance Memory. |

---

## 9. Open risks

- **Idle service is window-scoped.** A second tab on the same device would share the timer. Kiosks run single-tab in kiosk mode — flagged, not blocking.
- **`CreateOrderGQL` hardcodes `orderType: 'pickup'`.** In-store-consume / delivery from a kiosk are not supported by design. If product wants those, the form needs a fulfillment toggle and §6.6 expands.
- **No client-side stock guard on Place Order.** Server `FOR UPDATE` locks are authoritative. If race conditions surface in production, TC-CO-005 needs a sub-case for "another customer bought the last unit."

---

## 10. Test case ownership

| Section                                     | Primary owner   | Reviewer     |
| ------------------------------------------- | --------------- | ------------ |
| §5 Smoke                                    | QA              | Eng on call  |
| §6.1–6.4 Browse / product                   | Eng (PR author) | QA           |
| §6.5–6.8 Cart / checkout / confirm / layout | Eng (PR author) | QA           |
| §6.9–6.10 Auth + errors                     | Eng (PR author) | Eng reviewer |
| §6.11 Check-in stub                         | TBD             | TBD          |
| §7 Regression                               | Eng (PR author) | Eng reviewer |
| §8 Non-functional                           | QA + Eng        | Eng on call  |
