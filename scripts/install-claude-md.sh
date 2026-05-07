#!/usr/bin/env bash
# install-claude-md.sh
# Writes 7 CLAUDE.md files for the CannaSaaS Angular 21 monorepo.
#
# Usage:
#   ./install-claude-md.sh                    # uses ~/Documents/Projects/cannasaas
#   ./install-claude-md.sh /path/to/repo      # explicit repo path
#   ./install-claude-md.sh --dry-run          # show what would happen, write nothing
#
# Existing CLAUDE.md files are backed up to .claude-md-backup-<timestamp>/ at repo root.

set -euo pipefail

DRY_RUN=0
REPO=""

for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,11p' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *) REPO="$arg" ;;
  esac
done

if [ -z "$REPO" ]; then
  REPO="$HOME/Documents/Projects/cannasaas"
fi

# Resolve to absolute path
REPO="$(cd "$REPO" 2>/dev/null && pwd)" || { echo "ERROR: repo path not found: $REPO" >&2; exit 1; }

# Sanity check — refuse to write into something that doesn't look like a repo root
if [ ! -f "$REPO/package.json" ] && [ ! -d "$REPO/.git" ]; then
  echo "ERROR: $REPO does not look like a repo root (no package.json or .git/)." >&2
  echo "Pass an explicit path if you really mean it: $0 /actual/path" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$REPO/.claude-md-backup-$TIMESTAMP"

FILES=(
  "CLAUDE.md"
  "apps/storefront/CLAUDE.md"
  "apps/admin/CLAUDE.md"
  "apps/staff/CLAUDE.md"
  "apps/kiosk/CLAUDE.md"
  "apps/platform/CLAUDE.md"
  "packages/ui/CLAUDE.md"
)

echo "Repo:    $REPO"
echo "Backup:  $BACKUP_DIR (only if existing files are found)"
[ "$DRY_RUN" -eq 1 ] && echo "Mode:    DRY RUN (no changes will be made)"
echo ""

