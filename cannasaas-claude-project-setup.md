# CannaSaas — Claude Project Setup (tightened)

**Name:** CannaSaas Platform
**Description:** Multi-tenant SaaS for licensed cannabis dispensaries (NY/NJ/CT). pnpm monorepo — NestJS/GraphQL API, Next.js 15 storefront, Vite admin + staff POS.

---

## Custom instructions (paste into Project → Instructions)

```
CannaSaas — multi-tenant SaaS for licensed cannabis dispensaries (NY/NJ/CT). Founder: Dennis Luken. Co-founders: Philip John Basile (CAIO), Daryl Schmoldt (CTO).

## Stack
- pnpm + Turborepo monorepo
- API: NestJS/GraphQL :3000 | Storefront: Next.js 15 :5173 | Admin: Vite/React :5174 | Staff POS: :5175
- PostgreSQL `cannasaas` @ localhost:5432 (postgres/postgres)
- TypeORM, `synchronize: false` — migrations only
- JWT, multi-tenant by `dispensaryId`
- BullMQ for Metrc retry queue
- Stripe Elements ~90%, unshipped

## Themes
Source of truth: `packages/ui/src/themes/theme.*.css` (apothecary, casual, citrus, dark, earthy, midnight, minimal, modern, neon, regal). Admin/staff static-import from `@cannasaas/ui/src/themes/`. Storefront link-injects via `ThemeProvider.tsx` + `theme_configs` GraphQL query.

Tech debt: two parallel theme systems (theme-presets via `data-theme`, design-systems via whitelisted link injection). Orphaned `apps/storefront/src/spring-bloom.css`. **Do not refactor until Stripe + inventory ship.**

## Critical path
🔴 Unshipped: Stripe/cash payments, real-time inventory + low-stock alerts
🟡 Wire admin/staff/kiosk to API, delivery, loyalty, customer accounts, notifications
🟢 More themes, analytics, PWA, POS hardware
✅ Orders, Metrc sync, checkout, 21+ gate, unified CSS templates

Bias toward 🔴. Don't propose 🟡/🟢 unasked.

## Test data
- Dispensary: `c0000000-0000-0000-0000-000000000001`
- `admin@greenleaf.com` — dispensary admin
- `admin@cannasaas.com` — super admin (no `dispensaryId`)

## Aliases
`cs` (cd + nvm), `restartapi`, `runstr`, `pda` (dev all), `nuclearClean` (`rm -rf apps/storefront/.next apps/storefront/node_modules/.cache`)

## Workflow rules
1. Assume local clone is stale between sessions. Start patches with `git checkout -- . && git pull origin main`.
2. Full replacement files > runnable scripts > diffs > inline instructions.
3. No `sed -i ''` for multi-line edits on macOS — use Python.
4. Conventional commits (commitlint/husky). Call out any `--no-verify`.
5. Schema changes → TypeORM migrations, never `synchronize`.

## Debug shortcuts
- `/_next/static/chunks/*.js` 404s = stale Next cache. Run `nuclearClean`, restart. Don't chase CSS imports.
- Missing inventory rows → `0` / `out_of_stock`, never `null`.
- `createOrder` uses `FOR UPDATE` row locks — preserve them.

## Style
- 25+ year senior architect — skip beginner framing.
- Audio/visual learner — code, diagrams, commands over prose.
- State the fix, show the code, move on.
```

---

## Files worth attaching

1. Root `package.json` + each app's `package.json`
2. `schema.gql`
3. Repo tree: `tree -L 3 -I 'node_modules|.next|dist|coverage' > repo-tree.txt`
4. TypeORM entity files
5. `ThemeProvider.tsx` + `ThemeLoader.tsx`
6. Alias file from `~/.oh-my-zsh/custom/`

Skip `node_modules`, lockfiles, old migrations, seed CSVs.
