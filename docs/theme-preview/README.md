# CannaSaaS — Theme Preview

Static HTML mirror of every route across the five CannaSaaS frontends, designed to be opened directly in a browser without running any of the apps. Use this when authoring new themes (or tweaking the existing 10) to see what your tokens look like across every screen at once.

## What's here

| Folder        | App                  | Port (live) | Pages |
| ------------- | -------------------- | ----------- | ----- |
| `admin/`      | Angular admin portal | `:5274`     | 21    |
| `staff/`      | Angular staff POS    | `:5275`     | 9     |
| `kiosk/`      | Angular kiosk        | `:5276`     | 7     |
| `storefront/` | Angular storefront   | `:5273`     | 12    |
| `platform/`   | React super-admin    | `:5177`     | 7     |

Total: **56 pages**. Open [`index.html`](./index.html) for the grouped list, or navigate the folders directly.

## How to use

1. Open `index.html` in a browser. Top-right has a theme dropdown.
2. Pick any of the 10 presets — every page repaints immediately.
3. The selection persists across pages via `localStorage`.

## Adding a new theme

1. Drop the CSS file in `_assets/themes/` named `theme.<id>.css`. Follow the same `:root[data-theme="<id>"]` pattern as the existing files.
2. Add `<id>` to the `THEMES` array in `_assets/theme-switch.js`.
3. (Optional but recommended) Drop the same file into `packages/ui/src/themes/` so the real apps can use it too. Then update the `ALLOWED_THEMES` whitelist in each app's `AppThemeService` and the GraphQL preset enum.

## Token reference

The preview's structural CSS (`_assets/preview.css`) references these custom properties — make sure your theme defines all of them:

```
--color-bg            page background
--color-bg-alt        secondary background (sidebars, footers)
--color-surface       cards, raised panels
--color-border        subtle dividers
--color-text          primary text
--color-text-secondary  labels
--color-text-muted    captions, small print
--color-primary       brand color (buttons, links)
--color-primary-hover hover state of buttons
--color-accent        secondary brand color
--color-success / --color-warning / --color-error / --color-info
--color-sidebar-bg / --color-sidebar-text  admin sidebar
--brand-masthead-url  optional bg-image for storefront masthead
--font-display        h1/h2 family
--font-body           body family
```

The existing 10 themes (`apothecary`, `casual`, `citrus`, `dark`, `earthy`, `midnight`, `minimal`, `modern`, `neon`, `regal`) all populate the full set.

## How this was generated

The HTML files are hand-authored. Each one is self-contained — no JS templating, no shared shell fragments. Designers can edit the markup of any page directly. The shared structural CSS in `_assets/preview.css` defines layout primitives (cards, tables, buttons, pills, the admin shell, the kiosk shell, the storefront shell) so adding a new page is mostly copy-paste-tweak.

The route inventory comes from the four Angular apps' `app.routes.ts` files plus the React platform app's `main.tsx`. If you add a new route to one of those, drop a matching HTML here so designers have something to design against.

## Caveats

- Synthetic data only. No real customer names, prices, or order numbers.
- Interactive bits don't actually work — buttons don't submit, dropdowns don't filter. That's fine for theme design.
- Tailwind v4 utilities used in the real apps aren't replicated here — the preview uses its own `.tp-*` utility classes mapped to theme tokens. If a token displays differently in the real app, that's the real app's local CSS taking over; check the theme file is being applied.
