# CLAUDE.md

Project-level context for AI coding agents working in this repo.
Human developers should also read this — it's the fastest onboarding we have.

Last updated: April 2026

---

## What this is

CannaSaas is a multi-tenant SaaS platform for licensed cannabis dispensary operators, targeting the NY/NJ/CT tri-state market. The hierarchy is `organizations → companies → dispensaries`, with RBAC and Metrc compliance built in from the ground up.

Founders: Dennis Luken, Philip John Basile (Chief AI Officer), Daryl Schmoldt (CTO).
GitHub: `thewebsitewiz/cannasaas`.

---

## Stack

Monorepo managed with pnpm workspaces + turborepo.

- **API** — NestJS, GraphQL (code-first via `@nestjs/graphql`), TypeORM, PostgreSQL, Redis + BullMQ for background jobs, port `3000`.
- **Storefront** — Next.js 15 (App Router, Turbopack dev), React 19, port `5173`. Customer-facing shop.
- **Admin** — React + Vite, port `5174`. Dispensary back-office management.
- **Staff** — React + Vite, port `5175`. POS / floor operations.
- **Kiosk** — React + Vite, port `5176`. Self-service touch terminal.
- **Platform** — React + Vite, port `5177`. Super-admin cross-tenant management.
- **Packages** — `@cannasaas/ui`, `@cannasaas/types`, `@cannasaas/stores` shared across apps.

Tailwind v4 with `@theme` blocks in admin. Tailwind v3 with classic config in storefront. Both consume CSS variables via `var()` so theme swaps require zero recompile.

---

## Running locally

Docker Desktop **must be running** before starting the API — Postgres and Redis come from containers.

```bash
cs              # cd to project root + nvm use
dockup          # docker compose up -d postgres (also starts redis)
pde             # haltall + pnpm dev (runs all 6 apps in parallel)
```

Stop everything: `haltall` (kills 3000, 5173, 5174, 5175, 5176, 5177).

Test DB: PostgreSQL at `postgres/postgres@localhost:5432`, database `cannasaas`. Test dispensary ID is `c0000000-0000-0000-0000-000000000001`. Admin user is `admin@cannasaas.com` (no `dispensaryId` — super admin); dispensary-scoped admin is `admin@greenleaf.com`.

---

## Critical path (as of April 2026)

In priority order. Don't work on nice-to-haves if these aren't done.

1. **Stripe payment integration** — backend ~90% complete. Needs live keys and the production webhook endpoint wired in the Stripe dashboard.
2. **Inventory management** — real-time stock tracking, low-stock alerts, stock-level events surfaced to admin.

**Important, next tier:**

- Admin/staff/kiosk portals fully wired to API (some pages still mocked)
- Delivery/fulfillment module
- Loyalty/rewards
- Customer accounts (order history, saved addresses)
- Notification system

**Already shipped — don't re-implement:**

- Full order lifecycle with Metrc sale receipt sync
- BullMQ retry queue with exponential backoff
- Stock validation with `FOR UPDATE` row locks
- Walk-in POS customer flow (placeholder emails `walkin-######@pos.{domain}`)
- Order lifecycle email notifications (skipping `in_store` orders)
- Menu Categories admin page with per-dispensary product type enable/disable and drag-to-reorder
- Staff POS `NewOrderPage`, super admin `TaxManagementPage`, staff `OrderQueuePage`, `TimesheetsPage` with `myTimeEntries` backend query
- 15 product types including PETS (14) and APPAREL (15)
- Age verification (21+ gate) on storefront
- Storefront checkout fully wired to API

---

## Architectural patterns we've settled on