# Back up existing files
backed_up=0
for f in "${FILES[@]}"; do
  if [ -f "$REPO/$f" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "  would back up:  $f"
    else
      mkdir -p "$BACKUP_DIR/$(dirname "$f")"
      cp "$REPO/$f" "$BACKUP_DIR/$f"
      echo "  backed up:      $f"
    fi
    backed_up=$((backed_up + 1))
  fi
done
[ "$backed_up" -eq 0 ] && echo "  (no existing CLAUDE.md files to back up)"
echo ""

if [ "$DRY_RUN" -eq 1 ]; then
  for f in "${FILES[@]}"; do
    echo "  would write:    $f"
  done
  echo ""
  echo "Dry run complete. Re-run without --dry-run to apply."
  exit 0
fi

# Create directories
for f in "${FILES[@]}"; do
  mkdir -p "$REPO/$(dirname "$f")"
done

echo "  writing:        CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/CLAUDE.md"
# CLAUDE.md — CannaSaaS

Project-level context for AI coding agents and human developers.
Last updated: May 2026.

---

## What this is

CannaSaaS is a multi-tenant SaaS platform for licensed cannabis dispensary operators, targeting the NY/NJ/CT tri-state market. Hierarchy: `organizations → companies → dispensaries`, with RBAC and Metrc compliance built in.

Founders: Dennis Luken (Senior Architect), Philip John Basile (Chief AI Officer), Daryl Schmoldt (CTO).
GitHub: `thewebsitewiz/cannasaas`.

---

## Stack (target state — Angular rewrite in progress)

Monorepo: pnpm workspaces + Turborepo.

- **`apps/api`** — NestJS, GraphQL (code-first), TypeORM, PostgreSQL, Redis + BullMQ. Port `:3000`. **Unchanged.**
- **`apps/storefront`** — Angular 21, customer-facing dispensary site. Port `:5173`.
- **`apps/admin`** — Angular 21, dispensary back-office. Port `:5174`.
- **`apps/staff`** — Angular 21, in-store POS. Port `:5175`.
- **`apps/kiosk`** — Angular 21, self-service touch terminal. Port `:5176`.
- **`apps/platform`** — Angular 21, super-admin cross-tenant management. Port `:5177`.
- **`packages/ui`** — design tokens + theme CSS at `packages/ui/src/themes/theme.*.css`.
- **`packages/types`** — shared TypeScript types.
- **`packages/stores`** — shared signal stores / utilities.

**Migration status:** in progress. The React/Next.js apps remain authoritative until the corresponding Angular app reaches feature parity. **Do not delete React code without explicit instruction.** Every per-app CLAUDE.md inherits from this file plus its own.

---

## Critical path (May 2026)

In priority order. Don't work on nice-to-haves while these are open.

1. **Cannabis-friendly payment processor integration** — replaces Stripe (Stripe ToS prohibits cannabis). Backend abstraction in progress.
2. **Real-time inventory management** — stock tracking, low-stock alerts, stock-level events surfaced to admin.

**Already shipped — don't re-implement:**

- Order lifecycle with Metrc sale receipt sync
- BullMQ retry queue with exponential backoff
- Stock validation with `FOR UPDATE` row locks
- Walk-in POS customer flow (placeholder emails `walkin-######@pos.{domain}`)
- Order lifecycle email notifications (skipping `in_store` orders)
- Menu Categories admin page with per-dispensary product type enable/disable + drag-to-reorder
- Staff POS `NewOrderPage`, super-admin `TaxManagementPage`, staff `OrderQueuePage`, `TimesheetsPage`
- 15 product types
- Age verification (21+) on storefront
- Storefront checkout wired to API

---

## Multi-tenant model (every Angular app must enforce this)

- All data is scoped to a `dispensary` (UUID).
- Test dispensary ID: `c0000000-0000-0000-0000-000000000001`.
- Super-admin users (no `dispensaryId` claim) can operate cross-tenant — only `apps/platform` should expose this surface.
- Storefront resolves dispensary by **subdomain or path** (per existing convention).
- Admin/staff/kiosk resolve dispensary from the authenticated user's claims.
- Platform resolves dispensary from an explicit selector in the UI (impersonation).
- **Every GraphQL operation must be dispensary-scoped** unless it's a platform-level query and the resolver explicitly allows cross-tenant.

---

## Angular 21 — Hard Rules (apply to all 5 frontend apps)

**Standalone, signals, OnPush, modern syntax. No exceptions.**

- **Standalone components only.** No `NgModule`s anywhere.
- **Signals first** for state: `signal()`, `computed()`, `effect()`, `linkedSignal()`, `resource()`, `rxResource()`.
- **New control flow only:** `@if`, `@for`, `@switch`, `@defer`, `@let`. Never `*ngIf`, `*ngFor`, `*ngSwitch`.
- **`inject()` for DI.** No constructor parameter injection.
- **Signal I/O:** `input()`, `input.required()`, `output()`, `model()`. Never `@Input()` / `@Output()` decorators.
- **`ChangeDetectionStrategy.OnPush`** on every component. No exceptions.
- **TypeScript strict.** No `any`, no `as any`, no `// @ts-ignore`.
- **Functional guards/resolvers/interceptors:** `CanActivateFn`, `ResolveFn`, `HttpInterceptorFn`. No class-based variants.
- **`provideRouter`, `provideHttpClient(withFetch())`** in `app.config.ts`. No `RouterModule.forRoot`, no `HttpClientModule`.
- **Zone.js stays** for now. Do not switch to zoneless without an explicit decision — that's a separate migration.

### Required component shape

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductService } from './product.service';

