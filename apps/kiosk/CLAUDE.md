# CLAUDE.md — apps/kiosk

Self-service customer-facing kiosk. In-store touch terminal where customers browse and place orders without staff. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5176`
**Audience:** in-store customers, touch-only
**Auth:** none for browsing; phone-number-based identification at order time

---

## Touch-only constraints (non-negotiable)

This app runs on tablets bolted to walls or counters. There is **no keyboard, no mouse, often no scroll wheel**. Every UI decision must respect this.

- **Minimum tap target: 44px × 44px.** Prefer 60px for primary actions.
- **No hover states.** All affordances are visible at rest. `:hover` styles do not exist in this app.
- **No virtual keyboard popups.** `<input>` elements that would trigger the OS keyboard are forbidden in normal flow. Use custom on-screen number pads, alphabet keypads, or category-pickers instead.
  - Phone number entry: custom 10-key pad.
  - Search: a category browser, not a text search field.
- **No scroll on text inputs.** If the OS keyboard ever does appear, don't let it shift the layout — pin inputs to the visible region.
- **Generous touch padding** around clickable elements. Fat-finger tolerance > visual density.
- **Fonts:** larger than usual. Body text minimum 18px, primary actions 24px+.

---

## Single-dispensary lockdown

Each kiosk is configured for **exactly one dispensary**. The dispensary ID is set at provisioning time in `environment.ts` (or fetched from a kiosk-bootstrap endpoint and cached).

- No tenant resolver. No subdomain. The kiosk knows its dispensary at startup and doesn't change it.
- No login flow. No "switch dispensary" UI. No links out of the dispensary's own catalog.
- All external links disabled (terms, privacy, social) — kiosk should never escape to the open web.

---

## Attract loop / idle behavior

When the kiosk is idle (no touch for **90 seconds**), it enters **attract mode**:

- Cart cleared.
- Any in-progress identification/checkout discarded.
- Full-screen rotating slideshow of curated content (promotions, strain spotlights, brand) — content driven by `theme_configs` or a dedicated `kiosk_content` table.
- Tap anywhere returns to the home/browse screen with a fresh session.

Implementation:

- `IdleService` with `effect()` watching pointer/touch events. Reset a timer on every interaction.
- A single `AttractMode` route that renders above all other UI.
- Test with fake timers in unit tests; verify cart clears and route resets.

---

## Per-tenant theming (limited)

Kiosk **does** adopt the per-tenant theme (unlike admin/staff/platform) — the customer experience should feel branded. Same pattern as storefront:

- `AppThemeService` reads the dispensary's theme from `theme_configs` at app init.
- `data-theme` attribute on `<html>`.
- No runtime switching after init — set once and stay.

Reuse the storefront's theme service if it lives in `packages/stores` or `packages/ui`. Don't duplicate.

---

## Order flow

1. Browse catalog (no auth).
2. Add to cart.
3. Tap "Checkout" → identify by phone number (10-key pad) — looks up existing customer or creates a new one.
4. Confirm age (camera + ID scan if hardware supports it; otherwise tap-to-confirm 21+).
5. Pay at register — kiosk **never charges directly**. It hands off to a staff register session via a "Pickup at counter" handoff.

The kiosk is a pre-order terminal, not a payment terminal. The cannabis-friendly payment processor is invoked by the staff app at handoff, not here.

---

## Common patterns this app uses

### Big buttons, big lists

Product cards: large image, large name, large price, big "Add" button. No densely packed grids.

### Confirmation dialogs are full-screen

Modal dialogs occupy the whole screen — no tiny "OK / Cancel" mid-screen popups. Touch precision in panic moments is bad.

### Persistent home button

Always-visible home button at fixed position (typically bottom-center). Touch-accessible regardless of scroll position.

---

## App-specific forbidden patterns

- Native `<input type="text">`, `<input type="search">`, `<input type="email">` (anything that triggers OS keyboard) in primary flows.
- `<select>` elements (poor touch UX). Build custom pickers.
- Hover-dependent UI.
- `cursor: pointer` (cosmetic — there's no cursor).
- External links (`target="_blank"`, social media, terms/privacy hosted elsewhere).
- Authentication flows (login/signup screens).
- Direct payment processor integration. Kiosk never takes payment.
- Any path that doesn't return to attract mode after idle timeout.
- Scrollable horizontal lists without prominent visual scroll affordances (touch users don't always know they can scroll).

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/all-themes.css';

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';

/* Kiosk-wide defaults: large fonts, no text selection, no caret */
html {
  font-size: 18px;
  -webkit-touch-callout: none;
  user-select: none;
}
*,
*::before,
*::after {
  -webkit-tap-highlight-color: transparent;
}

/* Disable hover styles globally — there is no hover */
@media (hover: none) {
  * {
    transition-property: none !important;
  }
}
```

---

## Performance / hardware

- Tablets are often older Android or iPad hardware. Target **iPad 9th gen / equivalent Android** as floor.
- Bundle size matters more than usual. Aggressive `@defer` and lazy loading.
- Avoid heavy animations on lower-end devices. Use `prefers-reduced-motion` as default and let admin opt back in via theme.
- Service worker for offline catalog browsing — orders still require network, but browsing should survive a brief outage.

---

## Testing notes

- Test idle/attract behavior with fake timers.
- Test that no `<input>` capable of triggering OS keyboard is reachable from primary flows.
- Test single-dispensary lockdown — attempts to navigate to a different dispensary's content should fail.
- Touch event tests, not click event tests.