- **File patching** — prefer Python-based patching over `sed -i ''`. macOS `sed` is unreliable for multi-line patches. For anything non-trivial use a short Python script.
- **Complete replacement files** over partial patches when Claude is generating code. Discovery scripts that dump file contents to stdout work well for codebase context gathering.
- **Conventional commits** — enforced by commitlint/husky. Use `--no-verify` on commits when lint hooks are blocking forward progress (we do this regularly; it's not a workaround of last resort).
- **TypeORM migrations** — `apps/api/src/migrations/`. API uses `ts-node --swc`.

---

## Theme system

Single source of truth: `packages/ui/src/themes/theme.*.css`. 10 themes: `apothecary`, `casual`, `citrus`, `dark`, `earthy`, `midnight`, `minimal`, `modern`, `neon`, `regal`.

**Delivery by app:**

- **Admin + Staff** — bundle all 10 via static imports in `main.tsx` from `@cannasaas/ui/src/themes/`. Bundler resolves through the workspace package.
- **Storefront** — link-injection at runtime.
  - `public/all-themes.css` loaded statically by `layout.tsx` (the design-system baseline — ~5200 lines, §1–§35, portal activation via `[data-portal]`).
  - `public/themes/theme.*.css` dynamically injected by `ThemeProvider.tsx` based on the `theme_configs` GraphQL query. Selector specificity: `:root[data-theme="dark"]`.

**The `theme_configs` table** holds per-dispensary template selection. `theme.resolver.ts` + `theme.service.ts` expose read/write via GraphQL. `ThemePage.tsx` + `ThemeSelector.tsx` in admin give the picker UI.

**There is no brand customization layer.** No custom colors/fonts per tenant. Every dispensary on the "dark" template gets the same green and font. Adding this is a nice-to-have, not critical path (see Tech debt below for the shape of the future migration).

---

## Known tech debt — flagged, not blocking

### Two parallel theme mechanisms still coexist

The "unification sprint" cleaned up file duplication but didn't actually merge the two conceptual systems:

1. **theme-presets** — toggled via `data-theme` attribute, overrides `all-themes.css` (10 themes)
2. **design-systems** — whitelisted CSS link injection replacing the baseline entirely (currently `casual.css` + `spring-bloom.css`)

`ThemeProvider.tsx` and `ThemeLoader.tsx` both maintain duplicated `ALLOWED_FILES` whitelists. Adding a new design system means editing both, or behavior silently diverges. Unify into one model post-Stripe/inventory.

### Orphaned files

- `apps/storefront/src/spring-bloom.css` — wrong location to be served (Next.js only serves from `public/`). Either move to `public/styles/` and wire it, or delete.

### Misc

- `packages/ui/src/themes/inject.ts` has a `setThemePreset()` that's duplicated inline in `ThemeProvider.tsx`. Storefront should use the shared utility or we should delete it.
- `packages/ui/src/theme-vars.css` appears orphaned (only self-referenced in its own header comment). Verify and remove.
- API startup retries DB/Redis 9 times with stack traces before failing. Add a preflight TCP probe so failure is fast and clean.

---

## Gotchas that cost time to rediscover

**Next.js storefront `_next/static/chunks/*.js` 404s are always a stale build cache** — not missing files, not a bad import, not a theme problem. Fix: `rm -rf apps/storefront/.next apps/storefront/node_modules/.cache` then restart. The `nuclearClean` alias does exactly this. Don't chase CSS imports when `_next` chunks are 404ing; clear the cache first.

**The Next.js RSC webpack crash** (`Cannot read properties of undefined (reading 'call')`) is pre-existing. Worked around with `transpilePackages` and the Turbopack dev flag. Don't spend time rediscovering this.

**The API starts BullMQ before verifying DB connectivity**, so you'll see 20+ Redis connection errors before TypeORM even begins. Start Docker first (`docker info` should succeed) before running `pde`.

**`docs/package.json` and `docs/package-lock.json` keep reappearing** and trigger Next.js "multiple lockfiles detected" warnings. They shouldn't exist. Delete on sight.

**Dennis's `.zshrc` was rebuilt April 2026** after accumulating 450+ duplicated pyenv lines from a self-appending `echo >> ~/.zshrc` bug. New version uses `typeset -U path` for auto-dedup, pyenv init in `.zprofile` (not `.zshrc`), official nvm auto-switch hook. Project aliases live in `~/.oh-my-zsh/custom/b.cannasaas.zsh` and survive zshrc rebuilds.

---

## Aliases worth knowing

Defined in `~/.oh-my-zsh/custom/a.shell-command.zsh` and `b.cannasaas.zsh`:

**Navigation**

- `cs` — cd to project root + `nvm use`
- `csapi`, `csadm`, `csstf`, `csstr`, `csksk` — cd into each app

**Dev loop**

- `pde` — full-stack dev (`cs; haltall; pnpm dev`)
- `pds` — sites only, no api (`cs; haltall; pnpm dev:sites`)
- `pda` — clear + `restartapi`
- `runall`, `runapi`, `runstr`, `runadm`, `runstf`, `runksk` — per-app dev (storefront variant includes `nuclearClean`)

**Stopping things**

- `haltall` — kill all app ports (3000, 5173–5177)
- `stopapi`, `stopstr`, `stopadm`, `stopstf`, `stopksk` — per-port
- `ports` — `lsof -i -P -n | grep LISTEN`
- `checkall` — what's on 5173–5176

**Docker**

- `dockup` — postgres + redis up
- `dockshutdown` — remove the containers
- `dockerremove` — full reset including postgres volume (destroys data)
- `dockerlogs` — follow postgres logs

**Build/clean**

- `nuclearClean` — `rm -rf apps/storefront/.next apps/storefront/node_modules/.cache`
- `removeDist`, `rebuildDist`, `removeNext`

**Git shortcuts** — oh-my-zsh git plugin provides `gs`, `ga`, `gc`, `gp`, `gst`, `gd`, etc. Use `--no-verify` flag when husky/lint hooks are blocking.

---

## Coding conventions

- TypeScript strict throughout. No `any` unless genuinely unavoidable.
- NestJS modules: one feature per module under `apps/api/src/modules/{feature}/`. DTOs in `dto/`, entities at module root.
- GraphQL code-first — resolvers define schema, no separate `.gql` files.
- React components functional, hooks-based. `useState`/`useReducer` for local state, no Redux.
- Tailwind classes reference CSS variables (`bg-bg`, `text-txt`, `border-bdr`) so theme swaps don't require recompile.
- File naming: PascalCase for components (`NewOrderPage.tsx`), camelCase for utilities (`formatCurrency.ts`), kebab-case for CSS (`theme.dark.css`).

---

## When in doubt

1. **Check if a discovery script would help.** Dumping relevant files to stdout for context is usually faster than guessing. Examples live in `scripts/`.
2. **Don't re-solve problems in the "Gotchas" section.** Clear `.next`, start Docker, delete `docs/package*.json`.
3. **Critical path > architectural cleanup.** If Stripe or inventory isn't done, tech debt work should be declined with a "let's do this after launch" note.
4. **Prefer complete replacement files over partial patches** when generating more than a few lines of change. Makes review easier and avoids sed-on-macOS headaches.
5. **Dennis prefers shell scripts for multi-step operations** rather than long copy-paste command sequences — easier to rerun, easier to roll back.

---

## Environment

- macOS (Apple Silicon), zsh + Oh My Zsh, Homebrew tooling
- Node via nvm (repo `.nvmrc` is v20.20.1)
- Python via pyenv
- Postgres.app at `/Applications/Postgres.app/Contents/Versions/latest/bin` (not used — Docker owns the DB)
- pgAdmin 4 at `/Applications/pgAdmin 4.app/Contents/SharedSupport`
