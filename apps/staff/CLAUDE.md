# CLAUDE.md — apps/staff

In-store POS for budtenders and floor staff. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5175`
**Audience:** authenticated dispensary staff (budtenders, managers)
**Auth:** required everywhere; **session model** layered on top of auth (see below)

---

## Tenant + session model

Staff resolves dispensary from the user's claims (single-dispensary users only — multi-dispensary staff use admin to switch first).

**Register sessions** are a separate layer:

- A `RegisterSession` is opened at the start of a shift (drawer count, opening cash) and closed at end-of-shift (reconciliation).
- Every order created from staff is bound to the active register session.
- `CurrentSessionService` (signal-based) tracks `activeSession` — components must check `activeSession()` before allowing new orders.
- No active session → block order creation, route to `/register/open`.

---

## Walk-in customers

Per existing API convention, walk-in customers are created with placeholder emails:

```
walkin-{6-digit-id}@pos.{dispensary-domain}
```

`NewOrderPage` exposes a "Walk-in" button that creates this customer record on the fly. Don't surface the placeholder email in UI — show "Walk-in customer" with a short ID.

---

## Hardware integration

Staff app runs on tablets/mini-PCs in store. Hardware to integrate:

### Barcode scanner

USB HID barcode scanners present as keyboards. Capture pattern:

- Listen at the document level for keystrokes that match the scanner pattern (rapid sequence ending in `Enter`, typically <50ms between keys).
- Provide a `ScannerService` that exposes `scans = signal<string | null>(null)` — components opt in via `effect()`.
- Don't intercept when an `<input>` has focus (let typed input flow normally).

### Cash drawer

Cash drawer pops via a printer ESC/POS command sequence. The API exposes a "print receipt" mutation that includes the drawer-pop instruction — the frontend doesn't talk to hardware directly.

### Receipt printing

Browser print of a styled receipt component. Use a dedicated `print-receipt.css` with `@media print` rules. Test in Chromium kiosk mode (the typical staff browser).

---

## Touch-friendly layout (but with keyboard)

Staff is **touch-first** but assumes a keyboard is present (USB or on-screen):

- Tap targets ≥44px.
- Number pads for prices/quantities are inline components, not native virtual keyboards.
- Tab order matters — staff use keyboard for fast order entry.
- Modal dialogs full-screen on tablet form factors.

---

## Order queue

`OrderQueuePage` shows pending and in-progress orders. Polls or subscribes for updates:

- Prefer GraphQL subscriptions if the API exposes them.
- Fallback: `rxResource()` with a 10-second poll interval.
- Sound cue (subtle) on new orders. Volume control + mute toggle in user preferences.

---

## Common patterns this app uses

### Optimistic UI for cart actions

Adding/removing items from an in-progress order should feel instant. Optimistic mutate the local cart signal, reconcile on mutation response, roll back on error.

### Idle detection

Auto-lock the app to a PIN-entry screen after N minutes of inactivity (compliance — prevents unattended POS access). Use a service with `effect()` watching `document` interaction events. Default timeout: **5 minutes** (configurable per dispensary in `app.config.ts`).

---

## App-specific forbidden patterns

- Direct payment processor SDK imports. Order finalization goes through API.
- `localStorage` for order data — the register session lives on the API. Local storage only for UI prefs.
- Long-running background work in the browser tab — use the API and BullMQ.
- Hardcoded scanner patterns or device IDs.

---

## Theme

Single internal theme, same as admin. POS reliability > per-tenant aesthetics.

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/theme.dark.css';

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';

/* Print styles for receipts */
@media print {
  body * {
    visibility: hidden;
  }
  .receipt,
  .receipt * {
    visibility: visible;
  }
}
```

---

## Testing notes

- Scanner service: test with synthesized rapid keystroke events.
- Idle detection: fake timers; verify lock screen appears at threshold.
- Register session guards: open vs closed states for every order-mutating route.
