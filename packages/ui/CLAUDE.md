# CLAUDE.md — packages/ui

Shared UI package: design tokens, theme CSS files, primitive components, design-system utilities. Inherits all rules from the root `CLAUDE.md`.

**Consumed by:** all 5 Angular apps (`storefront`, `admin`, `staff`, `kiosk`, `platform`).
**Workspace dep:** `"@cannasaas/ui": "workspace:*"`.

---

## What lives here

- `src/themes/theme.*.css` — 10 themes (`apothecary`, `casual`, `citrus`, `dark`, `earthy`, `midnight`, `minimal`, `modern`, `neon`, `regal`).
- `src/themes/all-themes.css` — concatenated baseline + portal activation via `[data-portal]`. Loaded by storefront and kiosk; admin/staff/platform load a single theme file directly.
- `src/components/` — Angular standalone components used across apps.
- `src/directives/` — shared directives.
- `src/tokens/` — design token CSS custom property declarations (root variable definitions).
- `src/utils/` — utility functions (formatting, validation, etc.).

---

## Hard rules for this package

- **No app-specific imports.** This package must not import from `apps/*`. If a component needs context that lives in an app, the app passes it via signal input or DI.
- **Tree-shakeable exports.** Every public symbol is exported from `src/index.ts` (or from a barrel that's imported into it). Avoid side-effect imports.
- **No business logic.** Multi-tenant rules, RBAC, payment flows, GraphQL operations — none of this lives here. UI primitives only.
- **No `inject()` of app-level services.** Components in this package take everything they need as signal inputs.
- **TypeScript strict.** Same rules as apps.
- **Standalone components only.** Same Angular rules as apps.

---

## Design tokens

Tokens are CSS custom properties defined in theme files. The naming convention:

```
--cs-color-{role}            /* primary, secondary, bg, fg, muted, accent, danger, success */
--cs-color-{role}-{shade}    /* primary-100 .. primary-900 */
--cs-space-{n}               /* 0, 1, 2, 4, 8, 16, 32, 64 (px) */
--cs-radius-{size}           /* sm, md, lg, full */
--cs-font-{role}             /* sans, mono, display */
--cs-shadow-{level}          /* sm, md, lg, xl */
--cs-z-{role}                /* dropdown, modal, toast, attract */
```

**Never hardcode color, font, or spacing values.** Always reference a token.

When a token doesn't exist for a use case, add it to `src/tokens/` with values defined per theme. Don't introduce one-off variables in component CSS.

---

## Theme file structure

Every `theme.*.css` file:

```css
:root[data-theme='modern'] {
  --cs-color-bg: #...;
  --cs-color-fg: #...;
  /* full token set */
}
```

`all-themes.css` concatenates all 10. `:root[data-theme="X"]` specificity ensures attribute switching works without recompile.

**Adding a new theme:**

1. Copy `theme.dark.css` as a starting point.
2. Replace token values; keep the property names.
3. Add to `all-themes.css`.
4. Update the `ALLOWED_THEMES` whitelist in storefront's and kiosk's `AppThemeService`.
5. Update the theme selector UI in admin (if exposed to dispensary owners).

---

## Component conventions

Components in this package:

- Are standalone, OnPush, signal-based — same as app components.
- Accept tokens-by-input rather than reading globals when behavior should be configurable per consumer.
- Use `:host` styling. No global selectors.
- Document required signal inputs with TSDoc on the input declaration.

Example primitive:

```ts
@Component({
  selector: 'cs-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button [class]="classes()" [disabled]="disabled()">
    <ng-content />
  </button>`,
  styleUrl: './button.css',
})
export class CsButtonComponent {
  /** Visual variant. */
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  /** Disable interaction. */
  readonly disabled = input(false);

  protected readonly classes = computed(
    () => `cs-btn cs-btn--${this.variant()}`,
  );
}
```

---

## Tailwind interaction

Apps use Tailwind v4. This package does **not** ship Tailwind utilities — it ships:

- CSS custom property definitions (consumed by Tailwind theme config in apps).
- Component CSS that uses raw `var(--cs-...)` references (works regardless of whether the consuming app has Tailwind).

Each app's Tailwind config maps tokens to utilities (`bg-bg`, `text-fg`, etc.) so consumers can use Tailwind classes that resolve to `@cannasaas/ui` tokens. The mapping config is duplicated per app for now; consider extracting to `packages/ui/tailwind-preset.ts` post-launch.

---

## Forbidden in this package

- Imports from `apps/*`.
- App-specific business logic (payment flows, multi-tenant routing, RBAC).
- Hardcoded color/font/spacing values in component CSS (use tokens).
- Side-effect-only imports that prevent tree-shaking.
- Direct DOM manipulation outside of standard Angular patterns.
- `provideRouter` / route definitions (apps own routing).

---

## Tech debt to be aware of

- **Two parallel theme mechanisms** (theme-presets + design-systems) coexist in the React storefront era. Angular rewrite uses **one model only** — `data-theme` attribute switching with token-based theme files. Don't reintroduce the design-system whitelist injection pattern.
- **Tailwind preset extraction** (mentioned above) is post-launch.
- **`src/themes/inject.ts`** has `setThemePreset()` duplicated inline in the React `ThemeProvider`. Angular rewrite should consolidate the helper here and have apps consume it.

---

## Testing notes

- Each component has a unit test verifying signal inputs render correctly.
- Visual regression tests (Storybook + Chromatic, or Ladle) — set up post-launch.
- Token files don't need tests, but `tokens/index.ts` (if it exports a typed token map) does.