@Component({
  selector: 'cs-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <p>Loading…</p>
    } @else {
      @for (product of products(); track product.id) {
        <article>{{ product.name }}</article>
      } @empty {
        <p>No products.</p>
      }
    }
  `,
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  readonly products = this.productService.products;
  readonly loading = this.productService.loading;
  readonly count = computed(() => this.products().length);
}
```

### State management

Default: signals in injectable services. No `BehaviorSubject` for app state.

For async data, prefer `resource()` / `rxResource()` over hand-rolled loading-state signals:

```ts
readonly products = resource({
  request: () => ({ dispensaryId: this.dispensaryId() }),
  loader: ({ request }) => this.api.fetchProducts(request.dispensaryId),
});
// products.value(), products.isLoading(), products.error()
```

For complex cross-feature state with derived selectors and async lifecycle: **NgRx SignalStore** (`@ngrx/signals`). Not classic NgRx. Not Akita. Not NGXS.

### RxJS rules

- Bridge to signals at the boundary: `toSignal(this.http.get(...))`. Components consume signals only.
- Use RxJS only for genuine async streams: HTTP, websockets, debounced inputs, intervals.
- `takeUntilDestroyed()` on any manual subscription. Otherwise prefer `toSignal` / `AsyncPipe` / `resource()`.
- Never `.subscribe()` inside a template-bound getter or signal computation.

### Forms

- **Reactive Forms** as default. No template-driven forms.
- Strictly typed: `FormControl<string>`, `FormGroup<{ name: FormControl<string> }>`. No untyped controls.
- Bridge form values to signals when needed: `toSignal(form.valueChanges, { initialValue: form.getRawValue() })`.
- **Signal Forms** (Angular 21 experimental) — do **not** use in production code. Prototypes only, isolated to feature branches, tagged `// EXPERIMENTAL: Signal Forms`.

### Routing

- Top-level routes in `app.routes.ts`. Feature routes co-located: `features/foo/foo.routes.ts`.
- Lazy-load every feature:
  ```ts
  { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCTS_ROUTES) }
  ```
- Functional guards only.

---

## GraphQL / API integration

- Client: **Apollo Angular** — `apollo-angular@^13` + `@apollo/client@^4` + `graphql@^16`. Peer deps support Angular 19/20/21 (verified May 2026).
- Endpoint: `http://localhost:3000/graphql` (dev). Read from `environment.ts` per env.
- **All types generated by GraphQL Code Generator.** Hand-written response types are forbidden — they drift from the schema. Run `pnpm graphql:codegen` after schema changes.
- Queries/mutations co-located with the feature: `feature/foo.graphql`.
- Wrap Apollo's `valueChanges` Observable with `toSignal()` at the service boundary so components consume signals.
- Every operation is dispensary-scoped via header or variable. No exceptions outside `apps/platform`.

---

## Styling — Tailwind v4 + CSS custom properties

**Tailwind v4 everywhere.** No Sass, no Less, no CSS-in-JS, no other utility frameworks.

### Per-app setup

```bash
# in each app directory
ng add tailwindcss
```

This installs `@tailwindcss/postcss` + creates `.postcssrc.json`. Each app's `src/styles.css` starts with:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/all-themes.css';

/* Scope class detection to this app + its workspace deps. */
@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';
```

**Why `@source` is non-negotiable in this monorepo.** Tailwind v4's PostCSS plugin scans from workspace root by default. Without `@source`, every app ships classes from packages it doesn't use, bloating production CSS by 10×+.

### Tokens come from `@cannasaas/ui`

CSS custom properties drive theming. Components reference tokens via Tailwind utilities mapped to vars (`bg-bg`, `text-fg`, `border-bdr`) or directly in component CSS via `var(--cs-color-primary)`.

**Never hardcode color, font, or spacing values in components.** Always reference a CSS custom property defined in `@cannasaas/ui` themes.

### Theme files

`packages/ui/src/themes/theme.*.css` — 10 themes: `apothecary`, `casual`, `citrus`, `dark`, `earthy`, `midnight`, `minimal`, `modern`, `neon`, `regal`.

Theme delivery differs by app — see each app's CLAUDE.md.

### Component styles

- Component-scoped CSS (Angular's default `:host` behavior). No global styles outside `src/styles.css`.
- Reach for component CSS only when Tailwind utilities can't express it cleanly (complex pseudo-element effects, keyframes, container queries with custom logic).
- Animations: prefer CSS over Angular Animations API.

---

## Testing

- **Vitest** is the test runner (Angular 21 default; Karma is being retired).
- Use the standard Angular Vitest builder configured by `ng new` / `ng add`.
- Standalone-component test pattern:
  ```ts
  TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [{ provide: SomeService, useValue: mock }],
  });
  ```
  No `declarations:`. No `NO_ERRORS_SCHEMA` unless justified.
- Mock services with object literals + `provide:` overrides. Spies only when verifying call arguments.
- E2E: not specified. Ask before adding Cypress/Playwright.

---

## Payments — Cannabis-friendly processor only

**Stripe is forbidden anywhere in this codebase.** Stripe ToS prohibits cannabis transactions. This is a legal/business hard rule, not a preference.

- Payment integration uses a cannabis-friendly processor (currently being selected/integrated in `apps/api`).
- Frontend never holds processor SDK keys directly. The API mediates all payment intents and webhooks.
- Cart/checkout flows in `apps/storefront` and `apps/staff` call dispensary-scoped GraphQL mutations only — no direct processor SDK imports.
- If you encounter `stripe`, `@stripe/*`, or `Stripe`-named code in a PR, reject it.

---

## React → Angular migration discipline

Do **not** carry React idioms into the Angular code.

- Don't simulate hooks. Use signals + DI services.
- Don't reach for HOCs or render props. Use directives, content projection (`<ng-content>`), or component composition.
- Don't recreate React Context. Use Angular DI — `providedIn: 'root'` for global, route-level providers for feature scope.
- Don't port TanStack Query. Apollo cache + `resource()` covers it.
- Don't port React Hook Form. Reactive Forms (typed).
- Don't keep `useState` patterns. State lives in signals on services or component class fields.
- A 1:1 file-for-file port is rarely the right move. Re-derive the component tree where the React structure was carrying React-specific weight.
- When porting a screen, **confirm the GraphQL operations it uses still match the API schema** before writing the Angular version. Schema may have moved.

---

## Forbidden patterns

If you catch yourself writing any of these, stop and rewrite:

- `NgModule`, `BrowserModule`, `CommonModule`, `FormsModule` (imports)
- `*ngIf`, `*ngFor`, `*ngSwitch`, structural-directive shorthand
- `[ngClass]`, `[ngStyle]` (use `[class.x]`, `[style.x.px]` bindings)
- `@Input()` / `@Output()` decorators
- Constructor parameter injection
- `ChangeDetectionStrategy.Default`
- `BehaviorSubject` / `Subject` for state that components read
- `any`, `as any`, `// @ts-ignore`, `// @ts-expect-error` without a tracked issue
- `.subscribe()` without `takeUntilDestroyed()` or equivalent teardown
- Class-based `CanActivate` / `Resolve` / `HttpInterceptor`
- `RouterModule.forRoot` / `RouterModule.forChild`
- `HttpClientModule`
- Hand-written GraphQL response types
- Karma / Jasmine config in new code
- Sass, Less, CSS-in-JS, UnoCSS, or any utility framework other than Tailwind v4
- Hardcoded colors, fonts, or spacing (use `@cannasaas/ui` tokens)
- Signal Forms in production code (experimental in v21)
- Selectorless components (roadmap for v22, not in v21)
- React patterns ported wholesale (see migration section)
- **Stripe imports, references, or integration code anywhere**

---

## Monorepo conventions

- **Package manager:** pnpm. Never npm or yarn.
- **Workspace deps:** `"@cannasaas/ui": "workspace:*"`.
- **Commits:** Conventional Commits, scoped: `feat(storefront): ...`, `fix(admin): ...`, `feat(staff): ...`, `feat(kiosk): ...`, `feat(platform): ...`.
- **`git commit --no-verify` is allowed.** Hooks are advisory.
- **TypeORM migrations** only in `apps/api/src/migrations/`. Never `synchronize: true` in production. Frontend never touches the DB directly — always through GraphQL.
- **TypeScript strict** across all packages and apps.

---

## Code delivery (Dennis's working preferences)

- **Full file replacements over diffs.** Write the whole file every time.
- **No beginner framing.** Skip "first, let's understand…" preambles.
- **Commands and concrete code over prose.** Show, don't narrate.
- **Python file-patching scripts over `sed`** when batch-editing files on macOS.
- **Direct, code-first responses.** Don't pad with explanation unless asked.
- **Shell scripts for multi-step operations** rather than long copy-paste command sequences.
- **Fact-check anything time-sensitive** — Angular API surface, package versions, doc URLs. Don't guess; verify or say so.

---

## Dev commands

```bash
# from repo root
pnpm dev                              # all apps
pnpm dev:sites                        # all sites, no api
pnpm --filter <app> dev               # single app
pnpm --filter <app> build             # production build
pnpm --filter <app> test              # Vitest
pnpm --filter <app> lint              # lint
pnpm graphql:codegen                  # regen types after schema change

# in any app directory
ng generate component features/foo --change-detection=OnPush --inline-template=false
ng generate service features/foo
ng generate guard features/foo --functional
```

---

## Aliases (in `~/.oh-my-zsh/custom/`)

**Navigation**
- `cs` — repo root + `nvm use`
- `csapi`, `csadm`, `csstf`, `csstr`, `csksk` — cd into each app

**Dev loop**
- `pde` — full-stack (`cs; haltall; pnpm dev`)
- `pds` — sites only (`cs; haltall; pnpm dev:sites`)
- `pda` — clear + `restartapi`
- `runall`, `runapi`, `runstr`, `runadm`, `runstf`, `runksk` — per-app dev

**Stopping**
- `haltall` — kill all app ports (3000, 5173–5177)
- `stopapi`, `stopstr`, `stopadm`, `stopstf`, `stopksk` — per-port
- `ports` — `lsof -i -P -n | grep LISTEN`
- `checkall` — what's on 5173–5176

**Docker**
- `dockup` — postgres + redis up
- `dockshutdown` — remove containers
- `dockerremove` — full reset including postgres volume (destroys data)
- `dockerlogs` — follow postgres logs

**Build/clean**
- `removeDist`, `rebuildDist`
- `nuclearClean` — clear React/Next.js storefront cache (still useful while React storefront exists)

---

## Gotchas that cost time to rediscover

- **API starts BullMQ before verifying DB connectivity** — you'll see 20+ Redis connection errors before TypeORM even begins. `docker info` should succeed before `pde`.
- **`docs/package.json` and `docs/package-lock.json` keep reappearing** and trigger Next.js "multiple lockfiles" warnings. They shouldn't exist. Delete on sight.
- **Tailwind v4 in monorepos:** missing `@source` directives produce silently bloated builds. Check each app's `styles.css`.
- **Apollo cache after schema changes:** if queries return stale shape, run `pnpm graphql:codegen` and clear Apollo's in-memory cache (`client.resetStore()`).

---

## Known tech debt — flagged, not blocking

- **Two parallel theme mechanisms** (theme-presets + design-systems) coexist in the React storefront. The Angular storefront should adopt **one model only** — see `apps/storefront/CLAUDE.md`.
- **`packages/ui/src/theme-vars.css`** appears orphaned. Verify and remove during the rewrite.
- **API startup retries** DB/Redis 9 times with stack traces. Add a preflight TCP probe.

---

## Environment

- macOS (Apple Silicon), zsh + Oh My Zsh, Homebrew tooling
- Node via nvm (repo `.nvmrc` is v20.20.1)
- Python via pyenv
- Docker Desktop required (Postgres + Redis)
- pgAdmin 4 at `/Applications/pgAdmin 4.app/Contents/SharedSupport`

---

## When in doubt

1. Check the per-app `CLAUDE.md` first — it overrides nothing here but adds app-specific rules.
2. Don't re-solve problems in the "Gotchas" section.
3. Critical path > architectural cleanup. If payment processor or inventory aren't done, decline tech-debt work with a "post-launch" note.
4. Prefer complete replacement files over partial patches when generating more than a few lines.
5. Verify time-sensitive facts (Angular API, package versions, docs) — don't guess.
CLAUDE_MD_EOF

echo "  writing:        apps/storefront/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/apps/storefront/CLAUDE.md"
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
:root { color-scheme: light dark; }
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
CLAUDE_MD_EOF

echo "  writing:        apps/admin/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/apps/admin/CLAUDE.md"
# CLAUDE.md — apps/admin

Back-office for dispensary owners, managers, and staff with admin permissions. Inherits all rules from the root `CLAUDE.md`.

**Port:** `:5174`
**Audience:** authenticated dispensary staff with admin role
**Auth:** required everywhere (login is the entry point)

---

## Tenant resolution

Admin resolves the dispensary from the **authenticated user's claims** (JWT). Users may belong to multiple dispensaries within an organization — show a dispensary picker on login if `user.dispensaries.length > 1`.

`CurrentDispensaryService` (signal-based) holds the active dispensary. All GraphQL operations read its value. Switching dispensaries is a deliberate UI action — never silent.

---

## Theme

**Single internal theme.** Admin does not adopt the per-tenant theme system. It uses one consistent theme (`dark` or `modern` — final pick lives in `app.config.ts`).

- No `theme_configs` queries from this app.
- No `data-theme` attribute toggling.
- Components reference `@cannasaas/ui` tokens only — same tokens as the rest, but the chosen theme is fixed.

---

## RBAC

Every admin route is guarded by both `authGuard` and a role-based guard:

```ts
{ path: 'taxes', canMatch: [authGuard, hasRoleGuard('admin', 'super_admin')] }
```

Role checks are functional guards reading from `AuthService.roles()`. Don't reach for `*ngIf` equivalents in templates to hide UI based on roles — split into separate components or use route-level enforcement.

---

## Common patterns this app uses

### Drag-to-reorder

Menu Categories, product display order, etc. Use **`@angular/cdk/drag-drop`** (CDK is permitted in admin even though the rest of the app avoids Material). Persist order via a single mutation per drag end — debounce if users drag rapidly.

### Bulk operations

Tables in admin frequently support multi-select + bulk actions (publish, archive, price-adjust). Use a signal-based selection model:

```ts
readonly selected = signal<Set<string>>(new Set());
toggle(id: string) {
  this.selected.update(s => {
    const next = new Set(s);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}
```

### Heavy forms

Settings, dispensary configuration, tax rules. **Reactive Forms with strict typing.** Break long forms into stepper or sectioned forms — never one 50-field flat form. Use `effect()` to wire form state into derived signals (e.g., "form is dirty" indicators).

### Tables with server-side pagination/sort/filter

Default pattern: a feature service holds query params as signals, `rxResource()` fetches on changes:

```ts
readonly query = signal({ page: 0, sort: 'name', filter: '' });
readonly products = rxResource({
  request: () => this.query(),
  loader: ({ request }) => this.api.queryProducts(request),
});
```

---

## App-specific forbidden patterns

- Per-tenant dynamic theme injection (this is a storefront concern, not admin).
- Public/unauthenticated routes other than `/login` and `/forgot-password`.
- Payment processor SDK imports — admin views read transaction data through GraphQL, never integrates the processor directly.
- Storefront components imported directly (`@cannasaas/ui` is the bridge).

---

## Tailwind v4 setup specifics

`src/styles.css`:

```css
@import 'tailwindcss';
@import '@cannasaas/ui/themes/theme.dark.css'; /* fixed theme — adjust if final pick differs */

