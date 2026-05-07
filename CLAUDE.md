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
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
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