@source './**/*.{ts,html}';
@source '../../packages/ui/src/**/*.{ts,html,css}';
```

No `all-themes.css`, no `data-theme` switching — admin loads a single theme statically.

---

## Testing notes

- Mock `AuthService` and `CurrentDispensaryService` for every feature test.
- RBAC guards are critical-path; cover allow + deny for every protected route.
- Forms with cross-field validation: assert validators fire in both directions.
CLAUDE_MD_EOF

echo "  writing:        apps/staff/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/apps/staff/CLAUDE.md"
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
  body * { visibility: hidden; }
  .receipt, .receipt * { visibility: visible; }
}
```

---

## Testing notes

- Scanner service: test with synthesized rapid keystroke events.
- Idle detection: fake timers; verify lock screen appears at threshold.
- Register session guards: open vs closed states for every order-mutating route.
CLAUDE_MD_EOF

echo "  writing:        apps/kiosk/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/apps/kiosk/CLAUDE.md"
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
html { font-size: 18px; -webkit-touch-callout: none; user-select: none; }
*, *::before, *::after { -webkit-tap-highlight-color: transparent; }

/* Disable hover styles globally — there is no hover */
@media (hover: none) {
  * { transition-property: none !important; }
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
CLAUDE_MD_EOF

echo "  writing:        apps/platform/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/apps/platform/CLAUDE.md"
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
CLAUDE_MD_EOF

echo "  writing:        packages/ui/CLAUDE.md"
cat <<'CLAUDE_MD_EOF' > "$REPO/packages/ui/CLAUDE.md"
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
:root[data-theme="modern"] {
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
  template: `<button [class]="classes()" [disabled]="disabled()"><ng-content /></button>`,
  styleUrl: './button.css',
})
export class CsButtonComponent {
  /** Visual variant. */
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  /** Disable interaction. */
  readonly disabled = input(false);

  protected readonly classes = computed(() => `cs-btn cs-btn--${this.variant()}`);
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
- **`src/theme-vars.css`** appears orphaned (only self-referenced). Verify and remove.
- **Tailwind preset extraction** (mentioned above) is post-launch.
- **`src/themes/inject.ts`** has `setThemePreset()` duplicated inline in the React `ThemeProvider`. Angular rewrite should consolidate the helper here and have apps consume it.

---

## Testing notes

- Each component has a unit test verifying signal inputs render correctly.
- Visual regression tests (Storybook + Chromatic, or Ladle) — set up post-launch.
- Token files don't need tests, but `tokens/index.ts` (if it exports a typed token map) does.
CLAUDE_MD_EOF


echo ""
echo "Done. Wrote ${#FILES[@]} files."
echo ""
echo "Next steps:"
echo "  1. Review with: git -C \"$REPO\" diff -- $(printf '%s ' "${FILES[@]}")"
echo "  2. If anything looks off, restore from: $BACKUP_DIR"
echo "  3. Stage when satisfied: git -C \"$REPO\" add $(printf '%s ' "${FILES[@]}")"
